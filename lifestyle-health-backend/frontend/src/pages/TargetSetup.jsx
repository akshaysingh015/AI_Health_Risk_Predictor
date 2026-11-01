import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function TargetSetup() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // All 7 required daily metrics for the AI baseline
    const [targets, setTargets] = useState({
        sleep: 7.5,
        steps: 10000,
        exercise: 45,
        screenTime: 4.0,
        stressLevel: 'Low',
        water: 3.0,
        junkFood: 0,
        reminderTime: '21:00'
    });

    const handleChange = (e) => {
        setTargets({ ...targets, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        localStorage.setItem('healthTargets', JSON.stringify(targets));
        setIsLoading(false);
        navigate('/dashboard');
    };

    return (
        <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col font-sans">
            
            {/* Header */}
            <header className="w-full top-0 sticky z-50 bg-[#f8f9ff] px-4 py-6">
                <h1 className="text-2xl font-bold text-[#003dcb]">HealthSync AI</h1>
                <div className="w-full bg-[#e5eeff] h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className="bg-[#003dcb] h-full w-[100%] rounded-full"></div>
                </div>
            </header>

            <main className="flex-1 px-4 max-w-md mx-auto w-full pb-12">
                <section className="space-y-2 mb-8">
                    <h2 className="text-3xl font-bold text-[#0b1c30]">Set Your Baseline</h2>
                    <p className="text-base text-[#434656]">
                        Define your perfect day across all 7 health metrics. The AI will use these to track your daily progress.
                    </p>
                </section>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* 1. Sleep Target */}
                    <div className="bg-white p-5 rounded-xl border border-[#c3c5d9]/40 shadow-sm">
                        <label className="flex items-center gap-2 text-sm font-bold text-[#0b1c30] mb-3">
                            <span className="material-symbols-outlined text-[#3838c6]">bedtime</span>
                            Target Sleep (Hours)
                        </label>
                        <input 
                            type="number" name="sleep" step="0.5"
                            value={targets.sleep} onChange={handleChange}
                            className="w-full bg-[#eff4ff] border-none rounded-lg py-3 px-4 text-[#0b1c30] focus:ring-2 focus:ring-[#003dcb] outline-none font-medium"
                            required
                        />
                    </div>

                    {/* 2. Step Target */}
                    <div className="bg-white p-5 rounded-xl border border-[#c3c5d9]/40 shadow-sm">
                        <label className="flex items-center gap-2 text-sm font-bold text-[#0b1c30] mb-3">
                            <span className="material-symbols-outlined text-[#003dcb]">steps</span>
                            Daily Step Goal
                        </label>
                        <input 
                            type="number" name="steps" step="500"
                            value={targets.steps} onChange={handleChange}
                            className="w-full bg-[#eff4ff] border-none rounded-lg py-3 px-4 text-[#0b1c30] focus:ring-2 focus:ring-[#003dcb] outline-none font-medium"
                            required
                        />
                    </div>

                    {/* 3. Exercise Minutes */}
                    <div className="bg-white p-5 rounded-xl border border-[#c3c5d9]/40 shadow-sm">
                        <label className="flex items-center gap-2 text-sm font-bold text-[#0b1c30] mb-3">
                            <span className="material-symbols-outlined text-[#006c49]">directions_run</span>
                            Exercise Goal (Minutes)
                        </label>
                        <input 
                            type="number" name="exercise" step="5"
                            value={targets.exercise} onChange={handleChange}
                            className="w-full bg-[#eff4ff] border-none rounded-lg py-3 px-4 text-[#0b1c30] focus:ring-2 focus:ring-[#003dcb] outline-none font-medium"
                            required
                        />
                    </div>

                    {/* 4. Screen Time */}
                    <div className="bg-white p-5 rounded-xl border border-[#c3c5d9]/40 shadow-sm">
                        <label className="flex items-center gap-2 text-sm font-bold text-[#0b1c30] mb-3">
                            <span className="material-symbols-outlined text-[#ba1a1a]">devices</span>
                            Max Screen Time (Hours)
                        </label>
                        <input 
                            type="number" name="screenTime" step="0.5"
                            value={targets.screenTime} onChange={handleChange}
                            className="w-full bg-[#eff4ff] border-none rounded-lg py-3 px-4 text-[#0b1c30] focus:ring-2 focus:ring-[#003dcb] outline-none font-medium"
                            required
                        />
                    </div>

                    {/* 5. Hydration Target */}
                    <div className="bg-white p-5 rounded-xl border border-[#c3c5d9]/40 shadow-sm">
                        <label className="flex items-center gap-2 text-sm font-bold text-[#0b1c30] mb-3">
                            <span className="material-symbols-outlined text-[#006c49]">water_drop</span>
                            Hydration (Liters)
                        </label>
                        <input 
                            type="number" name="water" step="0.1"
                            value={targets.water} onChange={handleChange}
                            className="w-full bg-[#eff4ff] border-none rounded-lg py-3 px-4 text-[#0b1c30] focus:ring-2 focus:ring-[#003dcb] outline-none font-medium"
                            required
                        />
                    </div>

                    {/* 6. Junk Food Limit */}
                    <div className="bg-white p-5 rounded-xl border border-[#c3c5d9]/40 shadow-sm">
                        <label className="flex items-center gap-2 text-sm font-bold text-[#0b1c30] mb-3">
                            <span className="material-symbols-outlined text-[#ba1a1a]">fastfood</span>
                            Max Junk Food (Times/Day)
                        </label>
                        <input 
                            type="number" name="junkFood" step="1"
                            value={targets.junkFood} onChange={handleChange}
                            className="w-full bg-[#eff4ff] border-none rounded-lg py-3 px-4 text-[#0b1c30] focus:ring-2 focus:ring-[#003dcb] outline-none font-medium"
                            required
                        />
                    </div>

                    {/* 7. Stress Level */}
                    <div className="bg-white p-5 rounded-xl border border-[#c3c5d9]/40 shadow-sm">
                        <label className="flex items-center gap-2 text-sm font-bold text-[#0b1c30] mb-3">
                            <span className="material-symbols-outlined text-[#3838c6]">self_improvement</span>
                            Target Stress Level
                        </label>
                        <select 
                            name="stressLevel"
                            value={targets.stressLevel} onChange={handleChange}
                            className="w-full bg-[#eff4ff] border-none rounded-lg py-3 px-4 text-[#0b1c30] focus:ring-2 focus:ring-[#003dcb] outline-none font-medium"
                            required
                        >
                            <option value="Low">Low</option>
                            <option value="Moderate">Moderate</option>
                            <option value="High">High</option>
                        </select>
                    </div>

                    {/* Reminder Time */}
                    <div className="bg-[#eff4ff] p-5 rounded-xl border border-[#b8c4ff] shadow-sm mt-8">
                        <label className="flex items-center gap-2 text-sm font-bold text-[#003dcb] mb-1">
                            <span className="material-symbols-outlined">notifications_active</span>
                            Daily Sync Time
                        </label>
                        <p className="text-xs text-[#434656] mb-3">When should we check your daily logs?</p>
                        <input 
                            type="time" name="reminderTime"
                            value={targets.reminderTime} onChange={handleChange}
                            className="w-full bg-white border border-[#c3c5d9] rounded-lg py-3 px-4 text-[#0b1c30] focus:ring-2 focus:ring-[#003dcb] outline-none font-medium"
                            required
                        />
                    </div>

                    <button 
                        type="submit" disabled={isLoading}
                        className="w-full bg-[#003dcb] text-white font-bold py-4 rounded-xl shadow-md hover:bg-[#0f52ff] active:scale-95 transition-all flex justify-center items-center mt-4"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            "Lock in Targets"
                        )}
                    </button>
                </form>
            </main>
        </div>
    );
}

export default TargetSetup;