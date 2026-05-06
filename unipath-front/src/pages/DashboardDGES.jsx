// src/pages/DashboardDGES.jsx
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { dgesService } from '../services/api';
import DGESLayout from '../components/DGESLayout';

export default function DashboardDGES() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dgesService.getStatistiques()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DGESLayout>
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='text-center'>
          <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin mx-auto mb-3' />
          <p className='text-gray-500 text-sm'>Chargement des statistiques...</p>
        </div>
      </div>
    </DGESLayout>
  );

  if (error) return (
    <DGESLayout>
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='text-center'>
          <p className='text-red-500 text-sm mb-3'>{error}</p>
          <button onClick={() => window.location.reload()} className='text-sm text-orange-500 hover:underline'>
            Réessayer
          </button>
        </div>
      </div>
    </DGESLayout>
  );

  const chartData = data?.statistiques?.map(s => ({
    name: s.concours.length > 18 ? s.concours.substring(0, 18) + '…' : s.concours,
    'En attente': Number(s.en_attente),
    'Validés':    Number(s.dossiers_valides),
    'Rejetés':    Number(s.dossiers_rejetes),
  })) || [];

  const tauxGlobal = data?.totaux?.total_inscrits > 0
    ? Math.round((data.totaux.total_valides / data.totaux.total_inscrits) * 100)
    : 0;

  return (
    <DGESLayout>
      <div className='max-w-6xl mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6'>

        {/* KPI CARDS */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {[
            { label: 'Concours actifs', value: data?.totaux?.total_concours ?? 0,  color: 'bg-blue-900',   text: 'text-white', sub: 'text-blue-300' },
            { label: 'Total inscrits',  value: data?.totaux?.total_inscrits ?? 0,   color: 'bg-orange-500', text: 'text-white', sub: 'text-orange-100' },
            { label: 'Dossiers validés',value: data?.totaux?.total_valides ?? 0,    color: 'bg-green-600',  text: 'text-white', sub: 'text-green-100' },
            { label: 'En attente',      value: data?.totaux?.total_attente ?? 0,    color: 'bg-yellow-500', text: 'text-white', sub: 'text-yellow-100' },
          ].map(card => (
            <div key={card.label} className={`rounded-2xl ${card.color} p-5 shadow-sm`}>
              <p className={`text-3xl font-black ${card.text}`}>{card.value}</p>
              <p className={`text-xs font-medium mt-1 ${card.sub}`}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* TAUX GLOBAL */}
        {data?.totaux?.total_inscrits > 0 && (
          <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-base font-bold text-gray-800'>Taux de validation global</h2>
              <span className='text-2xl font-black text-green-600'>{tauxGlobal}%</span>
            </div>
            <div className='w-full bg-gray-100 rounded-full h-2.5 overflow-hidden'>
              <div
                className='h-2.5 bg-green-500 rounded-full transition-all duration-700'
                style={{ width: `${tauxGlobal}%` }}
              />
            </div>
            <div className='flex justify-between text-xs text-gray-400 mt-1.5'>
              <span>{data.totaux.total_valides} validés</span>
              <span>{data.totaux.total_inscrits} inscrits au total</span>
            </div>
          </div>
        )}

        {/* GRAPHIQUE */}
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
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar dataKey='En attente' fill='#F59E0B' radius={[4, 4, 0, 0]} />
                <Bar dataKey='Validés'    fill='#10B981' radius={[4, 4, 0, 0]} />
                <Bar dataKey='Rejetés'    fill='#EF4444' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* TABLEAU DÉTAILLÉ */}
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
                      <td className='px-4 py-3 font-medium text-gray-800'>{s.concours}</td>
                      <td className='px-4 py-3 text-gray-500 text-xs'>
                        {new Date(s.dateDebut).toLocaleDateString('fr-FR')}
                      </td>
                      <td className='px-4 py-3 font-bold text-gray-900'>{Number(s.total_inscrits)}</td>
                      <td className='px-4 py-3 text-green-700 font-semibold'>{Number(s.dossiers_valides)}</td>
                      <td className='px-4 py-3 text-red-600 font-semibold'>{Number(s.dossiers_rejetes)}</td>
                      <td className='px-4 py-3 text-yellow-600 font-semibold'>{Number(s.en_attente)}</td>
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

      </div>
    </DGESLayout>
  );
}
