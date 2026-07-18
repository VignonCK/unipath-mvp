import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { concoursService, dgesService } from '../services/api';
import DECLayout from '../components/DECLayout';

export default function DECConvocations() {
  const [concours, setConcours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numerosBusyId, setNumerosBusyId] = useState(null);
  const [csvImport, setCsvImport] = useState(null);

  useEffect(() => {
    loadConcours();
  }, []);

  const loadConcours = async () => {
    try {
      setLoading(true);
      const data = await concoursService.getAll();
      setConcours(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenererNumeros = async (c) => {
    if (!confirm(
      `Générer les numéros de table pour « ${c.libelle} » ?\nLes candidats VALIDE sans numéro recevront un numéro dans l'ordre alphabétique (les numéros déjà attribués ne changent pas).`,
    )) {
      return;
    }

    try {
      setNumerosBusyId(c.id);
      setError('');
      const data = await dgesService.genererNumerosTable(c.id);
      alert(data?.message || `${data?.count ?? 0} numéro(s) attribué(s)`);
    } catch (err) {
      setError(err.message || 'Génération des numéros impossible');
    } finally {
      setNumerosBusyId(null);
    }
  };

  const handlePickCsvImport = (c, file) => {
    if (!file) return;
    setError('');
    setCsvImport({ concours: c, file, report: null, applying: false, loading: true });
    dgesService.importerNumerosTable(c.id, file, { dryRun: true })
      .then((report) => {
        setCsvImport({ concours: c, file, report, applying: false, loading: false });
      })
      .catch((err) => {
        setCsvImport(null);
        setError(err.message || 'Import CSV impossible');
      });
  };

  const handleConfirmCsvImport = async () => {
    if (!csvImport?.file || !csvImport?.concours) return;
    try {
      setCsvImport((prev) => (prev ? { ...prev, applying: true } : prev));
      setError('');
      const report = await dgesService.importerNumerosTable(
        csvImport.concours.id,
        csvImport.file,
        { dryRun: false },
      );
      setCsvImport(null);
      alert(report?.message || `${report?.appliques ?? 0} numéro(s) importé(s)`);
    } catch (err) {
      setCsvImport((prev) => (prev ? { ...prev, applying: false } : prev));
      setError(err.message || 'Exécution de l\'import impossible');
    }
  };

  return (
    <DECLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Convocations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Génération et import des numéros de table par concours
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">Chargement…</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Concours</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Étude</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {concours.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                        Aucun concours.
                      </td>
                    </tr>
                  ) : (
                    concours.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{c.libelle}</td>
                        <td className="px-4 py-3">
                          {c.etudeCloturee ? (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                              Clôturée
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                              Ouverte
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleGenererNumeros(c)}
                              disabled={numerosBusyId === c.id}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 bg-blue-50 text-blue-900 hover:bg-blue-100"
                              title="Générer les numéros de table"
                            >
                              {numerosBusyId === c.id ? '…' : 'Générer les n° de table'}
                            </button>
                            <label
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer bg-indigo-50 text-indigo-900 hover:bg-indigo-100 ${
                                csvImport?.loading && csvImport?.concours?.id === c.id ? 'opacity-50 pointer-events-none' : ''
                              }`}
                              title="Importer un CSV de numéros de table"
                            >
                              {csvImport?.loading && csvImport?.concours?.id === c.id ? '…' : 'Importer CSV'}
                              <input
                                type="file"
                                accept=".csv,text/csv"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = '';
                                  handlePickCsvImport(c, file);
                                }}
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {csvImport && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Import CSV — n° de table</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {csvImport.concours?.libelle}
                  {csvImport.file?.name ? ` · ${csvImport.file.name}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCsvImport(null)}
                disabled={csvImport.applying}
                className="p-1 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1">
              {csvImport.loading || !csvImport.report ? (
                <p className="text-sm text-gray-600">Analyse dry-run en cours…</p>
              ) : (
                <>
                  <p className="text-sm text-gray-700 mb-3">{csvImport.report.message}</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Aucune écriture en base tant que vous n’avez pas confirmé.
                  </p>

                  {(csvImport.report.valides || []).length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-2">
                        Lignes valides ({csvImport.report.countValides})
                      </h3>
                      <ul className="text-xs text-gray-700 space-y-1 max-h-40 overflow-y-auto border border-emerald-100 rounded-lg p-2 bg-emerald-50/40">
                        {csvImport.report.valides.map((v) => (
                          <li key={`ok-${v.line}`}>
                            L.{v.line} — {v.matricule} → {v.numero}
                            {v.nom ? ` (${v.nom} ${v.prenom || ''})` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(csvImport.report.erreurs || []).length > 0 && (
                    <div className="mb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-red-700 mb-2">
                        Erreurs ({csvImport.report.countErreurs})
                      </h3>
                      <ul className="text-xs text-red-800 space-y-1 max-h-40 overflow-y-auto border border-red-100 rounded-lg p-2 bg-red-50/50">
                        {csvImport.report.erreurs.map((e, idx) => (
                          <li key={`err-${e.line}-${idx}`}>
                            L.{e.line}
                            {e.matricule ? ` — ${e.matricule}` : ''}
                            {e.numero ? ` / ${e.numero}` : ''}
                            {' : '}
                            {e.motif}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
              <button
                type="button"
                onClick={() => setCsvImport(null)}
                disabled={csvImport.applying}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmCsvImport}
                disabled={
                  csvImport.loading
                  || csvImport.applying
                  || !csvImport.report
                  || !(csvImport.report.countValides > 0)
                }
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {csvImport.applying
                  ? 'Import…'
                  : `Confirmer l'import (${csvImport.report?.countValides || 0})`}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </DECLayout>
  );
}
