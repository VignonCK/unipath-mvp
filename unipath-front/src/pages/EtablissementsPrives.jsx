import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { candidatService, etablissementService, filiereService } from '../services/api';
import { handleSessionError } from '../utils/auth';
import CandidatLayout from '../components/CandidatLayout';
import EcolesPriveesNav from '../components/EcolesPriveesNav';

function findCampagneFiliereForFiliere(etablissement, filiereId) {
  if (!etablissement?.campagnes?.length || !filiereId) return null;

  for (const campagne of etablissement.campagnes) {
    const campagneFiliere = (campagne.filieres || []).find(
      (cf) => cf.filiereId === filiereId || cf.filiere?.id === filiereId,
    );
    if (campagneFiliere?.id) {
      return {
        campagneFiliereId: campagneFiliere.id,
        anneeAcademique: campagne.anneeAcademique,
      };
    }
  }

  return null;
}

function mergeFilieresForEtab(etablissement, allFilieres) {
  const fromEtab = etablissement?.filieres || [];
  const fromState = allFilieres.filter((f) => f.etablissementId === etablissement?.id);
  const merged = new Map();
  [...fromEtab, ...fromState].forEach((filiere) => {
    if (filiere?.id) merged.set(filiere.id, filiere);
  });
  return Array.from(merged.values());
}

