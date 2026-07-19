import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { decService } from '../../services/api';
import DECLayout from '../../components/DECLayout';
import { BentoCard } from '../../components/AcademicLayout';

const EMPTY_FORM = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
};

export default function DECCommission() {
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageIsWarning, setMessageIsWarning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [resettingId, setResettingId] = useState(null);
  const [passwordsVisible, setPasswordsVisible] = useState({});

  const togglePasswordVisible = (membreId) => {
    setPasswordsVisible((prev) => ({
      ...prev,
      [membreId]: !prev[membreId],
    }));
  };

  const charger = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await decService.listerMembresCommission();
      setMembres(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Impossible de charger les membres de la commission');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const handleResetPassword = async (membre) => {
    const label = membre.motDePasseTemporaire
      ? `réutiliser le mot de passe « ${membre.motDePasseTemporaire} »`
      : 'générer un mot de passe temporaire';
    if (!window.confirm(
      `Réinitialiser le mot de passe de ${membre.prenom} ${membre.nom} ?\n`
      + `Cela va ${label} et l'envoyer par email à ${membre.email}.`
    )) {
      return;
    }

    setResettingId(membre.id);
    setError('');
    setMessage('');
    try {
      const res = await decService.reinitialiserMotDePasseMembre(membre.id);
      const x = res.membre?.motDePasseTemporaire || res.motDePasseTemporaire;
      setMembres((prev) =>
        prev.map((m) =>
          m.id === membre.id
            ? {
                ...m,
                motDePasseTemporaire: x || m.motDePasseTemporaire,
                demandeResetMotDePasse: false,
                demandeResetMotDePasseAt: null,
              }
            : m
        )
      );
      if (x) {
        setPasswordsVisible((prev) => ({ ...prev, [membre.id]: true }));
      }
      setMessageIsWarning(res.emailEnvoye === false);
      setMessage(res.message || `Mot de passe envoyé à ${membre.email}.`);
    } catch (err) {
      const x = err.data?.motDePasseTemporaire || err.response?.data?.motDePasseTemporaire;
      if (x) {
        setMembres((prev) =>
          prev.map((m) =>
            m.id === membre.id
              ? {
                  ...m,
                  motDePasseTemporaire: x,
                  demandeResetMotDePasse: false,
                  demandeResetMotDePasseAt: null,
                }
              : m
          )
        );
        setPasswordsVisible((prev) => ({ ...prev, [membre.id]: true }));
      }
      setMessageIsWarning(false);
      setError(err.message || 'Erreur lors de la réinitialisation');
    } finally {
      setResettingId(null);
    }
  };

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setError('');
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.nom.trim()) errors.nom = 'Obligatoire';
    if (!form.prenom.trim()) errors.prenom = 'Obligatoire';
    if (!form.email.trim()) {
      errors.email = 'Obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Email invalide';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setCreating(true);
    setError('');
    setMessage('');
    try {
      const res = await decService.creerMembreCommission({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim().toLowerCase(),
        telephone: form.telephone.trim() || undefined,
      });
      setMessageIsWarning(res.emailEnvoye === false);
      setMessage(res.message || 'Membre créé avec succès');
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await charger();
      if (res.membre?.motDePasseTemporaire) {
        setPasswordsVisible((prev) => ({ ...prev, [res.membre.id]: true }));
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du compte');
    } finally {
      setCreating(false);
    }
  };

  const filtered = membres.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      m.nom?.toLowerCase().includes(q)
      || m.prenom?.toLowerCase().includes(q)
      || m.email?.toLowerCase().includes(q)
      || m.telephone?.toLowerCase().includes(q)
    );
  });

  return (
    <DECLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Commission</h1>
            <p className="text-gray-500 text-sm mt-1">
              Consultez les membres de la commission et créez leurs comptes de connexion.
              Les rôles examinateur / contrôleur se définissent ensuite par concours.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau membre
          </button>
        </div>

        {message && (
          <div className={`rounded-xl border px-4 py-3 text-sm flex justify-between gap-3 ${
            messageIsWarning
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-green-200 bg-green-50 text-green-800'
          }`}>
            <span>{message}</span>
            <button
              type="button"
              onClick={() => { setMessage(''); setMessageIsWarning(false); }}
              className={`hover:underline text-xs ${messageIsWarning ? 'text-amber-800' : 'text-green-700'}`}
            >
              Fermer
            </button>
          </div>
        )}
        {error && !modalOpen && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <BentoCard className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base font-bold text-slate-800">
              Membres ({filtered.length}
              {search.trim() && filtered.length !== membres.length ? ` / ${membres.length}` : ''})
            </h2>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un membre…"
              className="w-full sm:w-64 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 py-8 text-center">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              {membres.length === 0
                ? 'Aucun membre pour le moment. Créez le premier compte commission.'
                : 'Aucun résultat pour cette recherche.'}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nom</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Téléphone</th>
                    <th className="px-4 py-3 font-semibold">Affectations</th>
                    <th className="px-4 py-3 font-semibold">Mot de passe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">
                          {m.nom} {m.prenom}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{m.email}</td>
                      <td className="px-4 py-3 text-gray-600">{m.telephone || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {typeof m.nbAffectations === 'number' ? m.nbAffectations : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2 min-w-[12rem]">
                          {m.motDePasseTemporaire ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="px-2 py-1 rounded bg-slate-100 text-slate-800 text-xs font-mono tracking-wide">
                                {passwordsVisible[m.id]
                                  ? m.motDePasseTemporaire
                                  : '•'.repeat(Math.max(8, m.motDePasseTemporaire.length))}
                              </code>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisible(m.id)}
                                className="text-xs font-semibold text-sky-700 hover:text-sky-900"
                                title={passwordsVisible[m.id] ? 'Masquer' : 'Afficher'}
                              >
                                {passwordsVisible[m.id] ? 'Masquer' : 'Afficher'}
                              </button>
                              {m.demandeResetMotDePasse && (
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                                  title={
                                    m.demandeResetMotDePasseAt
                                      ? `Demande du ${new Date(m.demandeResetMotDePasseAt).toLocaleString('fr-FR')}`
                                      : 'Le membre a demandé une réinitialisation'
                                  }
                                >
                                  Mot de passe oublié
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-gray-400">Aucun mot de passe temporaire</span>
                              {m.demandeResetMotDePasse && (
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                                  title={
                                    m.demandeResetMotDePasseAt
                                      ? `Demande du ${new Date(m.demandeResetMotDePasseAt).toLocaleString('fr-FR')}`
                                      : 'Le membre a demandé une réinitialisation'
                                  }
                                >
                                  Mot de passe oublié
                                </span>
                              )}
                            </div>
                          )}
                          <button
                            type="button"
                            disabled={resettingId === m.id}
                            onClick={() => handleResetPassword(m)}
                            title="Réinitialise le mot de passe et l'envoie par email au membre"
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition w-fit ${
                              m.demandeResetMotDePasse
                                ? 'bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-300'
                                : 'bg-sky-600 text-white hover:bg-sky-700'
                            }`}
                          >
                            {resettingId === m.id
                              ? 'Envoi…'
                              : m.demandeResetMotDePasse
                                ? 'Réinitialiser (demande en attente)'
                                : m.motDePasseTemporaire
                                  ? 'Réinitialiser (renvoyer par email)'
                                  : 'Réinitialiser le mot de passe'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>
      </div>

      {modalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Nouveau membre</h2>
                <p className="text-xs text-gray-500 mt-0.5">Création d&apos;un compte commission</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-5 py-4 space-y-3">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${formErrors.nom ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {formErrors.nom && <p className="text-xs text-red-600 mt-1">{formErrors.nom}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${formErrors.prenom ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {formErrors.prenom && <p className="text-xs text-red-600 mt-1">{formErrors.prenom}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${formErrors.email ? 'border-red-500' : 'border-gray-200'}`}
                  autoComplete="off"
                />
                {formErrors.email && <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>

              <p className="text-xs text-gray-500">
                Un mot de passe temporaire sera généré automatiquement et envoyé par email au membre.
                Il devra le changer à la première connexion. Affectez-le ensuite à un concours
                depuis Gestion des concours.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {creating ? 'Création…' : 'Créer et envoyer les identifiants'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </DECLayout>
  );
}
