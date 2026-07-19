import { useState } from 'react';
import { parcoursService } from '../services/api';
import { labelNiveauEtude } from '../utils/niveaux-etude';

function StatutInscriptionBadge({ statut, label }) {
  const styles = {
    VALIDE: 'bg-green-100 text-green-800',
    REDOUBLANT: 'bg-red-100 text-red-800',
    EN_COURS: 'bg-amber-100 text-amber-900',
    ABANDONNE: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[statut] || 'bg-gray-100 text-gray-700'}`}>
      {label || statut || '—'}
    </span>
  );
}

function PctCreditsBar({ label, value }) {
  if (value == null) {
    return (
      <div className="min-w-[88px]">
        <p className="text-[10px] font-semibold text-gray-500 uppercase">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">—</p>
      </div>
    );
  }
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped >= 100 ? 'bg-green-500' : clamped >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="min-w-[88px]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold text-gray-500 uppercase">{label}</p>
        <p className="text-xs font-bold text-gray-800">{value} %</p>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${clamped}%` }} />
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5">crédits UE</p>
    </div>
  );
}

function semestresOrdre(bilansSemestre) {
  if (!bilansSemestre) return [];
  return Object.values(bilansSemestre).sort((a, b) => a.semestre - b.semestre);
}

/**
 * Recherche du parcours académique par matricule.
 * @param {{ accent?: 'teal' | 'blue', perimetreHint?: string }} props
 */
export default function ParcoursParMatriculePanel({
  accent = 'teal',
  perimetreHint = '',
}) {
  const [matricule, setMatricule] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const btnClass = accent === 'blue'
    ? 'bg-blue-900 hover:bg-blue-800'
    : 'bg-teal-900 hover:bg-teal-800';
  const focusRing = accent === 'blue'
    ? 'focus:ring-blue-900/20 focus:border-blue-900'
    : 'focus:ring-teal-900/20 focus:border-teal-900';

  const rechercher = async (e) => {
    e?.preventDefault();
    const value = matricule.trim();
    if (!value) {
      setError('Saisissez un matricule (ex. DEMO-2026-012)');
      setResult(null);
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    setExpandedId(null);
    try {
      const data = await parcoursService.getByMatricule(value);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Recherche impossible');
      if (err.data?.candidat) {
        setResult({ candidat: err.data.candidat, parcours: [], stats: null, partial: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={rechercher} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Matricule UniPath</label>
          <input
            type="text"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            placeholder="Ex. UnP-2026-000001 ou DEMO-2026-012"
            className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono ${focusRing} focus:outline-none focus:ring-2`}
          />
          {perimetreHint && (
            <p className="text-[11px] text-gray-400 mt-1">{perimetreHint}</p>
          )}
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 ${btnClass}`}
          >
            {loading ? 'Recherche…' : 'Rechercher'}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result?.candidat && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {result.candidat.prenom} {result.candidat.nom}
              </h2>
              <p className="text-sm font-mono text-gray-600 mt-0.5">{result.candidat.matricule}</p>
              {result.candidat.email && (
                <p className="text-xs text-gray-400 mt-1">{result.candidat.email}</p>
              )}
            </div>
            {result.stats && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
                  {result.stats.totalInscriptions} inscription{result.stats.totalInscriptions !== 1 ? 's' : ''}
                </span>
                <span className="rounded-full bg-green-50 px-2.5 py-1 font-semibold text-green-800">
                  {result.stats.passants} passant{result.stats.passants !== 1 ? 's' : ''}
                </span>
                <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-800">
                  {result.stats.redoublants} redoublant{result.stats.redoublants !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {!result.parcours?.length ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              Aucune inscription académique à afficher pour ce périmètre.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Chronologie du parcours
              </p>
              {result.parcours.map((etape, index) => {
                const open = expandedId === etape.id;
                const semestres = semestresOrdre(etape.bilansSemestre);
                return (
                  <div
                    key={etape.id}
                    className="rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : etape.id)}
                      className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100/80"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 text-sm">
                              {etape.anneeAcademique} · {labelNiveauEtude(etape.niveau)}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 truncate">
                              {etape.filiere?.nom}
                              {etape.etablissement?.nom ? ` · ${etape.etablissement.nom}` : ''}
                            </div>
                            <div className="mt-2">
                              <StatutInscriptionBadge statut={etape.statut} label={etape.statutLabel} />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-4 sm:gap-6 pl-10 lg:pl-0">
                          {semestres.map((s) => (
                            <PctCreditsBar
                              key={s.semestre}
                              label={s.label || `S${s.semestre}`}
                              value={s.pourcentageCredits}
                            />
                          ))}
                          {etape.bilansAnnee && (
                            <PctCreditsBar
                              label="Année"
                              value={etape.bilansAnnee.pourcentageCredits}
                            />
                          )}
                        </div>
                      </div>
                    </button>

                    {open && (
                      <div className="px-4 py-3 space-y-3 text-sm border-t border-gray-100 bg-white">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          {semestres.map((s) => (
                            <div key={`detail-${s.semestre}`} className="rounded-lg bg-gray-50 px-3 py-2">
                              <p className="text-gray-500 font-semibold uppercase text-[10px]">
                                {s.label} — crédits validés
                              </p>
                              <p className="font-medium text-gray-800 mt-0.5">
                                {s.valides?.credits ?? 0}/{s.totaux?.credits ?? 0} cr.
                                {s.pourcentageCredits != null && (
                                  <span className="text-gray-500"> ({s.pourcentageCredits} %)</span>
                                )}
                              </p>
                              <p className="text-gray-400 mt-0.5">
                                {s.valides?.ue ?? 0}/{s.totaux?.ue ?? 0} UE
                              </p>
                            </div>
                          ))}
                          <div className="rounded-lg bg-gray-50 px-3 py-2">
                            <p className="text-gray-500 font-semibold uppercase text-[10px]">Notes</p>
                            <p className="font-medium text-gray-800 mt-0.5">
                              {etape.notesCount || 0} saisie{(etape.notesCount || 0) !== 1 ? 's' : ''}
                              {etape.moyenneGenerale != null && (
                                <> · moy. {etape.moyenneGenerale}/20</>
                              )}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 px-3 py-2">
                            <p className="text-gray-500 font-semibold uppercase text-[10px]">Filière</p>
                            <p className="font-medium text-gray-800 mt-0.5 font-mono text-[11px]">
                              {etape.filiere?.code || '—'}
                            </p>
                          </div>
                        </div>

                        {etape.validationsUE?.details?.length > 0 && (
                          <div className="overflow-x-auto rounded-lg border border-gray-100">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left px-3 py-2 font-semibold text-gray-600">UE</th>
                                  <th className="text-left px-3 py-2 font-semibold text-gray-600">S</th>
                                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Cr.</th>
                                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Statut</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {etape.validationsUE.details.map((u, i) => (
                                  <tr key={`${etape.id}-ue-${i}`}>
                                    <td className="px-3 py-2">
                                      <span className="font-mono">{u.code}</span>
                                      <span className="text-gray-400"> — </span>
                                      {u.libelle}
                                    </td>
                                    <td className="px-3 py-2">S{u.semestre}</td>
                                    <td className="px-3 py-2">{u.credits}</td>
                                    <td className="px-3 py-2">
                                      {u.statut === 'VALIDE' ? (
                                        <span className="text-green-700 font-semibold">Validé</span>
                                      ) : (
                                        <span className="text-red-700 font-semibold">Non validé</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
