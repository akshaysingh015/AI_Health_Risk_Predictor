import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState('');
    const [toast, setToast] = useState({ show: false, title: '', message: '', icon: '', isError: false });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await API.get('/users/profile');
                const profile = response.data;
                setFormData({
                    age: profile.age ?? '',
                    gender: profile.gender ?? 'Male',
                    height: profile.height ?? '',
                    weight: profile.weight ?? '',
                    smokingHabit: profile.smokingHabit ?? 'Non-smoker',
                    alcoholConsumption: profile.alcoholConsumption ?? 'None'
                });
            } catch (requestError) {
                if (requestError.response?.status === 401) navigate('/login');
                else setProfileError('Unable to load your saved baseline data.');
            } finally {
                setIsLoadingProfile(false);
            }
        };
        loadProfile();
    }, [navigate]);

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
            
            navigate('/target-setup');
        } catch (error) {
            console.error(error);
            triggerToast('Update Failed', 'Could not save profile data.', 'error', true);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await API.post('/auth/logout');
        navigate('/login');
    };

    const exportData = async () => {
        try {
            const response = await API.get('/users/export');
            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'healthsync-data.json';
            link.click();
            URL.revokeObjectURL(url);
            triggerToast('Export ready', 'Your health data has been downloaded.', 'download', false);
        } catch (error) {
            triggerToast('Export failed', error.response?.data?.message || 'Unable to export your data.', 'error', true);
        }
    };

    const deleteAccount = async () => {
        if (!window.confirm('Delete your account and all health history permanently? This cannot be undone.')) return;
        try {
            await API.delete('/users/account');
            navigate('/login', { replace: true });
        } catch (error) {
            triggerToast('Deletion failed', error.response?.data?.message || 'Unable to delete your account.', 'error', true);
        }
    };

    return (
        <div className="app-shell dashboard-layout">
            <aside className="sidebar">
                <div className="brand"><span className="brand-mark material-symbols-outlined">health_and_safety</span><span>HealthSync AI</span></div>
                <nav className="nav-list">
                    <Link className="nav-link" to="/dashboard"><span className="material-symbols-outlined">dashboard</span><span>Overview</span></Link>
                    <Link className="nav-link" to="/history"><span className="material-symbols-outlined">insights</span><span>Health history</span></Link>
                    <Link className="nav-link active" to="/setup"><span className="material-symbols-outlined">person</span><span>Profile</span></Link>
                </nav>
                <div className="sidebar-bottom"><button className="nav-link" onClick={logout}><span className="material-symbols-outlined">logout</span><span>Sign out</span></button></div>
            </aside>
            <main className="main-content">
                <header className="topbar"><div><div className="eyebrow">Personal baseline</div><h1>Your profile</h1></div><div className="avatar">HS</div></header>
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

                    <section className="bg-white border border-[#c3c5d9] rounded-xl p-6 md:p-8 shadow-sm mb-6">
                        <div className="flex items-center justify-between gap-4 mb-5">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-[#003dcb]">Saved baseline</div>
                                <h3 className="text-xl font-bold mt-1">Your registration health data</h3>
                            </div>
                            <span className="material-symbols-outlined text-[#006c49]">verified</span>
                        </div>
                        {isLoadingProfile ? <p className="text-sm text-[#434656]">Loading your saved data…</p> : profileError ? <p className="text-sm text-[#ba1a1a]" role="alert">{profileError}</p> : <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                ['Age', formData.age ? `${formData.age} years` : 'Not set'],
                                ['Gender', formData.gender || 'Not set'],
                                ['Height', formData.height ? `${formData.height} cm` : 'Not set'],
                                ['Weight', formData.weight ? `${formData.weight} kg` : 'Not set'],
                                ['BMI', formData.height && formData.weight ? (formData.weight / ((formData.height / 100) ** 2)).toFixed(1) : 'Not set'],
                                ['Smoking', formData.smokingHabit || 'Not set'],
                                ['Alcohol', formData.alcoholConsumption || 'Not set']
                            ].map(([label, value]) => <div key={label} className="rounded-lg bg-[#f8f9ff] p-3"><div className="text-xs text-[#434656]">{label}</div><div className="font-semibold mt-1">{value}</div></div>)}
                        </div>}
                    </section>

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
                    <section className="panel privacy-controls">
                        <div className="eyebrow">Privacy controls</div>
                        <h3>Manage your data</h3>
                        <p>Export a copy of your profile and health history, or permanently delete your account and health records.</p>
                        <div className="privacy-actions">
                            <button className="soft-btn privacy-button" type="button" onClick={exportData}>Export my data</button>
                            <button className="danger-btn" type="button" onClick={deleteAccount}>Delete account</button>
                        </div>
                        <Link to="/privacy">Read the privacy policy</Link>
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

        </div>
    );
}

export default ProfileSetup;