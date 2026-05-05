// src/pages/DetailConcours.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { candidatService, concoursService, inscriptionService } from '../services/api';
import CandidatLayout from '../components/CandidatLayout';

const CHAMPS_REQUIS = ['telephone', 'dateNaiss', 'lieuNaiss'];
const PIECES_LABELS = {
  acteNaissance: 'Acte de naissance',
  carteIdentite: "Carte d'identité",
  photo: "Photo d'identité",
  releve: 'Relevé de notes Bac',
  quittance: "Quittance d'inscription",
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
      <div className='max-w-4xl mx-auto space-y-6'>
        <button onClick={() => navigate('/concours')} className='flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
          </svg>
          Retour aux concours
        </button>

        {message.text && (
          <div className={`px-4 py-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
            'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6'>
          <div>
            <h1 className='text-3xl font-black text-gray-900 mb-2'>{concours.libelle}</h1>
            <p className='text-gray-500'>EPAC — Université d Abomey-Calavi</p>
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
                <span className='text-green-500 mt-1'>✓</span>
                <span className='text-gray-700'>Être titulaire du Baccalauréat</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-green-500 mt-1'>✓</span>
                <span className='text-gray-700'>Avoir un dossier complet (acte de naissance, carte d identité, photo, relevé de notes, quittance)</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-green-500 mt-1'>✓</span>
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
                    ✓
                  </div>
                  <div>
                    <p className='font-bold text-green-900'>Inscription réussie</p>
                    <p className='text-sm text-green-700'>Votre dossier a été soumis avec succès</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => alert('Téléchargement en cours...')}
                className='w-full bg-blue-900 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition flex items-center justify-center gap-2'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
                Télécharger ma fiche de pré-inscription
              </button>

              <div className='bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3'>
                <div className='w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center animate-pulse'>
                  <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <div>
                  <p className='font-bold text-orange-900'>En cours d analyse</p>
                  <p className='text-sm text-orange-700'>La commission examine votre dossier</p>
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
