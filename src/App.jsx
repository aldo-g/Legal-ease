import { useState, useEffect, useMemo, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './utils/AuthContext'
import { CaseService } from './utils/CaseService'
import { AgentService } from './utils/AgentService'
import './App.css'
import CaseIntake from './components/CaseIntake'
import CaseDossier from './components/CaseDossier'
import CaseDashboard from './components/CaseDashboard'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import Signup from './components/Signup'
import LandingPage from './components/LandingPage'

// Derive a human-readable title from available case data
function deriveCaseTitle(row) {
  // Prefer an explicitly stored title
  if (row.case_data?.title) return row.case_data.title

  // Build from research type + complaint text
  const research = row.research || {}
  const type = research.type || ''
  const complaint = row.complaint_text || ''

  // Extract a company name heuristic: first capitalised word after "with", "against", "from", "by"
  const companyMatch = complaint.match(/\b(?:with|against|from|by|airline|carrier)\s+([A-Z][A-Za-z\s&]{1,30}?)(?:\s*[,.]|\s+(?:from|to|on|at|for)\b)/i)
  const company = companyMatch ? companyMatch[1].trim() : null

  // Extract a date heuristic
  const dateMatch = complaint.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})\b/i)
  const date = dateMatch ? dateMatch[1] : null

  const typeLabel = type
    ? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Consumer Dispute'

  if (company && date) return `${company} — ${date}`
  if (company) return `${company} claim`
  if (date) return `${typeLabel} — ${date}`
  return typeLabel
}

// Map Supabase row → app shape used by components
function normalizeCase(row) {
  return {
    ...row,
    // Keep the Supabase uuid as _id for internal use
    _id: row.id,
    // Components use `id` to display the case ref
    id: row.case_ref,
    title: deriveCaseTitle(row),
    caseStatus: mapStatusToApp(row.status),
    caseData: Object.keys(row.case_data || {}).length > 0 ? row.case_data : null,
    formData: Object.keys(row.form_data || {}).length > 0 ? row.form_data : null,
    research: Object.keys(row.research || {}).length > 0 ? row.research : null,
    complaintText: row.complaint_text || '',
    statusLogs: [],
    createdAt: row.created_at,
  }
}

function mapStatusToApp(dbStatus) {
  switch (dbStatus) {
    case 'complaint_submitted':
    case 'awaiting_response':
    case 'escalated':
      return 'SUBMITTED'
    case 'resolved':
    case 'closed':
      return 'CLOSED'
    default:
      return 'DRAFT'
  }
}


