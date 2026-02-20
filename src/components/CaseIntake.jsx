import { useState } from 'react';
import { AgentService } from '../utils/AgentService';

// Classify a field into step 2A (flight identity) or 2B (timing/route)
function classifyField(field) {
    const id = field.id.toLowerCase();
    const label = field.label.toLowerCase();
    const flightKeywords = ['flight', 'booking', 'reference', 'pnr', 'ticket', 'date', 'passenger', 'name', 'carrier', 'airline'];
    const isFlightStep = flightKeywords.some(k => id.includes(k) || label.includes(k));
    return isFlightStep ? 'A' : 'B';
}

const LOADING_CONFIG = {
    researching: {
        title: 'Checking eligibility',
        description: 'Identifying the applicable passenger rights regulation for your route...',
        steps: [
            { label: 'Incident received', state: 'completed' },
            { label: 'Eligibility check', state: 'active' },
            { label: 'Saving your case', state: 'pending' },
        ],
    },
    saving: {
        title: 'Creating your case',
        description: 'Saving your details and generating a case reference...',
        steps: [
            { label: 'Incident received', state: 'completed' },
            { label: 'Eligibility check', state: 'completed' },
            { label: 'Saving your case', state: 'active' },
        ],
    },
    generating: {
        title: 'Calculating your claim',
        description: 'Generating your formal correspondence and procedural strategy...',
        steps: [
            { label: 'Details verified', state: 'completed' },
            { label: 'Building strategy', state: 'active' },
            { label: 'Drafting correspondence', state: 'pending' },
            { label: 'Finalising dossier', state: 'pending' },
        ],
    },
};

