import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';

const LoginSignup = ({ onBack }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(name, email, password);
            }
        } catch (err) {
            setError('Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            padding: '2rem'
        }}>
            <div className="glass auth-card" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '3rem',
                textAlign: 'center'
            }}>
                <h2 className="gold-text" style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem' }}>
                    {isLogin ? 'Access your legal strategies.' : 'Identify your rights with AI.'}
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {!isLogin && (
                        <div className="input-group">
                            <label className="input-label" style={{ textAlign: 'left', display: 'block' }}>Full Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="input-group">
                        <label className="input-label" style={{ textAlign: 'left', display: 'block' }}>Email Address</label>
                        <input
                            type="email"
                            placeholder="john@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label" style={{ textAlign: 'left', display: 'block' }}>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{error}</p>
                    )}

                    <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '1rem', width: '100%' }}>
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </form>

                <div style={{ marginTop: '2rem' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-gold)',
                                fontWeight: 600,
                                marginLeft: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-dim)',
                            marginTop: '1.5rem',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        ← Back to Landing Page
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginSignup;
