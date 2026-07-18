import { useCallback, useEffect, useState } from 'react';
import { concoursService, dgesService } from '../services/api';
import DECLayout from '../components/DECLayout';
import { BentoCard } from '../components/AcademicLayout';

const FORM_INIT = { nom: '', prenom: '', email: '', telephone: '' };
const LIMITES = { EXAMINATEUR: 10, CONTROLEUR: 5 };

function MembreRow({ membre, onDelete, deleting }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/80">
      <td className="py-3 px-4 font-medium text-gray-900">
        {membre.prenom} {membre.nom}
      </td>
      <td className="py-3 px-4 text-gray-600">{membre.email}</td>
      <td className="py-3 px-4 text-gray-500">{membre.telephone || '—'}</td>
      <td className="py-3 px-4 text-right">
        <button
          type="button"
          onClick={() => onDelete(membre.id)}
          disabled={deleting}
          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          Supprimer
        </button>
      </td>
    </tr>
  );
}

function MembreSection({
  title, sousRole, membres, limite, form, setForm, onSubmit, submitting, onDelete, deletingId, message, error,
}) {
  return (
    <BentoCard className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">
            {membres.length} compte{membres.length > 1 ? 's' : ''} actif{membres.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {membres.length > 0 ? (
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 px-4 font-semibold">Nom</th>
                <th className="py-2 px-4 font-semibold">Email</th>
                <th className="py-2 px-4 font-semibold">Téléphone</th>
                <th className="py-2 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {membres.map((m) => (
                <MembreRow
                  key={m.id}
                  membre={m}
                  onDelete={onDelete}
                  deleting={deletingId === m.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-6">Aucun membre pour le moment.</p>
      )}

      {membres.length < limite && (
        <form onSubmit={(e) => onSubmit(e, sousRole)} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
          <input
            type="text"
            required
            placeholder="Nom"
            value={form.nom}
            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg"
          />
          <input
            type="text"
            required
            placeholder="Prénom"
            value={form.prenom}
            onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg"
          />
          <input
            type="tel"
            placeholder="Téléphone (optionnel)"
            value={form.telephone}
            onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg"
          />
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-emerald-800 text-white font-semibold hover:bg-emerald-900 disabled:opacity-50"
            >
              {submitting ? 'Création...' : `Ajouter ${title.toLowerCase()}`}
            </button>
          </div>
        </form>
      )}
    </BentoCard>
  );
}

export default function DECCommission() {
  const [concoursList, setConcoursList] = useState([]);
  const [concoursId, setConcoursId] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [examForm, setExamForm] = useState(FORM_INIT);
  const [ctrlForm, setCtrlForm] = useState(FORM_INIT);
  const [submittingRole, setSubmittingRole] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [examMessage, setExamMessage] = useState('');
  const [examError, setExamError] = useState('');
  const [ctrlMessage, setCtrlMessage] = useState('');
  const [ctrlError, setCtrlError] = useState('');
  const [etudeBusy, setEtudeBusy] = useState(false);

  useEffect(() => {
    setLoadingList(true);
    concoursService.getAll()
      .then((list) => {
        const rows = Array.isArray(list) ? list : [];
        setConcoursList(rows);
        if (rows.length === 1) setConcoursId(rows[0].id);
      })
      .catch((err) => setError(err.message || 'Impossible de charger les concours'))
      .finally(() => setLoadingList(false));
  }, []);

  const charger = useCallback(async () => {
    if (!concoursId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await dgesService.getCommissionConcours(concoursId);
      setData(res);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [concoursId]);

  useEffect(() => {
    charger();
  }, [charger]);

  const handleCreate = async (e, sousRole) => {
    e.preventDefault();
    if (!concoursId) return;
    const form = sousRole === 'EXAMINATEUR' ? examForm : ctrlForm;
    const setMessage = sousRole === 'EXAMINATEUR' ? setExamMessage : setCtrlMessage;
    const setFormError = sousRole === 'EXAMINATEUR' ? setExamError : setCtrlError;
    const resetForm = sousRole === 'EXAMINATEUR' ? setExamForm : setCtrlForm;

    setSubmittingRole(sousRole);
    setFormError('');
    setMessage('');
    try {
      const res = await dgesService.creerMembreCommissionConcours(concoursId, {
        ...form,
        sousRole,
      });
      setMessage(res.message || 'Membre créé');
      resetForm(FORM_INIT);
      await charger();
    } catch (err) {
      setFormError(err.message || 'Erreur lors de la création');
    } finally {
      setSubmittingRole('');
    }
  };

  const handleDelete = async (membreId) => {
    if (!window.confirm('Supprimer ce membre de la commission ? Cette action est irréversible.')) return;
    setDeletingId(membreId);
    setExamError('');
    setCtrlError('');
    try {
      await dgesService.supprimerMembreCommissionConcours(concoursId, membreId);
      await charger();
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId('');
    }
  };

  const handleToggleEtude = async () => {
    const c = data?.concours;
    if (!c) return;
    const cloture = Boolean(c.etudeCloturee);
    if (cloture) {
      if (!confirm(`Rouvrir l'étude des dossiers pour « ${c.libelle} » ?\nLes examinateurs et contrôleurs pourront à nouveau modifier les dossiers.`)) {
        return;
      }
    } else if (!confirm(
      `Clôturer l'étude des dossiers pour « ${c.libelle} » ?\nPlus aucune modification (verdicts / décisions) ne sera possible tant que l'étude reste clôturée.`,
    )) {
      return;
    }

    setEtudeBusy(true);
    setError('');
    try {
      const res = cloture
        ? await dgesService.rouvrirEtudeConcours(c.id)
        : await dgesService.cloturerEtudeConcours(c.id);
      setData((prev) => (prev ? {
        ...prev,
        concours: {
          ...prev.concours,
          etudeCloturee: res?.concours?.etudeCloturee ?? !cloture,
          etudeClotureeAt: res?.concours?.etudeClotureeAt ?? null,
        },
      } : prev));
    } catch (err) {
      setError(err.message || 'Action étude impossible');
    } finally {
      setEtudeBusy(false);
    }
  };

  const concours = data?.concours;

  return (
    <DECLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Commission</h1>
          <p className="text-sm text-gray-500 mt-1">
            Examinateurs et contrôleurs par concours — ouverture / clôture de l&apos;étude
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-600 mb-2" htmlFor="filter-concours-commission">
            Choisir un concours
          </label>
          <select
            id="filter-concours-commission"
            value={concoursId}
            onChange={(e) => {
              setConcoursId(e.target.value);
              setExamMessage('');
              setCtrlMessage('');
              setExamError('');
              setCtrlError('');
            }}
            disabled={loadingList}
            className="w-full sm:max-w-lg rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">— Sélectionner —</option>
            {concoursList.map((c) => (
              <option key={c.id} value={c.id}>{c.libelle}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!concoursId && !loadingList && (
          <p className="text-sm text-gray-500">Sélectionnez un concours pour gérer sa commission.</p>
        )}

        {loading && concoursId && <p className="text-gray-500 text-sm">Chargement…</p>}

        {!loading && concours && (
          <>
            <BentoCard className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{concours.libelle}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Étude :{' '}
                    {concours.etudeCloturee ? (
                      <span className="font-semibold text-red-700">Clôturée</span>
                    ) : (
                      <span className="font-semibold text-emerald-700">Ouverte</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleEtude}
                  disabled={etudeBusy}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                    concours.etudeCloturee
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  {etudeBusy
                    ? '…'
                    : (concours.etudeCloturee ? 'Rouvrir l\'étude' : 'Clôturer l\'étude')}
                </button>
              </div>
            </BentoCard>

            <MembreSection
              title="Examinateurs"
              sousRole="EXAMINATEUR"
              membres={data.examinateurs || []}
              limite={LIMITES.EXAMINATEUR}
              form={examForm}
              setForm={setExamForm}
              onSubmit={handleCreate}
              submitting={submittingRole === 'EXAMINATEUR'}
              onDelete={handleDelete}
              deletingId={deletingId}
              message={examMessage}
              error={examError}
            />

            <MembreSection
              title="Contrôleur"
              sousRole="CONTROLEUR"
              membres={data.controleurs || []}
              limite={LIMITES.CONTROLEUR}
              form={ctrlForm}
              setForm={setCtrlForm}
              onSubmit={handleCreate}
              submitting={submittingRole === 'CONTROLEUR'}
              onDelete={handleDelete}
              deletingId={deletingId}
              message={ctrlMessage}
              error={ctrlError}
            />
          </>
        )}
      </div>
    </DECLayout>
  );
}
