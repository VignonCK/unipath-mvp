/**
 * Augmente les effectifs passants (VALIDE) et redoublants (REDOUBLANT)
 * parmi les inscriptions EN_COURS existantes (Module 2).
 *
 * - Applique aussi des validations UE cohérentes (excellent/bon → passant,
 *   echec/faible → redoublant) pour les bilans.
 * - Idempotent via decidedBy TAG.
 *
 * Usage: node scripts/boost-passants-redoublants.js
 */
const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient();
const TAG = 'SEED-BOOST-PR';

const PROFILS = {
  excellent: ['V', 'V', 'V', 'V', 'V', 'V'],
  bon: ['V', 'V', 'V', 'V', 'V', null],
  moyen: ['V', 'V', 'V', 'N', null, null],
  faible: ['V', 'N', 'N', 'N', null, null],
  echec: ['V', 'V', 'N', 'N', 'N', 'N'],
};

function statutFromToken(token) {
  if (token === 'V') return 'VALIDE';
  if (token === 'N') return 'NON_VALIDE';
  return null;
}

async function applyProfil(inscriptionId, unites, profilKey) {
  const pattern = PROFILS[profilKey];
  if (!pattern || !unites.length) return 0;
  let applied = 0;
  const n = Math.min(pattern.length, unites.length);
  for (let i = 0; i < n; i++) {
    const statut = statutFromToken(pattern[i]);
    if (!statut) continue;
    await p.validationUE.upsert({
      where: {
        inscriptionAcadId_uniteEnseignementId: {
          inscriptionAcadId: inscriptionId,
          uniteEnseignementId: unites[i].id,
        },
      },
      create: {
        inscriptionAcadId: inscriptionId,
        uniteEnseignementId: unites[i].id,
        statut,
        decidedAt: new Date(),
        decidedBy: TAG,
      },
      update: {
        statut,
        decidedAt: new Date(),
        decidedBy: TAG,
      },
    });
    applied += 1;
  }
  return applied;
}

async function seedValidations(inscription, sImpair, sPair) {
  const semestreImpair = 2 * inscription.niveau - 1;
  const semestrePair = 2 * inscription.niveau;
  const unitesImpair = await p.uniteEnseignement.findMany({
    where: {
      filiereId: inscription.filiereId,
      anneeEtude: inscription.niveau,
      semestre: semestreImpair,
    },
    orderBy: [{ ordre: 'asc' }, { code: 'asc' }],
  });
  const unitesPair = await p.uniteEnseignement.findMany({
    where: {
      filiereId: inscription.filiereId,
      anneeEtude: inscription.niveau,
      semestre: semestrePair,
    },
    orderBy: [{ ordre: 'asc' }, { code: 'asc' }],
  });
  const a = await applyProfil(inscription.id, unitesImpair, sImpair);
  const b = await applyProfil(inscription.id, unitesPair, sPair);
  return a + b;
}

(async () => {
  const before = await p.inscriptionAcademique.groupBy({
    by: ['anneeAcademique', 'statut'],
    _count: true,
  });

  // Cibles : convertir une partie des EN_COURS en VALIDE / REDOUBLANT
  // Priorité année courante 2026-2027, puis 2027-2028, puis le reste.
  const enCours = await p.inscriptionAcademique.findMany({
    where: { statut: 'EN_COURS' },
    orderBy: [{ anneeAcademique: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      niveau: true,
      filiereId: true,
      anneeAcademique: true,
      candidat: { select: { email: true } },
      filiere: { select: { code: true } },
    },
  });

  // Objectif : ~12 passants + ~10 redoublants supplémentaires (ou tous les EN_COURS si moins)
  const TARGET_PASSANTS = 12;
  const TARGET_REDOUBLANTS = 10;

  // Alternance déterministe : index pair → passant, impair → redoublant, jusqu'aux quotas
  const toPassant = [];
  const toRedoublant = [];

  for (const row of enCours) {
    // Réserver un peu d'EN_COURS pour les tests de décision manuelle (~6)
    const remaining = enCours.length - toPassant.length - toRedoublant.length;
    const reserved = 6;
    if (remaining <= reserved) break;

    if (toPassant.length < TARGET_PASSANTS && toPassant.length <= toRedoublant.length) {
      toPassant.push(row);
    } else if (toRedoublant.length < TARGET_REDOUBLANTS) {
      toRedoublant.push(row);
    } else if (toPassant.length < TARGET_PASSANTS) {
      toPassant.push(row);
    } else {
      break;
    }
  }

  let validationsApplied = 0;
  const updated = [];

  for (const row of toPassant) {
    await p.inscriptionAcademique.update({
      where: { id: row.id },
      data: { statut: 'VALIDE' },
    });
    validationsApplied += await seedValidations(row, 'excellent', 'bon');
    updated.push({
      email: row.candidat.email,
      filiere: row.filiere.code,
      annee: row.anneeAcademique,
      niveau: row.niveau,
      statut: 'VALIDE',
    });
  }

  for (const row of toRedoublant) {
    await p.inscriptionAcademique.update({
      where: { id: row.id },
      data: { statut: 'REDOUBLANT' },
    });
    validationsApplied += await seedValidations(row, 'echec', 'faible');
    updated.push({
      email: row.candidat.email,
      filiere: row.filiere.code,
      annee: row.anneeAcademique,
      niveau: row.niveau,
      statut: 'REDOUBLANT',
    });
  }

  const after = await p.inscriptionAcademique.groupBy({
    by: ['anneeAcademique', 'statut'],
    _count: true,
  });

  const sumStatut = (rows, statut) =>
    rows.filter((r) => r.statut === statut).reduce((a, r) => a + r._count, 0);

  console.log(
    JSON.stringify(
      {
        before: {
          VALIDE: sumStatut(before, 'VALIDE'),
          REDOUBLANT: sumStatut(before, 'REDOUBLANT'),
          EN_COURS: sumStatut(before, 'EN_COURS'),
          detail: before,
        },
        converted: {
          passants: toPassant.length,
          redoublants: toRedoublant.length,
          validationsApplied,
        },
        after: {
          VALIDE: sumStatut(after, 'VALIDE'),
          REDOUBLANT: sumStatut(after, 'REDOUBLANT'),
          EN_COURS: sumStatut(after, 'EN_COURS'),
          detail: after,
        },
        updated,
      },
      null,
      2
    )
  );

  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
