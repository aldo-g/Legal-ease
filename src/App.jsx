import { useState, useEffect } from 'react'
import { useAuth } from './utils/AuthContext'
import './App.css'
import CaseIntake from './components/CaseIntake'
import CaseDossier from './components/CaseDossier'
import CaseDashboard from './components/CaseDashboard'
import LoginSignup from './components/LoginSignup'

function App() {
  const { user, logout, loading: authLoading } = useAuth();
  const [view, setView] = useState(() => localStorage.getItem('le_view') || 'landing')
  const [caseData, setCaseData] = useState(null)
  const [formData, setFormData] = useState(null)
  const [research, setResearch] = useState(null)
  const [caseStatus, setCaseStatus] = useState('DRAFT') // DRAFT, SUBMITTED
  const [statusLogs, setStatusLogs] = useState([])

  // Load user-specific data
  useEffect(() => {
    if (user) {
      const userKey = `le_case_${user.id}`;
      const saved = JSON.parse(localStorage.getItem(userKey) || 'null');
      if (saved) {
        setCaseData(saved.caseData);
        setFormData(saved.formData);
        setResearch(saved.research);
        setCaseStatus(saved.caseStatus || 'DRAFT');
        setStatusLogs(saved.statusLogs || []);
      } else {
        setCaseData(null);
        setFormData(null);
        setResearch(null);
        setCaseStatus('DRAFT');
        setStatusLogs([]);
      }
    }
  }, [user]);

  // Save user-specific data
  useEffect(() => {
    if (user) {
      const userKey = `le_case_${user.id}`;
      localStorage.setItem(userKey, JSON.stringify({
        caseData,
        formData,
        research,
        caseStatus,
        statusLogs
      }));
    }
    localStorage.setItem('le_view', view);
  }, [view, caseData, formData, research, caseStatus, statusLogs, user]);

  if (authLoading) return <div className="app-wrapper" style={{ padding: '4rem', textAlign: 'center' }}>Initializing Secure System...</div>;

  const handleComplete = (plan, info, res) => {
    setCaseData(plan)
    setFormData(info)
    setResearch(res)
    setCaseStatus('DRAFT')
    setView('case')
  }

  const handleMarkAsFiled = () => {
    setCaseStatus('SUBMITTED');
    const initialLog = {
      timestamp: new Date().toISOString(),
      message: `Case formally filed under ${research.baseJustification}. Corresponding letters sent to relevant parties.`
    };
    setStatusLogs([initialLog]);
    setView('dashboard');
  };

  const handleAddLog = (message) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      message
    };
    setStatusLogs([newLog, ...statusLogs]);
  };

  const handleReset = () => {
    if (confirm("Reset current case dossier? This action cannot be undone.")) {
      setCaseData(null)
      setFormData(null)
      setResearch(null)
      setCaseStatus('DRAFT')
      setStatusLogs([])
      setView('landing')
      if (user) localStorage.removeItem(`le_case_${user.id}`);
    }
  }

  const renderLanding = () => (
    <div className="landing-page">
      <nav className="landing-navbar">
        <div className="logo h2">LEGAL EASE</div>
        <div className="nav-links">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <span className="metadata-label">Account: {user.email}</span>
              <button className="btn-secondary" onClick={logout}>Sign Out</button>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => setView('auth')}>Login / Request Access</button>
          )}
        </div>
      </nav>

      <main className="landing-hero">
        <h1>Structured assistance for handling consumer disruption complaints.</h1>
        <p>A procedural system designed to identify legal obligations and generate formal correspondence under applicable frameworks.</p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => user ? setView('intake') : setView('auth')}>
            Begin New Case Assessment
          </button>
          {caseData && (
            <button className="btn-secondary" onClick={() => setView(caseStatus === 'SUBMITTED' ? 'dashboard' : 'case')}>
              Access Active {caseStatus === 'SUBMITTED' ? 'Dashboard' : 'Dossier'}
            </button>
          )}
        </div>

        <div className="disclaimer" style={{ maxWidth: '600px', margin: '4rem auto' }}>
          <strong>Notice of Limitation:</strong> This system provides structured procedural assistance only. It does not provide legal advice, representation, or guarantees of success. Users remain responsible for the accuracy of submissions.
        </div>
      </main>

      <section className="how-it-works">
        <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Procedural Workflow</h2>
        <div className="step-card">
          <span className="step-number">01. INTAKE</span>
          <p>Provide a factual description of the incident. The system will categorize the event and identify potential legal frameworks.</p>
        </div>
        <div className="step-card">
          <span className="step-number">02. ASSESSMENT</span>
          <p>A structured review of eligibility and required evidence. Information is assessed against publicly available regulations.</p>
        </div>
        <div className="step-card">
          <span className="step-number">03. CORRESPONDENCE</span>
          <p>Generation of formal claim letters using factual tone and numbered legal justifications.</p>
        </div>
      </section>
    </div>
  )

  const renderCaseLayout = (content) => (
    <div className="case-container">
      <aside className="case-sidebar">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Case Management</h2>

        <div className="sidebar-heading">Case Metadata</div>
        <div className="metadata-item">
          <span className="metadata-label">Reference ID</span>
          <span className="case-id">LE-{user?.id?.slice(-4)}-{new Date().getUTCFullYear()}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">Framework</span>
          <span className="metadata-value">{research?.baseJustification || 'Pending Assessment'}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">System Status</span>
          <span className={`status-tag ${caseStatus === 'SUBMITTED' ? 'status-active' : ''}`} style={caseStatus === 'SUBMITTED' ? { background: '#fefcbf', color: '#744210' } : {}}>
            {caseStatus === 'SUBMITTED' ? 'Pending Fulfillment' : (caseData ? 'Draft Dossier' : 'Intake Phase')}
          </span>
        </div>

        <div className="disclaimer" style={{ marginTop: 'auto' }}>
          Based on information provided by user. Not legal advice.
          <br /><br />
          <button className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => setView('landing')}>
            Exit to Overview
          </button>
        </div>
      </aside>

      <main className="case-main">
        {content}
      </main>

      <aside className="case-references">
        <h3 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Regulatory References</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {research?.baseJustification ? (
            <>
              System has identified <strong>{research.baseJustification}</strong> as the likely applicable framework for this case.
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
      {view === 'landing' && renderLanding()}
      {view === 'auth' && (
        <div className="auth-overlay">
          <LoginSignup onBack={() => setView('landing')} />
        </div>
      )}
      {view === 'intake' && renderCaseLayout(
        <div className="form-dossier">
          <div className="case-header">
            <h3>Step 1: Incident Intake</h3>
            <button className="btn-secondary" onClick={handleReset}>Reset</button>
          </div>
          <CaseIntake onComplete={handleComplete} />
        </div>
      )}
      {view === 'case' && renderCaseLayout(
        <div className="form-dossier" style={{ maxWidth: 'none' }}>
          <div className="case-header">
            <h3>Step 2: Case Dossier & Correspondence</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setView('intake')}>← Edit Intake</button>
              <button className="btn-secondary" onClick={handleReset}>Clear Dossier</button>
            </div>
          </div>
          <CaseDossier
            plan={caseData}
            info={formData}
            research={research}
            onSubmit={handleMarkAsFiled}
            onRestart={handleReset}
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
            research={research}
            info={formData}
            statusLogs={statusLogs}
            onAddUpdate={handleAddLog}
          />
        </div>
      )}
      {view === 'auth' && user && setView('landing')}
    </div>
  )
}

export default App
