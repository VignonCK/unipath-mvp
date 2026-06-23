import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { candidatService, completionService } from '../services/api';
import { handleSessionError } from '../utils/auth';
import CandidatLayout from '../components/CandidatLayout';
import BentoCard from '../components/BentoCard';

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
        setError(err?.message || 'Erreur de chargement du tableau de bord');
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

  return (
    <CandidatLayout candidat={candidat} photoUrl={photoUrl}>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/20" />

      <div className="max-w-5xl mx-auto space-y-8 animate-slide-up px-2 sm:px-0">
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
              to="/mon-compte"
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
              Bienvenue sur UniPath — choisissez votre parcours d&apos;inscription.
            </p>
            {candidat?.serieBac || candidat?.serie ? (
              <p className="text-accent-200 text-sm mt-3">
                Série BAC : <span className="font-semibold">{candidat.serieBac || candidat.serie}</span>
              </p>
            ) : null}
          </div>
        </BentoCard>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            type="button"
            onClick={() => navigate('/concours')}
            className="group text-left rounded-2xl border border-blue-100 bg-white p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Participer à un concours</h2>
            <p className="text-gray-600 text-sm">
              Consultez les concours ouverts adaptés à votre série BAC et lancez votre inscription.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/etablissements-prives')}
            className="group text-left rounded-2xl border border-orange-100 bg-white p-6 shadow-sm hover:shadow-lg hover:border-orange-300 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">S&apos;inscrire dans un établissement privé</h2>
            <p className="text-gray-600 text-sm">
              Parcourez les écoles privées, choisissez votre filière et votre niveau d&apos;inscription.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/campagnes-inscription')}
            className="group text-left rounded-2xl border border-green-100 bg-white p-6 shadow-sm hover:shadow-lg hover:border-green-300 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-green-600 text-white flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Inscriptions établissements privés</h2>
            <p className="text-gray-600 text-sm">
              Consultez les campagnes d&apos;inscription ouvertes et postulez directement en ligne.
            </p>
          </button>
        </div>

        {(candidat?.inscriptions?.length ?? 0) > 0 && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-5 py-4">
            <p className="text-sm text-blue-900">
              Vous avez {candidat.inscriptions.length} inscription(s) à un concours.{' '}
              <Link to="/mes-concours" className="font-semibold underline hover:text-blue-700">
                Voir le suivi de mes concours
              </Link>
            </p>
          </div>
        )}
      </div>
    </CandidatLayout>
  );
}
