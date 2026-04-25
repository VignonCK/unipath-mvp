// src/components/DossierCompletion.jsx
import { useState, useEffect } from 'react';
import { authService } from '../services/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const PIECES_LABELS = {
  acteNaissance: 'Acte de naissance',
  carteIdentite: "Carte d'identité",
  photo: "Photo d'identité",
  releve: 'Relevé de notes Bac',
  quittance: "Quittance d'inscription",
};

async function fetchCompletion(candidatId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}/completion/${candidatId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erreur API');
  return res.json();
}

export default function DossierCompletion({ candidatId, dossier, onSoumettre }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [soumission, setSoumission] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [etaitIncomplet, setEtaitIncomplet] = useState(true);

  useEffect(() => {
    if (!candidatId) return;

    // Calcul local immédiat (sans attendre l'API)
    if (dossier !== undefined) {
      const pieces = ['acteNaissance', 'carteIdentite', 'photo', 'releve', 'quittance'];
      const deposees = pieces.filter(p => dossier?.[p]).length;
      const pourcentage = Math.round((deposees / pieces.length) * 100);
      const estComplet = pourcentage === 100;

      // Détecter la transition incomplet → complet
      if (estComplet && etaitIncomplet) {
        setNotifVisible(true);
        setTimeout(() => setNotifVisible(false), 5000);
      }
      setEtaitIncomplet(!estComplet);

      setData({
        pourcentage,
        piecesPresentes: deposees,
        piecesRequises: pieces.length,
        piecesManquantes: pieces.filter(p => !dossier?.[p]),
        estComplet,
      });
      setLoading(false);
    }
  }, [candidatId, dossier]);

  const handleSoumettre = async () => {
    setSoumission(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BASE_URL}/history/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dossierId: dossier?.id,
          typeAction: 'DOSSIER_SOUMIS',
          details: { message: 'Dossier soumis officiellement par le candidat' },
        }),
      });
      if (onSoumettre) onSoumettre();
    } catch (err) {
      console.error('Erreur soumission:', err);
    } finally {
      setSoumission(false);
    }
  };

  if (loading) {
    return (
      <div className='bg-white rounded-xl shadow p-6'>
        <div className='animate-pulse space-y-3'>
          <div className='h-4 bg-gray-200 rounded w-1/3' />
          <div className='h-6 bg-gray-200 rounded' />
          <div className='h-4 bg-gray-200 rounded w-2/3' />
        </div>
      </div>
    );
  }

  const { pourcentage, piecesPresentes, piecesRequises, piecesManquantes, estComplet } = data;

  const couleurBarre = estComplet
    ? 'bg-green-500'
    : pourcentage >= 60
    ? 'bg-yellow-500'
    : 'bg-red-500';

  const couleurTexte = estComplet
    ? 'text-green-600'
    : pourcentage >= 60
    ? 'text-yellow-600'
    : 'text-red-600';

  return (
    <div className='bg-white rounded-xl shadow p-6 space-y-4'>

      {/* Notification dossier complet */}
      {notifVisible && (
        <div className='bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-lg flex items-center gap-3 animate-pulse'>
          <span className='text-2xl'>🎉</span>
          <div>
            <p className='font-bold text-sm'>Dossier complet !</p>
            <p className='text-xs'>Toutes vos pièces sont déposées. Vous pouvez soumettre votre dossier.</p>
          </div>
          <button onClick={() => setNotifVisible(false)} className='ml-auto text-green-600 hover:text-green-800'>✕</button>
        </div>
      )}

      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-bold text-gray-800'>Complétude du dossier</h2>
        <span className={`text-2xl font-black ${couleurTexte}`}>{pourcentage}%</span>
      </div>

      {/* Barre de progression */}
      <div>
        <div className='flex justify-between text-xs text-gray-500 mb-1'>
          <span>{piecesPresentes} / {piecesRequises} pièces déposées</span>
          {estComplet
            ? <span className='text-green-600 font-medium'>✅ Complet</span>
            : <span>{piecesRequises - piecesPresentes} restante(s)</span>
          }
        </div>
        <div className='w-full bg-gray-200 rounded-full h-4 overflow-hidden'>
          <div
            className={`h-4 rounded-full transition-all duration-700 ${couleurBarre}`}
            style={{ width: `${pourcentage}%` }}
          />
        </div>
      </div>

      {/* Liste des pièces */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
        {Object.entries(PIECES_LABELS).map(([key, label]) => {
          const deposee = !piecesManquantes.includes(key);
          return (
            <div
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                deposee
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}
            >
              <span>{deposee ? '✅' : '❌'}</span>
              <span className='font-medium'>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Bouton de soumission */}
      {estComplet && dossier?.id && (
        <button
          onClick={handleSoumettre}
          disabled={soumission}
          className='w-full bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2'
        >
          {soumission ? (
            <>
              <span className='animate-spin'>⏳</span> Soumission en cours...
            </>
          ) : (
            <>📤 Soumettre officiellement mon dossier</>
          )}
        </button>
      )}

      {!estComplet && (
        <p className='text-xs text-gray-400 text-center'>
          Déposez toutes vos pièces pour pouvoir soumettre votre dossier.
        </p>
      )}
    </div>
  );
}
