import axios from 'axios';

// 1. Point this explicitly to your Node.js server!
const API = axios.create({
    baseURL: 'http://localhost:3000/api', 
});

// 2. Automatically attach your VIP pass (JWT token) to every request
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export default API;