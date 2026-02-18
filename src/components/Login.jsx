import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
        } catch (err) {
            setError(err.message || 'Authentication failed. Please check your credentials.');
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
                    Welcome Back
                </h2>
                <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem' }}>
                    Access your legal strategies.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
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
                        {loading ? 'Processing...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                        Don't have an account?
                        <button
                            onClick={() => navigate('/signup')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-gold)',
                                fontWeight: 600,
                                marginLeft: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            Sign Up
                        </button>
                    </p>
                    <button
                        onClick={() => navigate('/')}
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

export default Login;
