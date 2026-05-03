// src/pages/PageConcours.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatService, concoursService, inscriptionService } from '../services/api';
import CandidatLayout from '../components/CandidatLayout';

const CHAMPS_REQUIS = ['telephone', 'dateNaiss', 'lieuNaiss'];

const PIECES_LABELS = {
  acteNaissance: 'Acte de naissance',
  carteIdentite: "Carte d'identité",
  photo:         "Photo d'identité",
  releve:        'Relevé de notes Bac',
  quittance:     "Quittance d'inscription",
};

function profilIncomplet(candidat) {
  if (!candidat) return false;
  return CHAMPS_REQUIS.some(c => !candidat[c]);
}

function dossierIncomplet(candidat) {
  if (!candidat?.dossier) return true;
  const pieces = Object.keys(PIECES_LABELS);
  return pieces.some(piece => !candidat.dossier[piece]);
}

function statutConcours(concours) {
  const now = new Date();
  const debut = new Date(concours.dateDebut);
  const fin   = new Date(concours.dateFin);
  if (now < debut) return { label: 'À venir',   color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' };
  if (now > fin)   return { label: 'Terminé',   color: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400' };
  return              { label: 'En cours',  color: 'bg-green-100 text-green-700', dot: 'bg-green-500' };
}

export default function PageConcours() {
  const navigate = useNavigate();
  const [candidat, setCandidат]   = useState(null);
  const [concours, setConcours]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [message, setMessage]     = useState({ text: '', type: 'info' });
  const [photoUrl, setPhotoUrl]   = useState(null);
  const [inscLoading, setInscLoading] = useState({});
  const [recherche, setRecherche] = useState('');
  const [tri, setTri]             = useState('recent'); // 'recent' | 'ancien'

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

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '' }), 4000);
  };

  const handleInscription = async (concoursId) => {
    // Vérifier d'abord si le profil est complet
    if (profilIncomplet(candidat)) {
      showMessage('Veuillez compléter votre profil avant de vous inscrire.', 'warning');
      navigate('/dashboard');
      return;
    }

    // Vérifier si le dossier est complet (toutes les pièces déposées)
    if (dossierIncomplet(candidat)) {
      const pieces = Object.keys(PIECES_LABELS);
      const piecesManquantes = pieces.filter(piece => !candidat?.dossier?.[piece]);
      const piecesManquantesLabels = piecesManquantes.map(p => PIECES_LABELS[p]).join(', ');
      showMessage(
        `Votre dossier est incomplet. Pièces manquantes : ${piecesManquantesLabels}`,
        'warning'
      );
      setTimeout(() => navigate('/dashboard'), 2000);
      return;
    }

    setInscLoading(prev => ({ ...prev, [concoursId]: true }));
    try {
      await inscriptionService.creer(concoursId);
      showMessage('Inscription réussie ! Une fiche de pré-inscription vous a été envoyée par email.', 'success');
      const updated = await candidatService.getProfil();
      setCandidат(updated);
    } catch (err) {
      // Si le dossier est incomplet (vérification backend)
      if (err.message.includes('Dossier incomplet') || err.message.includes('pièces manquantes')) {
        showMessage(
          'Votre dossier est incomplet. Veuillez déposer toutes les pièces justificatives requises.',
          'warning'
        );
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        showMessage(err.message, 'error');
      }
    } finally {
      setInscLoading(prev => ({ ...prev, [concoursId]: false }));
    }
  };

  if (loading) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin' />
    </div>
  );

  return (
    <CandidatLayout candidat={candidat} photoUrl={photoUrl}>
      <div className='max-w-5xl mx-auto space-y-6'>

        {/* Toast */}
        {message.text && (
          <div className={`px-4 py-3 rounded-lg text-sm flex items-center justify-between ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
            message.type === 'error'   ? 'bg-red-50 border border-red-200 text-red-700' :
            message.type === 'warning' ? 'bg-orange-50 border border-orange-200 text-orange-700' :
                                         'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ text: '' })} className='ml-4 opacity-60 hover:opacity-100 text-lg leading-none'>&times;</button>
          </div>
        )}

        {/* En-tête */}
        <div>
          <h1 className='text-2xl font-black text-gray-900'>Concours disponibles</h1>
          <p className='text-gray-500 text-sm mt-1'>
            {concours.length} concours — Inscrivez-vous avant la date limite de dépôt
          </p>
        </div>

        {/* Barre de recherche + tri */}
        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='flex-1 relative'>
            <svg className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
            </svg>
            <input
              type='text'
              placeholder='Rechercher un concours...'
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              className='w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 bg-white'
            />
            {recherche && (
              <button
                onClick={() => setRecherche('')}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none'
              >
                &times;
              </button>
            )}
          </div>
          <div className='flex gap-2'>
            <button
              onClick={() => setTri('recent')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                tri === 'recent' ? 'bg-blue-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Plus récents
            </button>
            <button
              onClick={() => setTri('ancien')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                tri === 'ancien' ? 'bg-blue-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Plus anciens
            </button>
          </div>
        </div>

        {/* Liste des concours */}
        {(() => {
          let liste = concours.filter(c =>
            c.libelle.toLowerCase().includes(recherche.toLowerCase()) ||
            (c.description || '').toLowerCase().includes(recherche.toLowerCase())
          );
          liste = [...liste].sort((a, b) => {
            const da = new Date(a.dateDebut);
            const db = new Date(b.dateDebut);
            return tri === 'recent' ? db - da : da - db;
          });

          if (liste.length === 0) return (
            <div className='bg-white rounded-2xl border border-gray-100 p-12 text-center'>
              <p className='text-gray-400 text-sm'>
                {recherche ? `Aucun concours trouvé pour "${recherche}"` : 'Aucun concours disponible pour le moment.'}
              </p>
            </div>
          );

          return (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {liste.map((c, index) => {
                const statut      = statutConcours(c);
                const dejaInscrit = candidat?.inscriptions?.some(i => i.concoursId === c.id);
                const termine     = new Date() > new Date(c.dateFin);
                const peutInscrire = !profilIncomplet(candidat) && !dossierIncomplet(candidat);
                const num         = String(index + 1).padStart(2, '0');

                // Couleur du badge numéro selon statut
                const badgeColor = dejaInscrit
                  ? 'bg-green-500'
                  : termine
                  ? 'bg-gray-400'
                  : statut.label === 'En cours'
                  ? 'bg-teal-500'
                  : 'bg-blue-900';

                return (
                  <div
                    key={c.id}
                    className='bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-5 flex flex-col gap-3 cursor-pointer'
                    onClick={() => !dejaInscrit && !termine && peutInscrire && handleInscription(c.id)}
                  >
                    {/* Titre + badge numéro */}
                    <div className='flex items-start gap-3'>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${badgeColor}`}>
                        {num}
                      </div>
                      <h3 className='font-bold text-gray-900 text-sm leading-tight flex-1'>
                        {c.libelle}
                      </h3>
                    </div>

                    {/* Infos */}
                    <div className='space-y-1.5 pl-1'>
                      {/* Institution */}
                      <div className='flex items-center gap-2 text-xs text-gray-500'>
                        <svg className='w-3.5 h-3.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                        </svg>
                        <span>EPAC — Université d'Abomey-Calavi</span>
                      </div>

                      {/* Dates */}
                      <div className='flex items-center gap-2 text-xs text-gray-500'>
                        <svg className='w-3.5 h-3.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                        </svg>
                        <span>
                          {new Date(c.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          {' → '}
                          {new Date(c.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Description / diplôme */}
                      {c.description && (
                        <div className='flex items-center gap-2 text-xs text-gray-500'>
                          <svg className='w-3.5 h-3.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 14l9-5-9-5-9 5 9 5z' />
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' />
                          </svg>
                          <span className='truncate'>{c.description}</span>
                        </div>
                      )}
                    </div>

                    {/* Statut / bouton */}
                    <div className='mt-auto pt-2 border-t border-gray-50'>
                      {dejaInscrit ? (
                        <span className='text-xs text-green-600 font-semibold'>Inscrit</span>
                      ) : termine ? (
                        <span className='text-xs text-gray-400'>Inscriptions closes</span>
                      ) : !peutInscrire ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('/dashboard'); }}
                          className='w-full bg-gray-200 text-gray-500 py-2 rounded-lg text-xs font-semibold cursor-not-allowed'
                          title='Complétez votre profil et déposez toutes les pièces justificatives'
                        >
                          Dossier incomplet
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleInscription(c.id); }}
                          disabled={inscLoading[c.id]}
                          className='w-full bg-orange-500 text-white py-2 rounded-lg text-xs font-semibold hover:bg-orange-600 transition disabled:opacity-50'
                        >
                          {inscLoading[c.id] ? 'En cours...' : "S'inscrire"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </CandidatLayout>
  );
}
