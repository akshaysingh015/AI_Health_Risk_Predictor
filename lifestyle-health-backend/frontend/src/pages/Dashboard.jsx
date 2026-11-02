import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { getRiskLabel } from '../utils/riskClassification';

const initialLog = { sleep: 7.5, steps: 10000, exercise: 45, screenTime: 4, stressLevel: 'Low', water: 3, junkFood: 0 };
const dailyFieldLimits = {
    sleep: [0, 24, '0–24 hours'],
    steps: [0, 100000, '0–100,000 steps'],
    exercise: [0, 1440, '0–1,440 minutes'],
    screenTime: [0, 24, '0–24 hours'],
    water: [0, 20, '0–20 liters'],
    junkFood: [0, 20, '0–20 occasions']
};

function Dashboard() {
    const navigate = useNavigate();
    const [dailyLog, setDailyLog] = useState(initialLog);
    const [result, setResult] = useState({ level: 'Not analyzed', score: null, modelScore: null, ruleScore: null });
    const [showCheckin, setShowCheckin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [targets, setTargets] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const loadLatest = async () => {
            try {
                const [response, targetResponse] = await Promise.all([
                    API.get('/health/history?limit=30'),
                    API.get('/users/targets')
                ]);
                const latest = response.data.history?.[0];
                setHistory(response.data.history || []);
                setTargets(targetResponse.data || null);
                if (!latest) return;
                const rawScore = latest.aiRiskScore ?? (latest.aiRiskPrediction === 'High Risk' ? latest.aiConfidence : 1 - latest.aiConfidence);
                const score = Number.isFinite(Number(rawScore)) ? Number((Number(rawScore) * 100).toFixed(1)) : null;
                setResult({
                    level: score === null ? 'Unknown Risk' : getRiskLabel(score),
                    score,
                    modelScore: latest.modelRiskScore,
                    ruleScore: latest.ruleBasedScore
                });
            } catch (requestError) {
                if (requestError.response?.status === 401) navigate('/login');
                else setLoadError('Some dashboard data could not be loaded. Please retry.');
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
            const invalidField = Object.entries(dailyFieldLimits).find(([field, [minimum, maximum]]) => {
                const value = Number(dailyLog[field]);
                return !Number.isFinite(value) || value < minimum || value > maximum;
            });
            if (invalidField) {
                const [field, [, , range]] = invalidField;
                throw new Error(`${field} must be within ${range}.`);
            }
            const response = await API.post('/users/daily-log', dailyLog);
            setResult({
                level: response.data.riskLevel,
                score: response.data.riskScore,
                modelScore: response.data.log.modelRiskScore,
                ruleScore: response.data.log.ruleBasedScore
            });
            setShowCheckin(false);
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || 'Unable to analyze this check-in.');
        } finally {
            setLoading(false);
        }
    };
    const logout = async () => {
        await API.post('/auth/logout');
        navigate('/login');
    };
    const riskScore = result.score ?? 0;
    const latestLog = history[0];
    const recommendations = latestLog && targets ? [
        [Number(latestLog.dailySteps) < Number(targets.steps), `Aim for ${targets.steps.toLocaleString()} steps today.`],
        [Number(latestLog.exerciseMinutes) < Number(targets.exercise), `Add ${Math.max(0, Number(targets.exercise) - Number(latestLog.exerciseMinutes))} minutes of movement.`],
        [Number(latestLog.screenTime) > Number(targets.screenTime), `Try to stay under ${targets.screenTime} hours of screen time.`],
        [Number(latestLog.waterIntake) < Number(targets.water), `Drink about ${targets.water} liters of water.`],
        [Number(latestLog.sleepHours) < Number(targets.sleep), `Protect a ${targets.sleep}-hour sleep window.`]
    ].filter(([needed]) => needed).slice(0, 3).map(([, text]) => text) : [];
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
                    <div className="panel risk-panel"><div><div className="eyebrow">Latest assessment</div><div className="risk-ring" style={{ '--score': `${riskScore}%` }}><strong>{result.score === null ? '—' : `${riskScore}%`}</strong></div>                    <div className="risk-label">{result.level}</div><div className="risk-subtitle">{result.score === null ? 'Complete your first check-in' : 'Estimated lifestyle risk score'}</div>{result.modelScore !== null && <div className="score-breakdown">ML model: {(result.modelScore * 100).toFixed(1)}% · Lifestyle rules: {(result.ruleScore * 100).toFixed(1)}%</div>}</div></div>
                </section>
                {result.score >= 60 && <div className="medical-alert" role="alert">
                    <strong>High estimate — please take care.</strong>
                    <span>This educational score is not a diagnosis. Arrange a conversation with a qualified healthcare professional. If you have severe or sudden symptoms such as chest pain, trouble breathing, fainting, or confusion, contact your local emergency services immediately.</span>
                </div>}
                <div className="section-heading"><h2>Signals that shape your score</h2><span>Updated from your latest check-in</span></div>
                <section className="metrics-grid">
                    {[['bedtime', dailyLog.sleep, 'hours sleep'], ['directions_walk', dailyLog.steps, 'daily steps'], ['fitness_center', dailyLog.exercise, 'minutes active'], ['water_drop', dailyLog.water, 'liters water']].map(([icon, value, label]) => <div className="metric-card" key={label}><div className="metric-icon material-symbols-outlined">{icon}</div><strong>{value}</strong><span>{label}</span></div>)}
                </section>
                {loadError && <div className="error-text" role="alert">{loadError} <button type="button" onClick={() => window.location.reload()}>Retry</button></div>}
                <div className="section-heading"><h2>Personalized next steps</h2><span>Compared with your saved targets</span></div>
                <section className="panel recommendation-panel">
                    {recommendations.length ? <ul>{recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul> : <p>{targets ? 'Your latest check-in is aligned with your saved targets.' : 'Set targets to receive personalized recommendations.'}</p>}
                </section>
                <div className="section-heading"><h2>Recent score trend</h2><span>Last 30 check-ins</span></div>
                <section className="panel trend-panel">
                    {history.length ? history.slice(0, 10).reverse().map((log) => {
                        const score = Number(log.aiRiskScore);
                        return <div className="trend-bar" key={log._id}><span style={{ height: `${Number.isFinite(score) ? Math.max(score * 100, 4) : 4}%` }} title={Number.isFinite(score) ? `${Math.round(score * 100)}%` : 'Unavailable'}></span></div>;
                    }) : <p>No trend data yet. Complete more check-ins to see progress.</p>}
                </section>
                <div className="section-heading"><h2>Build your health baseline</h2><span>Private and personalized</span></div>
                <section className="panel" style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}><div><h3 style={{ margin: 0 }}>Keep your profile current</h3><p style={{ color: 'var(--muted)', marginBottom: 0 }}>Your age, BMI and lifestyle context help the model interpret daily habits.</p></div><Link className="primary-btn" to="/setup">Review profile</Link></section>
                <p className="health-disclaimer"><strong>Important:</strong> This prototype score is an educational lifestyle estimate and is not medically validated or a medical diagnosis. Consult a qualified healthcare professional for medical concerns. Do not use this app for emergencies.</p>
                {showCheckin && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowCheckin(false)}><div className="modal"><div className="modal-header"><div><div className="eyebrow">Daily check-in</div><h2>How did today feel?</h2></div><button className="icon-btn" onClick={() => setShowCheckin(false)} aria-label="Close">×</button></div><p className="checkin-safety-note">Enter ordinary daily values only. This check-in cannot detect emergencies or diagnose illness; seek urgent medical help for severe symptoms.</p>{error && <div className="error-text" role="alert">{error}</div>}<form onSubmit={submitLog}><div className="checkin-grid">{[['sleep', 'Sleep hours', '0.5'], ['steps', 'Daily steps', '100'], ['exercise', 'Exercise minutes', '5'], ['screenTime', 'Screen time hours', '0.5'], ['water', 'Water intake (L)', '0.1'], ['junkFood', 'Junk food occasions', '1']].map(([name, label, step]) => { const [minimum, maximum, range] = dailyFieldLimits[name]; return <div className="field" key={name}><label htmlFor={name}>{label} <small>({range})</small></label><input id={name} name={name} type="number" step={step} min={minimum} max={maximum} value={dailyLog[name]} onChange={updateLog} required /></div>; })}</div><div className="field"><label htmlFor="stressLevel">Stress level</label><select id="stressLevel" name="stressLevel" value={dailyLog.stressLevel} onChange={updateLog}><option>Low</option><option>Moderate</option><option>High</option></select></div><button className="primary-btn full-btn" disabled={loading}>{loading ? 'Analyzing your signals…' : 'Analyze my day →'}</button></form></div></div>}
            </main>
        </div>
    );
}

export default Dashboard;
