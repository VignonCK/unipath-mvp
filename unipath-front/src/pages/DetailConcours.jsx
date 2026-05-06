// src/pages/DetailConcours.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { candidatService, concoursService, inscriptionService, convocationService } from '../services/api';
import CandidatLayout from '../components/CandidatLayout';

const CHAMPS_REQUIS = ['telephone', 'dateNaiss', 'lieuNaiss'];
const PIECES_LABELS = {
  acteNaissance: 'Acte de naissance',
  carteIdentite: "Carte d'identité",
  photo: "Photo d'identité",
  releve: 'Relevé de notes Bac',
};

function profilIncomplet(candidat) {
  if (!candidat) return false;
  return CHAMPS_REQUIS.some(c => !candidat[c]);
}

function dossierIncomplet(candidat) {
  if (!candidat?.dossier) return true;
  return Object.keys(PIECES_LABELS).some(piece => !candidat.dossier[piece]);
}

function getPiecesManquantes(candidat) {
  if (!candidat?.dossier) return Object.values(PIECES_LABELS);
  return Object.keys(PIECES_LABELS)
    .filter(piece => !candidat.dossier[piece])
    .map(p => PIECES_LABELS[p]);
}

export default function DetailConcours() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidat, setCandidат] = useState(null);
  const [concours, setConcours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingQuittance, setUploadingQuittance] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [photoUrl, setPhotoUrl] = useState(null);
  const [inscription, setInscription] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    Promise.all([candidatService.getProfil(), concoursService.getById(id)])
      .then(([p, c]) => {
        setCandidат(p);
        setConcours(c);
        const saved = localStorage.getItem('photoProfil_' + p.id);
        if (saved) setPhotoUrl(saved);
        const inscriptionExistante = p.inscriptions?.find(i => i.concoursId === c.id);
        if (inscriptionExistante) setInscription(inscriptionExistante);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [id]);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '' }), 6000);
  };

  const handleSoumettreDossier = async () => {
    if (profilIncomplet(candidat)) {
      showMessage('Veuillez compléter votre profil avant de soumettre votre dossier.', 'error');
      return;
    }

    if (dossierIncomplet(candidat)) {
      const piecesManquantes = getPiecesManquantes(candidat);
      showMessage(`Dossier incomplet. Pièces manquantes : ${piecesManquantes.join(', ')}`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const result = await inscriptionService.creer(id);
      setInscription(result);
      showMessage('Inscription réussie ! Fiche de pré-inscription envoyée par email.', 'success');
      const updated = await candidatService.getProfil();
      setCandidат(updated);
    } catch (err) {
      showMessage(err.message || 'Erreur lors de l inscription.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTelechargerFiche = async () => {
    if (!inscription?.id) return;
    try {
      await convocationService.telechargerPreinscription(inscription.id);
      showMessage('Téléchargement démarré !', 'success');
    } catch (err) {
      showMessage('Erreur lors du téléchargement.', 'error');
    }
  };

  const handleUploadQuittance = async (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;

    // Vérifier que c'est un PDF
    if (fichier.type !== 'application/pdf') {
      showMessage('La quittance doit être au format PDF.', 'error');
      return;
    }

    setUploadingQuittance(true);
    try {
      await inscriptionService.uploadQuittance(inscription.id, fichier);
      showMessage('Quittance uploadée avec succès !', 'success');
      // Recharger les données
      const updated = await candidatService.getProfil();
      setCandidат(updated);
      const inscriptionExistante = updated.inscriptions?.find(i => i.concoursId === concours.id);
      if (inscriptionExistante) setInscription(inscriptionExistante);
    } catch (err) {
      showMessage('Erreur lors de l\'upload de la quittance.', 'error');
    } finally {
      setUploadingQuittance(false);
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

  const dossierComplet = !profilIncomplet(candidat) && !dossierIncomplet(candidat);
  const piecesManquantes = getPiecesManquantes(candidat);

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
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
            'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 space-y-4 sm:space-y-6'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-black text-gray-900 mb-2'>{ concours.libelle}</h1>
            <p className='text-gray-500 text-xs sm:text-sm'>EPAC — Université d Abomey-Calavi</p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='bg-gray-50 rounded-xl p-4'>
              <p className='text-xs text-gray-400 mb-1'>Date de début</p>
              <p className='text-sm font-medium text-gray-800'>
                {new Date(concours.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className='bg-gray-50 rounded-xl p-4'>
              <p className='text-xs text-gray-400 mb-1'>Date de fin</p>
              <p className='text-sm font-medium text-gray-800'>
                {new Date(concours.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {concours.fraisParticipation && (
            <div className='bg-orange-50 border border-orange-200 rounded-xl p-4'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white'>
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
              <p className='text-gray-600'>{concours.description}</p>
            </div>
          )}

          <div>
            <h2 className='text-lg font-bold text-gray-900 mb-3'>Critères de participation</h2>
            <ul className='space-y-2'>
              <li className='flex items-start gap-2'>
                <svg className='w-5 h-5 text-green-500 mt-0.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                <span className='text-gray-700'>Être titulaire du Baccalauréat</span>
              </li>
              <li className='flex items-start gap-2'>
                <svg className='w-5 h-5 text-green-500 mt-0.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                <span className='text-gray-700'>Avoir un dossier complet (acte de naissance, carte d identité, photo, relevé de notes, quittance)</span>
              </li>
              <li className='flex items-start gap-2'>
                <svg className='w-5 h-5 text-green-500 mt-0.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                <span className='text-gray-700'>S inscrire avant la date limite</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className='text-lg font-bold text-gray-900 mb-3'>Matières composées</h2>
            <div className='grid grid-cols-2 gap-2'>
              <div className='bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-900'>Mathématiques</div>
              <div className='bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-900'>Français</div>
              <div className='bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-900'>Anglais</div>
              <div className='bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-900'>Culture générale</div>
            </div>
          </div>

          {inscription ? (
            <div className='space-y-4'>
              <div className='bg-green-50 border border-green-200 rounded-xl p-4'>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                  </div>
                  <div>
                    <p className='font-bold text-green-900'>Inscription réussie</p>
                    <p className='text-sm text-green-700'>Votre dossier a été soumis avec succès</p>
                  </div>
                </div>
              </div>

              {/* Bouton Voir le Classement */}
              <button
                onClick={() => navigate(`/concours/${id}/classement`)}
                className='w-full bg-blue-900 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition flex items-center justify-center gap-2'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                </svg>
                Voir le classement
              </button>

              {/* Section Quittance */}
              {concours.fraisParticipation && (
                <div className='bg-white border border-gray-200 rounded-xl p-5'>
                  <div className='flex items-center gap-3 mb-4'>
                    <svg className='w-6 h-6 text-orange-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                    </svg>
                    <div>
                      <h3 className='font-bold text-gray-900'>Quittance de paiement</h3>
                      <p className='text-xs text-gray-500'>Montant : {concours.fraisParticipation.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                  </div>

                  {inscription.quittanceUrl ? (
                    <div className='bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                        </svg>
                        <span className='text-sm font-medium text-green-700'>Quittance déposée</span>
                      </div>
                      <label className='cursor-pointer'>
                        <span className='text-xs text-green-600 hover:text-green-700 underline'>Modifier</span>
                        <input type='file' accept='.pdf' onChange={handleUploadQuittance} className='hidden' disabled={uploadingQuittance} />
                      </label>
                    </div>
                  ) : (
                    <label className='block cursor-pointer'>
                      <div className='border-2 border-dashed border-orange-300 rounded-lg p-4 hover:border-orange-500 hover:bg-orange-50 transition text-center'>
                        <svg className='w-8 h-8 text-orange-500 mx-auto mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                        </svg>
                        <p className='text-sm font-medium text-gray-700 mb-1'>
                          {uploadingQuittance ? 'Upload en cours...' : 'Cliquez pour uploader votre quittance'}
                        </p>
                        <p className='text-xs text-gray-500'>Format PDF uniquement</p>
                      </div>
                      <input type='file' accept='.pdf' onChange={handleUploadQuittance} className='hidden' disabled={uploadingQuittance} />
                    </label>
                  )}
                </div>
              )}

              <button
                onClick={handleTelechargerFiche}
                className='w-full bg-blue-900 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition flex items-center justify-center gap-2'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
                Télécharger ma fiche de pré-inscription
              </button>

              <div className={`border rounded-xl p-4 flex items-center gap-3 ${
                inscription.statut === 'VALIDE' ? 'bg-green-50 border-green-200' :
                inscription.statut === 'REJETE' ? 'bg-red-50 border-red-200' :
                'bg-orange-50 border-orange-200'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  inscription.statut === 'VALIDE' ? 'bg-green-500' :
                  inscription.statut === 'REJETE' ? 'bg-red-500' :
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
                    inscription.statut === 'VALIDE' ? 'text-green-900' :
                    inscription.statut === 'REJETE' ? 'text-red-900' :
                    'text-orange-900'
                  }`}>
                    {inscription.statut === 'VALIDE' ? 'Dossier validé' :
                     inscription.statut === 'REJETE' ? 'Dossier rejeté' :
                     'En cours d\'analyse'}
                  </p>
                  <p className={`text-sm ${
                    inscription.statut === 'VALIDE' ? 'text-green-700' :
                    inscription.statut === 'REJETE' ? 'text-red-700' :
                    'text-orange-700'
                  }`}>
                    {inscription.statut === 'VALIDE' ? 'Vous êtes convoqué au concours' :
                     inscription.statut === 'REJETE' ? 'Votre candidature n\'a pas été retenue' :
                     'La commission examine votre dossier'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              {!dossierComplet && (
                <div className='bg-red-50 border border-red-200 rounded-xl p-4'>
                  <p className='font-bold text-red-900 mb-2'>Dossier incomplet</p>
                  <p className='text-sm text-red-700 mb-3'>Pièces manquantes :</p>
                  <ul className='space-y-1'>
                    {piecesManquantes.map((piece, i) => (
                      <li key={i} className='text-sm text-red-700 flex items-center gap-2'>
                        <span>•</span>
                        <span>{piece}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className='mt-3 text-sm text-red-900 font-semibold hover:underline'
                  >
                    Compléter mon dossier →
                  </button>
                </div>
              )}

              <button
                onClick={handleSoumettreDossier}
                disabled={submitting}
                className='w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50'
              >
                {submitting ? 'Soumission en cours...' : 'Soumettre mon dossier'}
              </button>
            </div>
          )}
        </div>
      </div>
    </CandidatLayout>
  );
}
