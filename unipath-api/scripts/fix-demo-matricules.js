/**
 * Remplace les matricules DEMO-2026-* des candidats démo
 * par des matricules UniPath (UnP-AAAA-NNNNNN).
 *
 * Usage: node scripts/fix-demo-matricules.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { genererMatriculeUnique } = require('../src/utils/matricule.helper');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

async function main() {
  const demos = await prisma.candidat.findMany({
    where: {
      OR: [
        { matricule: { startsWith: 'DEMO-' } },
        {
          email: { startsWith: 'harrydedji+candidat', endsWith: '@gmail.com' },
          matricule: { startsWith: 'DEMO-' },
        },
      ],
    },
    select: { id: true, email: true, nom: true, prenom: true, matricule: true },
    orderBy: { email: 'asc' },
  });

  if (demos.length === 0) {
    console.log('Aucun candidat avec matricule DEMO- à corriger.');
    return;
  }

  console.log(`\nCorrection de ${demos.length} matricule(s) DEMO → UniPath\n`);

  for (const c of demos) {
    const nouveau = await genererMatriculeUnique();
    await prisma.candidat.update({
      where: { id: c.id },
      data: { matricule: nouveau },
    });
    console.log(`✅ ${c.prenom} ${c.nom} (${c.email})`);
    console.log(`   ${c.matricule} → ${nouveau}`);
  }

  console.log(`\nTerminé : ${demos.length} matricule(s) mis à jour.\n`);
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
