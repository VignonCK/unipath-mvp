// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import bgImage from '../assets/examen-eleves.jpg';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen relative flex items-center justify-center p-4'>

      {/* Image de fond */}
      <img
        src={bgImage}
        alt='background'
        className='absolute inset-0 w-full h-full object-cover'
      />
      {/* Overlay */}
      <div className='absolute inset-0' style={{backgroundColor: 'rgba(30, 58, 138, 0.75)'}} />

      {/* Carte de connexion */}
      <div className='relative w-full max-w-md'>

        {/* Logo */}
        <div className='text-center mb-6'>
          <h1 className='text-4xl font-black text-white tracking-tight'>UniPath</h1>
          <p className='text-blue-200 text-sm mt-1'>Plateforme universitaire numérique</p>
        </div>

        {/* Formulaire */}
        <div className='bg-white rounded-2xl shadow-2xl p-8'>

          <h2 className='text-xl font-bold text-blue-900 text-center mb-6'>
            Connexion à votre espace
          </h2>

          {successMessage && (
            <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm'>
              ✅ {successMessage}
            </div>
          )}

          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm'>
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-5'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Adresse e-mail
              </label>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
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
                className='w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                placeholder='••••••••'
                required
              />
            </div>

            <button
              type='submit'
              disabled={loading}
              className='w-full bg-blue-700 text-white py-3 rounded-xl hover:bg-blue-800 font-bold text-sm disabled:opacity-50 transition'
            >
              {loading ? 'Connexion en cours...' : 'Se connecter →'}
            </button>
          </form>

          <div className='mt-6 pt-6 border-t border-gray-100 space-y-2 text-center'>
            <p className='text-sm text-gray-500'>
              Pas encore de compte ?{' '}
              <a href='/register' className='text-blue-700 font-medium hover:underline'>
                Créer un compte
              </a>
            </p>
            <p className='text-sm text-gray-500'>
              <a href='/' className='text-blue-700 font-medium hover:underline'>
                ← Retour à l'accueil
              </a>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}