import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (telephone, password) => {
    const response = await api.post('/token/', { telephone, password });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // On récupère aussi le profil pour connaître le rôle
      const userProfile = await api.get('/users/me');
      localStorage.setItem('user_role', userProfile.data.role);
      localStorage.setItem('user_nom', userProfile.data.nom);
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.clear();
    window.location.href = '/login';
  }
};

export default api;
