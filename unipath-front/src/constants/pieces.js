/**
 * ✅ CONSTANTES CENTRALISÉES - IDs et Configuration des Pièces
 * 
 * Ce fichier centralise TOUS les IDs et configurations des pièces
 * pour éviter les incohérences entre les différents composants.
 * 
 * RÈGLE: Utiliser UNIQUEMENT ces constantes dans tout le projet
 */

/**
 * IDs des pièces - Format kebab-case (avec tirets)
 * ✅ UNIQUE SOURCE DE VÉRITÉ
 */
export const PIECE_IDS = {
  ACTE_NAISSANCE: 'acte-naissance',
  CARTE_IDENTITE: 'carte-identite',
  PHOTO: 'photo',
  RELEVE_NOTES: 'releve-notes',
  QUITTANCE: 'quittance',
};

/**
 * Formats de fichiers acceptés
 * ✅ Cohérent avec le middleware upload backend
 */
export const FORMATS_FICHIERS = {
  PDF: 'PDF',
  JPEG: 'JPEG',  // ✅ JPEG (pas JPG) - cohérent avec image/jpeg
  PNG: 'PNG',
  DOC: 'DOC',
  DOCX: 'DOCX',
};

/**
 * Mapping des formats vers les types MIME
 * ✅ Pour validation côté client
 */
