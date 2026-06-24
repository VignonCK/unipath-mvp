// src/pages/DetailConcours.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { candidatService, concoursService, inscriptionService, dossierService, convocationService } from '../services/api';
import { handleSessionError } from '../utils/auth';
import CandidatLayout from '../components/CandidatLayout';

const CHAMPS_REQUIS = ['telephone', 'dateNaiss', 'lieuNaiss'];

const PIECES_DOSSIER_BASE = {
  acteNaissance: 'Acte de naissance',
  carteIdentite: "Carte d'identité",
  photo:         "Photo d'identité",
  releve:        'Relevé de notes Bac',
};

const PIECES_FORMATS = {
  photo:         'image/*',
  carteIdentite: '.pdf,.jpg,.jpeg,.png',
  acteNaissance: '.pdf',
  releve:        '.pdf',
  quittance:     '.pdf',
};

function getSerieAliases(serie) {
  const s = String(serie || '').trim().toUpperCase();
  if (!s) return [];
  if (s === 'G') return ['G', 'G1', 'G2', 'G3'];
  if (['G1', 'G2', 'G3'].includes(s)) return [s, 'G'];
  if (s === 'F') return ['F', 'F1', 'F2', 'F3', 'F4'];
  if (['F1', 'F2', 'F3', 'F4'].includes(s)) return [s, 'F'];
  return [s];
}

function isSerieMatched(candidateSerie, serieConcours) {
  const aliases = getSerieAliases(candidateSerie);
  if (aliases.length === 0) return false;
  return aliases.includes(String(serieConcours || '').trim().toUpperCase());
}

// Un concours sans série configurée est ouvert à toutes les séries.
function serieCandidatAcceptee(candidat, concours) {
  const series = concours?.seriesAcceptees;
  if (!Array.isArray(series) || series.length === 0) return true;
  return series.some(s => isSerieMatched(candidat?.serie, s));
}

function depotEstFerme(concours) {
  const dateLimite = concours?.dateFinDepot || concours?.dateFin;
  if (!dateLimite) return false;
  return new Date() > new Date(dateLimite);
}

function getPiecesRequisesConcours(concours) {
  if (!concours?.piecesRequises) return Object.keys(PIECES_DOSSIER_BASE).map(id => ({ id, fournieDepuisDossier: false }));
  const pr = concours.piecesRequises;
  if (Array.isArray(pr)) return pr.map(p => typeof p === 'object' ? p : { id: p, fournieDepuisDossier: false });
  if (Array.isArray(pr.pieces)) return pr.pieces.map(p => typeof p === 'object' ? p : { id: p, fournieDepuisDossier: false });
  return Object.keys(PIECES_DOSSIER_BASE).map(id => ({ id, fournieDepuisDossier: false }));
}

