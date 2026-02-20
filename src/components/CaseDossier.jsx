import { useState, useRef } from 'react';

// Determine whether a timeline step is "send" intent (should link to correspondence tab)
function isSendStep(step) {
    const text = `${step.title} ${step.description}`.toLowerCase();
    return text.includes('send') || text.includes('email') || text.includes('letter') || text.includes('correspondence') || text.includes('submit');
}

// Derive initial status for each step
function initStepStatuses(timeline) {
    return timeline.map((step, i) => {
        if (i === 0) return 'ready';
        return 'awaiting';
    });
}

const STATUS_LABELS = {
    ready: 'Ready',
    awaiting: 'Awaiting',
    pending: 'Pending',
    complete: 'Complete',
};

const CaseDossier = ({ plan, info, research, onSubmit }) => {
    const [activeTab, setActiveTab] = useState('timeline');
    const [copied, setCopied] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState({}); // { [itemIndex]: File }
    const [stepStatuses, setStepStatuses] = useState(() =>
        initStepStatuses(plan?.timeline || [])
    );
    const fileInputRefs = useRef({});

    if (!plan) return null;

    // Support both old format (plan.email as string) and new format (plan.email as object)
    const email = typeof plan.email === 'string'
        ? { subject: '', recipientName: '', recipientEmail: '', body: plan.email }
        : plan.email;

    const timeline = plan.timeline || [];
    const checklist = plan.checklist || [];

    // Build attachment list from uploaded files
    const attachmentList = checklist
        .map((item, idx) => uploadedFiles[idx] ? { label: item, filename: uploadedFiles[idx].name } : null)
        .filter(Boolean);

    const buildEmailBody = () => {
        let body = email.body || '';
        if (attachmentList.length > 0) {
            body += '\n\n---\nAttachments enclosed:\n' +
                attachmentList.map(a => `- ${a.label} (${a.filename})`).join('\n');
        }
        return body;
    };

    const handleOpenMailClient = () => {
        const subject = encodeURIComponent(email.subject || '');
        const body = encodeURIComponent(buildEmailBody());
        const to = email.recipientEmail || '';
        window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_self');

        // Prompt to mark as sent
        setTimeout(() => {
            if (window.confirm('Mark this correspondence as sent?')) {
                setEmailSent(true);
                setStepStatuses(prev => {
                    const next = [...prev];
                    // Find the first send-intent step and mark complete
                    const sendIdx = timeline.findIndex(isSendStep);
                    if (sendIdx >= 0) next[sendIdx] = 'complete';
                    // Unlock next step
                    const nextIdx = (sendIdx >= 0 ? sendIdx : 0) + 1;
                    if (nextIdx < next.length && next[nextIdx] === 'awaiting') {
                        next[nextIdx] = 'ready';
                    }
                    return next;
                });
            }
        }, 500);
    };

    const handleCopyEmail = async () => {
        const body = buildEmailBody();
        try {
            await navigator.clipboard.writeText(body);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = body;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => window.print();

    const handleMarkStepComplete = (idx) => {
        setStepStatuses(prev => {
            const next = [...prev];
            next[idx] = next[idx] === 'complete' ? 'ready' : 'complete';
            // Unlock the next step if marking complete
            if (next[idx] === 'complete' && idx + 1 < next.length && next[idx + 1] === 'awaiting') {
                next[idx + 1] = 'ready';
            }
            return next;
        });
    };

    const handleAttachFile = (idx, file) => {
        setUploadedFiles(prev => ({ ...prev, [idx]: file }));
    };

    const handleRemoveFile = (idx) => {
        setUploadedFiles(prev => {
            const next = { ...prev };
            delete next[idx];
            return next;
        });
    };

    const handleFinalSubmit = () => {
        if (confirm('Confirm you have sent the formal correspondence to the relevant party. This will begin active case tracking.')) {
            onSubmit();
        }
    };

    // Derived: first non-complete step
    const nextActionStep = timeline.find((_, i) => stepStatuses[i] !== 'complete');
    const completedCount = stepStatuses.filter(s => s === 'complete').length;

    return (
        <div className="case-dossier-view">
            {/* Tab navigation */}
            <div className="dossier-tabs">
                <button
                    className={`dossier-tab ${activeTab === 'timeline' ? 'active' : ''}`}
                    onClick={() => setActiveTab('timeline')}
                >
                    Claim Timeline
                    {completedCount > 0 && (
                        <span className="dossier-tab-count">{completedCount}/{timeline.length}</span>
                    )}
                </button>
                <button
                    className={`dossier-tab ${activeTab === 'email' ? 'active' : ''}`}
                    onClick={() => setActiveTab('email')}
                >
                    Review & Send
                    {emailSent && <span className="dossier-tab-sent">Sent</span>}
                </button>
                <button
                    className={`dossier-tab ${activeTab === 'evidence' ? 'active' : ''}`}
                    onClick={() => setActiveTab('evidence')}
                >
                    Evidence & Attachments
                    {attachmentList.length > 0 && (
                        <span className="dossier-tab-count">{attachmentList.length}</span>
                    )}
                </button>
            </div>

            {/* Claim Timeline Tab */}
            {activeTab === 'timeline' && (
                <div className="dossier-tab-content">
                    {/* Summary bar */}
                    <div className="dossier-summary-bar">
                        <div>
                            <div className="sidebar-heading" style={{ margin: 0 }}>Framework</div>
                            <p style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                {research?.baseJustification}
                            </p>
                        </div>
                        {nextActionStep && (
                            <div style={{ textAlign: 'right', maxWidth: '260px' }}>
                                <div className="sidebar-heading" style={{ margin: 0 }}>Your next action</div>
                                <p style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--accent-legal)' }}>
                                    {nextActionStep.title}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="action-timeline">
                        {timeline.map((step, idx) => {
                            const status = stepStatuses[idx] || 'awaiting';
                            const sendStep = isSendStep(step);
                            const isLast = idx === timeline.length - 1;

                            return (
                                <div key={idx} className="timeline-step">
                                    <div className="timeline-step-marker">
                                        <span className={`timeline-step-number ${status === 'complete' ? 'complete' : ''}`}>
                                            {status === 'complete' ? '✓' : idx + 1}
                                        </span>
                                        {!isLast && <div className="timeline-step-line" />}
                                    </div>
                                    <div className="timeline-step-content">
                                        <div className="timeline-step-header">
                                            <h4 className="timeline-step-title">{step.title}</h4>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                                                <span className={`step-status-badge step-status-${status}`}>
                                                    {STATUS_LABELS[status]}
                                                </span>
                                                <span className="timeline-step-timeframe">{step.timeframe}</span>
                                            </div>
                                        </div>
                                        <p className="timeline-step-description">{step.description}</p>

                                        {/* Step CTAs */}
                                        {status !== 'complete' && status !== 'awaiting' && (
                                            <div className="timeline-step-actions">
                                                {sendStep ? (
                                                    <button
                                                        className="timeline-step-cta btn-primary"
                                                        onClick={() => setActiveTab('email')}
                                                    >
                                                        Go to Correspondence →
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="timeline-step-cta btn-secondary"
                                                        onClick={() => handleMarkStepComplete(idx)}
                                                    >
                                                        Mark Complete
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {status === 'complete' && (
                                            <div className="timeline-step-actions">
                                                <button
                                                    className="timeline-step-cta btn-secondary"
                                                    style={{ fontSize: '0.75rem', opacity: 0.7 }}
                                                    onClick={() => handleMarkStepComplete(idx)}
                                                >
                                                    Undo
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Fallback for old data */}
                    {timeline.length === 0 && plan.strategy && (
                        <div style={{ background: '#f8f9fa', padding: '1.5rem', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                            <div className="sidebar-heading">Strategy</div>
                            <p style={{ whiteSpace: 'pre-line', lineHeight: '1.7', fontSize: '0.95rem' }}>{plan.strategy}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Review & Send Tab */}
            {activeTab === 'email' && (
                <div className="dossier-tab-content">
                    {/* Send banner */}
                    <div className={`send-banner ${emailSent ? 'send-banner-sent' : ''}`}>
                        <div className="send-banner-left">
                            <div className="send-banner-status">
                                {emailSent ? '✓ Correspondence sent' : 'Ready to send'}
                            </div>
                            {(email.recipientName || email.recipientEmail) && (
                                <div className="send-banner-recipient">
                                    To: <strong>{email.recipientName}</strong>
                                    {email.recipientEmail && (
                                        <span style={{ opacity: 0.7, marginLeft: '0.35rem' }}>
                                            &lt;{email.recipientEmail}&gt;
                                        </span>
                                    )}
                                </div>
                            )}
                            {attachmentList.length > 0 && (
                                <div className="send-banner-attachments">
                                    {attachmentList.length} file{attachmentList.length > 1 ? 's' : ''} attached
                                </div>
                            )}
                        </div>
                        <div className="send-banner-actions">
                            <button className="btn-primary" onClick={handleOpenMailClient}>
                                Open in Email Client
                            </button>
                            <button className="btn-secondary" onClick={handleCopyEmail}>
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                            <button className="btn-secondary" onClick={handlePrint}>
                                PDF
                            </button>
                        </div>
                    </div>

                    {/* Subject line */}
                    {email.subject && (
                        <div className="email-metadata" style={{ marginTop: '1.25rem' }}>
                            <div className="email-meta-row">
                                <span className="email-meta-label">Subject:</span>
                                <span className="email-meta-value">{email.subject}</span>
                            </div>
                        </div>
                    )}

                    {/* Email body document */}
                    <div className="email-document" style={{ marginTop: '1rem' }}>
                        <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8', fontSize: '0.95rem' }}>
                            {email.body}
                        </div>
                        {attachmentList.length > 0 && (
                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <strong>Attachments enclosed:</strong>
                                <ul style={{ margin: '0.5rem 0 0 1.25rem', lineHeight: '1.7' }}>
                                    {attachmentList.map((a, i) => (
                                        <li key={i}>{a.label} ({a.filename})</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: '1.5' }}>
                        Review carefully before sending. Replace any placeholders marked with [BRACKETS] with your actual information.
                    </p>
                </div>
            )}

            {/* Evidence & Attachments Tab */}
            {activeTab === 'evidence' && (
                <div className="dossier-tab-content">
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        Attach supporting documents below. Attached files will be referenced by name in your formal correspondence when you send via email.
                    </p>

                    <div className="evidence-list">
                        {checklist.map((item, idx) => {
                            const file = uploadedFiles[idx];
                            return (
                                <div key={idx} className={`evidence-upload-row ${file ? 'evidence-upload-row--attached' : ''}`}>
                                    <div className="evidence-upload-icon">
                                        {file ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#276749' }}>
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                                <polyline points="14,2 14,8 20,8"/>
                                                <polyline points="9,15 11,17 15,13" strokeWidth="2.5"/>
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                                <polyline points="14,2 14,8 20,8"/>
                                            </svg>
                                        )}
                                    </div>
                                    <div className="evidence-upload-body">
                                        <span className="evidence-upload-label">{item}</span>
                                        {file ? (
                                            <div className="evidence-file-attached">
                                                <span className="evidence-file-name">{file.name}</span>
                                                <button
                                                    className="evidence-file-remove"
                                                    onClick={() => handleRemoveFile(idx)}
                                                    aria-label="Remove file"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="evidence-upload-hint">No file attached</span>
                                        )}
                                    </div>
                                    <div className="evidence-upload-action">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            style={{ display: 'none' }}
                                            ref={el => { fileInputRefs.current[idx] = el; }}
                                            onChange={e => {
                                                const f = e.target.files?.[0];
                                                if (f) handleAttachFile(idx, f);
                                                e.target.value = '';
                                            }}
                                        />
                                        <button
                                            className={`evidence-upload-btn ${file ? 'evidence-upload-btn--replace' : ''}`}
                                            onClick={() => fileInputRefs.current[idx]?.click()}
                                        >
                                            {file ? 'Replace' : 'Attach ↑'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {attachmentList.length > 0 && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                            {attachmentList.length} file{attachmentList.length > 1 ? 's' : ''} attached — these will be listed in your email when you open in your email client.
                        </p>
                    )}
                </div>
            )}

            {/* Submit Claim — always visible */}
            <div className="dossier-filing-section">
                <div className="dossier-filing-inner">
                    <div>
                        <h4 style={{ marginBottom: '0.25rem' }}>Submit your claim</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            Once you've sent the formal correspondence, submit to begin tracking your case. We'll set a 30-day response deadline and alert you if no reply is received.
                        </p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={handleFinalSubmit}
                        style={{ whiteSpace: 'nowrap', padding: '0.75rem 2rem' }}
                    >
                        Submit Claim →
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          .case-sidebar, .case-references, .dossier-tabs, .send-banner, .dossier-filing-section { display: none !important; }
          .case-main { padding: 0 !important; }
          .email-document { border: none !important; padding: 0 !important; box-shadow: none !important; }
          .app-wrapper { background: white !important; }
        }
      `}} />
        </div>
    );
};

export default CaseDossier;
