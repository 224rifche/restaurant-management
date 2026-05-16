import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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

// Intercepteur pour gérer les erreurs (ex: 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/attendance/dashboard');
    return response.data;
  }
};

export const notificationService = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.post(`/notifications/${id}/mark-as-read`);
    return response.data;
  },
  markAllRead: async () => {
    const response = await api.post(`/notifications/mark-all-as-read`);
    return response.data;
  },
  search: async (q) => {
    const response = await api.get(`/notifications?search=${q}`);
    return response.data;
  }
};

export const employeeService = {
  getAll: async () => {
    const response = await api.get('/employees');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  },
  search: async (q) => {
    const response = await api.get(`/employees?search=${q}`);
    return response.data;
  }
};

export const expenseService = {
  search: async (q) => {
    const response = await api.get(`/expenses?search=${q}`);
    return response.data;
  }
};

export const attendanceService = {
  search: async (q) => {
    const response = await api.get(`/attendance?search=${q}`);
    return response.data;
  }
};

export const scheduleService = {
  search: async (q) => {
    const response = await api.get(`/schedules?search=${q}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/schedules/', data);
    return response.data;
  }
};

export default api;
