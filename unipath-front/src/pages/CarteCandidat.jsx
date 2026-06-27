// src/pages/CarteCandidat.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { candidatService, dossierService } from '../services/api';
import { BentoCard } from '../components/AcademicLayout';

const VERIFY_BASE_URL = 'https://unipath-mvp.vercel.app/verify';
const CURRENT_YEAR = new Date().getFullYear();

function buildVerifyUrl(matricule) {
  return matricule ? `${VERIFY_BASE_URL}/${matricule}` : VERIFY_BASE_URL;
}

export default function CarteCandidat() {
  const navigate = useNavigate();
  const [candidat, setCandidat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    const loadCarte = async () => {
      try {
        const data = await candidatService.getProfil();
        setCandidat(data);

        if (data.dossier?.photo) {
          try {
            const { signedUrl } = await dossierService.getSignedUrl(data.dossier.photo);
            setPhotoUrl(signedUrl);
          } catch {
            setPhotoUrl(null);
          }
        }
      } catch (err) {
        console.error(err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadCarte();
  }, [navigate]);

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

  const verifyUrl = buildVerifyUrl(candidat?.matricule);

  return (
    <div className='min-h-screen academic-bg custom-scrollbar py-8 px-4 animate-slide-in'>
      <div className='max-w-2xl mx-auto'>
        <button
          type='button'
          onClick={() => navigate('/dashboard')}
          className='no-print mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
          </svg>
          <span className='text-sm font-medium'>Retour au tableau de bord</span>
        </button>

        <BentoCard className='p-0 overflow-hidden'>
          <div className='bg-gradient-to-r from-blue-900 to-blue-800 px-8 py-6 text-white'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <h1 className='text-2xl font-black tracking-tight'>UniPath</h1>
                <p className='text-blue-300 text-sm mt-1'>
                  Carte d&apos;Identité Candidat — {CURRENT_YEAR}
                </p>
              </div>
              <div className='bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg shrink-0'>
                <p className='text-xs text-blue-200'>Matricule</p>
                <p className='text-lg font-bold'>{candidat?.matricule}</p>
              </div>
            </div>
          </div>

          <div className='p-8'>
            <div className='flex flex-col md:flex-row gap-8 mb-8'>
              <div className='flex-shrink-0'>
                <div className='w-40 h-40 rounded-2xl overflow-hidden border-4 border-blue-100 shadow-lg'>
                  {photoUrl ? (
                    <img src={photoUrl} alt='Photo candidat' className='w-full h-full object-cover' />
                  ) : (
                    <div className='w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center'>
                      <svg className='w-20 h-20 text-blue-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <div className='flex-1'>
                <h2 className='text-3xl font-black text-gray-900 mb-2'>
                  {candidat?.prenom} {candidat?.nom}
                </h2>
                <p className='text-gray-500 text-sm mb-6'>Candidat — {CURRENT_YEAR}</p>

                <div className='space-y-3'>
                  <div className='glass-card-subtle border-l-4 border-amber-500 px-4 py-3'>
                    <p className='text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1'>
                      Données BAC
                    </p>
                    <p className='text-sm text-gray-800'>
                      Série : <strong>{candidat?.serie || 'Non renseignée'}</strong>
                    </p>
                  </div>

                  <div className='glass-card-subtle border-l-4 border-blue-500 px-4 py-3'>
                    <p className='text-xs text-blue-700 font-semibold uppercase tracking-wide mb-2'>
                      Informations civiles
                    </p>
                    <div className='space-y-1 text-sm'>
                      {candidat?.sexe && (
                        <div>
                          <span className='text-gray-600'>Sexe :</span>
                          <span className='ml-2 font-semibold text-gray-900'>
                            {candidat.sexe === 'M' ? 'Masculin' : 'Féminin'}
                          </span>
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
                      {candidat?.telephone && (
                        <div>
                          <span className='text-gray-600'>Téléphone :</span>
                          <span className='ml-2 font-semibold text-gray-900'>{candidat.telephone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4'>
              <div className='text-xs text-gray-500'>
                <p>Lien de vérification UniPath</p>
                <p className='font-mono text-blue-600 break-all'>{verifyUrl}</p>
              </div>
              <div className='rounded-lg border border-gray-200 bg-white p-2 shrink-0'>
                <QRCodeSVG
                  value={verifyUrl}
                  size={100}
                  bgColor='#ffffff'
                  fgColor='#1e3a8a'
                  level='M'
                />
              </div>
            </div>
          </div>
        </BentoCard>

        <div className='no-print mt-6 flex gap-4'>
          <button
            type='button'
            onClick={() => navigate('/mon-compte')}
            className='btn-academic flex-1 py-3 px-6'
          >
            Modifier mes informations
          </button>
          <button
            type='button'
            onClick={() => window.print()}
            className='no-print btn-glass flex-1 py-3 px-6'
          >
            Imprimer la carte
          </button>
        </div>
      </div>
    </div>
  );
}
