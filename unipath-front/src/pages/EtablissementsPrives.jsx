import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { candidatService, etablissementService, filiereService } from '../services/api';
import { handleSessionError } from '../utils/auth';
import CandidatLayout from '../components/CandidatLayout';
import EcolesPriveesNav from '../components/EcolesPriveesNav';
import { ROUTES } from '../constants/routes';

const LABEL_NIVEAU = {
  LICENCE: 'Licence',
  MASTER: 'Master',
  AUTRE: 'Autres',
};

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

  const [filtreVille, setFiltreVille] = useState('');
  const [filtreFiliere, setFiltreFiliere] = useState('');
  const [filtreNiveau, setFiltreNiveau] = useState('');
  const [filtreRecherche, setFiltreRecherche] = useState('');

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

  const villes = useMemo(() => {
    const set = new Set(
      etablissements.map((e) => (e.ville || '').trim()).filter(Boolean),
    );
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [etablissements]);

  const nomsFilieres = useMemo(() => {
    const set = new Set(filieres.map((f) => f.nom).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [filieres]);

  const niveaux = useMemo(() => {
    const set = new Set(filieres.map((f) => f.niveau).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [filieres]);

  const listeAffichee = useMemo(() => {
    const q = filtreRecherche.trim().toLowerCase();
    return etablissements.filter((etab) => {
      if (filtreVille && (etab.ville || '').trim() !== filtreVille) return false;

      if (q) {
        const hay = `${etab.nom || ''} ${etab.ville || ''} ${etab.adresse || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (!filtreFiliere && !filtreNiveau) return true;

      const filieresEtab = mergeFilieresForEtab(etab, filieres);
      return filieresEtab.some((f) => {
        if (filtreFiliere && f.nom !== filtreFiliere) return false;
        if (filtreNiveau && f.niveau !== filtreNiveau) return false;
        return true;
      });
    });
  }, [etablissements, filieres, filtreVille, filtreFiliere, filtreNiveau, filtreRecherche]);

  const filtresActifs = Boolean(filtreVille || filtreFiliere || filtreNiveau || filtreRecherche.trim());

  const resetFiltres = () => {
    setFiltreVille('');
    setFiltreFiliere('');
    setFiltreNiveau('');
    setFiltreRecherche('');
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

    navigate(ROUTES.parcours.dossiers, { state });
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
            onClick={() => navigate(ROUTES.parcours.home)}
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
              onClick={() => navigate(ROUTES.parcours.dossiers)}
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

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Filtres</h2>
            {filtresActifs && (
              <button
                type="button"
                onClick={resetFiltres}
                className="text-sm font-semibold text-blue-900 hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="filtre-recherche" className="block text-xs font-medium text-gray-600 mb-1">
                Recherche
              </label>
              <input
                id="filtre-recherche"
                type="search"
                value={filtreRecherche}
                onChange={(e) => setFiltreRecherche(e.target.value)}
                placeholder="Nom, ville…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
              />
            </div>
            <div>
              <label htmlFor="filtre-ville" className="block text-xs font-medium text-gray-600 mb-1">
                Ville
              </label>
              <select
                id="filtre-ville"
                value={filtreVille}
                onChange={(e) => setFiltreVille(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
              >
                <option value="">Toutes les villes</option>
                {villes.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filtre-filiere" className="block text-xs font-medium text-gray-600 mb-1">
                Filière
              </label>
              <select
                id="filtre-filiere"
                value={filtreFiliere}
                onChange={(e) => setFiltreFiliere(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
              >
                <option value="">Toutes les filières</option>
                {nomsFilieres.map((nom) => (
                  <option key={nom} value={nom}>{nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filtre-niveau" className="block text-xs font-medium text-gray-600 mb-1">
                Niveau
              </label>
              <select
                id="filtre-niveau"
                value={filtreNiveau}
                onChange={(e) => setFiltreNiveau(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
              >
                <option value="">Tous les niveaux</option>
                {niveaux.map((n) => (
                  <option key={n} value={n}>{LABEL_NIVEAU[n] || n}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {listeAffichee.length} école{listeAffichee.length > 1 ? 's' : ''} privée
            {listeAffichee.length > 1 ? 's' : ''}
            {filtresActifs ? ' trouvée' : ''}
            {filtresActifs && listeAffichee.length > 1 ? 's' : ''}
          </h2>

          {listeAffichee.length === 0 ? (
            <p className="text-gray-500 text-sm">
              {filtresActifs
                ? 'Aucun établissement ne correspond à vos filtres.'
                : 'Aucune école privée disponible pour le moment.'}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {listeAffichee.map((etab) => {
                const expanded = expandedEtabId === etab.id;
                let filieresEtab = mergeFilieresForEtab(etab, filieres);
                if (filtreFiliere || filtreNiveau) {
                  filieresEtab = filieresEtab.filter((f) => {
                    if (filtreFiliere && f.nom !== filtreFiliere) return false;
                    if (filtreNiveau && f.niveau !== filtreNiveau) return false;
                    return true;
                  });
                }

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
                              {f.niveau ? ` (${LABEL_NIVEAU[f.niveau] || f.niveau})` : ''}
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
                        to={ROUTES.parcours.etablissement(etab.id)}
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
