/**
 * Helper pour gérer les URLs de l'application
 */

/**
 * Obtient l'URL du frontend
 * Priorité: FRONTEND_URL > APP_URL > défaut localhost:5173
 */
function getFrontendUrl() {
  return process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173';
}

/**
 * Obtient l'URL de l'API backend
 */
function getBackendUrl() {
  const port = process.env.PORT || 3001;
  return process.env.BACKEND_URL || `http://localhost:${port}`;
}

/**
 * Construit une URL complète vers le frontend
 * @param {string} path - Chemin relatif (ex: '/auth/confirm')
 * @param {Object} params - Paramètres query string
 */
function buildFrontendUrl(path, params = {}) {
  const baseUrl = getFrontendUrl();
  const url = new URL(path, baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
}

/**
 * Construit une URL complète vers l'API
 * @param {string} path - Chemin relatif (ex: '/api/auth/confirm')
 * @param {Object} params - Paramètres query string
 */
function buildBackendUrl(path, params = {}) {
  const baseUrl = getBackendUrl();
  const url = new URL(path, baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
}

module.exports = {
  getFrontendUrl,
  getBackendUrl,
  buildFrontendUrl,
  buildBackendUrl
};
