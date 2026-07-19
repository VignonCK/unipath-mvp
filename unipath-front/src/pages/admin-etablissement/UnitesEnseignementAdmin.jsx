import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';
import { filiereService, uniteEnseignementService } from '../../services/api';
import { getUser } from '../../utils/auth';
import {
  ANNEES_ETUDE_UE,
  anneesEtudeForFiliere,
  hintAnneesEtudeFiliere,
  codeSemestre,
  labelSemestre,
} from '../../utils/semestres-etude';

const EMPTY_FORM = {
  code: '',
  libelle: '',
  credits: '3',
};

export default function UnitesEnseignementAdmin() {
  const user = getUser();
  const [filieres, setFilieres] = useState([]);
  const [filiereId, setFiliereId] = useState('');
  const [anneeEtude, setAnneeEtude] = useState(1);
  const [semestre, setSemestre] = useState(1);
  const [unites, setUnites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const filiereActive = useMemo(
    () => filieres.find((f) => f.id === filiereId) || null,
    [filieres, filiereId]
  );

  const anneesDisponibles = useMemo(
    () => anneesEtudeForFiliere(filiereActive),
    [filiereActive]
  );

  const semestresAnnee = useMemo(() => {
    const found = anneesDisponibles.find((a) => a.value === Number(anneeEtude))
      || ANNEES_ETUDE_UE.find((a) => a.value === Number(anneeEtude));
    return found?.semestres || [1, 2];
  }, [anneeEtude, anneesDisponibles]);

  useEffect(() => {
    if (!user?.etablissementId) return;
    filiereService.getByEtablissement(user.etablissementId).then((data) => {
      const list = data.filieres || [];
      setFilieres(list);
      if (list.length && !filiereId) {
        setFiliereId(list[0].id);
        const annees = anneesEtudeForFiliere(list[0]);
        if (annees[0]) setAnneeEtude(annees[0].value);
      }
    });
  }, [user?.etablissementId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!anneesDisponibles.length) return;
    if (!anneesDisponibles.some((a) => a.value === Number(anneeEtude))) {
      setAnneeEtude(anneesDisponibles[0].value);
    }
  }, [anneesDisponibles, anneeEtude]);

  useEffect(() => {
    if (!semestresAnnee.includes(Number(semestre))) {
      setSemestre(semestresAnnee[0]);
    }
  }, [semestresAnnee, semestre]);

  const charger = useCallback(async () => {
    if (!filiereId || !semestre) return;
    setLoading(true);
    setError('');
    try {
      const data = await uniteEnseignementService.lister({
        filiereId,
        semestre,
      });
      setUnites(data.unites || []);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
      setUnites([]);
    } finally {
      setLoading(false);
    }
  }, [filiereId, semestre]);

  useEffect(() => {
    charger();
  }, [charger]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
  };

  const demarrerEdition = (ue) => {
    setEditingId(ue.id);
    setForm({
      code: ue.code || '',
      libelle: ue.libelle || '',
      credits: String(ue.credits ?? 0),
    });
  };

  const soumettre = async (e) => {
    e.preventDefault();
    if (!filiereId) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        filiereId,
        semestre: Number(semestre),
        code: form.code.trim(),
        libelle: form.libelle.trim(),
        credits: Number(form.credits) || 0,
      };
      if (editingId) {
        await uniteEnseignementService.modifier(editingId, payload);
        setSuccess('UE mise à jour.');
      } else {
        await uniteEnseignementService.creer(payload);
        setSuccess('UE créée.');
      }
      resetForm();
      await charger();
    } catch (err) {
      setError(err.message || 'Enregistrement impossible');
    } finally {
      setBusy(false);
    }
  };

  const supprimer = async (ue) => {
    if (!window.confirm(`Supprimer l'UE ${ue.code} — ${ue.libelle} ?`)) return;
    setBusy(true);
    setError('');
    try {
      await uniteEnseignementService.supprimer(ue.id);
      setSuccess('UE supprimée.');
      if (editingId === ue.id) resetForm();
      await charger();
    } catch (err) {
      setError(err.message || 'Suppression impossible');
    } finally {
      setBusy(false);
    }
  };

  const totalCredits = unites.reduce((sum, u) => sum + (Number(u.credits) || 0), 0);

  return (
    <AdminEtablissementLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Unités d&apos;enseignement</h1>
          <p className="text-sm text-gray-500 mt-1">
            Définissez les UE par filière et par semestre d&apos;étude (S1 à S10).
            Chaque année d&apos;étude <em>a</em> (1 à 5) comporte les semestres{' '}
            <strong>2a−1</strong> et <strong>2a</strong>.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
        )}

        <BentoCard className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Filière</label>
              <select
                value={filiereId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setFiliereId(nextId);
                  const nextFiliere = filieres.find((f) => f.id === nextId);
                  const annees = anneesEtudeForFiliere(nextFiliere);
                  if (annees[0]) setAnneeEtude(annees[0].value);
                  resetForm();
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                {filieres.length === 0 && <option value="">Aucune filière</option>}
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Année d&apos;étude</label>
              <select
                value={anneeEtude}
                onChange={(e) => setAnneeEtude(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                disabled={!filiereId || anneesDisponibles.length === 0}
              >
                {anneesDisponibles.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              {filiereActive && (
                <p className="text-[11px] text-gray-400 mt-1">{hintAnneesEtudeFiliere(filiereActive)}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Semestre</label>
              <div className="flex gap-2">
                {semestresAnnee.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSemestre(s);
                      resetForm();
                    }}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold border transition ${
                      Number(semestre) === s
                        ? 'bg-teal-900 text-white border-teal-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {codeSemestre(s)}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">{labelSemestre(semestre)}</p>
            </div>
          </div>
        </BentoCard>

        <div className="grid gap-6 lg:grid-cols-5">
          <BentoCard className="p-4 lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">
              {editingId ? 'Modifier l\'UE' : `Nouvelle UE — ${codeSemestre(semestre)}`}
            </h2>
            <form onSubmit={soumettre} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Code *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                  placeholder="ex. UE101"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Libellé *</label>
                <input
                  value={form.libelle}
                  onChange={(e) => setForm((p) => ({ ...p, libelle: e.target.value }))}
                  placeholder="ex. Algorithmique"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Crédits</label>
                <input
                  type="number"
                  min="0"
                  value={form.credits}
                  onChange={(e) => setForm((p) => ({ ...p, credits: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy || !filiereId}
                  className="rounded-lg bg-teal-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {busy ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Ajouter'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </BentoCard>

          <BentoCard className="p-0 overflow-hidden lg:col-span-3">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  UE du {codeSemestre(semestre)}
                </h2>
                <p className="text-xs text-gray-500">
                  {unites.length} unité{unites.length !== 1 ? 's' : ''} · {totalCredits} crédit{totalCredits !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : unites.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-400">
                Aucune UE pour ce semestre. Ajoutez-en via le formulaire.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-gray-600">Code</th>
                      <th className="text-left px-4 py-2 font-semibold text-gray-600">Libellé</th>
                      <th className="text-left px-4 py-2 font-semibold text-gray-600">Crédits</th>
                      <th className="px-4 py-2 font-semibold text-gray-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {unites.map((ue) => (
                      <tr key={ue.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-teal-900">{ue.code}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{ue.libelle}</td>
                        <td className="px-4 py-3">{ue.credits}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => demarrerEdition(ue)}
                            className="text-xs font-semibold text-teal-800 hover:underline"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => supprimer(ue)}
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>
        </div>
      </div>
    </AdminEtablissementLayout>
  );
}
