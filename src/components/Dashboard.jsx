import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import CaseList from './CaseList';

const STATUS_CONFIG = {
    DRAFT: { label: 'Draft', color: '#2b6cb0', bg: '#ebf8ff' },
    SUBMITTED: { label: 'Filed', color: '#744210', bg: '#fefcbf' },
};

const Dashboard = ({ cases, onSelectCase, onNewCase, onDeleteCase }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

    const stats = useMemo(() => {
        const total = cases.length;
        const drafts = cases.filter(c => c.caseStatus === 'DRAFT').length;
        const filed = cases.filter(c => c.caseStatus === 'SUBMITTED').length;
        return { total, drafts, filed };
    }, [cases]);

    const recentActivity = useMemo(() => {
        const entries = [];
        cases.forEach(c => {
            if (c.statusLogs) {
                c.statusLogs.forEach(log => {
                    entries.push({ caseId: c.id, ...log });
                });
            }
            entries.push({
                caseId: c.id,
                timestamp: c.createdAt,
                message: `Case ${c.id} created`
            });
        });
        return entries
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);
    }, [cases]);

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime = (iso) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
            <nav className="landing-navbar">
                <div className="nav-container">
                    <div className="logo h2" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>LEGAL EASE</div>
                    <div className="nav-links">
                        <button className="btn-secondary nav-btn" onClick={() => navigate('/')}>Home</button>
                        <button className="btn-secondary nav-btn" style={{ color: 'var(--accent-legal)' }} onClick={logout}>Sign Out</button>
                    </div>
                </div>
            </nav>

            <div className="dashboard-content">
                {/* Welcome Header */}
                <section className="dashboard-welcome">
                    <div>
                        <h1 className="dashboard-greeting">Welcome back, {displayName}</h1>
                        <p className="dashboard-subtitle">Manage your consumer rights cases and track enforcement progress.</p>
                    </div>
                    <button className="btn-primary" onClick={onNewCase} style={{ whiteSpace: 'nowrap' }}>
                        + New Case
                    </button>
                </section>

                {/* Stats Cards */}
                <section className="dashboard-stats">
                    <div className="stat-card">
                        <span className="stat-number">{stats.total}</span>
                        <span className="stat-label">Total Cases</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-number">{stats.drafts}</span>
                        <span className="stat-label">In Progress</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-number">{stats.filed}</span>
                        <span className="stat-label">Filed</span>
                    </div>
                </section>

                {/* Two-column: Quick Actions + Recent Activity */}
                <div className="dashboard-grid">
                    {/* Quick Actions */}
                    <section className="dashboard-card">
                        <h3 className="dashboard-card-title">Quick Actions</h3>
                        <div className="quick-actions">
                            <button className="quick-action-btn" onClick={onNewCase}>
                                <span className="quick-action-icon">+</span>
                                <div>
                                    <strong>Begin New Assessment</strong>
                                    <p>Start a new consumer rights case</p>
                                </div>
                            </button>
                            {cases.length > 0 && (
                                <button className="quick-action-btn" onClick={() => onSelectCase(cases[cases.length - 1].id)}>
                                    <span className="quick-action-icon">→</span>
                                    <div>
                                        <strong>Resume Latest Case</strong>
                                        <p>{cases[cases.length - 1].id}</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Recent Activity */}
                    <section className="dashboard-card">
                        <h3 className="dashboard-card-title">Recent Activity</h3>
                        {recentActivity.length === 0 ? (
                            <p className="empty-state-text">No activity yet. Create your first case to get started.</p>
                        ) : (
                            <div className="activity-feed">
                                {recentActivity.map((entry, i) => (
                                    <div key={i} className="activity-item">
                                        <div className="activity-dot" />
                                        <div className="activity-body">
                                            <p className="activity-message">{entry.message}</p>
                                            <span className="activity-meta">
                                                {formatDate(entry.timestamp)} at {formatTime(entry.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Case Status Summary */}
                {cases.length > 0 && (
                    <section className="dashboard-card" style={{ marginBottom: '2rem' }}>
                        <h3 className="dashboard-card-title">Case Status Summary</h3>
                        <div className="status-bar-container">
                            <div className="status-bar">
                                {stats.drafts > 0 && (
                                    <div
                                        className="status-bar-segment"
                                        style={{
                                            width: `${(stats.drafts / stats.total) * 100}%`,
                                            background: STATUS_CONFIG.DRAFT.bg,
                                            borderLeft: `3px solid ${STATUS_CONFIG.DRAFT.color}`,
                                        }}
                                    />
                                )}
                                {stats.filed > 0 && (
                                    <div
                                        className="status-bar-segment"
                                        style={{
                                            width: `${(stats.filed / stats.total) * 100}%`,
                                            background: STATUS_CONFIG.SUBMITTED.bg,
                                            borderLeft: `3px solid ${STATUS_CONFIG.SUBMITTED.color}`,
                                        }}
                                    />
                                )}
                            </div>
                            <div className="status-legend">
                                <div className="status-legend-item">
                                    <span className="status-legend-dot" style={{ background: STATUS_CONFIG.DRAFT.color }} />
                                    <span>In Progress ({stats.drafts})</span>
                                </div>
                                <div className="status-legend-item">
                                    <span className="status-legend-dot" style={{ background: STATUS_CONFIG.SUBMITTED.color }} />
                                    <span>Filed ({stats.filed})</span>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Case List */}
                <CaseList
                    cases={cases}
                    onSelectCase={onSelectCase}
                    onNewCase={onNewCase}
                    onDeleteCase={onDeleteCase}
                />
            </div>
        </div>
    );
};

export default Dashboard;
