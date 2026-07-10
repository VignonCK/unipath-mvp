/**
 * Derive previous academic year from "YYYY-YYYY" (e.g. 2025-2026 → 2024-2025).
 * Returns null if the format is invalid.
 */
export function previousAnneeAcademique(annee) {
  if (!annee || typeof annee !== 'string') return null;
  const match = annee.trim().match(/^(\d{4})-(\d{4})$/);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end !== start + 1) return null;
  return `${start - 1}-${end - 1}`;
}

/**
 * True if the candidat has a VALIDE academic inscription for filière + année N-1.
 */
export function isEligibleReinscription(inscriptions, { filiereId, anneeCampagne }) {
  const anneeN1 = previousAnneeAcademique(anneeCampagne);
  if (!anneeN1 || !filiereId || !Array.isArray(inscriptions)) return false;
  return inscriptions.some(
    (ins) =>
      ins.filiereId === filiereId &&
      ins.anneeAcademique === anneeN1 &&
      ins.statut === 'VALIDE',
  );
}
