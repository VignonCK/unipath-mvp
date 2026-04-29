// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function estPremiereVisite() {
  return !localStorage.getItem('user');
}

const MSG = {
  auteur: "EPAC — Université d'Abomey-Calavi",
  role:   "Plateforme officielle des concours universitaires",
  texte:  "De la candidature à la convocation, tout se fait en ligne. Plus de déplacements, plus de files d'attente.",
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail]           = useState(location.state?.email || '');
  const [password, setPassword]     = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const [resetMode, setResetMode]   = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent]   = useState(false);
  const [resetError, setResetError] = useState('');

  const successMessage = location.state?.message;
  const messageType    = location.state?.type;
  const premiereFois   = estPremiereVisite();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authService.login(email, password);
      switch (data.user?.role) {
        case 'CANDIDAT':   navigate('/dashboard');  break;
        case 'COMMISSION': navigate('/commission'); break;
        case 'DGES':       navigate('/dges');       break;
        default:           navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'envoi');
      setResetSent(true);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-2xl' style={{ minHeight: 560 }}>

        {/* ── GAUCHE : Formulaire ── */}
        <div className='flex-1 bg-white flex flex-col justify-center px-8 py-10 sm:px-12'>

          <div className='flex items-center gap-2 mb-8'>
            <div className='w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white text-xs font-black'>U</div>
            <span className='text-base font-black text-blue-900 tracking-tight'>UniPath</span>
          </div>

          <h1 className='text-2xl font-black text-gray-900 mb-1'>
            {resetMode ? 'Mot de passe oublié' : (premiereFois ? 'Bienvenue sur UniPath' : 'Bon retour !')}
          </h1>
          <p className='text-gray-500 text-sm mb-6'>
            {resetMode
              ? 'Entrez votre email pour recevoir un lien de réinitialisation.'
              : premiereFois
              ? 'Connectez-vous pour accéder à votre espace.'
              : 'Connectez-vous à votre compte.'}
          </p>

          {!resetMode && successMessage && (
            <div className={`px-4 py-3 rounded-xl mb-4 text-sm border ${
              messageType === 'warning'
                ? 'bg-orange-50 border-orange-200 text-orange-700'
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              {successMessage}
            </div>
          )}

          {resetMode ? (
            resetSent ? (
              <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl text-sm'>
                <p className='font-semibold mb-1'>Email envoyé !</p>
                <p>Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.</p>
                <button
                  onClick={() => { setResetMode(false); setResetSent(false); setResetEmail(''); }}
                  className='mt-3 text-green-700 font-semibold hover:underline text-xs'
                >
                  ← Retour à la connexion
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className='space-y-4'>
                {resetError && (
                  <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm'>
                    {resetError}
                  </div>
                )}
                <div>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>Adresse e-mail</label>
                  <input
                    type='email'
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className='w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                    placeholder='votre@email.com'
                    required
                  />
                </div>
                <button
                  type='submit'
                  disabled={resetLoading}
                  className='w-full bg-orange-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition disabled:opacity-50'
                >
                  {resetLoading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
                </button>
                <button
                  type='button'
                  onClick={() => setResetMode(false)}
                  className='w-full text-gray-400 text-xs hover:underline'
                >
                  ← Retour à la connexion
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              {error && (
                <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm'>
                  {error}
                </div>
              )}

              <div>
                <label className='block text-xs font-medium text-gray-600 mb-1'>Adresse e-mail</label>
                <input
                  type='email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className='w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                  placeholder='votre@email.com'
                  required
                />
              </div>

              <div>
                <div className='flex items-center justify-between mb-1'>
                  <label className='text-xs font-medium text-gray-600'>Mot de passe</label>
                  <button
                    type='button'
                    onClick={() => { setResetMode(true); setResetEmail(email); }}
                    className='text-xs text-orange-500 hover:underline'
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className='relative'>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className='w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                    placeholder='••••••••'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPwd(!showPwd)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      {showPwd
                        ? <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                        : <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                      }
                    </svg>
                  </button>
                </div>
              </div>

              <button
                type='submit'
                disabled={loading}
                className='w-full bg-orange-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition disabled:opacity-50'
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          )}

          <p className='text-center text-xs text-gray-400 mt-6'>
            Pas encore de compte ?{' '}
            <a href='/register' className='text-orange-500 font-semibold hover:underline'>Créer un compte</a>
          </p>
        </div>

        {/* ── DROITE : Message + Lottie ── */}
        <div className='hidden md:flex w-5/12 bg-blue-900 flex-col justify-center px-10 py-10 relative overflow-hidden'>
          <div className='absolute top-[-60px] right-[-60px] w-48 h-48 rounded-full bg-orange-500/10' />
          <div className='absolute bottom-[-40px] left-[-30px] w-32 h-32 rounded-full bg-orange-500/8' />

          <div className='relative z-10'>

            {/* Animation Lottie */}
            <div className='flex justify-center mb-4'>
              <dotlottie-player
                src="https://lottie.host/embed/sVtX2lr3eG/sVtX2lr3eG.lottie"
                background="transparent"
                speed="1"
                style={{ width: '220px', height: '220px' }}
                loop
                autoplay
              />
            </div>

            <div className='text-orange-400 text-6xl font-black leading-none mb-4 opacity-60'>"</div>

            <h2 className='text-white text-xl font-bold leading-snug mb-4'>
              {premiereFois
                ? 'Bienvenue sur la plateforme officielle des concours universitaires du Bénin.'
                : 'Bon retour ! Vos concours et votre dossier vous attendent.'}
            </h2>

            <p className='text-blue-200 text-sm leading-relaxed mb-8'>
              {premiereFois
                ? MSG.texte
                : "Consultez l'état de vos inscriptions, déposez vos pièces manquantes et téléchargez votre convocation en quelques clics."}
            </p>

            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0'>U</div>
              <div>
                <p className='text-white text-xs font-semibold'>{MSG.auteur}</p>
                <p className='text-blue-300 text-xs'>{MSG.role}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}