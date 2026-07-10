/**
 * ✅ UTILITAIRES D'AUTHENTIFICATION CENTRALISÉS
 * 
 * Ce fichier centralise toutes les fonctions liées à l'authentification
 * pour éviter les incohérences entre les composants.
 */

/**
 * Clés de stockage localStorage
 */
const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  USER_ID: 'userId',
};

/**
 * Rôles disponibles dans l'application
 */
export const ROLES = {
  ETUDIANT: 'ETUDIANT',
  CANDIDAT: 'CANDIDAT',
  COMMISSION: 'COMMISSION',
  DGES: 'DGES',
  CONTROLEUR: 'CONTROLEUR',
  ADMIN_ETABLISSEMENT: 'ADMIN_ETABLISSEMENT',
};

/** Comptes étudiants sur la plateforme (le statut candidat concours = inscription) */
export const STUDENT_ROLES = [ROLES.ETUDIANT, ROLES.CANDIDAT];

/**
 * Routes par défaut selon le rôle
 */
const DEFAULT_ROUTES = {
  [ROLES.ETUDIANT]: '/dashboard',
  [ROLES.CANDIDAT]: '/dashboard',
  [ROLES.COMMISSION]: '/commission',
  [ROLES.DGES]: '/dashboard-dges',
  [ROLES.CONTROLEUR]: '/controleur-commission/tableau-de-bord',
  [ROLES.ADMIN_ETABLISSEMENT]: '/admin-etablissement/campagnes',
};

export const SOUS_ROLES_COMMISSION = {
  EXAMINATEUR: 'EXAMINATEUR',
  CONTROLEUR: 'CONTROLEUR',
};

export const SOUS_ROLES_ETABLISSEMENT = {
  ADMIN: 'ADMIN',
  SUPERVISEUR: 'SUPERVISEUR',
  CONTROLEUR: 'CONTROLEUR',
};

/**
 * Récupère le token d'authentification
 * @returns {string|null} Token ou null si non connecté
 */
export function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

/**
 * Récupère les informations de l'utilisateur connecté
 * @returns {Object|null} Objet utilisateur ou null si non connecté
 */
export function getUser() {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Erreur parsing user:', error);
    return null;
  }
}

/**
 * Récupère l'ID de l'utilisateur connecté
 * @returns {string|null} ID utilisateur ou null si non connecté
 */
export function getUserId() {
  const user = getUser();
  return user?.id || localStorage.getItem(STORAGE_KEYS.USER_ID) || null;
}

/**
 * Récupère le rôle de l'utilisateur connecté
 * @returns {string|null} Rôle ou null si non connecté
 */
export function getUserRole() {
  const user = getUser();
  return user?.role || null;
}

export function getUserSousRole() {
  const user = getUser();
  if (user?.sousRole) return user.sousRole;
  // Rétrocompat : anciens comptes admin sans sousRole en localStorage
  if (user?.role === ROLES.ADMIN_ETABLISSEMENT) return SOUS_ROLES_ETABLISSEMENT.ADMIN;
  return null;
}

export function hasSousRole(allowedSousRoles) {
  const sousRole = getUserSousRole();
  if (!sousRole) return false;
  if (Array.isArray(allowedSousRoles)) {
    return allowedSousRoles.includes(sousRole);
  }
  return sousRole === allowedSousRoles;
}

/**
 * Vérifie si l'utilisateur est connecté
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 * @param {string|Array<string>} allowedRoles - Rôle(s) autorisé(s)
 * @returns {boolean}
 */
export function hasRole(allowedRoles) {
  const userRole = getUserRole();
  if (!userRole) return false;

  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(userRole);
  }

  return userRole === allowedRoles;
}

/**
 * Sauvegarde les informations d'authentification
 * @param {string} token - Token JWT
 * @param {Object} user - Informations utilisateur
 */
export function saveAuth(token, user) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  if (user.id) {
    localStorage.setItem(STORAGE_KEYS.USER_ID, user.id);
  }
}

/**
 * Supprime les informations d'authentification
 */
export function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.USER_ID);
}

/**
 * Redirection globale sur 401 (équivalent intercepteur Axios).
 * @returns {boolean} true si une redirection a été déclenchée
 */
export function redirectToLoginOn401(status) {
  if (status !== 401) return false;
  clearAuth();
  window.location.href = '/login';
  return true;
}

/**
 * Déconnecte l'utilisateur
 */
export function logout() {
  clearAuth();
  window.location.href = '/login';
}

/**
 * Récupère la route par défaut selon le rôle
 * @param {string} role - Rôle de l'utilisateur
 * @returns {string} Route par défaut
 */
