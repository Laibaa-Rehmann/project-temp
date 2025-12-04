import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Freelancer API calls
export const freelancerApi = {
  // Profile
  getProfile: () => api.get('/freelancer/profile'),
  updateProfile: (data) => api.put('/freelancer/profile', data),
  
  // Skills
  getSkills: () => api.get('/freelancer/skills'),
  addSkill: (skill) => api.post('/freelancer/skills', skill),
  removeSkill: (skillId) => api.delete(`/freelancer/skills/${skillId}`),
  
  // Portfolio
  getPortfolio: () => api.get('/freelancer/portfolio'),
  addPortfolioItem: (item) => api.post('/freelancer/portfolio', item),
  updatePortfolioItem: (id, item) => api.put(`/freelancer/portfolio/${id}`, item),
  deletePortfolioItem: (id) => api.delete(`/freelancer/portfolio/${id}`),
  
  // Proposals
  getProposals: () => api.get('/freelancer/proposals'),
  submitProposal: (projectId, data) => api.post(`/projects/${projectId}/proposals`, data),
  
  // Projects
  getActiveProjects: () => api.get('/freelancer/projects/active'),
  getCompletedProjects: () => api.get('/freelancer/projects/completed'),
  
  // Earnings
  getEarnings: () => api.get('/freelancer/earnings'),
  
  // Reviews
  getReviews: () => api.get('/freelancer/reviews'),
};

export default api;