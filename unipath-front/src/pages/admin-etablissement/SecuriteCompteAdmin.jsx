import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';
import { authService } from '../../services/api';
import { getUser } from '../../utils/auth';

export default function SecuriteCompteAdmin() {
  const navigate = useNavigate();
  const user = getUser();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.mustChangePassword) {
      navigate('/admin-etablissement/changer-mot-de-passe', { replace: true });
    }
  }, [navigate, user?.mustChangePassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      await authService.changePassword(currentPassword, newPassword);
      setSuccess('Votre mot de passe a été mis à jour.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.data?.mustChangePassword) {
        navigate('/admin-etablissement/changer-mot-de-passe', { replace: true });
        return;
      }
      setError(err.message || 'Impossible de mettre à jour le mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminEtablissementLayout>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Sécurité du compte</h1>
          <p className="text-sm text-gray-500 mt-1">
            Modifiez votre mot de passe personnel à tout moment.
          </p>
        </div>

        <BentoCard className="p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Au moins 8 caractères"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type={showPwd ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
              className="w-full py-3 rounded-xl bg-teal-900 text-white font-semibold hover:bg-teal-800 transition disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-6 border-t border-gray-100 pt-4">
            Mot de passe oublié ? Utilisez « Mot de passe oublié » sur la page de connexion avec votre adresse{' '}
            <span className="font-medium text-gray-700">{user?.email}</span>.
          </p>
        </BentoCard>
      </div>
    </AdminEtablissementLayout>
  );
}