function getLabelPiece(pieceObj, concours) {
  const piece = typeof pieceObj === 'object' ? pieceObj.id : pieceObj;
  if (PIECES_DOSSIER_BASE[piece]) return PIECES_DOSSIER_BASE[piece];
  if (piece === 'quittance') return 'Quittance de paiement';
  if (typeof pieceObj === 'object' && pieceObj.nom) return pieceObj.nom;
  const pr = concours?.piecesRequises;
  const liste = Array.isArray(pr) ? pr : (Array.isArray(pr?.pieces) ? pr.pieces : []);
  const found = liste.find(p => typeof p === 'object' && p.id === piece);
  if (found?.nom) return found.nom;
  return piece.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

function getCriteresEligibilite(concours) {
  const rootCriteres = concours?.criteresEligibilite;
  const nestedCriteres = concours?.piecesRequises?.criteresEligibilite;
  const source = rootCriteres || nestedCriteres;
  if (!source) return [];
  const raw = Array.isArray(source)
    ? source
    : (Array.isArray(source?.criteres) ? source.criteres : []);

  return raw
    .map((item) => {
      if (typeof item === 'string') {
        return { titre: item, description: '' };
      }
      return {
        titre: item?.titre || '',
        description: item?.description || '',
      };
    })
    .filter((item) => item.titre.trim() !== '');
}

function profilIncomplet(candidat) {
  if (!candidat) return false;
  return CHAMPS_REQUIS.some(c => !candidat[c]);
}

function getQuittanceUrl(inscription) {
  return inscription?.quittanceUrl || inscription?.dossierInscription?.quittanceUrl;
}

function getPiecesExtras(inscription) {
  return inscription?.piecesExtras || inscription?.dossierInscription?.piecesExtras || {};
}

function getPieceStatut(pieceObj, candidat, inscription) {
  const piece = typeof pieceObj === 'object' ? pieceObj.id : pieceObj;
  
  // Si la pièce est fournie depuis le dossier personnel (enrichie par le backend)
  if (typeof pieceObj === 'object' && pieceObj.fournieDepuisDossier) {
    return true;
  }
  
  // Sinon, vérifier manuellement (fallback)
  if (piece === 'quittance') return !!getQuittanceUrl(inscription);
  if (PIECES_DOSSIER_BASE[piece]) {
    return !!candidat?.dossier?.[piece];
  }
  return !!getPiecesExtras(inscription)?.[piece];
}

async function refreshData(id) {
  const [candidat, concours] = await Promise.all([
    candidatService.getProfil(),
    concoursService.getById(id),
  ]);
  return { candidat, concours };
}

export default function DetailConcours() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidat, setCandidat] = useState(null);
  const [concours, setConcours] = useState(null);
  const [inscription, setInscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPiece, setUploadingPiece] = useState({});
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    refreshData(id)
      .then(({ candidat: p, concours: c }) => {
        setCandidat(p);
        setConcours(c);
        const saved = localStorage.getItem('photoProfil_' + p.id);
        if (saved) setPhotoUrl(saved);
        const inscriptionExistante = p.inscriptions?.find(i => i.concoursId === c.id);
        if (inscriptionExistante) setInscription(inscriptionExistante);
      })
      .catch((err) => {
        if (handleSessionError(err, navigate)) return;
        showMessage(err?.message || 'Impossible de charger ce concours.', 'error');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '' }), 6000);
  };

  const handleUploadPiece = async (piece, fichier) => {
    if (!fichier) return;
    if (fichier.size > 5 * 1024 * 1024) {
      showMessage('Le fichier dépasse la taille maximale autorisée (5 MB).', 'error');
      return;
    }
    setUploadingPiece(prev => ({ ...prev, [piece]: true }));
    try {
      if (piece === 'quittance') {
        await inscriptionService.uploadQuittance(inscription.id, fichier);
      } else if (PIECES_DOSSIER_BASE[piece]) {
        // ✅ REFONTE - Passer candidatId pour les documents de base
        await dossierService.uploadPiece(candidat.id, piece, fichier);
      } else {
        await inscriptionService.uploadPieceExtra(inscription.id, piece, fichier);
      }
      showMessage('Pièce déposée avec succès !', 'success');
      const { candidat: updated, concours: updatedConcours } = await refreshData(id);
      setCandidat(updated);
      setConcours(updatedConcours);
      const inscriptionUpdated = updated.inscriptions?.find(i => i.concoursId === updatedConcours.id);
      if (inscriptionUpdated) setInscription(inscriptionUpdated);
    } catch (err) {
      showMessage(err.message || 'Erreur lors du dépôt.', 'error');
    } finally {
      setUploadingPiece(prev => ({ ...prev, [piece]: false }));
    }
  };

  const handleSoumettreDossier = async () => {
    if (profilIncomplet(candidat)) {
      showMessage('Veuillez compléter votre profil avant de soumettre votre dossier.', 'error');
      return;
    }
    
    // Si pas encore inscrit, créer l'inscription d'abord (sans vérifier la quittance)
    if (!inscription) {
      if (!serieCandidatAcceptee(candidat, concours)) {
        showMessage("Votre série n'est pas acceptée pour ce concours.", 'error');
        return;
      }
      if (depotEstFerme(concours)) {
        showMessage('La période de dépôt pour ce concours est terminée.', 'error');
        return;
      }
      const piecesDossier = getPiecesRequisesConcours(concours).filter(p => (typeof p === 'object' ? p.id : p) !== 'quittance');
      const manquantes = piecesDossier.filter(pieceObj => !getPieceStatut(pieceObj, candidat, inscription));
      if (manquantes.length > 0) {
        showMessage(`Pièces manquantes : ${manquantes.map(p => getLabelPiece(p, concours)).join(', ')}`, 'error');
        return;
      }
      
      setSubmitting(true);
      try {
        const result = await inscriptionService.creer(id);
        setInscription(result.inscription);
        showMessage('Inscription créée ! Veuillez maintenant déposer votre quittance de paiement.', 'success');
        const { candidat: updated, concours: updatedConcours } = await refreshData(id);
        setCandidat(updated);
        setConcours(updatedConcours);
        const inscriptionUpdated = updated.inscriptions?.find(i => i.concoursId === updatedConcours.id);
        if (inscriptionUpdated) setInscription(inscriptionUpdated);
      } catch (err) {
        if (err.response?.status === 409) {
          showMessage(err.response.data?.error || err.message, 'error');
        } else {
          showMessage(err.message || "Une erreur est survenue lors de l'inscription.", 'error');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }
    
    // Si déjà inscrit, vérifier que TOUTES les pièces sont complètes (y compris quittance)
    const toutesLesPiecesRequises = getPiecesRequisesConcours(concours);
    const manquantes = toutesLesPiecesRequises.filter(pieceObj => !getPieceStatut(pieceObj, candidat, inscription));
    if (manquantes.length > 0) {
      showMessage(`Pièces manquantes : ${manquantes.map(p => getLabelPiece(p, concours)).join(', ')}`, 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      await inscriptionService.soumettre(inscription.id);
      showMessage('Dossier soumis avec succès ! La commission va l\'examiner.', 'success');
      const { candidat: updated, concours: updatedConcours } = await refreshData(id);
      setCandidat(updated);
      setConcours(updatedConcours);
      const inscriptionUpdated = updated.inscriptions?.find(i => i.concoursId === updatedConcours.id);
      if (inscriptionUpdated) setInscription(inscriptionUpdated);
    } catch (err) {
      showMessage(err.message || "Erreur lors de la soumission.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTelechargerFiche = async () => {
    if (!inscription?.id) return;
    try {
      await convocationService.telechargerPreinscription(inscription.id);
      showMessage('Téléchargement démarré !', 'success');
    } catch {
      showMessage('Erreur lors du téléchargement.', 'error');
    }
  };

  if (loading) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin' />
    </div>
  );

  if (!concours) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <p className='text-gray-500 mb-4'>Concours introuvable</p>
        <button onClick={() => navigate('/concours')} className='text-blue-900 hover:underline'>Retour</button>
      </div>
    </div>
  );

  const toutesLesPieces = getPiecesRequisesConcours(concours);
  const criteresEligibilite = getCriteresEligibilite(concours);
  const serieOk = serieCandidatAcceptee(candidat, concours);
  const depotFerme = depotEstFerme(concours);
  const inscriptionBloquee = !inscription && (!serieOk || depotFerme);
  // ✅ Toutes les pièces y compris la quittance doivent être fournies avant soumission
  const nbFournies = toutesLesPieces.filter(pieceObj => getPieceStatut(pieceObj, candidat, inscription)).length;
  const pct = toutesLesPieces.length > 0 ? Math.round((nbFournies / toutesLesPieces.length) * 100) : 100;
  const dossierComplet = !profilIncomplet(candidat) && toutesLesPieces.every(pieceObj => getPieceStatut(pieceObj, candidat, inscription));

  return (
    <CandidatLayout candidat={candidat} photoUrl={photoUrl}>
      <div className='max-w-4xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-0'>

        <button onClick={() => navigate('/concours')} className='flex items-center gap-2 text-gray-600 hover:text-gray-900 text-xs sm:text-sm font-medium'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
          </svg>
          Retour aux concours
        </button>

        {message.text && (
          <div className={`px-4 py-3 rounded-lg text-xs sm:text-sm ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
            message.type === 'error'   ? 'bg-red-50 border border-red-200 text-red-700' :
                                         'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 space-y-4 sm:space-y-6'>

          <div>
            <h1 className='text-2xl sm:text-3xl font-black text-gray-900 mb-2'>{concours.libelle}</h1>
            <p className='text-gray-500 text-xs sm:text-sm'>{concours.etablissement || 'Etablissement non precise'}</p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='bg-gray-50 rounded-xl p-4'>
              <p className='text-xs text-gray-400 mb-1'>Dépôt des dossiers</p>
              <p className='text-sm font-medium text-gray-800'>
                {new Date(concours.dateDebutDepot || concours.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' → '}
                {new Date(concours.dateFinDepot || concours.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {concours.dateDebutComposition && (
              <div className='bg-gray-50 rounded-xl p-4'>
                <p className='text-xs text-gray-400 mb-1'>Composition</p>
                <p className='text-sm font-medium text-gray-800'>
                  {new Date(concours.dateDebutComposition).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {concours.dateFinComposition && <> → {new Date(concours.dateFinComposition).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>}
                </p>
              </div>
            )}
          </div>

          {concours.seriesAcceptees?.length > 0 && (
            <div>
              <h2 className='text-sm font-bold text-gray-700 mb-2'>Séries acceptées</h2>
              <div className='flex flex-wrap gap-2'>
                {concours.seriesAcceptees.map(serie => (
                  <span key={serie} className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isSerieMatched(candidat?.serie, serie) ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    Série {serie}{isSerieMatched(candidat?.serie, serie) && ' ✓'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {concours.fraisParticipation && (
            <div className='bg-orange-50 border border-orange-200 rounded-xl p-4'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white flex-shrink-0'>
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <div>
                  <p className='text-xs text-orange-600 font-medium'>Frais de participation</p>
                  <p className='text-2xl font-black text-orange-900'>{concours.fraisParticipation.toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
            </div>
          )}

          {concours.description && (
            <div>
              <h2 className='text-lg font-bold text-gray-900 mb-2'>Description</h2>
              <p className='text-gray-600 text-sm'>{concours.description}</p>
            </div>
          )}

          {criteresEligibilite.length > 0 && (
            <div>
              <h2 className='text-lg font-bold text-gray-900 mb-2'>Critères d éligibilité</h2>
              <div className='space-y-2'>
                {criteresEligibilite.map((critere, index) => (
                  <div key={`${critere.titre}-${index}`} className='rounded-xl border border-blue-100 bg-blue-50 p-3'>
                    <p className='text-sm font-semibold text-blue-900'>{critere.titre}</p>
                    {critere.description && (
                      <p className='mt-1 text-xs text-blue-800'>{critere.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PIÈCES REQUISES */}
          <div>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-bold text-gray-900'>Pièces requises</h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${dossierComplet ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {nbFournies}/{toutesLesPieces.length} fournie{nbFournies > 1 ? 's' : ''}
              </span>
            </div>

            <div className='mb-4'>
              <div className='w-full bg-gray-100 rounded-full h-2 overflow-hidden'>
                <div className={`h-2 rounded-full transition-all duration-500 ${dossierComplet ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${pct}%` }} />
              </div>
              <p className={`text-xs mt-1 font-medium ${dossierComplet ? 'text-green-600' : 'text-orange-600'}`}>
                {pct}% — {dossierComplet ? 'Dossier complet !' : 'Complétez votre dossier pour pouvoir soumettre'}
              </p>
            </div>

            <div className='space-y-2'>
              {toutesLesPieces.map(pieceObj => {
                const piece = typeof pieceObj === 'object' ? pieceObj.id : pieceObj;
                const fournieDepuisDossier = typeof pieceObj === 'object' && pieceObj.fournieDepuisDossier;
                const fournie = getPieceStatut(pieceObj, candidat, inscription);
                const label = getLabelPiece(pieceObj, concours);
                const isUploading = uploadingPiece[piece];
                const accept = PIECES_FORMATS[piece] || '.pdf,.jpg,.jpeg,.png';
                
                return (
                  <div key={piece} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${fournie ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className='flex items-center gap-3 flex-1'>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${fournie ? 'bg-green-500' : 'bg-red-400'}`}>
                        {fournie ? (
                          <svg className='w-4 h-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                          </svg>
                        ) : (
                          <svg className='w-4 h-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                          </svg>
                        )}
                      </div>
                      <div className='flex flex-col flex-1 min-w-0'>
                        <span className={`text-sm font-medium ${fournie ? 'text-green-800' : 'text-red-800'}`}>{label}</span>
                        {fournieDepuisDossier && (
                          <span className='text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-block w-fit mt-1'>
                            ✓ Depuis votre dossier personnel
                          </span>
                        )}
                      </div>
                    </div>
                    <div className='flex flex-col items-end gap-1 flex-shrink-0 ml-3'>
                      {fournieDepuisDossier ? (
                        <span className='text-xs text-green-600 font-medium'>
                          Fournie
                        </span>
                      ) : (
                        <label className='cursor-pointer'>
                          <span className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                            isUploading ? 'bg-gray-200 text-gray-500' :
                            fournie     ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                          'bg-blue-900 text-white hover:bg-blue-800'
                          }`}>
                            {isUploading ? 'Envoi...' : fournie ? 'Modifier' : 'Déposer'}
                          </span>
                          <input
                            type='file'
                            accept={accept}
                            className='hidden'
                            disabled={isUploading}
                            onChange={e => handleUploadPiece(piece, e.target.files[0])}
                          />
                        </label>
                      )}
                      <span className='text-xs text-gray-400'>Max 5 MB</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {inscriptionBloquee && (
            <div className='bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3'>
              <div className='w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white flex-shrink-0'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <div>
                <p className='font-bold text-red-900 text-sm'>Inscription impossible</p>
                <p className='text-xs text-red-700 mt-0.5'>
                  {!serieOk
                    ? `Votre série (${candidat?.serie || 'non renseignée'}) n'est pas acceptée pour ce concours.`
                    : 'La période de dépôt des dossiers est terminée.'}
                </p>
              </div>
            </div>
          )}

          {/* SECTION SELON STATUT */}
          {inscription ? (
            <div className='space-y-4'>

              <div className='bg-green-50 border border-green-200 rounded-xl p-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                  </div>
                  <div>
                    <p className='font-bold text-green-900'>Inscription réussie</p>
                    {inscription.numeroInscription && (
                      <p className='text-xs text-green-700 font-mono mt-0.5'>N° {inscription.numeroInscription}</p>
                    )}
                  </div>
                </div>
              </div>

              <button onClick={handleTelechargerFiche}
                className='w-full bg-blue-900 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition flex items-center justify-center gap-2'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
                Télécharger ma fiche de pré-inscription
              </button>

              <button onClick={() => navigate(`/concours/${id}/classement`)}
                className='w-full bg-blue-900 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition flex items-center justify-center gap-2'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                </svg>
                Voir le classement
              </button>

              <div className={`border rounded-xl p-4 flex items-center gap-3 ${
                inscription.statut === 'VALIDE'       ? 'bg-green-50 border-green-200' :
                inscription.statut === 'REJETE'       ? 'bg-red-50 border-red-200' :
                inscription.statut === 'SOUS_RESERVE' ? 'bg-yellow-50 border-yellow-200' :
                                                        'bg-orange-50 border-orange-200'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  inscription.statut === 'VALIDE'       ? 'bg-green-500' :
                  inscription.statut === 'REJETE'       ? 'bg-red-500' :
                  inscription.statut === 'SOUS_RESERVE' ? 'bg-yellow-500' :
                                                          'bg-orange-500 animate-pulse'
                }`}>
                  {inscription.statut === 'VALIDE' ? (
                    <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                  ) : inscription.statut === 'REJETE' ? (
                    <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  ) : (
                    <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`font-bold ${
                    inscription.statut === 'VALIDE'       ? 'text-green-900' :
                    inscription.statut === 'REJETE'       ? 'text-red-900' :
                    inscription.statut === 'SOUS_RESERVE' ? 'text-yellow-900' : 'text-orange-900'
                  }`}>
                    {inscription.statut === 'VALIDE'       ? 'Dossier validé' :
                     inscription.statut === 'REJETE'       ? 'Dossier rejeté' :
                     inscription.statut === 'SOUS_RESERVE' ? 'Validé sous réserve' :
                                                             "En cours d'analyse"}
                  </p>
                  <p className='text-sm text-gray-600'>
                    {inscription.statut === 'VALIDE'       ? 'Vous êtes convoqué au concours' :
                     inscription.statut === 'REJETE'       ? inscription.commentaireRejet || "Votre candidature n'a pas été retenue" :
                     inscription.statut === 'SOUS_RESERVE' ? inscription.commentaireSousReserve || 'Validation conditionnelle' :
                                                             'La commission examine votre dossier'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSoumettreDossier}
              disabled={submitting || inscriptionBloquee || (!inscription && !dossierComplet)}
              className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                (!inscriptionBloquee && (inscription || dossierComplet))
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? 'En cours...' : 
               !inscription ? (dossierComplet ? "S'inscrire au concours" : 'Complétez votre dossier pour vous inscrire') :
               !inscription.quittanceUrl ? 'Déposez votre quittance pour soumettre' :
               'Soumettre mon dossier complet'}
            </button>
          )}
        </div>
      </div>
    </CandidatLayout>
  );
}