/**
 * Semestres d'étude Module 2 (indépendants de l'année académique scolaire).
 * Pour l'année d'étude a ∈ [1..5] :
 *   - semestre impair : 2a − 1
 *   - semestre pair   : 2a
 * Donc S1…S10.
 */

const ANNEES_ETUDE = [1, 2, 3, 4, 5];

function anneeEtudeFromSemestre(semestre) {
  const s = Number(semestre);
  if (!Number.isInteger(s) || s < 1 || s > 10) return null;
  return Math.ceil(s / 2);
}

function semestresForAnneeEtude(anneeEtude) {
  const a = Number(anneeEtude);
  if (!Number.isInteger(a) || a < 1 || a > 5) return [];
  return [2 * a - 1, 2 * a];
}

function labelSemestre(semestre) {
  const s = Number(semestre);
  if (!Number.isInteger(s) || s < 1 || s > 10) return '—';
  const a = anneeEtudeFromSemestre(s);
  const pair = s % 2 === 0;
  return `S${s} — ${a}ᵉ année (${pair ? `2×${a}` : `2×${a}−1`})`;
}

function labelAnneeEtude(anneeEtude) {
  const a = Number(anneeEtude);
  const labels = {
    1: '1ère année (S1–S2)',
    2: '2ème année (S3–S4)',
    3: '3ème année (S5–S6)',
    4: '4ème année (S7–S8)',
    5: '5ème année (S9–S10)',
  };
  return labels[a] || `Année ${a}`;
}

function isValidSemestre(semestre) {
  const s = Number(semestre);
  return Number.isInteger(s) && s >= 1 && s <= 10;
}

function listAllSemestres() {
  return Array.from({ length: 10 }, (_, i) => {
    const semestre = i + 1;
    return {
      semestre,
      code: `S${semestre}`,
      anneeEtude: anneeEtudeFromSemestre(semestre),
      label: labelSemestre(semestre),
    };
  });
}

module.exports = {
  ANNEES_ETUDE,
  anneeEtudeFromSemestre,
  semestresForAnneeEtude,
  labelSemestre,
  labelAnneeEtude,
  isValidSemestre,
  listAllSemestres,
};
