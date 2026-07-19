import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { concoursService, decService } from '../../services/api';
import DECLayout from '../../components/DECLayout';
import { BentoCard } from '../../components/AcademicLayout';

const BADGE = {
  EN_ATTENTE: 'bg-slate-50 text-slate-700 border-slate-200',
  ADMIS: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REFUSE: 'bg-rose-50 text-rose-800 border-rose-200',
};

export default function DECSelectionResultats() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [concoursList, setConcoursList] = useState([]);
  const [loadingConcours, setLoadingConcours] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [markingOthers, setMarkingOthers] = useState(false);
  const [cancellingAll, setCancellingAll] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [importReport, setImportReport] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [data, setData] = useState(null);

  const concoursId = searchParams.get('concoursId') || '';
  const resultat = searchParams.get('resultat') || 'tous';
  const centreId = searchParams.get('centreId') || '';
  const ville = searchParams.get('ville') || '';
  const sexe = searchParams.get('sexe') || '';
  const q = searchParams.get('q') || '';

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'concoursId') {
      next.delete('centreId');
      next.delete('ville');
      next.delete('q');
      next.delete('resultat');
      next.delete('sexe');
    }
    if (key === 'ville') next.delete('centreId');
    setSearchParams(next);
  };

  useEffect(() => {
    setLoadingConcours(true);
    setError('');
    concoursService
      .getAll()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res.concours || []);
        setConcoursList(list);
      })
      .catch((err) => setError(err.message || 'Impossible de charger les concours'))
      .finally(() => setLoadingConcours(false));
  }, []);

  const charger = useCallback(async () => {
    if (!concoursId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const params = { resultat };
      if (centreId) params.centreId = centreId;
      if (ville) params.ville = ville;
      if (sexe) params.sexe = sexe;
      if (q.trim()) params.q = q.trim();
      const res = await decService.getResultatsSelection(concoursId, params);
      setData(res);
    } catch (err) {
      setData(null);
      setError(err.message || 'Impossible de charger les résultats');
    } finally {
      setLoading(false);
    }
  }, [concoursId, resultat, centreId, ville, sexe, q]);

  useEffect(() => {
    charger();
  }, [charger]);

  const centresOptions = useMemo(() => {
    const all = data?.options?.centres || [];
    if (!ville) return all;
    return all.filter((c) => c.ville === ville);
  }, [data?.options?.centres, ville]);

  const counts = data?.counts;

  const decider = async (inscriptionId, decision) => {
    if (!concoursId) return;
    setBusyId(inscriptionId);
    setError('');
    setMessage('');
    try {
      const res = await decService.deciderResultatComposition(concoursId, inscriptionId, decision);
      setMessage(res.message || 'Décision enregistrée');
      await charger();
    } catch (err) {
      setError(err.message || 'Impossible d\'enregistrer la décision');
    } finally {
      setBusyId(null);
    }
  };

  const importerCsv = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !concoursId) return;
    setImporting(true);
    setError('');
    setMessage('');
    setImportReport(null);
    try {
      const res = await decService.importerAdmisCsv(concoursId, file);
      setMessage(res.message || 'Import terminé');
      setImportReport(res);
      await charger();
    } catch (err) {
      setError(err.message || 'Impossible d\'importer le CSV');
    } finally {
      setImporting(false);
    }
  };

  const marquerAutresRefuses = async () => {
    if (!concoursId) return;
    const ok = window.confirm(
      'Marquer comme refusés tous les candidats retenus qui ne sont pas encore admis ?'
    );
    if (!ok) return;
    setMarkingOthers(true);
    setError('');
    setMessage('');
    try {
      const res = await decService.marquerAutresRefuses(concoursId);
      setMessage(res.message || 'Candidats marqués comme refusés');
      await charger();
    } catch (err) {
      setError(err.message || 'Impossible de marquer les autres candidats');
    } finally {
      setMarkingOthers(false);
    }
  };

  const annulerToutesDecisions = async () => {
    if (!concoursId) return;
    const ok = window.confirm(
      'Annuler toutes les décisions (admis et refusés) et les remettre en attente ?'
    );
    if (!ok) return;
    setCancellingAll(true);
    setError('');
    setMessage('');
    try {
      const res = await decService.annulerToutesDecisions(concoursId);
      setMessage(res.message || 'Décisions annulées');
      await charger();
    } catch (err) {
      setError(err.message || 'Impossible d\'annuler les décisions');
    } finally {
      setCancellingAll(false);
    }
  };

  const buildExportParams = () => {
    const params = {};
    if (resultat && resultat !== 'tous') params.resultat = resultat;
    if (centreId) params.centreId = centreId;
    if (ville) params.ville = ville;
    if (sexe) params.sexe = sexe;
    if (q.trim()) params.q = q.trim();
    return params;
  };

  const genererPdf = async () => {
    if (!concoursId) return;
    if ((counts?.en_attente || 0) > 0) {
      setError('Finalisez toutes les décisions avant de générer le PDF.');
      return;
    }
    setExportingPdf(true);
    setError('');
    setMessage('');
    try {
      await decService.telechargerResultatsSelectionPdf(concoursId, buildExportParams());
      setMessage('PDF téléchargé');
    } catch (err) {
      setError(err.message || 'Impossible de générer le PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const genererCsv = async () => {
    if (!concoursId) return;
    if ((counts?.en_attente || 0) > 0) {
      setError('Finalisez toutes les décisions avant de générer le CSV.');
      return;
    }
    setExportingCsv(true);
    setError('');
    setMessage('');
    try {
      await decService.telechargerResultatsSelectionCsv(concoursId, buildExportParams());
      setMessage('CSV téléchargé');
    } catch (err) {
      setError(err.message || 'Impossible de générer le CSV');
    } finally {
      setExportingCsv(false);
    }
  };

  const exportDisponible = Boolean(
    counts && counts.total > 0 && counts.en_attente === 0
  );

  return (
    <DECLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sélection / Résultats</h1>
            <p className="text-sm text-slate-600 mt-1">
              Après composition, marquez les candidats retenus (dossiers validés) comme admis ou refusés.
            </p>
          </div>
          {concoursId && (
            <button
              type="button"
              onClick={() => navigate(`/dec-listes-retenus?concoursId=${encodeURIComponent(concoursId)}`)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              Listes des retenus
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-sm px-4 py-3">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm px-4 py-3">
            {message}
          </div>
        )}

        {concoursId && (
          <BentoCard className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Import CSV des admis</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fichier avec une colonne <span className="font-mono">numeroTable</span> (ou une liste
                  de N° de table, un par ligne). Les retenus correspondants seront marqués admis.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer disabled:opacity-50">
                {importing ? 'Import…' : 'Choisir un CSV'}
                <input
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  className="hidden"
                  disabled={importing}
                  onChange={importerCsv}
                />
              </label>
            </div>
            {importReport?.resume && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                  <p className="text-slate-500">Lus</p>
                  <p className="font-bold text-slate-900">{importReport.resume.lus}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                  <p className="text-emerald-700">Admis</p>
                  <p className="font-bold text-emerald-900">{importReport.resume.admis}</p>
                </div>
                <div className="rounded-lg bg-sky-50 border border-sky-100 px-3 py-2">
                  <p className="text-sky-700">Déjà admis</p>
                  <p className="font-bold text-sky-900">{importReport.resume.dejaAdmis}</p>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                  <p className="text-amber-700">Introuvables</p>
                  <p className="font-bold text-amber-900">{importReport.resume.introuvables}</p>
                </div>
                <div className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2">
                  <p className="text-rose-700">Non validés</p>
                  <p className="font-bold text-rose-900">{importReport.resume.nonValides}</p>
                </div>
              </div>
            )}
            {importReport?.introuvables?.length > 0 && (
              <p className="mt-2 text-[11px] text-amber-800 font-mono break-all">
                Introuvables : {importReport.introuvables.slice(0, 20).join(', ')}
                {importReport.introuvables.length > 20 ? '…' : ''}
              </p>
            )}
          </BentoCard>
        )}

        <BentoCard className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <label className="block text-sm">
              <span className="text-slate-600 font-medium">Concours</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white"
                value={concoursId}
                disabled={loadingConcours}
                onChange={(e) => setFilter('concoursId', e.target.value)}
              >
                <option value="">Choisir un concours…</option>
                {concoursList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.libelle}
                    {c.code ? ` (${c.code})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-slate-600 font-medium">Décision</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white"
                value={resultat}
                disabled={!concoursId}
                onChange={(e) => setFilter('resultat', e.target.value === 'tous' ? '' : e.target.value)}
              >
                {(data?.options?.resultats || [
                  { value: 'tous', label: 'Tous' },
                  { value: 'en_attente', label: 'En attente' },
                  { value: 'admis', label: 'Admis' },
                  { value: 'refuses', label: 'Refusés' },
                ]).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-slate-600 font-medium">Sexe</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white"
                value={sexe}
                disabled={!concoursId}
                onChange={(e) => setFilter('sexe', e.target.value === 'tous' ? '' : e.target.value)}
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
              <span className="text-slate-600 font-medium">Ville</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white"
                value={ville}
                disabled={!concoursId}
                onChange={(e) => setFilter('ville', e.target.value)}
              >
                <option value="">Toutes</option>
                {(data?.options?.villes || []).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-slate-600 font-medium">Centre</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white"
                value={centreId}
                disabled={!concoursId}
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

            <label className="block text-sm">
              <span className="text-slate-600 font-medium">Recherche</span>
              <input
                type="search"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white"
                placeholder="Nom, matricule, N° table…"
                value={q}
                disabled={!concoursId}
                onChange={(e) => setFilter('q', e.target.value)}
              />
            </label>
          </div>
        </BentoCard>

        {counts && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'tous', label: 'Retenus (validés)', value: counts.total },
              { key: 'en_attente', label: 'En attente', value: counts.en_attente },
              { key: 'admis', label: 'Admis', value: counts.admis },
              { key: 'refuses', label: 'Refusés', value: counts.refuses },
            ].map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilter('resultat', chip.key === 'tous' ? '' : chip.key)}
                className={`text-left rounded-xl border px-4 py-3 bg-white hover:shadow-sm transition ${
                  (resultat || 'tous') === chip.key ? 'ring-2 ring-slate-400 border-slate-300' : 'border-slate-200'
                }`}
              >
                <p className="text-xs text-slate-500">{chip.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{chip.value}</p>
              </button>
            ))}
          </div>
        )}

        {!concoursId && (
          <BentoCard className="p-8 text-center text-slate-500 text-sm">
            Sélectionnez un concours pour décider des admissions après composition.
          </BentoCard>
        )}

        {concoursId && loading && (
          <BentoCard className="p-8 text-center text-slate-500 text-sm">Chargement…</BentoCard>
        )}

        {concoursId && !loading && data && (
          <BentoCard className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{data.concours?.libelle}</p>
                <p className="text-xs text-slate-500">
                  {data.total} candidat{data.total > 1 ? 's' : ''} · décisions sur dossiers validés uniquement
                  {!exportDisponible && counts?.total > 0 && (
                    <span className="text-amber-700">
                      {' '}· Export disponible lorsque plus aucune décision n&apos;est en attente
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!exportDisponible || exportingPdf || exportingCsv || data.total === 0}
                  title={
                    exportDisponible
                      ? 'Exporter le PDF selon les filtres de la page'
                      : 'Toutes les décisions doivent être prises (0 en attente)'
                  }
                  onClick={genererPdf}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40"
                >
                  {exportingPdf ? 'Génération…' : 'Générer le PDF'}
                </button>
                <button
                  type="button"
                  disabled={!exportDisponible || exportingPdf || exportingCsv || data.total === 0}
                  title={
                    exportDisponible
                      ? 'Exporter le CSV selon les filtres de la page'
                      : 'Toutes les décisions doivent être prises (0 en attente)'
                  }
                  onClick={genererCsv}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-40"
                >
                  {exportingCsv ? 'Génération…' : 'Générer le CSV'}
                </button>
              </div>
            </div>

            {data.candidats.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                Aucun candidat validé pour ces filtres.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <div className="px-4 pt-3 pb-1 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={
                      cancellingAll || markingOthers || !(counts?.admis || counts?.refuses)
                    }
                    onClick={annulerToutesDecisions}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    {cancellingAll ? 'Traitement…' : 'Annuler toutes les décisions'}
                  </button>
                  <button
                    type="button"
                    disabled={markingOthers || cancellingAll || !counts?.en_attente}
                    onClick={marquerAutresRefuses}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40"
                  >
                    {markingOthers ? 'Traitement…' : 'Marquer les autres candidats comme refusés'}
                  </button>
                </div>
                <table className="min-w-full text-sm">
                  <thead className="bg-white border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Candidat</th>
                      <th className="px-4 py-3 font-semibold">Sexe</th>
                      <th className="px-4 py-3 font-semibold">N° table</th>
                      <th className="px-4 py-3 font-semibold">Centre</th>
                      <th className="px-4 py-3 font-semibold">Décision</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.candidats.map((row) => {
                      const busy = busyId === row.inscriptionId;
                      return (
                        <tr key={row.inscriptionId} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">
                              {row.candidat?.nom} {row.candidat?.prenom}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">
                              {row.candidat?.matricule || '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {row.candidat?.sexe === 'M'
                              ? 'Masculin'
                              : row.candidat?.sexe === 'F'
                                ? 'Féminin'
                                : '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {row.numeroTable || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {row.centre ? (
                              <>
                                <p>{row.centre.nom}</p>
                                <p className="text-xs text-slate-500">{row.centre.ville}</p>
                              </>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                BADGE[row.resultatComposition] || BADGE.EN_ATTENTE
                              }`}
                            >
                              {row.resultatLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                disabled={busy || row.resultatComposition === 'ADMIS'}
                                onClick={() => decider(row.inscriptionId, 'ADMIS')}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                              >
                                Admis
                              </button>
                              <button
                                type="button"
                                disabled={busy || row.resultatComposition === 'REFUSE'}
                                onClick={() => decider(row.inscriptionId, 'REFUSE')}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40"
                              >
                                Refusé
                              </button>
                              {row.resultatComposition !== 'EN_ATTENTE' && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => decider(row.inscriptionId, 'EN_ATTENTE')}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                                >
                                  Annuler
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>
        )}
      </div>
    </DECLayout>
  );
}
