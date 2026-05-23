/**
 * URL de base API (inclut /api) — aligné avec .env.example
 */
export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

export function getStoredToken() {
  return localStorage.getItem('token');
}

/**
 * @param {string} path - Chemin relatif ex: /examinateur/dossiers
 */
export async function apiFetch(path, options = {}) {
  const token = getStoredToken();
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expirée');
  }

  return response;
}
