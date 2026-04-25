// src/pages/DashboardCommission.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { commissionService, authService } from '../services/api';
import HistoriqueActions from '../components/HistoriqueActions';

export default function DashboardCommission() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState([]);
  const [filtre, setFiltre] = useState('EN_ATTENTE');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [recherche, setRecherche] = useState('');
  const [historiqueOuvert, setHistoriqueOuvert] = useState(null); // dossierId ouvert

  const chargerDossiers = async () => {
    setLoading(true);
    try {
      const data = await commissionService.getDossiers(filtre);
      setDossiers(data.inscriptions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerDossiers();
  }, [filtre]);

  const handleDecision = async (inscriptionId, statut) => {
    try {
      await commissionService.updateStatut(inscriptionId, statut);
      setMessage(`Dossier ${statut === 'VALIDE' ? 'validé' : 'rejeté'} avec succès`);
      chargerDossiers();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const couleurStatut = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
    VALIDE: 'bg-green-100 text-green-700',
    REJETE: 'bg-red-100 text-red-700',
  };

  // Filtrer par recherche
  const dossiersFiltres = dossiers.filter((inscription) => {
    const nom = `${inscription.candidat.prenom} ${inscription.candidat.nom}`.toLowerCase();
    const matricule = inscription.candidat.matricule.toLowerCase();
    const concours = inscription.concours.libelle.toLowerCase();
    const query = recherche.toLowerCase();
    return nom.includes(query) || matricule.includes(query) || concours.includes(query);
  });

  return (
    <div className='min-h-screen bg-gray-50'>

      {/* Header */}
      <header className='bg-blue-900 text-white px-6 py-4 flex justify-between items-center'>
        <h1 className='text-xl font-bold'>UniPath — Espace Commission</h1>
        <button
          onClick={() => {
            authService.logout();
            navigate('/login');
          }}
          className='bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition'
        >
          Déconnexion
        </button>
      </header>

      <main className='max-w-5xl mx-auto p-6'>

        {message && (
          <div className='bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4'>
            {message}
            <button onClick={() => setMessage('')} className='float-right'>✕</button>
          </div>
        )}

        {/* Filtres par statut */}
        <div className='flex gap-2 mb-4'>
          {['EN_ATTENTE', 'VALIDE', 'REJETE'].map(s => (
            <button
              key={s}
              onClick={() => setFiltre(s)}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filtre === s
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border text-gray-700'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Barre de recherche */}
        <div className='mb-6'>
          <input
            type='text'
            placeholder='Rechercher par nom, matricule ou concours...'
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className='w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500'
          />
          {recherche && (
            <p className='text-xs text-gray-500 mt-1'>
              {dossiersFiltres.length} résultat(s) pour "{recherche}"
            </p>
          )}
        </div>

        {/* Liste des dossiers */}
        {loading ? (
          <p className='text-center text-gray-500'>Chargement...</p>
        ) : (
          <div className='space-y-4'>
            {dossiersFiltres.length === 0 ? (
              <p className='text-gray-500 text-center py-10'>
                {recherche ? 'Aucun résultat pour cette recherche' : 'Aucun dossier dans cette catégorie'}
              </p>
            ) : (
              dossiersFiltres.map((inscription) => (
                <div key={inscription.id} className='bg-white rounded-xl shadow p-6'>

                  <div className='flex justify-between items-start mb-4'>
                    <div>
                      <h3 className='font-bold text-lg'>
                        {inscription.candidat.prenom} {inscription.candidat.nom}
                      </h3>
                      <p className='text-orange-600 text-sm font-mono'>
                        {inscription.candidat.matricule}
                      </p>
                      <p className='text-gray-500 text-sm'>
                        {inscription.concours.libelle}
                      </p>
                      <p className='text-gray-400 text-xs mt-1'>
                        Inscrit le {new Date(inscription.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${couleurStatut[inscription.statut]}`}>
                      {inscription.statut.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Pièces justificatives */}
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4'>
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

                  {/* Boutons Valider/Rejeter */}
                  {inscription.statut === 'EN_ATTENTE' && (
                    <div className='flex flex-col sm:flex-row gap-3'>
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

                  {/* Bouton historique */}
                  {inscription.candidat.dossier?.id && (
                    <div className='mt-3'>
                      <button
                        onClick={() => setHistoriqueOuvert(
                          historiqueOuvert === inscription.candidat.dossier.id
                            ? null
                            : inscription.candidat.dossier.id
                        )}
                        className='text-sm text-blue-900 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1'
                      >
                        📋 {historiqueOuvert === inscription.candidat.dossier.id ? 'Masquer' : 'Voir'} l'historique
                      </button>

                      {historiqueOuvert === inscription.candidat.dossier.id && (
                        <div className='mt-3'>
                          <HistoriqueActions
                            dossierId={inscription.candidat.dossier.id}
                            nomCandidat={`${inscription.candidat.prenom} ${inscription.candidat.nom}`}
                          />
                        </div>
                      )}
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
