// src/pages/DashboardCandidat.jsx
// Tableau de bord du candidat connecté
// Contient 3 sections :
// 1. Profil du candidat
// 2. Concours disponibles avec bouton d'inscription
// 3. Upload des pièces justificatives

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatService, concoursService, inscriptionService, dossierService } from '../services/api';

export default function DashboardCandidat() {
  const navigate = useNavigate();

  // Données du candidat connecté (profil + inscriptions + dossier)
  const [candidat, setCandidат] = useState(null);

  // Liste de tous les concours disponibles
  const [concours, setConcours] = useState([]);

  // true pendant le chargement initial des données
  const [loading, setLoading] = useState(true);

  // Statut d'upload pour chaque pièce
  // Ex: { acteNaissance: 'OK', photo: 'chargement...' }
  const [uploadStatus, setUploadStatus] = useState({});

  // Message de confirmation ou d'erreur
  const [message, setMessage] = useState('');

  // useEffect s'exécute une seule fois au chargement de la page
  useEffect(() => {
    // Vérifier que l'utilisateur est connecté
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login'); // Rediriger si pas de token
      return;
    }

    // Charger le profil et les concours en parallèle
    // Promise.all attend que les DEUX requêtes soient terminées
    Promise.all([
      candidatService.getProfil(),
      concoursService.getAll(),
    ])
      .then(([profilData, concoursData]) => {
        setCandidат(profilData);
        setConcours(concoursData);
      })
      .catch(() => navigate('/login')) // Si erreur, rediriger vers login
      .finally(() => setLoading(false)); // Arrêter le chargement
  }, []); // [] = s'exécute une seule fois

  // Inscrire le candidat à un concours
  const handleInscription = async (concoursId) => {
    try {
      await inscriptionService.creer(concoursId);
      setMessage('Inscription réussie !');
      // Recharger le profil pour voir la nouvelle inscription
      const updated = await candidatService.getProfil();
      setCandidат(updated);
    } catch (err) {
      // Afficher l'erreur (ex: conflit de dates du trigger de Vignon)
      setMessage(err.message);
    }
  };

  // Uploader une pièce justificative
  const handleUpload = async (typePiece, e) => {
    const fichier = e.target.files[0]; // Récupérer le fichier sélectionné
    if (!fichier) return;

    // Afficher "chargement..." pendant l'upload
    setUploadStatus(prev => ({ ...prev, [typePiece]: 'chargement...' }));
    try {
      await dossierService.uploadPiece(typePiece, fichier);
      // Afficher "OK" une fois uploadé
      setUploadStatus(prev => ({ ...prev, [typePiece]: 'OK' }));
    } catch (err) {
      setUploadStatus(prev => ({ ...prev, [typePiece]: 'Erreur' }));
    }
  };

  // Déconnecter l'utilisateur
  const handleDeconnexion = () => {
    localStorage.removeItem('token'); // Supprimer le token
    navigate('/login');
  };

  // Afficher un écran de chargement pendant la récupération des données
  if (loading) return (
    <div className='min-h-screen flex items-center justify-center'>
      Chargement...
    </div>
  );

  // Liste des pièces justificatives à uploader
  const pieces = [
    { key: 'acteNaissance', label: 'Acte de naissance' },
    { key: 'carteIdentite', label: "Carte d'identité" },
    { key: 'photo', label: "Photo d'identité" },
    { key: 'releve', label: 'Relevé de notes Bac' },
    { key: 'quittance', label: "Quittance d'inscription" },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>

      {/* ── Header ── */}
      <header className='bg-blue-800 text-white px-6 py-4 flex justify-between items-center'>
        <h1 className='text-xl font-bold'>UniPath — Espace Candidat</h1>
        <div className='flex items-center gap-4'>
          {/* Afficher le matricule du candidat */}
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

        {/* Message de confirmation ou d'erreur */}
        {message && (
          <div className='bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded'>
            {message}
            {/* Bouton pour fermer le message */}
            <button onClick={() => setMessage('')} className='float-right'>✕</button>
          </div>
        )}

        {/* ── Section 1 : Profil ── */}
        <div className='bg-white rounded-xl shadow p-6'>
          <h2 className='text-lg font-bold text-gray-800 mb-4'>Mon profil</h2>
          <div className='grid grid-cols-2 gap-4'>
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

        {/* ── Section 2 : Concours disponibles ── */}
        <div className='bg-white rounded-xl shadow p-6'>
          <h2 className='text-lg font-bold text-gray-800 mb-4'>
            Concours disponibles
          </h2>
          <div className='space-y-3'>
            {concours.map((c) => {
              // Vérifier si le candidat est déjà inscrit à ce concours
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
                  {/* Afficher "Inscrit" ou le bouton S'inscrire */}
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

        {/* ── Section 3 : Pièces justificatives ── */}
        <div className='bg-white rounded-xl shadow p-6'>
          <h2 className='text-lg font-bold text-gray-800 mb-4'>
            Mes pièces justificatives
          </h2>
          <div className='space-y-3'>
            {pieces.map((piece) => {
              // Vérifier si cette pièce a déjà été uploadée
              const estDepose = candidat?.dossier?.[piece.key];
              const status = uploadStatus[piece.key];
              return (
                <div key={piece.key} className='flex items-center justify-between p-3 border rounded-lg'>
                  <div className='flex items-center gap-3'>
                    {/* Point vert si déposé, gris sinon */}
                    <span className={`w-3 h-3 rounded-full ${estDepose || status === 'OK' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className='text-sm font-medium'>{piece.label}</span>
                  </div>
                  {/* Bouton d'upload caché derrière un label */}
                  <label className='cursor-pointer'>
                    <span className='text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200'>
                      {status === 'chargement...' ? 'Envoi...' :
                        estDepose || status === 'OK' ? 'Modifier' : 'Déposer'}
                    </span>
                    {/* Input file caché — s'ouvre quand on clique sur le label */}
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