import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    withCredentials: true,
    timeout: 15000
});

API.interceptors.request.use((request) => {
    const csrfCookie = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('csrf_token='));
    if (csrfCookie && ['post', 'put', 'patch', 'delete'].includes(request.method?.toLowerCase())) {
        request.headers['X-CSRF-Token'] = decodeURIComponent(csrfCookie.split('=')[1]);
    }
    return request;
});

export default API;
