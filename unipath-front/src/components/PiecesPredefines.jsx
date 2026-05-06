import React from 'react';

/**
 * Liste des pièces prédéfinies disponibles
 */
const PIECES_PREDEFINIES = [
  {
    id: 'acte-naissance',
    nom: 'Acte de naissance',
    formatsDefaut: ['PDF'],
    description: 'Acte de naissance original ou copie certifiée'
  },
  {
    id: 'carte-identite',
    nom: "Carte d'identité",
    formatsDefaut: ['PDF', 'JPEG', 'PNG'],
    description: "Carte d'identité nationale valide"
  },
  {
    id: 'photo',
    nom: "Photo d'identité",
    formatsDefaut: ['JPEG', 'PNG'],
    description: 'Photo récente format identité'
  },
  {
    id: 'releve-notes',
    nom: 'Relevé de notes Bac',
    formatsDefaut: ['PDF'],
    description: 'Relevé de notes du baccalauréat'
  },
  {
    id: 'quittance',
    nom: 'Quittance de paiement',
    formatsDefaut: ['PDF'],
    description: 'Reçu de paiement des frais de participation',
    obligatoire: true
  }
];

/**
 * Formats de fichiers disponibles
 */
const FORMATS_DISPONIBLES = ['PDF', 'JPEG', 'PNG', 'DOC', 'DOCX'];

/**
 * Composant de sélection des pièces prédéfinies
 * @param {Object} props
 * @param {Array} props.piecesSelectionnees - Liste des pièces sélectionnées
 * @param {Function} props.onChange - Callback appelé lors d'un changement
 */
const PiecesPredefines = ({ piecesSelectionnees = [], onChange }) => {
  /**
   * Vérifie si une pièce est sélectionnée
   */
  const isPieceSelectionnee = (pieceId) => {
    return piecesSelectionnees.some(p => p.id === pieceId);
  };

  /**
   * Récupère les formats sélectionnés pour une pièce
   */
  const getFormatsSelectionnes = (pieceId) => {
    const piece = piecesSelectionnees.find(p => p.id === pieceId);
    return piece?.formats || [];
  };

  /**
   * Gère la sélection/désélection d'une pièce
   */
  const handleTogglePiece = (piece) => {
    if (piece.obligatoire) return; // Ne pas permettre de désélectionner les pièces obligatoires

    const isSelected = isPieceSelectionnee(piece.id);
    
    if (isSelected) {
      // Retirer la pièce
      const newPieces = piecesSelectionnees.filter(p => p.id !== piece.id);
      onChange(newPieces);
    } else {
      // Ajouter la pièce avec ses formats par défaut
      const newPiece = {
        id: piece.id,
        nom: piece.nom,
        obligatoire: piece.obligatoire || false,
        formats: piece.formatsDefaut,
        predefined: true,
        description: piece.description
      };
      onChange([...piecesSelectionnees, newPiece]);
    }
  };

  /**
   * Gère la sélection/désélection d'un format pour une pièce
   */
  const handleToggleFormat = (pieceId, format) => {
    const piece = piecesSelectionnees.find(p => p.id === pieceId);
    if (!piece) return;

    const formatsActuels = piece.formats || [];
    let nouveauxFormats;

    if (formatsActuels.includes(format)) {
      // Retirer le format (sauf s'il ne reste qu'un seul format)
      if (formatsActuels.length > 1) {
        nouveauxFormats = formatsActuels.filter(f => f !== format);
      } else {
        return; // Ne pas permettre de retirer le dernier format
      }
    } else {
      // Ajouter le format
      nouveauxFormats = [...formatsActuels, format];
    }

    const newPieces = piecesSelectionnees.map(p =>
      p.id === pieceId ? { ...p, formats: nouveauxFormats } : p
    );
    onChange(newPieces);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Pièces prédéfinies</h3>
      <p className="text-sm text-gray-600">
        Sélectionnez les pièces requises pour ce concours. La quittance de paiement est obligatoire.
      </p>

      <div className="space-y-3">
        {PIECES_PREDEFINIES.map((piece) => {
          const isSelected = isPieceSelectionnee(piece.id);
          const formatsSelectionnes = getFormatsSelectionnes(piece.id);

          return (
            <div
              key={piece.id}
              className={`border rounded-lg p-4 ${
                piece.obligatoire ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id={`piece-${piece.id}`}
                  checked={isSelected}
                  onChange={() => handleTogglePiece(piece)}
                  disabled={piece.obligatoire}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <div className="ml-3 flex-1">
                  <label
                    htmlFor={`piece-${piece.id}`}
                    className="font-medium text-gray-900 cursor-pointer"
                  >
                    {piece.nom}
                    {piece.obligatoire && (
                      <span className="ml-2 text-xs text-blue-600 font-semibold">
                        (Obligatoire)
                      </span>
                    )}
                  </label>
                  {piece.description && (
                    <p className="text-sm text-gray-600 mt-1">{piece.description}</p>
                  )}

                  {isSelected && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Formats acceptés :
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {FORMATS_DISPONIBLES.map((format) => {
                          const isFormatSelected = formatsSelectionnes.includes(format);
                          const isFormatInDefaults = piece.formatsDefaut.includes(format);

                          return (
                            <button
                              key={format}
                              type="button"
                              onClick={() => handleToggleFormat(piece.id, format)}
                              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                                isFormatSelected
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {format}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PiecesPredefines;
