import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await API.post('/auth/register', {
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password
            });
            localStorage.setItem('token', response.data.token);
            navigate('/setup');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to create your account.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <aside className="auth-visual">
                <div className="brand"><span className="brand-mark material-symbols-outlined">health_and_safety</span> HealthSync AI</div>
                <div className="visual-copy">
                    <div className="eyebrow" style={{ color: '#47e0ae' }}>A healthier baseline</div>
                    <h1>Small habits. Better outcomes.</h1>
                    <p>Build a private health profile, check in daily and get practical recommendations shaped around your real lifestyle.</p>
                </div>
                <div className="visual-stat"><div className="stat-pill"><strong>01</strong><span>create profile</span></div><div className="stat-pill"><strong>02</strong><span>log your day</span></div><div className="stat-pill"><strong>03</strong><span>grow healthier</span></div></div>
            </aside>
            <section className="auth-panel">
                <div className="auth-card">
                    <div className="eyebrow">Start your journey</div>
                    <h2>Create your health space</h2>
                    <p>One account for your profile, daily check-ins and personalized insights.</p>
                    {error && <div className="error-text" role="alert">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="field"><label htmlFor="name">Full name</label><input id="name" name="name" autoComplete="name" placeholder="Your full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                        <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
                        <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" placeholder="Create a secure password" minLength="8" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required /></div>
                        <button className="primary-btn full-btn" disabled={isLoading}>{isLoading ? 'Creating account…' : 'Create my account →'}</button>
                    </form>
                    <div className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></div>
                </div>
            </section>
        </main>
    );
}

export default Register;
