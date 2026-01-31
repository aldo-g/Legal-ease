import { useState } from 'react';
import { AgentService } from '../utils/AgentService';

const CaseIntake = ({ onComplete }) => {
    const [complaint, setComplaint] = useState('');
    const [status, setStatus] = useState('idle'); // idle, researching, assessment, generating
    const [researchResult, setResearchResult] = useState(null);
    const [extraInfo, setExtraInfo] = useState({});
    const [error, setError] = useState(null);

    const handleStartAssessment = async () => {
        if (!complaint.trim()) return;
        setError(null);
        setStatus('researching');
        try {
            const result = await AgentService.researchComplaint(complaint);
            setResearchResult(result);
            setStatus('assessment');
        } catch (err) {
            setError(err.message || "An error occurred during incident categorization.");
            setStatus('idle');
        }
    };

    const handleInfoChange = (id, value) => {
        setExtraInfo(prev => ({ ...prev, [id]: value }));
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

    return (
        <div className="case-intake-flow">
            {/* 01. Initial Incident Description */}
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

            {/* 02. Assessment Phase */}
            {status === 'researching' && (
                <div style={{ padding: '2rem', textAlign: 'center', border: '1px solid var(--border-subtle)', background: 'white' }}>
                    <div className="status-tag">Analyzing Provided Data...</div>
                    <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>Cross-referencing incident details with regulatory frameworks.</p>
                </div>
            )}

            {researchResult && (
                <section className="dossier-step">
                    <h3>02. Structured Assessment</h3>
                    <div style={{ padding: '1.5rem', background: '#fcfcfc', border: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
                        <div className="sidebar-heading" style={{ margin: 0 }}>System Findings</div>
                        <p style={{ margin: '1rem 0', lineHeight: '1.6' }}>{researchResult.summary}</p>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        To complete the dossier, the following specific evidentiary points are required:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {researchResult.requiredInfo.map(field => (
                            <div key={field.id}>
                                <label className="metadata-label" style={{ marginBottom: '0.5rem' }}>{field.label.toUpperCase()}</label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        onChange={(e) => handleInfoChange(field.id, e.target.value)}
                                        placeholder={field.placeholder}
                                    />
                                ) : (
                                    <input
                                        type={field.type || 'text'}
                                        placeholder={field.placeholder}
                                        onChange={(e) => handleInfoChange(field.id, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <button
                            className="btn-primary"
                            onClick={handleFinalizeDossier}
                            disabled={status === 'generating'}
                            style={{ width: '100%' }}
                        >
                            {status === 'generating' ? "Processing Dossier..." : "Finalize Assessment & Generate Correspondence"}
                        </button>
                    </div>
                </section>
            )}

            {error && (
                <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #7b2c2c', background: '#fff5f5', color: '#7b2c2c', fontSize: '0.875rem' }}>
                    <strong>System Error:</strong> {error}
                </div>
            )}
        </div>
    );
};

export default CaseIntake;
