// src/services/api.js
// Ce fichier centralise TOUS les appels vers le backend (API de Harry)
// Chaque page importe uniquement ce dont elle a besoin depuis ce fichier

// ── URL de base ──────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ── Fonction générique de requête ────────────────────────────────
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) throw new Error(data.error || 'Erreur API');

  return data;
}

// ── Auth ─────────────────────────────────────────────────────────
export const authService = {
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Stocker le token ET les infos utilisateur (incluant le rôle)
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  registerCommission: (userData) =>
    request('/auth/register/commission', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  registerDGES: (userData) =>
    request('/auth/register/dges', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Erreur parsing user:', error);
      return null;
    }
  },
};

// ── Candidat ─────────────────────────────────────────────────────
export const candidatService = {
  getProfil: () => request('/candidats/profil'),

  updateProfil: (data) =>
    request('/candidats/profil', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ── Concours ─────────────────────────────────────────────────────
export const concoursService = {
  getAll: () => request('/concours'),
  getById: (id) => request(`/concours/${id}`),
};

// ── Inscriptions ─────────────────────────────────────────────────
export const inscriptionService = {
  creer: (concoursId) =>
    request('/inscriptions', {
      method: 'POST',
      body: JSON.stringify({ concoursId }),
    }),

  getMesInscriptions: () => request('/inscriptions/mes-inscriptions'),
};

// ── Dossier ──────────────────────────────────────────────────────
export const dossierService = {
  uploadPiece: async (typePiece, fichier) => {
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('fichier', fichier);
    formData.append('typePiece', typePiece);

    const response = await fetch(`${BASE_URL}/dossier/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  getDossier: () => request('/dossier'),
};

// ── Commission ───────────────────────────────────────────────────
export const commissionService = {
  getDossiers: (statut) =>
    request(`/commission/dossiers${statut ? `?statut=${statut}` : ''}`),

  updateStatut: (inscriptionId, statut) =>
    request(`/commission/dossiers/${inscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ statut }),
    }),
};

// ── DGES ──────────────────────────────────────────────────────────
export const dgesService = {
  // Récupère les statistiques de TOUS les concours
  // Retourne : { totaux: {...}, statistiques: [...] }
  getStatistiques: () => request('/dges/statistiques'),

  // Récupère les statistiques d'UN seul concours par son ID
  getStatistiquesConcours: (id) => request(`/dges/statistiques/${id}`),
};

// ── Convocation PDF ───────────────────────────────────────────────
const telechargerPDF = async (url, filename) => {
  const token = localStorage.getItem('token');
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Erreur téléchargement');
  }
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(objectUrl);
};

export const convocationService = {
  telecharger: (inscriptionId) =>
    telechargerPDF(`${BASE_URL}/candidats/convocation/${inscriptionId}`, `convocation_${inscriptionId}.pdf`),

  telechargerPreinscription: (inscriptionId) =>
    telechargerPDF(`${BASE_URL}/candidats/preinscription/${inscriptionId}`, `preinscription_${inscriptionId}.pdf`),
};