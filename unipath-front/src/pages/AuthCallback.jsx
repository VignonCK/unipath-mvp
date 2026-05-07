import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Vérification en cours...');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const type = params.get('type');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Erreur lors de la confirmation.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (type === 'signup' || type === 'email_change') {
          setStatus('success');
          setMessage('Email confirmé avec succès ! Redirection...');
          setTimeout(() => {
            navigate('/login', {
              state: {
                message: 'Email confirmé ! Vous pouvez maintenant vous connecter.',
                type: 'success'
              }
            });
          }, 2000);
        } else {
          setStatus('success');
          setMessage('Redirection...');
          setTimeout(() => navigate('/login'), 1000);
        }
      } catch (err) {
        console.error('Erreur callback:', err);
        setStatus('error');
        setMessage('Une erreur est survenue. Redirection...');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleEmailConfirmation();
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
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </div>
            <h2 className='text-xl font-bold text-gray-900 mb-2'>Erreur</h2>
            <p className='text-gray-600'>{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
