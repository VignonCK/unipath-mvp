// src/pages/DashboardCandidat.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatService, concoursService, inscriptionService, dossierService, convocationService } from '../services/api';

export default function DashboardCandidat() {
  const navigate = useNavigate();
  const [candidat, setCandidат] = useState(null);
  const [concours, setConcours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState({});
  const [message, setMessage] = useState('');
  const [telechargement, setTelechargement] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    Promise.all([
      candidatService.getProfil(),
      concoursService.getAll(),
    ])
      .then(([profilData, concoursData]) => {
        setCandidат(profilData);
        setConcours(concoursData);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, []);

  const handleInscription = async (concoursId) => {
    try {
      await inscriptionService.creer(concoursId);
      setMessage('Inscription réussie !');
      const updated = await candidatService.getProfil();
      setCandidат(updated);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleUpload = async (typePiece, e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;

    setUploadStatus(prev => ({ ...prev, [typePiece]: 'chargement...' }));
    try {
      await dossierService.uploadPiece(typePiece, fichier);
      setUploadStatus(prev => ({ ...prev, [typePiece]: 'OK' }));
    } catch (err) {
      setUploadStatus(prev => ({ ...prev, [typePiece]: 'Erreur' }));
    }
  };

  const handleTelechargerConvocation = async (inscriptionId) => {
    setTelechargement(prev => ({ ...prev, [inscriptionId]: true }));
    try {
      await convocationService.telecharger(inscriptionId);
    } catch (err) {
      setMessage('Erreur téléchargement : ' + err.message);
    } finally {
      setTelechargement(prev => ({ ...prev, [inscriptionId]: false }));
    }
  };

  const handleDeconnexion = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return (
    <div className='min-h-screen flex items-center justify-center'>
      Chargement...
    </div>
  );

  const pieces = [
    { key: 'acteNaissance', label: 'Acte de naissance' },
    { key: 'carteIdentite', label: "Carte d'identité" },
    { key: 'photo', label: "Photo d'identité" },
    { key: 'releve', label: 'Relevé de notes Bac' },
    { key: 'quittance', label: "Quittance d'inscription" },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>

      {/* Header */}
      <header className='bg-blue-800 text-white px-6 py-4 flex justify-between items-center'>
        <h1 className='text-xl font-bold'>UniPath — Espace Candidat</h1>
        <div className='flex items-center gap-4'>
          <span className='text-blue-200 text-sm'>{candidat?.matricule}</span>
          <button
            onClick={handleDeconnexion}
            className='text-sm bg-blue-700 px-3 py-1 rounded hover:bg-blue-600'
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className='max-w-4xl mx-auto p-6 space-y-6'>

        {message && (
          <div className='bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded'>
            {message}
            <button onClick={() => setMessage('')} className='float-right'>✕</button>
          </div>
        )}

        {/* Section 1 : Profil */}
        <div className='bg-white rounded-xl shadow p-6'>
          <h2 className='text-lg font-bold text-gray-800 mb-4'>Mon profil</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <span className='text-gray-500 text-sm'>Nom complet</span>
              <p className='font-medium'>{candidat?.prenom} {candidat?.nom}</p>
            </div>
            <div>
              <span className='text-gray-500 text-sm'>Matricule</span>
              <p className='font-medium text-blue-700'>{candidat?.matricule}</p>
            </div>
            <div>
              <span className='text-gray-500 text-sm'>Email</span>
              <p className='font-medium'>{candidat?.email}</p>
            </div>
            <div>
              <span className='text-gray-500 text-sm'>Téléphone</span>
              <p className='font-medium'>{candidat?.telephone || 'Non renseigné'}</p>
            </div>
          </div>
        </div>

        {/* Section 2 : Mes inscriptions */}
        <div className='bg-white rounded-xl shadow p-6'>
          <h2 className='text-lg font-bold text-gray-800 mb-4'>Mes inscriptions</h2>
          <div className='space-y-3'>
            {candidat?.inscriptions?.length === 0 && (
              <p className='text-gray-500 text-sm'>Aucune inscription pour le moment.</p>
            )}
            {candidat?.inscriptions?.map((inscription) => (
              <div key={inscription.id} className='p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                <div>
                  <p className='font-medium'>{inscription.concours?.libelle}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    inscription.statut === 'VALIDE' ? 'bg-green-100 text-green-700' :
                    inscription.statut === 'REJETE' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inscription.statut.replace('_', ' ')}
                  </span>
                </div>
                {inscription.statut === 'VALIDE' && (
                  <button
                    onClick={() => handleTelechargerConvocation(inscription.id)}
                    disabled={telechargement[inscription.id]}
                    className='text-sm bg-blue-700 text-white px-3 py-2 rounded hover:bg-blue-800 disabled:opacity-50'
                  >
                    {telechargement[inscription.id] ? 'Génération...' : '📄 Télécharger convocation'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3 : Concours disponibles */}
        <div className='bg-white rounded-xl shadow p-6'>
          <h2 className='text-lg font-bold text-gray-800 mb-4'>
            Concours disponibles
          </h2>
          <div className='space-y-3'>
            {concours.map((c) => {
              const dejaInscrit = candidat?.inscriptions?.some(
                i => i.concoursId === c.id
              );
              return (
                <div key={c.id} className='flex items-center justify-between p-4 border rounded-lg'>
                  <div>
                    <p className='font-medium'>{c.libelle}</p>
                    <p className='text-sm text-gray-500'>
                      Du {new Date(c.dateDebut).toLocaleDateString('fr-FR')} au{' '}
                      {new Date(c.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {dejaInscrit ? (
                    <span className='bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-medium'>
                      Inscrit ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => handleInscription(c.id)}
                      className='bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 text-sm'
                    >
                      S'inscrire
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4 : Pièces justificatives */}
        <div className='bg-white rounded-xl shadow p-6'>
          <h2 className='text-lg font-bold text-gray-800 mb-4'>
            Mes pièces justificatives
          </h2>
          <div className='space-y-3'>
            {pieces.map((piece) => {
              const estDepose = candidat?.dossier?.[piece.key];
              const status = uploadStatus[piece.key];
              return (
                <div key={piece.key} className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-2'>
                  <div className='flex items-center gap-3'>
                    <span className={`w-3 h-3 rounded-full ${estDepose || status === 'OK' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className='text-sm font-medium'>{piece.label}</span>
                  </div>
                  <label className='cursor-pointer'>
                    <span className='text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200'>
                      {status === 'chargement...' ? 'Envoi...' :
                        estDepose || status === 'OK' ? 'Modifier' : 'Déposer'}
                    </span>
                    <input
                      type='file'
                      accept='.pdf,.jpg,.jpeg,.png'
                      onChange={(e) => handleUpload(piece.key, e)}
                      className='hidden'
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}