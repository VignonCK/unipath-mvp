// src/pages/DashboardDGES.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  dgesService,
  concoursService,
  centreCompositionService,
} from '../services/api';
import DGESLayout from '../components/DGESLayout';
import { BentoCard } from '../components/AcademicLayout';

const EMPTY_FILTERS = {
  etablissementId: '',
  concoursId: '',
  statut: '',
  sexe: '',
  centreId: '',
};

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'accepte', label: 'Accepté' },
  { value: 'rejete', label: 'Rejeté' },
  { value: 'attente', label: 'En attente' },
];

const SEXE_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'M', label: 'Masculin (M)' },
  { value: 'F', label: 'Féminin (F)' },
];

function buildFilterParams(filters) {
  const params = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params[key] = value;
  });
  return params;
}

export default function DashboardDGES() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportBusy, setExportBusy] = useState(null);

  const [concoursList, setConcoursList] = useState([]);
  const [centresOptions, setCentresOptions] = useState([]);
  const [draftFilters, setDraftFilters] = useState({ ...EMPTY_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS });

  const loadStats = useCallback((filters) => {
    setLoading(true);
    setError('');
    return dgesService.getStatistiques(buildFilterParams(filters))
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    concoursService.getAll()
      .then(setConcoursList)
      .catch(() => setConcoursList([]));
    loadStats(EMPTY_FILTERS);
  }, [loadStats]);

  useEffect(() => {
    if (!draftFilters.concoursId) {
      setCentresOptions([]);
      return;
    }
    centreCompositionService.getConcoursCentres(draftFilters.concoursId)
      .then((rows) => {
        const unique = new Map();
        (rows || []).forEach((row) => {
          if (row.centreId && row.centre) {
            unique.set(row.centreId, row.centre);
          }
        });
        setCentresOptions([...unique.values()]);
      })
      .catch(() => setCentresOptions([]));
  }, [draftFilters.concoursId]);

  const etablissementOptions = useMemo(() => {
    const map = new Map();
    concoursList.forEach((c) => {
      const id = c.etablissementId || c.etablissementOrganisateur?.id;
      const nom = c.etablissementOrganisateur?.nom || c.etablissement || 'Non renseigné';
      if (id) map.set(id, nom);
    });
    return [...map.entries()]
      .map(([id, nom]) => ({ id, nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }, [concoursList]);

  const concoursOptions = useMemo(() => {
    let list = concoursList;
    if (draftFilters.etablissementId) {
      list = list.filter((c) =>
        c.etablissementId === draftFilters.etablissementId
        || c.etablissementOrganisateur?.id === draftFilters.etablissementId,
      );
    }
    return [...list].sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
  }, [concoursList, draftFilters.etablissementId]);

  const handleFilterChange = (field, value) => {
    setDraftFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'etablissementId') {
        next.concoursId = '';
        next.centreId = '';
      }
      if (field === 'concoursId') {
        next.centreId = '';
      }
      return next;
    });
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    loadStats(draftFilters);
  };

  const handleResetFilters = () => {
    setDraftFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setCentresOptions([]);
    loadStats(EMPTY_FILTERS);
  };

  const handleExport = async (format) => {
    try {
      setExportBusy(format);
      setError('');
      await dgesService.exportStats(format, buildFilterParams(appliedFilters));
    } catch (err) {
      setError(err.message || 'Erreur export');
    } finally {
      setExportBusy(null);
    }
  };

  if (loading && !data) {
    return (
      <DGESLayout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>
            <div className='w-10 h-10 border-4 border-blue-900 border-t-orange-500 rounded-full animate-spin mx-auto mb-3' />
            <p className='text-gray-500 text-sm'>Chargement des statistiques...</p>
          </div>
        </div>
      </DGESLayout>
    );
  }

  const chartData = data?.statistiques
    ?.filter((s) => Number(s.total_inscrits) > 0)
    .map((s) => ({
      name: s.concours.length > 18 ? `${s.concours.substring(0, 18)}…` : s.concours,
      'En attente': Number(s.en_attente),
      Validés: Number(s.dossiers_valides),
      Rejetés: Number(s.dossiers_rejetes),
    })) || [];

  const hasInscriptions = (data?.totaux?.total_inscrits ?? 0) > 0;

  const tauxGlobal = data?.totaux?.total_inscrits > 0
    ? Math.round((data.totaux.total_valides / data.totaux.total_inscrits) * 100)
    : 0;

  const activeMetaFilters = data?.meta?.filters;

  return (
    <DGESLayout>
      <div className='max-w-6xl mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6 animate-slide-in'>

        <BentoCard className='p-4 sm:p-5 space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <h2 className='text-base font-bold text-gray-800'>Filtres</h2>
            {loading && (
              <span className='text-xs text-gray-400'>Mise à jour...</span>
            )}
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
            <label className='block text-xs text-gray-500'>
              Établissement
              <select
                value={draftFilters.etablissementId}
                onChange={(e) => handleFilterChange('etablissementId', e.target.value)}
                className='mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800'
              >
                <option value=''>Tous les établissements</option>
                {etablissementOptions.map((e) => (
                  <option key={e.id} value={e.id}>{e.nom}</option>
                ))}
              </select>
            </label>

            <label className='block text-xs text-gray-500'>
              Concours
              <select
                value={draftFilters.concoursId}
                onChange={(e) => handleFilterChange('concoursId', e.target.value)}
                className='mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800'
              >
                <option value=''>Tous les concours</option>
                {concoursOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.libelle}</option>
                ))}
              </select>
            </label>

            <label className='block text-xs text-gray-500'>
              Statut
              <select
                value={draftFilters.statut}
                onChange={(e) => handleFilterChange('statut', e.target.value)}
                className='mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800'
              >
                {STATUT_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            <label className='block text-xs text-gray-500'>
              Sexe
              <select
                value={draftFilters.sexe}
                onChange={(e) => handleFilterChange('sexe', e.target.value)}
                className='mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800'
              >
                {SEXE_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            <label className='block text-xs text-gray-500'>
              Centre de composition
              <select
                value={draftFilters.centreId}
                onChange={(e) => handleFilterChange('centreId', e.target.value)}
                disabled={!draftFilters.concoursId}
                className='mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 disabled:bg-gray-50 disabled:text-gray-400'
              >
                <option value=''>
                  {draftFilters.concoursId ? 'Tous les centres' : 'Choisir un concours d\'abord'}
                </option>
                {centresOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom} — {c.ville}</option>
                ))}
              </select>
            </label>
          </div>

          <div className='flex flex-wrap gap-2 pt-1'>
            <button
              type='button'
              onClick={handleApplyFilters}
              disabled={loading}
              className='rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60'
            >
              Appliquer
            </button>
            <button
              type='button'
              onClick={handleResetFilters}
              disabled={loading}
              className='rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60'
            >
              Réinitialiser
            </button>
            <button
              type='button'
              onClick={() => handleExport('excel')}
              disabled={exportBusy != null}
              className='rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-60'
            >
              {exportBusy === 'excel' ? 'Export...' : 'Export Excel'}
            </button>
            <button
              type='button'
              onClick={() => handleExport('pdf')}
              disabled={exportBusy != null}
              className='rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60'
            >
              {exportBusy === 'pdf' ? 'Export...' : 'Export PDF'}
            </button>
          </div>

          {activeMetaFilters && (
            <p className='text-xs text-gray-500'>
              Filtres actifs :
              {' '}
              {Object.entries(activeMetaFilters)
                .filter(([, v]) => v)
                .map(([k, v]) => `${k}=${v}`)
                .join(', ') || 'aucun'}
            </p>
          )}
        </BentoCard>

        {error && (
          <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
            {error}
          </div>
        )}

        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {[
            { label: 'Concours actifs', value: data?.totaux?.total_concours ?? 0, color: 'bg-blue-900', sub: 'text-blue-200' },
            { label: 'Total inscrits', value: data?.totaux?.total_inscrits ?? 0, color: 'bg-orange-500', sub: 'text-orange-100' },
            { label: 'Dossiers validés', value: data?.totaux?.total_valides ?? 0, color: 'bg-green-600', sub: 'text-green-100' },
            { label: 'En attente', value: data?.totaux?.total_attente ?? 0, color: 'bg-yellow-500', sub: 'text-yellow-900' },
          ].map((card) => (
            <div key={card.label} className={`${card.color} p-5 rounded-2xl shadow-lg`}>
              <p className='text-3xl font-black text-white'>{card.value}</p>
              <p className={`text-xs font-medium mt-1 ${card.sub}`}>{card.label}</p>
            </div>
          ))}
        </div>

        {!hasInscriptions && (
          <div className='rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900'>
            <p className='font-semibold'>Aucune inscription pour les filtres sélectionnés</p>
            <p className='mt-1 text-blue-700'>
              Ajustez les filtres ou réinitialisez pour voir l&apos;ensemble des données.
            </p>
          </div>
        )}

        {data?.totaux?.total_inscrits > 0 && (
          <BentoCard className='p-6'>
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
          </BentoCard>
        )}

        <BentoCard className='p-6'>
          <h2 className='text-base font-bold text-gray-800 mb-6'>Inscriptions par concours</h2>
          {chartData.length === 0 ? (
            <p className='text-center text-gray-400 text-sm py-10'>
              Aucun concours avec inscriptions pour ces filtres.
            </p>
          ) : (
            <ResponsiveContainer width='100%' height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                <XAxis dataKey='name' angle={-30} textAnchor='end' interval={0} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar dataKey='En attente' fill='#F59E0B' radius={[4, 4, 0, 0]} />
                <Bar dataKey='Validés' fill='#10B981' radius={[4, 4, 0, 0]} />
                <Bar dataKey='Rejetés' fill='#EF4444' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </BentoCard>

        <BentoCard className='p-0 overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
            <h2 className='text-base font-bold text-gray-800'>Détail par concours</h2>
            <span className='text-xs text-gray-400'>{data?.statistiques?.length || 0} concours</span>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm min-w-[640px]'>
              <thead>
                <tr className='bg-gray-50 border-b border-gray-100'>
                  {['Concours', 'Date début', 'Total', 'Validés', 'Rejetés', 'En attente', 'Taux'].map((h) => (
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
                        {s.dateDebut ? new Date(s.dateDebut).toLocaleDateString('fr-FR') : '—'}
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
        </BentoCard>

      </div>
    </DGESLayout>
  );
}
