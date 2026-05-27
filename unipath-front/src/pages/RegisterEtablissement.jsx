import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function RegisterEtablissement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nom: '',
    type: '',
    ville: '',
    adresse: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.type || !form.ville || !form.email || !form.password || !form.confirmPassword) {
      setError('Tous les champs obligatoires doivent etre renseignes');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await authService.registerEtablissement({
        nom: form.nom,
        type: form.type,
        ville: form.ville,
        adresse: form.adresse || null,
        email: form.email,
        password: form.password,
      });

      navigate('/login', {
        state: {
          message: 'Compte etablissement cree avec succes. Vous pouvez maintenant vous connecter.',
          email: form.email,
        },
      });
    } catch (err) {
      setError(err.message || 'Erreur lors de la creation du compte etablissement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen academic-bg custom-scrollbar flex items-center justify-center p-4 sm:p-6 animate-slide-in'>
      <div className='w-full max-w-2xl glass-card-intense bg-white/95 backdrop-blur-sm p-6 sm:p-8'>
        <div className='flex items-center gap-2 mb-6'>
          <div className='w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white text-xs font-black'>U</div>
          <span className='text-base font-black text-blue-900 tracking-tight'>UniPath</span>
        </div>

        <h1 className='text-xl sm:text-2xl font-black text-gray-900 mb-1'>Creation compte etablissement</h1>
        <p className='text-gray-500 text-xs sm:text-sm mb-6'>
          Creez le compte de votre etablissement pour gerer votre profil et votre logo officiel.
        </p>

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>Nom de l etablissement *</label>
            <input
              type='text'
              value={form.nom}
              onChange={set('nom')}
              className='input-glass w-full px-4 py-2.5 text-sm'
              placeholder='Institut Superieur Exemple'
              required
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Type *</label>
              <select
                value={form.type}
                onChange={set('type')}
                className='input-glass w-full px-4 py-2.5 text-sm'
                required
              >
                <option value=''>Selectionner</option>
                <option value='PUBLIC'>Public</option>
                <option value='PRIVE'>Prive</option>
              </select>
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Ville *</label>
              <input
                type='text'
                value={form.ville}
                onChange={set('ville')}
                className='input-glass w-full px-4 py-2.5 text-sm'
                placeholder='Cotonou'
                required
              />
            </div>
          </div>

          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>Adresse</label>
            <input
              type='text'
              value={form.adresse}
              onChange={set('adresse')}
              className='input-glass w-full px-4 py-2.5 text-sm'
              placeholder='Quartier, rue, reference'
            />
          </div>

          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>Email *</label>
            <input
              type='email'
              value={form.email}
              onChange={set('email')}
              className='input-glass w-full px-4 py-2.5 text-sm'
              placeholder='contact@etablissement.bj'
              required
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Mot de passe *</label>
              <input
                type='password'
                value={form.password}
                onChange={set('password')}
                className='input-glass w-full px-4 py-2.5 text-sm'
                placeholder='••••••••'
                required
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Confirmer mot de passe *</label>
              <input
                type='password'
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                className='input-glass w-full px-4 py-2.5 text-sm'
                placeholder='••••••••'
                required
              />
            </div>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='btn-academic w-full py-2.5 text-sm disabled:opacity-50'
          >
            {loading ? 'Creation...' : 'Creer le compte etablissement'}
          </button>
        </form>

        <p className='text-center text-xs text-gray-400 mt-6'>
          Deja un compte ?{' '}
          <a href='/login' className='text-orange-500 font-semibold hover:underline'>Se connecter</a>
          {' · '}
          <a href='/register' className='text-orange-500 font-semibold hover:underline'>Inscription candidat</a>
        </p>
      </div>
    </div>
  );
}
