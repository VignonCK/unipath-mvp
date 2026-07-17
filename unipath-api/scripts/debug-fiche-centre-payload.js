/**
 * Test génération payload fiche pour un candidat.
 */
const { PrismaClient } = require('@prisma/client');
const {
  DOSSIER_CENTRE_INCLUDE,
  enrichDossierInscriptionForPdf,
} = require('../src/utils/centres-composition.helper');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'bkoussedoh@gmail.com';
  const candidat = await prisma.candidat.findUnique({ where: { email } });
  if (!candidat) {
    console.log('Candidat introuvable');
    return;
  }

  const inscription = await prisma.inscription.findFirst({
    where: { candidatId: candidat.id },
    include: {
      concours: true,
      dossierInscription: { include: DOSSIER_CENTRE_INCLUDE },
    },
    orderBy: { createdAt: 'desc' },
  });

  const dossierEnrichi = enrichDossierInscriptionForPdf(inscription.dossierInscription);
  const payload = {
    centreCompositionChoisi: dossierEnrichi?.centreCompositionChoisi || null,
    fallbackEtablissement: inscription.concours.etablissement,
  };
  console.log(JSON.stringify(payload, null, 2));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
