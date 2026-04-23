// src/pages/DashboardDGES.jsx
// Tableau de bord national pour la DGES
// Affiche les statistiques globales de tous les concours
// avec un graphique en barres et un tableau détaillé

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { dgesService } from '../services/api';

export default function DashboardDGES() {
  // Données reçues du backend
  // Structure : { totaux: {...}, statistiques: [...] }
  const [data, setData] = useState(null);

  // true pendant le chargement des données
  const [loading, setLoading] = useState(true);

  // Message d'erreur si l'appel API échoue
  const [error, setError] = useState('');

  // Charger les statistiques au montage du composant
  useEffect(() => {
    dgesService.getStatistiques()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className='min-h-screen flex items-center justify-center'>
      <p className='text-gray-500'>Chargement des statistiques...</p>
    </div>
  );

  if (error) return (
    <div className='min-h-screen flex items-center justify-center'>
      <p className='text-red-500'>Erreur : {error}</p>
    </div>
  );

  // Transformer les données pour le format attendu par Recharts
  const chartData = data?.statistiques?.map(s => ({
    name: s.concours.substring(0, 20) + '...',
    'En attente': Number(s.en_attente),
    'Validés': Number(s.dossiers_valides),
    'Rejetés': Number(s.dossiers_rejetes),
  })) || [];

  return (
    <div className='min-h-screen bg-gray-50'>

      {/* Header */}
      <header className='bg-blue-900 text-white px-6 py-4'>
        <h1 className='text-xl font-bold'>UniPath — Tableau de bord DGES</h1>
        <p className='text-blue-300 text-sm'>
          Direction Générale de l'Enseignement Supérieur
        </p>
      </header>

      <main className='max-w-6xl mx-auto p-6 space-y-6'>

        {/* Cartes de statistiques globales */}
        {/* grid-cols-2 sur mobile, 4 colonnes sur écran moyen */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {[
            { label: 'Total concours', value: data?.totaux?.total_concours, color: 'bg-blue-50 border-blue-200 text-blue-900' },
            { label: 'Total inscrits', value: data?.totaux?.total_inscrits, color: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'Dossiers validés', value: data?.totaux?.total_valides, color: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'En attente', value: data?.totaux?.total_attente, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          ].map(card => (
            <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
              <p className='text-sm font-medium'>{card.label}</p>
              <p className='text-3xl font-bold mt-1'>{card.value ?? 0}</p>
            </div>
          ))}
        </div>

        {/* Graphique en barres */}
        <div className='bg-white rounded-xl shadow p-6'>
          <h2 className='text-lg font-bold text-gray-800 mb-6'>
            Inscriptions par concours
          </h2>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='name' angle={-30} textAnchor='end' interval={0} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='En attente' fill='#F59E0B' />
              <Bar dataKey='Validés' fill='#10B981' />
              <Bar dataKey='Rejetés' fill='#EF4444' />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tableau détaillé par concours */}
        <div className='bg-white rounded-xl shadow overflow-hidden'>
          <div className='px-6 py-4 border-b'>
            <h2 className='text-lg font-bold text-gray-800'>Détail par concours</h2>
          </div>
          {/* overflow-x-auto = tableau scrollable horizontalement sur mobile */}
          <div className='overflow-x-auto'>
            <table className='w-full text-sm min-w-[600px]'>
              <thead className='bg-gray-50'>
                <tr>
                  {['Concours', 'Date début', 'Total', 'Validés', 'Rejetés', 'En attente', 'Taux validation'].map(h => (
                    <th key={h} className='px-4 py-3 text-left text-gray-600 font-medium'>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.statistiques?.map((s, i) => (
                  <tr key={s.concours_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className='px-4 py-3 font-medium'>{s.concours}</td>
                    <td className='px-4 py-3 text-gray-500'>
                      {new Date(s.dateDebut).toLocaleDateString('fr-FR')}
                    </td>
                    <td className='px-4 py-3 font-bold'>{Number(s.total_inscrits)}</td>
                    <td className='px-4 py-3 text-green-700 font-medium'>{Number(s.dossiers_valides)}</td>
                    <td className='px-4 py-3 text-red-700 font-medium'>{Number(s.dossiers_rejetes)}</td>
                    <td className='px-4 py-3 text-yellow-700 font-medium'>{Number(s.en_attente)}</td>
                    <td className='px-4 py-3'>
                      {/* Badge coloré : vert si >= 50%, rouge sinon */}
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        Number(s.taux_validation_pct) >= 50
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {s.taux_validation_pct ? `${s.taux_validation_pct}%` : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}