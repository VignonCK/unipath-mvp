require('dotenv').config();
const prisma = require('../src/prisma');

async function main() {
  await prisma.dossierInscription.updateMany({
    where: { inscriptionId: '817df7ff-f49c-4532-a286-810f325651ae' },
    data: {
      statut: 'VALIDE_PAR_COMMISSION',
      centreCompositionChoisi: null,
    },
  });
  console.log('Dossier réinitialisé pour retest (VALIDE_PAR_COMMISSION, centre vide).');
}

main().finally(() => prisma.$disconnect());
