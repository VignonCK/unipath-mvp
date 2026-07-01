import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Callback Supabase (OAuth / anciens liens). La confirmation candidat passe par
 * /auth/confirm et l'API /api/auth/confirm-email — pas par cette page.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Vérification en cours...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    const type = params.get('type');

    if (error) {
      setStatus('error');
      setMessage(errorDescription || 'Erreur lors de la confirmation.');
      setTimeout(() => navigate('/login'), 4000);
      return;
    }

    if (type === 'signup' || type === 'email_change') {
      setStatus('error');
      setMessage(
        'Ce lien ne active pas votre compte UniPath. Ouvrez l\'email « [UniPath] Confirmez votre adresse email » et cliquez sur le bouton orange (lien /auth/confirm).',
      );
      setTimeout(() => {
        navigate('/login', {
          state: {
            message:
              'Utilisez le lien de confirmation UniPath reçu par email, ou demandez un renvoi depuis la page de connexion.',
            type: 'warning',
          },
        });
      }, 5000);
      return;
    }

    setStatus('success');
    setMessage('Redirection...');
    setTimeout(() => navigate('/login'), 1000);
  }, [navigate]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center'>
        {status === 'loading' && (
          <>
            <div className='w-16 h-16 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin mx-auto mb-4' />
            <h2 className='text-xl font-bold text-gray-900 mb-2'>Vérification</h2>
            <p className='text-gray-600'>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
            </div>
            <h2 className='text-xl font-bold text-gray-900 mb-2'>Succès</h2>
            <p className='text-gray-600'>{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className='w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-amber-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
            <h2 className='text-xl font-bold text-gray-900 mb-2'>Lien incorrect</h2>
            <p className='text-gray-600 text-sm leading-relaxed'>{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
