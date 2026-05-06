// src/pages/CarteCandidat.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatService, authService } from '../services/api';

export default function CarteCandidat() {
  const navigate = useNavigate();
  const [candidat, setCandidat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    loadCandidat();
  }, []);

  const loadCandidat = async () => {
    try {
      const data = await candidatService.getProfil();
      setCandidat(data);
      
      // Charger la photo depuis localStorage
      if (data.dossier?.photo) {
        const saved = localStorage.getItem('photoProfil_' + data.id);
        if (saved) setPhotoUrl(saved);
      }
    } catch (err) {
      console.error(err);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin mx-auto mb-3' />
          <p className='text-gray-500 text-sm'>Chargement...</p>
        </div>
      </div>
    );
  }

  const pieceStatus = (piece) => {
    return candidat?.dossier?.[piece] ? 'Validée' : 'Non fournie';
  };

  const pieceIcon = (piece) => {
    const isValid = candidat?.dossier?.[piece];
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isValid ? 'bg-green-100' : 'bg-gray-100'}`}>
        <svg className={`w-5 h-5 ${isValid ? 'text-green-600' : 'text-gray-400'}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          {isValid ? (
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
          ) : (
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4'>
      <div className='max-w-2xl mx-auto'>
        {/* Bouton Retour */}
        <button
          onClick={() => navigate('/dashboard')}
          className='mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
          </svg>
          <span className='text-sm font-medium'>Retour au tableau de bord</span>
        </button>

        {/* Carte Principale */}
        <div className='bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200'>
          {/* Header avec logo */}
          <div className='bg-gradient-to-r from-blue-900 to-blue-800 px-8 py-6 text-white'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-2xl font-black tracking-tight'>INSUP Bénin</h1>
                <p className='text-blue-300 text-sm mt-1'>Carte d'Identité Candidat</p>
              </div>
              <div className='bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg'>
                <p className='text-xs text-blue-200'>Matricule</p>
                <p className='text-lg font-bold'>{candidat?.matricule}</p>
              </div>
            </div>
          </div>

          {/* Corps de la carte */}
          <div className='p-8'>
            {/* Section Photo et Infos Principales */}
            <div className='flex flex-col md:flex-row gap-8 mb-8'>
              {/* Photo */}
              <div className='flex-shrink-0'>
                <div className='w-40 h-40 rounded-2xl overflow-hidden border-4 border-blue-100 shadow-lg'>
                  {photoUrl ? (
                    <img src={photoUrl} alt='Photo' className='w-full h-full object-cover' />
                  ) : (
                    <div className='w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center'>
                      <svg className='w-20 h-20 text-blue-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations Personnelles */}
              <div className='flex-1'>
                <h2 className='text-3xl font-black text-gray-900 mb-2'>
                  {candidat?.prenom} {candidat?.nom}
                </h2>
                <p className='text-gray-500 text-sm mb-6'>Candidat</p>

                <div className='space-y-3'>
                  {/* Informations académiques */}
                  <div className='bg-amber-50 border-l-4 border-amber-500 px-4 py-3 rounded-r-lg'>
                    <p className='text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1'>
                      Données Académiques (BAC)
                    </p>
                    <div className='grid grid-cols-2 gap-2 text-sm'>
                      <div>
                        <span className='text-gray-600'>Série :</span>
                        <span className='ml-2 font-semibold text-gray-900'>{candidat?.serie || 'Non renseigné'}</span>
                      </div>
                      <div>
                        <span className='text-gray-600'>Année :</span>
                        <span className='ml-2 font-semibold text-gray-900'>{candidat?.anneeBac || 'Non renseigné'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Informations civiles */}
                  <div className='bg-blue-50 border-l-4 border-blue-500 px-4 py-3 rounded-r-lg'>
                    <p className='text-xs text-blue-700 font-semibold uppercase tracking-wide mb-1'>
                      Informations Civiles
                    </p>
                    <div className='space-y-1 text-sm'>
                      {candidat?.sexe && (
                        <div>
                          <span className='text-gray-600'>Sexe :</span>
                          <span className='ml-2 font-semibold text-gray-900'>{candidat.sexe === 'M' ? 'Masculin' : 'Féminin'}</span>
                        </div>
                      )}
                      {candidat?.nationalite && (
                        <div>
                          <span className='text-gray-600'>Nationalité :</span>
                          <span className='ml-2 font-semibold text-gray-900'>{candidat.nationalite}</span>
                        </div>
                      )}
                      {candidat?.dateNaiss && (
                        <div>
                          <span className='text-gray-600'>Date de naissance :</span>
                          <span className='ml-2 font-semibold text-gray-900'>
                            {new Date(candidat.dateNaiss).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                      {candidat?.lieuNaiss && (
                        <div>
                          <span className='text-gray-600'>Lieu de naissance :</span>
                          <span className='ml-2 font-semibold text-gray-900'>{candidat.lieuNaiss}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations de Contact */}
            <div className='mb-8'>
              <h3 className='text-sm font-bold text-gray-500 uppercase tracking-wide mb-4'>
                Informations de Contact
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl'>
                  <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                  </svg>
                  <div>
                    <p className='text-xs text-gray-500'>Email</p>
                    <p className='text-sm font-semibold text-gray-900'>{candidat?.email}</p>
                  </div>
                </div>
                {candidat?.telephone && (
                  <div className='flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl'>
                    <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                    </svg>
                    <div>
                      <p className='text-xs text-gray-500'>Téléphone</p>
                      <p className='text-sm font-semibold text-gray-900'>{candidat.telephone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Documents du Dossier */}
            <div>
              <h3 className='text-sm font-bold text-gray-500 uppercase tracking-wide mb-4'>
                Documents du Dossier
              </h3>
              <div className='space-y-3'>
                {/* Photo d'identité */}
                <div className='flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl hover:bg-gray-100 transition'>
                  <div className='flex items-center gap-3'>
                    {pieceIcon('photo')}
                    <div>
                      <p className='text-sm font-semibold text-gray-900'>Photo d'identité</p>
                      <p className='text-xs text-gray-500'>Format image requis (JPG, PNG)</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    candidat?.dossier?.photo 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {pieceStatus('photo')}
                  </span>
                </div>

                {/* Carte d'identité */}
                <div className='flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl hover:bg-gray-100 transition'>
                  <div className='flex items-center gap-3'>
                    {pieceIcon('carteIdentite')}
                    <div>
                      <p className='text-sm font-semibold text-gray-900'>Carte d'identité</p>
                      <p className='text-xs text-gray-500'>CNI ou passeport valide (PDF)</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    candidat?.dossier?.carteIdentite 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {pieceStatus('carteIdentite')}
                  </span>
                </div>

                {/* Acte de naissance */}
                <div className='flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl hover:bg-gray-100 transition'>
                  <div className='flex items-center gap-3'>
                    {pieceIcon('acteNaissance')}
                    <div>
                      <p className='text-sm font-semibold text-gray-900'>Acte de Naissance</p>
                      <p className='text-xs text-gray-500'>Extrait d'acte de naissance (PDF)</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    candidat?.dossier?.acteNaissance 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {pieceStatus('acteNaissance')}
                  </span>
                </div>

                {/* Relevé de notes */}
                <div className='flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl hover:bg-gray-100 transition'>
                  <div className='flex items-center gap-3'>
                    {pieceIcon('releve')}
                    <div>
                      <p className='text-sm font-semibold text-gray-900'>Relevé de Notes - Terminale</p>
                      <p className='text-xs text-gray-500'>Relevé de notes du BAC (PDF)</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    candidat?.dossier?.releve 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {pieceStatus('releve')}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer avec QR Code simulé */}
            <div className='mt-8 pt-6 border-t border-gray-200 flex items-center justify-between'>
              <div className='text-xs text-gray-500'>
                <p>Lien vers le portail de vérification et réservation</p>
                <p className='font-mono text-blue-600'>https://insup.bj/verify/{candidat?.matricule}</p>
              </div>
              <div className='w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center'>
                <svg className='w-16 h-16 text-gray-300' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z' />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className='mt-6 flex gap-4'>
          <button
            onClick={() => navigate('/mon-compte')}
            className='flex-1 bg-blue-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-800 transition shadow-lg'
          >
            Modifier mes informations
          </button>
          <button
            onClick={() => window.print()}
            className='flex-1 bg-white text-blue-900 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition shadow-lg border-2 border-blue-900'
          >
            Imprimer la carte
          </button>
        </div>
      </div>
    </div>
  );
}
