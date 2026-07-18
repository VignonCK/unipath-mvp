// src/pages/DashboardDEC.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  decService,
  concoursService,
  centreCompositionService,
} from '../services/api';
import DECLayout from '../components/DECLayout';
import { BentoCard } from '../components/AcademicLayout';

const EMPTY_FILTERS = {
  etablissementId: '',
  concoursId: '',
  statut: '',
  sexe: '',
  centreId: '',
  anneeAcademique: '',
};

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'accepte', label: 'Accepté' },
  { value: 'rejete', label: 'Rejeté' },
  { value: 'attente', label: 'En attente' },
  { value: 'sous_reserve', label: 'Sous réserve' },
];

const SEXE_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'M', label: 'Masculin (M)' },
  { value: 'F', label: 'Féminin (F)' },
];

const SEXE_COLORS = {
  Masculin: '#2563EB',
  Féminin: '#DB2777',
  'Non renseigné': '#9CA3AF',
};

function buildFilterParams(filters) {
  const params = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params[key] = value;
  });
  return params;
}

function SexeRepartitionCard({ repartition, total }) {
  const masculin = Number(repartition?.M) || 0;
  const feminin = Number(repartition?.F) || 0;
  const nonRenseigne = Number(repartition?.non_renseigne) || 0;
  const safeTotal = Number(total) || 0;
  const pct = (n) => (safeTotal > 0 ? Math.round((n / safeTotal) * 100) : 0);

  const pieData = [
    { name: 'Masculin', value: masculin },
    { name: 'Féminin', value: feminin },
    ...(nonRenseigne > 0 ? [{ name: 'Non renseigné', value: nonRenseigne }] : []),
  ].filter((d) => d.value > 0);

  return (
    <BentoCard className='p-4 h-full'>
      <h3 className='text-sm font-bold text-gray-800 mb-3'>Répartition par sexe</h3>
      {safeTotal === 0 || pieData.length === 0 ? (
        <p className='text-xs text-gray-400 py-6 text-center'>Aucune donnée</p>
      ) : (
        <div className='flex flex-col sm:flex-row items-center gap-3'>
          <div className='w-full sm:w-36 h-36 shrink-0'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey='value'
                  nameKey='name'
                  cx='50%'
                  cy='50%'
                  innerRadius={28}
                  outerRadius={52}
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={SEXE_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className='space-y-1.5 text-sm w-full'>
            <li className='text-gray-700'>
              <span className='inline-block w-2.5 h-2.5 rounded-full bg-blue-600 mr-2 align-middle' />
              Masculin: <span className='font-semibold'>{masculin}</span>
              {' '}
              <span className='text-gray-400'>({pct(masculin)}%)</span>
            </li>
            <li className='text-gray-700'>
              <span className='inline-block w-2.5 h-2.5 rounded-full bg-pink-600 mr-2 align-middle' />
              Féminin: <span className='font-semibold'>{feminin}</span>
              {' '}
              <span className='text-gray-400'>({pct(feminin)}%)</span>
            </li>
            {nonRenseigne > 0 && (
              <li className='text-gray-700'>
                <span className='inline-block w-2.5 h-2.5 rounded-full bg-gray-400 mr-2 align-middle' />
                Non renseigné: <span className='font-semibold'>{nonRenseigne}</span>
                {' '}
                <span className='text-gray-400'>({pct(nonRenseigne)}%)</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </BentoCard>
  );
}

export default function DashboardDEC() {
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
    return decService.getStatistiques(buildFilterParams(filters))
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    concoursService.getAll()
      .then((rows) => setConcoursList(Array.isArray(rows) ? rows : []))
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
        (Array.isArray(rows) ? rows : []).forEach((row) => {
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
    (Array.isArray(concoursList) ? concoursList : []).forEach((c) => {
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
      await decService.exportStats(format, buildFilterParams(appliedFilters));
    } catch (err) {
      setError(err.message || 'Erreur export');
    } finally {
      setExportBusy(null);
    }
  };

  if (loading && !data) {
    return (
      <DECLayout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>
            <div className='w-10 h-10 border-4 border-emerald-900 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3' />
            <p className='text-gray-500 text-sm'>Chargement des statistiques...</p>
          </div>
        </div>
      </DECLayout>
    );
  }

  const chartData = data?.statistiques
    ?.filter((s) => Number(s.total_inscrits) > 0)
    .map((s) => ({
      name: s.concours.length > 18 ? `${s.concours.substring(0, 18)}…` : s.concours,
      'En attente': Number(s.en_attente),
      'Sous réserve': Number(s.sous_reserve),
      Validés: Number(s.dossiers_valides),
      Rejetés: Number(s.dossiers_rejetes),
    })) || [];

  const etablissementChartData = (data?.parEtablissement || [])
    .filter((s) => Number(s.nbCandidats) > 0)
    .map((s) => ({
      name: s.etablissement.length > 16 ? `${s.etablissement.substring(0, 16)}…` : s.etablissement,
      'En attente': Number(s.en_attente),
      'Sous réserve': Number(s.sous_reserve),
      Validés: Number(s.valides),
      Rejetés: Number(s.rejetes),
    }));

  const hasInscriptions = (data?.totaux?.total_inscrits ?? 0) > 0;

  const tauxGlobal = data?.totaux?.total_inscrits > 0
    ? Math.round((data.totaux.total_valides / data.totaux.total_inscrits) * 100)
    : 0;

  const activeMetaFilters = data?.meta?.filters;

  return (
    <DECLayout>
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

            <label className='block text-xs text-gray-500'>
              Année académique
              <input
                type='text'
                value={draftFilters.anneeAcademique}
                onChange={(e) => handleFilterChange('anneeAcademique', e.target.value)}
                placeholder='ex. 2026-2027'
                className='mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800'
              />
            </label>
          </div>

          <div className='flex flex-wrap gap-2 pt-1'>
            <button
              type='button'
              onClick={handleApplyFilters}
              disabled={loading}
              className='rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60'
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

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          <div className='lg:col-span-2 grid grid-cols-2 md:grid-cols-5 gap-4'>
            {[
              { label: 'Total inscrits', value: data?.totaux?.total_inscrits ?? 0, color: 'bg-orange-500', sub: 'text-orange-100' },
              { label: 'Validés', value: data?.totaux?.total_valides ?? 0, color: 'bg-green-600', sub: 'text-green-100' },
              { label: 'Rejetés', value: data?.totaux?.total_rejetes ?? 0, color: 'bg-red-600', sub: 'text-red-100' },
              { label: 'En attente', value: data?.totaux?.total_attente ?? 0, color: 'bg-yellow-500', sub: 'text-yellow-900' },
              { label: 'Sous réserve', value: data?.totaux?.total_sous_reserve ?? 0, color: 'bg-amber-700', sub: 'text-amber-100' },
            ].map((card) => (
              <div key={card.label} className={`${card.color} p-5 rounded-2xl shadow-lg`}>
                <p className='text-3xl font-black text-white'>{card.value}</p>
                <p className={`text-xs font-medium mt-1 ${card.sub}`}>{card.label}</p>
              </div>
            ))}
          </div>
          <SexeRepartitionCard
            repartition={data?.totaux?.repartition_sexe}
            total={data?.totaux?.total_inscrits ?? 0}
          />
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
                <Bar dataKey='Sous réserve' fill='#B45309' radius={[4, 4, 0, 0]} />
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
            <table className='w-full text-sm min-w-[720px]'>
              <thead>
                <tr className='bg-gray-50 border-b border-gray-100'>
                  {['Concours', 'Date début', 'Total', 'Validés', 'Rejetés', 'En attente', 'Sous réserve', 'Taux'].map((h) => (
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
                      <td className='px-4 py-3 text-amber-800 font-semibold'>{Number(s.sous_reserve)}</td>
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

        <BentoCard className='p-6'>
          <h2 className='text-base font-bold text-gray-800 mb-6'>Inscriptions par établissement</h2>
          {etablissementChartData.length === 0 ? (
            <p className='text-center text-gray-400 text-sm py-10'>
              Aucun établissement avec inscriptions pour ces filtres.
            </p>
          ) : (
            <ResponsiveContainer width='100%' height={280}>
              <BarChart data={etablissementChartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                <XAxis dataKey='name' angle={-30} textAnchor='end' interval={0} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar dataKey='En attente' fill='#F59E0B' radius={[4, 4, 0, 0]} />
                <Bar dataKey='Sous réserve' fill='#B45309' radius={[4, 4, 0, 0]} />
                <Bar dataKey='Validés' fill='#10B981' radius={[4, 4, 0, 0]} />
                <Bar dataKey='Rejetés' fill='#EF4444' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </BentoCard>

        <BentoCard className='p-0 overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
            <h2 className='text-base font-bold text-gray-800'>Par établissement</h2>
            <span className='text-xs text-gray-400'>{data?.parEtablissement?.length || 0} établissement(s)</span>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm min-w-[760px]'>
              <thead>
                <tr className='bg-gray-50 border-b border-gray-100'>
                  {['Établissement', 'Total inscrits', 'Validés', 'Rejetés', 'En attente', 'Sous réserve', 'Taux'].map((h) => (
                    <th key={h} className='px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {(data?.parEtablissement || []).map((s) => {
                  const total = Number(s.nbCandidats) || 0;
                  const valides = Number(s.valides) || 0;
                  const taux = total > 0 ? Math.round((valides / total) * 100) : 0;
                  return (
                    <tr key={s.etablissementId || s.etablissement} className='hover:bg-gray-50 transition'>
                      <td className='px-4 py-3 font-medium text-gray-800'>{s.etablissement}</td>
                      <td className='px-4 py-3 font-bold text-gray-900'>{total}</td>
                      <td className='px-4 py-3 text-green-700 font-semibold'>{valides}</td>
                      <td className='px-4 py-3 text-red-600 font-semibold'>{Number(s.rejetes)}</td>
                      <td className='px-4 py-3 text-yellow-600 font-semibold'>{Number(s.en_attente)}</td>
                      <td className='px-4 py-3 text-amber-800 font-semibold'>{Number(s.sous_reserve)}</td>
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
    </DECLayout>
  );
}
