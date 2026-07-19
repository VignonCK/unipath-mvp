/**
 * Conversion des pièces de campagne (format concours) vers exigences Application.
 */

const PIECE_ID_TO_DOSSIER = {
  acte_naissance: 'acteNaissance',
  'acte-naissance': 'acteNaissance',
  acteNaissance: 'acteNaissance',
  carte_identite: 'carteIdentite',
  'carte-identite': 'carteIdentite',
  carteIdentite: 'carteIdentite',
  photo_identite: 'photo',
  'photo-identite': 'photo',
  photo: 'photo',
  releve_bac: 'releve',
  'releve-notes': 'releve',
  releve: 'releve',
};

/** Obligatoire si niveau d'inscription > 1 (admission en année supérieure). */
const CODE_RELEVE_ANNEE_ANTERIEURE = 'releve_annee_anterieure';

/** Pièces par défaut Module 2 si la campagne n'en a pas configuré. */
const DEFAULT_CAMPAGNE_PIECES = [
  {
    id: 'acte_naissance',
    nom: 'Acte de naissance',
    formats: ['PDF'],
    obligatoire: true,
    predefined: true,
    sourceDossier: 'acteNaissance',
  },
  {
    id: 'carte_identite',
    nom: "Carte d'identité",
    formats: ['PDF', 'JPEG', 'PNG'],
    obligatoire: true,
    predefined: true,
    sourceDossier: 'carteIdentite',
  },
  {
    id: 'photo_identite',
    nom: "Photo d'identité",
    formats: ['JPEG', 'PNG'],
    obligatoire: true,
    predefined: true,
    sourceDossier: 'photo',
  },
  {
    id: 'releve_bac',
    nom: 'Relevé de notes Bac',
    formats: ['PDF'],
    obligatoire: true,
    predefined: true,
    sourceDossier: 'releve',
  },
];

const REQUIREMENT_RELEVE_ANNEE_ANTERIEURE = {
  id: `systeme-${CODE_RELEVE_ANNEE_ANTERIEURE}`,
  code: CODE_RELEVE_ANNEE_ANTERIEURE,
  label: "Relevé de notes / bulletins de l'année antérieure",
  requirementType: 'DOCUMENT_UPLOAD',
  profileFieldKey: null,
  isRequired: true,
  formats: ['PDF', 'JPEG', 'PNG'],
  fromCampagne: false,
  fromSysteme: true,
};

function getDefaultPiecesCampagne() {
  return DEFAULT_CAMPAGNE_PIECES.map((p) => ({ ...p, formats: [...p.formats] }));
}

function extractPiecesList(piecesRequises) {
  if (!piecesRequises) return null;
  if (Array.isArray(piecesRequises)) return piecesRequises;
  if (Array.isArray(piecesRequises.pieces)) return piecesRequises.pieces;
  return null;
}

function normalizePiecesPayload(piecesRequises) {
  if (!piecesRequises) return null;
  if (Array.isArray(piecesRequises)) return { pieces: piecesRequises };
  if (Array.isArray(piecesRequises.pieces)) return { pieces: piecesRequises.pieces };
  return piecesRequises;
}

/**
 * Transforme les pièces campagne en exigences virtuelles (compatibles SchoolRequirement).
 * La quittance frais de dossier est exclue (gérée à part).
 */
function piecesToVirtualRequirements(pieces) {
  if (!Array.isArray(pieces)) return [];

  return pieces
    .filter((p) => p && p.id !== 'quittance')
    .filter((p) => p.obligatoire !== false)
    .map((piece) => {
      const dossierField = piece.sourceDossier || PIECE_ID_TO_DOSSIER[piece.id] || null;
      if (dossierField) {
        return {
          id: `campagne-${piece.id}`,
          code: piece.id,
          label: piece.nom || piece.id,
          requirementType: 'PROFILE_FIELD',
          profileFieldKey: dossierField,
          isRequired: true,
          formats: piece.formats || [],
          fromCampagne: true,
        };
      }
      return {
        id: `campagne-${piece.id}`,
        code: piece.id,
        label: piece.nom || piece.id,
        requirementType: 'DOCUMENT_UPLOAD',
        profileFieldKey: null,
        isRequired: true,
        formats: piece.formats || [],
        fromCampagne: true,
      };
    });
}

function hasReleveAnneeAnterieure(requirements) {
  return (requirements || []).some((r) => {
    const code = String(r.code || r.id || '').toLowerCase();
    return (
      code === CODE_RELEVE_ANNEE_ANTERIEURE
      || code === 'bulletins_annee_anterieure'
      || code.includes('releve_annee')
      || code.includes('bulletin')
    );
  });
}

/**
 * Pour un niveau > 1, impose le relevé / bulletins de l'année précédente.
 */
function withNiveauSuperieurRequirements(requirements, niveau) {
  const list = Array.isArray(requirements) ? [...requirements] : [];
  const n = Number(niveau);
  if (!Number.isFinite(n) || n <= 1) return list;
  if (hasReleveAnneeAnterieure(list)) return list;
  list.push({ ...REQUIREMENT_RELEVE_ANNEE_ANTERIEURE });
  return list;
}

module.exports = {
  PIECE_ID_TO_DOSSIER,
  CODE_RELEVE_ANNEE_ANTERIEURE,
  REQUIREMENT_RELEVE_ANNEE_ANTERIEURE,
  DEFAULT_CAMPAGNE_PIECES,
  getDefaultPiecesCampagne,
  extractPiecesList,
  normalizePiecesPayload,
  piecesToVirtualRequirements,
  withNiveauSuperieurRequirements,
};
