// src/pages/ClassementConcours.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { concoursService, authService } from '../services/api';

export default function ClassementConcours() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClassement();
  }, [id]);

  const loadClassement = async () => {
    try {
      setLoading(true);
      const result = await concoursService.getClassement(id);
      setData(result);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin mx-auto mb-3' />
        <p className='text-gray-500 text-sm'>Chargement du classement...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <p className='text-red-500 text-sm mb-3'>{error}</p>
        <button onClick={() => navigate(-1)} className='text-sm text-orange-500 hover:underline'>
          Retour
        </button>
      </div>
    </div>
  );

  const getMedalColor = (rang) => {
    if (rang === 1) return 'text-yellow-500';
    if (rang === 2) return 'text-gray-400';
    if (rang === 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* HEADER */}
      <header className='bg-blue-900 text-white px-6 py-4 shadow-lg'>
        <div className='max-w-6xl mx-auto'>
          <button
            onClick={() => navigate(-1)}
            className='flex items-center gap-2 text-blue-300 hover:text-white transition mb-3'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
            </svg>
            <span className='text-sm'>Retour</span>
          </button>
          <div className='flex items-center gap-3'>
            <svg className='w-8 h-8 text-orange-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' />
            </svg>
            <div>
              <h1 className='text-2xl font-black'>{data?.concours?.libelle}</h1>
              {data?.concours?.etablissement && (
                <p className='text-blue-300 text-sm'>{data.concours.etablissement}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className='max-w-6xl mx-auto px-4 py-6 space-y-6'>
        {/* STATISTIQUES */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div className='bg-white rounded-2xl p-5 shadow-sm border border-gray-100'>
            <p className='text-3xl font-black text-blue-900'>{data?.totalCandidats || 0}</p>
            <p className='text-xs font-medium text-gray-500 mt-1'>Candidats validés</p>
          </div>
          <div className='bg-white rounded-2xl p-5 shadow-sm border border-gray-100'>
            <p className='text-3xl font-black text-green-600'>{data?.candidatsPresents || 0}</p>
            <p className='text-xs font-medium text-gray-500 mt-1'>Ont composé</p>
          </div>
          <div className='bg-white rounded-2xl p-5 shadow-sm border border-gray-100'>
            <p className='text-3xl font-black text-red-600'>{data?.candidatsAbsents || 0}</p>
            <p className='text-xs font-medium text-gray-500 mt-1'>Absents</p>
          </div>
        </div>

        {/* PODIUM (Top 3) */}
        {data?.classement && data.classement.filter(c => c.note !== null).length > 0 && (
          <div className='bg-gradient-to-br from-orange-50 to-blue-50 rounded-2xl p-6 shadow-sm border border-orange-100'>
            <h2 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <svg className='w-5 h-5 text-orange-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' />
              </svg>
              Podium
            </h2>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              {data.classement.filter(c => c.note !== null).slice(0, 3).map((candidat) => (
                <div
                  key={candidat.candidat.id}
                  className='bg-white rounded-xl p-4 shadow-sm border-2 border-orange-200'
                >
                  <div className='flex items-center justify-between mb-2'>
                    <span className={`text-4xl font-black ${getMedalColor(candidat.rang)}`}>
                      #{candidat.rang}
                    </span>
                    <span className='text-2xl font-black text-orange-500'>
                      {candidat.note}/20
                    </span>
                  </div>
                  <p className='font-bold text-gray-800'>{candidat.candidat.prenom} {candidat.candidat.nom}</p>
                  <p className='text-xs text-gray-500'>{candidat.candidat.matricule}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLASSEMENT COMPLET */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-100'>
            <h2 className='text-base font-bold text-gray-800'>Classement complet</h2>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm min-w-[640px]'>
              <thead>
                <tr className='bg-gray-50 border-b border-gray-100'>
                  <th className='px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-20'>Rang</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Matricule</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase'>Nom & Prénom</th>
                  <th className='px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase'>Note</th>
                  <th className='px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase'>Statut</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {data?.classement && data.classement.length === 0 ? (
                  <tr>
                    <td colSpan='5' className='px-4 py-10 text-center text-gray-400'>
                      Aucun candidat validé pour ce concours.
                    </td>
                  </tr>
                ) : (
                  data?.classement?.map((candidat) => (
                    <tr key={candidat.candidat.id} className='hover:bg-gray-50 transition'>
                      <td className='px-4 py-3 text-center'>
                        {candidat.rang ? (
                          <span className={`text-lg font-black ${getMedalColor(candidat.rang)}`}>
                            #{candidat.rang}
                          </span>
                        ) : (
                          <span className='text-gray-400'>-</span>
                        )}
                      </td>
                      <td className='px-4 py-3 font-mono text-xs text-gray-600'>
                        {candidat.candidat.matricule}
                      </td>
                      <td className='px-4 py-3 font-medium text-gray-800'>
                        {candidat.candidat.prenom} {candidat.candidat.nom}
                      </td>
                      <td className='px-4 py-3 text-center'>
                        {candidat.note !== null ? (
                          <span className='text-lg font-black text-orange-500'>
                            {candidat.note}/20
                          </span>
                        ) : (
                          <span className='text-gray-400'>-</span>
                        )}
                      </td>
                      <td className='px-4 py-3 text-center'>
                        {candidat.note !== null ? (
                          <span className='inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full'>
                            Présent
                          </span>
                        ) : (
                          <span className='inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full'>
                            Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
