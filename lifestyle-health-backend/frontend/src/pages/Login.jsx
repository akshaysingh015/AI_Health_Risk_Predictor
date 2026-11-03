import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';

function AuthVisual() {
    return (
        <aside className="auth-visual">
            <div className="brand"><span className="brand-mark material-symbols-outlined">health_and_safety</span> HealthSync AI</div>
            <div className="visual-copy">
                <div className="eyebrow" style={{ color: '#47e0ae' }}>Lifestyle intelligence</div>
                <h1>Know your habits. Change your future.</h1>
                <p>Turn everyday signals like sleep, movement, stress and nutrition into a clear, personalized health direction.</p>
            </div>
            <div className="visual-stat">
                <div className="stat-pill"><strong>7</strong><span>daily signals</span></div>
                <div className="stat-pill"><strong>AI</strong><span>habit analysis</span></div>
                <div className="stat-pill"><strong>24/7</strong><span>your health view</span></div>
            </div>
        </aside>
    );
}

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await API.post('/auth/login', {
                email: formData.email.trim(),
                password: formData.password
            });
            navigate('/setup');
        } catch (requestError) {
            const retryAfter = requestError.response?.headers?.['retry-after'];
            const retryMessage = retryAfter
                ? ` Please try again in about ${Math.ceil(Number(retryAfter) / 60)} minutes.`
                : '';
            const message = requestError.code === 'ECONNABORTED'
                ? 'The server took too long to respond. Please try again.'
                : !API.defaults.baseURL
                    ? 'The backend URL is not configured for this deployment.'
                : !requestError.response
                    ? 'Cannot connect to the server. Please start the backend and try again.'
                    : requestError.response.data?.message || 'Unable to sign in. Please check your details.';
            setError(message + retryMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <AuthVisual />
            <section className="auth-panel">
                <div className="auth-card">
                    <div className="eyebrow">Welcome back</div>
                    <h2>Sign in to your health space</h2>
                    <p>Your daily insights and progress are waiting for you.</p>
                    {error && <div className="error-text" role="alert">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="field">
                            <label htmlFor="email">Email address</label>
                            <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                        </div>
                        <div className="field">
                            <label htmlFor="password">Password</label>
                            <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                        </div>
                        <button className="primary-btn full-btn" disabled={isLoading}>{isLoading ? 'Signing in…' : 'Continue to dashboard →'}</button>
                    </form>
                    <div className="auth-footer">New to HealthSync AI? <Link to="/register">Create your account</Link></div>
                </div>
            </section>
        </main>
    );
}

export default Login;
