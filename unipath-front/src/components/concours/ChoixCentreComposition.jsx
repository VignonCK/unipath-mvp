import { useMemo, useState } from 'react';

function groupByVille(centres = []) {
  const map = new Map();
  centres.forEach((item) => {
    const ville = item.centre?.ville || 'Autre';
    if (!map.has(ville)) map.set(ville, []);
    map.get(ville).push(item);
  });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'fr'));
}

export function concoursHasCentres(centresRelational) {
  return Array.isArray(centresRelational) && centresRelational.length > 0;
}

export function formatCentreChoisi(centre) {
  if (!centre?.nom) return null;
  return `${centre.nom} — ${centre.ville || ''}${centre.adresse ? ` (${centre.adresse})` : ''}`.trim();
}

export default function ChoixCentreComposition({
  centresRelational = [],
  centreChoisi,
  statut,
  onSave,
  busy = false,
  readOnly = false,
}) {
  const grouped = useMemo(() => groupByVille(centresRelational), [centresRelational]);
  const [selectedId, setSelectedId] = useState(() => centreChoisi?.concoursCentreId || centreChoisi?.id || '');
  const [error, setError] = useState('');

  const centreVerrouille = statut === 'VALIDE' && Boolean(centreChoisi?.nom || centreChoisi?.concoursCentreId);

  if (!centresRelational.length) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedId) {
      setError('Veuillez sélectionner un centre de composition.');
      return;
    }
    try {
      await onSave({ concoursCentreId: selectedId });
    } catch (err) {
      setError(err.message || 'Enregistrement impossible');
    }
  };

  if (centreVerrouille || (readOnly && centreChoisi?.nom)) {
    return (
      <div className='rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='font-semibold'>Centre de composition</p>
          {centreVerrouille && (
            <span className='inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700'>
              Verrouillé
            </span>
          )}
        </div>
        <p className='mt-1'>{formatCentreChoisi(centreChoisi)}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3'>
      <div>
        <p className='text-xs font-semibold uppercase tracking-wide text-blue-700'>Étape obligatoire</p>
        <p className='font-semibold text-blue-900 text-sm mt-1'>Choix du centre de composition</p>
        <p className='text-xs text-blue-800 mt-1'>
          Sélectionnez votre centre avant de télécharger votre convocation officielle.
        </p>
      </div>

      {centreChoisi?.nom && statut !== 'VALIDE' && (
        <p className='text-xs text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2'>
          Centre actuel : {formatCentreChoisi(centreChoisi)}
        </p>
      )}

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white'
      >
        <option value=''>— Sélectionner un lieu —</option>
        {grouped.map(([ville, items]) => (
          <optgroup key={ville} label={ville}>
            {items.map((item) => {
              const label = `${item.centre?.nom}${item.centre?.adresse ? ` (${item.centre.adresse})` : ''}`;
              const places = item.placesRestantes;
              const suffix = item.capacite != null
                ? ` — ${places} place(s) restante(s)`
                : '';
              return (
                <option key={item.id} value={item.id} disabled={item.capacite != null && places <= 0}>
                  {label}{suffix}
                </option>
              );
            })}
          </optgroup>
        ))}
      </select>

      {error && <p className='text-xs text-red-600'>{error}</p>}

      <button
        type='submit'
        disabled={busy || !selectedId}
        className='px-4 py-2 rounded-lg bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-60'
      >
        {busy ? 'Enregistrement…' : centreChoisi?.nom ? 'Modifier mon centre' : 'Confirmer mon centre'}
      </button>
    </form>
  );
}
