import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { candidatService } from '../services/api';
import { handleSessionError } from '../utils/auth';
import CandidatLayout from '../components/CandidatLayout';
import BentoCard from '../components/BentoCard';
import { ROUTES } from '../constants/routes';

function salutation() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function AccueilParcours() {
  const navigate = useNavigate();
  const [candidat, setCandidat] = useState(null);
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
      .then((profil) => {
        setCandidat(profil);
        const saved = localStorage.getItem(`photoProfil_${profil.id}`);
        if (saved) setPhotoUrl(saved);
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

  const nbApplications = candidat?.applications?.filter((a) => {
    const statut = a.status || a.statut;
    return !['REJETE', 'FICHE_GENEREE', 'FICHE_GENERATED'].includes(statut);
  }).length ?? 0;

  return (
    <CandidatLayout candidat={candidat} photoUrl={photoUrl}>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-50 via-orange-50/20 to-blue-50/30" />

      <div className="max-w-5xl mx-auto space-y-8 animate-slide-up px-2 sm:px-0">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <BentoCard size="full" variant="gradient" glow className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-orange-400/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <p className="text-orange-200 text-sm font-medium mb-2 tracking-wide uppercase">{salutation()}</p>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
              Parcours <span className="text-orange-300">académique</span>
            </h1>
            <p className="text-academic-100 text-base">
              Inscriptions annuelles, écoles privées et suivi de votre cursus.
            </p>
          </div>
        </BentoCard>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => navigate(ROUTES.parcours.etablissements)}
            className="group text-left rounded-2xl border border-orange-100 bg-white p-6 shadow-sm hover:shadow-lg hover:border-orange-300 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Écoles privées</h2>
            <p className="text-gray-600 text-sm">
              Parcourez les établissements et leurs filières pour constituer votre dossier.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.parcours.campagnes)}
            className="group text-left rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-lg hover:border-blue-200 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Campagnes d&apos;inscription</h2>
            <p className="text-gray-600 text-sm">
              Consultez les campagnes ouvertes et déposez votre candidature.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.parcours.dossiers)}
            className={`group text-left rounded-2xl border p-6 shadow-sm hover:shadow-lg transition ${
              nbApplications > 0
                ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-100 bg-white hover:border-blue-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center group-hover:scale-105 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {nbApplications > 0 && (
                <span className="rounded-full bg-blue-600 text-white text-xs font-bold min-w-[1.5rem] h-6 px-2 flex items-center justify-center">
                  {nbApplications}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Mes dossiers</h2>
            <p className="text-gray-600 text-sm">
              Déposez ou suivez vos demandes d&apos;inscription auprès des établissements.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.parcours.mesInscriptions)}
            className="group text-left rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-lg hover:border-green-200 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-green-700 text-white flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Mes inscriptions académiques</h2>
            <p className="text-gray-600 text-sm">
              Suivez vos inscriptions validées, quittances et statuts par année.
            </p>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-sm">
          <Link to={ROUTES.parcours.releve} className="text-blue-900 font-medium hover:underline">
            Mon relevé de notes
          </Link>
          <span className="text-gray-300" aria-hidden>|</span>
          <Link to={ROUTES.monCompte} className="text-blue-900 font-medium hover:underline">
            Mon dossier personnel
          </Link>
        </div>
      </div>
    </CandidatLayout>
  );
}
