import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { getRiskLabel } from '../utils/riskClassification';

function History() {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await API.get('/health/history?limit=50');
                setLogs(response.data.history || []);
            } catch (requestError) {
                if (requestError.response?.status === 401) navigate('/login');
                else setError('Unable to load your health history right now.');
            } finally { setLoading(false); }
        };
        loadHistory();
    }, [navigate]);

    const logout = async () => {
        await API.post('/auth/logout');
        navigate('/login');
    };
    const getScore = (log) => {
        const score = log.aiRiskScore ?? (log.aiRiskPrediction === 'High Risk' ? log.aiConfidence : 1 - log.aiConfidence);
        return Number.isFinite(Number(score)) ? Number((Number(score) * 100).toFixed(1)) : null;
    };
    const getRiskClass = (label) => label === 'High Risk' ? 'high' : label === 'Moderate Risk' ? 'moderate' : '';

    return (
        <div className="app-shell dashboard-layout">
            <aside className="sidebar">
                <div className="brand"><span className="brand-mark material-symbols-outlined">health_and_safety</span><span>HealthSync AI</span></div>
                <nav className="nav-list"><Link className="nav-link" to="/dashboard"><span className="material-symbols-outlined">dashboard</span><span>Overview</span></Link><Link className="nav-link active" to="/history"><span className="material-symbols-outlined">insights</span><span>Health history</span></Link><Link className="nav-link" to="/setup"><span className="material-symbols-outlined">person</span><span>Profile</span></Link></nav>
                <div className="sidebar-bottom"><button className="nav-link" onClick={logout}><span className="material-symbols-outlined">logout</span><span>Sign out</span></button></div>
            </aside>
            <main className="main-content"><header className="topbar"><div><div className="eyebrow">Your progress</div><h1>Health history</h1></div><div className="avatar">HS</div></header><section className="panel" style={{ marginBottom: 22 }}><div className="eyebrow">Consistency matters</div><h2 style={{ margin: '10px 0 6px' }}>Every check-in is a signal.</h2><p style={{ color: 'var(--muted)', margin: 0 }}>Review how your habits and model assessment change over time.</p></section>{loading ? <div className="empty-state">Loading your health signals…</div> : error ? <div className="empty-state" style={{ color: 'var(--danger)' }}>{error}</div> : logs.length === 0 ? <div className="empty-state">No daily logs yet. <Link to="/dashboard">Complete your first check-in →</Link></div> : <section className="history-list">{logs.map((log) => { const score = getScore(log); const label = score === null ? 'Unknown Risk' : getRiskLabel(score); const date = new Date(log.logDate); const dateLabel = Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); return <article className="history-card" key={log._id}><div><div className="eyebrow">{dateLabel}</div><h3>{Number(log.dailySteps || 0).toLocaleString()} steps <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· {log.sleepHours ?? '—'}h sleep</span></h3><p>{log.exerciseMinutes ?? '—'} min active · {log.waterIntake ?? '—'}L water · {log.screenTime ?? '—'}h screen time</p></div><span className={`risk-badge ${score === null ? '' : getRiskClass(label)}`}>{score === null ? label : `${label} · ${score}%`}</span></article>; })}</section>}</main>
        </div>
    );
}

export default History;
