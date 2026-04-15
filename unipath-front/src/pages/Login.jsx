// src/pages/Login.jsx
// Page de connexion
// - Appelle l'API de Harry pour vérifier email + mot de passe
// - Sauvegarde le token JWT dans localStorage
// - Redirige vers /dashboard si connexion réussie
// - Affiche le message de confirmation venant de Register

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

export default function Login() {
  const navigate = useNavigate();

  // useLocation permet de lire les données passées par navigate()
  // Ex: navigate('/login', { state: { message: 'Compte créé !' } })
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // true pendant l'appel API pour désactiver le bouton
  const [loading, setLoading] = useState(false);

  // Message d'erreur si connexion échoue
  const [error, setError] = useState('');

  // Message de succès venant de Register
  // location.state?.message = "Compte créé ! Connectez-vous."
  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Appel API → POST /api/auth/login
      // Le backend renvoie { token, user }
      const data = await authService.login(email, password);

      // Sauvegarder le token dans localStorage
      // Ce token sera utilisé par toutes les requêtes suivantes
      localStorage.setItem('token', data.token);

      // Rediriger vers le dashboard candidat
      navigate('/dashboard');
    } catch (err) {
      // Afficher l'erreur renvoyée par le backend
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
      <div className='bg-white p-8 rounded-xl shadow-md w-full max-w-md'>

        <h1 className='text-2xl font-bold text-center text-blue-800 mb-6'>
          UniPath — Connexion
        </h1>

        {/* Message de succès venant de Register — vert */}
        {successMessage && (
          <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4'>
            {successMessage}
          </div>
        )}

        {/* Message d'erreur — rouge */}
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Email
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='votre@email.com'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Mot de passe
            </label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='••••••••'
              required
            />
          </div>

          {/* Bouton désactivé pendant le chargement */}
          <button
            type='submit'
            disabled={loading}
            className='w-full bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-800 font-medium disabled:opacity-50'
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className='text-center text-sm text-gray-500 mt-4'>
          Pas encore de compte ?{' '}
          <a href='/register' className='text-blue-700 hover:underline'>
            S'inscrire
          </a>
        </p>

      </div>
    </div>
  );
}