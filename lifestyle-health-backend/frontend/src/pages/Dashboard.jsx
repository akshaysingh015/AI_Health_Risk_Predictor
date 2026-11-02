import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';

const initialLog = { sleep: 7.5, steps: 10000, exercise: 45, screenTime: 4, stressLevel: 'Low', water: 3, junkFood: 0 };

function Dashboard() {
    const navigate = useNavigate();
    const [dailyLog, setDailyLog] = useState(initialLog);
    const [result, setResult] = useState({ level: 'Not analyzed', score: null });
    const [showCheckin, setShowCheckin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadLatest = async () => {
            try {
                const response = await API.get('/health/history');
                const latest = response.data.history?.[0];
                if (!latest) return;
                const score = Number(((latest.aiRiskScore ?? (latest.aiRiskPrediction === 'High Risk' ? latest.aiConfidence : 1 - latest.aiConfidence)) * 100).toFixed(1));
                setResult({ level: latest.aiRiskPrediction, score });
            } catch (requestError) {
                if (requestError.response?.status === 401) navigate('/login');
            }
        };
        loadLatest();
    }, [navigate]);

    const updateLog = (event) => setDailyLog({ ...dailyLog, [event.target.name]: event.target.value });
    const submitLog = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await API.post('/users/daily-log', dailyLog);
            setResult({ level: response.data.riskLevel, score: response.data.riskScore });
            setShowCheckin(false);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to analyze this check-in.');
        } finally {
            setLoading(false);
        }
    };
    const logout = () => { localStorage.removeItem('token'); navigate('/login'); };
    const riskScore = result.score ?? 0;
    return (
        <div className="app-shell dashboard-layout">
            <aside className="sidebar">
                <div className="brand"><span className="brand-mark material-symbols-outlined">health_and_safety</span><span>HealthSync AI</span></div>
                <nav className="nav-list">
                    <Link className="nav-link active" to="/dashboard"><span className="material-symbols-outlined">dashboard</span><span>Overview</span></Link>
                    <Link className="nav-link" to="/history"><span className="material-symbols-outlined">insights</span><span>Health history</span></Link>
                    <Link className="nav-link" to="/setup"><span className="material-symbols-outlined">person</span><span>Profile</span></Link>
                </nav>
                <div className="sidebar-bottom"><button className="nav-link" onClick={logout}><span className="material-symbols-outlined">logout</span><span>Sign out</span></button></div>
            </aside>
            <main className="main-content">
                <header className="topbar"><div><div className="eyebrow">Personal health intelligence</div><h1>Your daily overview</h1></div><div className="avatar">HS</div></header>
                <section className="hero-grid">
                    <div className="panel hero-panel"><div className="eyebrow" style={{ color: '#b8f5df' }}>Your next best action</div><h2>Make today a little healthier.</h2><p>Log your lifestyle signals and let the model turn them into a simple, actionable direction.</p><button className="soft-btn" onClick={() => setShowCheckin(true)}>Open daily check-in <span aria-hidden="true">→</span></button></div>
                    <div className="panel risk-panel"><div><div className="eyebrow">Latest assessment</div><div className="risk-ring" style={{ '--score': `${riskScore}%` }}><strong>{result.score === null ? '—' : `${riskScore}%`}</strong></div><div className="risk-label">{result.level}</div><div className="risk-subtitle">{result.score === null ? 'Complete your first check-in' : 'Estimated lifestyle risk score'}</div></div></div>
                </section>
                <div className="section-heading"><h2>Signals that shape your score</h2><span>Updated from your latest check-in</span></div>
                <section className="metrics-grid">
                    {[['bedtime', dailyLog.sleep, 'hours sleep'], ['directions_walk', dailyLog.steps, 'daily steps'], ['fitness_center', dailyLog.exercise, 'minutes active'], ['water_drop', dailyLog.water, 'liters water']].map(([icon, value, label]) => <div className="metric-card" key={label}><div className="metric-icon material-symbols-outlined">{icon}</div><strong>{value}</strong><span>{label}</span></div>)}
                </section>
                <div className="section-heading"><h2>Build your health baseline</h2><span>Private and personalized</span></div>
                <section className="panel" style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}><div><h3 style={{ margin: 0 }}>Keep your profile current</h3><p style={{ color: 'var(--muted)', marginBottom: 0 }}>Your age, BMI and lifestyle context help the model interpret daily habits.</p></div><Link className="primary-btn" to="/setup">Review profile</Link></section>
                {showCheckin && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowCheckin(false)}><div className="modal"><div className="modal-header"><div><div className="eyebrow">Daily check-in</div><h2>How did today feel?</h2></div><button className="icon-btn" onClick={() => setShowCheckin(false)} aria-label="Close">×</button></div>{error && <div className="error-text" role="alert">{error}</div>}<form onSubmit={submitLog}><div className="checkin-grid">{[['sleep', 'Sleep hours', 'number', '0.5'], ['steps', 'Daily steps', 'number', '100'], ['exercise', 'Exercise minutes', 'number', '5'], ['screenTime', 'Screen time hours', 'number', '0.5'], ['water', 'Water intake (L)', 'number', '0.1'], ['junkFood', 'Junk food occasions', 'number', '1']].map(([name, label, type, step]) => <div className="field" key={name}><label htmlFor={name}>{label}</label><input id={name} name={name} type={type} step={step} min="0" value={dailyLog[name]} onChange={updateLog} required /></div>)}</div><div className="field"><label htmlFor="stressLevel">Stress level</label><select id="stressLevel" name="stressLevel" value={dailyLog.stressLevel} onChange={updateLog}><option>Low</option><option>Moderate</option><option>High</option></select></div><button className="primary-btn full-btn" disabled={loading}>{loading ? 'Analyzing your signals…' : 'Analyze my day →'}</button></form></div></div>}
            </main>
        </div>
    );
}

export default Dashboard;
