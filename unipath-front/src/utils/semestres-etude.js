/** Semestres d'étude (S1–S10), indépendants de l'année académique scolaire. */

export const ANNEES_ETUDE_UE = [
  { value: 1, label: '1ère année (S1–S2)', semestres: [1, 2] },
  { value: 2, label: '2ème année (S3–S4)', semestres: [3, 4] },
  { value: 3, label: '3ème année (S5–S6)', semestres: [5, 6] },
  { value: 4, label: '4ème année — M1 (S7–S8)', semestres: [7, 8] },
  { value: 5, label: '5ème année — M2 (S9–S10)', semestres: [9, 10] },
];

/** Années d'étude affichables selon le type de filière (Licence / Master / Autre). */
export function anneesEtudeForFiliere(filiere) {
  if (!filiere) return ANNEES_ETUDE_UE.slice(0, 3);

  const niveau = String(filiere.niveau || '').toUpperCase();
  const code = String(filiere.code || '').toUpperCase();
  const isMaster = niveau === 'MASTER' || code.endsWith('-M');
  const isAutre = niveau === 'AUTRE';

  if (isMaster) {
    return ANNEES_ETUDE_UE.filter((a) => a.value === 4 || a.value === 5);
  }

  if (isAutre) {
    const duree = Number(filiere.dureeAnnees);
    const maxAnnee = Number.isFinite(duree) && duree > 0
      ? Math.min(Math.max(Math.trunc(duree), 1), 5)
      : 3;
    return ANNEES_ETUDE_UE.filter((a) => a.value >= 1 && a.value <= maxAnnee);
  }

  // Licence : 1ʳᵉ à 3ᵉ année
  return ANNEES_ETUDE_UE.filter((a) => a.value >= 1 && a.value <= 3);
}

/** Texte d'aide sous le filtre année d'étude. */
export function hintAnneesEtudeFiliere(filiere) {
  if (!filiere) return '';
  const niveau = String(filiere.niveau || '').toUpperCase();
  const code = String(filiere.code || '').toUpperCase();
  if (niveau === 'MASTER' || code.endsWith('-M')) {
    return 'Master : 4ᵉ et 5ᵉ année (M1–M2).';
  }
  if (niveau === 'AUTRE') {
    const duree = Number(filiere.dureeAnnees) || 3;
    const max = Math.min(Math.max(Math.trunc(duree), 1), 5);
    return `Niveau indifférent : jusqu'à la ${max}ᵉ année (durée ${duree} an${duree > 1 ? 's' : ''}).`;
  }
  return 'Licence : 1ʳᵉ à 3ᵉ année.';
}

export function anneeEtudeFromSemestre(semestre) {
  const s = Number(semestre);
  if (!Number.isInteger(s) || s < 1 || s > 10) return null;
  return Math.ceil(s / 2);
}

export function labelSemestre(semestre) {
  const s = Number(semestre);
  if (!Number.isInteger(s) || s < 1 || s > 10) return '—';
  const a = anneeEtudeFromSemestre(s);
  const pair = s % 2 === 0;
  return `S${s} (${pair ? `2×${a}` : `2×${a}−1`})`;
}

export function codeSemestre(semestre) {
  const s = Number(semestre);
  if (!Number.isInteger(s) || s < 1 || s > 10) return '—';
  return `S${s}`;
}
