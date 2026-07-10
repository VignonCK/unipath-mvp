import { useEffect, useState } from 'react';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';
import { staffEtablissementService } from '../../services/api';
import { getUser, SOUS_ROLES_ETABLISSEMENT } from '../../utils/auth';

const SOUS_ROLE_OPTIONS = [
  { value: 'SUPERVISEUR', label: 'Superviseur' },
  { value: 'CONTROLEUR', label: 'Contrôleur' },
];

const EMPTY_FORM = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  sousRole: 'CONTROLEUR',
};

export default function PersonnelAdmin() {
  const user = getUser();
  const actorSousRole = user?.sousRole || SOUS_ROLES_ETABLISSEMENT.ADMIN;
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [busy, setBusy] = useState(false);

  const canCreateSuperviseur = actorSousRole === SOUS_ROLES_ETABLISSEMENT.ADMIN;
  const createOptions = canCreateSuperviseur
    ? SOUS_ROLE_OPTIONS
    : SOUS_ROLE_OPTIONS.filter((o) => o.value === 'CONTROLEUR');

  const loadStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await staffEtablissementService.lister();
      setStaff(data.staff || []);
    } catch (err) {
      setError(err.message || 'Erreur chargement personnel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const data = await staffEtablissementService.creer(form);
      setSuccess(
        data.temporaryPassword
          ? `${data.message}. Mot de passe temporaire : ${data.temporaryPassword}`
          : data.message || 'Compte créé',
      );
      setForm({ ...EMPTY_FORM, sousRole: createOptions[0]?.value || 'CONTROLEUR' });
      await loadStaff();
    } catch (err) {
      setError(err.message || 'Création impossible');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Supprimer ${member.prenom} ${member.nom} (${member.sousRole}) ?`)) return;
    setBusy(true);
    setError('');
    try {
      await staffEtablissementService.supprimer(member.id);
      setSuccess('Compte supprimé');
      await loadStaff();
    } catch (err) {
      setError(err.message || 'Suppression impossible');
    } finally {
      setBusy(false);
    }
  };

  const canDelete = (member) => {
    if (member.id === user?.id) return false;
    if (actorSousRole === SOUS_ROLES_ETABLISSEMENT.ADMIN) {
      return member.sousRole !== SOUS_ROLES_ETABLISSEMENT.ADMIN;
    }
    if (actorSousRole === SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR) {
      return member.sousRole === SOUS_ROLES_ETABLISSEMENT.CONTROLEUR;
    }
    return false;
  };

  return (
    <AdminEtablissementLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personnel de l&apos;établissement</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les comptes superviseur et contrôleur rattachés à votre école uniquement.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
        )}

        <BentoCard className="p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">Créer un compte</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="Nom"
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Prénom"
              value={form.prenom}
              onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Téléphone"
              value={form.telephone}
              onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <select
              value={form.sousRole}
              onChange={(e) => setForm((f) => ({ ...f, sousRole: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {createOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {busy ? 'Création...' : 'Créer'}
            </button>
          </form>
        </BentoCard>

        <BentoCard className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Comptes existants</h2>
          </div>
          {loading ? (
            <p className="p-5 text-sm text-gray-500">Chargement...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rôle</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {staff.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {member.prenom} {member.nom}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{member.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-teal-50 text-teal-800 px-2 py-0.5 text-xs font-semibold">
                          {member.sousRole}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {canDelete(member) ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDelete(member)}
                            className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                          >
                            Supprimer
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>
      </div>
    </AdminEtablissementLayout>
  );
}