export const FORMAT_TO_MIME = {
  [FORMATS_FICHIERS.PDF]: 'application/pdf',
  [FORMATS_FICHIERS.JPEG]: 'image/jpeg',
  [FORMATS_FICHIERS.PNG]: 'image/png',
  [FORMATS_FICHIERS.DOC]: 'application/msword',
  [FORMATS_FICHIERS.DOCX]: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * Liste des pièces prédéfinies
 * ✅ Configuration complète et cohérente
 */
export const PIECES_PREDEFINIES = [
  {
    id: PIECE_IDS.ACTE_NAISSANCE,
    nom: 'Acte de naissance',
    formatsDefaut: [FORMATS_FICHIERS.PDF],
    description: 'Acte de naissance original ou copie certifiée',
    obligatoire: false,
  },
  {
    id: PIECE_IDS.CARTE_IDENTITE,
    nom: "Carte d'identité",
    formatsDefaut: [FORMATS_FICHIERS.PDF, FORMATS_FICHIERS.JPEG, FORMATS_FICHIERS.PNG],
    description: "Carte d'identité nationale valide",
    obligatoire: false,
  },
  {
    id: PIECE_IDS.PHOTO,
    nom: "Photo d'identité",
    formatsDefaut: [FORMATS_FICHIERS.JPEG, FORMATS_FICHIERS.PNG],
    description: 'Photo récente format identité',
    obligatoire: false,
  },
  {
    id: PIECE_IDS.RELEVE_NOTES,
    nom: 'Relevé de notes Bac',
    formatsDefaut: [FORMATS_FICHIERS.PDF],
    description: 'Relevé de notes du baccalauréat',
    obligatoire: false,
  },
  {
    id: PIECE_IDS.QUITTANCE,
    nom: 'Quittance de paiement',
    formatsDefaut: [FORMATS_FICHIERS.PDF],
    description: 'Reçu de paiement des frais de participation',
    obligatoire: true, // ✅ Toujours obligatoire
    nonSupprimable: true, // ✅ Ne peut pas être retirée
  },
];

/**
 * Labels des pièces pour l'affichage
 * ✅ Mapping ID → Label
 */
export const PIECES_LABELS = {
  [PIECE_IDS.ACTE_NAISSANCE]: 'Acte de naissance',
  [PIECE_IDS.CARTE_IDENTITE]: "Carte d'identité",
  [PIECE_IDS.PHOTO]: "Photo d'identité",
  [PIECE_IDS.RELEVE_NOTES]: 'Relevé de notes Bac',
  [PIECE_IDS.QUITTANCE]: 'Quittance de paiement',
};

/**
 * Mapping des anciens IDs (camelCase) vers les nouveaux IDs (kebab-case)
 * ✅ Pour migration et compatibilité ascendante
 */
export const LEGACY_ID_MAPPING = {
  acteNaissance: PIECE_IDS.ACTE_NAISSANCE,
  carteIdentite: PIECE_IDS.CARTE_IDENTITE,
  photo: PIECE_IDS.PHOTO,
  releve: PIECE_IDS.RELEVE_NOTES,
  quittance: PIECE_IDS.QUITTANCE,
};

/**
 * Convertit un ID legacy (camelCase) en ID standard (kebab-case)
 * @param {string} legacyId - ID au format camelCase
 * @returns {string} ID au format kebab-case
 */
export function convertLegacyId(legacyId) {
  return LEGACY_ID_MAPPING[legacyId] || legacyId;
}

/**
 * Vérifie si un format est valide
 * @param {string} format - Format à vérifier
 * @returns {boolean}
 */
export function isFormatValide(format) {
  return Object.values(FORMATS_FICHIERS).includes(format);
}

/**
 * Récupère les formats acceptés pour une pièce
 * @param {string} pieceId - ID de la pièce
 * @returns {Array<string>} Liste des formats acceptés
 */
export function getFormatsAcceptes(pieceId) {
  const piece = PIECES_PREDEFINIES.find(p => p.id === pieceId);
  return piece?.formatsDefaut || [FORMATS_FICHIERS.PDF];
}

/**
 * Vérifie si une pièce est obligatoire
 * @param {string} pieceId - ID de la pièce
 * @returns {boolean}
 */
export function isPieceObligatoire(pieceId) {
  const piece = PIECES_PREDEFINIES.find(p => p.id === pieceId);
  return piece?.obligatoire || false;
}

/**
 * Récupère le label d'une pièce
 * @param {string} pieceId - ID de la pièce
 * @returns {string} Label de la pièce
 */
export function getPieceLabel(pieceId) {
  return PIECES_LABELS[pieceId] || pieceId;
}

/**
 * Liste des formats disponibles pour sélection
 * ✅ Tous les formats supportés
 */
export const FORMATS_DISPONIBLES = Object.values(FORMATS_FICHIERS);

/**
 * Configuration par défaut pour un nouveau concours
 * ✅ Quittance toujours incluse par défaut
 */
export function getDefaultPiecesRequises() {
  return [
    {
      id: PIECE_IDS.QUITTANCE,
      nom: PIECES_LABELS[PIECE_IDS.QUITTANCE],
      obligatoire: true,
      formats: [FORMATS_FICHIERS.PDF],
      predefined: true,
      description: 'Reçu de paiement des frais de participation',
      nonSupprimable: true,
    },
  ];
}

/**
 * Valide une configuration de pièces
 * @param {Array} pieces - Liste des pièces à valider
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
export function validatePiecesConfiguration(pieces) {
  const errors = [];

  if (!Array.isArray(pieces) || pieces.length === 0) {
    errors.push('Au moins une pièce doit être configurée');
    return { valid: false, errors };
  }

  // Vérifier que la quittance est présente
  const hasQuittance = pieces.some(p => p.id === PIECE_IDS.QUITTANCE);
  if (!hasQuittance) {
    errors.push('La quittance de paiement est obligatoire');
  }

  // Vérifier que chaque pièce a au moins un format
  pieces.forEach((piece, index) => {
    if (!piece.formats || piece.formats.length === 0) {
      errors.push(`La pièce "${piece.nom}" doit avoir au moins un format accepté`);
    }

    // Vérifier que les formats sont valides
    if (piece.formats) {
      piece.formats.forEach(format => {
        if (!isFormatValide(format)) {
          errors.push(`Format invalide "${format}" pour la pièce "${piece.nom}"`);
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
