/**
 * Ajoute les exigences dossier par défaut à chaque établissement privé.
 * Usage: node scripts/seed-school-requirements-default.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = require('../src/prisma');
const { upsertDefaultSchoolRequirements } = require('../src/utils/default-school-requirements.helper');

async function main() {
  const etablissements = await prisma.etablissement.findMany({
    where: { type: 'PRIVE' },
    select: { id: true, nom: true },
    orderBy: { nom: 'asc' },
  });

  console.log(`\n=== Exigences dossier par défaut — ${etablissements.length} établissement(s) privé(s) ===\n`);

  for (const etab of etablissements) {
    await upsertDefaultSchoolRequirements(prisma, etab.id);
    console.log(`✅ ${etab.nom}`);
  }

  const total = await prisma.schoolRequirement.count();
  console.log(`\nTerminé. ${total} exigence(s) au total en base.\n`);
}

main()
  .catch((err) => {
    console.error('Erreur:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
