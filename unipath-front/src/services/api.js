// src/services/api.js
// Ce fichier centralise TOUS les appels vers le backend (API de Harry)
// Chaque page importe uniquement ce dont elle a besoin depuis ce fichier

// ── URL de base ──────────────────────────────────────────────────
// On lit l'URL depuis le fichier .env (VITE_API_URL)
// Si elle n'existe pas, on utilise localhost:3001 par défaut
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ── Fonction générique de requête ────────────────────────────────
// Cette fonction est utilisée par TOUS les services ci-dessous
// Elle évite de répéter le même code dans chaque service
async function request(endpoint, options = {}) {
  // Récupérer le token JWT sauvegardé lors de la connexion
  // Ce token prouve que l'utilisateur est bien connecté
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      // On dit au backend qu'on envoie du JSON
      'Content-Type': 'application/json',
      // Si le token existe, on l'ajoute dans le header
      // Le backend (middleware de Harry) va le vérifier
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    // Fusionner avec les options supplémentaires (method, body...)
    ...options,
  };

  // Faire la vraie requête HTTP vers le backend
  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // Lire la réponse JSON du backend
  const data = await response.json();

  // Si le backend renvoie une erreur (400, 401, 500...)
  // on lance une exception pour que la page puisse l'afficher
  if (!response.ok) throw new Error(data.error || 'Erreur API');

  // Sinon on retourne les données
  return data;
}

// ── Auth ─────────────────────────────────────────────────────────
// Gère la connexion et la création de compte
export const authService = {
  // Envoie email + mot de passe au backend
  // Le backend renvoie un token JWT si c'est correct
  login: (email, password) =>
    request('/auth/login', { 
      method: 'POST', 
      body: JSON.stringify({ email, password }) 
    }),

  // Envoie toutes les infos du formulaire Register au backend
  // Le backend crée le compte dans Supabase Auth + la table Candidat
  register: (userData) =>
    request('/auth/register', { 
      method: 'POST', 
      body: JSON.stringify(userData) 
    }),
};

// ── Candidat ─────────────────────────────────────────────────────
// Gère le profil du candidat connecté
export const candidatService = {
  // Récupère le profil complet : infos perso + inscriptions + dossier
  // Utilisé dans DashboardCandidat pour afficher les données
  getProfil: () => request('/candidats/profil'),

  // Met à jour les infos personnelles du candidat
  // Utilisé si le candidat veut modifier son téléphone, lieu de naissance...
  updateProfil: (data) =>
    request('/candidats/profil', { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
};

// ── Concours ─────────────────────────────────────────────────────
// Gère la liste des concours disponibles
export const concoursService = {
  // Récupère TOUS les concours disponibles
  // Utilisé dans DashboardCandidat pour afficher les concours
  getAll: () => request('/concours'),

  // Récupère les détails d'UN seul concours par son ID
  getById: (id) => request(`/concours/${id}`),
};

// ── Inscriptions ─────────────────────────────────────────────────
// Gère les inscriptions aux concours
export const inscriptionService = {
  // Inscrit le candidat connecté à un concours
  // Déclenche le trigger anti-conflit de Vignon côté base de données
  creer: (concoursId) =>
    request('/inscriptions', { 
      method: 'POST', 
      body: JSON.stringify({ concoursId }) 
    }),

  // Récupère toutes les inscriptions du candidat connecté
  getMesInscriptions: () => request('/inscriptions/mes-inscriptions'),
};

// ── Dossier ──────────────────────────────────────────────────────
// Gère l'upload des pièces justificatives
export const dossierService = {
  // Upload un fichier (PDF, JPG, PNG) vers Supabase Storage
  // Utilise FormData et non JSON car on envoie un fichier binaire
  uploadPiece: async (typePiece, fichier) => {
    // Récupérer le token pour authentifier la requête
    const token = localStorage.getItem('token');

    // FormData est le format spécial pour envoyer des fichiers
    // C'est différent de JSON qui ne peut pas contenir des fichiers
    const formData = new FormData();
    formData.append('fichier', fichier);       // Le fichier lui-même
    formData.append('typePiece', typePiece);   // Ex: 'acteNaissance', 'photo'

    const response = await fetch(`${BASE_URL}/dossier/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      // IMPORTANT : pas de Content-Type ici !
      // Le navigateur le gère automatiquement avec FormData
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  // Récupère le dossier complet du candidat connecté
  // Contient les URLs de toutes les pièces déjà uploadées
  getDossier: () => request('/dossier'),
};

// ── Commission ───────────────────────────────────────────────────
// Gère l'espace de la commission de validation
export const commissionService = {
  // Récupère la liste des dossiers
  // Si statut est fourni (EN_ATTENTE, VALIDE, REJETE), filtre par statut
  // Sinon retourne tous les dossiers
  getDossiers: (statut) =>
    request(`/commission/dossiers${statut ? `?statut=${statut}` : ''}`),

  // Change le statut d'un dossier : VALIDE ou REJETE
  // inscriptionId = l'ID de l'inscription à modifier
  updateStatut: (inscriptionId, statut) =>
    request(`/commission/dossiers/${inscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ statut }),
    }),
};
// ── Convocation PDF ───────────────────────────────────────────
export const convocationService = {
  telecharger: async (inscriptionId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${BASE_URL}/candidats/convocation/${inscriptionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erreur téléchargement');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `convocation_${inscriptionId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
// ── DGES ─────────────────────────────────────────────────────
export const dgesService = {
  getStatistiques: () => request('/dges/statistiques'),
  getStatistiquesConcours: (id) => request(`/dges/statistiques/${id}`),
};