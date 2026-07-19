import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';
import { filiereService, validationUeService } from '../../services/api';
import { getUser } from '../../utils/auth';
import {
  ANNEES_ETUDE_UE,
  anneesEtudeForFiliere,
  hintAnneesEtudeFiliere,
  codeSemestre,
  labelSemestre,
} from '../../utils/semestres-etude';
import { labelNiveauEtude } from '../../utils/niveaux-etude';

export default function ValidationUeAdmin() {
  const user = getUser();
  const [filieres, setFilieres] = useState([]);
  const [filiereId, setFiliereId] = useState('');
  const [anneeEtude, setAnneeEtude] = useState(1);
  const [semestre, setSemestre] = useState(1);
  const [unites, setUnites] = useState([]);
  const [uniteId, setUniteId] = useState('');
  const [etudiants, setEtudiants] = useState([]);
  const [meta, setMeta] = useState({ anneeAcademiqueEnCours: '', unite: null, stats: null });
  const [loadingUes, setLoadingUes] = useState(false);
  const [loadingEtudiants, setLoadingEtudiants] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filiereActive = useMemo(
    () => filieres.find((f) => f.id === filiereId) || null,
    [filieres, filiereId]
  );

  const anneesDisponibles = useMemo(() => {
    if (filiereActive) return anneesEtudeForFiliere(filiereActive);
    // Sans filière : union Licence + Master (toutes les années 1–5)
    return ANNEES_ETUDE_UE;
  }, [filiereActive]);

  const semestresAnnee = useMemo(() => {
    const found = anneesDisponibles.find((a) => a.value === Number(anneeEtude))
      || ANNEES_ETUDE_UE.find((a) => a.value === Number(anneeEtude));
    return found?.semestres || [1, 2];
  }, [anneeEtude, anneesDisponibles]);

  useEffect(() => {
    if (!user?.etablissementId) return;
    filiereService.getByEtablissement(user.etablissementId).then((data) => {
      setFilieres(data.filieres || []);
    });
  }, [user?.etablissementId]);

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

  const chargerUes = useCallback(async () => {
    if (!semestresAnnee.includes(Number(semestre))) return;
    setLoadingUes(true);
    setError('');
    try {
      const data = await validationUeService.listerUes({
        anneeEtude,
        semestre,
        ...(filiereId ? { filiereId } : {}),
      });
      const list = data.unites || [];
      setUnites(list);
      if (!list.find((u) => u.id === uniteId)) {
        setUniteId(list[0]?.id || '');
      }
    } catch (err) {
      setError(err.message || 'Impossible de charger les UE');
      setUnites([]);
      setUniteId('');
    } finally {
      setLoadingUes(false);
    }
  }, [anneeEtude, semestre, filiereId, semestresAnnee]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chargerUes();
  }, [chargerUes]);

  const chargerEtudiants = useCallback(async () => {
    if (!anneeEtude || !uniteId) {
      setEtudiants([]);
      setMeta({ anneeAcademiqueEnCours: '', unite: null, stats: null });
      return;
    }
    setLoadingEtudiants(true);
    setError('');
    try {
      const data = await validationUeService.listerEtudiants({
        anneeEtude,
        uniteId,
      });
      setEtudiants(data.etudiants || []);
      setMeta({
        anneeAcademiqueEnCours: data.anneeAcademiqueEnCours || '',
        unite: data.unite || null,
        stats: data.stats || null,
      });
    } catch (err) {
      setError(err.message || 'Impossible de charger les étudiants');
      setEtudiants([]);
    } finally {
      setLoadingEtudiants(false);
    }
  }, [anneeEtude, uniteId]);

  useEffect(() => {
    chargerEtudiants();
  }, [chargerEtudiants]);

  const marquer = async (inscriptionId, statut) => {
    if (!uniteId) return;
    setBusyId(inscriptionId);
    setError('');
    setSuccess('');
    try {
      const data = await validationUeService.marquer({
        inscriptionId,
        uniteId,
        statut,
      });
      setSuccess(data.message || 'Statut enregistré');
      await chargerEtudiants();
    } catch (err) {
      setError(err.message || 'Mise à jour impossible');
    } finally {
      setBusyId(null);
    }
  };

  const uniteLabel = useMemo(() => {
    const u = unites.find((x) => x.id === uniteId);
    if (!u) return '';
    return `${u.code} — ${u.libelle} (${codeSemestre(u.semestre)})`;
  }, [unites, uniteId]);

  return (
    <AdminEtablissementLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Validation des UE</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pour l&apos;année académique en cours, filtrez par année d&apos;étude, semestre puis UE,
            et marquez chaque étudiant <strong>Validé</strong> ou <strong>Non validé</strong>.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
        )}

        <BentoCard className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Filière (optionnel)</label>
              <select
                value={filiereId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setFiliereId(nextId);
                  setUniteId('');
                  const nextFiliere = filieres.find((f) => f.id === nextId);
                  if (nextFiliere) {
                    const annees = anneesEtudeForFiliere(nextFiliere);
                    if (annees[0]) {
                      setAnneeEtude(annees[0].value);
                      if (annees[0].semestres?.[0]) setSemestre(annees[0].semestres[0]);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">Toutes</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Année d&apos;étude</label>
              <select
                value={anneeEtude}
                onChange={(e) => {
                  const nextAnnee = Number(e.target.value);
                  setAnneeEtude(nextAnnee);
                  const found = anneesDisponibles.find((a) => a.value === nextAnnee)
                    || ANNEES_ETUDE_UE.find((a) => a.value === nextAnnee);
                  if (found?.semestres?.[0]) setSemestre(found.semestres[0]);
                  setUniteId('');
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
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
                      setUniteId('');
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      Number(semestre) === s
                        ? 'bg-teal-900 text-white border-teal-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-teal-700'
                    }`}
                  >
                    {codeSemestre(s)}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">{labelSemestre(semestre)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Unité d&apos;enseignement</label>
              <select
                value={uniteId}
                onChange={(e) => setUniteId(e.target.value)}
                disabled={loadingUes || unites.length === 0}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white disabled:opacity-60"
              >
                {unites.length === 0 && (
                  <option value="">Aucune UE pour ce semestre</option>
                )}
                {unites.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} — {u.libelle} ({u.filiere?.nom})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {meta.anneeAcademiqueEnCours && (
            <p className="text-xs text-gray-500">
              Année académique DGES en cours : <strong>{meta.anneeAcademiqueEnCours}</strong>
              {uniteLabel ? <> · UE sélectionnée : <strong>{uniteLabel}</strong></> : null}
            </p>
          )}

          {meta.stats && (
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
                {meta.stats.total} étudiant{meta.stats.total !== 1 ? 's' : ''}
              </span>
              <span className="rounded-full bg-green-100 px-2.5 py-1 font-semibold text-green-800">
                {meta.stats.valides} validé{meta.stats.valides !== 1 ? 's' : ''}
              </span>
              <span className="rounded-full bg-red-100 px-2.5 py-1 font-semibold text-red-800">
                {meta.stats.nonValides} non validé{meta.stats.nonValides !== 1 ? 's' : ''}
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-900">
                {meta.stats.nonRenseignes} non renseigné{meta.stats.nonRenseignes !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </BentoCard>

        <BentoCard className="p-0 overflow-hidden">
          {loadingEtudiants ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : !uniteId ? (
            <p className="p-10 text-center text-sm text-gray-400">
              Sélectionnez une année d&apos;étude, un semestre et une UE pour afficher les étudiants.
            </p>
          ) : etudiants.length === 0 ? (
            <p className="p-10 text-center text-sm text-gray-400">
              Aucun étudiant inscrit en {labelNiveauEtude(anneeEtude)} pour cette filière
              sur l&apos;année académique en cours.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Étudiant</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Matricule</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Filière</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut UE</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {etudiants.map((e) => {
                    const statut = e.validation?.statut;
                    const busy = busyId === e.inscriptionId;
                    return (
                      <tr key={e.inscriptionId} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {e.candidat?.prenom} {e.candidat?.nom}
                          </div>
                          <div className="text-xs text-gray-400">{e.candidat?.email}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{e.candidat?.matricule || '—'}</td>
                        <td className="px-4 py-3">{e.filiere?.nom || '—'}</td>
                        <td className="px-4 py-3">
                          {statut === 'VALIDE' && (
                            <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                              Validé
                            </span>
                          )}
                          {statut === 'NON_VALIDE' && (
                            <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                              Non validé
                            </span>
                          )}
                          {!statut && (
                            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                              Non renseigné
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              disabled={busy || statut === 'VALIDE'}
                              onClick={() => marquer(e.inscriptionId, 'VALIDE')}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-40"
                            >
                              Validé
                            </button>
                            <button
                              type="button"
                              disabled={busy || statut === 'NON_VALIDE'}
                              onClick={() => marquer(e.inscriptionId, 'NON_VALIDE')}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                            >
                              Non validé
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </BentoCard>
      </div>
    </AdminEtablissementLayout>
  );
}
