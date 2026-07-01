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
  ACTE_NAISSANCE: 'acte_naissance',
  CARTE_IDENTITE: 'carte_identite',
  PHOTO_IDENTITE: 'photo_identite',
  RELEVE_BAC: 'releve_bac',
  QUITTANCE: 'quittance',
};

/**
 * Champs du modèle Dossier Prisma — seules valeurs valides pour sourceDossier.
 */
export const DOSSIER_PERSONNEL_FIELDS = [
  { key: 'acteNaissance', label: 'Acte de naissance' },
  { key: 'carteIdentite', label: "Carte nationale d'identité" },
  { key: 'photo', label: "Photo d'identité" },
  { key: 'releve', label: 'Relevé de notes Bac' },
];

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
    id: 'quittance',
    nom: 'Quittance de paiement',
    formats: ['PDF'],
    predefined: true,
    obligatoire: true,
    nonSupprimable: true,
    sourceDossier: null,
    description: 'Reçu de paiement des frais de participation',
  },
  {
    id: 'acte_naissance',
    nom: 'Acte de naissance',
    formats: ['PDF'],
    predefined: true,
    obligatoire: true,
    sourceDossier: 'acteNaissance',
  },
  {
    id: 'carte_identite',
    nom: "Carte d'identité",
    formats: ['PDF', 'JPEG', 'PNG'],
    predefined: true,
    obligatoire: true,
    sourceDossier: 'carteIdentite',
  },
  {
    id: 'photo_identite',
    nom: "Photo d'identité",
    formats: ['JPEG', 'PNG'],
    predefined: true,
    obligatoire: true,
    sourceDossier: 'photo',
    description: '1 fichier image (JPEG ou PNG)',
  },
  {
    id: 'releve_bac',
    nom: 'Relevé de notes Bac',
    formats: ['PDF'],
    predefined: true,
    obligatoire: true,
    sourceDossier: 'releve',
  },
];

/**
 * Labels des pièces pour l'affichage
 * ✅ Mapping ID → Label
 */
export const PIECES_LABELS = {
  [PIECE_IDS.ACTE_NAISSANCE]: 'Acte de naissance',
  [PIECE_IDS.CARTE_IDENTITE]: "Carte d'identité",
  [PIECE_IDS.PHOTO_IDENTITE]: "Photo d'identité",
  [PIECE_IDS.RELEVE_BAC]: 'Relevé de notes Bac',
  [PIECE_IDS.QUITTANCE]: 'Quittance de paiement',
  // Anciens IDs (compatibilité affichage)
  'acte-naissance': 'Acte de naissance',
  'carte-identite': "Carte d'identité",
  photo: "Photo d'identité",
  'releve-notes': 'Relevé de notes Bac',
};

/**
 * Mapping des anciens IDs (camelCase) vers les nouveaux IDs (kebab-case)
 * ✅ Pour migration et compatibilité ascendante
 */
export const LEGACY_ID_MAPPING = {
  acteNaissance: PIECE_IDS.ACTE_NAISSANCE,
  'acte-naissance': PIECE_IDS.ACTE_NAISSANCE,
  carteIdentite: PIECE_IDS.CARTE_IDENTITE,
  'carte-identite': PIECE_IDS.CARTE_IDENTITE,
  photo: PIECE_IDS.PHOTO_IDENTITE,
  photoIdentite: PIECE_IDS.PHOTO_IDENTITE,
  releve: PIECE_IDS.RELEVE_BAC,
  'releve-notes': PIECE_IDS.RELEVE_BAC,
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
  const normalizedId = convertLegacyId(pieceId);
  const piece = PIECES_PREDEFINIES.find((p) => p.id === normalizedId);
  return piece?.formats || piece?.formatsDefaut || [FORMATS_FICHIERS.PDF];
}

/**
 * Vérifie si une pièce est obligatoire
 * @param {string} pieceId - ID de la pièce
 * @returns {boolean}
 */
export function isPieceObligatoire(pieceId) {
  const normalizedId = convertLegacyId(pieceId);
  const piece = PIECES_PREDEFINIES.find((p) => p.id === normalizedId);
  return piece ? piece.obligatoire !== false : false;
}

/**
 * Récupère le label d'une pièce
 * @param {string} pieceId - ID de la pièce
 * @returns {string} Label de la pièce
 */
export function getPieceLabel(pieceId) {
  return normalizePieceNom(pieceId, PIECES_LABELS[convertLegacyId(pieceId)] || pieceId);
}

/** Libellé affiché — retire les mentions obsolètes type « (4 exemplaires) ». */
export function normalizePieceNom(pieceId, nom) {
  const id = convertLegacyId(pieceId);
  if (id === PIECE_IDS.PHOTO_IDENTITE) {
    return PIECES_LABELS[PIECE_IDS.PHOTO_IDENTITE];
  }
  const canonical = PIECES_LABELS[id];
  if (canonical) return canonical;
  return String(nom || pieceId || '')
    .replace(/\s*\(\s*\d+\s*exemplaires?\s*\)/gi, '')
    .trim() || String(pieceId || '');
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
  const quittance = PIECES_PREDEFINIES.find((p) => p.id === PIECE_IDS.QUITTANCE);
  return [
    {
      ...quittance,
      formats: [...quittance.formats],
    },
  ];
}

/**
 * Valide une configuration de pièces
 * @param {Array} pieces - Liste des pièces à valider
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
function normalizeFormat(format) {
  if (format === 'JPG') return FORMATS_FICHIERS.JPEG;
  return format;
}

export function validatePiecesConfiguration(pieces) {
  const errors = [];

  if (!Array.isArray(pieces) || pieces.length === 0) {
    errors.push('Au moins une pièce doit être configurée');
    return { valid: false, errors };
  }

  // Vérifier que la quittance est présente
  const hasQuittance = pieces.some((p) => convertLegacyId(p.id) === PIECE_IDS.QUITTANCE);
  if (!hasQuittance) {
    errors.push('La quittance de paiement est obligatoire');
  }

  // Vérifier que chaque pièce a au moins un format
  pieces.forEach((piece) => {
    if (!piece.formats || piece.formats.length === 0) {
      errors.push(`La pièce "${piece.nom}" doit avoir au moins un format accepté`);
    }

    // Vérifier que les formats sont valides
    if (piece.formats) {
      piece.formats.forEach((format) => {
        const normalized = normalizeFormat(format);
        if (!isFormatValide(normalized)) {
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
