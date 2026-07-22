import api from '../api-core';

// ============================================================
// API SERVEUR — Surface d'API STRICTEMENT limitée à ce rôle
// ============================================================
// Règle : ce fichier n'expose QUE ce qu'un Serveur a le droit de faire.
// Si une fonction n'est pas ici, l'interface Serveur ne peut PAS l'appeler
// (même par erreur de copier-coller d'un composant Admin).
//
// Sécurité : ce n'est qu'une barrière de CONFORT côté frontend.
// La vraie barrière reste le backend (get_queryset() par rôle, cf. Étape 1).
// Mais ça évite les erreurs de dev et documente clairement les droits du rôle.

export const pointageService = {
  /**
   * Récupère MES pointages (le backend filtre déjà automatiquement
   * grâce à get_queryset() dans AttendanceViewSet — pas besoin de
   * préciser employee_id, le serveur ne verrait que les siens de toute façon)
   */
  getMesPointages: async () => {
    const response = await api.get('/attendance');
    return Array.isArray(response.data) ? response.data : (response.data?.results || []);
  },

  /**
   * Récupère le token QR actuel affiché sur la tablette du restaurant
   * (nécessaire pour valider le check-in/check-out)
   */
  getQrToken: async () => {
    const response = await api.get('/attendance/qr-token');
    return response.data;
  },

  /**
   * Pointer l'arrivée. formData doit contenir : qr_token, selfie (File), 
   * latitude, longitude (optionnels)
   * IMPORTANT : on utilise FormData car il y a un fichier image (selfie),
   * pas un objet JSON classique — on détaillera ça à l'Étape 3.
   */
  checkIn: async (formData) => {
    const response = await api.post('/attendance/check-in', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Pointer le départ. Même structure que checkIn.
   */
  checkOut: async (formData) => {
    const response = await api.post('/attendance/check-out', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export const planningService = {
  /**
   * Récupère MON planning (le backend filtre déjà par rôle,
   * cf. Étape 1 — inutile de passer employee_id)
   */
  getMonPlanning: async (params = {}) => {
    const response = await api.get('/schedules', { params });
    return Array.isArray(response.data) ? response.data : (response.data?.results || []);
  },
};

export const profilService = {
  /**
   * Mon profil (nom, téléphone, rôle)
   */
  getMonProfil: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  /**
   * Changer mon propre mot de passe.
   * userId = mon propre ID (récupéré via getMonProfil() au préalable)
   */
  changerMotDePasse: async (userId, oldPassword, newPassword, newPassword2) => {
    const response = await api.post(`/users/${userId}/change_password`, {
      old_password: oldPassword,
      new_password: newPassword,
      new_password2: newPassword2,
    });
    return response.data;
  },
};