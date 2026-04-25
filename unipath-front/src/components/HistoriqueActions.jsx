// src/components/HistoriqueActions.jsx
import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const TYPE_LABELS = {
  DOSSIER_CREE:    { label: 'Dossier créé',          icon: '📁', color: 'bg-blue-100 text-blue-700' },
  PIECE_AJOUTEE:   { label: 'Pièce ajoutée',          icon: '📎', color: 'bg-green-100 text-green-700' },
  PIECE_SUPPRIMEE: { label: 'Pièce supprimée',        icon: '🗑️', color: 'bg-orange-100 text-orange-700' },
  DOSSIER_VALIDE:  { label: 'Dossier validé',         icon: '✅', color: 'bg-green-100 text-green-700' },
  DOSSIER_REJETE:  { label: 'Dossier rejeté',         icon: '❌', color: 'bg-red-100 text-red-700' },
  DOSSIER_SOUMIS:  { label: 'Dossier soumis',         icon: '📤', color: 'bg-purple-100 text-purple-700' },
  DOSSIER_MODIFIE: { label: 'Dossier modifié',        icon: '✏️', color: 'bg-yellow-100 text-yellow-700' },
  ACCES_REFUSE:    { label: 'Accès refusé (sécurité)', icon: '🔒', color: 'bg-red-100 text-red-700' },
};

async function fetchHistorique(dossierId, filtres = {}) {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  if (filtres.dateDebut) params.append('dateDebut', filtres.dateDebut);
  if (filtres.dateFin)   params.append('dateFin',   filtres.dateFin);
  if (filtres.typeAction) params.append('typeAction', filtres.typeAction);

  const url = `${BASE_URL}/history/${dossierId}${params.toString() ? '?' + params : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erreur API');
  return res.json();
}

export default function HistoriqueActions({ dossierId, nomCandidat }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [erreur, setErreur]     = useState('');
  const [filtres, setFiltres]   = useState({ dateDebut: '', dateFin: '', typeAction: '' });
  const [filtresOuverts, setFiltresOuverts] = useState(false);

  const charger = async () => {
    if (!dossierId) return;
    setLoading(true);
    setErreur('');
    try {
      const result = await fetchHistorique(dossierId, filtres);
      setData(result);
    } catch (err) {
      setErreur('Impossible de charger l\'historique.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, [dossierId]);

  const handleFiltrer = (e) => {
    e.preventDefault();
    charger();
  };

  const handleExportCSV = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/history/export/csv/${dossierId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique_${dossierId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const actions = data?.actions || [];

  return (
    <div className='bg-white rounded-xl shadow p-6 space-y-4'>

      {/* En-tête */}
      <div className='flex items-center justify-between flex-wrap gap-2'>
        <div>
          <h2 className='text-lg font-bold text-gray-800'>Historique des actions</h2>
          {nomCandidat && <p className='text-sm text-gray-500'>{nomCandidat}</p>}
        </div>
        <div className='flex gap-2'>
          <button
            onClick={() => setFiltresOuverts(!filtresOuverts)}
            className='text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-1'
          >
            🔍 Filtres {filtresOuverts ? '▲' : '▼'}
          </button>
          <button
            onClick={handleExportCSV}
            className='text-sm bg-blue-900 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 flex items-center gap-1'
          >
            📥 CSV
          </button>
        </div>
      </div>

      {/* Panneau de filtres */}
      {filtresOuverts && (
        <form onSubmit={handleFiltrer} className='bg-gray-50 rounded-lg p-4 space-y-3'>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            <div>
              <label className='text-xs text-gray-500 block mb-1'>Date début</label>
              <input
                type='date'
                value={filtres.dateDebut}
                onChange={e => setFiltres(f => ({ ...f, dateDebut: e.target.value }))}
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500'
              />
            </div>
            <div>
              <label className='text-xs text-gray-500 block mb-1'>Date fin</label>
              <input
                type='date'
                value={filtres.dateFin}
                onChange={e => setFiltres(f => ({ ...f, dateFin: e.target.value }))}
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500'
              />
            </div>
            <div>
              <label className='text-xs text-gray-500 block mb-1'>Type d'action</label>
              <select
                value={filtres.typeAction}
                onChange={e => setFiltres(f => ({ ...f, typeAction: e.target.value }))}
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white'
              >
                <option value=''>Tous les types</option>
                {Object.entries(TYPE_LABELS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className='flex gap-2'>
            <button type='submit' className='bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600'>
              Appliquer
            </button>
            <button
              type='button'
              onClick={() => { setFiltres({ dateDebut: '', dateFin: '', typeAction: '' }); charger(); }}
              className='border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50'
            >
              Réinitialiser
            </button>
          </div>
        </form>
      )}

      {/* Contenu */}
      {loading ? (
        <div className='space-y-3'>
          {[1, 2, 3].map(i => (
            <div key={i} className='animate-pulse flex gap-3'>
              <div className='w-8 h-8 bg-gray-200 rounded-full' />
              <div className='flex-1 space-y-2'>
                <div className='h-3 bg-gray-200 rounded w-1/3' />
                <div className='h-3 bg-gray-200 rounded w-2/3' />
              </div>
            </div>
          ))}
        </div>
      ) : erreur ? (
        <div className='text-center py-8 text-red-500'>
          <p className='text-2xl mb-2'>⚠️</p>
          <p className='text-sm'>{erreur}</p>
          <button onClick={charger} className='mt-2 text-sm text-orange-500 hover:underline'>Réessayer</button>
        </div>
      ) : actions.length === 0 ? (
        <div className='text-center py-8 text-gray-400'>
          <p className='text-3xl mb-2'>📋</p>
          <p className='text-sm'>Aucune action enregistrée pour ce dossier.</p>
        </div>
      ) : (
        <div className='space-y-3 max-h-96 overflow-y-auto pr-1'>
          {actions.map((action, i) => {
            const meta = TYPE_LABELS[action.typeAction] || { label: action.typeAction, icon: '•', color: 'bg-gray-100 text-gray-600' };
            const date = new Date(action.timestamp);
            return (
              <div key={action.id || i} className='flex gap-3 items-start'>
                {/* Ligne verticale */}
                <div className='flex flex-col items-center'>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${meta.color}`}>
                    {meta.icon}
                  </div>
                  {i < actions.length - 1 && <div className='w-px h-4 bg-gray-200 mt-1' />}
                </div>

                {/* Contenu */}
                <div className='flex-1 pb-2'>
                  <div className='flex items-center justify-between flex-wrap gap-1'>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className='text-xs text-gray-400'>
                      {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {action.utilisateur && (
                    <p className='text-xs text-gray-500 mt-0.5'>
                      Par <span className='font-medium'>{action.utilisateur.nom}</span>
                      {' '}({action.utilisateur.role})
                    </p>
                  )}
                  {action.details && typeof action.details === 'object' && action.details.message && (
                    <p className='text-xs text-gray-400 mt-0.5 italic'>"{action.details.message}"</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination info */}
      {data?.pagination && (
        <p className='text-xs text-gray-400 text-right'>
          {actions.length} / {data.pagination.total} action(s)
        </p>
      )}
    </div>
  );
}
