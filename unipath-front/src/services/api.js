// src/services/api.js

// URL de base de l'API backend
// On utilise une variable d'environnement ou une valeur par défaut pour le développement local
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Fonction générique pour faire des requêtes HTTP à l'API
async function request(endpoint, options = {}) {
  // Récupère le token d'authentification stocké dans le navigateur (si présent)
  const token = localStorage.getItem('token');
  // Prépare la configuration de la requête HTTP
  const config = {
    headers: {
      'Content-Type': 'application/json',
      // Ajoute le token d'authentification dans l'en-tête Authorization si présent
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options, // Permet de surcharger ou compléter la configuration
  };
  // Effectue la requête HTTP avec fetch
  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  // Tente de parser la réponse en JSON
  const data = await response.json();
  // Si la réponse n'est pas OK (statut HTTP >= 400), lève une erreur
  if (!response.ok) {
    throw new Error(data.error || 'Erreur API');
  }
  // Retourne les données de la réponse
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────
// Objet qui regroupe les fonctions liées à l'authentification
export const authService = {
  // Fonction pour se connecter (login)
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  // Fonction pour s'inscrire (register)
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};