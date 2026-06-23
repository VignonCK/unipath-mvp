import React from 'react';

/**
 * Composant d'affichage des pièces requises pour les candidats
 * @param {Object} props
 * @param {Array} props.pieces - Liste des pièces requises
 * @param {boolean} props.compact - Mode compact (pour liste de concours)
 */
const PiecesRequisesCandidats = ({ pieces = [], compact = false }) => {
  // Extraire les pièces du wrapper si nécessaire
  const piecesArray = Array.isArray(pieces) ? pieces : (pieces.pieces || []);

  if (piecesArray.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Aucune pièce spécifiée pour ce concours
      </div>
    );
  }

  // Mode compact : afficher juste le nombre de pièces
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{piecesArray.length} pièce{piecesArray.length > 1 ? 's' : ''} requise{piecesArray.length > 1 ? 's' : ''}</span>
      </div>
    );
  }

  // Mode détaillé : afficher toutes les pièces avec leurs formats
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Pièces requises pour ce concours
      </h3>

      <div className="grid gap-3">
        {piecesArray.map((piece, index) => (
          <div
            key={piece.id || index}
            className={`border rounded-lg p-3 ${
              piece.id === 'quittance' 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icône */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                piece.id === 'quittance' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {getIconForPiece(piece.id)}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {piece.nom}
                  </h4>
                  {piece.id === 'quittance' && (
                    <span className="px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded">
                      Obligatoire
                    </span>
                  )}
                  {piece.predefined === false && (
                    <span className="px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded">
                      Spécifique
                    </span>
                  )}
                </div>

                {piece.description && (
                  <p className="text-xs text-gray-600 mt-1">
                    {piece.description}
                  </p>
                )}

                {/* Formats acceptés */}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 font-medium">
                    Formats acceptés :
                  </span>
                  {piece.formats && piece.formats.map((format) => (
                    <span
                      key={format}
                      className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 rounded border border-gray-200"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note importante pour la quittance */}
      {piecesArray.some(p => p.id === 'quittance') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p>
              <strong>Important :</strong> La quittance de paiement est obligatoire et doit être au format PDF. 
              Assurez-vous d'avoir effectué le paiement des frais de participation avant de soumettre votre dossier.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Retourne l'icône appropriée pour une pièce
 */
function getIconForPiece(pieceId) {
  switch (pieceId) {
    case 'quittance':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'carte-identite':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      );
    case 'photo':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'acte-naissance':
    case 'releve-notes':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
  }
}

export default PiecesRequisesCandidats;
