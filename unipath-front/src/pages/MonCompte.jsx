// src/pages/MonCompte.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatService, dossierService } from '../services/api';
import CandidatLayout from '../components/CandidatLayout';
import DossierCompletion from '../components/DossierCompletion';

function initiales(prenom, nom) {
  return `${(prenom || '?')[0]}${(nom || '?')[0]}`.toUpperCase();
}

const PIECES_LABELS = {
  acteNaissance: 'Acte de naissance',
  carteIdentite: "Carte d'identité",
  photo:         "Photo d'identité",
  releve:        'Relevé de notes Bac',
};

// Formats acceptés par type de pièce
const PIECES_FORMATS = {
  photo: 'image/*',  // JPG, JPEG, PNG
  carteIdentite: '.pdf,.jpg,.jpeg,.png',  // PDF ou images
  acteNaissance: '.pdf',  // PDF uniquement
  releve: '.pdf',  // PDF uniquement
  quittance: '.pdf',  // PDF uniquement
};

export default function MonCompte() {
  const navigate = useNavigate();
  const [candidat, setCandidат]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [uploadStatus, setUploadStatus] = useState({});
  const [message, setMessage]     = useState({ text: '', type: 'info' });
  const [editOpen, setEditOpen]   = useState(false);
  const [editForm, setEditForm]   = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [photoUrl, setPhotoUrl]   = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    candidatService.getProfil()
      .then(p => {
        setCandidат(p);
        setEditForm({
          nom:       p.nom       || '',
          prenom:    p.prenom    || '',
          sexe:      p.sexe      || '',
          nationalite: p.nationalite || '',
          telephone: p.telephone || '',
          dateNaiss: p.dateNaiss ? p.dateNaiss.split('T')[0] : '',
          lieuNaiss: p.lieuNaiss || '',
        });
        const saved = localStorage.getItem('photoProfil_' + p.id);
        if (saved) setPhotoUrl(saved);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, []);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '' }), 5000);
  };

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

  const handlePhotoProfil = (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoUrl(ev.target.result);
      localStorage.setItem('photoProfil_' + candidat?.id, ev.target.result);
    };
    reader.readAsDataURL(fichier);
  };

  const handleUpload = async (typePiece, e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;
    setUploadStatus(prev => ({ ...prev, [typePiece]: 'loading' }));
    try {
      await dossierService.uploadPiece(typePiece, fichier);
      setUploadStatus(prev => ({ ...prev, [typePiece]: 'ok' }));
      const updated = await candidatService.getProfil();
      setCandidат(updated);
    } catch {
      setUploadStatus(prev => ({ ...prev, [typePiece]: 'error' }));
    }
  };

  if (loading) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin' />
    </div>
  );

  const nom = `${candidat?.prenom || ''} ${candidat?.nom || ''}`.trim();

  return (
    <CandidatLayout candidat={candidat} photoUrl={photoUrl}>
      <div className='max-w-3xl mx-auto space-y-6'>

        {/* Toast */}
        {message.text && (
          <div className={`px-4 py-3 rounded-lg text-sm flex items-center justify-between ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
            message.type === 'error'   ? 'bg-red-50 border border-red-200 text-red-700' :
                                         'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ text: '' })} className='ml-4 text-lg leading-none opacity-60 hover:opacity-100'>&times;</button>
          </div>
        )}

        {/* CARTE PROFIL */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className='h-16 bg-gradient-to-r from-blue-900 to-blue-800' />
          <div className='px-6 pb-6'>
            <div className='flex items-end justify-between gap-2 -mt-8 mb-4 flex-wrap'>
              <div className='flex items-end gap-4'>
                <label className='cursor-pointer group relative flex-shrink-0'>
                  <div className='w-16 h-16 rounded-2xl overflow-hidden bg-orange-500 flex items-center justify-center text-2xl font-black text-white shadow-lg border-4 border-white'>
                    {photoUrl
                      ? <img src={photoUrl} alt='profil' className='w-full h-full object-cover' />
                      : initiales(candidat?.prenom, candidat?.nom)
                    }
                  </div>
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
              <button
                onClick={() => setEditOpen(true)}
                className='pb-1 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition flex-shrink-0'
              >
                Modifier
              </button>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {[
                { label: 'Email',      value: candidat?.email },
                { label: 'Sexe',       value: candidat?.sexe === 'M' ? 'Masculin' : candidat?.sexe === 'F' ? 'Féminin' : <span className='text-orange-500 text-xs'>Non renseigné</span> },
                { label: 'Nationalité', value: candidat?.nationalite || <span className='text-orange-500 text-xs'>Non renseigné</span> },
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

        {/* COMPLÉTUDE */}
        <DossierCompletion
          candidatId={candidat?.id}
          dossier={candidat?.dossier}
          onSoumettre={async () => {
            showMessage('Dossier soumis. La commission va étudier votre candidature.', 'success');
            const updated = await candidatService.getProfil();
            setCandidат(updated);
          }}
        />

        {/* PIÈCES */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
          <h2 className='text-base font-bold text-gray-800 mb-4'>Pièces justificatives</h2>
          <div className='space-y-2'>
            {Object.entries(PIECES_LABELS).map(([key, label]) => {
              const estDepose = candidat?.dossier?.[key];
              const status    = uploadStatus[key];
              const isLoading = status === 'loading';
              const isOk      = estDepose || status === 'ok';
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
                    <input type='file' accept={PIECES_FORMATS[key]} onChange={(e) => handleUpload(key, e)} className='hidden' />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODALE ÉDITION */}
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
                { key: 'sexe',      label: 'Sexe',             type: 'select', options: [{ value: '', label: 'Sélectionner' }, { value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }] },
                { key: 'nationalite', label: 'Nationalité',    type: 'text' },
                { key: 'telephone', label: 'Téléphone',        type: 'tel',  required: true },
                { key: 'dateNaiss', label: 'Date de naissance',type: 'date', required: true },
                { key: 'lieuNaiss', label: 'Lieu de naissance',type: 'text', required: true },
              ].map(({ key, label, type, required, options }) => (
                <div key={key}>
                  <label className='block text-xs text-gray-500 mb-1'>
                    {label} {required && <span className='text-orange-500'>*</span>}
                  </label>
                  {type === 'select' ? (
                    <select
                      value={editForm[key] || ''}
                      onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      className='w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500'
                    >
                      {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={type}
                      value={editForm[key] || ''}
                      onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      className='w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500'
                    />
                  )}
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