export function getDefaultRoute(role, sousRole) {
  if (role === ROLES.COMMISSION) {
    if (sousRole === SOUS_ROLES_COMMISSION.EXAMINATEUR) return '/examinateur/dossiers';
    if (sousRole === SOUS_ROLES_COMMISSION.CONTROLEUR) return '/controleur-commission/tableau-de-bord';
    return '/commission';
  }
  if (role === ROLES.ADMIN_ETABLISSEMENT) {
    if (sousRole === SOUS_ROLES_ETABLISSEMENT.CONTROLEUR) {
      return '/admin-etablissement/preinscriptions';
    }
    if (sousRole === SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR) {
      return '/admin-etablissement/preinscriptions';
    }
    return '/admin-etablissement/campagnes';
  }
  return DEFAULT_ROUTES[role] || '/login';
}

/**
 * Redirige vers la route par défaut selon le rôle
 */
export function redirectToDefaultRoute() {
  const user = getUser();
  const route = getDefaultRoute(user?.role, user?.sousRole);
  window.location.href = route;
}

/**
 * Crée les headers HTTP avec authentification
 * @param {Object} additionalHeaders - Headers supplémentaires
 * @returns {Object} Headers complets
 */
export function getAuthHeaders(additionalHeaders = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Crée les headers HTTP pour upload de fichiers
 * @returns {Object} Headers pour upload
 */
export function getUploadHeaders() {
  const token = getToken();
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ne pas définir Content-Type pour les uploads (FormData le fait automatiquement)
  return headers;
}

/**
 * Vérifie si le token est expiré (basique)
 * @returns {boolean}
 */
export function isTokenExpired() {
  const token = getToken();
  if (!token) return true;

  try {
    // Décoder le JWT (partie payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;

    if (!exp) return false; // Pas d'expiration définie

    // Vérifier si expiré (avec marge de 60 secondes)
    return Date.now() >= (exp * 1000) - 60000;
  } catch (error) {
    console.error('Erreur vérification expiration token:', error);
    return true; // En cas d'erreur, considérer comme expiré
  }
}

/**
 * Rafraîchit le token si nécessaire
 * @returns {Promise<boolean>} True si le token est valide
 */
export async function ensureValidToken() {
  if (!isAuthenticated()) {
    return false;
  }

  if (isTokenExpired()) {
    // TODO: Implémenter le refresh token si disponible
    console.warn('Token expiré - déconnexion nécessaire');
    logout();
    return false;
  }

  return true;
}

/**
 * Gère une erreur API (style request() de api.js) sans confondre
 * session expirée (401) et problème de droits / serveur (403+).
 * @returns {boolean} true si l'erreur a été traitée
 */
export function handleApiAuthError(err, { onSessionExpired, onForbidden, onOther } = {}) {
  if (err?.status === 401) {
    redirectToLoginOn401(401);
    if (onSessionExpired) onSessionExpired(err);
    return true;
  }
  if (err?.status === 403) {
    if (onForbidden) onForbidden(err);
    return true;
  }
  if (onOther) onOther(err);
  return false;
}

/**
 * Gère une erreur API de session (profil incomplet, etc.).
 * Le 401 est géré globalement par request() / apiFetch().
 */
export function handleSessionError(err, navigate) {
  if (err?.status === 403 && err?.data?.profileIncomplete) {
    clearAuth();
    navigate('/login', {
      replace: true,
      state: {
        message:
          err?.data?.error ||
          'Session invalide. Veuillez vous reconnecter.',
      },
    });
    return true;
  }
  return false;
}

/**
 * Gère les erreurs d'authentification
 * @param {Response} response - Réponse HTTP
 * @returns {boolean} True si erreur d'authentification
 */
export function handleAuthError(response) {
  if (redirectToLoginOn401(response.status)) {
    return true;
  }

  if (response.status === 403) {
    console.warn('Accès refusé - permissions insuffisantes');
    redirectToDefaultRoute();
    return true;
  }

  return false;
}

/**
 * Wrapper pour les appels API avec gestion d'authentification
 * @param {string} url - URL de l'API
 * @param {Object} options - Options fetch
 * @returns {Promise<Response>}
 */
export async function authenticatedFetch(url, options = {}) {
  // Vérifier que le token est valide
  const isValid = await ensureValidToken();
  if (!isValid) {
    throw new Error('Non authentifié');
  }

  // Ajouter les headers d'authentification
  const headers = getAuthHeaders(options.headers);

  // Effectuer la requête
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Gérer les erreurs d'authentification
  handleAuthError(response);

  return response;
}

/**
 * Exporte les clés de stockage pour usage interne
 * ⚠️ À utiliser uniquement dans les composants d'authentification
 */
export const _STORAGE_KEYS = STORAGE_KEYS;
