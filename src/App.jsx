import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './utils/AuthContext'
import './App.css'
import CaseIntake from './components/CaseIntake'
import CaseDossier from './components/CaseDossier'
import CaseDashboard from './components/CaseDashboard'
import CaseList from './components/CaseList'
import LoginSignup from './components/LoginSignup'

import LandingPage from './components/LandingPage'

function App() {
  const { user, logout, loading: authLoading } = useAuth();
  const [view, setView] = useState(() => localStorage.getItem('le_view') || 'landing')
  const [cases, setCases] = useState([])
  const [activeCaseId, setActiveCaseId] = useState(null)

  // Derived state for the currently active case
  const activeCase = useMemo(() => {
    return cases.find(c => c.id === activeCaseId) || null
  }, [cases, activeCaseId])

  // Load user-specific cases
  useEffect(() => {
    if (user) {
      const userKey = `le_cases_v2_${user.id}`;
      const saved = JSON.parse(localStorage.getItem(userKey) || '[]');
      setCases(saved);

      const lastActiveId = localStorage.getItem(`le_active_id_${user.id}`);
      if (lastActiveId && saved.find(c => c.id === lastActiveId)) {
        setActiveCaseId(lastActiveId);
      }
    } else {
      setCases([]);
      setActiveCaseId(null);
    }
  }, [user]);

  // Save user-specific cases
  useEffect(() => {
    if (user) {
      const userKey = `le_cases_v2_${user.id}`;
      localStorage.setItem(userKey, JSON.stringify(cases));
      if (activeCaseId) {
        localStorage.setItem(`le_active_id_${user.id}`, activeCaseId);
      } else {
        localStorage.removeItem(`le_active_id_${user.id}`);
      }
    }
    localStorage.setItem('le_view', view);
  }, [view, cases, activeCaseId, user]);

  if (authLoading) return <div className="app-wrapper" style={{ padding: '4rem', textAlign: 'center' }}>Initializing Secure System...</div>;

  const handleCreateNewCase = () => {
    const newId = `LE-${user.id.slice(-4)}-${Date.now().toString().slice(-4)}`;
    const newCase = {
      id: newId,
      caseStatus: 'DRAFT',
      caseData: null,
      formData: null,
      research: null,
      statusLogs: [],
      createdAt: new Date().toISOString()
    };
    setCases([...cases, newCase]);
    setActiveCaseId(newId);
    setView('intake');
  };

  const handleSelectCase = (id) => {
    setActiveCaseId(id);
    const selected = cases.find(c => c.id === id);
    if (selected.caseStatus === 'SUBMITTED') {
      setView('dashboard');
    } else if (selected.caseData) {
      setView('case');
    } else {
      setView('intake');
    }
  };

  const handleDeleteCase = (id) => {
    if (confirm("Permanently delete this case dossier? This action cannot be undone.")) {
      const updated = cases.filter(c => c.id !== id);
      setCases(updated);
      if (activeCaseId === id) {
        setActiveCaseId(null);
        setView('overview');
      }
    }
  };

  const updateActiveCase = (updates) => {
    setCases(prev => prev.map(c =>
      c.id === activeCaseId ? { ...c, ...updates } : c
    ));
  };

  const handleCompleteIntake = (plan, info, res) => {
    updateActiveCase({
      caseData: plan,
      formData: info,
      research: res,
      caseStatus: 'DRAFT'
    });
    setView('case');
  };

  const handleMarkAsFiled = () => {
    const initialLog = {
      timestamp: new Date().toISOString(),
      message: `Case formally filed under ${activeCase.research.baseJustification}. Corresponding letters sent to relevant parties.`
    };
    updateActiveCase({
      caseStatus: 'SUBMITTED',
      statusLogs: [initialLog]
    });
    setView('dashboard');
  };

  const handleAddLog = (message) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      message
    };
    updateActiveCase({
      statusLogs: [newLog, ...activeCase.statusLogs]
    });
  };

  const handleLandingStart = () => {
    if (user) {
      handleCreateNewCase();
    } else {
      setView('auth');
    }
  };

  const renderCaseLayout = (content) => (
    <div className="case-container">
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
          <button className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => setView('overview')}>
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

  return (
    <div className="app-wrapper">
      {view === 'landing' && (
        <LandingPage
          onStart={handleLandingStart}
          onLogin={() => setView('auth')}
          onOverview={() => setView('overview')}
          showOverview={cases.length > 0}
        />
      )}
      {view === 'auth' && (
        <div className="auth-overlay">
          <LoginSignup onBack={() => setView('landing')} />
        </div>
      )}
      {view === 'overview' && (
        <div style={{ background: 'white', minHeight: '100vh' }}>
          <nav className="landing-navbar">
            <div className="logo h2" onClick={() => setView('landing')} style={{ cursor: 'pointer' }}>LEGAL EASE</div>
            <div className="nav-links">
              <button className="btn-secondary" onClick={() => setView('landing')}>Home</button>
              <button className="btn-secondary" style={{ color: '#7b2c2c' }} onClick={logout}>Sign Out</button>
            </div>
          </nav>
          <div className="case-main" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <CaseList
              cases={cases}
              onSelectCase={handleSelectCase}
              onNewCase={handleCreateNewCase}
              onDeleteCase={handleDeleteCase}
            />
          </div>
        </div>
      )}
      {view === 'intake' && renderCaseLayout(
        <div className="form-dossier">
          <div className="case-header">
            <h3>Step 1: Incident Intake</h3>
            <button className="btn-secondary" onClick={() => setView('overview')}>Cancel</button>
          </div>
          <CaseIntake onComplete={handleCompleteIntake} />
        </div>
      )}
      {view === 'case' && renderCaseLayout(
        <div className="form-dossier" style={{ maxWidth: 'none' }}>
          <div className="case-header">
            <h3>Step 2: Case Dossier & Correspondence</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setView('intake')}>← Edit Intake</button>
              <button className="btn-secondary" onClick={() => setView('overview')}>Overview</button>
            </div>
          </div>
          <CaseDossier
            plan={activeCase?.caseData}
            info={activeCase?.formData}
            research={activeCase?.research}
            onSubmit={handleMarkAsFiled}
          />
        </div>
      )}
      {view === 'dashboard' && renderCaseLayout(
        <div className="form-dossier" style={{ maxWidth: 'none' }}>
          <div className="case-header">
            <h3>Step 3: Post-Filing Management</h3>
            <button className="btn-secondary" onClick={() => setView('case')}>View Dossier</button>
          </div>
          <CaseDashboard
            research={activeCase?.research}
            info={activeCase?.formData}
            statusLogs={activeCase?.statusLogs || []}
            onAddUpdate={handleAddLog}
          />
        </div>
      )}
      {view === 'auth' && user && setView('landing')}
    </div>
  )
}

export default App
