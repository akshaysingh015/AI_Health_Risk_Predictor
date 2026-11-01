import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

function Login() {
    const navigate = useNavigate();

    // State Management
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState({
        show: false,
        title: '',
        message: '',
        icon: '',
        isError: false
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const triggerToast = (title, message, icon, isError = false) => {
        setToast({ show: true, title, message, icon, isError });
        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 4000);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            // Hits endpoint: POST /api/auth/login
            const response = await API.post('/auth/login', {
                email: formData.email.trim(),
                password: formData.password
            });

            // Save JWT token
            localStorage.setItem('token', response.data.token);
            
            triggerToast('Success', 'Welcome back to HealthSync!', 'check_circle', false);
            
            // Redirect to profile setup if it's the first login, otherwise to dashboard
            setTimeout(() => navigate('/setup'), 1500);
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
            triggerToast('Authentication Failed', errorMsg, 'error', true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex-grow flex flex-col items-center justify-center relative px-4 py-8 overflow-hidden min-h-screen bg-[#f8f9ff]">
            {/* Background Blurs */}
            <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] bg-[#6cf8bb]/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-20%] w-[300px] h-[300px] bg-[#0f52ff]/10 rounded-full blur-[80px] pointer-events-none"></div>

            {/* Header */}
            <div className="w-full max-w-md text-center mb-8 z-10">
                <div className="inline-flex items-center justify-center p-2 bg-[#0f52ff]/10 rounded-xl mb-4">
                    <span className="material-symbols-outlined text-[#003dcb]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        health_and_safety
                    </span>
                </div>
                <h1 className="text-2xl font-bold text-[#003dcb] mb-2 tracking-tight">HealthSync AI</h1>
                <p className="text-sm text-[#434656]">Intelligent care for your clinical journey.</p>
            </div>

            {/* Card */}
            <div className="w-full max-w-md bg-white border border-[#c3c5d9]/30 shadow-sm rounded-[24px] p-4 sm:p-6 z-10 overflow-hidden relative">
                <h2 className="text-xl font-bold text-[#0b1c30] mb-6 text-center">Account Login</h2>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <div>
                        <label className="block text-xs font-semibold text-[#434656] mb-1 ml-1">Email Address</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#c3c5d9] text-[20px]">mail</span>
                            <input 
                                className="w-full pl-11 pr-4 py-3 bg-[#eff4ff] border-transparent focus:border-[#003dcb] focus:ring-0 rounded-xl text-sm transition-all outline-none" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required 
                                type="email"
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="block text-xs font-semibold text-[#434656] mb-1 ml-1">Password</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#c3c5d9] text-[20px]">lock</span>
                            <input 
                                className="w-full pl-11 pr-4 py-3 bg-[#eff4ff] border-transparent focus:border-[#003dcb] focus:ring-0 rounded-xl text-sm transition-all outline-none" 
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••" 
                                required 
                                type="password"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                        <button className="text-xs font-semibold text-[#003dcb] hover:underline" type="button">Forgot Password?</button>
                        <Link to="/register" className="text-xs font-semibold text-[#003dcb] hover:underline">
                            Create account
                        </Link>
                    </div>

                    <button 
                        className="w-full py-4 bg-[#003dcb] text-white rounded-xl text-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#0f52ff] active:scale-95 transition-all mt-6" 
                        type="submit"
                    >
                        <span>Sign In</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </form>
            </div>

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

            {/* Spinner Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-[#f8f9ff]/60 backdrop-blur-sm z-[200] flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-[#003dcb]/20 border-t-[#003dcb] rounded-full animate-spin"></div>
                        <p className="mt-3 text-sm font-semibold text-[#003dcb] animate-pulse">Syncing Securely...</p>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Login;