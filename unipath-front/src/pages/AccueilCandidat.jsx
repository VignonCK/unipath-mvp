// src/pages/AccueilCandidat.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatService, concoursService } from '../services/api';
import CandidatLayout from '../components/CandidatLayout';

function salutation() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function joursRestants(dateFin) {
  const diff = new Date(dateFin) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AccueilCandidat() {
  const navigate = useNavigate();
  const [candidat, setCandidат] = useState(null);
  const [concours, setConcours] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    Promise.all([candidatService.getProfil(), concoursService.getAll()])
      .then(([p, c]) => {
        setCandidат(p);
        setConcours(c);
        const saved = localStorage.getItem('photoProfil_' + p.id);
        if (saved) setPhotoUrl(saved);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin' />
    </div>
  );

  // Calculs
  const pieces = ['acteNaissance', 'carteIdentite', 'photo', 'releve'];
  const nbPieces = pieces.filter(p => candidat?.dossier?.[p]).length;
  const pct = Math.round((nbPieces / pieces.length) * 100);
  const nbInscriptions = candidat?.inscriptions?.length || 0;
  const nbValides = candidat?.inscriptions?.filter(i => i.statut === 'VALIDE').length || 0;
  const nbRejetes = candidat?.inscriptions?.filter(i => i.statut === 'REJETE').length || 0;
  const profilOk = ['telephone', 'dateNaiss', 'lieuNaiss'].every(c => candidat?.[c]);

  // Concours avec clôture proche (< 7 jours) et non inscrit
  const urgents = concours.filter(c => {
    const jours = joursRestants(c.dateFin);
    const inscrit = candidat?.inscriptions?.some(i => i.concoursId === c.id);
    return jours > 0 && jours <= 7 && !inscrit;
  });

  // Notifications
  const notifications = [];
  if (!profilOk) {
    notifications.push({ type: 'warning', msg: 'Votre profil est incomplet. Renseignez vos informations pour vous inscrire.' });
  }
  candidat?.inscriptions?.forEach(ins => {
    if (ins.statut === 'VALIDE') {
      notifications.push({ type: 'success', msg: `Votre dossier pour "${ins.concours?.libelle}" a été validé. Téléchargez votre convocation.` });
    }
    if (ins.statut === 'REJETE') {
      notifications.push({ type: 'error', msg: `Votre dossier pour "${ins.concours?.libelle}" a été rejeté.` });
    }
  });
  if (pct > 0 && pct < 100) {
    notifications.push({ type: 'info', msg: `Votre dossier est complété à ${pct}%. Déposez les pièces manquantes.` });
  }

  const notifColors = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error:   'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-orange-50 border-orange-200 text-orange-700',
    info:    'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <CandidatLayout candidat={candidat} photoUrl={photoUrl}>
      <div className='max-w-3xl mx-auto space-y-6'>

        {/* Message de bienvenue */}
        <div className='bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-6 text-white'>
          <p className='text-blue-300 text-sm mb-1'>{salutation()},</p>
          <h1 className='text-2xl font-black mb-1'>
            {candidat?.prenom} {candidat?.nom}
          </h1>
          <p className='text-blue-200 text-sm'>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className='mt-4 inline-block bg-white/10 rounded-xl px-3 py-1.5'>
            <span className='text-xs text-orange-300 font-mono'>{candidat?.matricule}</span>
          </div>
        </div>

        {/* KPI rapides */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          {[
            { label: 'Inscriptions',   value: nbInscriptions, color: 'text-blue-900',   bg: 'bg-blue-50',   action: () => navigate('/dashboard') },
            { label: 'Validés',        value: nbValides,      color: 'text-green-700',  bg: 'bg-green-50',  action: null },
            { label: 'Rejetés',        value: nbRejetes,      color: 'text-red-600',    bg: 'bg-red-50',    action: null },
            { label: 'Dossier',        value: `${pct}%`,      color: pct === 100 ? 'text-green-700' : 'text-orange-600', bg: pct === 100 ? 'bg-green-50' : 'bg-orange-50', action: () => navigate('/dashboard') },
          ].map(({ label, value, color, bg, action }) => (
            <div
              key={label}
              onClick={action || undefined}
              className={`${bg} rounded-2xl p-4 ${action ? 'cursor-pointer hover:shadow-sm transition' : ''}`}
            >
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className='text-xs text-gray-500 mt-0.5'>{label}</p>
            </div>
          ))}
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className='space-y-2'>
            <h2 className='text-sm font-bold text-gray-700'>Notifications</h2>
            {notifications.map((n, i) => (
              <div key={i} className={`px-4 py-3 rounded-xl border text-sm ${notifColors[n.type]}`}>
                {n.msg}
              </div>
            ))}
          </div>
        )}

        {/* Concours urgents */}
        {urgents.length > 0 && (
          <div className='bg-white rounded-2xl border border-orange-200 p-5'>
            <h2 className='text-sm font-bold text-orange-700 mb-3'>Clôture imminente</h2>
            <div className='space-y-2'>
              {urgents.map(c => {
                const jours = joursRestants(c.dateFin);
                return (
                  <div key={c.id} className='flex items-center justify-between gap-3'>
                    <div>
                      <p className='text-sm font-semibold text-gray-800'>{c.libelle}</p>
                      <p className='text-xs text-orange-600 font-medium'>
                        {jours === 1 ? 'Dernier jour !' : `${jours} jours restants`}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/concours')}
                      className='text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition flex-shrink-0'
                    >
                      S'inscrire
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Raccourcis */}
        <div>
          <h2 className='text-sm font-bold text-gray-700 mb-3'>Accès rapide</h2>
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
            {[
              { label: 'Voir les concours',    path: '/concours',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'bg-blue-900 text-white' },
              { label: 'Ma carte candidat',    path: '/ma-carte',   icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2', color: 'bg-green-600 text-white' },
              { label: 'Déposer des pièces',   path: '/mon-compte', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', color: 'bg-orange-500 text-white' },
              { label: 'Mon dossier',          path: '/mon-compte', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'bg-gray-100 text-gray-700' },
            ].map(({ label, path, icon, color }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={`${color} rounded-2xl p-4 text-left hover:opacity-90 transition`}
              >
                <svg className='w-5 h-5 mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={icon} />
                </svg>
                <p className='text-xs font-semibold'>{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Mes inscriptions récentes */}
        {nbInscriptions > 0 && (
          <div className='bg-white rounded-2xl border border-gray-100 p-5'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-sm font-bold text-gray-700'>Mes inscriptions récentes</h2>
              <button onClick={() => navigate('/mon-compte')} className='text-xs text-orange-500 hover:underline'>
                Voir tout
              </button>
            </div>
            <div className='space-y-2'>
              {candidat.inscriptions.slice(0, 3).map(ins => {
                const colors = {
                  VALIDE:     'bg-green-100 text-green-700',
                  REJETE:     'bg-red-100 text-red-700',
                  EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
                };
                const labels = { VALIDE: 'Validé', REJETE: 'Rejeté', EN_ATTENTE: 'En attente' };
                return (
                  <div key={ins.id} className='flex items-center justify-between gap-2'>
                    <p className='text-sm text-gray-700 truncate flex-1'>{ins.concours?.libelle}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${colors[ins.statut]}`}>
                      {labels[ins.statut]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </CandidatLayout>
  );
}
