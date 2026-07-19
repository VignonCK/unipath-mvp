const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const items = [
  { old: 'Communication et journalisme', nom: 'Communication et journalisme' },
  { old: 'Tourisme et hotellerie', nom: 'Tourisme et hôtellerie' },
  { old: 'Sciences de l education', nom: "Sciences de l'éducation" },
  { old: 'Agronomie et developpement rural', nom: 'Agronomie et développement rural' },
  { old: 'Sante publique communautaire', nom: 'Santé publique communautaire' },
];

async function main() {
  for (const it of items) {
    const existing = await prisma.filiereReference.findUnique({ where: { nom: it.old } });
    if (existing) {
      if (it.old !== it.nom) {
        await prisma.filiereReference.update({
          where: { id: existing.id },
          data: { nom: it.nom, niveau: null, actif: true },
        });
      } else {
        await prisma.filiereReference.update({
          where: { id: existing.id },
          data: { niveau: null, actif: true },
        });
      }
      console.log('OK', it.nom, '(indifférent)');
    } else {
      await prisma.filiereReference.upsert({
        where: { nom: it.nom },
        create: { nom: it.nom, niveau: null, actif: true },
        update: { niveau: null, actif: true },
      });
      console.log('OK', it.nom, '(indifférent)');
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
