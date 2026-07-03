import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { candidatService, completionService } from '../services/api';
import { handleSessionError } from '../utils/auth';
import { countAlertesConcours } from '../utils/concoursAlertes';
import CandidatLayout from '../components/CandidatLayout';
import BentoCard from '../components/BentoCard';
import { ROUTES } from '../constants/routes';

function salutation() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function AccueilEtudiant() {
  const navigate = useNavigate();
  const [candidat, setCandidat] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    candidatService
      .getProfil()
      .then(async (profil) => {
        setCandidat(profil);
        const saved = localStorage.getItem(`photoProfil_${profil.id}`);
        if (saved) setPhotoUrl(saved);

        try {
          const comp = await completionService.getCompletion(profil.id);
          setCompletion(comp);
        } catch {
          const pieces = ['acteNaissance', 'carteIdentite', 'photo', 'releve'];
          const nb = pieces.filter((p) => profil?.dossier?.[p]).length;
          setCompletion({
            pourcentage: Math.round((nb / pieces.length) * 100),
            estComplet: nb === pieces.length,
          });
        }
      })
      .catch((err) => {
        if (handleSessionError(err, navigate)) return;
        setError(err?.message || 'Erreur de chargement');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  const pct = completion?.pourcentage ?? 0;
  const dossierIncomplet = pct < 100;
  const nbInscriptions = candidat?.inscriptions?.length ?? 0;
  const nbAlertes = countAlertesConcours(candidat?.inscriptions);

  return (
    <CandidatLayout candidat={candidat} photoUrl={photoUrl}>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/20" />

      <div className="max-w-4xl mx-auto space-y-8 animate-slide-up px-2 sm:px-0">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {dossierIncomplet && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-amber-900">Complétez votre dossier personnel</p>
              <p className="text-sm text-amber-800 mt-1">
                Votre dossier est complété à {pct}%. Déposez les pièces manquantes pour participer aux concours et aux inscriptions.
              </p>
            </div>
            <Link
              to={ROUTES.monCompte}
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition shrink-0"
            >
              Compléter mon dossier
            </Link>
          </div>
        )}

        <BentoCard size="full" variant="gradient" glow className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-accent-400/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <p className="text-accent-200 text-sm font-medium mb-2 tracking-wide uppercase">{salutation()}</p>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
              {candidat?.prenom} <span className="text-accent-300">{candidat?.nom}</span>
            </h1>
            <p className="text-academic-100 text-base">
              Choisissez l&apos;espace dans lequel vous souhaitez continuer.
            </p>
            {candidat?.serieBac || candidat?.serie ? (
              <p className="text-accent-200 text-sm mt-3">
                Série BAC : <span className="font-semibold">{candidat.serieBac || candidat.serie}</span>
              </p>
            ) : null}
          </div>
        </BentoCard>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => navigate(ROUTES.concours.home)}
            className={`group text-left rounded-2xl border-2 p-8 shadow-sm hover:shadow-xl transition ${
              nbAlertes > 0
                ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200'
                : 'border-blue-100 bg-white hover:border-blue-400'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center group-hover:scale-105 transition">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              {nbAlertes > 0 && (
                <span className="rounded-full bg-orange-500 text-white text-xs font-bold min-w-[1.5rem] h-6 px-2 flex items-center justify-center">
                  {nbAlertes}
                </span>
              )}
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Module 1</p>
            <h2 className="text-2xl font-black text-gray-900 mb-3">Concours universitaires</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Inscription aux concours, dépôt de dossier, suivi de validation et téléchargement de convocation.
            </p>
            {nbInscriptions > 0 && (
              <p className="mt-4 text-sm font-semibold text-blue-900">
                {nbInscriptions} inscription{nbInscriptions > 1 ? 's' : ''} en cours →
              </p>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.parcours.home)}
            className="group text-left rounded-2xl border-2 border-orange-100 bg-white p-8 shadow-sm hover:shadow-xl hover:border-orange-400 transition"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center mb-5 group-hover:scale-105 transition">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">Module 2</p>
            <h2 className="text-2xl font-black text-gray-900 mb-3">Parcours académique</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Inscriptions annuelles, écoles privées, campagnes et suivi de votre cursus universitaire.
            </p>
            <p className="mt-4 text-sm font-semibold text-orange-700">Accéder à l&apos;espace →</p>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-sm">
          <Link to={ROUTES.monCompte} className="text-blue-900 font-medium hover:underline">
            Mon dossier personnel
          </Link>
        </div>
      </div>
    </CandidatLayout>
  );
}
