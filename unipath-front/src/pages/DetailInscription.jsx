// src/pages/DetailInscription.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { candidatService, convocationService } from '../services/api';
import CandidatLayout from '../components/CandidatLayout';

const STATUT_CONFIG = {
  VALIDE:     { 
    label: 'Validé', 
    color: 'bg-green-500', 
    badge: 'bg-green-100 text-green-700', 
    icon: (
      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
      </svg>
    )
  },
  REJETE:     { 
    label: 'Rejeté', 
    color: 'bg-red-500', 
    badge: 'bg-red-100 text-red-700', 
    icon: (
      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
      </svg>
    )
  },
  EN_ATTENTE: { 
    label: 'En attente', 
    color: 'bg-yellow-400', 
    badge: 'bg-yellow-100 text-yellow-700', 
    icon: (
      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
    )
  },
};

export default function DetailInscription() {
  const { inscriptionId } = useParams();
  const navigate = useNavigate();
  const [candidat, setCandidат] = useState(null);
  const [inscription, setInscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [telechargement, setTelechargement] = useState({});
  const [message, setMessage] = useState({ text: '', type: 'info' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    
    candidatService.getProfil()
      .then((p) => {
        setCandidат(p);
        const saved = localStorage.getItem('photoProfil_' + p.id);
        if (saved) setPhotoUrl(saved);
        
        // Trouver l'inscription correspondante
        const insc = p.inscriptions?.find(i => i.id === inscriptionId);
        if (!insc) {
          navigate('/dashboard');
          return;
        }
        setInscription(insc);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [inscriptionId]);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '' }), 4000);
  };

  const handleConvocation = async () => {
    setTelechargement(prev => ({ ...prev, convocation: true }));
    try {
      await convocationService.telecharger(inscriptionId);
      showMessage('Convocation téléchargée avec succès !', 'success');
    } catch (err) {
      showMessage('Erreur : ' + err.message, 'error');
    } finally {
      setTelechargement(prev => ({ ...prev, convocation: false }));
    }
  };

  const handlePreinscription = async () => {
    setTelechargement(prev => ({ ...prev, preinscription: true }));
    try {
      await convocationService.telechargerPreinscription(inscriptionId);
      showMessage('Fiche de pré-inscription téléchargée avec succès !', 'success');
    } catch (err) {
      showMessage('Erreur : ' + err.message, 'error');
    } finally {
      setTelechargement(prev => ({ ...prev, preinscription: false }));
    }
  };

  if (loading) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin' />
    </div>
  );

  if (!inscription) return null;

  const cfg = STATUT_CONFIG[inscription.statut] || STATUT_CONFIG.EN_ATTENTE;

  return (
    <CandidatLayout candidat={candidat} photoUrl={photoUrl}>
      <div className='max-w-3xl mx-auto space-y-6'>

        {/* Bouton retour */}
        <button
          onClick={() => navigate('/dashboard')}
          className='flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
          </svg>
          Retour au tableau de bord
        </button>

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

        {/* En-tête avec statut */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className={`h-2 ${cfg.color}`} />
          <div className='p-6'>
            <div className='flex items-start justify-between gap-4 mb-4'>
              <div>
                <h1 className='text-2xl font-black text-gray-900 mb-2'>
                  {inscription.concours?.libelle}
                </h1>
                <p className='text-gray-500 text-sm'>
                  Inscription effectuée le {new Date(inscription.createdAt).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-xl font-semibold text-sm ${cfg.badge} flex items-center gap-2`}>
                <span className='text-lg'>{cfg.icon}</span>
                {cfg.label}
              </div>
            </div>

            {/* Informations du concours */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6'>
              <div className='bg-gray-50 rounded-xl px-4 py-3'>
                <p className='text-xs text-gray-400 mb-0.5'>Date de début</p>
                <p className='text-sm font-medium text-gray-800'>
                  {new Date(inscription.concours.dateDebut).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className='bg-gray-50 rounded-xl px-4 py-3'>
                <p className='text-xs text-gray-400 mb-0.5'>Date de fin</p>
                <p className='text-sm font-medium text-gray-800'>
                  {new Date(inscription.concours.dateFin).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className='bg-gray-50 rounded-xl px-4 py-3'>
                <p className='text-xs text-gray-400 mb-0.5'>Numéro de dossier</p>
                <p className='text-sm font-mono font-bold text-blue-900'>
                  {inscription.id.substring(0, 8).toUpperCase()}
                </p>
              </div>
              <div className='bg-gray-50 rounded-xl px-4 py-3'>
                <p className='text-xs text-gray-400 mb-0.5'>Institution</p>
                <p className='text-sm font-medium text-gray-800'>
                  EPAC - UAC
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Message selon le statut */}
        {inscription.statut === 'EN_ATTENTE' && (
          <div className='bg-yellow-50 border-l-4 border-yellow-500 px-5 py-4 rounded-xl'>
            <div className='flex items-start gap-3'>
              <svg className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <div>
                <p className='font-semibold text-yellow-800 text-sm'>Dossier en cours d'examen</p>
                <p className='text-yellow-700 text-xs mt-1'>
                  La commission étudie actuellement votre candidature. Vous recevrez un email dès qu'une décision sera prise.
                </p>
              </div>
            </div>
          </div>
        )}

        {inscription.statut === 'VALIDE' && (
          <div className='bg-green-50 border-l-4 border-green-500 px-5 py-4 rounded-xl'>
            <div className='flex items-start gap-3'>
              <svg className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <div>
                <p className='font-semibold text-green-800 text-sm'>Félicitations ! Votre dossier a été validé</p>
                <p className='text-green-700 text-xs mt-1'>
                  Vous êtes convoqué(e) à l'examen. Téléchargez votre convocation ci-dessous et présentez-vous avec une pièce d'identité valide.
                </p>
              </div>
            </div>
          </div>
        )}

        {inscription.statut === 'REJETE' && (
          <div className='bg-red-50 border-l-4 border-red-500 px-5 py-4 rounded-xl'>
            <div className='flex items-start gap-3'>
              <svg className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <div>
                <p className='font-semibold text-red-800 text-sm'>Dossier non retenu</p>
                <p className='text-red-700 text-xs mt-1'>
                  Votre candidature n'a malheureusement pas été retenue pour ce concours. Vous pouvez postuler à nouveau lors des prochaines sessions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Documents disponibles */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
          <h2 className='text-base font-bold text-gray-800 mb-4'>Documents disponibles</h2>
          <div className='space-y-3'>
            
            {/* Fiche de pré-inscription */}
            <div className='flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                  </svg>
                </div>
                <div>
                  <p className='font-semibold text-gray-900 text-sm'>Fiche de pré-inscription</p>
                  <p className='text-xs text-gray-500'>Document envoyé par email lors de votre inscription</p>
                </div>
              </div>
              <button
                onClick={handlePreinscription}
                disabled={telechargement.preinscription}
                className='px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2'
              >
                {telechargement.preinscription ? (
                  <>
                    <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    Génération...
                  </>
                ) : (
                  <>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                    </svg>
                    Télécharger
                  </>
                )}
              </button>
            </div>

            {/* Convocation (uniquement si validé) */}
            {inscription.statut === 'VALIDE' && (
              <div className='flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' />
                    </svg>
                  </div>
                  <div>
                    <p className='font-semibold text-gray-900 text-sm'>Convocation officielle</p>
                    <p className='text-xs text-gray-500'>À présenter le jour de l'examen avec votre pièce d'identité</p>
                  </div>
                </div>
                <button
                  onClick={handleConvocation}
                  disabled={telechargement.convocation}
                  className='px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2'
                >
                  {telechargement.convocation ? (
                    <>
                      <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      Génération...
                    </>
                  ) : (
                    <>
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
                      </svg>
                      Télécharger
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Message si pas encore validé */}
            {inscription.statut !== 'VALIDE' && (
              <div className='p-4 bg-gray-50 rounded-xl border border-gray-200'>
                <div className='flex items-center gap-3'>
                  <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                  </svg>
                  <p className='text-sm text-gray-500'>
                    La convocation sera disponible une fois votre dossier validé par la commission.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informations importantes */}
        <div className='bg-blue-50 rounded-2xl border border-blue-200 p-6'>
          <h3 className='font-bold text-blue-900 text-sm mb-3 flex items-center gap-2'>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            Informations importantes
          </h3>
          <ul className='space-y-2 text-sm text-blue-800'>
            <li className='flex items-start gap-2'>
              <span className='text-blue-500 mt-0.5'>•</span>
              <span>Tous les documents sont également envoyés par email à l'adresse : <strong>{candidat?.email}</strong></span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-blue-500 mt-0.5'>•</span>
              <span>Vérifiez régulièrement vos emails (y compris les spams) pour ne manquer aucune notification</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-blue-500 mt-0.5'>•</span>
              <span>En cas de validation, présentez-vous avec votre convocation imprimée et une pièce d'identité valide</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-blue-500 mt-0.5'>•</span>
              <span>Pour toute question, contactez le service des concours de l'EPAC</span>
            </li>
          </ul>
        </div>

      </div>
    </CandidatLayout>
  );
}
