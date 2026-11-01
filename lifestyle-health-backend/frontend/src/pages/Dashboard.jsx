import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BookAppointmentButton from '../components/BookAppointmentButton';
import API from '../services/api';

function Dashboard() {
    const navigate = useNavigate();
    const [showNav, setShowNav] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    
    // Check local storage to see if we already did the check-in today
    const [showDailyPrompt, setShowDailyPrompt] = useState(() => {
        return localStorage.getItem('dailyCompleted') !== 'true';
    }); 
    const [showAdjustment, setShowAdjustment] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Grab today's result from history if it exists to display dynamically
    const [todayResult, setTodayResult] = useState(() => {
        if (localStorage.getItem('dailyCompleted') === 'true') {
            const history = JSON.parse(localStorage.getItem('healthHistory')) || [];
            if (history.length > 0) return { level: history[0].riskLevel, score: history[0].riskScore };
        }
        return { level: 'Not analyzed', score: null };
    });

    const [dailyLog, setDailyLog] = useState({
        sleep: 7.5,
        steps: 10000,
        exercise: 45,
        screenTime: 4.0,
        stressLevel: 'Low',
        water: 3.0,
        junkFood: 0
    });

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('dailyCompleted'); // Reset for testing
        navigate('/login');
    };

    const saveToHistory = (logData, riskLevel, riskScore) => {
        const newEntry = {
            id: Date.now(),
            // Add the exact time so you can distinguish between them!
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
                  " at " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            ...logData,
            riskLevel: riskLevel,
            riskScore: riskScore
        };

        const existingHistory = JSON.parse(localStorage.getItem('healthHistory')) || [];
        // Add the new entry at the START of the array
        localStorage.setItem('healthHistory', JSON.stringify([newEntry, ...existingHistory]));
        localStorage.setItem('dailyCompleted', 'true');
        
        setTodayResult({ level: riskLevel, score: riskScore }); 
    };

    const submitDailyLog = async () => {
        setIsAnalyzing(true);

        try {
            const response = await API.post('/users/daily-log', dailyLog);
            const { riskLevel, riskScore } = response.data;

            saveToHistory(dailyLog, riskLevel, riskScore);
            setShowDailyPrompt(false);
            setShowAdjustment(false);
        } catch (error) {
            console.error('Daily health analysis failed:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handlePerfectDay = () => {
        submitDailyLog();
    };

    const handleAdjustmentSubmit = (e) => {
        e.preventDefault();
        submitDailyLog();
    };

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY <= 0 || currentScrollY < lastScrollY) setShowNav(true);
            else setShowNav(false);
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Dynamic UI styling based on risk level
    const getRiskStyles = () => {
        if (todayResult.level === 'High Risk') return { bg: 'bg-[#ffdad6]', text: 'text-[#ba1a1a]', icon: 'dangerous', blur: 'bg-[#ffdad6]/40' };
        if (todayResult.level === 'Moderate Risk') return { bg: 'bg-orange-200', text: 'text-orange-800', icon: 'warning', blur: 'bg-orange-200/40' };
        return { bg: 'bg-[#6cf8bb]', text: 'text-[#00714d]', icon: 'health_and_safety', blur: 'bg-[#6cf8bb]/20' };
    };

    const styles = getRiskStyles();

    return (
        <div className="bg-[#f8f9ff] text-[#0b1c30] font-sans min-h-screen pb-32 relative">
            
            <header className="w-full top-0 sticky z-40 bg-[#eff4ff] shadow-sm flex justify-between items-center px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0f52ff] flex items-center justify-center text-white overflow-hidden shadow-sm">
                        <img alt="User Profile" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&auto=format&fit=crop&q=80" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#003dcb]">HealthSync AI</h1>
                </div>
                <button onClick={handleLogout} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#d3e4fe]/50 text-[#003dcb]">
                    <span className="material-symbols-outlined">logout</span>
                </button>
            </header>

            <main className="px-4 pt-8 space-y-8 max-w-md mx-auto">
                
                {showDailyPrompt && (
                    <div className="fixed inset-0 z-50 bg-[#0b1c30]/40 backdrop-blur-sm flex items-end justify-center pb-24 px-4 sm:items-center">
                        <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-[slide-up_0.3s_ease-out]">
                            <div className="w-12 h-1 bg-[#c3c5d9] rounded-full mx-auto mb-6"></div>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-[#eff4ff] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-[#003dcb] !text-3xl">event_available</span>
                                </div>
                                <h2 className="text-2xl font-bold text-[#0b1c30] mb-2">Daily Check-in</h2>
                                <p className="text-[#434656] text-base">Did you hit your baseline targets today?</p>
                            </div>
                            <div className="space-y-3">
                                <button onClick={handlePerfectDay} className="w-full bg-[#006c49] text-white font-bold py-4 rounded-xl shadow-md flex justify-center items-center gap-2 text-lg">
                                    <span className="material-symbols-outlined">check_circle</span> Yes, 100%!
                                </button>
                                <button onClick={() => { setShowDailyPrompt(false); setShowAdjustment(true); }} className="w-full bg-[#eff4ff] text-[#003dcb] font-bold py-4 rounded-xl flex justify-center items-center text-base">
                                    No, let me adjust
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showAdjustment && (
                    <div className="fixed inset-0 z-50 bg-[#0b1c30]/60 backdrop-blur-sm flex items-end justify-center pb-12 px-4 sm:items-center pt-12">
                        <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-[slide-up_0.3s_ease-out] flex flex-col max-h-[85vh]">
                            <div className="flex justify-between items-center mb-4 shrink-0">
                                <h2 className="text-xl font-bold text-[#0b1c30]">Adjust Today&apos;s Log</h2>
                                <button onClick={() => setShowAdjustment(false)} className="text-[#737688] hover:text-[#ba1a1a]">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="overflow-y-auto pr-2 pb-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                                <form id="adjustment-form" onSubmit={handleAdjustmentSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-semibold text-[#434656] mb-1 block">Sleep (Hours)</label><input type="number" step="0.5" value={dailyLog.sleep} onChange={(e) => setDailyLog({...dailyLog, sleep: e.target.value})} className="w-full bg-[#eff4ff] border-none rounded-lg py-3 px-3 font-bold text-base text-[#003dcb]"/></div>
                                        <div><label className="text-xs font-semibold text-[#434656] mb-1 block">Steps</label><input type="number" step="100" value={dailyLog.steps} onChange={(e) => setDailyLog({...dailyLog, steps: e.target.value})} className="w-full bg-[#eff4ff] border-none rounded-lg py-3 px-3 font-bold text-base text-[#003dcb]"/></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-semibold text-[#434656] mb-1 block">Exercise (Min)</label><input type="number" step="5" value={dailyLog.exercise} onChange={(e) => setDailyLog({...dailyLog, exercise: e.target.value})} className="w-full bg-[#eff4ff] border-none rounded-lg py-3 px-3 font-bold text-base text-[#003dcb]"/></div>
                                        <div><label className="text-xs font-semibold text-[#434656] mb-1 block">Water (Liters)</label><input type="number" step="0.1" value={dailyLog.water} onChange={(e) => setDailyLog({...dailyLog, water: e.target.value})} className="w-full bg-[#eff4ff] border-none rounded-lg py-3 px-3 font-bold text-base text-[#003dcb]"/></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-semibold text-[#434656] mb-1 block">Screen Time (Hr)</label><input type="number" step="0.5" value={dailyLog.screenTime} onChange={(e) => setDailyLog({...dailyLog, screenTime: e.target.value})} className="w-full bg-[#eff4ff] border-none rounded-lg py-3 px-3 font-bold text-base text-[#003dcb]"/></div>
                                        <div><label className="text-xs font-semibold text-[#434656] mb-1 block">Junk Food</label><input type="number" step="1" value={dailyLog.junkFood} onChange={(e) => setDailyLog({...dailyLog, junkFood: e.target.value})} className="w-full bg-[#eff4ff] border-none rounded-lg py-3 px-3 font-bold text-base text-[#003dcb]"/></div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-[#434656] mb-1 block">Stress Level</label>
                                        <select value={dailyLog.stressLevel} onChange={(e) => setDailyLog({...dailyLog, stressLevel: e.target.value})} className="w-full bg-[#eff4ff] border-none rounded-lg py-3 px-3 font-bold text-base text-[#003dcb]">
                                            <option value="Low">Low</option><option value="Moderate">Moderate</option><option value="High">High</option>
                                        </select>
                                    </div>
                                </form>
                            </div>
                            <div className="pt-4 border-t border-[#c3c5d9]/30 shrink-0 mt-2">
                                <button type="submit" form="adjustment-form" disabled={isAnalyzing} className="w-full bg-[#003dcb] text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2">
                                    {isAnalyzing ? <span className="material-symbols-outlined animate-spin">sync</span> : <><span className="material-symbols-outlined">auto_awesome</span> Analyze Risk</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. DYNAMIC DASHBOARD STATS */}
                <section className="text-center space-y-6">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-[#003dcb] tracking-wide">COMPLETED • TODAY</p>
                        <h2 className="text-2xl font-bold text-[#0b1c30]">Your health overview</h2>
                    </div>
                    <div className="relative py-8 flex justify-center">
                        <div className={`absolute inset-0 ${styles.blur} blur-3xl rounded-full scale-75`}></div>
                        <div className="relative bg-white p-8 rounded-[48px] shadow-sm border border-[#c3c5d9]/20 animate-[subtle-float_6s_ease-in-out_infinite] flex flex-col items-center">
                            <div className={`w-24 h-24 ${styles.bg} rounded-full flex items-center justify-center mb-4 mx-auto shadow-inner`}>
                                <span className={`material-symbols-outlined ${styles.text} !text-5xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{styles.icon}</span>
                            </div>
                            <div className="text-center">
                                <h3 className={`text-2xl font-bold ${styles.text}`}>{todayResult.level}</h3>
                                <div className="bg-[#eff4ff] px-4 py-1.5 rounded-full mt-2 inline-block">
                                    <span className="text-[#003dcb] font-bold text-lg">
                                        {todayResult.score === null ? 'Complete a check-in to see your score' : `${todayResult.score}% Risk Score`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 🎯 THIS IS OUR NEW NOTIFICATION TEST BUTTON! */}
                <section className="my-8">
                    <BookAppointmentButton />
                </section>

                <section className="grid grid-cols-2 gap-6 pb-8">
                    {Object.entries({
                        steps: { icon: 'steps', color: '#003dcb', label: 'Daily Steps', unit: '' },
                        sleep: { icon: 'bedtime', color: '#3838c6', label: 'Sleep Quality', unit: 'h' },
                        exercise: { icon: 'directions_run', color: '#006c49', label: 'Active Exercise', unit: 'm' },
                        water: { icon: 'water_drop', color: '#0f52ff', label: 'Hydration', unit: 'L' },
                        screenTime: { icon: 'devices', color: '#ba1a1a', label: 'Screen Time', unit: 'h' },
                        junkFood: { icon: 'fastfood', color: '#ba1a1a', label: 'Junk Food', unit: '' }
                    }).map(([key, data]) => (
                        <div key={key} className="bg-white p-6 rounded-xl border border-[#c3c5d9]/20 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-[${data.color}]/10`}>
                                    <span className="material-symbols-outlined" style={{color: data.color}}>{data.icon}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-[#434656]">{data.label}</p>
                                <h4 className="text-2xl font-bold text-[#0b1c30]">{dailyLog[key]}{data.unit}</h4>
                            </div>
                        </div>
                    ))}
                    <div className="col-span-2 bg-white p-6 rounded-xl border border-[#c3c5d9]/20 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#3838c6]/10 rounded-full flex items-center justify-center"><span className="material-symbols-outlined text-[#3838c6]">self_improvement</span></div>
                                <div><p className="text-xs font-semibold text-[#434656]">Stress Level</p><h4 className="text-2xl font-bold text-[#0b1c30]">{dailyLog.stressLevel}</h4></div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <nav className={`fixed bottom-0 left-0 w-full z-30 flex justify-around items-center px-4 py-3 bg-[#f8f9ff] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-2xl transition-transform duration-300 ease-in-out ${showNav ? 'translate-y-0' : 'translate-y-[100%]'}`}>
                <Link to="/dashboard" className="flex flex-col items-center justify-center bg-[#6cf8bb] text-[#00714d] rounded-2xl px-6 py-2">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                    <span className="text-xs font-bold mt-1">Dashboard</span>
                </Link>
                <Link to="/history" className="flex flex-col items-center justify-center text-[#434656] p-2 hover:bg-[#d3e4fe]/50 rounded-2xl px-6">
                    <span className="material-symbols-outlined">history</span>
                    <span className="text-xs font-semibold mt-1">History</span>
                </Link>
            </nav>
            <style dangerouslySetInnerHTML={{__html: `@keyframes subtle-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } } @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}} />
        </div>
    );
}

export default Dashboard;