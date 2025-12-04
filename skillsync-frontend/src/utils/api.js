import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const API = {
  // Auth - FIXED: Accepts email as username
  auth: {
    login: (credentials) => {
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);  // Email is sent as username
      formData.append('password', credentials.password);
      
      return api.post('/token', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    },
    register: (data) => api.post('/register', data),
    me: () => api.get('/users/me'),
  },
  
  // Jobs
  jobs: {
    getAll: (params) => api.get('/jobs', { params }),
    get: (id) => api.get(`/jobs/${id}`),
    create: (data) => api.post('/jobs', data),
  },
  
  // Freelancers
  freelancers: {
    getAll: (params) => api.get('/freelancers', { params }),
    createProfile: (data) => api.post('/freelancer-profile', data),
  },
  
  // Proposals
  proposals: {
    create: (data) => api.post('/proposals', data),
    getJobProposals: (jobId) => api.get(`/jobs/${jobId}/proposals`),
  },
};

export default api;