const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const items = [
  { nom: 'Informatique de gestion', niveau: 'LICENCE' },
  { nom: 'Droit privé', niveau: 'LICENCE' },
  { nom: 'Gestion des entreprises', niveau: 'LICENCE' },
  { nom: 'Marketing digital', niveau: 'LICENCE' },
  { nom: 'Comptabilité et finance', niveau: 'LICENCE' },
  { nom: 'Génie logiciel', niveau: 'MASTER' },
  { nom: 'Administration des affaires (MBA)', niveau: 'MASTER' },
  { nom: 'Finance d\'entreprise', niveau: 'MASTER' },
  { nom: 'Droit des affaires', niveau: 'MASTER' },
  { nom: 'Data Science et IA', niveau: 'MASTER' },
];

async function main() {
  for (const it of items) {
    await prisma.filiereReference.upsert({
      where: { nom: it.nom },
      create: { nom: it.nom, niveau: it.niveau, actif: true },
      update: { niveau: it.niveau, actif: true },
    });
    console.log('OK', it.nom, it.niveau);
  }
  const n = await prisma.filiereReference.count({ where: { actif: true } });
  console.log('Total actives:', n);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
