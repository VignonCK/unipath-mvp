// src/pages/PageConcours.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatService, concoursService, inscriptionService } from '../services/api';
import CandidatLayout from '../components/CandidatLayout';

const CHAMPS_REQUIS = ['telephone', 'dateNaiss', 'lieuNaiss'];

function profilIncomplet(candidat) {
  if (!candidat) return false;
  return CHAMPS_REQUIS.some(c => !candidat[c]);
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
    if (profilIncomplet(candidat)) {
      showMessage('Veuillez compléter votre profil avant de vous inscrire.', 'warning');
      navigate('/dashboard');
      return;
    }
    setInscLoading(prev => ({ ...prev, [concoursId]: true }));
    try {
      await inscriptionService.creer(concoursId);
      showMessage('Inscription réussie !', 'success');
      const updated = await candidatService.getProfil();
      setCandidат(updated);
    } catch (err) {
      showMessage(err.message, 'error');
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
      <div className='max-w-3xl mx-auto space-y-6'>

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
          // Filtrer par recherche
          let liste = concours.filter(c =>
            c.libelle.toLowerCase().includes(recherche.toLowerCase()) ||
            (c.description || '').toLowerCase().includes(recherche.toLowerCase())
          );
          // Trier
          liste = [...liste].sort((a, b) => {
            const da = new Date(a.dateDebut);
            const db = new Date(b.dateDebut);
            return tri === 'recent' ? db - da : da - db;
          });
          return liste.length === 0 ? (
            <div className='bg-white rounded-2xl border border-gray-100 p-12 text-center'>
              <p className='text-gray-400 text-sm'>
                {recherche ? `Aucun concours trouvé pour "${recherche}"` : 'Aucun concours disponible pour le moment.'}
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {liste.map((c) => {
              const statut = statutConcours(c);
              const dejaInscrit = candidat?.inscriptions?.some(i => i.concoursId === c.id);
              const termine = new Date() > new Date(c.dateFin);

              return (
                <div key={c.id} className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition'>
                  {/* Barre de statut */}
                  <div className={`h-1 ${statut.dot}`} />

                  <div className='p-5'>
                    <div className='flex items-start justify-between gap-3 mb-4'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h3 className='font-bold text-gray-900 text-base'>{c.libelle}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statut.color}`}>
                            {statut.label}
                          </span>
                        </div>
                        {c.description && (
                          <p className='text-gray-500 text-sm'>{c.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className='grid grid-cols-2 gap-3 mb-4'>
                      <div className='bg-gray-50 rounded-xl px-4 py-3'>
                        <p className='text-xs text-gray-400 mb-0.5'>Ouverture des dépôts</p>
                        <p className='text-sm font-semibold text-gray-800'>
                          {new Date(c.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className={`rounded-xl px-4 py-3 ${termine ? 'bg-gray-50' : 'bg-orange-50'}`}>
                        <p className='text-xs text-gray-400 mb-0.5'>Clôture des dépôts</p>
                        <p className={`text-sm font-semibold ${termine ? 'text-gray-500' : 'text-orange-700'}`}>
                          {new Date(c.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Bouton */}
                    {dejaInscrit ? (
                      <div className='flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5'>
                        <span className='w-2 h-2 rounded-full bg-green-500 flex-shrink-0' />
                        <span className='text-sm text-green-700 font-medium'>Vous êtes inscrit à ce concours</span>
                      </div>
                    ) : termine ? (
                      <div className='bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-center'>
                        <span className='text-sm text-gray-400'>Les inscriptions sont closes</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInscription(c.id)}
                        disabled={inscLoading[c.id]}
                        className='w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 transition disabled:opacity-50'
                      >
                        {inscLoading[c.id] ? 'Inscription en cours...' : "S'inscrire à ce concours"}
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
