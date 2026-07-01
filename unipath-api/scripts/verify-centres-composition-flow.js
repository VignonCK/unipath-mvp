require('dotenv').config();
const prisma = require('../src/prisma');
const {
  resolveChoixCentre,
  concoursHasCentres,
  peutChoisirCentre,
} = require('../src/utils/centres-composition.helper');

const INSCRIPTION_ID = '817df7ff-f49c-4532-a286-810f325651ae';

async function main() {
  const inscription = await prisma.inscription.findUnique({
    where: { id: INSCRIPTION_ID },
    include: {
      concours: true,
      dossierInscription: true,
      candidat: { include: { dossier: true } },
    },
  });

  if (!inscription?.dossierInscription) {
    throw new Error('Inscription ou dossier manquant');
  }

  const statut = inscription.dossierInscription.statut;
  console.log('1. Statut initial:', statut);
  console.log('   Peut choisir centre:', peutChoisirCentre(statut));
  console.log('   Concours a des centres:', concoursHasCentres(inscription.concours.centresComposition));

  const resolved = resolveChoixCentre(inscription.concours.centresComposition, {
    ville: 'Parakou',
    nom: 'IFSIO',
  });
  if (!resolved.valid) throw new Error(resolved.error);

  const dossier = await prisma.dossierInscription.update({
    where: { id: inscription.dossierInscription.id },
    data: {
      centreCompositionChoisi: {
        ...resolved.data,
        choisiLe: new Date().toISOString(),
      },
    },
  });
  console.log('2. Centre enregistré:', dossier.centreCompositionChoisi);

  await prisma.dossierInscription.update({
    where: { id: inscription.dossierInscription.id },
    data: { statut: 'VALIDE' },
  });
  console.log('3. Statut passé à VALIDE (simulation contrôleur)');

  const pdfService = require('../src/services/pdf.service');
  const refreshed = await prisma.inscription.findUnique({
    where: { id: INSCRIPTION_ID },
    include: {
      concours: true,
      dossierInscription: true,
      candidat: { include: { dossier: true } },
    },
  });

  const pdfResult = await pdfService.genererConvocation({
    candidat: refreshed.candidat,
    concours: refreshed.concours,
    inscription: refreshed,
  });

  console.log('4. Convocation PDF générée:', pdfResult.filePath);
  console.log('   Fichier existe:', require('fs').existsSync(pdfResult.filePath));
  console.log('\n✅ Parcours backend OK');
  console.log('Frontend: login unipathepac@gmail.com → /inscription/' + INSCRIPTION_ID);
}

main()
  .catch((e) => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
