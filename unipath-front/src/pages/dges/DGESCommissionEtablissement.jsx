import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dgesService } from '../../services/api';
import DGESLayout from '../../components/DGESLayout';
import { BentoCard } from '../../components/AcademicLayout';

const FORM_INIT = { nom: '', prenom: '', email: '', telephone: '' };

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

function MembreSection({ title, sousRole, membres, limite, form, setForm, onSubmit, submitting, onDelete, deletingId, message, error }) {
  return (
    <BentoCard className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">
            {membres.length} / {limite} compte{limite > 1 ? 's' : ''} actif{membres.length > 1 ? 's' : ''}
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
              className="px-4 py-2 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 disabled:opacity-50"
            >
              {submitting ? 'Création...' : `Ajouter ${title.toLowerCase()}`}
            </button>
          </div>
        </form>
      )}
    </BentoCard>
  );
}

export default function DGESCommissionEtablissement() {
  const { etablissementId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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

  const charger = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dgesService.getCommissionEtablissement(etablissementId);
      setData(res);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [etablissementId]);

  useEffect(() => {
    charger();
  }, [charger]);

  const handleCreate = async (e, sousRole) => {
    e.preventDefault();
    const form = sousRole === 'EXAMINATEUR' ? examForm : ctrlForm;
    const setMessage = sousRole === 'EXAMINATEUR' ? setExamMessage : setCtrlMessage;
    const setFormError = sousRole === 'EXAMINATEUR' ? setExamError : setCtrlError;
    const resetForm = sousRole === 'EXAMINATEUR' ? setExamForm : setCtrlForm;

    setSubmittingRole(sousRole);
    setFormError('');
    setMessage('');
    try {
      const res = await dgesService.creerMembreCommission(etablissementId, {
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
      await dgesService.supprimerMembreCommission(etablissementId, membreId);
      await charger();
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId('');
    }
  };

  const limites = data?.limites || { EXAMINATEUR: 2, CONTROLEUR: 1 };
  const etab = data?.etablissement;

  return (
    <DGESLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dges-etablissements-admins')}
            className="text-sm text-teal-700 hover:text-teal-900 font-medium"
          >
            ← Retour aux établissements
          </button>
        </div>

        {loading && <p className="text-gray-500">Chargement...</p>}
        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && etab && (
          <>
            <BentoCard className="p-6">
              <h1 className="text-2xl font-black text-gray-900">Commission — {etab.nom}</h1>
              <p className="text-gray-600 mt-1">
                {etab.ville || '—'} · {data.nbConcours ?? 0} concours rattaché{(data.nbConcours ?? 0) > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-gray-500 mt-3">
                Les examinateurs et le contrôleur sont rattachés à l&apos;établissement et voient uniquement
                les dossiers des concours qu&apos;il organise.
              </p>
            </BentoCard>

            <MembreSection
              title="Examinateurs"
              sousRole="EXAMINATEUR"
              membres={data.examinateurs || []}
              limite={limites.EXAMINATEUR}
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
              limite={limites.CONTROLEUR}
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
    </DGESLayout>
  );
}
