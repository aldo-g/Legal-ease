import { useState, useMemo } from 'react';

const CaseDashboard = ({ research, info, caseData, statusLogs, onAddUpdate }) => {
    const [updateText, setUpdateText] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [latestAnalysis, setLatestAnalysis] = useState(null);
    const [showEscalation, setShowEscalation] = useState(false);
    const [escalationCopied, setEscalationCopied] = useState(false);

    const deadline = caseData?.responseDeadline ? new Date(caseData.responseDeadline) : null;
    const escalationHistory = caseData?.escalationHistory || [];
    const latestEscalation = escalationHistory.length > 0 ? escalationHistory[escalationHistory.length - 1] : null;

    const deadlineInfo = useMemo(() => {
        if (!deadline) return null;
        const now = new Date();
        const diff = deadline - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (days < 0) {
            return { days: Math.abs(days), label: `${Math.abs(days)} days overdue`, status: 'overdue' };
        } else if (days === 0) {
            return { days: 0, label: 'Due today', status: 'urgent' };
        } else if (days <= 3) {
            return { days, label: `${days} day${days === 1 ? '' : 's'} remaining`, status: 'urgent' };
        } else {
            return { days, label: `${days} days remaining`, status: 'normal' };
        }
    }, [deadline]);

    const handleSubmitUpdate = async (e) => {
        e.preventDefault();
        if (!updateText.trim() || analyzing) return;

        const text = updateText;
        setUpdateText('');
        setAnalyzing(true);
        setLatestAnalysis(null);

        try {
            const analysis = await onAddUpdate(text);
            if (analysis) {
                setLatestAnalysis(analysis);
                if (analysis.shouldEscalate) {
                    setShowEscalation(true);
                }
            }
        } catch {
            // Error already logged in parent
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCopyEscalation = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setEscalationCopied(true);
            setTimeout(() => setEscalationCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setEscalationCopied(true);
            setTimeout(() => setEscalationCopied(false), 2000);
        }
    };

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime = (iso) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="case-dashboard">
            {/* Status Cards */}
            <div className="tracking-status-grid">
                <div className={`tracking-card ${deadlineInfo?.status === 'overdue' ? 'tracking-card-alert' : ''}`}>
                    <div className="sidebar-heading" style={{ margin: 0 }}>Response Deadline</div>
                    {deadlineInfo ? (
                        <>
                            <div className={`tracking-countdown ${deadlineInfo.status}`}>
                                {deadlineInfo.days}
                            </div>
                            <span className={`tracking-countdown-label ${deadlineInfo.status}`}>
                                {deadlineInfo.label}
                            </span>
                            {deadline && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    {formatDate(deadline.toISOString())}
                                </span>
                            )}
                        </>
                    ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>No deadline set</span>
                    )}
                </div>

                <div className="tracking-card">
                    <div className="sidebar-heading" style={{ margin: 0 }}>Case Status</div>
                    <span className="status-tag" style={{ background: '#fefcbf', color: '#744210', marginTop: '0.5rem', display: 'inline-block' }}>
                        {deadlineInfo?.status === 'overdue' ? 'Overdue — Escalation Advised' : 'Awaiting Response'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                        {research?.baseJustification || 'Unknown framework'}
                    </span>
                </div>

                <div className="tracking-card">
                    <div className="sidebar-heading" style={{ margin: 0 }}>Activity</div>
                    <div className="tracking-countdown normal" style={{ fontSize: '2rem' }}>
                        {statusLogs.length}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        log entries
                    </span>
                </div>
            </div>

            {/* Overdue alert */}
            {deadlineInfo?.status === 'overdue' && (
                <div className="tracking-alert">
                    <div className="tracking-alert-content">
                        <strong>Response deadline has passed.</strong>
                        <p>The responding party has not met the expected timeframe. Consider logging an update to trigger an escalation assessment.</p>
                    </div>
                </div>
            )}

            {/* Latest agent analysis */}
            {latestAnalysis && (
                <div className="agent-analysis-card">
                    <div className="agent-analysis-header">
                        <span className="agent-badge">Agent Analysis</span>
                        {latestAnalysis.responseQuality && latestAnalysis.responseQuality !== 'not_applicable' && (
                            <span className={`response-quality-badge ${latestAnalysis.responseQuality}`}>
                                {latestAnalysis.responseQuality === 'satisfactory' ? 'Satisfactory' :
                                 latestAnalysis.responseQuality === 'partial' ? 'Partial Response' : 'Inadequate'}
                            </span>
                        )}
                    </div>
                    <p className="agent-assessment">{latestAnalysis.assessment}</p>
                    <div className="agent-next-action">
                        <div className="sidebar-heading" style={{ margin: '0 0 0.25rem 0' }}>Recommended Next Action</div>
                        <p>{latestAnalysis.nextAction}</p>
                    </div>
                    {latestAnalysis.newDeadlineDays && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                            New deadline set: {latestAnalysis.newDeadlineDays} days from now
                        </p>
                    )}
                </div>
            )}

            {/* Escalation panel */}
            {(showEscalation || latestEscalation) && (
                <div className="escalation-panel">
                    <div className="escalation-header">
                        <h4>Escalation Recommended</h4>
                        <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }} onClick={() => setShowEscalation(false)}>
                            Dismiss
                        </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        The agent has drafted an escalation letter. Review and send to the relevant authority.
                    </p>
                    <div className="escalation-draft">
                        {(latestAnalysis?.escalationDraft || latestEscalation?.draft) || 'No draft available.'}
                    </div>
                    <button
                        className="btn-primary"
                        style={{ marginTop: '1rem', fontSize: '0.85rem' }}
                        onClick={() => handleCopyEscalation(latestAnalysis?.escalationDraft || latestEscalation?.draft || '')}
                    >
                        {escalationCopied ? 'Copied!' : 'Copy Escalation Letter'}
                    </button>
                </div>
            )}

            {/* Log update form */}
            <section className="dossier-step" style={{ marginTop: '2rem' }}>
                <h3>Log Update</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Record any communication or development. The tracking agent will analyze your update and recommend next steps.
                </p>
                <form onSubmit={handleSubmitUpdate}>
                    <textarea
                        placeholder="e.g., Received email from airline acknowledging receipt. They offered a voucher but not monetary compensation."
                        value={updateText}
                        onChange={(e) => setUpdateText(e.target.value)}
                        disabled={analyzing}
                        style={{ height: '100px', marginBottom: '1rem' }}
                    />
                    <button className="btn-primary" type="submit" disabled={analyzing || !updateText.trim()}>
                        {analyzing ? 'Analyzing update...' : 'Submit & Analyze'}
                    </button>
                </form>
            </section>

            {/* Analyzing indicator */}
            {analyzing && (
                <div className="agent-analyzing">
                    <div className="intake-loading-spinner" style={{ width: '24px', height: '24px', borderWidth: '2px' }} />
                    <span>Agent is analyzing your update...</span>
                </div>
            )}

            {/* Communication log */}
            <section className="dossier-step" style={{ marginTop: '2rem' }}>
                <h3>Communication Log</h3>
                {statusLogs.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '2rem 0' }}>
                        No entries yet. Log your first update above.
                    </p>
                ) : (
                    <div className="comm-log-timeline">
                        {statusLogs.map((log, idx) => {
                            const isAgent = log.isAgent || log.message.startsWith('[Agent Analysis]');
                            return (
                                <div key={idx} className={`comm-log-entry ${isAgent ? 'comm-log-agent' : ''}`}>
                                    <div className={`comm-log-dot ${isAgent ? 'agent' : ''}`} />
                                    <div className="comm-log-body">
                                        {isAgent && <span className="agent-badge" style={{ marginBottom: '0.25rem' }}>Agent</span>}
                                        <p className="comm-log-message">
                                            {isAgent ? log.message.replace('[Agent Analysis] ', '') : log.message}
                                        </p>
                                        <span className="comm-log-time">
                                            {formatDate(log.timestamp)} at {formatTime(log.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default CaseDashboard;
