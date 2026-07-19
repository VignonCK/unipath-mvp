// src/pages/DashboardDGES.jsx — Tableau de bord national Module 2
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dgesService } from '../services/api';
import DGESLayout from '../components/DGESLayout';
import { BentoCard } from '../components/AcademicLayout';

const PIE_COLORS = ['#ea580c', '#0f766e', '#be123c', '#64748b', '#2563eb', '#d97706', '#7c3aed'];

function KpiCard({ label, value, hint, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-900 text-white',
    teal: 'bg-teal-700 text-white',
    emerald: 'bg-emerald-600 text-white',
    rose: 'bg-rose-600 text-white',
    amber: 'bg-amber-500 text-slate-900',
    indigo: 'bg-indigo-700 text-white',
    orange: 'bg-orange-500 text-white',
    sky: 'bg-sky-600 text-white',
  };
  return (
    <div className={`${tones[tone] || tones.slate} p-4 rounded-2xl shadow-sm`}>
      <p className="text-2xl sm:text-3xl font-black tabular-nums">{value}</p>
      <p className="text-xs font-medium mt-1 opacity-90">{label}</p>
      {hint != null && hint !== '' && (
        <p className="text-[11px] mt-1 opacity-75">{hint}</p>
      )}
    </div>
  );
}

export default function DashboardDGES() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const anneeAcademiqueId = searchParams.get('anneeAcademiqueId') || '';
  const toutesAnnees = searchParams.get('toutesAnnees') === '1';
  const etablissementId = searchParams.get('etablissementId') || '';
  const filiereId = searchParams.get('filiereId') || '';
  const ville = searchParams.get('ville') || '';
  const niveau = searchParams.get('niveau') || '';
  const sexe = searchParams.get('sexe') || '';

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);

    if (key === 'anneeAcademiqueId') {
      next.delete('toutesAnnees');
    }
    if (key === 'toutesAnnees') {
      next.delete('anneeAcademiqueId');
    }
    if (key === 'ville' || key === 'etablissementId') {
      next.delete('filiereId');
    }
    if (key === 'etablissementId') {
      // keep filiere only if still matching — cleared above via ville/etab
    }
    setSearchParams(next);
  };

  const buildFilterParams = () => {
    const params = {};
    if (toutesAnnees) params.toutesAnnees = '1';
    else if (anneeAcademiqueId) params.anneeAcademiqueId = anneeAcademiqueId;
    if (etablissementId) params.etablissementId = etablissementId;
    if (filiereId) params.filiereId = filiereId;
    if (ville) params.ville = ville;
    if (niveau) params.niveau = niveau;
    if (sexe) params.sexe = sexe;
    return params;
  };

  const charger = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dgesService.getTableauDeBord(buildFilterParams());
      setData(res);
    } catch (err) {
      setData(null);
      setError(err.message || 'Impossible de charger le tableau de bord');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- params from URL
  }, [anneeAcademiqueId, toutesAnnees, etablissementId, filiereId, ville, niveau, sexe]);

  useEffect(() => {
    charger();
  }, [charger]);

  const exporter = async (format) => {
    setExporting(true);
    setError('');
    try {
      const params = buildFilterParams();
      if (format === 'pdf') {
        await dgesService.telechargerTableauDeBordPdf(params);
      } else {
        await dgesService.telechargerTableauDeBordExcel(params);
      }
    } catch (err) {
      setError(err.message || "Impossible d'exporter les statistiques");
    } finally {
      setExporting(false);
    }
  };

  const etablissementsOptions = useMemo(() => {
    const all = data?.options?.etablissements || [];
    if (!ville) return all;
    return all.filter((e) => e.ville === ville);
  }, [data?.options?.etablissements, ville]);

  const filieresOptions = useMemo(() => {
    let all = data?.options?.filieres || [];
    if (etablissementId) all = all.filter((f) => f.etablissementId === etablissementId);
    else if (ville) {
      const ids = new Set(etablissementsOptions.map((e) => e.id));
      all = all.filter((f) => ids.has(f.etablissementId));
    }
    return all;
  }, [data?.options?.filieres, etablissementId, ville, etablissementsOptions]);

  const chartPre = useMemo(
    () => (data?.preinscriptionsParStatut || []).filter((d) => d.value > 0),
    [data]
  );
  const chartIns = useMemo(
    () => (data?.inscriptionsParStatut || []).filter((d) => d.value > 0),
    [data]
  );
  const chartApps = useMemo(
    () => (data?.applicationsParStatut || []).filter((d) => d.value > 0),
    [data]
  );
  const chartParNiveau = useMemo(
    () =>
      (data?.parNiveau || [])
        .filter((n) => n.candidatures + n.preinscriptions + n.inscriptions > 0)
        .map((n) => ({
          name: n.label,
          Candidatures: n.candidatures,
          Préinscriptions: n.preinscriptions,
          Inscriptions: n.inscriptions,
          Passants: n.passants,
          Redoublants: n.redoublants,
        })),
    [data]
  );
  const chartParEtab = useMemo(
    () =>
      (data?.parEtablissement || [])
        .filter((e) => e.inscriptions + e.preinscriptions + e.candidatures > 0)
        .slice(0, 12)
        .map((e) => ({
          name: e.nom.length > 18 ? `${e.nom.slice(0, 18)}…` : e.nom,
          Inscriptions: e.inscriptions,
          Préinscriptions: e.preinscriptions,
          Candidatures: e.candidatures,
        })),
    [data]
  );

  const kpis = data?.kpis;

  return (
    <DGESLayout>
      <div className="max-w-7xl mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6 animate-slide-in">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Tableau de bord DGES</h1>
            <p className="text-sm text-slate-500 mt-1">
              Vue nationale Module 2 — établissements privés, campagnes, candidatures,
              préinscriptions et inscriptions académiques
              {data?.scope?.annee?.libelle
                ? ` · ${data.scope.annee.libelle}`
                : data?.scope?.scope === 'all'
                  ? ' · toutes les années'
                  : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exporter('pdf')}
              disabled={loading || exporting || !data}
              className="px-3 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {exporting ? 'Export…' : 'Générer le PDF'}
            </button>
            <button
              type="button"
              onClick={() => exporter('excel')}
              disabled={loading || exporting || !data}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              {exporting ? 'Export…' : 'Exporter Excel'}
            </button>
            <button
              type="button"
              onClick={charger}
              disabled={loading || exporting}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50"
            >
              Actualiser
            </button>
            <Link
              to="/dges-etablissements-admins"
              className="px-3 py-2 text-sm rounded-lg border border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100"
            >
              Gérer les établissements
            </Link>
          </div>
        </div>

        <BentoCard className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <label className="block text-sm">
              <span className="text-slate-600 font-medium text-xs">Année académique</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-sm"
                value={toutesAnnees ? '__all__' : anneeAcademiqueId}
                onChange={(e) => {
                  if (e.target.value === '__all__') setFilter('toutesAnnees', '1');
                  else setFilter('anneeAcademiqueId', e.target.value);
                }}
              >
                <option value="">Année en cours</option>
                <option value="__all__">Toutes les années</option>
                {(data?.options?.annees || []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.libelle}
                    {a.enCours ? ' (en cours)' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-slate-600 font-medium text-xs">Ville</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-sm"
                value={ville}
                onChange={(e) => setFilter('ville', e.target.value)}
              >
                <option value="">Toutes</option>
                {(data?.options?.villes || []).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-slate-600 font-medium text-xs">Établissement</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-sm"
                value={etablissementId}
                onChange={(e) => setFilter('etablissementId', e.target.value)}
              >
                <option value="">Tous</option>
                {etablissementsOptions.map((e) => (
                  <option key={e.id} value={e.id}>{e.nom}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-slate-600 font-medium text-xs">Filière</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-sm"
                value={filiereId}
                onChange={(e) => setFilter('filiereId', e.target.value)}
              >
                <option value="">Toutes</option>
                {filieresOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                    {f.code ? ` (${f.code})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-slate-600 font-medium text-xs">Niveau d&apos;étude</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-sm"
                value={niveau}
                onChange={(e) => setFilter('niveau', e.target.value)}
              >
                <option value="">Tous</option>
                {(data?.options?.niveaux || []).map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-slate-600 font-medium text-xs">Sexe</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-sm"
                value={sexe}
                onChange={(e) => setFilter('sexe', e.target.value)}
              >
                {(data?.options?.sexes || [
                  { value: 'tous', label: 'Tous' },
                  { value: 'M', label: 'Masculin' },
                  { value: 'F', label: 'Féminin' },
                ]).map((o) => (
                  <option key={o.value} value={o.value === 'tous' ? '' : o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </BentoCard>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
            <button type="button" onClick={charger} className="ml-3 underline">
              Réessayer
            </button>
          </div>
        )}

        {loading && !data ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-slate-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : data && kpis ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
              <KpiCard label="Établissements" value={kpis.etablissements} tone="slate" />
              <KpiCard label="Filières" value={kpis.filieres} tone="indigo" />
              <KpiCard
                label="Campagnes"
                value={kpis.campagnes}
                hint={`${kpis.campagnesPubliees} publiée(s)`}
                tone="orange"
              />
              <KpiCard label="Candidatures" value={kpis.candidatures} tone="sky" />
              <KpiCard
                label="Préinscriptions"
                value={kpis.preinscriptions}
                hint={`${kpis.tauxValidationPre}% validées`}
                tone="amber"
              />
              <KpiCard label="Préinsc. validées" value={kpis.preValidees} tone="emerald" />
              <KpiCard
                label="Inscriptions"
                value={kpis.inscriptions}
                hint={`${kpis.inscriptionsEnCours} en cours`}
                tone="teal"
              />
              <KpiCard
                label="Passants / Redoublants"
                value={`${kpis.passants}/${kpis.redoublants}`}
                hint={`Réussite ${kpis.tauxReussite}%`}
                tone="rose"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <BentoCard className="p-4">
                <h2 className="text-sm font-bold text-slate-800 mb-3">Campagnes</h2>
                <div className="space-y-2 text-sm">
                  {(data.campagnesParStatut || []).map((row) => (
                    <div key={row.key} className="flex justify-between gap-2">
                      <span className="text-slate-600">{row.label}</span>
                      <span className="font-bold text-slate-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              </BentoCard>

              <BentoCard className="p-4">
                <h2 className="text-sm font-bold text-slate-800 mb-3">Demandes de filières</h2>
                <div className="space-y-2 text-sm">
                  {(data.demandesParStatut || []).map((row) => (
                    <div key={row.key} className="flex justify-between gap-2">
                      <span className="text-slate-600">{row.label}</span>
                      <span className="font-bold text-slate-900">{row.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-100">
                    <Link
                      to="/dges-demandes-filieres"
                      className="text-xs font-semibold text-orange-700 hover:underline"
                    >
                      Traiter les demandes →
                    </Link>
                  </div>
                </div>
              </BentoCard>

              <BentoCard className="p-4">
                <h2 className="text-sm font-bold text-slate-800 mb-3">Répartition par sexe</h2>
                <div className="space-y-3">
                  {(data.parSexe || []).map((row) => (
                    <div key={row.key} className="rounded-lg border border-slate-100 px-3 py-2">
                      <div className="flex justify-between text-sm font-semibold text-slate-800">
                        <span>{row.label}</span>
                        <span>{row.inscriptions} inscrits</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {row.candidatures} candidatures · {row.preValidees} préinsc. validées ·{' '}
                        {row.passants} passants · {row.redoublants} redoublants
                      </p>
                    </div>
                  ))}
                </div>
              </BentoCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <BentoCard className="p-5">
                <h2 className="text-base font-bold text-slate-800 mb-4">Préinscriptions</h2>
                {chartPre.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">Aucune donnée</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={chartPre}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ label, value }) => `${label}: ${value}`}
                      >
                        {chartPre.map((entry, index) => (
                          <Cell key={entry.key} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </BentoCard>

              <BentoCard className="p-5">
                <h2 className="text-base font-bold text-slate-800 mb-4">Inscriptions académiques</h2>
                {chartIns.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">Aucune donnée</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={chartIns}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ label, value }) => `${label}: ${value}`}
                      >
                        {chartIns.map((entry, index) => (
                          <Cell key={entry.key} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </BentoCard>

              <BentoCard className="p-5">
                <h2 className="text-base font-bold text-slate-800 mb-4">Pipeline candidatures</h2>
                {chartApps.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">Aucune donnée</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartApps}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" name="Dossiers" fill="#ea580c" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </BentoCard>
            </div>

            <BentoCard className="p-5">
              <h2 className="text-base font-bold text-slate-800 mb-4">Volumes par niveau d&apos;étude</h2>
              {chartParNiveau.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartParNiveau}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Candidatures" fill="#38bdf8" />
                    <Bar dataKey="Préinscriptions" fill="#f59e0b" />
                    <Bar dataKey="Inscriptions" fill="#0f766e" />
                    <Bar dataKey="Passants" fill="#10b981" />
                    <Bar dataKey="Redoublants" fill="#e11d48" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </BentoCard>

            <BentoCard className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-base font-bold text-slate-800">Volumes par établissement</h2>
                <span className="text-xs text-slate-400">
                  Top {chartParEtab.length} établissement{chartParEtab.length > 1 ? 's' : ''}
                </span>
              </div>
              {chartParEtab.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartParEtab} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Candidatures" fill="#38bdf8" />
                    <Bar dataKey="Préinscriptions" fill="#f59e0b" />
                    <Bar dataKey="Inscriptions" fill="#0f766e" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </BentoCard>

            <BentoCard className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-slate-800">Détail par établissement</h2>
                <span className="text-xs text-slate-400">
                  {data.parEtablissement?.length || 0} établissement(s)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[960px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                      {[
                        'Établissement',
                        'Ville',
                        'Campagnes',
                        'Candidatures',
                        'Préinsc.',
                        'Validées',
                        'Inscriptions',
                        'En cours',
                        'Passants',
                        'Redoublants',
                        'Taux réuss.',
                      ].map((h) => (
                        <th key={h} className="px-3 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(data.parEtablissement || []).map((row) => (
                      <tr key={row.etablissementId} className="hover:bg-slate-50/80">
                        <td className="px-3 py-3 font-medium text-slate-900">{row.nom}</td>
                        <td className="px-3 py-3 text-slate-600">{row.ville || '—'}</td>
                        <td className="px-3 py-3">
                          {row.campagnes}
                          <span className="text-xs text-slate-400"> ({row.campagnesPubliees} pub.)</span>
                        </td>
                        <td className="px-3 py-3 font-bold">{row.candidatures}</td>
                        <td className="px-3 py-3">{row.preinscriptions}</td>
                        <td className="px-3 py-3 text-emerald-700 font-semibold">{row.preValidees}</td>
                        <td className="px-3 py-3 font-bold">{row.inscriptions}</td>
                        <td className="px-3 py-3 text-sky-700">{row.enCours}</td>
                        <td className="px-3 py-3 text-teal-700 font-semibold">{row.passants}</td>
                        <td className="px-3 py-3 text-rose-700 font-semibold">{row.redoublants}</td>
                        <td className="px-3 py-3 text-xs font-bold">{row.tauxReussite}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BentoCard>

            <BentoCard className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-slate-800">Détail par filière</h2>
                <span className="text-xs text-slate-400">{data.parFiliere?.length || 0} filière(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[880px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                      {[
                        'Filière',
                        'Établissement',
                        'Candidatures',
                        'Préinsc.',
                        'Inscriptions',
                        'En cours',
                        'Passants',
                        'Redoublants',
                        'Taux réuss.',
                      ].map((h) => (
                        <th key={h} className="px-3 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(data.parFiliere || []).slice(0, 40).map((row) => (
                      <tr key={row.filiereId} className="hover:bg-slate-50/80">
                        <td className="px-3 py-3">
                          <p className="font-medium text-slate-900">{row.nom}</p>
                          <p className="text-xs text-slate-400 font-mono">{row.code}</p>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{row.etablissementNom || '—'}</td>
                        <td className="px-3 py-3 font-bold">{row.candidatures}</td>
                        <td className="px-3 py-3">{row.preinscriptions}</td>
                        <td className="px-3 py-3 font-bold">{row.inscriptions}</td>
                        <td className="px-3 py-3 text-sky-700">{row.enCours}</td>
                        <td className="px-3 py-3 text-teal-700 font-semibold">{row.passants}</td>
                        <td className="px-3 py-3 text-rose-700 font-semibold">{row.redoublants}</td>
                        <td className="px-3 py-3 text-xs font-bold">{row.tauxReussite}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BentoCard>

            {(data.parVille || []).length > 0 && (
              <BentoCard className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-800">Répartition par ville</h2>
                  <span className="text-xs text-slate-400">{data.parVille.length} ville(s)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                        {['Ville', 'Établissements', 'Candidatures', 'Préinsc.', 'Inscriptions', 'Passants', 'Redoublants'].map((h) => (
                          <th key={h} className="px-3 py-3 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.parVille.map((c) => (
                        <tr key={c.ville} className="hover:bg-slate-50/80">
                          <td className="px-3 py-3 font-medium text-slate-900">{c.ville}</td>
                          <td className="px-3 py-3">{c.etablissements}</td>
                          <td className="px-3 py-3 font-bold">{c.candidatures}</td>
                          <td className="px-3 py-3">{c.preinscriptions}</td>
                          <td className="px-3 py-3 font-bold">{c.inscriptions}</td>
                          <td className="px-3 py-3 text-teal-700 font-semibold">{c.passants}</td>
                          <td className="px-3 py-3 text-rose-700 font-semibold">{c.redoublants}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </BentoCard>
            )}
          </>
        ) : null}
      </div>
    </DGESLayout>
  );
}
