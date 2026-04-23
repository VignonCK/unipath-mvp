// src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import bgImage from '../assets/examen-eleves.jpg';

export default function Register() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    dateNaiss: '',
    lieuNaiss: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleEtape1 = (e) => {
    e.preventDefault();
    if (!formData.nom || !formData.prenom) {
      setError('Nom et prénom sont obligatoires');
      return;
    }
    setEtape(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await authService.register(formData);
      navigate('/login', { state: { message: 'Compte créé ! Connectez-vous.' } });
    } catch (err) {
      setError(err.message);
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

      {/* Carte */}
      <div className='relative w-full max-w-lg'>

        {/* Logo */}
        <div className='text-center mb-6'>
          <h1 className='text-4xl font-black text-white tracking-tight'>UniPath</h1>
          <p className='text-blue-200 text-sm mt-1'>Plateforme universitaire numérique</p>
          <p className='text-blue-300 text-xs mt-1'>EPAC — Université d'Abomey-Calavi</p>
        </div>

        <div className='bg-white rounded-2xl shadow-2xl p-8'>

          <h2 className='text-xl font-bold text-blue-900 text-center mb-2'>
            Créer un compte
          </h2>

          {/* Barre de progression */}
          <div className='flex items-center gap-2 mb-6'>
            <div className={`h-2 flex-1 rounded-full ${etape >= 1 ? 'bg-amber-500' : 'bg-gray-200'}`} />
            <div className={`h-2 flex-1 rounded-full ${etape >= 2 ? 'bg-amber-500' : 'bg-gray-200'}`} />
          </div>

          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm'>
              ❌ {error}
            </div>
          )}

          {/* ÉTAPE 1 */}
          {etape === 1 && (
            <form onSubmit={handleEtape1} className='space-y-4'>
              <p className='text-sm text-gray-500 mb-2'>Étape 1/2 — Informations personnelles</p>

              {[
                { name: 'nom', label: 'Nom', type: 'text', required: true },
                { name: 'prenom', label: 'Prénom', type: 'text', required: true },
                { name: 'telephone', label: 'Téléphone', type: 'tel', required: true },
                { name: 'dateNaiss', label: 'Date de naissance', type: 'date', required: true },
                { name: 'lieuNaiss', label: 'Lieu de naissance', type: 'text', required: true },
              ].map((field) => (
                <div key={field.name}>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {field.label} {field.required && <span className='text-red-500'>*</span>}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required={field.required}
                    className='w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm'
                  />
                </div>
              ))}

              <button type='submit' className='w-full bg-amber-500 text-white py-3 rounded-xl hover:bg-amber-600 font-bold text-sm transition'>
                Suivant →
              </button>
            </form>
          )}

          {/* ÉTAPE 2 */}
          {etape === 2 && (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <p className='text-sm text-gray-500 mb-2'>Étape 2/2 — Connexion</p>

              {/* Email */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className='w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm'
                  placeholder='votre@email.com'
                />
              </div>

              {/* Mot de passe avec œil */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Mot de passe</label>
                <div className='relative'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name='password'
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className='w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm'
                    placeholder='••••••••'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg'
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Confirmer mot de passe avec œil */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Confirmer le mot de passe</label>
                <div className='relative'>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name='confirmPassword'
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className='w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm'
                    placeholder='••••••••'
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg'
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={() => setEtape(1)}
                  className='flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 text-sm font-medium'
                >
                  ← Retour
                </button>
                <button
                  type='submit'
                  disabled={loading}
                  className='flex-1 bg-amber-500 text-white py-3 rounded-xl hover:bg-amber-600 font-bold text-sm disabled:opacity-50 transition'
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </div>
            </form>
          )}

          <div className='mt-6 pt-6 border-t border-gray-100 space-y-2 text-center'>
            <p className='text-sm text-gray-500'>
              Déjà un compte ?{' '}
              <a href='/login' className='text-amber-600 font-medium hover:underline'>Se connecter</a>
            </p>
            <p className='text-sm text-gray-500'>
              <a href='/' className='text-amber-600 font-medium hover:underline'>← Retour à l'accueil</a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}