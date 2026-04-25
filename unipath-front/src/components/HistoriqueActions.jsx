// src/components/HistoriqueActions.jsx
import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const TYPE_LABELS = {
  DOSSIER_CREE:    { label: 'Dossier créé',           color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  PIECE_AJOUTEE:   { label: 'Pièce ajoutée',           color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  PIECE_SUPPRIMEE: { label: 'Pièce supprimée',         color: 'bg-orange-100 text-orange-700',dot: 'bg-orange-500' },
  DOSSIER_VALIDE:  { label: 'Dossier validé',          color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  DOSSIER_REJETE:  { label: 'Dossier rejeté',          color: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
  DOSSIER_SOUMIS:  { label: 'Dossier soumis',          color: 'bg-purple-100 text-purple-700',dot: 'bg-purple-500' },
  DOSSIER_MODIFIE: { label: 'Dossier modifié',         color: 'bg-yellow-100 text-yellow-700',dot: 'bg-yellow-500' },
  ACCES_REFUSE:    { label: 'Accès refusé (sécurité)', color: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
};

async function fetchHistorique(dossierId, filtres = {}) {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  if (filtres.dateDebut)  params.append('dateDebut',  filtres.dateDebut);
  if (filtres.dateFin)    params.append('dateFin',    filtres.dateFin);
  if (filtres.typeAction) params.append('typeAction', filtres.typeAction);
  const url = `${BASE_URL}/history/${dossierId}${params.toString() ? '?' + params : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Erreur API');
  return res.json();
}

export default function HistoriqueActions({ dossierId, nomCandidat }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur]   = useState('');
  const [filtres, setFiltres] = useState({ dateDebut: '', dateFin: '', typeAction: '' });
  const [filtresOuverts, setFiltresOuverts] = useState(false);

  const charger = async () => {
    if (!dossierId) return;
    setLoading(true);
    setErreur('');
    try {
      const result = await fetchHistorique(dossierId, filtres);
      setData(result);
    } catch {
      setErreur('Impossible de charger l\'historique.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, [dossierId]);

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
    <div className='bg-white rounded-xl border border-gray-100 p-5 space-y-4'>

      {/* En-tête */}
      <div className='flex items-center justify-between flex-wrap gap-2'>
        <div>
          <h3 className='text-sm font-bold text-gray-800'>Historique des actions</h3>
          {nomCandidat && <p className='text-xs text-gray-400 mt-0.5'>{nomCandidat}</p>}
        </div>
        <div className='flex gap-2'>
          <button
            onClick={() => setFiltresOuverts(!filtresOuverts)}
            className='text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600'
          >
            Filtres {filtresOuverts ? '▲' : '▼'}
          </button>
          <button
            onClick={handleExportCSV}
            className='text-xs bg-blue-900 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800'
          >
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Filtres */}
      {filtresOuverts && (
        <form onSubmit={(e) => { e.preventDefault(); charger(); }} className='bg-gray-50 rounded-xl p-4 space-y-3'>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            <div>
              <label className='text-xs text-gray-500 block mb-1'>Date début</label>
              <input type='date' value={filtres.dateDebut}
                onChange={e => setFiltres(f => ({ ...f, dateDebut: e.target.value }))}
                className='w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500'
              />
            </div>
            <div>
              <label className='text-xs text-gray-500 block mb-1'>Date fin</label>
              <input type='date' value={filtres.dateFin}
                onChange={e => setFiltres(f => ({ ...f, dateFin: e.target.value }))}
                className='w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500'
              />
            </div>
            <div>
              <label className='text-xs text-gray-500 block mb-1'>Type d'action</label>
              <select value={filtres.typeAction}
                onChange={e => setFiltres(f => ({ ...f, typeAction: e.target.value }))}
                className='w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 bg-white'
              >
                <option value=''>Tous les types</option>
                {Object.entries(TYPE_LABELS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className='flex gap-2'>
            <button type='submit' className='bg-orange-500 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-orange-600'>
              Appliquer
            </button>
            <button type='button'
              onClick={() => { setFiltres({ dateDebut: '', dateFin: '', typeAction: '' }); charger(); }}
              className='border border-gray-200 px-4 py-1.5 rounded-lg text-xs hover:bg-gray-50 text-gray-600'
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
              <div className='w-7 h-7 bg-gray-200 rounded-full flex-shrink-0' />
              <div className='flex-1 space-y-1.5'>
                <div className='h-3 bg-gray-200 rounded w-1/3' />
                <div className='h-3 bg-gray-200 rounded w-2/3' />
              </div>
            </div>
          ))}
        </div>
      ) : erreur ? (
        <div className='text-center py-6'>
          <p className='text-red-500 text-sm'>{erreur}</p>
          <button onClick={charger} className='mt-2 text-xs text-orange-500 hover:underline'>Réessayer</button>
        </div>
      ) : actions.length === 0 ? (
        <p className='text-center text-gray-400 text-sm py-6'>Aucune action enregistrée pour ce dossier.</p>
      ) : (
        <div className='space-y-3 max-h-80 overflow-y-auto pr-1'>
          {actions.map((action, i) => {
            const meta = TYPE_LABELS[action.typeAction] || { label: action.typeAction, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
            const date = new Date(action.timestamp);
            return (
              <div key={action.id || i} className='flex gap-3 items-start'>
                <div className='flex flex-col items-center flex-shrink-0'>
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 ${meta.dot}`} />
                  {i < actions.length - 1 && <div className='w-px flex-1 bg-gray-100 mt-1 min-h-[16px]' />}
                </div>
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
                      Par <span className='font-medium'>{action.utilisateur.nom}</span> ({action.utilisateur.role})
                    </p>
                  )}
                  {action.details?.message && (
                    <p className='text-xs text-gray-400 mt-0.5 italic'>"{action.details.message}"</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data?.pagination && (
        <p className='text-xs text-gray-400 text-right'>{actions.length} / {data.pagination.total} action(s)</p>
      )}
    </div>
  );
}
