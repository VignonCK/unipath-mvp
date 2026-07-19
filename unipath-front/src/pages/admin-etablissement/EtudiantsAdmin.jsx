import { useCallback, useEffect, useState } from 'react';
import { etablissementService, filiereService, dgesService } from '../../services/api';
import { getUser } from '../../utils/auth';
import AdminEtablissementLayout from '../../components/AdminEtablissementLayout';
import { BentoCard } from '../../components/AcademicLayout';
import { NIVEAUX_ETUDE, labelNiveauEtude } from '../../utils/niveaux-etude';

const NIVEAUX = NIVEAUX_ETUDE;
const EMPTY_FILTERS = { filiere: '', annee: '', niveau: '', sexe: '' };

function labelSexe(sexe) {
  const s = String(sexe || '').trim().toUpperCase();
  if (s === 'M' || s === 'H' || s === 'MASCULIN') return 'Masculin';
  if (s === 'F' || s === 'FEMININ' || s === 'FÉMININ') return 'Féminin';
  return '—';
}

function normalizeSexe(sexe) {
  const s = String(sexe || '').trim().toUpperCase();
  if (s === 'M' || s === 'H' || s === 'MASCULIN') return 'M';
  if (s === 'F' || s === 'FEMININ' || s === 'FÉMININ') return 'F';
  return '';
}

/** Filtrage local (garantit le résultat même si l'API ignore un critère). */
function applyLocalFilters(list, filters) {
  return (list || []).filter((ins) => {
    if (filters.filiere && ins.filiereId !== filters.filiere && ins.filiere?.id !== filters.filiere) {
      return false;
    }
    if (filters.annee && String(ins.anneeAcademique) !== String(filters.annee)) {
      return false;
    }
    if (filters.niveau !== '' && filters.niveau != null) {
      if (Number(ins.niveau) !== Number(filters.niveau)) return false;
    }
    if (filters.sexe === 'M' || filters.sexe === 'F') {
      if (normalizeSexe(ins.candidat?.sexe) !== filters.sexe) return false;
    }
    return true;
  });
}

export default function EtudiantsAdmin() {
  const user = getUser();
  const [filieres, setFilieres] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [anneeEnCoursLibelle, setAnneeEnCoursLibelle] = useState('');
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anneesReady, setAnneesReady] = useState(false);
  const [error, setError] = useState('');
  const [draftFilters, setDraftFilters] = useState(() => ({ ...EMPTY_FILTERS }));
  const [appliedFilters, setAppliedFilters] = useState(() => ({ ...EMPTY_FILTERS }));

  const chargerEtudiants = useCallback(async (filtersToUse) => {
    if (!user?.etablissementId) return;
    setLoading(true);
    setError('');
    try {
      // Charger tout le périmètre établissement, puis filtrer localement
      // (évite les écarts si l'API n'applique pas encore tous les critères).
      const data = await etablissementService.getEtudiants(user.etablissementId, {});
      const raw = data.etudiants || [];
      setEtudiants(applyLocalFilters(raw, filtersToUse));
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
      setEtudiants([]);
    } finally {
      setLoading(false);
    }
  }, [user?.etablissementId]);

  useEffect(() => {
    if (!user?.etablissementId) return;
    filiereService.getByEtablissement(user.etablissementId).then((data) => {
      setFilieres(data.filieres || []);
    });
  }, [user?.etablissementId]);

  useEffect(() => {
    let cancelled = false;
    dgesService
      .listerAnneesAcademiques()
      .then((data) => {
        if (cancelled) return;
        const list = data.annees || [];
        const enCours =
          data.anneeEnCours?.libelle
          || list.find((a) => a.enCours)?.libelle
          || '';
        setAnnees(list);
        setAnneeEnCoursLibelle(enCours);
        const withAnnee = { ...EMPTY_FILTERS, annee: enCours };
        setDraftFilters({ ...withAnnee });
        setAppliedFilters({ ...withAnnee });
        setAnneesReady(true);
        if (user?.etablissementId) {
          chargerEtudiants(withAnnee);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Impossible de charger les années académiques');
          setAnneesReady(true);
        }
      });
    return () => { cancelled = true; };
  }, [user?.etablissementId, chargerEtudiants]);

  const appliquerFiltres = () => {
    const next = { ...draftFilters };
    setAppliedFilters(next);
    chargerEtudiants(next);
  };

  const reinitialiserFiltres = () => {
    const reset = { ...EMPTY_FILTERS, annee: anneeEnCoursLibelle || '' };
    setDraftFilters(reset);
    setAppliedFilters(reset);
    chargerEtudiants(reset);
  };

  return (
    <AdminEtablissementLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Étudiants inscrits</h1>
          <p className="text-sm text-gray-500 mt-1">
            Inscriptions académiques validées à votre établissement.
            {anneeEnCoursLibelle ? (
              <>
                {' '}
                Filtre par défaut : année DGES en cours ({anneeEnCoursLibelle}).
              </>
            ) : null}
          </p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <BentoCard className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Filière</label>
              <select
                value={draftFilters.filiere}
                onChange={(e) => setDraftFilters((p) => ({ ...p, filiere: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">Toutes</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Année académique</label>
              <select
                value={draftFilters.annee}
                onChange={(e) => setDraftFilters((p) => ({ ...p, annee: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                disabled={annees.length === 0 && !anneesReady}
              >
                <option value="">Toutes</option>
                {annees.map((a) => (
                  <option key={a.id} value={a.libelle}>
                    {a.libelle}
                    {a.enCours || a.libelle === anneeEnCoursLibelle ? ' (en cours)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Années définies par la DGES.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Niveau d&apos;étude</label>
              <select
                value={draftFilters.niveau}
                onChange={(e) => setDraftFilters((p) => ({ ...p, niveau: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">Tous</option>
                {NIVEAUX.map((n) => (
                  <option key={n.value} value={String(n.value)}>{n.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sexe</label>
              <select
                value={draftFilters.sexe}
                onChange={(e) => setDraftFilters((p) => ({ ...p, sexe: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">Tous</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={appliquerFiltres}
              disabled={loading || !anneesReady}
              className="rounded-lg bg-teal-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Appliquer les filtres
            </button>
            <button
              type="button"
              onClick={reinitialiserFiltres}
              disabled={loading || !anneesReady}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Réinitialiser
            </button>
          </div>
        </BentoCard>

        {loading || !anneesReady ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-teal-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : etudiants.length === 0 ? (
          <BentoCard className="p-12 text-center text-gray-400 text-sm">Aucun étudiant trouvé.</BentoCard>
        ) : (
          <BentoCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Matricule</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Étudiant</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Sexe</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Filière</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Année</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Niveau</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {etudiants.map((ins) => (
                    <tr key={ins.id}>
                      <td className="px-6 py-4">{ins.candidat?.matricule || '—'}</td>
                      <td className="px-6 py-4">{ins.candidat?.prenom} {ins.candidat?.nom}</td>
                      <td className="px-6 py-4">{labelSexe(ins.candidat?.sexe ?? ins.sexe)}</td>
                      <td className="px-6 py-4">{ins.filiere?.nom || '—'}</td>
                      <td className="px-6 py-4">{ins.anneeAcademique}</td>
                      <td className="px-6 py-4">{labelNiveauEtude(ins.niveau)}</td>
                      <td className="px-6 py-4">{ins.statut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        )}
      </div>
    </AdminEtablissementLayout>
  );
}
