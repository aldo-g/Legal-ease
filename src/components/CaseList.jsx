import React from 'react';

const formatDate = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const CaseList = ({ cases, onSelectCase, onNewCase, onDeleteCase }) => {
    return (
        <div className="case-list-view">
            <section className="dossier-step">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Ongoing Case Assessments</h3>
                    <button className="btn-primary" onClick={onNewCase}>+ Begin New Assessment</button>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    A consolidated overview of all active dossiers and submitted claims.
                </p>

                {cases.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', border: '1px solid var(--border-subtle)', background: 'white' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>No active cases found in system records.</p>
                        <button className="btn-secondary" style={{ marginTop: '1.5rem' }} onClick={onNewCase}>Initialize First Case</button>
                    </div>
                ) : (
                    <div className="case-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {cases.map((c) => (
                            <div key={c.id} className="step-card case-list-card" style={{ marginBottom: 0 }}>
                                {/* Header row: status badge */}
                                <div className="case-card-header">
                                    <span className="metadata-label" style={{ margin: 0 }}>CASE ID</span>
                                    <span className={`status-tag ${c.caseStatus === 'SUBMITTED' ? '' : 'status-active'}`}
                                        style={c.caseStatus === 'SUBMITTED' ? { background: '#fefcbf', color: '#744210' } : {}}>
                                        {c.caseStatus === 'SUBMITTED' ? 'Filed' : 'Draft'}
                                    </span>
                                </div>

                                {/* Case ref */}
                                <div className="case-id" style={{ display: 'inline-block', marginBottom: '0.75rem' }}>{c.id}</div>

                                {/* Title */}
                                <h4 className="case-card-title">{c.title}</h4>

                                {/* Framework + date row */}
                                <div className="case-card-meta">
                                    <span className="case-card-framework">{c.research?.baseJustification || 'Pending Assessment'}</span>
                                    {c.createdAt && (
                                        <span className="case-card-date">{formatDate(c.createdAt)}</span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                                    <button className="btn-primary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={() => onSelectCase(c.id)}>
                                        {c.caseStatus === 'SUBMITTED' ? 'Manage Engagement' : 'Resume Assessment'}
                                    </button>
                                    <button className="btn-secondary" style={{ color: '#7b2c2c', padding: '0.5rem' }} onClick={() => onDeleteCase(c.id)}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default CaseList;
