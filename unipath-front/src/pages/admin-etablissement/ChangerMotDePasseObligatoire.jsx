import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { getUser } from '../../utils/auth';

export default function ChangerMotDePasseObligatoire() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    if (user && !user.mustChangePassword) {
      navigate('/admin-etablissement/campagnes', { replace: true });
    }
  }, [navigate, user]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await authService.changeInitialPassword(currentPassword, newPassword);
      navigate('/admin-etablissement/campagnes', { replace: true });
    } catch (err) {
      setError(err.message || 'Impossible de mettre à jour le mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full mb-3">
            Première connexion
          </span>
          <h1 className="text-xl font-black text-gray-900">Définissez votre mot de passe</h1>
          <p className="text-sm text-gray-500 mt-2">
            Bonjour {user?.prenom} {user?.nom}. Votre mot de passe temporaire ne peut pas être conservé.
            Choisissez un mot de passe personnel pour accéder à votre espace administrateur.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Mot de passe temporaire
            </label>
            <input
              type={showPwd ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Celui reçu par email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type={showPwd ? 'text' : 'password'}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Au moins 8 caractères"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type={showPwd ? 'text' : 'password'}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showPwd}
              onChange={(e) => setShowPwd(e.target.checked)}
              className="rounded border-gray-300"
            />
            Afficher les mots de passe
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer et accéder à mon espace'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { authService.logout(); navigate('/login'); }}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
