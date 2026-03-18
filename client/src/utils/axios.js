// client/src/utils/axios.js
import axios from'axios';

const api = axios.create({
 baseURL:'http://localhost:5000/api', // Adjust to your backend URL
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use((config) => {
 const token = localStorage.getItem('halleyx_token');
 if (token) {
 config.headers.Authorization =`Bearer ${token}`;
 }
 return config;
});

export default api;