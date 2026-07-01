require('dotenv').config();
const prisma = require('../src/prisma');

const EMAILS_FICTIFS = [
  'contact@esatic.bj',
  'contact@esam-parakou.bj',
  'contact@fsega-benin.bj',
  'contact@ispp-benin.bj',
];

async function main() {
  for (const email of EMAILS_FICTIFS) {
    const etab = await prisma.etablissement.findUnique({ where: { email } });
    if (!etab) {
      console.log(`— Absent : ${email}`);
      continue;
    }
    await prisma.etablissement.delete({ where: { id: etab.id } });
    console.log(`✅ Supprimé : ${etab.nom} (${email})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
