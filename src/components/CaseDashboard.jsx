import React, { useState } from 'react';

const CaseDashboard = ({ research, info, statusLogs, onAddUpdate }) => {
    const [updateText, setUpdateText] = useState('');

    const handleSubmitUpdate = (e) => {
        e.preventDefault();
        if (updateText.trim()) {
            onAddUpdate(updateText);
            setUpdateText('');
        }
    };

    return (
        <div className="case-dashboard">
            <section className="dossier-step">
                <h3>Current Case Engagement</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Monitor the progression of your submitted claim and log all formal communications received.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', background: 'white', padding: '2rem', border: '1px solid var(--border-subtle)' }}>
                    <div>
                        <div className="sidebar-heading">Engagement Status</div>
                        <div className="status-tag status-active" style={{ background: '#fefcbf', color: '#744210' }}>Pending Fulfillment</div>
                    </div>
                    <div>
                        <div className="sidebar-heading">Assessed Value</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>Active Pursuit</div>
                    </div>
                </div>
            </section>

            <section className="dossier-step" style={{ marginTop: '3rem' }}>
                <h3>08. Communication Log</h3>
                <div className="timeline" style={{ borderLeft: '2px solid var(--border-subtle)', paddingLeft: '2rem', marginLeft: '1rem', marginTop: '2rem' }}>
                    {statusLogs.map((log, idx) => (
                        <div key={idx} className="timeline-item" style={{ marginBottom: '2rem', position: 'relative' }}>
                            <div style={{
                                position: 'absolute',
                                left: '-2.45rem',
                                top: '0',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: 'var(--accent-primary)',
                                border: '4px solid var(--bg-primary)'
                            }}></div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                            <div style={{ background: 'white', padding: '1rem', border: '1px solid var(--border-subtle)', fontSize: '0.95rem' }}>
                                {log.message}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="dossier-step" style={{ marginTop: '3rem', paddingBottom: '4rem' }}>
                <h3>Log Formal Update</h3>
                <form onSubmit={handleSubmitUpdate} style={{ marginTop: '1.5rem' }}>
                    <label className="metadata-label" style={{ marginBottom: '0.5rem' }}>UPDATE DESCRIPTION</label>
                    <textarea
                        placeholder="e.g., Received email from airline acknowledging receipt. Expected response within 14 days."
                        value={updateText}
                        onChange={(e) => setUpdateText(e.target.value)}
                        style={{ height: '100px', marginBottom: '1rem' }}
                    />
                    <button className="btn-primary" type="submit">Append to Case Log</button>
                </form>
            </section>
        </div>
    );
};

export default CaseDashboard;
