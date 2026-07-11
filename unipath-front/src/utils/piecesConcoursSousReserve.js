import { convertLegacyId, DOSSIER_PERSONNEL_FIELDS } from '../constants/pieces';

const QUITTANCE = { code: 'quittance', label: 'Quittance de paiement' };

function parsePiecesRequises(concours) {
  const raw = concours?.piecesRequises;
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.pieces)) return raw.pieces;
  return [];
}

function isDossierBasePieceId(pieceId) {
  const normalized = convertLegacyId(pieceId);
  return DOSSIER_PERSONNEL_FIELDS.some((p) => p.key === normalized);
}

function isPieceBaseOuQuittance(code) {
  return DOSSIER_PERSONNEL_FIELDS.some((p) => p.key === code) || code === 'quittance';
}

/** Pièces sélectionnables pour une mise sous réserve (aligné backend). */
export function listPiecesDisponiblesConcours(concours) {
  const extras = parsePiecesRequises(concours)
    .filter((p) => p?.id && !isDossierBasePieceId(p.id) && p.id !== 'quittance')
    .map((p) => ({
      code: String(p.id).trim(),
      label: p.nom || p.id,
    }));

  const byCode = new Map();
  for (const p of [...DOSSIER_PERSONNEL_FIELDS.map((f) => ({ code: f.key, label: f.label })), QUITTANCE, ...extras]) {
    byCode.set(p.code, p);
  }
  return [...byCode.values()];
}

/** Pièces déjà déposées sur le dossier, filtrées par concours. */
export function buildPiecesDeposeesConcours(inscription) {
  const concours = inscription?.concours;
  const dossier = inscription?.candidat?.dossier;
  const disponibles = new Map(listPiecesDisponiblesConcours(concours).map((p) => [p.code, p]));
  const result = [];

  for (const field of DOSSIER_PERSONNEL_FIELDS) {
    if (dossier?.[field.key] && disponibles.has(field.key)) {
      result.push(disponibles.get(field.key));
    }
  }
  if (inscription?.quittance && disponibles.has('quittance')) {
    result.push(disponibles.get('quittance'));
  }
  const extras = inscription?.piecesExtras || {};
  for (const [code, val] of Object.entries(extras)) {
    if (val && disponibles.has(code)) {
      result.push(disponibles.get(code));
    }
  }

  const seen = new Set();
  return result.filter((p) => {
    if (seen.has(p.code)) return false;
    seen.add(p.code);
    return true;
  });
}

export function getPiecesACorrigerCodes(piecesACorriger) {
  if (!Array.isArray(piecesACorriger)) return [];
  return piecesACorriger
    .map((p) => (typeof p === 'string' ? p.trim() : String(p?.code || '').trim()))
    .filter(Boolean);
}

export function getPieceLabel(piecesACorriger, code, fallbackLabel) {
  if (Array.isArray(piecesACorriger)) {
    const entry = piecesACorriger.find((p) => (typeof p === 'string' ? p : p?.code) === code);
    if (entry && typeof entry === 'object' && entry.label) return entry.label;
  }
  return fallbackLabel || code;
}

export function getPieceCorrectionStatus(piecesACorriger, code) {
  if (!Array.isArray(piecesACorriger)) return null;
  const entry = piecesACorriger.find((p) => (typeof p === 'string' ? p : p?.code) === code);
  if (!entry || typeof entry === 'string') return 'A_CORRIGER';
  return entry.status || 'A_CORRIGER';
}
