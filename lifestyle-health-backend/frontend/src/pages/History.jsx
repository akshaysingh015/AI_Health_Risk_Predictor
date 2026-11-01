import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

function History() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCard, setExpandedCard] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const loadHistory = async () => {
            try {
                setLoadError('');
                const response = await API.get('/health/history');
                setHistoryData(response.data.history.map((log) => ({
                    id: log._id,
                    date: new Date(log.logDate).toLocaleString(),
                    steps: log.dailySteps,
                    sleep: log.sleepHours,
                    exercise: log.exerciseMinutes,
                    screenTime: log.screenTime,
                    water: log.waterIntake,
                    junkFood: log.junkFoodFrequency,
                    riskLevel: log.aiRiskPrediction,
                    riskScore: Math.round((
                        log.aiRiskScore ??
                        (log.aiRiskPrediction === 'High Risk'
                            ? log.aiConfidence
                            : 1 - log.aiConfidence)
                    ) * 100)
                })));
            } catch (error) {
                console.error('Unable to load health history:', error);
                setHistoryData([]);
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                } else {
                    setLoadError(error.response?.data?.message || 'Unable to load your health history.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadHistory();
        window.addEventListener('focus', loadHistory);
        return () => window.removeEventListener('focus', loadHistory);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const toggleCard = (id) => {
        setExpandedCard(expandedCard === id ? null : id);
    };

    return (
        <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen pb-32 font-sans">
            
            <header className="w-full top-0 sticky z-50 bg-[#eff4ff] shadow-sm flex justify-between items-center px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#dde1ff]">
                        <img alt="User" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&auto=format&fit=crop&q=80" />
                    </div>
                    <h1 className="text-xl font-bold text-[#003dcb]">History</h1>
                </div>
                <button onClick={handleLogout} className="material-symbols-outlined text-[#434656] hover:bg-[#d3e4fe]/50 transition-colors p-2 rounded-full">
                    logout
                </button>
            </header>

            <main className="px-4 pt-6 flex flex-col gap-4 max-w-md mx-auto">
                <section className="bg-white border border-[#c3c5d9] rounded-xl p-4 flex flex-col gap-2 shadow-sm">
                    <span className="text-xs font-semibold text-[#434656]">MONTHLY PERFORMANCE</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-[#003dcb]">84%</span>
                        <span className="text-sm font-medium text-[#006c49]">↑ 5% vs last week</span>
                    </div>
                    <div className="w-full bg-[#e5eeff] h-2 rounded-full mt-2">
                        <div className="h-full bg-gradient-to-r from-[#003dcb] to-[#6cf8bb] rounded-full" style={{ width: '84%' }}></div>
                    </div>
                </section>

                <div className="flex flex-col gap-4">
                    {isLoading ? (
                        <div className="bg-white border border-[#c3c5d9] rounded-xl p-4 flex flex-col gap-4 shadow-sm h-24 overflow-hidden">
                            <div className="flex justify-between">
                                <div className="w-24 h-4 bg-gradient-to-r from-[#eff4ff] via-[#dce9ff] to-[#eff4ff] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
                                <div className="w-24 h-6 bg-gradient-to-r from-[#eff4ff] via-[#dce9ff] to-[#eff4ff] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full"></div>
                            </div>
                        </div>
                    ) : loadError ? (
                        <div className="text-center py-12">
                            <p className="text-[#ba1a1a] font-medium" role="alert">{loadError}</p>
                        </div>
                    ) : historyData.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-[#434656] font-medium">No daily logs found. Submit a log on the dashboard!</p>
                        </div>
                    ) : (
                        historyData.map((log) => (
                            <div 
                                key={log.id}
                                onClick={() => toggleCard(log.id)}
                                className={`border rounded-xl p-4 flex flex-col shadow-sm cursor-pointer transition-all duration-300 ${expandedCard === log.id ? 'ring-2 ring-[#0f52ff] bg-[#eff4ff] border-transparent' : 'bg-white border-[#c3c5d9]'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-[#434656]">{log.date}</span>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="text-xl font-bold text-[#0b1c30]">{log.steps}</span>
                                            <span className="text-[#434656] text-xs font-semibold">steps</span>
                                            <span className="mx-1 text-[#c3c5d9]">•</span>
                                            <span className="text-xl font-bold text-[#0b1c30]">{log.sleep}h</span>
                                            <span className="text-[#434656] text-xs font-semibold">sleep</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${log.riskLevel === 'Low Risk' ? 'bg-[#6cf8bb]/30 text-[#006c49]' : log.riskLevel === 'Moderate Risk' ? 'bg-orange-200 text-orange-800' : 'bg-[#ffdad6]/50 text-[#ba1a1a]'}`}>
                                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                {log.riskLevel === 'Low Risk' ? 'check_circle' : 'warning'}
                                            </span>
                                            <span className="text-xs font-semibold">{log.riskLevel} ({log.riskScore}%)</span>
                                        </div>
                                        <span className={`material-symbols-outlined text-[#737688] transition-transform duration-300 ${expandedCard === log.id ? 'rotate-180' : ''}`}>expand_more</span>
                                    </div>
                                </div>
                                
                                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedCard === log.id ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                    <hr className="border-[#c3c5d9] mb-4"/>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-6">
                                        <div><p className="text-xs font-semibold text-[#434656] uppercase mb-1">Exercise</p><p className="text-lg font-bold text-[#0b1c30]">{log.exercise} min</p></div>
                                        <div><p className="text-xs font-semibold text-[#434656] uppercase mb-1">Screen Time</p><p className="text-lg font-bold text-[#0b1c30]">{log.screenTime} hrs</p></div>
                                        <div><p className="text-xs font-semibold text-[#434656] uppercase mb-1">Water Intake</p><p className="text-lg font-bold text-[#0b1c30]">{log.water} L</p></div>
                                        <div><p className="text-xs font-semibold text-[#434656] uppercase mb-1">Junk Food</p><p className="text-lg font-bold text-[#0b1c30]">{log.junkFood}</p></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-2xl border-t border-[#c3c5d9]/20">
                <Link to="/dashboard" className="flex flex-col items-center justify-center text-[#434656] p-2 hover:bg-[#d3e4fe]/50 rounded-2xl px-6">
                    <span className="material-symbols-outlined">dashboard</span>
                    <span className="text-xs font-semibold mt-1">Dashboard</span>
                </Link>
                <Link to="/history" className="flex flex-col items-center justify-center bg-[#6cf8bb] text-[#00714d] rounded-2xl px-6 py-2">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                    <span className="text-xs font-bold mt-1">History</span>
                </Link>
            </nav>
            <style dangerouslySetInnerHTML={{__html: `@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}} />
        </div>
    );
}

export default History;