export default function EtablissementsPrives() {
  const navigate = useNavigate();
  const [candidat, setCandidat] = useState(null);
  const [etablissements, setEtablissements] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedEtabId, setExpandedEtabId] = useState(null);

  const [aideActive, setAideActive] = useState(false);
  const [choix, setChoix] = useState({ choix1: '', choix2: '', choix3: '' });
  const [choixError, setChoixError] = useState('');
  const [rechercheLoading, setRechercheLoading] = useState(false);
  const [resultats, setResultats] = useState(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [profil, etabData, filiereData] = await Promise.all([
          candidatService.getProfil(),
          etablissementService.getPrives(),
          filiereService.getAll(),
        ]);
        setCandidat(profil);
        setEtablissements(etabData.etablissements || []);
        const priveIds = new Set((etabData.etablissements || []).map((e) => e.id));
        const filieresPrivees = (filiereData.filieres || []).filter((f) => priveIds.has(f.etablissementId));
        setFilieres(filieresPrivees);
      } catch (err) {
        if (handleSessionError(err, navigate)) return;
        setError(err?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [navigate]);

  const nomsFilieresUniques = useMemo(() => {
    const noms = [...new Set(filieres.map((f) => f.nom))];
    return noms.sort((a, b) => a.localeCompare(b, 'fr'));
  }, [filieres]);

  const listeAffichee = resultats?.etablissements ?? etablissements;

  const validerChoix = () => {
    const values = [choix.choix1, choix.choix2, choix.choix3].map((c) => c.trim()).filter(Boolean);
    if (values.length !== 3) {
      return 'Les trois choix de filière sont requis.';
    }
    if (new Set(values.map((v) => v.toLowerCase())).size !== 3) {
      return 'Les trois choix doivent être différents.';
    }
    return '';
  };

  const handleRecherche = async (event) => {
    event.preventDefault();
    const validation = validerChoix();
    if (validation) {
      setChoixError(validation);
      return;
    }
    setChoixError('');
    setRechercheLoading(true);
    setError('');
    try {
      const data = await etablissementService.rechercherParFilieres(choix);
      setResultats(data);
      setExpandedEtabId(null);
    } catch (err) {
      setError(err?.message || 'Erreur lors de la recherche');
      setResultats(null);
    } finally {
      setRechercheLoading(false);
    }
  };

  const resetRecherche = () => {
    setResultats(null);
    setChoix({ choix1: '', choix2: '', choix3: '' });
    setChoixError('');
    setExpandedEtabId(null);
  };

  const deposerDossier = (etablissement, filiereId) => {
    const etablissementId = typeof etablissement === 'string' ? etablissement : etablissement.id;
    const etab =
      typeof etablissement === 'object'
        ? etablissement
        : listeAffichee.find((e) => e.id === etablissementId);

    const state = { etablissementId };
    if (filiereId) state.filiereId = filiereId;

    const campagneMatch = findCampagneFiliereForFiliere(etab, filiereId);
    if (campagneMatch) {
      state.campagneFiliereId = campagneMatch.campagneFiliereId;
      state.anneeAcademique = campagneMatch.anneeAcademique;
      state.niveau = '1';
    }

    navigate('/demande-inscription', { state });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <CandidatLayout candidat={candidat}>
      <div className="max-w-6xl mx-auto space-y-8 px-2 sm:px-0">
        <div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-sm text-blue-900 hover:underline mb-4"
          >
            ← Retour à l&apos;accueil
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4 flex-1">
              <EcolesPriveesNav />
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900">Écoles privées</h1>
                <p className="text-gray-600 mt-2">
                  Parcourez les écoles privées et déposez votre dossier pour la filière de votre choix.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/demande-inscription')}
              className="shrink-0 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition shadow-sm"
            >
              Déposer un dossier
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Aide à la décision</h2>
          <p className="text-gray-600 mb-4">
            Voulez-vous qu&apos;on vous aide à trouver les écoles appropriées ?
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setAideActive(true)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                aideActive ? 'bg-blue-900 text-white' : 'border border-blue-900 text-blue-900 hover:bg-blue-50'
              }`}
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => {
                setAideActive(false);
                resetRecherche();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                !aideActive
                  ? 'bg-orange-500 text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Non, voir tous les établissements
            </button>
          </div>

          {aideActive && (
            <form onSubmit={handleRecherche} className="mt-6 space-y-4">
              {['choix1', 'choix2', 'choix3'].map((key, index) => (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
                    Choix {index + 1}
                  </label>
                  <select
                    id={key}
                    value={choix[key]}
                    onChange={(e) => setChoix((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                  >
                    <option value="">Sélectionnez une filière</option>
                    {nomsFilieresUniques.map((nom) => (
                      <option key={`${key}-${nom}`} value={nom}>
                        {nom}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {choixError && <p className="text-sm text-red-600">{choixError}</p>}
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={rechercheLoading}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  {rechercheLoading ? 'Recherche…' : 'Rechercher les établissements'}
                </button>
                {resultats && (
                  <button
                    type="button"
                    onClick={resetRecherche}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </form>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {resultats
              ? `${resultats.etablissements?.length ?? 0} établissement(s) correspondant à vos choix`
              : `${listeAffichee.length} école${listeAffichee.length > 1 ? 's' : ''} privée${listeAffichee.length > 1 ? 's' : ''}`}
          </h2>

          {listeAffichee.length === 0 ? (
            <p className="text-gray-500 text-sm">
              {resultats
                ? 'Aucun établissement ne correspond à vos critères.'
                : 'Aucune école privée disponible pour le moment.'}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {listeAffichee.map((etab) => {
                const expanded = expandedEtabId === etab.id;
                const filieresEtab = mergeFilieresForEtab(etab, filieres);

                return (
                  <article
                    key={etab.id}
                    id={`etab-${etab.id}`}
                    className="rounded-xl border border-gray-100 p-4 hover:border-orange-200 transition"
                  >
                    <h3 className="font-bold text-gray-900">{etab.nom}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {etab.ville}
                      {etab.adresse ? ` — ${etab.adresse}` : ''}
                    </p>

                    {expanded && filieresEtab.length > 0 && (
                      <ul className="mt-3 rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-sm text-gray-700 space-y-1.5">
                        {filieresEtab.map((f) => (
                          <li key={f.id} className="flex flex-wrap items-center justify-between gap-2">
                            <span>
                              {f.nom}
                              {f.niveau ? ` (${f.niveau})` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => deposerDossier(etab, f.id)}
                              className="rounded-lg bg-blue-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-800 transition"
                            >
                              Déposer un dossier
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {!expanded && filieresEtab.length > 0 && (
                      <p className="mt-2 text-xs text-gray-500">
                        {filieresEtab.length} filière{filieresEtab.length > 1 ? 's' : ''} disponible
                        {filieresEtab.length > 1 ? 's' : ''}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to={`/etablissements-prives/${etab.id}`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                      >
                        Voir le profil
                      </Link>
                      {filieresEtab.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedEtabId(expanded ? null : etab.id)}
                          className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition"
                        >
                          {expanded ? 'Masquer les filières' : 'Voir les filières'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deposerDossier(etab)}
                        className="rounded-lg bg-blue-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800 transition"
                      >
                        Déposer un dossier
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </CandidatLayout>
  );
}
