import React from 'react';

const CaseDossier = ({ plan, info, research, onSubmit, onRestart }) => {
    if (!plan) return null;

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
            {/* 01. Assessment Summary */}
            <section className="dossier-step">
                <h3 style={{ borderBottom: '2px solid var(--accent-primary)', paddingBottom: '0.5rem' }}>03. Assessment Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                    <div>
                        <div className="sidebar-heading">Identified Framework</div>
                        <p style={{ fontWeight: 600 }}>{research.baseJustification}</p>
                    </div>
                    <div>
                        <div className="sidebar-heading">Case Status</div>
                        <p className="status-tag status-active">Ready for Submission</p>
                    </div>
                </div>
                <p style={{ marginTop: '1.5rem', lineHeight: '1.6', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    {research.summary}
                </p>
            </section>

            {/* 02. Procedural Strategy */}
            <section className="dossier-step" style={{ marginTop: '3rem' }}>
                <h3>04. Recommended Procedural Framework</h3>
                <div style={{ background: '#f8f9fa', padding: '1.5rem', border: '1px solid var(--border-subtle)', marginTop: '1.5rem' }}>
                    <div className="sidebar-heading">Strategy Guidelines</div>
                    <p style={{ whiteSpace: 'pre-line', lineHeight: '1.7', fontSize: '0.95rem' }}>
                        {plan.strategy}
                    </p>
                </div>
            </section>

            {/* 03. Formal Correspondence */}
            <section className="dossier-step" style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--accent-primary)', paddingBottom: '0.5rem' }}>
                    <h3>05. Formal Correspondence Draft</h3>
                    <button className="btn-secondary" onClick={handlePrint} style={{ fontSize: '0.8rem' }}>Print to PDF</button>
                </div>

                <div className="correspondence-document" style={{
                    background: 'white',
                    border: '1px solid var(--border-strong)',
                    padding: '4rem',
                    marginTop: '1.5rem',
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8', fontSize: '1rem' }}>
                        {plan.email}
                    </div>
                </div>
            </section>

            {/* 04. Evidence Checklist */}
            <section className="dossier-step" style={{ marginTop: '3rem' }}>
                <h3>06. Required Evidentiary Documentation</h3>
                <ul style={{ listStyle: 'none', marginTop: '1rem' }}>
                    {plan.checklist.map((item, idx) => (
                        <li key={idx} style={{
                            padding: '1rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            fontSize: '0.95rem'
                        }}>
                            <input type="checkbox" style={{ width: 'auto' }} />
                            {item}
                        </li>
                    ))}
                </ul>
            </section>

            {/* 05. Submission Confirmation */}
            <section className="dossier-step" style={{ marginTop: '4rem', paddingBottom: '6rem', borderTop: '2px solid var(--accent-primary)', paddingTop: '2rem' }}>
                <h3>07. Procedural Filing Confirmation</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                    Once you have formally sent the correspondence above and gathered the required evidence, acknowledge the filing below to transition the case to active monitoring.
                </p>
                <button className="btn-primary" onClick={handleFinalSubmit} style={{ width: '100%', padding: '1rem' }}>
                    Finalize & Mark as Filed
                </button>
            </section>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          .case-sidebar, .case-references, .btn-secondary, h3, .sidebar-heading, .status-tag { display: none !important; }
          .case-main { padding: 0 !important; }
          .correspondence-document { border: none !important; padding: 0 !important; box-shadow: none !important; }
          .app-wrapper { background: white !important; }
        }
      `}} />
        </div>
    );
};

export default CaseDossier;
