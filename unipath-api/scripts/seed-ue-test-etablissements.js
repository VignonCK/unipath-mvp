/**
 * Seed : 6 UE par semestre pour chaque filière des établissements de test
 * (Pigier, UATM, ESATIC).
 *
 * - Licence (dureeAnnees) → années 1..duree → semestres 2a-1 et 2a
 * - Master → années (6-duree)..5  ex. duree 2 → années 4–5 (S7–S10)
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const ETAB_PATTERNS = ['Pigier', 'Université Africaine de Technologie', 'Africaine des TIC'];
const UE_PER_SEMESTRE = 6;
const TAG = 'SEED-UE';

const LIBELLES = [
  'Fondamentaux',
  'Méthodologie',
  'Applications pratiques',
  'Projet tutoré',
  'Communication professionnelle',
  'Évaluation et synthèse',
];

function anneesPourFiliere(filiere) {
  const duree = Math.min(Math.max(Number(filiere.dureeAnnees) || 3, 1), 5);
  const isMaster =
    filiere.niveau === 'MASTER'
    || String(filiere.code || '').toUpperCase().endsWith('-M');

  if (isMaster) {
    const start = 6 - duree; // duree 2 → 4, duree 1 → 5
    return Array.from({ length: duree }, (_, i) => start + i);
  }
  return Array.from({ length: duree }, (_, i) => i + 1);
}

function semestresPourAnnee(a) {
  return [2 * a - 1, 2 * a];
}

(async () => {
  // Nettoyer les UE précédentes de ce seed
  const deleted = await p.uniteEnseignement.deleteMany({
    where: { code: { startsWith: `${TAG}-` } },
  });

  const etabs = await p.etablissement.findMany({
    where: {
      OR: ETAB_PATTERNS.map((nom) => ({ nom: { contains: nom } })),
    },
    select: {
      id: true,
      nom: true,
      filieres: {
        select: { id: true, nom: true, code: true, dureeAnnees: true, niveau: true },
      },
    },
  });

  let created = 0;
  const summary = [];

  for (const etab of etabs) {
    const etabSummary = { etab: etab.nom, filieres: [] };
    for (const filiere of etab.filieres) {
      const annees = anneesPourFiliere(filiere);
      let count = 0;
      for (const anneeEtude of annees) {
        for (const semestre of semestresPourAnnee(anneeEtude)) {
          for (let i = 1; i <= UE_PER_SEMESTRE; i++) {
            const code = `${TAG}-S${semestre}-${String(i).padStart(2, '0')}-${filiere.code}`.slice(0, 191);
            const libelle = `${LIBELLES[i - 1]} S${semestre}`;
            await p.uniteEnseignement.create({
              data: {
                filiereId: filiere.id,
                code,
                libelle,
                credits: i <= 4 ? 3 : 2,
                semestre,
                anneeEtude,
                ordre: i,
              },
            });
            created += 1;
            count += 1;
          }
        }
      }
      etabSummary.filieres.push({
        filiere: filiere.nom,
        code: filiere.code,
        niveau: filiere.niveau,
        annees,
        ueCreated: count,
      });
    }
    summary.push(etabSummary);
  }

  console.log(JSON.stringify({ deletedPrevious: deleted.count, created, summary }, null, 2));
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
