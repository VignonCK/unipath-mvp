// src/pages/DashboardDEC.jsx
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
import { decService } from '../services/api';
import DECLayout from '../components/DECLayout';
import { BentoCard } from '../components/AcademicLayout';

const PIE_COLORS = ['#0f766e', '#be123c', '#64748b', '#2563eb', '#d97706', '#7c3aed', '#dc2626'];

const ETUDE_BADGE = {
  non_lancee: 'bg-slate-100 text-slate-700',
  planifiee: 'bg-sky-50 text-sky-800',
  en_cours: 'bg-amber-50 text-amber-800',
  terminee_non_cloturee: 'bg-orange-50 text-orange-800',
  cloturee: 'bg-emerald-50 text-emerald-800',
};

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

export default function DashboardDEC() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const anneeAcademiqueId = searchParams.get('anneeAcademiqueId') || '';
  const toutesAnnees = searchParams.get('toutesAnnees') === '1';
  const concoursId = searchParams.get('concoursId') || '';
  const etablissement = searchParams.get('etablissement') || '';
  const ville = searchParams.get('ville') || '';
  const centreId = searchParams.get('centreId') || '';
  const sexe = searchParams.get('sexe') || '';

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);

    if (key === 'anneeAcademiqueId') {
      next.delete('toutesAnnees');
      next.delete('concoursId');
      next.delete('etablissement');
      next.delete('ville');
      next.delete('centreId');
    }
    if (key === 'toutesAnnees') {
      next.delete('anneeAcademiqueId');
      next.delete('concoursId');
      next.delete('etablissement');
      next.delete('ville');
      next.delete('centreId');
    }
    if (key === 'etablissement' || key === 'concoursId') {
      next.delete('ville');
      next.delete('centreId');
    }
    if (key === 'ville') next.delete('centreId');
    setSearchParams(next);
  };

  const buildFilterParams = () => {
    const params = {};
    if (toutesAnnees) params.toutesAnnees = '1';
    else if (anneeAcademiqueId) params.anneeAcademiqueId = anneeAcademiqueId;
    if (concoursId) params.concoursId = concoursId;
    if (etablissement) params.etablissement = etablissement;
    if (ville) params.ville = ville;
    if (centreId) params.centreId = centreId;
    if (sexe) params.sexe = sexe;
    return params;
  };

  const charger = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await decService.getTableauDeBord(buildFilterParams());
      setData(res);
    } catch (err) {
      setData(null);
      setError(err.message || 'Impossible de charger le tableau de bord');
    } finally {
      setLoading(false);
    }
  }, [anneeAcademiqueId, toutesAnnees, concoursId, etablissement, ville, centreId, sexe]);

  useEffect(() => {
    charger();
  }, [charger]);

  const exporter = async (format) => {
    setExporting(true);
    setError('');
    try {
      const params = buildFilterParams();
      if (format === 'pdf') {
        await decService.telechargerTableauDeBordPdf(params);
      } else {
        await decService.telechargerTableauDeBordExcel(params);
      }
    } catch (err) {
      setError(err.message || 'Impossible d\'exporter les statistiques');
    } finally {
      setExporting(false);
    }
  };

  const centresOptions = useMemo(() => {
    const all = data?.options?.centres || [];
    if (!ville) return all;
    return all.filter((c) => c.ville === ville);
  }, [data?.options?.centres, ville]);

  const concoursOptions = useMemo(() => {
    const all = data?.options?.concours || [];
    if (!etablissement) return all;
    return all.filter((c) => c.etablissement === etablissement);
  }, [data?.options?.concours, etablissement]);

  const chartDossiers = useMemo(
    () => (data?.dossiersParStatut || []).filter((d) => d.value > 0),
    [data]
  );

  const chartResultats = useMemo(
    () => (data?.resultatsComposition || []).filter((d) => d.value > 0),
    [data]
  );

  const chartParConcours = useMemo(
    () =>
      (data?.parConcours || [])
        .filter((c) => c.inscrits > 0)
        .slice(0, 12)
        .map((c) => ({
          name: c.libelle.length > 16 ? `${c.libelle.slice(0, 16)}…` : c.libelle,
          Retenus: c.retenus,
          Rejetés: c.rejetes,
          Intermédiaires: c.intermediaires,
          Admis: c.resultats?.ADMIS || 0,
          Refusés: c.resultats?.REFUSE || 0,
        })),
    [data]
  );

  const kpis = data?.kpis;

  return (
    <DECLayout>
      <div className="max-w-7xl mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6 animate-slide-in">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Tableau de bord DEC</h1>
            <p className="text-sm text-slate-500 mt-1">
              Vue d&apos;ensemble des concours, dossiers, retenus et résultats de sélection
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
              {exporting ? 'Export…' : 'Générer Excel'}
            </button>
            <button
              type="button"
              onClick={charger}
              disabled={loading || exporting}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50"
            >
              Actualiser
            </button>
          </div>
        </div>

        <BentoCard className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <label className="block text-sm xl:col-span-1">
              <span className="text-slate-600 font-medium text-xs">Année académique</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-sm"
                value={toutesAnnees ? '__all__' : anneeAcademiqueId}
                onChange={(e) => {
                  if (e.target.value === '__all__') {
                    setFilter('toutesAnnees', '1');
                  } else {
                    setFilter('anneeAcademiqueId', e.target.value);
                  }
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
              <span className="text-slate-600 font-medium text-xs">Établissement</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-sm"
                value={etablissement}
                onChange={(e) => setFilter('etablissement', e.target.value)}
              >
                <option value="">Tous</option>
                {(data?.options?.etablissements || []).map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-slate-600 font-medium text-xs">Concours</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-sm"
                value={concoursId}
                onChange={(e) => setFilter('concoursId', e.target.value)}
              >
                <option value="">Tous</option>
                {concoursOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.libelle}
                    {c.code ? ` (${c.code})` : ''}
                  </option>
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
              <span className="text-slate-600 font-medium text-xs">Centre</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white text-sm"
                value={centreId}
                onChange={(e) => setFilter('centreId', e.target.value)}
              >
                <option value="">Tous</option>
                {centresOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ville} — {c.nom}
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
              <KpiCard label="Concours" value={kpis.concours} tone="slate" />
              <KpiCard label="Inscrits" value={kpis.inscrits} tone="orange" />
              <KpiCard
                label="Retenus (validés)"
                value={kpis.retenus}
                hint={`${kpis.tauxValidation}% des inscrits`}
                tone="emerald"
              />
              <KpiCard label="Rejetés" value={kpis.rejetes} tone="rose" />
              <KpiCard label="Pipeline intermédiaire" value={kpis.intermediaires} tone="amber" />
              <KpiCard
                label="Admis"
                value={kpis.admis}
                hint={`${kpis.tauxAdmission}% des retenus`}
                tone="teal"
              />
              <KpiCard label="Refusés (sélection)" value={kpis.refuses} tone="indigo" />
              <KpiCard
                label="Décision en attente"
                value={kpis.resultatsEnAttente}
                hint="Sur retenus"
                tone="sky"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <BentoCard className="p-4">
                <h2 className="text-sm font-bold text-slate-800 mb-3">Étude des dossiers</h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ['Non lancée', kpis.etude?.non_lancee],
                    ['Planifiée', kpis.etude?.planifiee],
                    ['En cours', kpis.etude?.en_cours],
                    ['Terminée non clôturée', kpis.etude?.terminee_non_cloturee],
                    ['Clôturée', kpis.etude?.cloturee],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                      <p className="text-slate-500">{label}</p>
                      <p className="text-lg font-bold text-slate-900">{value ?? 0}</p>
                    </div>
                  ))}
                </div>
              </BentoCard>

              <BentoCard className="p-4">
                <h2 className="text-sm font-bold text-slate-800 mb-3">Commission & centres</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">Concours avec commission</span>
                    <span className="font-bold text-emerald-700">{kpis.commission?.avecAffectation ?? 0}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">Sans affectation</span>
                    <span className="font-bold text-rose-700">{kpis.commission?.sansAffectation ?? 0}</span>
                  </div>
                  <div className="flex justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-600">Centres actifs</span>
                    <span className="font-bold">{kpis.centresActifs ?? 0}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">Places occupées / capacité</span>
                    <span className="font-bold">
                      {kpis.placesOccupeesCentres ?? 0}
                      {kpis.capaciteTotale ? ` / ${kpis.capaciteTotale}` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">Avec N° de table</span>
                    <span className="font-bold">{kpis.avecNumeroTable ?? 0}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600">Avec centre choisi</span>
                    <span className="font-bold">{kpis.avecCentre ?? 0}</span>
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
                        <span>{row.inscrits} inscrits</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {row.retenus} retenus · {row.admis} admis · {row.refuses} refusés
                      </p>
                    </div>
                  ))}
                </div>
              </BentoCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BentoCard className="p-5">
                <h2 className="text-base font-bold text-slate-800 mb-4">Pipeline des dossiers</h2>
                {chartDossiers.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">Aucune donnée</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={chartDossiers}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ label, value }) => `${label}: ${value}`}
                      >
                        {chartDossiers.map((entry, index) => (
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
                <h2 className="text-base font-bold text-slate-800 mb-4">
                  Résultats de sélection (retenus)
                </h2>
                {chartResultats.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">
                    Aucun retenu / aucune décision pour ces filtres
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartResultats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" name="Candidats" radius={[6, 6, 0, 0]}>
                        {chartResultats.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={
                              entry.key === 'ADMIS'
                                ? '#0f766e'
                                : entry.key === 'REFUSE'
                                  ? '#be123c'
                                  : '#64748b'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </BentoCard>
            </div>

            <BentoCard className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-base font-bold text-slate-800">Inscriptions & sélection par concours</h2>
                <span className="text-xs text-slate-400">
                  {chartParConcours.length} concours affiché{chartParConcours.length > 1 ? 's' : ''}
                </span>
              </div>
              {chartParConcours.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">Aucun concours avec inscriptions</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartParConcours} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Intermédiaires" stackId="d" fill="#F59E0B" />
                    <Bar dataKey="Retenus" stackId="d" fill="#10B981" />
                    <Bar dataKey="Rejetés" stackId="d" fill="#EF4444" />
                    <Bar dataKey="Admis" fill="#0f766e" />
                    <Bar dataKey="Refusés" fill="#be123c" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </BentoCard>

            <BentoCard className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-slate-800">Détail par concours</h2>
                <span className="text-xs text-slate-400">{data.parConcours?.length || 0} concours</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[960px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                      {[
                        'Concours',
                        'Étude',
                        'Inscrits',
                        'Retenus',
                        'Rejetés',
                        'Interméd.',
                        'Admis',
                        'Refusés',
                        'Att. déc.',
                        'Taux val.',
                        'Actions',
                      ].map((h) => (
                        <th key={h} className="px-3 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(data.parConcours || []).map((row) => (
                      <tr key={row.concoursId} className="hover:bg-slate-50/80">
                        <td className="px-3 py-3">
                          <p className="font-medium text-slate-900">{row.libelle}</p>
                          <p className="text-xs text-slate-500">
                            {row.etablissement || '—'}
                            {row.code ? ` · ${row.code}` : ''}
                            {!row.commissionAffectee ? ' · sans commission' : ''}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${ETUDE_BADGE[row.etude] || 'bg-slate-100'}`}>
                            {row.etudeLabel}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-bold">{row.inscrits}</td>
                        <td className="px-3 py-3 text-emerald-700 font-semibold">{row.retenus}</td>
                        <td className="px-3 py-3 text-rose-600 font-semibold">{row.rejetes}</td>
                        <td className="px-3 py-3 text-amber-700 font-semibold">{row.intermediaires}</td>
                        <td className="px-3 py-3 text-teal-700 font-semibold">{row.resultats?.ADMIS || 0}</td>
                        <td className="px-3 py-3 text-rose-700 font-semibold">{row.resultats?.REFUSE || 0}</td>
                        <td className="px-3 py-3 text-slate-600">{row.resultats?.EN_ATTENTE || 0}</td>
                        <td className="px-3 py-3 text-xs font-bold">{row.tauxValidation}%</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1 text-xs font-semibold">
                            <Link
                              className="text-teal-700 hover:underline"
                              to={`/dec-selection-resultats?concoursId=${encodeURIComponent(row.concoursId)}`}
                            >
                              Sélection
                            </Link>
                            <Link
                              className="text-slate-600 hover:underline"
                              to={`/dec-listes-retenus?concoursId=${encodeURIComponent(row.concoursId)}`}
                            >
                              Retenus
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BentoCard>

            {(data.parCentre || []).length > 0 && (
              <BentoCard className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-800">Répartition par centre</h2>
                  <span className="text-xs text-slate-400">{data.parCentre.length} centres</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                        {['Ville', 'Centre', 'Inscrits', 'Retenus', 'Admis', 'Refusés', 'Att. déc.'].map((h) => (
                          <th key={h} className="px-3 py-3 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.parCentre.map((c) => (
                        <tr key={c.centreId} className="hover:bg-slate-50/80">
                          <td className="px-3 py-3 text-slate-700">{c.ville || '—'}</td>
                          <td className="px-3 py-3 font-medium text-slate-900">{c.centreNom}</td>
                          <td className="px-3 py-3 font-bold">{c.inscrits}</td>
                          <td className="px-3 py-3 text-emerald-700 font-semibold">{c.retenus}</td>
                          <td className="px-3 py-3 text-teal-700 font-semibold">{c.admis}</td>
                          <td className="px-3 py-3 text-rose-700 font-semibold">{c.refuses}</td>
                          <td className="px-3 py-3 text-slate-600">{c.resultatEnAttente}</td>
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
    </DECLayout>
  );
}
