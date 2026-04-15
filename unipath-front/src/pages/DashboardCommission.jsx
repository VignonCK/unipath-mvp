// src/pages/DashboardCommission.jsx
// Tableau de bord de la commission de validation
// Permet de consulter, valider ou rejeter les dossiers des candidats
// Contient un système de filtres par statut : EN_ATTENTE, VALIDE, REJETE

import { useState, useEffect } from 'react';
import { commissionService } from '../services/api';

export default function DashboardCommission() {
  // Liste des dossiers récupérés depuis le backend
  const [dossiers, setDossiers] = useState([]);

  // Filtre actif : EN_ATTENTE par défaut
  const [filtre, setFiltre] = useState('EN_ATTENTE');

  // true pendant le chargement des données
  const [loading, setLoading] = useState(true);

  // Message de confirmation ou d'erreur
  const [message, setMessage] = useState('');

  // Fonction pour charger les dossiers selon le filtre actif
  const chargerDossiers = async () => {
    setLoading(true);
    try {
      // Appel API avec le filtre actif
      // Ex: GET /api/commission/dossiers?statut=EN_ATTENTE
      const data = await commissionService.getDossiers(filtre);
      setDossiers(data.inscriptions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Recharger les dossiers chaque fois que le filtre change
  useEffect(() => {
    chargerDossiers();
  }, [filtre]); // [filtre] = se déclenche quand filtre change

  // Valider ou rejeter un dossier
  const handleDecision = async (inscriptionId, statut) => {
    try {
      // Appel API → PATCH /api/commission/dossiers/:id
      await commissionService.updateStatut(inscriptionId, statut);
      setMessage(`Dossier ${statut === 'VALIDE' ? 'validé' : 'rejeté'} avec succès`);
      // Recharger la liste pour refléter le changement
      chargerDossiers();
    } catch (err) {
      setMessage(err.message);
    }
  };

  // Couleurs associées à chaque statut
  const couleurStatut = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
    VALIDE: 'bg-green-100 text-green-700',
    REJETE: 'bg-red-100 text-red-700',
  };

  return (
    <div className='min-h-screen bg-gray-50'>

      {/* ── Header ── */}
      <header className='bg-blue-900 text-white px-6 py-4'>
        <h1 className='text-xl font-bold'>UniPath — Espace Commission</h1>
      </header>

      <main className='max-w-5xl mx-auto p-6'>

        {/* Message de confirmation ou d'erreur */}
        {message && (
          <div className='bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4'>
            {message}
            {/* Bouton pour fermer le message */}
            <button onClick={() => setMessage('')} className='float-right'>✕</button>
          </div>
        )}

        {/* ── Boutons de filtre ── */}
        <div className='flex gap-2 mb-6'>
          {['EN_ATTENTE', 'VALIDE', 'REJETE'].map(s => (
            <button
              key={s}
              onClick={() => setFiltre(s)}
              // Bouton bleu si filtre actif, blanc sinon
              className={`px-4 py-2 rounded text-sm font-medium ${
                filtre === s
                  ? 'bg-blue-700 text-white'
                  : 'bg-white border text-gray-700'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* ── Liste des dossiers ── */}
        {loading ? (
          <p className='text-center text-gray-500'>Chargement...</p>
        ) : (
          <div className='space-y-4'>

            {/* Message si aucun dossier dans cette catégorie */}
            {dossiers.length === 0 ? (
              <p className='text-gray-500 text-center py-10'>
                Aucun dossier dans cette catégorie
              </p>
            ) : (
              dossiers.map((inscription) => (
                <div key={inscription.id} className='bg-white rounded-xl shadow p-6'>

                  {/* ── Infos candidat et statut ── */}
                  <div className='flex justify-between items-start mb-4'>
                    <div>
                      <h3 className='font-bold text-lg'>
                        {inscription.candidat.prenom} {inscription.candidat.nom}
                      </h3>
                      {/* Matricule en bleu */}
                      <p className='text-blue-700 text-sm font-mono'>
                        {inscription.candidat.matricule}
                      </p>
                      {/* Nom du concours */}
                      <p className='text-gray-500 text-sm'>
                        {inscription.concours.libelle}
                      </p>
                    </div>
                    {/* Badge de statut coloré */}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${couleurStatut[inscription.statut]}`}>
                      {inscription.statut.replace('_', ' ')}
                    </span>
                  </div>

                  {/* ── Pièces justificatives ── */}
                  {/* Affiche ✓ en vert si déposée, ✗ en gris sinon */}
                  <div className='grid grid-cols-5 gap-2 mb-4'>
                    {['acteNaissance', 'carteIdentite', 'photo', 'releve', 'quittance'].map(p => (
                      <div
                        key={p}
                        className={`text-xs text-center p-2 rounded ${
                          inscription.candidat.dossier?.[p]
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-50 text-gray-400'
                        }`}
                      >
                        {inscription.candidat.dossier?.[p] ? '✓' : '✗'} {p}
                      </div>
                    ))}
                  </div>

                  {/* ── Boutons Valider/Rejeter ── */}
                  {/* Visibles uniquement si le dossier est EN_ATTENTE */}
                  {inscription.statut === 'EN_ATTENTE' && (
                    <div className='flex gap-3'>
                      <button
                        onClick={() => handleDecision(inscription.id, 'VALIDE')}
                        className='flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium'
                      >
                        ✓ Valider le dossier
                      </button>
                      <button
                        onClick={() => handleDecision(inscription.id, 'REJETE')}
                        className='flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 font-medium'
                      >
                        ✗ Rejeter le dossier
                      </button>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        )}

      </main>
    </div>
  );
}