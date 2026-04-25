// src/pages/DashboardDGES.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { dgesService, authService } from '../services/api';

function initiales(str) {
  if (!str) return 'D';
  const parts = str.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : str.slice(0, 2).toUpperCase();
}

export default function DashboardDGES() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = authService.getCurrentUser();

  useEffect(() => {
    dgesService.getStatistiques()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <div className='w-12 h-12 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin mx-auto mb-3' />
        <p className='text-gray-500 text-sm'>Chargement des statistiques...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <p className='text-4xl mb-3'>⚠️</p>
        <p className='text-red-500 text-sm'>{error}</p>
        <button onClick={() => window.location.reload()} className='mt-3 text-sm text-orange-500 hover:underline'>
          Réessayer
        </button>
      </div>
    </div>
  );

  const chartData = data?.statistiques?.map(s => ({
    name: s.concours.length > 18 ? s.concours.substring(0, 18) + '…' : s.concours,
    'En attente': Number(s.en_attente),
    'Validés':    Number(s.dossiers_valides),
    'Rejetés':    Number(s.dossiers_rejetes),
  })) || [];

  const nomUser = user?.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : user?.email || 'DGES';

  return (
    <div className='min-h-screen bg-gray-50'>

      {/* ── HEADER ── */}
      <header className='bg-blue-900 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg'>
        <div className='flex items-center gap-3'>
          <span className='text-xl font-black tracking-tight'>UniPath</span>
          <span className='hidden sm:block text-blue-300 text-xs'>Tableau de bord DGES</span>
        </div>

        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <div className='w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0'>
              {initiales(nomUser)}
            </div>
            <div className='hidden sm:block'>
              <p className='text-sm font-semibold leading-tight'>{nomUser}</p>
              <p className='text-orange-300 text-xs'>DGES</p>
            </div>
          </div>
          <button
            onClick={() => { authService.logout(); navigate('/login'); }}
            className='text-xs border border-orange-400 text-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition'
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className='max-w-6xl mx-auto p-6 space-y-6'>

        {/* ── KPI CARDS ── */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {[
            {
              label: 'Concours actifs',
              value: data?.totaux?.total_concours ?? 0,
              icon: '🏛️',
              color: 'from-blue-900 to-blue-800',
              text: 'text-white',
              sub: 'text-blue-300',
            },
            {
              label: 'Total inscrits',
              value: data?.totaux?.total_inscrits ?? 0,
              icon: '👥',
              color: 'from-orange-500 to-orange-600',
              text: 'text-white',
              sub: 'text-orange-100',
            },
            {
              label: 'Dossiers validés',
              value: data?.totaux?.total_valides ?? 0,
              icon: '✅',
              color: 'from-green-600 to-green-700',
              text: 'text-white',
              sub: 'text-green-100',
            },
            {
              label: 'En attente',
              value: data?.totaux?.total_attente ?? 0,
              icon: '⏳',
              color: 'from-yellow-500 to-yellow-600',
              text: 'text-white',
              sub: 'text-yellow-100',
            },
          ].map(card => (
            <div key={card.label} className={`rounded-2xl bg-gradient-to-br ${card.color} p-5 shadow-sm`}>
              <p className='text-2xl mb-2'>{card.icon}</p>
              <p className={`text-3xl font-black ${card.text}`}>{card.value}</p>
              <p className={`text-xs font-medium mt-1 ${card.sub}`}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* ── TAUX GLOBAL ── */}
        {data?.totaux?.total_inscrits > 0 && (
          <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-base font-bold text-gray-800'>Taux de validation global</h2>
              <span className='text-2xl font-black text-green-600'>
                {Math.round((data.totaux.total_valides / data.totaux.total_inscrits) * 100)}%
              </span>
            </div>
            <div className='w-full bg-gray-100 rounded-full h-3 overflow-hidden'>
              <div
                className='h-3 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-700'
                style={{ width: `${Math.round((data.totaux.total_valides / data.totaux.total_inscrits) * 100)}%` }}
              />
            </div>
            <div className='flex justify-between text-xs text-gray-400 mt-1'>
              <span>{data.totaux.total_valides} validés</span>
              <span>{data.totaux.total_inscrits} inscrits au total</span>
            </div>
          </div>
        )}

        {/* ── GRAPHIQUE ── */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
          <h2 className='text-base font-bold text-gray-800 mb-6'>Inscriptions par concours</h2>
          {chartData.length === 0 ? (
            <p className='text-center text-gray-400 text-sm py-10'>Aucune donnée disponible.</p>
          ) : (
            <ResponsiveContainer width='100%' height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                <XAxis dataKey='name' angle={-30} textAnchor='end' interval={0} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar dataKey='En attente' fill='#F59E0B' radius={[4, 4, 0, 0]} />
                <Bar dataKey='Validés'    fill='#10B981' radius={[4, 4, 0, 0]} />
                <Bar dataKey='Rejetés'    fill='#EF4444' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── TABLEAU DÉTAILLÉ ── */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
            <h2 className='text-base font-bold text-gray-800'>Détail par concours</h2>
            <span className='text-xs text-gray-400'>{data?.statistiques?.length || 0} concours</span>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm min-w-[640px]'>
              <thead>
                <tr className='bg-gray-50 border-b border-gray-100'>
                  {['Concours', 'Date début', 'Total', 'Validés', 'Rejetés', 'En attente', 'Taux'].map(h => (
                    <th key={h} className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {data?.statistiques?.map((s) => {
                  const taux = Number(s.taux_validation_pct) || 0;
                  return (
                    <tr key={s.concours_id} className='hover:bg-gray-50 transition'>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-2'>
                          <div className='w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-xs'>🏛️</div>
                          <span className='font-medium text-gray-800'>{s.concours}</span>
                        </div>
                      </td>
                      <td className='px-4 py-3 text-gray-500 text-xs'>
                        {new Date(s.dateDebut).toLocaleDateString('fr-FR')}
                      </td>
                      <td className='px-4 py-3 font-bold text-gray-900'>{Number(s.total_inscrits)}</td>
                      <td className='px-4 py-3'>
                        <span className='text-green-700 font-semibold'>{Number(s.dossiers_valides)}</span>
                      </td>
                      <td className='px-4 py-3'>
                        <span className='text-red-600 font-semibold'>{Number(s.dossiers_rejetes)}</span>
                      </td>
                      <td className='px-4 py-3'>
                        <span className='text-yellow-600 font-semibold'>{Number(s.en_attente)}</span>
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-2'>
                          <div className='flex-1 bg-gray-100 rounded-full h-1.5 min-w-[40px]'>
                            <div
                              className={`h-1.5 rounded-full ${taux >= 50 ? 'bg-green-500' : 'bg-red-400'}`}
                              style={{ width: `${taux}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${taux >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                            {taux}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
