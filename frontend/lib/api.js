import axios from 'axios';
import Cookies from 'js-cookie';

// ============================================================
// CONFIGURATION DE BASE
// ============================================================
// On utilise /api comme baseURL
// Next.js redirige /api/* vers Django via next.config.mjs (proxy)
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// INTERCEPTEUR REQUEST — Ajoute le token à chaque requête
// ============================================================
// Avant chaque requête, on lit le token depuis les COOKIES
// (et non plus depuis localStorage qui disparaît au F5)
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  // Cookies.get() lit le cookie "access_token" du navigateur
  // Les cookies persistent entre les refreshs de page !
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================
// INTERCEPTEUR RESPONSE — Gère les erreurs 401
// ============================================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si on reçoit un 401 ET qu'on n'a pas déjà tenté un refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // _retry = flag pour éviter une boucle infinie
      // Sans ça : 401 → refresh → 401 → refresh → infini

      const refreshToken = Cookies.get('refresh_token');

      if (refreshToken) {
        try {
          // On tente de rafraîchir le token automatiquement
          const response = await axios.post(`${API_URL}/token/refresh`, {
            refresh: refreshToken,
          });

          const newAccessToken = response.data.access;
          const newRefreshToken = response.data.refresh;

          // On met à jour le cookie avec le nouveau token
          Cookies.set('access_token', newAccessToken, {
            expires: 1/24,  // 1 heure (1/24 de jour)
            sameSite: 'strict',
            path: '/',
          });

          if (newRefreshToken) {
            Cookies.set('refresh_token', newRefreshToken, {
              expires: 1,
              sameSite: 'strict',
              path: '/',
            });
          }

          // On relance la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);

        } catch (refreshError) {
          // Le refresh a échoué → on déconnecte l'utilisateur
          Cookies.remove('access_token', { path: '/' });
          Cookies.remove('refresh_token', { path: '/' });
          Cookies.remove('user_role', { path: '/' });
          Cookies.remove('user_nom', { path: '/' });
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_nom');
          window.location.href = '/login';
        }
      } else {
        // Pas de refresh token → déconnexion directe
        Cookies.remove('access_token', { path: '/' });
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH SERVICE
// ============================================================
export const authService = {
  login: async (telephone, password) => {
    const response = await api.post('/token', { telephone, password });

    if (response.data.access) {
      // On stocke dans des COOKIES au lieu de localStorage
      // expires: 1/24 = expire dans 1 heure (durée du token Django)
      Cookies.set('access_token', response.data.access, {
        expires: 1/24,
        sameSite: 'strict',
        path: '/',
      });

      // expires: 1 = expire dans 1 jour (durée du refresh token Django)
      Cookies.set('refresh_token', response.data.refresh, {
        expires: 1,
        sameSite: 'strict',
        path: '/',
      });

      // On récupère le profil utilisateur
      const userProfile = await api.get('/users/me');
      Cookies.set('user_role', userProfile.data.role, { expires: 1, path: '/' });
      Cookies.set('user_nom', userProfile.data.nom, { expires: 1, path: '/' });
      localStorage.setItem('user_role', userProfile.data.role);
      localStorage.setItem('user_nom', userProfile.data.nom);
    }

    return response.data;
  },

  logout: () => {
    // Supprime tous les cookies de session et localStorage
    Cookies.remove('access_token', { path: '/' });
    Cookies.remove('refresh_token', { path: '/' });
    Cookies.remove('user_role', { path: '/' });
    Cookies.remove('user_nom', { path: '/' });
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_nom');
    window.location.href = '/login';
  },

  isAuthenticated: () => {
    // Retourne true si le cookie access_token existe
    return !!Cookies.get('access_token');
  },

  getUser: () => {
    return {
      role: Cookies.get('user_role'),
      nom: Cookies.get('user_nom'),
    };
  },
};

// ============================================================
// TOUS LES AUTRES SERVICES (inchangés)
// ============================================================
export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/attendance/dashboard');
    return response.data;
  }
};

export const notificationService = {
  getAll: async (params = {}) => {
    params._t = new Date().getTime();
    const response = await api.get('/notifications', { params });
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
  search: async (q) => api.get('/notifications', { params: { search: q } }).then(r => r.data),
};

export const employeeService = {
  getAll: async (params = {}) => {
    params._t = new Date().getTime();
    const response = await api.get('/employees', { params });
    return response.data;
  },
  getById: async (id) => api.get(`/employees/${id}`).then(r => r.data),
  create: async (data) => api.post('/employees', data).then(r => r.data),
  update: async (id, data) => api.put(`/employees/${id}`, data).then(r => r.data),
  delete: async (id) => api.delete(`/employees/${id}`).then(r => r.data),
  activer: async (id) => api.post(`/employees/${id}/activer`).then(r => r.data),
  search: async (q) => api.get(`/employees?search=${q}`).then(r => r.data),
};

export const expenseService = {
  getAll: async (params = {}) => {
    params._t = new Date().getTime();
    const response = await api.get('/expenses', { params });
    return response.data;
  },
  getById: async (id) => api.get(`/expenses/${id}`).then(r => r.data),
  create: async (data) => api.post('/expenses', data).then(r => r.data),
  update: async (id, data) => api.put(`/expenses/${id}`, data).then(r => r.data),
  delete: async (id) => api.delete(`/expenses/${id}`).then(r => r.data),
  validate: async (id) => api.post(`/expenses/${id}/validate`).then(r => r.data),
  downloadPdf: async (id) => api.get(`/expenses/${id}/pdf`, { responseType: 'blob' }).then(r => r.data),
  search: async (q) => api.get('/expenses', { params: { search: q } }).then(r => r.data),
};

export const attendanceService = {
  getAll: async (params = {}) => {
    params._t = new Date().getTime();
    const response = await api.get('/attendance', { params });
    return response.data;
  },
  getById: async (id) => api.get(`/attendance/${id}`).then(r => r.data),
  create: async (data) => api.post('/attendance', data).then(r => r.data),
  clockIn: async (data) => api.post('/attendance/pointage', data).then(r => r.data),
  search: async (q) => api.get('/attendance', { params: { search: q } }).then(r => r.data),
};

export const scheduleService = {
  getAll: async (params = {}) => {
    params._t = new Date().getTime();
    const response = await api.get('/schedules', { params });
    return response.data;
  },
  getById: async (id) => api.get(`/schedules/${id}`).then(r => r.data),
  create: async (data) => api.post('/schedules', data).then(r => r.data),
  update: async (id, data) => api.put(`/schedules/${id}`, data).then(r => r.data),
  delete: async (id) => api.delete(`/schedules/${id}`).then(r => r.data),
  search: async (q) => api.get('/schedules', { params: { search: q } }).then(r => r.data),
};

export const userService = {
  getAll: async (params = {}) => api.get('/users', { params }).then(r => r.data),
  getById: async (id) => api.get(`/users/${id}`).then(r => r.data),
  create: async (data) => api.post('/users', data).then(r => r.data),
  update: async (id, data) => api.put(`/users/${id}`, data).then(r => r.data),
  delete: async (id) => api.delete(`/users/${id}`).then(r => r.data),
  getMe: async () => api.get('/users/me').then(r => r.data),
};

export default api;
