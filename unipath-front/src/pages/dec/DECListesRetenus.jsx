import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { concoursService, decService } from '../../services/api';
import DECLayout from '../../components/DECLayout';
import { BentoCard } from '../../components/AcademicLayout';

export default function DECListesRetenus() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [concoursList, setConcoursList] = useState([]);
  const [loadingConcours, setLoadingConcours] = useState(true);
  const [loadingListe, setLoadingListe] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [liste, setListe] = useState(null);

  const concoursId = searchParams.get('concoursId') || '';
  const centreId = searchParams.get('centreId') || '';
  const ville = searchParams.get('ville') || '';
  const sexe = searchParams.get('sexe') || '';
  const q = searchParams.get('q') || '';

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    // Changer de concours réinitialise les autres filtres
    if (key === 'concoursId') {
      next.delete('centreId');
      next.delete('ville');
      next.delete('q');
      next.delete('sexe');
    }
    if (key === 'ville') {
      next.delete('centreId');
    }
    setSearchParams(next);
  };

  useEffect(() => {
    setLoadingConcours(true);
    setError('');
    concoursService
      .getAll()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.concours || []);
        setConcoursList(list);
      })
      .catch((err) => setError(err.message || 'Impossible de charger les concours'))
      .finally(() => setLoadingConcours(false));
  }, []);

  const chargerListe = useCallback(async () => {
    if (!concoursId) {
      setListe(null);
      return;
    }
    setLoadingListe(true);
    setError('');
    try {
      const params = {};
      if (centreId) params.centreId = centreId;
      if (ville) params.ville = ville;
      if (sexe) params.sexe = sexe;
      if (q.trim()) params.q = q.trim();
      const data = await decService.getListeRetenus(concoursId, params);
      setListe(data);
    } catch (err) {
      setListe(null);
      setError(err.message || 'Impossible de charger la liste des retenus');
    } finally {
      setLoadingListe(false);
    }
  }, [concoursId, centreId, ville, sexe, q]);

  useEffect(() => {
    chargerListe();
  }, [chargerListe]);

  const centresOptions = useMemo(() => {
    const all = liste?.options?.centres || [];
    if (!ville) return all;
    return all.filter((c) => c.ville === ville);
  }, [liste?.options?.centres, ville]);

  const villesOptions = liste?.options?.villes || [];

  const handleExport = async (format) => {
    if (!concoursId) return;
    setExporting(true);
    setError('');
    try {
      const params = {};
      if (centreId) params.centreId = centreId;
      if (ville) params.ville = ville;
      if (sexe) params.sexe = sexe;
      if (q.trim()) params.q = q.trim();
      if (format === 'pdf') {
        await decService.telechargerListeRetenusPdf(concoursId, params);
      } else {
        await decService.telechargerListeRetenusExcel(concoursId, params);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  const selectedConcours = concoursList.find((c) => c.id === concoursId);

  return (
    <DECLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-slide-in">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Listes des retenus</h1>
          <p className="text-gray-500 text-sm mt-1">
            Générez les listes PDF (émargement) et Excel selon le concours et le centre de composition.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <BentoCard className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Filtres</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Concours *</label>
              <select
                value={concoursId}
                onChange={(e) => setFilter('concoursId', e.target.value)}
                disabled={loadingConcours}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
              >
                <option value="">— Choisir un concours —</option>
                {concoursList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.libelle}
                    {c.code ? ` (${c.code})` : ''}
                    {c.etablissement ? ` — ${c.etablissement}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sexe</label>
              <select
                value={sexe}
                onChange={(e) => setFilter('sexe', e.target.value)}
                disabled={!concoursId || loadingListe}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white disabled:bg-gray-50"
              >
                {(liste?.options?.sexes || [
                  { value: 'tous', label: 'Tous' },
                  { value: 'M', label: 'Masculin' },
                  { value: 'F', label: 'Féminin' },
                ]).map((o) => (
                  <option key={o.value} value={o.value === 'tous' ? '' : o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Ville</label>
              <select
                value={ville}
                onChange={(e) => setFilter('ville', e.target.value)}
                disabled={!concoursId || loadingListe}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white disabled:bg-gray-50"
              >
                <option value="">Toutes les villes</option>
                {villesOptions.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Centre de composition</label>
              <select
                value={centreId}
                onChange={(e) => setFilter('centreId', e.target.value)}
                disabled={!concoursId || loadingListe}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white disabled:bg-gray-50"
              >
                <option value="">Tous les centres</option>
                {centresOptions.map((c) => (
                  <option key={c.centreId} value={c.centreId}>
                    {c.ville} — {c.centreNom} ({c.total})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Recherche</label>
              <input
                type="search"
                value={q}
                onChange={(e) => setFilter('q', e.target.value)}
                disabled={!concoursId}
                placeholder="Nom, prénom, n° de table…"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:bg-gray-50"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              disabled={!concoursId || exporting || loadingListe || (liste?.total || 0) === 0}
              onClick={() => handleExport('pdf')}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {exporting ? 'Export…' : 'Télécharger PDF (émargement)'}
            </button>
            <button
              type="button"
              disabled={!concoursId || exporting || loadingListe || (liste?.total || 0) === 0}
              onClick={() => handleExport('excel')}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {exporting ? 'Export…' : 'Télécharger Excel'}
            </button>
            {liste && (
              <span className="text-xs text-gray-500">
                {liste.total} retenu{liste.total > 1 ? 's' : ''}
                {centreId || ville || q || sexe ? ' (filtrés)' : ''}
              </span>
            )}
          </div>
        </BentoCard>

        {!concoursId ? (
          <BentoCard className="p-8 text-center text-sm text-gray-400">
            Sélectionnez un concours pour afficher et exporter la liste des retenus.
          </BentoCard>
        ) : loadingListe ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-slate-900 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : !liste || liste.total === 0 ? (
          <BentoCard className="p-8 text-center text-sm text-gray-400">
            Aucun candidat retenu pour ce concours
            {(centreId || ville || q || sexe) ? ' avec les filtres sélectionnés' : ''}.
          </BentoCard>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Aperçu — {selectedConcours?.libelle || liste.concours?.libelle}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {liste.concours?.etablissement || '—'}
                  {liste.concours?.code ? ` · Code ${liste.concours.code}` : ''}
                </p>
              </div>
            </div>

            {liste.centres.map((centre) => (
              <BentoCard key={centre.centreId} className="p-0 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {centre.ville} — {centre.centreNom}
                    </p>
                    <p className="text-xs text-gray-500">
                      {centre.total} retenu{centre.total > 1 ? 's' : ''}
                      {centre.communeCode ? ` · ville ${centre.communeCode}` : ''}
                      {centre.centreCode ? ` · centre ${centre.centreCode}` : ''}
                      {centre.adresse ? ` · ${centre.adresse}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={exporting}
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      next.set('centreId', centre.centreId);
                      setSearchParams(next);
                      // Export immédiat pour ce centre
                      decService.telechargerListeRetenusPdf(concoursId, {
                        centreId: centre.centreId,
                        ...(ville ? { ville } : {}),
                        ...(sexe ? { sexe } : {}),
                        ...(q.trim() ? { q: q.trim() } : {}),
                      }).catch((err) => setError(err.message || 'Erreur export PDF'));
                    }}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                  >
                    PDF de ce centre
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-2 font-semibold w-14">N°</th>
                        <th className="px-4 py-2 font-semibold">Nom</th>
                        <th className="px-4 py-2 font-semibold">Prénom</th>
                        <th className="px-4 py-2 font-semibold">Sexe</th>
                        <th className="px-4 py-2 font-semibold">N° de table</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {centre.candidats.map((row) => (
                        <tr key={row.inscriptionId} className="hover:bg-slate-50/80">
                          <td className="px-4 py-2 font-mono text-xs">
                            {String(row.rangCentre).padStart(3, '0')}
                          </td>
                          <td className="px-4 py-2 font-medium text-gray-900">
                            {row.candidat?.nom || '—'}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {row.candidat?.prenom || '—'}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {row.candidat?.sexe === 'M'
                              ? 'Masculin'
                              : row.candidat?.sexe === 'F'
                                ? 'Féminin'
                                : '—'}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs font-semibold">
                            {row.numeroTable || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </BentoCard>
            ))}
          </div>
        )}
      </div>
    </DECLayout>
  );
}
