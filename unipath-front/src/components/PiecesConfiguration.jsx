import { useState } from 'react';
import {
  PIECES_PREDEFINIES,
  PIECE_IDS,
  FORMATS_FICHIERS,
  convertLegacyId,
} from '../constants/pieces';

const PIECES_UI = PIECES_PREDEFINIES.map((piece) => ({
  ...piece,
  formats: [...(piece.formats || [])],
}));

const FORMATS_PIECE_PERSO = [
  FORMATS_FICHIERS.PDF,
  FORMATS_FICHIERS.JPEG,
  FORMATS_FICHIERS.PNG,
];

export function PiecesConfiguration({ piecesRequises, onChange }) {
  const [nouvellepiece, setNouvellePiece] = useState({ nom: '', formats: ['PDF'], obligatoire: true });
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  const togglePiecePredéfinie = (piece) => {
    const existe = piecesRequises.find((p) => convertLegacyId(p.id) === piece.id);
    if (existe) {
      if (piece.id === PIECE_IDS.QUITTANCE) return;
      onChange(piecesRequises.filter((p) => convertLegacyId(p.id) !== piece.id));
    } else {
      onChange([...piecesRequises, { ...piece }]);
    }
  };

  const ajouterPiecePersonnalisee = () => {
    if (!nouvellepiece.nom.trim()) return;

    const id = nouvellepiece.nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    onChange([
      ...piecesRequises,
      {
        id,
        nom: nouvellepiece.nom.trim(),
        formats: nouvellepiece.formats,
        obligatoire: nouvellepiece.obligatoire,
        predefined: false,
      },
    ]);

    setNouvellePiece({ nom: '', formats: ['PDF'], obligatoire: true });
    setAjoutOuvert(false);
  };

  const supprimerPiece = (id) => {
    if (convertLegacyId(id) === PIECE_IDS.QUITTANCE) return;
    onChange(piecesRequises.filter((p) => p.id !== id));
  };

  const toggleFormat = (format) => {
    const formats = nouvellepiece.formats.includes(format)
      ? nouvellepiece.formats.filter((f) => f !== format)
      : [...nouvellepiece.formats, format];
    setNouvellePiece({ ...nouvellepiece, formats });
  };

  return (
    <div className='space-y-3'>
      <div>
        <p className='text-xs text-gray-500 mb-2'>Pièces standard</p>
        <div className='space-y-2'>
          {PIECES_UI.map((piece) => {
            const selectionnee = !!piecesRequises.find((p) => convertLegacyId(p.id) === piece.id);
            const estQuittance = piece.id === PIECE_IDS.QUITTANCE;
            return (
              <div
                key={piece.id}
                onClick={() => togglePiecePredéfinie(piece)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition ${
                  selectionnee ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                } ${estQuittance ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                <div className='flex items-center gap-3'>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selectionnee ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}
                  >
                    {selectionnee && (
                      <svg className='w-3 h-3 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className='text-sm font-medium text-gray-800'>{piece.nom}</p>
                    <p className='text-xs text-gray-400'>{piece.formats.join(', ')}</p>
                  </div>
                </div>
                {estQuittance && (
                  <span className='text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium'>
                    Obligatoire
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {piecesRequises.filter((p) => !p.predefined).length > 0 && (
        <div>
          <p className='text-xs text-gray-500 mb-2'>Pièces personnalisées</p>
          <div className='space-y-2'>
            {piecesRequises
              .filter((p) => !p.predefined)
              .map((piece) => (
                <div
                  key={piece.id}
                  className='flex items-center justify-between px-4 py-3 rounded-xl border bg-orange-50 border-orange-200'
                >
                  <div>
                    <p className='text-sm font-medium text-gray-800'>{piece.nom}</p>
                    <p className='text-xs text-gray-400'>{piece.formats.join(', ')}</p>
                  </div>
                  <button
                    type='button'
                    onClick={() => supprimerPiece(piece.id)}
                    className='text-red-500 hover:text-red-700 p-1'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {ajoutOuvert ? (
        <div className='border border-dashed border-orange-300 rounded-xl p-4 space-y-3 bg-orange-50'>
          <p className='text-sm font-semibold text-gray-700'>Nouvelle pièce personnalisée</p>
          <input
            type='text'
            placeholder='Nom de la pièce (ex: Diplôme de Licence)'
            value={nouvellepiece.nom}
            onChange={(e) => setNouvellePiece({ ...nouvellepiece, nom: e.target.value })}
            className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent'
          />
          <div>
            <p className='text-xs text-gray-500 mb-1'>Formats acceptés</p>
            <div className='flex gap-2'>
              {FORMATS_PIECE_PERSO.map((format) => (
                <label key={format} className='flex items-center gap-1 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={nouvellepiece.formats.includes(format)}
                    onChange={() => toggleFormat(format)}
                    className='w-4 h-4 text-orange-500'
                  />
                  <span className='text-sm text-gray-700'>{format}</span>
                </label>
              ))}
            </div>
          </div>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={ajouterPiecePersonnalisee}
              disabled={!nouvellepiece.nom.trim() || nouvellepiece.formats.length === 0}
              className='px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition disabled:opacity-50'
            >
              Ajouter
            </button>
            <button
              type='button'
              onClick={() => {
                setAjoutOuvert(false);
                setNouvellePiece({ nom: '', formats: ['PDF'], obligatoire: true });
              }}
              className='px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition'
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => setAjoutOuvert(true)}
          className='w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-orange-400 hover:text-orange-500 transition flex items-center justify-center gap-2'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          Ajouter une pièce personnalisée
        </button>
      )}
    </div>
  );
}
