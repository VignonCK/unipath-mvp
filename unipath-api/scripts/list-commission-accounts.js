require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const membres = await prisma.membreCommission.findMany({
    select: { email: true, prenom: true, nom: true, sousRole: true },
    orderBy: { email: 'asc' },
  });

  console.log('\nMembres Commission en base:\n');
  membres.forEach((m) => {
    console.log(`  ${m.sousRole.padEnd(12)} | ${m.email} (${m.prenom} ${m.nom})`);
  });

  const examinateurs = membres.filter((m) => m.sousRole === 'EXAMINATEUR');
  const controleurs = membres.filter((m) => m.sousRole === 'CONTROLEUR');

  console.log('\nRésumé:');
  console.log(`  Total commission     : ${membres.length}`);
  console.log(`  EXAMINATEUR          : ${examinateurs.length}`);
  console.log(`  CONTROLEUR           : ${controleurs.length}`);
  console.log(`  Attendu (2 + 1)      : ${examinateurs.length === 2 && controleurs.length === 1 ? 'OK' : 'MANQUANT'}\n`);
}

main()
  .finally(() => prisma.$disconnect());
