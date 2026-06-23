import React from 'react';

/**
 * Composant d'affichage de la liste des pièces personnalisées
 * @param {Object} props
 * @param {Array} props.pieces - Liste des pièces personnalisées
 * @param {Function} props.onRemove - Callback appelé lors de la suppression d'une pièce
 */
const PiecesPersonnalisees = ({ pieces = [], onRemove }) => {
  if (pieces.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Pièces personnalisées</h3>
      <p className="text-sm text-gray-600">
        Pièces supplémentaires ajoutées pour ce concours.
      </p>

      <div className="space-y-3">
        {pieces.map((piece) => (
          <div
            key={piece.id}
            className="border border-gray-300 rounded-lg p-4 bg-white"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <h4 className="font-medium text-gray-900">{piece.nom}</h4>
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded">
                    Personnalisée
                  </span>
                </div>

                {piece.description && (
                  <p className="text-sm text-gray-600 mt-1">{piece.description}</p>
                )}

                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Formats acceptés :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {piece.formats.map((format) => (
                      <span
                        key={format}
                        className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemove(piece.id)}
                className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                title="Supprimer cette pièce"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PiecesPersonnalisees;
