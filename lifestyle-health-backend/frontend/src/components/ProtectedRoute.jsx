import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import API from '../services/api';

function ProtectedRoute() {
    const location = useLocation();
    const [status, setStatus] = useState('checking');

    useEffect(() => {
        API.get('/users/profile')
            .then(() => setStatus('authenticated'))
            .catch(() => setStatus('unauthenticated'));
    }, []);

    if (status === 'checking') return <div className="empty-state">Checking your session…</div>;
    return status === 'authenticated'
        ? <Outlet />
        : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export default ProtectedRoute;
