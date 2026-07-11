/**
 * SOUS_RESERVE Module 1 (concours) — ciblage de pièces, aligné Module 2.
 * Codes = clés d'upload (acteNaissance, quittance, extras concours…).
 */

const { getPiecesACorrigerCodes } = require('./preinscription.helper');

const PIECES_BASE = [
  { code: 'acteNaissance', label: 'Acte de naissance' },
  { code: 'carteIdentite', label: "Carte nationale d'identité" },
  { code: 'photo', label: "Photo d'identité" },
  { code: 'releve', label: 'Relevé de notes Bac' },
];

const QUITTANCE = { code: 'quittance', label: 'Quittance de paiement' };

const LEGACY_TO_UPLOAD = {
  acte_naissance: 'acteNaissance',
  'acte-naissance': 'acteNaissance',
  carte_identite: 'carteIdentite',
  'carte-identite': 'carteIdentite',
  photo_identite: 'photo',
  photoIdentite: 'photo',
  releve_bac: 'releve',
  'releve-notes': 'releve',
  quittance: 'quittance',
};

function normalizePieceCode(code) {
  const raw = String(code || '').trim();
  if (!raw) return '';
  if (LEGACY_TO_UPLOAD[raw]) return LEGACY_TO_UPLOAD[raw];
  return raw;
}

function parsePiecesRequises(concours) {
  const raw = concours?.piecesRequises;
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.pieces)) return raw.pieces;
  return [];
}

function isPieceBaseOuQuittance(code) {
  const n = normalizePieceCode(code);
  return PIECES_BASE.some((p) => p.code === n) || n === 'quittance';
}

/** Liste des pièces sélectionnables pour une mise sous réserve concours. */
function listPiecesDisponiblesConcours(concours) {
  const extras = parsePiecesRequises(concours)
    .filter((p) => p?.id && !isPieceBaseOuQuittance(p.id))
    .map((p) => ({
      code: String(p.id).trim(),
      label: p.nom || p.id,
    }));

  const byCode = new Map();
  for (const p of [...PIECES_BASE, QUITTANCE, ...extras]) {
    byCode.set(p.code, p);
  }
  return [...byCode.values()];
}

/**
 * Valide et résout piecesACorriger pour un concours.
 * @returns {{ ok: true, payload: Array } | { ok: false, error: string, codesIntrouvables?: string[] }}
 */
function resolvePiecesACorrigerPayload(codesInput, concours) {
  if (!Array.isArray(codesInput) || codesInput.length === 0) {
    return {
      ok: false,
      error: 'Au moins une pièce à corriger (piecesACorriger) est obligatoire pour une mise sous réserve',
    };
  }

  const invalid = codesInput.filter((c) => typeof c !== 'string' || !String(c).trim());
  if (invalid.length > 0) {
    return { ok: false, error: 'piecesACorriger doit être un tableau de codes (string) non vides' };
  }

  const available = new Map(
    listPiecesDisponiblesConcours(concours).map((p) => [p.code, p]),
  );
  const codes = [...new Set(codesInput.map((c) => normalizePieceCode(c)).filter(Boolean))];
  const resolved = [];
  const missing = [];

  for (const code of codes) {
    const meta = available.get(code);
    if (!meta) {
      missing.push(code);
      continue;
    }
    resolved.push({
      code: meta.code,
      label: meta.label,
      status: 'A_CORRIGER',
    });
  }

  if (missing.length > 0) {
    return {
      ok: false,
      error: 'Certaines pièces demandées sont introuvables pour ce concours',
      codesIntrouvables: missing,
    };
  }
  if (resolved.length === 0) {
    return {
      ok: false,
      error: 'Au moins une pièce valide est obligatoire dans piecesACorriger',
    };
  }

  return { ok: true, payload: resolved };
}

function markPieceCorrigee(piecesACorriger, typePiece) {
  const code = normalizePieceCode(typePiece);
  if (!Array.isArray(piecesACorriger) || !code) return piecesACorriger;

  return piecesACorriger.map((entry) => {
    if (typeof entry === 'string') {
      const c = normalizePieceCode(entry);
      return {
        code: c,
        label: c,
        status: c === code ? 'PROVIDED' : 'A_CORRIGER',
      };
    }
    const c = normalizePieceCode(entry?.code);
    if (c !== code) return entry;
    return { ...entry, code: c, status: 'PROVIDED' };
  });
}

/** null = pas de ciblage (legacy) ; true/false = toutes les pièces ciblées corrigées. */
function allPiecesCibleesCorrigees(piecesACorriger) {
  const codes = getPiecesACorrigerCodes(piecesACorriger);
  if (codes.length === 0) return null;

  return piecesACorriger.every((entry) => {
    if (typeof entry === 'string') return false;
    return entry?.status === 'PROVIDED';
  });
}

function isPieceAutoriseeSousReserve(piecesACorriger, typePiece) {
  const codes = getPiecesACorrigerCodes(piecesACorriger).map(normalizePieceCode);
  if (codes.length === 0) return true; // legacy : pas de garde stricte
  return codes.includes(normalizePieceCode(typePiece));
}

module.exports = {
  PIECES_BASE,
  QUITTANCE,
  normalizePieceCode,
  listPiecesDisponiblesConcours,
  resolvePiecesACorrigerPayload,
  markPieceCorrigee,
  allPiecesCibleesCorrigees,
  isPieceAutoriseeSousReserve,
  getPiecesACorrigerCodes,
};
