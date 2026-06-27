// src/pages/AccueilCandidat.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatService, concoursService } from '../services/api';
import { handleSessionError } from '../utils/auth';
import {
  buildConcoursNotifications,
  marquerAlertesCommeVues,
  needsConcoursAttention,
} from '../utils/concoursAlertes';
import CandidatLayout from '../components/CandidatLayout';

function joursRestants(dateFin) {
  const diff = new Date(dateFin) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const STATUS_LABELS = {
  VALIDE: { label: 'Validé', className: 'bg-green-100 text-green-800' },
  VALIDE_PAR_COMMISSION: { label: 'Validé (commission)', className: 'bg-green-100 text-green-800' },
  REJETE: { label: 'Rejeté', className: 'bg-red-100 text-red-800' },
  REJETE_PAR_COMMISSION: { label: 'Rejeté (commission)', className: 'bg-red-100 text-red-800' },
  SOUS_RESERVE: { label: 'Sous réserve', className: 'bg-amber-100 text-amber-800' },
  SOUS_RESERVE_PAR_COMMISSION: { label: 'Sous réserve', className: 'bg-amber-100 text-amber-800' },
  EN_ATTENTE: { label: 'En attente', className: 'bg-gray-100 text-gray-700' },
};

const NOTIF_CLASSES = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

function StatBox({ label, value, accent }) {
  const accents = {
    blue: 'text-blue-900',
    green: 'text-green-700',
    red: 'text-red-700',
    gray: 'text-gray-700',
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center">
      <p className={`text-2xl font-black ${accents[accent] || accents.blue}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
    </div>
  );
}

export default function AccueilCandidat() {
  const navigate = useNavigate();
  const [candidat, setCandidat] = useState(null);
  const [concours, setConcours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [error, setError] = useState('');
  const [, setAlertesSync] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    Promise.all([candidatService.getProfil(), concoursService.getAll()])
      .then(([p, c]) => {
        setCandidat(p);
        setConcours(c);
        const saved = localStorage.getItem(`photoProfil_${p.id}`);
        if (saved) setPhotoUrl(saved);
      })
      .catch((err) => {
        if (handleSessionError(err, navigate)) return;
        if (err?.status === 403) {
          setError(err?.message || 'Accès refusé à votre profil candidat.');
          return;
        }
        setError(err?.message || 'Erreur de chargement');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    const inscriptions = candidat?.inscriptions;
    if (!inscriptions?.length) return;
    const idsAlertes = inscriptions.filter(needsConcoursAttention).map((ins) => ins.id);
    if (idsAlertes.length === 0) return;
    marquerAlertesCommeVues(idsAlertes);
    setAlertesSync((n) => n + 1);
  }, [candidat?.inscriptions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  const nbInscriptions = candidat?.inscriptions?.length || 0;
  const nbValides = candidat?.inscriptions?.filter((i) => ['VALIDE', 'VALIDE_PAR_COMMISSION'].includes(i.statut)).length || 0;
  const nbRejetes = candidat?.inscriptions?.filter((i) => ['REJETE', 'REJETE_PAR_COMMISSION'].includes(i.statut)).length || 0;
  const nbEnCours = nbInscriptions - nbValides - nbRejetes;

  const urgents = concours.filter((c) => {
    const jours = joursRestants(c.dateFin);
    const inscrit = candidat?.inscriptions?.some((i) => i.concoursId === c.id);
    return jours > 0 && jours <= 7 && !inscrit;
  });

  const notifications = buildConcoursNotifications(candidat?.inscriptions);

  return (
    <CandidatLayout candidat={candidat} photoUrl={photoUrl}>
      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes concours</h1>
            <p className="text-sm text-gray-500 mt-1">
              Fiches de pré-inscription, convocations et suivi de vos dossiers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/concours')}
            className="inline-flex items-center justify-center rounded-lg bg-blue-900 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-800 transition shrink-0"
          >
            + Nouveau concours
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label="Total" value={nbInscriptions} accent="blue" />
          <StatBox label="En cours" value={nbEnCours} accent="gray" />
          <StatBox label="Validés" value={nbValides} accent="green" />
          <StatBox label="Rejetés" value={nbRejetes} accent="red" />
        </div>

        {/* Alertes */}
        {notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((n, i) => (
              <div
                key={i}
                className={`rounded-lg border px-4 py-3 text-sm font-medium ${NOTIF_CLASSES[n.type] || NOTIF_CLASSES.info}`}
              >
                {n.msg}
              </div>
            ))}
          </div>
        )}

        {/* Clôtures proches */}
        {urgents.length > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-semibold text-orange-900 mb-3">
              Concours bientôt clos — vous n&apos;êtes pas encore inscrit
            </p>
            <ul className="space-y-2">
              {urgents.slice(0, 3).map((c) => {
                const jours = joursRestants(c.dateFin);
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 bg-white rounded-lg px-3 py-2 border border-orange-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.libelle}</p>
                      <p className="text-xs text-orange-700">
                        {jours === 1 ? 'Dernier jour' : `${jours} jours restants`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/concours/${c.id}`)}
                      className="text-xs font-semibold text-blue-900 hover:underline shrink-0"
                    >
                      S&apos;inscrire
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Liste principale */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm" id="mes-inscriptions-liste">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80">
            <h2 className="font-semibold text-gray-900">Vos inscriptions</h2>
          </div>

          {nbInscriptions === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-gray-600 text-sm mb-4">Aucune inscription pour le moment.</p>
              <button
                type="button"
                onClick={() => navigate('/concours')}
                className="inline-flex items-center rounded-lg bg-blue-900 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-800 transition"
              >
                Voir les concours ouverts
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {candidat.inscriptions.map((ins) => {
                const status = STATUS_LABELS[ins.statut] || STATUS_LABELS.EN_ATTENTE;
                const alerte = needsConcoursAttention(ins);

                return (
                  <li key={ins.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/inscription/${ins.id}`)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition group"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${alerte ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-900'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-900">
                            {ins.concours?.libelle || 'Concours'}
                          </p>
                          {alerte && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                              À voir
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Inscrit le {ins.createdAt ? new Date(ins.createdAt).toLocaleDateString('fr-FR') : '—'}
                        </p>
                      </div>

                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${status.className}`}>
                        {status.label}
                      </span>

                      <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-900 flex-shrink-0 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </CandidatLayout>
  );
}
