const EMPTY_LIEU = () => ({ nom: '', adresse: '' });
const EMPTY_CENTRE = () => ({ ville: '', lieux: [EMPTY_LIEU()] });

export function emptyCentresComposition() {
  return { centres: [], publieLe: '', note: '' };
}

export function normalizeCentresFromConcours(raw) {
  if (!raw || !Array.isArray(raw.centres)) return emptyCentresComposition();
  return {
    centres: raw.centres.map((c) => ({
      ville: c.ville || '',
      lieux: (c.lieux?.length ? c.lieux : [EMPTY_LIEU()]).map((l) => ({
        nom: l.nom || '',
        adresse: l.adresse || '',
      })),
    })),
    publieLe: raw.publieLe ? raw.publieLe.slice(0, 10) : '',
    note: raw.note || '',
  };
}

export default function CentresCompositionEditor({ value, onChange }) {
  const data = value || emptyCentresComposition();
  const centres = data.centres || [];

  const update = (patch) => onChange({ ...data, ...patch });

  const updateCentre = (index, patch) => {
    const next = [...centres];
    next[index] = { ...next[index], ...patch };
    update({ centres: next });
  };

  const updateLieu = (centreIndex, lieuIndex, patch) => {
    const next = [...centres];
    const lieux = [...(next[centreIndex].lieux || [])];
    lieux[lieuIndex] = { ...lieux[lieuIndex], ...patch };
    next[centreIndex] = { ...next[centreIndex], lieux };
    update({ centres: next });
  };

  const addCentre = () => update({ centres: [...centres, EMPTY_CENTRE()] });
  const removeCentre = (index) => update({ centres: centres.filter((_, i) => i !== index) });

  const addLieu = (centreIndex) => {
    const next = [...centres];
    next[centreIndex] = {
      ...next[centreIndex],
      lieux: [...(next[centreIndex].lieux || []), EMPTY_LIEU()],
    };
    update({ centres: next });
  };

  const removeLieu = (centreIndex, lieuIndex) => {
    const next = [...centres];
    const lieux = (next[centreIndex].lieux || []).filter((_, i) => i !== lieuIndex);
    next[centreIndex] = { ...next[centreIndex], lieux: lieux.length ? lieux : [EMPTY_LIEU()] };
    update({ centres: next });
  };

  return (
    <div className='border-t pt-4 space-y-4'>
      <div>
        <h3 className='text-sm font-bold text-gray-800'>Centres de composition</h3>
        <p className='text-xs text-gray-500 mt-1'>
          Lieux proposés au candidat après validation de son dossier. Laissez vide si non publiés.
        </p>
      </div>

      {centres.length === 0 && (
        <p className='text-xs text-gray-400 italic'>Aucun centre configuré pour ce concours.</p>
      )}

      {centres.map((centre, ci) => (
        <div key={ci} className='rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50/50'>
          <div className='flex flex-wrap gap-3 items-end'>
            <div className='flex-1 min-w-[160px]'>
              <label className='block text-xs font-semibold text-gray-600 mb-1'>Ville</label>
              <input
                type='text'
                value={centre.ville}
                onChange={(e) => updateCentre(ci, { ville: e.target.value })}
                placeholder='Ex: Cotonou'
                className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm'
              />
            </div>
            <button
              type='button'
              onClick={() => removeCentre(ci)}
              className='text-xs text-red-600 hover:underline px-2 py-2'
            >
              Supprimer la ville
            </button>
          </div>

          {(centre.lieux || []).map((lieu, li) => (
            <div key={li} className='grid grid-cols-1 sm:grid-cols-2 gap-2 pl-0 sm:pl-3 border-l-2 border-blue-100'>
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1'>Lieu / établissement</label>
                <input
                  type='text'
                  value={lieu.nom}
                  onChange={(e) => updateLieu(ci, li, { nom: e.target.value })}
                  placeholder='Ex: CEG Gbégamey'
                  className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm'
                />
              </div>
              <div className='flex gap-2 items-end'>
                <div className='flex-1'>
                  <label className='block text-xs font-semibold text-gray-600 mb-1'>Adresse (optionnel)</label>
                  <input
                    type='text'
                    value={lieu.adresse}
                    onChange={(e) => updateLieu(ci, li, { adresse: e.target.value })}
                    placeholder='Cotonou, Bénin'
                    className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm'
                  />
                </div>
                {(centre.lieux || []).length > 1 && (
                  <button
                    type='button'
                    onClick={() => removeLieu(ci, li)}
                    className='text-xs text-red-500 px-2 py-2 shrink-0'
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            type='button'
            onClick={() => addLieu(ci)}
            className='text-xs font-semibold text-blue-800 hover:underline'
          >
            + Ajouter un lieu dans cette ville
          </button>
        </div>
      ))}

      <button
        type='button'
        onClick={addCentre}
        className='text-sm font-semibold text-blue-900 hover:underline'
      >
        + Ajouter une ville
      </button>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div>
          <label className='block text-xs font-semibold text-gray-600 mb-1'>Date de publication</label>
          <input
            type='date'
            value={data.publieLe || ''}
            onChange={(e) => update({ publieLe: e.target.value })}
            className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm'
          />
        </div>
        <div>
          <label className='block text-xs font-semibold text-gray-600 mb-1'>Source / note</label>
          <input
            type='text'
            value={data.note || ''}
            onChange={(e) => update({ note: e.target.value })}
            placeholder='Communiqué MESRS N°…'
            className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm'
          />
        </div>
      </div>
    </div>
  );
}
