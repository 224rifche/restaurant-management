import api from './api-core';
import Cookies from 'js-cookie';

// ============================================================
// AUTH SERVICE — partagé par les 3 interfaces (admin/serveur/caissier)
// ============================================================
export const authService = {
  login: async (telephone, password) => {
    const response = await api.post('/token', { telephone, password });

    if (response.data.access) {
      Cookies.set('access_token', response.data.access, {
        expires: 1 / 24,
        sameSite: 'strict',
        path: '/',
      });

      Cookies.set('refresh_token', response.data.refresh, {
        expires: 1,
        sameSite: 'strict',
        path: '/',
      });

      // On récupère le profil pour connaître le rôle
      // C'est CE rôle qui décidera vers quelle interface on redirige
      // (la redirection elle-même se fait dans app/login/page.js, pas ici)
      const userProfile = await api.get('/users/me');
      Cookies.set('user_role', userProfile.data.role, { expires: 1, path: '/' });
      Cookies.set('user_nom', userProfile.data.nom, { expires: 1, path: '/' });

      // On retourne le rôle directement, pratique pour la page de login
      return { ...response.data, role: userProfile.data.role, nom: userProfile.data.nom };
    }

    return response.data;
  },

  logout: () => {
    Cookies.remove('access_token', { path: '/' });
    Cookies.remove('refresh_token', { path: '/' });
    Cookies.remove('user_role', { path: '/' });
    Cookies.remove('user_nom', { path: '/' });
    window.location.href = '/login';
  },

  isAuthenticated: () => !!Cookies.get('access_token'),

  getUser: () => ({
    role: Cookies.get('user_role'),
    nom: Cookies.get('user_nom'),
  }),
};