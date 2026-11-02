import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging } from './firebase';
import API from './services/api';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileSetup from './pages/ProfileSetup';
import TargetSetup from './pages/TargetSetup';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import ProtectedRoute from './components/ProtectedRoute';
import Privacy from './pages/Privacy';

function App() {
    useEffect(() => {
        const syncNotificationToken = async () => {
            if (!('Notification' in window)) return;

            try {
                await API.get('/users/profile');
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;

                await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                const registration = await navigator.serviceWorker.ready;
                const currentToken = await getToken(messaging, {
                    vapidKey: 'BPASZLPspLQGyIkNSyzXJshAZme_WF24sgEXz4M3OtGZ22G5zmSW6Rp5-uMo4YoI6F5ufcAcvg8CP3Xd6Dy6yrU',
                    serviceWorkerRegistration: registration
                });

                if (currentToken) {
                    await API.post('/users/update-token', { token: currentToken });
                }
            } catch (error) {
                console.error('Notification setup failed:', error);
            }
        };

        syncNotificationToken();
    }, []);

    return (
        <Router>
            <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route element={<ProtectedRoute />}>
                        <Route path="/setup" element={<ProfileSetup />} />
                        <Route path="/target-setup" element={<TargetSetup />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/history" element={<History />} />
                    </Route>
                </Routes>
            </div>
        </Router>
    );
}

export default App;
