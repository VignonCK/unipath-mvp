require('dotenv').config();
const fs = require('fs');
const prisma = require('../src/prisma');
const {
  resolveChoixCentre,
  concoursHasCentres,
  peutChoisirCentre,
} = require('../src/utils/centres-composition.helper');
const {
  attribuerNumerosTableParConcours,
} = require('../src/utils/numero-inscription.helper');

const INSCRIPTION_ID = '817df7ff-f49c-4532-a286-810f325651ae';

async function ensureNumeroTable(inscriptionId, concoursId) {
  const current = await prisma.inscription.findUnique({
    where: { id: inscriptionId },
    select: { numeroInscription: true },
  });
  if (current?.numeroInscription) {
    console.log('   N° de table déjà présent:', current.numeroInscription);
    return current.numeroInscription;
  }
  const { attribues } = await prisma.$transaction(
    (tx) => attribuerNumerosTableParConcours(tx, concoursId),
    { timeout: 30000 },
  );
  const mine = attribues.find((a) => a.inscriptionId === inscriptionId);
  const numero = mine?.numeroInscription
    || (await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      select: { numeroInscription: true },
    }))?.numeroInscription;
  if (!numero) {
    throw new Error('Impossible d\'attribuer un n° de table avant génération convocation');
  }
  console.log('   N° de table attribué:', numero);
  return numero;
}

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

  console.log('3b. Prérequis n° de table (avant PDF)');
  await ensureNumeroTable(inscription.id, inscription.concoursId);

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
  console.log('   Fichier existe:', fs.existsSync(pdfResult.filePath));
  console.log('\n✅ Parcours backend OK');
  console.log('Frontend: login unipathepac@gmail.com → /inscription/' + INSCRIPTION_ID);
}

main()
  .catch((e) => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
