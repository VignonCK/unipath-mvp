// src/pages/DetailCandidatCommission.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { commissionService, authService } from '../services/api';
import DocumentViewer from '../components/DocumentViewer';
import HistoriqueActions from '../components/HistoriqueActions';
import CommissionLayout from '../components/CommissionLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function initiales(prenom, nom) {
  return `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();
}

const STATUT_CONFIG = {
  VALIDE:        { label: 'Validé',        badge: 'bg-slate-100 text-slate-700 border border-slate-200' },
  REJETE:        { label: 'Rejeté',        badge: 'bg-slate-100 text-slate-700 border border-slate-200' },
  EN_ATTENTE:    { label: 'En attente',    badge: 'bg-slate-100 text-slate-700 border border-slate-200' },
  SOUS_RESERVE:  { label: 'Sous réserve',  badge: 'bg-slate-100 text-slate-700 border border-slate-200' },
};

const PIECES_LABELS = {
  acteNaissance: { label: 'Acte de naissance' },
  carteIdentite: { label: 'Carte d\'identité' },
  photo:         { label: 'Photo d\'identité' },
  releve:        { label: 'Relevé de notes' },
  quittance:     { label: 'Quittance de paiement' },
};

export default function DetailCandidatCommission() {
  const navigate = useNavigate();
  const { inscriptionId } = useParams();
  const [inscription, setInscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [rejetModal, setRejetModal] = useState({ open: false, commentaire: '' });
  const [sousReserveModal, setSousReserveModal] = useState({ open: false, commentaire: '' });
  const [documentViewer, setDocumentViewer] = useState({ open: false, url: '', name: '', type: '' });
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const user = authService.getCurrentUser();

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '' }), 4000);
  };

  const chargerInscription = async () => {
    setLoading(true);
    try {
      // Récupérer toutes les inscriptions et trouver celle qui correspond
      const data = await commissionService.getDossiers();
      const inscriptionTrouvee = data.inscriptions.find(ins => ins.id === inscriptionId);
      
      if (!inscriptionTrouvee) {
        showMessage('Inscription non trouvée', 'error');
        navigate('/commission');
        return;
      }
      
      setInscription(inscriptionTrouvee);
    } catch (err) {
      console.error(err);
      showMessage('Erreur lors du chargement du dossier', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerInscription();
  }, [inscriptionId]);

  const handleDecision = async (statut, commentaireRejet = null, commentaireSousReserve = null) => {
    try {
      const payload = { statut };
      if (commentaireRejet) payload.commentaireRejet = commentaireRejet;
      if (commentaireSousReserve) payload.commentaireSousReserve = commentaireSousReserve;
      
      await commissionService.updateStatut(inscriptionId, payload);
      
      const messages = {
        VALIDE: 'validé',
        REJETE: 'rejeté',
        SOUS_RESERVE: 'accepté sous réserve'
      };
      
      showMessage(`Dossier ${messages[statut]} avec succès`, statut === 'VALIDE' ? 'success' : statut === 'REJETE' ? 'error' : 'info');
      
      // Recharger les données
      await chargerInscription();
      
      // Fermer les modales
      setRejetModal({ open: false, commentaire: '' });
      setSousReserveModal({ open: false, commentaire: '' });
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const confirmerRejet = () => {
    if (!rejetModal.commentaire.trim()) {
      showMessage('Le commentaire de rejet est obligatoire', 'error');
      return;
    }
    handleDecision('REJETE', rejetModal.commentaire, null);
  };

  const confirmerSousReserve = () => {
    if (!sousReserveModal.commentaire.trim()) {
      showMessage('Le commentaire est obligatoire', 'error');
      return;
    }
    handleDecision('SOUS_RESERVE', null, sousReserveModal.commentaire);
  };

  const ouvrirDocument = (url, name, type = '') => {
    if (!url) {
      showMessage('Document non disponible', 'error');
      return;
    }
    // Construire l'URL complète si nécessaire
    const fullUrl = url.startsWith('http') ? url : `${API_URL.replace('/api', '')}${url}`;
    setDocumentViewer({ open: true, url: fullUrl, name, type });
  };

  if (loading) {
    return (
      <CommissionLayout>
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
          <div className='w-12 h-12 border-4 border-slate-700 border-t-slate-400 rounded-full animate-spin' />
        </div>
      </CommissionLayout>
    );
  }

  if (!inscription) {
    return (
      <CommissionLayout>
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
          <div className='text-center'>
            <p className='text-gray-600 mb-4'>Inscription non trouvée</p>
            <button
              onClick={() => navigate('/commission')}
              className='bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition'
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </CommissionLayout>
    );
  }

  const candidat = inscription.candidat;
  const concours = inscription.concours;
  const dossier = candidat.dossier;
  const cfg = STATUT_CONFIG[inscription.statut] || STATUT_CONFIG.EN_ATTENTE;

  const pieces = ['acteNaissance', 'carteIdentite', 'photo', 'releve', 'quittance'];
  const nbPieces = pieces.filter(p => dossier?.[p]).length;
  const pctComplet = Math.round((nbPieces / pieces.length) * 100);

  return (
    <CommissionLayout>
      <div className='min-h-screen bg-gray-50'>
        <main className='max-w-6xl mx-auto px-4 py-6 space-y-6'>
          {/* Toast */}
          {message.text && (
            <div className={`px-4 py-3 rounded-lg text-sm flex items-center justify-between ${
              message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
              message.type === 'error'   ? 'bg-red-50 border border-red-200 text-red-700' :
                                           'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ text: '' })} className='ml-4 opacity-60 hover:opacity-100 text-lg leading-none'>&times;</button>
          </div>
        )}

        {/* EN-TÊTE CANDIDAT */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
          <div className='p-6'>
            <div className='flex items-start justify-between gap-4 mb-6'>
              <div className='flex items-center gap-4'>
                <div className='w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center text-xl font-medium text-white flex-shrink-0'>
                  {initiales(candidat.prenom, candidat.nom)}
                </div>
                <div>
                  <h1 className='text-2xl font-semibold text-gray-900'>{candidat.prenom} {candidat.nom}</h1>
                  <p className='text-slate-600 text-sm font-mono font-medium'>{candidat.matricule}</p>
                  <p className='text-gray-500 text-sm mt-1'>{candidat.email}</p>
                  {candidat.telephone && <p className='text-gray-500 text-sm'>{candidat.telephone}</p>}
                </div>
              </div>
              <div className='text-right'>
                <span className={`inline-block text-sm px-4 py-2 rounded-lg font-medium ${cfg.badge}`}>
                  {cfg.label}
                </span>
                <p className='text-gray-400 text-xs mt-2'>
                  Inscrit le {new Date(inscription.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            {/* INFORMATIONS PERSONNELLES */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
              {candidat.dateNaiss && (
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-xs text-gray-500 mb-1'>Date de naissance</p>
                  <p className='font-medium text-gray-900'>{new Date(candidat.dateNaiss).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
              {candidat.lieuNaiss && (
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-xs text-gray-500 mb-1'>Lieu de naissance</p>
                  <p className='font-medium text-gray-900'>{candidat.lieuNaiss}</p>
                </div>
              )}
              {candidat.sexe && (
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-xs text-gray-500 mb-1'>Sexe</p>
                  <p className='font-medium text-gray-900'>{candidat.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
                </div>
              )}
              {candidat.nationalite && (
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-xs text-gray-500 mb-1'>Nationalité</p>
                  <p className='font-medium text-gray-900'>{candidat.nationalite}</p>
                </div>
              )}
            </div>

            {/* CONCOURS */}
            <div className='bg-slate-50 rounded-lg p-4 border border-slate-200'>
              <p className='text-xs text-slate-600 font-medium mb-1'>Concours</p>
              <p className='font-semibold text-slate-800 text-lg'>{concours.libelle}</p>
              <p className='text-slate-700 text-sm'>{concours.etablissement}</p>
              {concours.dateDebut && (
                <p className='text-slate-600 text-xs mt-2'>
                  Du {new Date(concours.dateDebut).toLocaleDateString('fr-FR')} au {new Date(concours.dateFin).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* PIÈCES JUSTIFICATIVES */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-gray-900'>Pièces justificatives</h2>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-slate-600'>
                {nbPieces}/5 pièces
              </span>
              <div className='w-24 h-2 bg-gray-200 rounded-full overflow-hidden'>
                <div
                  className='h-full transition-all bg-slate-600'
                  style={{ width: `${pctComplet}%` }}
                />
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {pieces.map(piece => {
              const pieceInfo = PIECES_LABELS[piece];
              const estDepose = dossier?.[piece];
              
              return (
                <div
                  key={piece}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${
                    estDepose
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      estDepose ? 'bg-slate-100' : 'bg-gray-100'
                    }`}>
                      <svg className={`w-5 h-5 ${estDepose ? 'text-slate-600' : 'text-gray-400'}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                      </svg>
                    </div>
                    <div>
                      <p className='font-medium text-gray-900 text-sm'>{pieceInfo.label}</p>
                      <p className={`text-xs ${estDepose ? 'text-slate-600' : 'text-gray-400'}`}>
                        {estDepose ? 'Déposée' : 'Non déposée'}
                      </p>
                    </div>
                  </div>
                  {estDepose && (
                    <button
                      onClick={() => ouvrirDocument(dossier[piece], pieceInfo.label)}
                      className='bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition flex items-center gap-2'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                      </svg>
                      Voir
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quittance d'inscription */}
          {inscription.quittance && (
            <div className='mt-4 p-4 bg-slate-50 border-2 border-slate-200 rounded-lg'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center'>
                    <svg className='w-5 h-5 text-slate-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                    </svg>
                  </div>
                  <div>
                    <p className='font-medium text-gray-900 text-sm'>Quittance d'inscription au concours</p>
                    <p className='text-xs text-slate-600'>Déposée</p>
                  </div>
                </div>
                <button
                  onClick={() => ouvrirDocument(inscription.quittance, 'Quittance d\'inscription')}
                  className='bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition flex items-center gap-2'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                  </svg>
                  Voir
                </button>
              </div>
            </div>
          )}
        </div>

        {/* COMMENTAIRES */}
        {(inscription.commentaireRejet || inscription.commentaireSousReserve) && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>Commentaires</h2>
            {inscription.commentaireRejet && (
              <div className='bg-slate-50 border-2 border-slate-200 rounded-lg p-4 mb-4'>
                <p className='text-xs text-slate-600 font-medium mb-2'>Motif du rejet</p>
                <p className='text-sm text-gray-900'>{inscription.commentaireRejet}</p>
              </div>
            )}
            {inscription.commentaireSousReserve && (
              <div className='bg-slate-50 border-2 border-slate-200 rounded-lg p-4'>
                <p className='text-xs text-slate-600 font-medium mb-2'>Conditions à remplir</p>
                <p className='text-sm text-gray-900'>{inscription.commentaireSousReserve}</p>
              </div>
            )}
          </div>
        )}

        {/* ACTIONS */}
        {inscription.statut === 'EN_ATTENTE' && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>Actions</h2>
            <div className='flex flex-col gap-3'>
              <button
                onClick={() => handleDecision('VALIDE')}
                className='w-full bg-slate-700 text-white py-3 rounded-lg text-sm font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                Valider le dossier
              </button>
              <div className='grid grid-cols-2 gap-3'>
                <button
                  onClick={() => setSousReserveModal({ open: true, commentaire: '' })}
                  className='bg-slate-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-slate-700 transition flex items-center justify-center gap-2'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                  </svg>
                  Sous réserve
                </button>
                <button
                  onClick={() => setRejetModal({ open: true, commentaire: '' })}
                  className='bg-slate-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-slate-600 transition flex items-center justify-center gap-2'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                  Rejeter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HISTORIQUE */}
        {dossier?.id && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <button
              onClick={() => setHistoriqueOuvert(!historiqueOuvert)}
              className='w-full flex items-center justify-between text-left mb-4'
            >
              <h2 className='text-lg font-semibold text-gray-900'>Historique des actions</h2>
              <svg
                className={`w-5 h-5 text-gray-600 transition-transform ${historiqueOuvert ? 'rotate-180' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
              </svg>
            </button>
            {historiqueOuvert && (
              <HistoriqueActions
                dossierId={dossier.id}
                nomCandidat={`${candidat.prenom} ${candidat.nom}`}
              />
            )}
          </div>
        )}

        {/* Modale de rejet */}
        {rejetModal.open && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'>
            <div className='bg-white rounded-lg shadow-2xl w-full max-w-md'>
              <div className='px-6 py-4 border-b border-gray-200'>
                <h3 className='font-semibold text-gray-900'>Rejeter le dossier</h3>
              </div>
            <div className='px-6 py-5'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Motif du rejet <span className='text-slate-600'>*</span>
              </label>
              <textarea
                value={rejetModal.commentaire}
                onChange={(e) => setRejetModal(m => ({ ...m, commentaire: e.target.value }))}
                placeholder='Expliquez pourquoi le dossier est rejeté (ex: pièces manquantes, documents non conformes, etc.)'
                rows={5}
                className='w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-slate-500 resize-none'
              />
              <p className='text-xs text-gray-500 mt-2'>
                Ce message sera envoyé au candidat par email.
              </p>
            </div>
            <div className='px-6 py-4 border-t border-gray-200 flex gap-3 justify-end'>
              <button
                onClick={() => setRejetModal({ open: false, commentaire: '' })}
                className='text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition'
              >
                Annuler
              </button>
              <button
                onClick={confirmerRejet}
                className='text-sm bg-slate-700 text-white px-5 py-2 rounded-lg hover:bg-slate-800 transition'
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale sous réserve */}
      {sousReserveModal.open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'>
          <div className='bg-white rounded-lg shadow-2xl w-full max-w-md'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h3 className='font-semibold text-gray-900'>Accepter sous réserve</h3>
            </div>
            <div className='px-6 py-5'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Conditions à remplir <span className='text-slate-600'>*</span>
              </label>
              <textarea
                value={sousReserveModal.commentaire}
                onChange={(e) => setSousReserveModal(m => ({ ...m, commentaire: e.target.value }))}
                placeholder='Indiquez les conditions que le candidat doit remplir (ex: fournir une pièce manquante, corriger un document, etc.)'
                rows={5}
                className='w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-slate-500 resize-none'
              />
              <p className='text-xs text-gray-500 mt-2'>
                Ce message sera envoyé au candidat par email avec les conditions à remplir.
              </p>
            </div>
            <div className='px-6 py-4 border-t border-gray-200 flex gap-3 justify-end'>
              <button
                onClick={() => setSousReserveModal({ open: false, commentaire: '' })}
                className='text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition'
              >
                Annuler
              </button>
              <button
                onClick={confirmerSousReserve}
                className='text-sm bg-slate-700 text-white px-5 py-2 rounded-lg hover:bg-slate-800 transition'
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Document Viewer */}
        <DocumentViewer
          isOpen={documentViewer.open}
          onClose={() => setDocumentViewer({ open: false, url: '', name: '', type: '' })}
          documentUrl={documentViewer.url}
          documentName={documentViewer.name}
          documentType={documentViewer.type}
        />
        </main>
      </div>
    </CommissionLayout>
  );
}
