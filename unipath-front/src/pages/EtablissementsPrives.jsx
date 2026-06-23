import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { candidatService, etablissementService, filiereService } from '../services/api';
import { handleSessionError } from '../utils/auth';
import CandidatLayout from '../components/CandidatLayout';

const NIVEAUX = [
  { value: '1', label: 'Licence 1' },
  { value: '2', label: 'Licence 2' },
  { value: '3', label: 'Licence 3' },
];

export default function EtablissementsPrives() {
  const navigate = useNavigate();
  const [candidat, setCandidat] = useState(null);
  const [etablissements, setEtablissements] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [aideActive, setAideActive] = useState(false);
  const [choix, setChoix] = useState({ choix1: '', choix2: '', choix3: '' });
  const [choixError, setChoixError] = useState('');
  const [rechercheLoading, setRechercheLoading] = useState(false);
  const [resultats, setResultats] = useState(null);

  const [selection, setSelection] = useState({
    etablissementId: '',
    filiereId: '',
    niveau: '',
    anneeAcademique: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  });

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [profil, etabData, filiereData] = await Promise.all([
          candidatService.getProfil(),
          etablissementService.getAll(),
          filiereService.getAll(),
        ]);
        setCandidat(profil);
        const prives = (etabData.etablissements || []).filter((e) => e.type === 'PRIVE');
        setEtablissements(prives);
        const priveIds = new Set(prives.map((e) => e.id));
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

  const filieresEtablissement = useMemo(() => {
    if (!selection.etablissementId) return [];
    return filieres.filter((f) => f.etablissementId === selection.etablissementId);
  }, [filieres, selection.etablissementId]);

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
            className="text-sm text-blue-900 hover:underline mb-3"
          >
            ← Retour à l&apos;accueil
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">Établissements privés</h1>
          <p className="text-gray-600 mt-2">
            Parcourez les écoles privées et choisissez l&apos;établissement ainsi que le niveau souhaité.
          </p>
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
                !aideActive ? 'bg-gray-800 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
              <div className="flex gap-3">
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
              : `${listeAffichee.length} établissement(s) privé(s)`}
          </h2>

          {listeAffichee.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun établissement ne correspond à vos critères.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {listeAffichee.map((etab) => (
                <article key={etab.id} className="rounded-xl border border-gray-100 p-4 hover:border-blue-200 transition">
                  <h3 className="font-bold text-gray-900">{etab.nom}</h3>
                  <p className="text-sm text-gray-500 mt-1">{etab.ville}{etab.adresse ? ` — ${etab.adresse}` : ''}</p>
                  {etab.filieres?.length > 0 && (
                    <ul className="mt-3 text-sm text-gray-700 space-y-1">
                      {etab.filieres.map((f) => (
                        <li key={f.id}>• {f.nom} ({f.niveau})</li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setSelection((prev) => ({
                        ...prev,
                        etablissementId: etab.id,
                        filiereId: etab.filieres?.[0]?.id || '',
                      }))
                    }
                    className="mt-3 text-sm font-semibold text-blue-900 hover:underline"
                  >
                    Choisir cet établissement
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-orange-100 bg-orange-50/40 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Lancer une demande d&apos;inscription</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Établissement</label>
              <select
                value={selection.etablissementId}
                onChange={(e) =>
                  setSelection((prev) => ({
                    ...prev,
                    etablissementId: e.target.value,
                    filiereId: '',
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Sélectionnez</option>
                {listeAffichee.map((e) => (
                  <option key={e.id} value={e.id}>{e.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
              <select
                value={selection.filiereId}
                onChange={(e) => setSelection((prev) => ({ ...prev, filiereId: e.target.value }))}
                disabled={!selection.etablissementId}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white disabled:opacity-50"
              >
                <option value="">Sélectionnez</option>
                {filieresEtablissement.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau / année</label>
              <select
                value={selection.niveau}
                onChange={(e) => setSelection((prev) => ({ ...prev, niveau: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Sélectionnez</option>
                {NIVEAUX.map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année académique</label>
              <input
                type="text"
                value={selection.anneeAcademique}
                onChange={(e) => setSelection((prev) => ({ ...prev, anneeAcademique: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                placeholder="2025-2026"
              />
            </div>
          </div>
          <Link
            to="/inscription-academique"
            state={{
              etablissementId: selection.etablissementId,
              filiereId: selection.filiereId,
              niveau: selection.niveau,
              anneeAcademique: selection.anneeAcademique,
            }}
            className="inline-flex mt-5 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition"
          >
            Continuer vers la demande d&apos;inscription
          </Link>
        </section>
      </div>
    </CandidatLayout>
  );
}
