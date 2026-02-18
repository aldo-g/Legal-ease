import { useState } from 'react';

const CaseDossier = ({ plan, info, research, onSubmit }) => {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('timeline');

    if (!plan) return null;

    // Support both old format (plan.email as string) and new format (plan.email as object)
    const email = typeof plan.email === 'string'
        ? { subject: '', recipientName: '', recipientEmail: '', body: plan.email }
        : plan.email;

    // Support both old format (plan.strategy as string) and new format (plan.timeline as array)
    const timeline = plan.timeline || [];
    const hasTimeline = timeline.length > 0;

    const handleCopyEmail = async () => {
        try {
            await navigator.clipboard.writeText(email.body);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = email.body;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleOpenMailClient = () => {
        const subject = encodeURIComponent(email.subject);
        const body = encodeURIComponent(email.body);
        const to = email.recipientEmail || '';
        window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_self');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleFinalSubmit = () => {
        if (confirm("Affirm: I have formally submitted this correspondence to the relevant party.")) {
            onSubmit();
        }
    };

    return (
        <div className="case-dossier-view">
            {/* Tab navigation */}
            <div className="dossier-tabs">
                <button
                    className={`dossier-tab ${activeTab === 'timeline' ? 'active' : ''}`}
                    onClick={() => setActiveTab('timeline')}
                >
                    Action Plan
                </button>
                <button
                    className={`dossier-tab ${activeTab === 'email' ? 'active' : ''}`}
                    onClick={() => setActiveTab('email')}
                >
                    Correspondence
                </button>
                <button
                    className={`dossier-tab ${activeTab === 'evidence' ? 'active' : ''}`}
                    onClick={() => setActiveTab('evidence')}
                >
                    Evidence
                </button>
            </div>

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
                <div className="dossier-tab-content">
                    {/* Summary bar */}
                    <div className="dossier-summary-bar">
                        <div>
                            <div className="sidebar-heading" style={{ margin: 0 }}>Framework</div>
                            <p style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem' }}>{research.baseJustification}</p>
                        </div>
                        <div>
                            <div className="sidebar-heading" style={{ margin: 0 }}>Status</div>
                            <span className="status-tag status-active" style={{ marginTop: '0.25rem', display: 'inline-block' }}>Ready for Action</span>
                        </div>
                    </div>

                    {hasTimeline ? (
                        <div className="action-timeline">
                            {timeline.map((step, idx) => (
                                <div key={idx} className="timeline-step">
                                    <div className="timeline-step-marker">
                                        <span className="timeline-step-number">{idx + 1}</span>
                                        {idx < timeline.length - 1 && <div className="timeline-step-line" />}
                                    </div>
                                    <div className="timeline-step-content">
                                        <div className="timeline-step-header">
                                            <h4 className="timeline-step-title">{step.title}</h4>
                                            <span className="timeline-step-timeframe">{step.timeframe}</span>
                                        </div>
                                        <p className="timeline-step-description">{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Fallback for old data format */
                        <div style={{ background: '#f8f9fa', padding: '1.5rem', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                            <div className="sidebar-heading">Strategy</div>
                            <p style={{ whiteSpace: 'pre-line', lineHeight: '1.7', fontSize: '0.95rem' }}>
                                {plan.strategy}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
                <div className="dossier-tab-content">
                    {/* Email metadata */}
                    {(email.recipientName || email.recipientEmail) && (
                        <div className="email-metadata">
                            <div className="email-meta-row">
                                <span className="email-meta-label">To:</span>
                                <span className="email-meta-value">
                                    {email.recipientName}
                                    {email.recipientEmail && (
                                        <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                                            &lt;{email.recipientEmail}&gt;
                                        </span>
                                    )}
                                </span>
                            </div>
                            {email.subject && (
                                <div className="email-meta-row">
                                    <span className="email-meta-label">Subject:</span>
                                    <span className="email-meta-value">{email.subject}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Email body */}
                    <div className="email-document">
                        <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8', fontSize: '0.95rem' }}>
                            {email.body}
                        </div>
                    </div>

                    {/* Email actions */}
                    <div className="email-actions">
                        <button className="btn-primary email-action-btn" onClick={handleOpenMailClient}>
                            Open in Email Client
                        </button>
                        <button className="btn-secondary email-action-btn" onClick={handleCopyEmail}>
                            {copied ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                        <button className="btn-secondary email-action-btn" onClick={handlePrint}>
                            Print / Save PDF
                        </button>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: '1.5' }}>
                        Review the correspondence carefully before sending. Replace any placeholders marked with [BRACKETS] with your actual information.
                    </p>
                </div>
            )}

            {/* Evidence Tab */}
            {activeTab === 'evidence' && (
                <div className="dossier-tab-content">
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Gather the following documentation to support your claim. Check off items as you collect them.
                    </p>
                    <div className="evidence-list">
                        {plan.checklist.map((item, idx) => (
                            <label key={idx} className="evidence-item">
                                <input type="checkbox" className="evidence-checkbox" />
                                <span className="evidence-text">{item}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Filing confirmation — always visible */}
            <div className="dossier-filing-section">
                <div className="dossier-filing-inner">
                    <div>
                        <h4 style={{ marginBottom: '0.25rem' }}>Ready to file?</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            Once you have sent the correspondence and gathered your evidence, mark this case as filed to begin tracking.
                        </p>
                    </div>
                    <button className="btn-primary" onClick={handleFinalSubmit} style={{ whiteSpace: 'nowrap', padding: '0.75rem 2rem' }}>
                        Mark as Filed
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          .case-sidebar, .case-references, .dossier-tabs, .email-actions, .dossier-filing-section, .btn-secondary { display: none !important; }
          .case-main { padding: 0 !important; }
          .email-document { border: none !important; padding: 0 !important; box-shadow: none !important; }
          .app-wrapper { background: white !important; }
        }
      `}} />
        </div>
    );
};

export default CaseDossier;
