import React from 'react';
import { LANDING_CONTENT, CURRENT_MODE } from '../config/landingContent';
import '../App.css'; // We'll append styles to App.css as planned

const LandingPage = ({ onStart, onLogin, onOverview, showOverview }) => {
    const content = LANDING_CONTENT[CURRENT_MODE];

    return (
        <div className="landing-page">
            <nav className="landing-navbar">
                <div className="nav-container">
                    <div className="logo h2">LEGAL EASE</div>
                    <div className="nav-links">
                        <button className="btn-secondary nav-btn" onClick={onLogin}>Sign In</button>
                    </div>
                </div>
            </nav>

            <header className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">Consumer Rights Automation</div>
                    <h1>{content.hero.title}</h1>
                    <p>{content.hero.subtitle}</p>
                    <div className="hero-actions">
                        <button className="btn-primary" onClick={onStart}>{content.hero.cta}</button>
                        {showOverview && (
                            <button className="btn-secondary" onClick={onOverview}>View My Claims</button>
                        )}
                    </div>
                </div>
            </header>

            <section className="features-section">
                <div className="features-grid">
                    {content.features.map((feature, index) => (
                        <div key={index} className="feature-card">
                            <div className="feature-icon">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="disclaimer-banner">
                <p><strong>Notice:</strong> Legal Ease is an automated procedural assistant, not a law firm. We do not provide legal advice.</p>
            </div>
        </div>
    );
};

export default LandingPage;
