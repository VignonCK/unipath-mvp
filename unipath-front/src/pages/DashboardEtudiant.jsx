import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, parcoursService } from '../services/api';

const statutClasses = {
  EN_COURS: 'bg-blue-100 text-blue-700',
  VALIDE: 'bg-green-100 text-green-700',
  REDOUBLANT: 'bg-amber-100 text-amber-700',
  ABANDONNE: 'bg-red-100 text-red-700',
};

function DashboardEtudiant() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [parcours, setParcours] = useState([]);

  useEffect(() => {
    const chargerParcours = async () => {
      try {
        setLoading(true);
        const data = await parcoursService.getMonParcours();
        setParcours(data.parcours || []);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement du parcours');
      } finally {
        setLoading(false);
      }
    };

    chargerParcours();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleTelechargerReleve = async () => {
    try {
      setDownloading(true);
      setError('');
      await parcoursService.telechargerMonReleve();
    } catch (err) {
      setError(err.message || 'Erreur lors du telechargement du releve');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className='min-h-screen bg-slate-50'>
      <header className='bg-slate-900 text-white shadow'>
        <div className='mx-auto flex max-w-6xl items-center justify-between px-4 py-4'>
          <h1 className='text-lg font-semibold sm:text-2xl'>UniPath - Mon Parcours</h1>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={handleTelechargerReleve}
              disabled={downloading}
              className='rounded-lg bg-blue-500/90 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {downloading ? 'Generation...' : 'Telecharger mon releve'}
            </button>
            <button
              type='button'
              onClick={handleLogout}
              className='rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20'
            >
              Deconnexion
            </button>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-6xl px-4 py-6'>
        {loading && (
          <div className='rounded-xl border border-slate-200 bg-white p-6 text-slate-600'>
            Chargement de votre parcours...
          </div>
        )}

        {!loading && error && (
          <div className='rounded-xl border border-red-200 bg-red-50 p-4 text-red-700'>{error}</div>
        )}

        {!loading && !error && parcours.length === 0 && (
          <div className='rounded-xl border border-slate-200 bg-white p-6 text-slate-600'>
            Aucune inscription academique trouvee.
          </div>
        )}

        {!loading && !error && parcours.length > 0 && (
          <div className='grid gap-4 md:grid-cols-2'>
            {parcours.map((inscription) => (
              <article key={inscription.id} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                <div className='mb-3 flex items-start justify-between'>
                  <div>
                    <h2 className='text-lg font-semibold text-slate-900'>{inscription.filiere?.nom || '-'}</h2>
                    <p className='text-sm text-slate-500'>{inscription.etablissement?.nom || '-'}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statutClasses[inscription.statut] || 'bg-slate-100 text-slate-700'}`}
                  >
                    {inscription.statut}
                  </span>
                </div>

                <div className='space-y-1 text-sm text-slate-700'>
                  <p>
                    <span className='font-medium'>Annee:</span> {inscription.anneeAcademique}
                  </p>
                  <p>
                    <span className='font-medium'>Niveau:</span> {inscription.niveau}
                  </p>
                  <p>
                    <span className='font-medium'>Moyenne generale:</span>{' '}
                    {typeof inscription.moyenneGenerale === 'number'
                      ? `${inscription.moyenneGenerale}/20`
                      : 'Non disponible'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardEtudiant;

