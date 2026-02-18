import { useState } from 'react';
import { AgentService } from '../utils/AgentService';

const CaseIntake = ({ onComplete, onSaveProgress, initialComplaint, initialResearch }) => {
    const [complaint, setComplaint] = useState(initialComplaint || '');
    const hasExistingResearch = !!initialResearch;
    const [status, setStatus] = useState(hasExistingResearch ? 'assessment' : 'idle');
    const [researchResult, setResearchResult] = useState(initialResearch || null);
    const [extraInfo, setExtraInfo] = useState({});
    const [error, setError] = useState(null);

    const handleStartAssessment = async () => {
        if (!complaint.trim()) return;
        setError(null);
        setStatus('researching');
        try {
            const result = await AgentService.researchComplaint(complaint);
            setResearchResult(result);
            setStatus('saving');

            // Save to Supabase and navigate to case screen
            if (onSaveProgress) {
                await onSaveProgress({
                    complaintText: complaint,
                    research: result,
                });
            }
            // If we're still mounted (e.g. save failed), fall back to assessment
            setStatus('assessment');
        } catch (err) {
            setError(err.message || "An error occurred during incident categorization.");
            setStatus('idle');
        }
    };

    const handleInfoChange = (id, value) => {
        setExtraInfo(prev => {
            const updated = { ...prev, [id]: value };
            if (onSaveProgress) {
                onSaveProgress({ formData: updated });
            }
            return updated;
        });
    };

    const handleFinalizeDossier = async () => {
        setError(null);
        setStatus('generating');
        try {
            const plan = await AgentService.generatePressurePlan(researchResult.type, extraInfo, researchResult);
            onComplete(plan, extraInfo, researchResult);
        } catch (err) {
            setError(err.message || "An error occurred during dossier finalization.");
            setStatus('assessment');
        }
    };

    // Full-screen loading states
    if (status === 'researching' || status === 'saving' || status === 'generating') {
        const loadingConfig = {
            researching: {
                title: 'Analyzing Incident',
                description: 'Cross-referencing incident details with applicable regulatory frameworks...',
                steps: [
                    { label: 'Incident received', state: 'completed' },
                    { label: 'Regulatory analysis', state: 'active' },
                    { label: 'Creating case record', state: 'pending' },
                ],
            },
            saving: {
                title: 'Creating Case File',
                description: 'Saving case data and generating reference ID...',
                steps: [
                    { label: 'Incident received', state: 'completed' },
                    { label: 'Regulatory analysis', state: 'completed' },
                    { label: 'Creating case record', state: 'active' },
                ],
            },
            generating: {
                title: 'Generating Case Dossier',
                description: 'Building procedural strategy and drafting formal correspondence...',
                steps: [
                    { label: 'Evidence compiled', state: 'completed' },
                    { label: 'Procedural strategy', state: 'active' },
                    { label: 'Drafting correspondence', state: 'pending' },
                    { label: 'Finalizing dossier', state: 'pending' },
                ],
            },
        };

        const config = loadingConfig[status];

        return (
            <div className="intake-loading-screen">
                <div className="intake-loading-content">
                    <div className="intake-loading-spinner" />
                    <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem' }}>
                        {config.title}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', lineHeight: '1.6' }}>
                        {config.description}
                    </p>
                    <div className="intake-loading-steps">
                        {config.steps.map((step, i) => (
                            <div key={i} className={`intake-loading-step ${step.state}`}>
                                <span className="intake-step-dot" />
                                <span>{step.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Assessment view — case exists, research is done, need additional info
    if (status === 'assessment' && researchResult) {
        return (
            <div className="case-intake-flow">
                {/* Incident summary — collapsed */}
                <section className="intake-summary-card">
                    <div className="intake-summary-header">
                        <div className="sidebar-heading" style={{ margin: 0 }}>Incident Description</div>
                        <span className="status-tag status-active">Analyzed</span>
                    </div>
                    <p className="intake-summary-text">{complaint}</p>
                </section>

                {/* Research findings */}
                <section className="dossier-step">
                    <h3>Regulatory Assessment</h3>
                    <div className="intake-findings-card">
                        <div className="intake-findings-header">
                            <div>
                                <div className="sidebar-heading" style={{ margin: 0 }}>Applicable Framework</div>
                                <p style={{ fontWeight: 600, fontSize: '1rem', marginTop: '0.25rem' }}>{researchResult.baseJustification}</p>
                            </div>
                            <div>
                                <div className="sidebar-heading" style={{ margin: 0 }}>Category</div>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.25rem', fontFamily: 'monospace' }}>{researchResult.type}</p>
                            </div>
                        </div>
                        <p style={{ marginTop: '1rem', lineHeight: '1.7', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {researchResult.summary}
                        </p>
                    </div>
                </section>

                {/* Potential compensation areas */}
                {researchResult.compensationAreas && researchResult.compensationAreas.length > 0 && (
                    <section className="dossier-step" style={{ marginTop: '0.5rem' }}>
                        <h3>Potential Compensation</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Based on the applicable regulatory framework, the following areas of remedy may be available.
                        </p>
                        <div className="compensation-grid">
                            {researchResult.compensationAreas.map((area, idx) => (
                                <div key={idx} className="compensation-card">
                                    <div className="compensation-card-header">
                                        <span className="compensation-title">{area.title}</span>
                                        {area.estimate && (
                                            <span className="compensation-estimate">{area.estimate}</span>
                                        )}
                                    </div>
                                    <p className="compensation-description">{area.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Required information form */}
                <section className="dossier-step" style={{ marginTop: '0.5rem' }}>
                    <h3>Supporting Evidence</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Provide the following details to generate your formal correspondence and case dossier.
                    </p>

                    <div className="intake-form-grid">
                        {researchResult.requiredInfo.map(field => (
                            <div key={field.id} className={`intake-form-field ${field.type === 'textarea' ? 'intake-form-field-full' : ''}`}>
                                <label className="metadata-label" style={{ marginBottom: '0.5rem' }}>{field.label.toUpperCase()}</label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        onChange={(e) => handleInfoChange(field.id, e.target.value)}
                                        placeholder={field.placeholder}
                                        value={extraInfo[field.id] || ''}
                                    />
                                ) : (
                                    <input
                                        type={field.type || 'text'}
                                        placeholder={field.placeholder}
                                        onChange={(e) => handleInfoChange(field.id, e.target.value)}
                                        value={extraInfo[field.id] || ''}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <button
                            className="btn-primary"
                            onClick={handleFinalizeDossier}
                            disabled={status === 'generating'}
                            style={{ width: '100%', padding: '0.75rem' }}
                        >
                            {status === 'generating' ? "Generating Dossier..." : "Finalize & Generate Correspondence"}
                        </button>
                    </div>
                </section>

                {error && (
                    <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #7b2c2c', background: '#fff5f5', color: '#7b2c2c', fontSize: '0.875rem' }}>
                        <strong>System Error:</strong> {error}
                    </div>
                )}
            </div>
        );
    }

    // Initial state — no research yet
    return (
        <div className="case-intake-flow">
            <section className="dossier-step">
                <h3>01. Primary Incident Description</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Provide a factual account of the disruption. Include dates, locations, and the nature of the failure.
                </p>
                <textarea
                    placeholder="Enter incident details..."
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    disabled={status !== 'idle'}
                    style={{ height: '160px', marginBottom: '1.5rem' }}
                />

                {status === 'idle' && (
                    <button className="btn-primary" onClick={handleStartAssessment}>
                        Submit for Categorization
                    </button>
                )}
            </section>

            {error && (
                <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #7b2c2c', background: '#fff5f5', color: '#7b2c2c', fontSize: '0.875rem' }}>
                    <strong>System Error:</strong> {error}
                </div>
            )}
        </div>
    );
};

export default CaseIntake;
