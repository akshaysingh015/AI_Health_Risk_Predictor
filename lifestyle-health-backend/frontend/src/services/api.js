import axios from 'axios';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL
    || import.meta.env.VITE_API_URL
    || 'http://localhost:3000/api';

const API = axios.create({
    baseURL: apiBaseURL,
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
