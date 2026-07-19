import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { campagneService, dgesService, filiereService } from '../../services/api';
import CandidatLayout from '../../components/CandidatLayout';
import EcolesPriveesNav from '../../components/EcolesPriveesNav';
import { ROUTES } from '../../constants/routes';
import { BentoCard } from '../../components/AcademicLayout';

function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PageCampagnesInscription() {
  const navigate = useNavigate();
  const [campagnes, setCampagnes] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anneeEnCours, setAnneeEnCours] = useState('');
  const [filters, setFilters] = useState({ ville: '', filiereId: '' });

  useEffect(() => {
    dgesService
      .getAnneeEnCours()
      .then((data) => {
        setAnneeEnCours(data?.annee?.libelle || '');
      })
      .catch(() => {});
  }, []);

  const charger = () => {
    setLoading(true);
    setError('');
    const params = {};
    if (filters.ville) params.ville = filters.ville;
    if (filters.filiereId) params.filiereId = filters.filiereId;
    // Année : laissée vide → API = année DGES en cours uniquement

    campagneService
      .getAll(params)
      .then((data) => setCampagnes(data.campagnes || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    filiereService.getAll().then((data) => setFilieres(data.filieres || [])).catch(() => {});
  }, []);

  useEffect(() => {
    charger();
  }, [filters.ville, filters.filiereId]);

  const villes = [...new Set(campagnes.map((c) => c.etablissement?.ville).filter(Boolean))].sort();

  const deposerDossier = (campagne, cf) => {
    navigate(ROUTES.parcours.dossiers, {
      state: {
        etablissementId: campagne.etablissement?.id,
        filiereId: cf?.filiereId || cf?.filiere?.id,
        anneeAcademique: campagne.anneeAcademique,
        niveau: '1',
        ...(cf?.id ? { campagneFiliereId: cf.id } : {}),
      },
    });
  };

  return (
    <CandidatLayout>
      <div className="max-w-6xl mx-auto space-y-8 px-2 sm:px-0 py-2">
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
                  Campagnes ouvertes — déposez votre dossier directement depuis une offre publiée.
                  {anneeEnCours ? (
                    <>
                      {' '}
                      Année en cours : <strong>{anneeEnCours}</strong>.
                    </>
                  ) : null}
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

        <BentoCard className="p-4 !bg-white dark:!bg-white">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
              <select
                value={filters.ville}
                onChange={(e) => setFilters((p) => ({ ...p, ville: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Toutes</option>
                {villes.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filière</label>
              <select
                value={filters.filiereId}
                onChange={(e) => setFilters((p) => ({ ...p, filiereId: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Toutes</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </BentoCard>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : campagnes.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-gray-600">
              Aucune campagne d&apos;inscription ouverte pour le moment. Consultez toutes les écoles pour déposer un
              dossier directement.
            </p>
            <Link
              to={ROUTES.parcours.etablissements}
              className="inline-block mt-4 text-sm font-semibold text-blue-900 hover:underline"
            >
              Voir toutes les écoles →
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {campagnes.map((c) => {
              const campagneFilieres = c.filieres || [];

              return (
                <BentoCard key={c.id} className="p-5 flex flex-col !bg-white dark:!bg-white">
                  <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                    {c.etablissement?.nom}
                  </p>
                  <h2 className="font-bold text-gray-900 mt-1">{c.titre}</h2>
                  <p className="text-sm text-gray-500 mt-1">{c.etablissement?.ville}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(c.dateOuverture)} → {formatDate(c.dateCloture)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {campagneFilieres.length} filière{campagneFilieres.length > 1 ? 's' : ''} disponible
                    {campagneFilieres.length > 1 ? 's' : ''}
                  </p>

                  <div className="mt-4 space-y-2">
                    {campagneFilieres.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => deposerDossier(c, null)}
                        className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition"
                      >
                        Déposer un dossier
                      </button>
                    ) : (
                      campagneFilieres.map((cf) => (
                        <div
                          key={cf.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2"
                        >
                          <span className="text-sm font-medium text-gray-800">{cf.filiere?.nom || 'Filière'}</span>
                          <button
                            type="button"
                            onClick={() => deposerDossier(c, cf)}
                            className="rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 transition whitespace-nowrap"
                          >
                            Déposer un dossier
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </BentoCard>
              );
            })}
          </div>
        )}
      </div>
    </CandidatLayout>
  );
}
