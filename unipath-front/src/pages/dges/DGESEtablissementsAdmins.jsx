import { useEffect, useState } from 'react';
import { dgesService, etablissementService } from '../../services/api';
import DGESLayout from '../../components/DGESLayout';
import { BentoCard } from '../../components/AcademicLayout';

const FORM_INIT = { nom: '', prenom: '', email: '', telephone: '' };
const ETAB_FORM_INIT = { nom: '', ville: '', type: 'PRIVE', adresse: '', email: '' };

export default function DGESEtablissementsAdmins() {
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageMessage, setPageMessage] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEtab, setSelectedEtab] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [form, setForm] = useState(FORM_INIT);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [modalError, setModalError] = useState('');
  const [passwordsVisible, setPasswordsVisible] = useState({});
  const [resettingId, setResettingId] = useState(null);
  const [messageIsWarning, setMessageIsWarning] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [etabForm, setEtabForm] = useState(ETAB_FORM_INIT);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const chargerEtablissements = () => {
    setLoading(true);
    setError('');
    return etablissementService
      .getAll()
      .then((data) =>
        setEtablissements((data.etablissements || []).filter((e) => e.type === 'PRIVE'))
      )
      .catch((err) => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    chargerEtablissements();
  }, []);

  const ouvrirModal = async (etab) => {
    setSelectedEtab(etab);
    setModalOpen(true);
    setForm(FORM_INIT);
    setMessage('');
    setMessageIsWarning(false);
    setModalError('');
    setPasswordsVisible({});
    setResettingId(null);
    setLoadingAdmins(true);
    try {
      const data = await dgesService.listerAdminsEtablissement(etab.id);
      setAdmins(data.admins || []);
    } catch (err) {
      setModalError(err.message || 'Erreur chargement admins');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const fermerModal = () => {
    setModalOpen(false);
    setSelectedEtab(null);
    setAdmins([]);
    setPasswordsVisible({});
    setResettingId(null);
  };

  const togglePasswordVisible = (adminId) => {
    setPasswordsVisible((prev) => ({ ...prev, [adminId]: !prev[adminId] }));
  };

  const handleResetPassword = async (admin) => {
    if (!selectedEtab) return;
    const label = admin.motDePasseTemporaire
      ? `réutiliser le mot de passe temporaire « ${admin.motDePasseTemporaire} »`
      : 'générer un mot de passe temporaire';
    if (!window.confirm(
      `Réinitialiser le mot de passe de ${admin.prenom} ${admin.nom} ?\n`
      + `Cela va ${label} et l'envoyer par email à ${admin.email}.`
    )) {
      return;
    }
    setResettingId(admin.id);
    setModalError('');
    setMessage('');
    setMessageIsWarning(false);
    try {
      const res = await dgesService.reinitialiserMotDePasseAdmin(selectedEtab.id, admin.id);
      const x = res.admin?.motDePasseTemporaire || res.motDePasseTemporaire;
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === admin.id
            ? {
                ...a,
                motDePasseTemporaire: x || a.motDePasseTemporaire,
                demandeResetMotDePasse: false,
                demandeResetMotDePasseAt: null,
              }
            : a
        )
      );
      setMessageIsWarning(res.emailEnvoye === false);
      setMessage(res.message || 'Mot de passe réinitialisé');
      if (x) setPasswordsVisible((prev) => ({ ...prev, [admin.id]: true }));
    } catch (err) {
      const x = err.data?.motDePasseTemporaire || err.response?.data?.motDePasseTemporaire
        || err.data?.admin?.motDePasseTemporaire;
      if (x) {
        setAdmins((prev) =>
          prev.map((a) =>
            a.id === admin.id
              ? {
                  ...a,
                  motDePasseTemporaire: x,
                  demandeResetMotDePasse: false,
                  demandeResetMotDePasseAt: null,
                }
              : a
          )
        );
        setPasswordsVisible((prev) => ({ ...prev, [admin.id]: true }));
      }
      setMessageIsWarning(false);
      setModalError(err.message || 'Erreur lors de la réinitialisation');
    } finally {
      setResettingId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedEtab) return;
    setSubmitting(true);
    setModalError('');
    setMessage('');
    setMessageIsWarning(false);
    try {
      const data = await dgesService.creerAdminEtablissement(selectedEtab.id, {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim().toLowerCase(),
        telephone: form.telephone.trim() || undefined,
      });
      setMessageIsWarning(data.emailEnvoye === false);
      setMessage(data.message || 'Administrateur créé');
      setForm(FORM_INIT);
      const refreshed = await dgesService.listerAdminsEtablissement(selectedEtab.id);
      setAdmins(refreshed.admins || []);
      if (data.admin?.motDePasseTemporaire) {
        setPasswordsVisible((prev) => ({ ...prev, [data.admin.id]: true }));
      }
    } catch (err) {
      setMessageIsWarning(false);
      setModalError(err.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (adminId) => {
    if (!selectedEtab) return;
    if (!window.confirm('Supprimer cet administrateur ? Cette action est irréversible.')) return;
    setModalError('');
    try {
      await dgesService.supprimerAdminEtablissement(selectedEtab.id, adminId);
      setAdmins((prev) => prev.filter((a) => a.id !== adminId));
      setMessage('Administrateur supprimé');
    } catch (err) {
      setModalError(err.message || 'Erreur lors de la suppression');
    }
  };

  const ouvrirCreateModal = () => {
    setEtabForm(ETAB_FORM_INIT);
    setCreateError('');
    setCreateModalOpen(true);
  };

  const fermerCreateModal = () => {
    setCreateModalOpen(false);
    setCreateError('');
  };

  const handleCreateEtablissement = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const data = await dgesService.creerEtablissement({ ...etabForm, type: 'PRIVE' });
      setPageMessage(data.message || 'Établissement créé');
      fermerCreateModal();
      await chargerEtablissements();
    } catch (err) {
      setCreateError(err.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEtablissement = async (etab) => {
    if (!window.confirm(`Supprimer « ${etab.nom} » ? Tous les administrateurs et données liées seront supprimés.`)) return;
    setPageMessage('');
    setError('');
    try {
      const data = await dgesService.supprimerEtablissement(etab.id);
      setPageMessage(data.message || 'Établissement supprimé');
      setEtablissements((prev) => prev.filter((e) => e.id !== etab.id));
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <DGESLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-slide-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Établissements privés &amp; Admins</h1>
            <p className="text-gray-500 text-sm mt-1">
              Module 2 — gérez les établissements privés et leurs administrateurs.
            </p>
          </div>
          <button
            type="button"
            onClick={ouvrirCreateModal}
            className="px-4 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 transition shrink-0"
          >
            + Ajouter un établissement privé
          </button>
        </div>

        {pageMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{pageMessage}</div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <BentoCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Nom</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Ville</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Type</th>
                    <th className="text-right px-6 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {etablissements.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                        Aucun établissement privé enregistré.
                      </td>
                    </tr>
                  ) : (
                    etablissements.map((etab) => (
                      <tr key={etab.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">{etab.nom}</td>
                        <td className="px-6 py-4 text-gray-600">{etab.ville}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                            {etab.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => ouvrirModal(etab)}
                            className="text-sm font-semibold text-blue-900 hover:text-orange-500 transition"
                          >
                            Gérer les admins
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEtablissement(etab)}
                            className="text-sm font-semibold text-red-600 hover:text-red-800 transition"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </BentoCard>
        )}
      </div>

      {modalOpen && selectedEtab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admins — {selectedEtab.nom}</h2>
                <p className="text-xs text-gray-500">{selectedEtab.ville} · {selectedEtab.type}</p>
              </div>
              <button type="button" onClick={fermerModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <div className="p-6 space-y-6">
              {message && (
                <div
                  className={`rounded-lg text-sm px-4 py-3 border ${
                    messageIsWarning
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-green-50 border-green-200 text-green-800'
                  }`}
                >
                  {message}
                </div>
              )}
              {modalError && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{modalError}</div>}

              <section>
                <h3 className="text-sm font-bold text-gray-800 mb-3">Administrateurs existants</h3>
                {loadingAdmins ? (
                  <div className="flex justify-center py-6">
                    <div className="w-8 h-8 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin" />
                  </div>
                ) : admins.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucun administrateur pour cet établissement.</p>
                ) : (
                  <ul className="space-y-3">
                    {admins.map((admin) => (
                      <li key={admin.id} className="rounded-lg border border-gray-100 px-4 py-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-900">{admin.prenom} {admin.nom}</p>
                            <p className="text-xs text-gray-500">{admin.email}{admin.telephone ? ` · ${admin.telephone}` : ''}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDelete(admin.id)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 shrink-0"
                          >
                            Supprimer
                          </button>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[12rem]">
                          {admin.motDePasseTemporaire ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="px-2 py-1 rounded bg-slate-100 text-slate-800 text-xs font-mono tracking-wide">
                                {passwordsVisible[admin.id]
                                  ? admin.motDePasseTemporaire
                                  : '•'.repeat(Math.max(8, admin.motDePasseTemporaire.length))}
                              </code>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisible(admin.id)}
                                className="text-xs font-semibold text-sky-700 hover:text-sky-900"
                              >
                                {passwordsVisible[admin.id] ? 'Masquer' : 'Afficher'}
                              </button>
                              {admin.demandeResetMotDePasse && (
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                                  title={
                                    admin.demandeResetMotDePasseAt
                                      ? `Demande du ${new Date(admin.demandeResetMotDePasseAt).toLocaleString('fr-FR')}`
                                      : 'L\'administrateur a demandé une réinitialisation'
                                  }
                                >
                                  Mot de passe oublié
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-gray-400">Aucun mot de passe temporaire</span>
                              {admin.demandeResetMotDePasse && (
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                                  title={
                                    admin.demandeResetMotDePasseAt
                                      ? `Demande du ${new Date(admin.demandeResetMotDePasseAt).toLocaleString('fr-FR')}`
                                      : 'L\'administrateur a demandé une réinitialisation'
                                  }
                                >
                                  Mot de passe oublié
                                </span>
                              )}
                            </div>
                          )}
                          <button
                            type="button"
                            disabled={resettingId === admin.id}
                            onClick={() => handleResetPassword(admin)}
                            title="Réinitialise le mot de passe et l'envoie par email à l'administrateur"
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition w-fit ${
                              admin.demandeResetMotDePasse
                                ? 'bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-300'
                                : 'bg-sky-600 text-white hover:bg-sky-700'
                            }`}
                          >
                            {resettingId === admin.id
                              ? 'Envoi…'
                              : admin.demandeResetMotDePasse
                                ? 'Réinitialiser (demande en attente)'
                                : admin.motDePasseTemporaire
                                  ? 'Réinitialiser (renvoyer par email)'
                                  : 'Réinitialiser le mot de passe'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-800 mb-1">Créer un administrateur</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Un mot de passe temporaire sera généré automatiquement et envoyé par email à l&apos;administrateur.
                  Il devra le changer à la première connexion.
                </p>
                <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
                    <input required value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Prénom</label>
                    <input required value={form.prenom} onChange={(e) => setForm((p) => ({ ...p, prenom: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
                    <input value={form.telephone} onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60"
                    >
                      {submitting ? 'Création…' : 'Créer et envoyer les identifiants'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
      )}

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Nouvel établissement</h2>
              <button type="button" onClick={fermerCreateModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreateEtablissement} className="p-6 space-y-4">
              {createError && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{createError}</div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
                <input required value={etabForm.nom} onChange={(e) => setEtabForm((p) => ({ ...p, nom: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ville *</label>
                <input required value={etabForm.ville} onChange={(e) => setEtabForm((p) => ({ ...p, ville: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Adresse</label>
                <input value={etabForm.adresse} onChange={(e) => setEtabForm((p) => ({ ...p, adresse: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email (optionnel)</label>
                <input type="email" value={etabForm.email} onChange={(e) => setEtabForm((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={fermerCreateModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Annuler</button>
                <button type="submit" disabled={creating} className="px-5 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60">
                  {creating ? 'Création…' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DGESLayout>
  );
}