function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-wrapper" style={{ padding: '4rem', textAlign: 'center' }}>Initializing Secure System...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cases, setCases] = useState([])
  const [activeCaseRef, setActiveCaseRef] = useState(null)
  const [, setLoadingCases] = useState(false)

  // Derived state for the currently active case
  const activeCase = useMemo(() => {
    return cases.find(c => c.id === activeCaseRef) || null
  }, [cases, activeCaseRef])

  // Load cases from Supabase
  const loadCases = useCallback(async () => {
    if (!user) return
    setLoadingCases(true)
    try {
      const rows = await CaseService.fetchCases()
      const normalized = rows.map(normalizeCase)

      // Load status logs for each case
      for (const c of normalized) {
        try {
          const logs = await CaseService.fetchStatusLogs(c._id)
          c.statusLogs = logs.map(l => ({
            timestamp: l.created_at,
            message: l.message,
          }))
        } catch {
          c.statusLogs = []
        }
      }

      setCases(normalized)
    } catch (err) {
      console.error('Failed to load cases:', err)
    } finally {
      setLoadingCases(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadCases()
    } else {
      setCases([])
      setActiveCaseRef(null)
    }
  }, [user, loadCases])

  // Sync activeCaseRef from URL when on case routes
  useEffect(() => {
    const match = location.pathname.match(/^\/case\/(.+?)(?:\/manage)?$/);
    if (match && match[1] !== 'new') {
      const refFromUrl = decodeURIComponent(match[1]);
      if (refFromUrl !== activeCaseRef) {
        setActiveCaseRef(refFromUrl);
      }
    }
  }, [location.pathname, activeCaseRef]);

  // Redirect to dashboard after successful login/signup
  useEffect(() => {
    if (user && ['/login', '/signup'].includes(location.pathname)) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  if (authLoading) return <div className="app-wrapper" style={{ padding: '4rem', textAlign: 'center' }}>Initializing Secure System...</div>;

  const handleCreateNewCase = () => {
    setActiveCaseRef(null);
    navigate('/case/new');
  };

  const handleSaveIntakeProgress = async (updates) => {
    if (!activeCaseRef) {
      // First save — create the case in Supabase
      const caseRef = CaseService.generateCaseRef(user.id);
      try {
        const created = await CaseService.createCase({
          caseRef,
          complaintText: updates.complaintText || '',
          research: updates.research || {},
        });
        const normalized = normalizeCase(created);
        setCases(prev => [normalized, ...prev]);
        setActiveCaseRef(caseRef);
        // Navigate to the case's own URL
        navigate(`/case/${caseRef}`, { replace: true });
      } catch (err) {
        console.error('Failed to create case:', err);
      }
    } else {
      // Subsequent saves — update existing case in Supabase
      const existing = cases.find(c => c.id === activeCaseRef);
      if (!existing) return;
      try {
        const dbUpdates = {};
        if (updates.formData !== undefined) dbUpdates.formData = updates.formData;
        if (updates.research !== undefined) dbUpdates.research = updates.research;
        if (updates.complaintText !== undefined) dbUpdates.complaintText = updates.complaintText;

        const updated = await CaseService.updateCase(existing._id, dbUpdates);
        const normalized = normalizeCase(updated);
        // Preserve status logs from local state
        normalized.statusLogs = existing.statusLogs;
        setCases(prev => prev.map(c => c.id === activeCaseRef ? normalized : c));
      } catch (err) {
        console.error('Failed to update case:', err);
      }
    }
  };

  const handleSelectCase = (caseRef) => {
    setActiveCaseRef(caseRef);
    const selected = cases.find(c => c.id === caseRef);
    if (selected.caseStatus === 'SUBMITTED') {
      navigate(`/case/${caseRef}/manage`);
    } else if (selected.caseData) {
      navigate(`/case/${caseRef}`);
    } else {
      // Case exists but no dossier yet — go to intake view
      navigate(`/case/${caseRef}`);
    }
  };

  const handleDeleteCase = async (caseRef) => {
    if (confirm("Permanently delete this case dossier? This action cannot be undone.")) {
      const target = cases.find(c => c.id === caseRef);
      if (!target) return;
      try {
        await CaseService.deleteCase(target._id);
        setCases(prev => prev.filter(c => c.id !== caseRef));
        if (activeCaseRef === caseRef) {
          setActiveCaseRef(null);
        }
      } catch (err) {
        console.error('Failed to delete case:', err);
      }
    }
  };

  const handleCompleteIntake = async (plan, info, res) => {
    if (!activeCase) return;
    try {
      const updated = await CaseService.updateCase(activeCase._id, {
        caseData: plan,
        formData: info,
        research: res,
      });
      const normalized = normalizeCase(updated);
      normalized.statusLogs = activeCase.statusLogs;
      setCases(prev => prev.map(c => c.id === activeCaseRef ? normalized : c));
      navigate(`/case/${activeCaseRef}`);
    } catch (err) {
      console.error('Failed to complete intake:', err);
    }
  };

  const handleMarkAsFiled = async () => {
    if (!activeCase) return;
    try {
      const logMessage = `Case formally filed under ${activeCase.research.baseJustification}. Corresponding letters sent to relevant parties. Response deadline set for 14 days.`;

      // Set response deadline to 14 days from now
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 14);

      const updated = await CaseService.updateCase(activeCase._id, {
        status: 'complaint_submitted',
        caseData: {
          ...activeCase.caseData,
          responseDeadline: deadline.toISOString(),
          escalationHistory: [],
        },
      });

      await CaseService.addStatusLog(activeCase._id, logMessage);

      const normalized = normalizeCase(updated);
      normalized.statusLogs = [
        { timestamp: new Date().toISOString(), message: logMessage },
        ...activeCase.statusLogs,
      ];
      setCases(prev => prev.map(c => c.id === activeCaseRef ? normalized : c));
      navigate(`/case/${activeCaseRef}/manage`);
    } catch (err) {
      console.error('Failed to mark as filed:', err);
    }
  };

  const handleAddLog = async (message) => {
    if (!activeCase) return;

    // Save the user's update immediately
    const log = await CaseService.addStatusLog(activeCase._id, message);
    const userLog = { timestamp: log.created_at, message: log.message };

    const updatedLogs = [userLog, ...activeCase.statusLogs];
    setCases(prev => prev.map(c =>
      c.id === activeCaseRef ? { ...c, statusLogs: updatedLogs } : c
    ));

    // Send to agent for analysis
    try {
      const analysis = await AgentService.analyzeUpdate(
        message,
        activeCase.research,
        activeCase.statusLogs
      );

      // Save the agent's analysis as a log entry
      const agentMessage = `[Agent Analysis] ${analysis.assessment} Recommended: ${analysis.nextAction}`;
      const agentLog = await CaseService.addStatusLog(activeCase._id, agentMessage);
      const agentLogEntry = { timestamp: agentLog.created_at, message: agentLog.message, isAgent: true };

      // Update deadline if the agent suggests one
      let updatedCaseData = { ...activeCase.caseData };
      if (analysis.newDeadlineDays) {
        const newDeadline = new Date();
        newDeadline.setDate(newDeadline.getDate() + analysis.newDeadlineDays);
        updatedCaseData.responseDeadline = newDeadline.toISOString();
      }

      // Store escalation draft if recommended
      if (analysis.shouldEscalate && analysis.escalationDraft) {
        updatedCaseData.escalationHistory = [
          ...(updatedCaseData.escalationHistory || []),
          {
            triggeredAt: new Date().toISOString(),
            draft: analysis.escalationDraft,
            responseQuality: analysis.responseQuality,
          }
        ];
      }

      // Persist updated case data
      const updatedCase = await CaseService.updateCase(activeCase._id, {
        caseData: updatedCaseData,
      });
      const normalized = normalizeCase(updatedCase);
      normalized.statusLogs = [agentLogEntry, userLog, ...activeCase.statusLogs];
      setCases(prev => prev.map(c => c.id === activeCaseRef ? normalized : c));

      return analysis;
    } catch (err) {
      console.error('Agent analysis failed:', err);
      return null;
    }
  };

  // Full 3-column layout for dossier/manage views
  // noRefs: true hides the right regulatory references sidebar
  const renderCaseLayout = (content, { noRefs = false } = {}) => (
    <div className={`case-container${noRefs ? ' case-container--no-refs' : ''}`}>
      <aside className="case-sidebar">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Case Management</h2>

        <div className="sidebar-heading">Case Metadata</div>
        <div className="metadata-item">
          <span className="metadata-label">Reference ID</span>
          <span className="case-id">{activeCase?.id || 'UNASSIGNED'}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">Framework</span>
          <span className="metadata-value">{activeCase?.research?.baseJustification || 'Pending Assessment'}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">System Status</span>
          <span className={`status-tag ${activeCase?.caseStatus === 'SUBMITTED' ? 'status-active' : ''}`} style={activeCase?.caseStatus === 'SUBMITTED' ? { background: '#fefcbf', color: '#744210' } : {}}>
            {activeCase?.caseStatus === 'SUBMITTED' ? 'Pending Fulfillment' : (activeCase?.caseData ? 'Draft Dossier' : 'Intake Phase')}
          </span>
        </div>

        <div className="disclaimer" style={{ marginTop: 'auto' }}>
          Based on information provided by user. Not legal advice.
          <br /><br />
          <button className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => navigate('/dashboard')}>
            Back to Overview
          </button>
        </div>
      </aside>

      <main className="case-main">
        {content}
      </main>

      <aside className="case-references">
        <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Regulatory References</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {activeCase?.research?.baseJustification ? (
            <>
              System has identified <strong>{activeCase.research.baseJustification}</strong> as the likely applicable framework for this case.
              <br /><br />
              All generated correspondence will strictly adhere to the requirements of this regulation.
            </>
          ) : (
            "Framework references will appear once intake is complete."
          )}
        </p>
      </aside>
    </div>
  )

  // Slim 2-column layout for intake (no right sidebar)
  const renderIntakeLayout = (content) => (
    <div className="case-container intake-layout">
      <aside className="case-sidebar">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Case Management</h2>

        <div className="sidebar-heading">Case Metadata</div>
        <div className="metadata-item">
          <span className="metadata-label">Reference ID</span>
          <span className="case-id">{activeCase?.id || 'UNASSIGNED'}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">Framework</span>
          <span className="metadata-value">{activeCase?.research?.baseJustification || 'Pending Assessment'}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">System Status</span>
          <span className="status-tag">Intake Phase</span>
        </div>

        <div className="disclaimer" style={{ marginTop: 'auto' }}>
          Not legal advice. Based on information provided by user.
          <br /><br />
          <button className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => navigate('/dashboard')}>
            Back to Overview
          </button>
        </div>
      </aside>

      <main className="case-main" style={{ gridColumn: '2 / -1' }}>
        {content}
      </main>
    </div>
  )

  return (
    <div className="app-wrapper">
      <Routes>
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> : <LandingPage />
        } />
        <Route path="/login" element={
          <div className="auth-overlay"><Login /></div>
        } />
        <Route path="/signup" element={
          <div className="auth-overlay"><Signup /></div>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard
              cases={cases}
              onSelectCase={handleSelectCase}
              onNewCase={handleCreateNewCase}
              onDeleteCase={handleDeleteCase}
            />
          </ProtectedRoute>
        } />
        <Route path="/case/new" element={
          <ProtectedRoute>
            {renderIntakeLayout(
              <div className="form-dossier">
                <CaseIntake
                  onComplete={handleCompleteIntake}
                  onSaveProgress={handleSaveIntakeProgress}
                  initialComplaint={activeCase?.complaintText || ''}
                />
              </div>
            )}
          </ProtectedRoute>
        } />
        <Route path="/case/:id" element={
          <ProtectedRoute>
            {activeCase?.caseData ? (
              renderCaseLayout(
                <div className="form-dossier" style={{ maxWidth: 'none' }}>
                  <div className="case-header">
                    <h3>Step 2: Case Dossier & Correspondence</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="btn-secondary" onClick={() => navigate('/case/new')}>← Edit Intake</button>
                      <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Overview</button>
                    </div>
                  </div>
                  <CaseDossier
                    plan={activeCase?.caseData}
                    info={activeCase?.formData}
                    research={activeCase?.research}
                    onSubmit={handleMarkAsFiled}
                    caseRef={activeCase?.id}
                    userEmail={user?.email}
                  />
                </div>,
                { noRefs: true }
              )
            ) : (
              renderIntakeLayout(
                <div className="form-dossier" style={{ maxWidth: 'none' }}>
                  <CaseIntake
                    key={activeCase?._id || 'new'}
                    onComplete={handleCompleteIntake}
                    onSaveProgress={handleSaveIntakeProgress}
                    initialComplaint={activeCase?.complaintText || ''}
                    initialResearch={activeCase?.research}
                  />
                </div>
              )
            )}
          </ProtectedRoute>
        } />
        <Route path="/case/:id/manage" element={
          <ProtectedRoute>
            {renderCaseLayout(
              <div className="form-dossier" style={{ maxWidth: 'none' }}>
                <div className="case-header">
                  <h3>Step 3: Post-Filing Management</h3>
                  <button className="btn-secondary" onClick={() => navigate(`/case/${activeCaseRef}`)}>View Dossier</button>
                </div>
                <CaseDashboard
                  research={activeCase?.research}
                  info={activeCase?.formData}
                  caseData={activeCase?.caseData}
                  statusLogs={activeCase?.statusLogs || []}
                  onAddUpdate={handleAddLog}
                />
              </div>
            )}
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
