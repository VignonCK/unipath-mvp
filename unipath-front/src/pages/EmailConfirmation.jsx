// src/pages/EmailConfirmation.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_ORIGIN = RAW_API_URL.replace(/\/api\/?$/, '');

function isConfirmationSuccess(data) {
  return Boolean(data?.success || data?.candidat);
}

export default function EmailConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [candidatInfo, setCandidatInfo] = useState(null);

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token) {
          setStatus('error');
          setMessage('Lien de confirmation invalide : jeton manquant.');
          return;
        }

        const response = await axios.get(`${API_ORIGIN}/api/auth/confirm-email`, {
          params: { token, type },
        });

        const data = response.data;

        if (isConfirmationSuccess(data)) {
          setStatus('success');
          setMessage(
            data.message
              || (data.alreadyConfirmed
                ? 'Votre email était déjà confirmé.'
                : 'Votre email a été confirmé avec succès !')
          );
          setCandidatInfo(data.candidat || null);

          setTimeout(() => {
            navigate('/login', {
              replace: true,
              state: {
                message: 'Email confirmé ! Vous pouvez maintenant vous connecter.',
                email: data.candidat?.email,
                type: 'success',
              },
            });
          }, 3000);
          return;
        }

        setStatus('error');
        setMessage(data.error || 'Erreur lors de la confirmation de l\'email');
      } catch (error) {
        console.error('Erreur confirmation:', error);
        const data = error.response?.data;

        // Email déjà confirmé (ancienne API en 400) ou réponse partielle
        if (data?.candidat || data?.alreadyConfirmed) {
          setStatus('success');
          setMessage(data.message || 'Votre email est déjà confirmé. Connectez-vous.');
          setCandidatInfo(data.candidat);
          setTimeout(() => {
            navigate('/login', {
              replace: true,
              state: {
                message: 'Vous pouvez vous connecter avec votre compte.',
                email: data.candidat?.email,
                type: 'success',
              },
            });
          }, 3000);
          return;
        }

        setStatus('error');
        if (error.response?.status === 400) {
          setMessage(data?.error || 'Le lien de confirmation est invalide ou a expiré.');
        } else if (error.response?.status >= 500) {
          setMessage('Le serveur est indisponible. Réessayez dans quelques minutes.');
        } else {
          setMessage(data?.error || 'Une erreur est survenue lors de la confirmation.');
        }
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-orange-600 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full'>
        {status === 'loading' && (
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin mx-auto mb-4' />
            <h1 className='text-2xl font-bold text-gray-800 mb-2'>Confirmation en cours...</h1>
            <p className='text-gray-600'>Veuillez patienter</p>
          </div>
        )}

        {status === 'success' && (
          <div className='text-center'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
            </div>
            <h1 className='text-2xl font-bold text-gray-800 mb-2'>Email confirmé</h1>
            <p className='text-gray-600 mb-4'>{message}</p>

            {candidatInfo && (
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left'>
                <p className='text-sm text-gray-700'>
                  <strong>Nom :</strong> {candidatInfo.prenom} {candidatInfo.nom}
                </p>
                <p className='text-sm text-gray-700'>
                  <strong>Email :</strong> {candidatInfo.email}
                </p>
                <p className='text-sm text-gray-700'>
                  <strong>Matricule :</strong> {candidatInfo.matricule}
                </p>
              </div>
            )}

            <p className='text-sm text-gray-500'>Redirection vers la page de connexion...</p>
          </div>
        )}

        {status === 'error' && (
          <div className='text-center'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </div>
            <h1 className='text-2xl font-bold text-gray-800 mb-2'>Erreur de confirmation</h1>
            <p className='text-gray-600 mb-6'>{message}</p>
            <button
              onClick={() => navigate('/login')}
              className='bg-blue-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 transition'
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