const CaseIntake = ({ onComplete, onSaveProgress, initialComplaint, initialResearch }) => {
    const [complaint, setComplaint] = useState(initialComplaint || '');
    const hasExistingResearch = !!initialResearch;
    const [status, setStatus] = useState(hasExistingResearch ? 'assessment' : 'idle');
    const [researchResult, setResearchResult] = useState(initialResearch || null);
    const [formStep, setFormStep] = useState('A'); // 'A' = flight identity, 'B' = timing/route
    const [extraInfo, setExtraInfo] = useState(initialResearch?.suggestedValues
        ? Object.fromEntries(Object.entries(initialResearch.suggestedValues).filter(([, v]) => v !== null))
        : {});
    const [error, setError] = useState(null);

    const handleStartAssessment = async () => {
        if (!complaint.trim()) return;
        setError(null);
        setStatus('researching');
        try {
            const result = await AgentService.researchComplaint(complaint);
            setResearchResult(result);
            if (result.suggestedValues) {
                setExtraInfo(Object.fromEntries(
                    Object.entries(result.suggestedValues).filter(([, v]) => v !== null)
                ));
            }
            setStatus('saving');
            if (onSaveProgress) {
                await onSaveProgress({ complaintText: complaint, research: result });
            }
            setStatus('assessment');
        } catch (err) {
            setError(err.message || 'An error occurred during eligibility check.');
            setStatus('idle');
        }
    };

    const handleInfoChange = (id, value) => {
        setExtraInfo(prev => {
            const updated = { ...prev, [id]: value };
            if (onSaveProgress) onSaveProgress({ formData: updated });
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
            setError(err.message || 'An error occurred during claim calculation.');
            setStatus('assessment');
        }
    };

    // Loading screen
    if (status === 'researching' || status === 'saving' || status === 'generating') {
        const config = LOADING_CONFIG[status];
        return (
            <div className="intake-loading-screen">
                <div className="intake-loading-content">
                    <div className="intake-loading-spinner" />
                    <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem' }}>{config.title}</h3>
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

    // Assessment view — two-step form
    if (status === 'assessment' && researchResult) {
        const fieldsA = researchResult.requiredInfo.filter(f => classifyField(f) === 'A');
        const fieldsB = researchResult.requiredInfo.filter(f => classifyField(f) === 'B');

        // If all fields classify the same way, split evenly
        const stepAFields = fieldsA.length > 0 ? fieldsA : researchResult.requiredInfo.slice(0, Math.ceil(researchResult.requiredInfo.length / 2));
        const stepBFields = fieldsB.length > 0 ? fieldsB : researchResult.requiredInfo.slice(Math.ceil(researchResult.requiredInfo.length / 2));

        const renderField = (field) => (
            <div key={field.id} className={`intake-form-field ${field.type === 'textarea' ? 'intake-form-field-full' : ''}`}>
                <label className="intake-field-label">{field.label}</label>
                {field.type === 'textarea' ? (
                    <textarea
                        onChange={(e) => handleInfoChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        value={extraInfo[field.id] || ''}
                        rows={3}
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
        );

        return (
            <div className="case-intake-flow">
                {/* Incident summary pill */}
                <div className="intake-summary-card">
                    <div className="intake-summary-header">
                        <div className="sidebar-heading" style={{ margin: 0 }}>Your description</div>
                        <span className="status-tag status-active">Received</span>
                    </div>
                    <p className="intake-summary-text">{complaint}</p>
                </div>

                {/* Eligibility statement — legally safe */}
                <div className="intake-eligibility-notice">
                    <p>
                        Based on the information provided, you may be entitled to compensation or reimbursement under applicable passenger rights regulations. We'll calculate your potential claim once we verify your flight details.
                    </p>
                </div>

                {/* Progress indicator */}
                <div className="intake-progress-bar">
                    <div className="intake-progress-step completed">
                        <span className="intake-progress-dot" />
                        <span>Describe incident</span>
                    </div>
                    <div className="intake-progress-connector" />
                    <div className={`intake-progress-step ${formStep === 'A' ? 'active' : 'completed'}`}>
                        <span className="intake-progress-dot" />
                        <span>Identify your flight</span>
                    </div>
                    <div className="intake-progress-connector" />
                    <div className={`intake-progress-step ${formStep === 'B' ? 'active' : ''}`}>
                        <span className="intake-progress-dot" />
                        <span>Confirm timing</span>
                    </div>
                    <div className="intake-progress-connector" />
                    <div className="intake-progress-step">
                        <span className="intake-progress-dot" />
                        <span>Calculate claim</span>
                    </div>
                </div>

                {/* Step 2A — Flight identity */}
                {formStep === 'A' && (
                    <div className="intake-form-step">
                        <div className="intake-step-header">
                            <h3>Identify your flight</h3>
                            <p>Enter the details from your booking confirmation.</p>
                        </div>
                        <div className="intake-form-grid">
                            {stepAFields.map(renderField)}
                        </div>
                        <div className="intake-step-footer">
                            <button
                                className="btn-primary"
                                onClick={() => setFormStep('B')}
                                style={{ minWidth: '160px' }}
                            >
                                Continue →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2B — Timing & route */}
                {formStep === 'B' && (
                    <div className="intake-form-step">
                        <div className="intake-step-header">
                            <h3>Confirm timing & route</h3>
                            <p>Arrival delay is the primary eligibility factor under passenger rights regulations.</p>
                        </div>
                        <div className="intake-form-grid">
                            {stepBFields.map(renderField)}
                        </div>
                        <div className="intake-step-footer">
                            <button className="btn-secondary" onClick={() => setFormStep('A')}>
                                ← Back
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleFinalizeDossier}
                                style={{ minWidth: '200px' }}
                            >
                                Calculate My Claim →
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #7b2c2c', background: '#fff5f5', color: '#7b2c2c', fontSize: '0.875rem' }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}
            </div>
        );
    }

    // Step 1 — initial complaint
    return (
        <div className="case-intake-flow">
            {/* Progress indicator */}
            <div className="intake-progress-bar">
                <div className="intake-progress-step active">
                    <span className="intake-progress-dot" />
                    <span>Describe incident</span>
                </div>
                <div className="intake-progress-connector" />
                <div className="intake-progress-step">
                    <span className="intake-progress-dot" />
                    <span>Identify your flight</span>
                </div>
                <div className="intake-progress-connector" />
                <div className="intake-progress-step">
                    <span className="intake-progress-dot" />
                    <span>Confirm timing</span>
                </div>
                <div className="intake-progress-connector" />
                <div className="intake-progress-step">
                    <span className="intake-progress-dot" />
                    <span>Calculate claim</span>
                </div>
            </div>

            <div className="intake-form-step">
                <div className="intake-step-header">
                    <h3>What happened?</h3>
                    <p>Describe the disruption in your own words — include the airline, route, and what went wrong.</p>
                </div>
                <textarea
                    placeholder="e.g. My flight from Lisbon to Amsterdam with SATA Air Azores on 12 December was delayed by 4 hours due to a missed connection..."
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    disabled={status !== 'idle'}
                    style={{ height: '160px', marginBottom: '0' }}
                />
                <div className="intake-step-footer">
                    <button
                        className="btn-primary"
                        onClick={handleStartAssessment}
                        disabled={!complaint.trim()}
                        style={{ minWidth: '200px' }}
                    >
                        Check Eligibility →
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #7b2c2c', background: '#fff5f5', color: '#7b2c2c', fontSize: '0.875rem' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}
        </div>
    );
};

export default CaseIntake;
