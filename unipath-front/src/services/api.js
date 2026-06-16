// src/services/api.js
// Ce fichier centralise TOUS les appels vers le backend (API de Harry)
// Chaque page importe uniquement ce dont elle a besoin depuis ce fichier

import { saveAuth, clearAuth } from '../utils/auth';

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

  if (!response.ok) {
    const error = new Error(data.error || 'Erreur API');
    error.status = response.status;
    error.data = data;
    // Compatibilite avec les appels existants qui attendent err.response (style axios)
    error.response = {
      status: response.status,
      data,
    };
    throw error;
  }

  return data;
}

// ── Auth ─────────────────────────────────────────────────────────
export const authService = {
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token && data.user) {
      saveAuth(data.token, data.user);
    }

    return data;
  },

  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  registerEtablissement: (data) =>
    request('/auth/register-etablissement', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () => {
    clearAuth();
  },

  resetPassword: (email) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

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
  getClassement: (id) => request(`/concours/${id}/classement`),
  
  // CRUD pour DGES
  create: (data) =>
    request('/concours', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id, data) =>
    request(`/concours/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id) =>
    request(`/concours/${id}`, {
      method: 'DELETE',
    }),
};

// ── Inscriptions ─────────────────────────────────────────────────
// ✅ REFONTE - Documents spécifiques au concours (Dossier Concours)
export const inscriptionService = {
  creer: (concoursId) =>
    request('/inscriptions', {
      method: 'POST',
      body: JSON.stringify({ concoursId }),
    }),

  soumettre: (inscriptionId) =>
    request(`/inscriptions/${inscriptionId}/soumettre`, {
      method: 'POST',
    }),

  getMesInscriptions: () => request('/inscriptions/mes-inscriptions'),

  // ✅ NOUVEAU - Récupérer le dossier complet d'une inscription (base + spécifique)
  getDossierComplet: (inscriptionId) => request(`/completion/inscriptions/${inscriptionId}/dossier-complet`),

  // ✅ NOUVEAU - Upload quittance (endpoint mis à jour)
  uploadQuittance: async (inscriptionId, fichier) => {
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('file', fichier);

    const response = await fetch(`${BASE_URL}/inscriptions/${inscriptionId}/dossier-concours/quittance`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  // ✅ NOUVEAU - Upload pièce extra (endpoint mis à jour)
  uploadPieceExtra: async (inscriptionId, typePiece, fichier) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', fichier);
    formData.append('typePiece', typePiece);
    const response = await fetch(`${BASE_URL}/inscriptions/${inscriptionId}/dossier-concours/pieces-extras`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },
};

// ── Dossier ──────────────────────────────────────────────────────
// ✅ REFONTE - Documents de base (Dossier Personnel)
export const dossierService = {
  // ✅ NOUVEAU - Récupérer le dossier personnel d'un candidat
  getDossierPersonnel: (candidatId) => request(`/dossier/candidats/${candidatId}/dossier-personnel`),

  // ✅ NOUVEAU - Upload document de base (acteNaissance, carteIdentite, photo, releve)
  uploadPiece: async (candidatId, typePiece, fichier) => {
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('file', fichier);
    formData.append('typePiece', typePiece);

    const response = await fetch(`${BASE_URL}/dossier/candidats/${candidatId}/dossier-personnel/pieces`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  // ⚠️ DEPRECATED - Utiliser getDossierPersonnel à la place
  getDossier: () => request('/dossier'),
};

// ── Commission ───────────────────────────────────────────────────
export const commissionService = {
  getDossiers: (statut) =>
    request(`/commission/dossiers${statut ? `?statut=${statut}` : ''}`),

  updateStatut: (inscriptionId, payload) =>
    request(`/commission/dossiers/${inscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Nouvelles méthodes pour la gestion des notes
  getConcours: () => request('/commission/concours'),

  updateNote: (inscriptionId, note) =>
    request(`/commission/notes/${inscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    }),
};

// ── DGES ──────────────────────────────────────────────────────────
export const dgesService = {
  // Récupère les statistiques de TOUS les concours
  // Retourne : { totaux: {...}, statistiques: [...] }
  getStatistiques: () => request('/dges/statistiques'),

  // Récupère les statistiques d'UN seul concours par son ID
  getStatistiquesConcours: (id) => request(`/dges/statistiques/${id}`),

  listerAdminsEtablissement: (etablissementId) =>
    request(`/dges/etablissements/${etablissementId}/admins`),

  creerAdminEtablissement: (etablissementId, data) =>
    request(`/dges/etablissements/${etablissementId}/admins`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  supprimerAdminEtablissement: (etablissementId, adminId) =>
    request(`/dges/etablissements/${etablissementId}/admins/${adminId}`, {
      method: 'DELETE',
    }),
};

export const campagneAdminService = {
  getAll: (statut = '') =>
    request(`/etablissement/campagnes${statut ? `?statut=${statut}` : ''}`),
  getById: (id) => request(`/etablissement/campagnes/${id}`),
  creer: (data) =>
    request('/etablissement/campagnes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  modifier: (id, data) =>
    request(`/etablissement/campagnes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  supprimer: (id) =>
    request(`/etablissement/campagnes/${id}`, { method: 'DELETE' }),
  publier: (id) =>
    request(`/etablissement/campagnes/${id}/publier`, { method: 'PATCH' }),
  cloturer: (id) =>
    request(`/etablissement/campagnes/${id}/cloturer`, { method: 'PATCH' }),
};

export const campagneService = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.ville) searchParams.set('ville', params.ville);
    if (params.anneeAcademique) searchParams.set('anneeAcademique', params.anneeAcademique);
    if (params.filiereId) searchParams.set('filiereId', params.filiereId);
    const query = searchParams.toString();
    return request(`/campagnes${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/campagnes/${id}`),
};

// ── Module 2 - Parcours Academique ───────────────────────────────
export const completionService = {
  getCompletion: (candidatId) => request(`/completion/${candidatId}`),
};

export const etablissementService = {
  getAll: () => request('/etablissements'),
  getById: (id) => request(`/etablissements/${id}`),
  rechercherParFilieres: (choix) =>
    request('/etablissements/recherche-filieres', {
      method: 'POST',
      body: JSON.stringify(choix),
    }),
  getEtudiants: (id, params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.filiere) searchParams.set('filiere', params.filiere);
    if (params.annee) searchParams.set('annee', params.annee);
    const query = searchParams.toString();
    return request(`/etablissements/${id}/etudiants${query ? `?${query}` : ''}`);
  },
  getMonProfil: () => request('/etablissements/mon/profil'),
  updateMonProfil: (data) =>
    request('/etablissements/mon/profil', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadMonLogo: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('logo', file);

    const response = await fetch(`${BASE_URL}/etablissements/mon/logo`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erreur upload logo');
    return data;
  },
};

export const filiereService = {
  getAll: () => request('/filieres'),
  getByEtablissement: (etablissementId) => request(`/filieres?etablissementId=${etablissementId}`),
};

export const inscriptionAcadService = {
  creer: (data) =>
    request('/inscriptions-academiques', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMesInscriptions: () => request('/inscriptions-academiques/mes-inscriptions'),
};

export const preinscriptionEtablissementService = {
  creer: (data) =>
    request('/preinscriptions-etablissement', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMesPreinscriptions: () => request('/preinscriptions-etablissement/mes-preinscriptions'),
  telechargerFiche: (id) =>
    telechargerPDF(`${BASE_URL}/preinscriptions-etablissement/${id}/pdf`, `fiche_preinscription_${id}.pdf`),
  getDemandesEtablissement: (statut = '') =>
    request(`/preinscriptions-etablissement/etablissement/demandes${statut ? `?statut=${statut}` : ''}`),
  decider: (id, payload) =>
    request(`/preinscriptions-etablissement/${id}/decision`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

export const applicationService = {
  creer: (data) =>
    request('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMesDemandes: () => request('/applications/mine'),
  getById: (id) => request(`/applications/${id}`),
  getRequirements: (id) => request(`/applications/${id}/requirements`),
  payerFraisDossierMock: (id) =>
    request(`/applications/${id}/payments/dossier-fees/mock-confirm`, {
      method: 'POST',
    }),
  uploadQuittanceBancaire: async (id, fichier) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('fichier', fichier);
    const response = await fetch(`${BASE_URL}/applications/${id}/payments/droits-inscription/receipt`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erreur upload quittance bancaire');
    return data;
  },
  uploadDocument: async (id, code, fichier) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('code', code);
    formData.append('fichier', fichier);
    const response = await fetch(`${BASE_URL}/applications/${id}/documents`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erreur upload document');
    return data;
  },
  finaliser: (id) =>
    request(`/applications/${id}/finalize`, {
      method: 'POST',
    }),
  telechargerFiche: (id) =>
    telechargerPDF(`${BASE_URL}/applications/${id}/fiche-preinscription`, `fiche_preinscription_${id}.pdf`),
  getDemandesEtablissement: () => request('/applications/etablissement/applications'),
  getMyRequirementsEtablissement: () => request('/applications/etablissement/requirements'),
  upsertRequirementEtablissement: (payload) =>
    request('/applications/etablissement/requirements', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteRequirementEtablissement: (id) =>
    request(`/applications/etablissement/requirements/${id}`, {
      method: 'DELETE',
    }),
  getRequirementsByEtablissement: (etablissementId) =>
    request(`/applications/requirements/etablissement/${etablissementId}`),
};

export const notesService = {
  ajouter: (data) =>
    request('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByInscription: (id) => request(`/notes/inscription/${id}`),
};

export const parcoursService = {
  getMonParcours: () => request('/parcours/mon-parcours'),
  getMonReleve: () => request('/parcours/mon-releve'),
  telechargerMonReleve: () => telechargerPDF(`${BASE_URL}/parcours/mon-releve/pdf`, 'releve_academique.pdf'),
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

// ── History ───────────────────────────────────────────────────────
// ✅ REFONTE - Historique des actions (utilise dossierInscriptionId)
export const historyService = {
  // ✅ NOUVEAU - Enregistrer une action (avec dossierInscriptionId)
  enregistrerAction: (dossierInscriptionId, typeAction, details = null) =>
    request('/history/action', {
      method: 'POST',
      body: JSON.stringify({
        dossierInscriptionId,
        typeAction,
        details,
      }),
    }),

  // ✅ NOUVEAU - Récupérer l'historique d'un dossier d'inscription
  getHistorique: (dossierInscriptionId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/history/dossiers-inscription/${dossierInscriptionId}?${query}`);
  },
};