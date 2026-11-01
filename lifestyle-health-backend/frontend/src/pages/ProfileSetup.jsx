import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function ProfileSetup() {
    const navigate = useNavigate();

    // State Management mapping exactly to your backend User schema
    const [formData, setFormData] = useState({
        age: '',
        gender: 'Male',
        height: '',
        weight: '',
        smokingHabit: 'Non-smoker',
        alcoholConsumption: 'None'
    });

    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, title: '', message: '', icon: '', isError: false });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const triggerToast = (title, message, icon, isError = false) => {
        setToast({ show: true, title, message, icon, isError });
        setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            // Send the permanent profile data to the backend
            await API.put('/users/profile', {
                age: Number(formData.age),
                gender: formData.gender,
                height: Number(formData.height),
                weight: Number(formData.weight),
                smokingHabit: formData.smokingHabit,
                alcoholConsumption: formData.alcoholConsumption,
                // Calculate BMI automatically before sending
                bmi: Number((formData.weight / ((formData.height / 100) * (formData.height / 100))).toFixed(1))
            });

            triggerToast('Profile Verified', 'Biometric data calibrated successfully.', 'check_circle', false);
            
            // Redirect to the Target Setup page to start submitting daily logs!
            setTimeout(() => navigate('/target-setup'), 1500);
        } catch (error) {
            console.error(error);
            triggerToast('Update Failed', 'Could not save profile data.', 'error', true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] relative overflow-hidden">
            
            {/* Top Navigation Bar */}
            <header className="w-full top-0 sticky bg-[#eff4ff] shadow-sm z-50 flex justify-between items-center px-4 py-4">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#003dcb]" style={{ fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
                    <h1 className="text-xl md:text-2xl font-bold text-[#003dcb]">HealthSync AI</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#434656] mr-2">Step 2 of 2</span>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-[#d3e4fe] border border-[#c3c5d9]">
                        <img 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&auto=format&fit=crop&q=80" 
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 z-10 relative">
                <div className="max-w-2xl mx-auto">
                    
                    {/* Contextual Intro */}
                    <div className="mb-8 space-y-2">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#0b1c30]">Profile Setup</h2>
                        <p className="text-base text-[#434656]">
                            Please provide your permanent biometric data. This information helps calibrate our AI models to provide precise health risk assessments tailored specifically to your physiology.
                        </p>
                    </div>

                    {/* Progress Indicator Track */}
                    <div className="w-full h-2 bg-[#d3e4fe] rounded-full mb-10 overflow-hidden">
                        <div className="h-full bg-[#003dcb] rounded-full transition-all duration-1000" style={{ width: '100%' }}></div>
                    </div>

                    {/* Profile Form Card */}
                    <section className="bg-white border border-[#c3c5d9] rounded-xl p-6 md:p-8 shadow-sm">
                        <form className="space-y-8" onSubmit={handleSubmit}>
                            
                            {/* Basic Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Age */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[#0b1c30]">Age</label>
                                    <div className="relative">
                                        <input 
                                            className="w-full px-4 py-3 bg-[#f8f9ff] border border-[#c3c5d9] rounded-lg focus:border-[#003dcb] outline-none transition-all" 
                                            placeholder="Enter age" 
                                            type="number"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#434656] text-xs font-semibold">Years</span>
                                    </div>
                                </div>
                                {/* Gender */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[#0b1c30]">Gender</label>
                                    <select 
                                        className="w-full px-4 py-3 bg-[#f8f9ff] border border-[#c3c5d9] rounded-lg focus:border-[#003dcb] outline-none transition-all"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Physical Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Height */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-[#0b1c30]">Height</label>
                                        <div className="flex bg-[#e5eeff] rounded-lg p-0.5">
                                            <button className="px-3 py-1 text-xs font-semibold rounded-md bg-white shadow-sm text-[#003dcb]" type="button">cm</button>
                                        </div>
                                    </div>
                                    <input 
                                        className="w-full px-4 py-3 bg-[#f8f9ff] border border-[#c3c5d9] rounded-lg focus:border-[#003dcb] outline-none transition-all" 
                                        placeholder="175" 
                                        type="number"
                                        name="height"
                                        value={formData.height}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {/* Weight */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-[#0b1c30]">Weight</label>
                                        <div className="flex bg-[#e5eeff] rounded-lg p-0.5">
                                            <button className="px-3 py-1 text-xs font-semibold rounded-md bg-white shadow-sm text-[#003dcb]" type="button">kg</button>
                                        </div>
                                    </div>
                                    <input 
                                        className="w-full px-4 py-3 bg-[#f8f9ff] border border-[#c3c5d9] rounded-lg focus:border-[#003dcb] outline-none transition-all" 
                                        placeholder="70.5" 
                                        step="0.1" 
                                        type="number"
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Habits Section */}
                            <div className="space-y-6 pt-4 border-t border-[#c3c5d9]">
                                {/* Smoking */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[#0b1c30]">Smoking Habit</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {['Non-smoker', 'Occasional', 'Regular'].map((habit) => (
                                            <label key={habit} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.smokingHabit === habit ? 'border-[#003dcb] bg-[#eff4ff]' : 'border-[#c3c5d9] hover:bg-[#f8f9ff]'}`}>
                                                <input 
                                                    className="w-4 h-4 text-[#003dcb] accent-[#003dcb]" 
                                                    name="smokingHabit" 
                                                    type="radio"
                                                    value={habit}
                                                    checked={formData.smokingHabit === habit}
                                                    onChange={handleChange}
                                                />
                                                <span className="text-base text-[#0b1c30]">{habit}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Alcohol */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-[#0b1c30]">Alcohol Consumption</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {[
                                            { label: 'Never', value: 'None' }, 
                                            { label: 'Socially', value: 'Occasional' }, 
                                            { label: 'Frequently', value: 'Regular' }
                                        ].map((habit) => (
                                            <label key={habit.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.alcoholConsumption === habit.value ? 'border-[#003dcb] bg-[#eff4ff]' : 'border-[#c3c5d9] hover:bg-[#f8f9ff]'}`}>
                                                <input 
                                                    className="w-4 h-4 text-[#003dcb] accent-[#003dcb]" 
                                                    name="alcoholConsumption" 
                                                    type="radio"
                                                    value={habit.value}
                                                    checked={formData.alcoholConsumption === habit.value}
                                                    onChange={handleChange}
                                                />
                                                <span className="text-base text-[#0b1c30]">{habit.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* AI Calibrate Alert */}
                            <div className="bg-[#e5eeff] rounded-xl p-4 flex gap-4 items-start border border-[#0f52ff]/10">
                                <span className="material-symbols-outlined text-[#003dcb]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                                <div>
                                    <p className="text-sm font-semibold text-[#003dcb] mb-1">AI Precision Calibration</p>
                                    <p className="text-sm text-[#434656]">Your permanent biometric data allows HealthSync AI to establish a baseline for chronic risk assessment. This data is encrypted and used only for your personalized health insights.</p>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button 
                                    className="w-full bg-[#003dcb] text-white text-lg font-semibold py-4 rounded-lg shadow-lg hover:bg-[#0f52ff] transition-all active:scale-95 flex justify-center items-center gap-2" 
                                    type="submit"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="animate-spin material-symbols-outlined">progress_activity</span> 
                                            <span>Calibrating AI...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Complete Profile</span>
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </main>

            {/* Dynamic Toast */}
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-transform duration-500 pointer-events-none ${toast.show ? 'translate-y-0' : 'translate-y-[-150px]'}`}>
                <div className="bg-white border border-[#0f52ff]/20 shadow-xl rounded-2xl px-6 py-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${toast.isError ? 'bg-red-100 text-red-600' : 'bg-[#6cf8bb] text-[#00714d]'}`}>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{toast.icon}</span>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-[#0b1c30]">{toast.title}</h4>
                        <p className="text-xs text-[#434656]">{toast.message}</p>
                    </div>
                </div>
            </div>

            {/* Background Decorative Element */}
            <div className="fixed top-0 right-0 -z-10 w-1/3 h-full opacity-5 pointer-events-none">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <path d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,90,-16.3,88.5,-0.9C87,14.5,81.4,29.1,72.6,41.4C63.8,53.7,51.8,63.7,38.3,71C24.8,78.3,9.8,83,-4.2,90.3C-18.2,97.6,-31.2,107.5,-42.1,104.9C-53,102.3,-61.8,87.2,-68.8,74.1C-75.8,61,-81,50,-85.4,37.9C-89.8,25.8,-93.4,12.9,-92.4,0.6C-91.4,-11.7,-85.8,-23.4,-78.9,-34.5C-72,-45.6,-63.8,-56.1,-53.1,-65.1C-42.4,-74.1,-29.2,-81.6,-15.1,-85.3C-1,-89,-1,-89,-14.1,-83.6C-27.2,-78.2,-14.1,-83.6,-1,-89C13.1,-94.4,27.2,-89,44.7,-76.4Z" fill="#003dcb" transform="translate(100 100)"></path>
                </svg>
            </div>
        </div>
    );
}

export default ProfileSetup;