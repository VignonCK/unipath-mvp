// src/pages/DashboardCandidat.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  authService, candidatService, concoursService,
  inscriptionService, dossierService, convocationService
} from '../services/api';
import DossierCompletion from '../components/DossierCompletion';
import CandidatLayout from '../components/CandidatLayout';

function initiales(prenom, nom) {
  return `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();
}

const STATUT_CONFIG = {
  VALIDE:     { label: 'Validé',     bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700' },
  REJETE:     { label: 'Rejeté',     bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700' },
  EN_ATTENTE: { label: 'En attente', bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
};

const PIECES_LABELS = {
  acteNaissance: 'Acte de naissance',
  carteIdentite: "Carte d'identité",
  photo:         "Photo d'identité",
  releve:        'Relevé de notes Bac',
  quittance:     "Quittance d'inscription",
};

// Champs obligatoires du profil
const CHAMPS_REQUIS = ['telephone', 'dateNaiss', 'lieuNaiss'];

function profilIncomplet(candidat) {
  if (!candidat) return false;
  return CHAMPS_REQUIS.some(c => !candidat[c]);
}

export default function DashboardCandidat() {
  const navigate = useNavigate();
  const [candidat, setCandidат]       = useState(null);
  const [concours, setConcours]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [uploadStatus, setUploadStatus] = useState({});
  const [message, setMessage]         = useState({ text: '', type: 'info' });
  const [telechargement, setTelechargement] = useState({});

  // Modale édition profil
  const [editOpen, setEditOpen]       = useState(false);
  const [editForm, setEditForm]       = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Photo de profil
  const [photoUrl, setPhotoUrl]       = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    Promise.all([candidatService.getProfil(), concoursService.getAll()])
      .then(([p, c]) => {
        setCandidат(p);
        setConcours(c);
        setEditForm({
          nom:       p.nom       || '',
          prenom:    p.prenom    || '',
          telephone: p.telephone || '',
          dateNaiss: p.dateNaiss ? p.dateNaiss.split('T')[0] : '',
          lieuNaiss: p.lieuNaiss || '',
        });
        // Photo stockée dans le dossier (champ "photo" = photo d'identité)
        // On utilise un champ séparé si disponible, sinon null
        if (p.photoProfilUrl) setPhotoUrl(p.photoProfilUrl);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, []);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'info' }), 5000);
  };

  // ── Mise à jour du profil ──────────────────────────────────
  const handleSaveProfil = async () => {
    setEditLoading(true);
    try {
      await candidatService.updateProfil(editForm);
      const updated = await candidatService.getProfil();
      setCandidат(updated);
      setEditOpen(false);
      showMessage('Profil mis à jour avec succès.', 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Upload photo de profil ─────────────────────────────────
  const handlePhotoProfil = async (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;
    setPhotoLoading(true);
    try {
      // On réutilise l'upload de pièce avec un type spécial "photoProfil"
      // Si le backend ne le supporte pas encore, on stocke localement
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoUrl(ev.target.result);
        localStorage.setItem('photoProfil_' + candidat?.id, ev.target.result);
      };
      reader.readAsDataURL(fichier);
    } catch (err) {
      showMessage('Erreur upload photo.', 'error');
    } finally {
      setPhotoLoading(false);
    }
  };

  // Charger la photo depuis localStorage au montage
  useEffect(() => {
    if (candidat?.id) {
      const saved = localStorage.getItem('photoProfil_' + candidat.id);
      if (saved) setPhotoUrl(saved);
    }
  }, [candidat?.id]);

  // ── Inscription ───────────────────────────────────────────
  const handleInscription = async (concoursId) => {
    // Vérifier d'abord si le profil est complet
    if (profilIncomplet(candidat)) {
      showMessage('Veuillez compléter votre profil avant de vous inscrire.', 'warning');
      setEditOpen(true);
      return;
    }

    // Vérifier si le dossier est complet (toutes les pièces déposées)
    const pieces = Object.keys(PIECES_LABELS);
    const piecesManquantes = pieces.filter(piece => !candidat?.dossier?.[piece]);
    
    if (piecesManquantes.length > 0) {
      const piecesManquantesLabels = piecesManquantes.map(p => PIECES_LABELS[p]).join(', ');
      showMessage(
        `Votre dossier est incomplet. Veuillez déposer les pièces suivantes : ${piecesManquantesLabels}`,
        'warning'
      );
      // Scroll vers la section des pièces justificatives
      setTimeout(() => {
        document.querySelector('#pieces-justificatives')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    
    try {
      const response = await inscriptionService.creer(concoursId);
      showMessage('Inscription réussie ! Une fiche de pré-inscription vous a été envoyée par email.', 'success');
      const updated = await candidatService.getProfil();
      setCandidат(updated);
    } catch (err) {
      // Si le dossier est incomplet (vérification backend)
      if (err.message.includes('Dossier incomplet') || err.message.includes('pièces manquantes')) {
        showMessage(
          'Votre dossier est incomplet. Veuillez déposer toutes les pièces justificatives requises avant de vous inscrire.',
          'warning'
        );
        // Scroll vers la section des pièces justificatives
        setTimeout(() => {
          document.querySelector('#pieces-justificatives')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        showMessage(err.message, 'error');
      }
    }
  };

  // ── Upload pièces ─────────────────────────────────────────
  const handleUpload = async (typePiece, e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;
    setUploadStatus(prev => ({ ...prev, [typePiece]: 'loading' }));
    try {
      await dossierService.uploadPiece(typePiece, fichier);
      setUploadStatus(prev => ({ ...prev, [typePiece]: 'ok' }));
      const updated = await candidatService.getProfil();
      setCandidат(updated);
    } catch { setUploadStatus(prev => ({ ...prev, [typePiece]: 'error' })); }
  };

  // ── Téléchargements PDF ───────────────────────────────────
  const handleConvocation = async (inscriptionId) => {
    setTelechargement(prev => ({ ...prev, [`conv_${inscriptionId}`]: true }));
    try { await convocationService.telecharger(inscriptionId); }
    catch (err) { showMessage('Erreur : ' + err.message, 'error'); }
    finally { setTelechargement(prev => ({ ...prev, [`conv_${inscriptionId}`]: false })); }
  };

  const handlePreinscription = async (inscriptionId) => {
    setTelechargement(prev => ({ ...prev, [`preinsc_${inscriptionId}`]: true }));
    try { await convocationService.telechargerPreinscription(inscriptionId); }
    catch (err) { showMessage('Erreur : ' + err.message, 'error'); }
    finally { setTelechargement(prev => ({ ...prev, [`preinsc_${inscriptionId}`]: false })); }
  };

  if (loading) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin mx-auto mb-3' />
        <p className='text-gray-500 text-sm'>Chargement...</p>
      </div>
    </div>
  );

  const nom = `${candidat?.prenom || ''} ${candidat?.nom || ''}`.trim();
  const incomplet = profilIncomplet(candidat);
  
  // Vérifier si le dossier est complet (toutes les pièces déposées)
  const pieces = Object.keys(PIECES_LABELS);
  const dossierIncomplet = pieces.some(piece => !candidat?.dossier?.[piece]);
  const nbPiecesDeposees = pieces.filter(piece => candidat?.dossier?.[piece]).length;

  return (
    <CandidatLayout candidat={candidat} photoUrl={photoUrl}>
      <div className='max-w-3xl mx-auto space-y-4 sm:space-y-6'>

        {/* Alerte profil incomplet */}
        {incomplet && (
          <div className='bg-orange-50 border-l-4 border-orange-500 px-5 py-4 rounded-xl flex items-start justify-between gap-4'>
            <div>
              <p className='font-semibold text-orange-800 text-sm'>Profil incomplet</p>
              <p className='text-orange-700 text-xs mt-0.5'>
                Veuillez renseigner votre téléphone, date et lieu de naissance pour pouvoir vous inscrire aux concours.
              </p>
            </div>
            <button
              onClick={() => setEditOpen(true)}
              className='flex-shrink-0 text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition font-medium'
            >
              Compléter
            </button>
          </div>
        )}

        {/* Alerte dossier incomplet */}
        {!incomplet && dossierIncomplet && (
          <div className='bg-red-50 border-l-4 border-red-500 px-5 py-4 rounded-xl flex items-start justify-between gap-4'>
            <div>
              <p className='font-semibold text-red-800 text-sm'>Dossier incomplet ({nbPiecesDeposees}/{pieces.length} pièces)</p>
              <p className='text-red-700 text-xs mt-0.5'>
                Vous devez déposer toutes les pièces justificatives avant de pouvoir vous inscrire à un concours.
              </p>
            </div>
            <button
              onClick={() => document.querySelector('#pieces-justificatives')?.scrollIntoView({ behavior: 'smooth' })}
              className='flex-shrink-0 text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition font-medium'
            >
              Voir les pièces
            </button>
          </div>
        )}

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

        {/* CARTE PROFIL */}
        <div id='profil' className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className='h-16 bg-gradient-to-r from-blue-900 to-blue-800' />
          <div className='px-6 pb-6'>
            <div className='flex items-end justify-between gap-2 -mt-8 mb-4 flex-wrap'>
              {/* Avatar cliquable pour changer la photo */}
              <div className='flex items-end gap-4'>
                <label className='cursor-pointer group relative flex-shrink-0'>
                  <div className='w-16 h-16 rounded-2xl overflow-hidden bg-orange-500 flex items-center justify-center text-2xl font-black text-white shadow-lg border-4 border-white'>
                    {photoUrl
                      ? <img src={photoUrl} alt='profil' className='w-full h-full object-cover' />
                      : initiales(candidat?.prenom, candidat?.nom)
                    }
                  </div>
                  {/* Overlay au hover */}
                  <div className='absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center'>
                    <span className='text-white text-xs font-medium'>Photo</span>
                  </div>
                  <input type='file' accept='image/*' onChange={handlePhotoProfil} className='hidden' />
                </label>
                <div className='pb-1'>
                  <h2 className='text-lg font-bold text-gray-900'>{nom}</h2>
                  <span className='inline-block bg-blue-900 text-orange-300 text-xs font-mono px-2 py-0.5 rounded-md'>
                    {candidat?.matricule}
                  </span>
                </div>
              </div>
              {/* Bouton modifier */}
              <button
                onClick={() => setEditOpen(true)}
                className='pb-1 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition flex-shrink-0'
              >
                Modifier le profil
              </button>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {[
                { label: 'Email',      value: candidat?.email },
                { label: 'Téléphone', value: candidat?.telephone || <span className='text-orange-500 text-xs'>Non renseigné</span> },
                { label: 'Naissance', value: candidat?.dateNaiss ? new Date(candidat.dateNaiss).toLocaleDateString('fr-FR') : <span className='text-orange-500 text-xs'>Non renseigné</span> },
                { label: 'Lieu',      value: candidat?.lieuNaiss || <span className='text-orange-500 text-xs'>Non renseigné</span> },
              ].map(({ label, value }) => (
                <div key={label} className='bg-gray-50 rounded-xl px-4 py-3'>
                  <p className='text-xs text-gray-400 mb-0.5'>{label}</p>
                  <p className='text-sm font-medium text-gray-800'>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COMPLÉTUDE DU DOSSIER */}
        <DossierCompletion
          candidatId={candidat?.id}
          dossier={candidat?.dossier}
          onSoumettre={async () => {
            showMessage('Dossier soumis. La commission va étudier votre candidature.', 'success');
            const updated = await candidatService.getProfil();
            setCandidат(updated);
          }}
        />

        {/* MES INSCRIPTIONS */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-base font-bold text-gray-800'>Mes inscriptions</h2>
            <span className='text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium'>
              {candidat?.inscriptions?.length || 0}
            </span>
          </div>

          {!candidat?.inscriptions?.length ? (
            <p className='text-center text-gray-400 text-sm py-8'>Aucune inscription pour le moment.</p>
          ) : (
            <div className='space-y-2'>
              {candidat.inscriptions.map((ins) => {
                const cfg = STATUT_CONFIG[ins.statut] || STATUT_CONFIG.EN_ATTENTE;
                return (
                  <div key={ins.id} className='flex overflow-hidden rounded-xl border border-gray-100 hover:shadow-sm transition'>
                    <div className={`w-1.5 flex-shrink-0 ${cfg.bar}`} />
                    <div className='flex-1 flex items-center justify-between gap-3 px-4 py-3 flex-wrap'>
                      <div>
                        <p className='font-semibold text-gray-800 text-sm'>{ins.concours?.libelle}</p>
                        <div className='flex items-center gap-2 mt-1'>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          <span className='text-xs text-gray-400'>
                            {new Date(ins.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    <div className='flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto'>
                        {/* Fiche de pré-inscription — toujours disponible */}
                        <button
                          onClick={() => handlePreinscription(ins.id)}
                          disabled={telechargement[`preinsc_${ins.id}`]}
                          className='text-xs border border-blue-200 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition disabled:opacity-50 text-center'
                        >
                          {telechargement[`preinsc_${ins.id}`] ? 'Génération...' : 'Fiche pré-inscription'}
                        </button>
                        {/* Convocation — uniquement si validé */}
                        {ins.statut === 'VALIDE' && (
                          <button
                            onClick={() => handleConvocation(ins.id)}
                            disabled={telechargement[`conv_${ins.id}`]}
                            className='text-xs border border-orange-400 text-orange-600 px-3 py-2 rounded-lg hover:bg-orange-500 hover:text-white transition disabled:opacity-50 text-center'
                          >
                            {telechargement[`conv_${ins.id}`] ? 'Génération...' : 'Convocation'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CONCOURS DISPONIBLES */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-base font-bold text-gray-800'>Concours disponibles</h2>
            <span className='text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium'>
              {concours.length}
            </span>
          </div>

          {!concours.length ? (
            <p className='text-center text-gray-400 text-sm py-6'>Aucun concours disponible.</p>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {concours.map((c) => {
                const dejaInscrit = candidat?.inscriptions?.some(i => i.concoursId === c.id);
                const peutInscrire = !incomplet && !dossierIncomplet;
                return (
                  <div key={c.id} className='border border-gray-100 rounded-xl p-4 hover:shadow-sm transition flex flex-col gap-3'>
                    <div>
                      <p className='font-semibold text-gray-800 text-sm'>{c.libelle}</p>
                      <p className='text-xs text-gray-400 mt-1'>
                        {new Date(c.dateDebut).toLocaleDateString('fr-FR')} — {new Date(c.dateFin).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {dejaInscrit ? (
                      <span className='text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-center font-medium'>
                        Inscrit
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInscription(c.id)}
                        disabled={!peutInscrire}
                        className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${
                          peutInscrire
                            ? 'bg-orange-500 text-white hover:bg-orange-600'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title={!peutInscrire ? 'Complétez votre profil et déposez toutes les pièces justificatives' : ''}
                      >
                        {peutInscrire ? "S'inscrire" : 'Dossier incomplet'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PIÈCES JUSTIFICATIVES */}
        <div id='pieces-justificatives' className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
          <h2 className='text-base font-bold text-gray-800 mb-4'>Pièces justificatives</h2>
          <div className='space-y-2'>
            {Object.entries(PIECES_LABELS).map(([key, label]) => {
              const estDepose = candidat?.dossier?.[key];
              const status = uploadStatus[key];
              const isLoading = status === 'loading';
              const isOk = estDepose || status === 'ok';
              return (
                <div key={key} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition ${
                  isOk ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className='flex items-center gap-3'>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOk ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className='text-sm font-medium text-gray-700'>{label}</span>
                  </div>
                  <label className='cursor-pointer'>
                    <span className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                      isLoading ? 'bg-gray-200 text-gray-500' :
                      isOk      ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                  'bg-blue-900 text-white hover:bg-blue-800'
                    }`}>
                      {isLoading ? 'Envoi...' : isOk ? 'Modifier' : 'Déposer'}
                    </span>
                    <input type='file' accept='.pdf,.jpg,.jpeg,.png' onChange={(e) => handleUpload(key, e)} className='hidden' />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODALE ÉDITION PROFIL */}
      {editOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md'>
            <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
              <h3 className='font-bold text-gray-900'>Modifier le profil</h3>
              <button onClick={() => setEditOpen(false)} className='text-gray-400 hover:text-gray-600 text-xl leading-none'>&times;</button>
            </div>
            <div className='px-6 py-5 space-y-4'>
              {[
                { key: 'prenom',    label: 'Prénom',           type: 'text' },
                { key: 'nom',       label: 'Nom',              type: 'text' },
                { key: 'telephone', label: 'Téléphone',        type: 'tel',  required: true },
                { key: 'dateNaiss', label: 'Date de naissance',type: 'date', required: true },
                { key: 'lieuNaiss', label: 'Lieu de naissance',type: 'text', required: true },
              ].map(({ key, label, type, required }) => (
                <div key={key}>
                  <label className='block text-xs text-gray-500 mb-1'>
                    {label} {required && <span className='text-orange-500'>*</span>}
                  </label>
                  <input
                    type={type}
                    value={editForm[key] || ''}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    className='w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500'
                  />
                </div>
              ))}
            </div>
            <div className='px-6 py-4 border-t border-gray-100 flex gap-3 justify-end'>
              <button onClick={() => setEditOpen(false)} className='text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition'>
                Annuler
              </button>
              <button onClick={handleSaveProfil} disabled={editLoading} className='text-sm bg-blue-900 text-white px-5 py-2 rounded-xl hover:bg-blue-800 transition disabled:opacity-50 font-medium'>
                {editLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </CandidatLayout>
  );
}
