import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: '/api',
});

// Bypass auth for now - use a mock token
api.interceptors.request.use(async (config) => {
  config.headers.Authorization = `Bearer mock-token-for-development`;
  return config;
});

export default api;
