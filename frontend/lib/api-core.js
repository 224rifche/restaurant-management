import axios from 'axios';
import Cookies from 'js-cookie';

// ============================================================
// CONFIGURATION DE BASE
// ============================================================
// Next.js redirige /api/* vers Django via next.config.mjs (proxy)
export const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// INTERCEPTEUR REQUEST — Ajoute le token à chaque requête
// ============================================================
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================
// INTERCEPTEUR RESPONSE — Gère les erreurs 401 (refresh auto)
// ============================================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get('refresh_token');

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/token/refresh`, {
            refresh: refreshToken,
          });

          const newAccessToken = response.data.access;
          const newRefreshToken = response.data.refresh;

          Cookies.set('access_token', newAccessToken, {
            expires: 1 / 24,
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

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          Cookies.remove('access_token', { path: '/' });
          Cookies.remove('refresh_token', { path: '/' });
          Cookies.remove('user_role', { path: '/' });
          Cookies.remove('user_nom', { path: '/' });
          window.location.href = '/login';
        }
      } else {
        Cookies.remove('access_token', { path: '/' });
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Export par défaut : l'instance axios configurée
// Chaque module de rôle (serveur/api.js, admin/api.js...) l'importera
export default api;