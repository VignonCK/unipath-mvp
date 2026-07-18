require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('../src/prisma');
const pdfService = require('../src/services/pdf.service');
const {
  enrichDossierInscriptionForPdf,
  flattenCentreChoisi,
} = require('../src/utils/centres-composition.helper');
const {
  attribuerNumerosTableParConcours,
} = require('../src/utils/numero-inscription.helper');

const INSCRIPTION_INCLUDE = {
  concours: true,
  dossierInscription: {
    include: {
      centreChoisi: { include: { centre: true } },
    },
  },
  candidat: { include: { dossier: true } },
};

async function loadInscription(id) {
  return prisma.inscription.findUnique({
    where: { id },
    include: INSCRIPTION_INCLUDE,
  });
}

async function findTestInscription() {
  const candidates = await prisma.inscription.findMany({
    where: {
      dossierInscription: { statut: 'VALIDE' },
      concours: {
        concoursCentres: { some: { estActif: true } },
      },
    },
    include: INSCRIPTION_INCLUDE,
    take: 5,
  });
  return candidates[0] || null;
}

async function ensureNumeroTable(inscriptionId, concoursId) {
  const current = await prisma.inscription.findUnique({
    where: { id: inscriptionId },
    select: { numeroInscription: true },
  });
  if (current?.numeroInscription) {
    console.log('N° de table déjà présent:', current.numeroInscription);
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
    throw new Error('Impossible d\'attribuer un n° de table avant le test centre');
  }
  console.log('N° de table attribué pour le test:', numero);
  return numero;
}

async function tryGenererConvocation(inscription) {
  const dossierPdf = enrichDossierInscriptionForPdf(inscription.dossierInscription);
  return pdfService.genererConvocation({
    candidat: inscription.candidat,
    concours: inscription.concours,
    inscription: {
      id: inscription.id,
      numeroInscription: inscription.numeroInscription,
      concoursId: inscription.concoursId,
      concours: inscription.concours,
      dossierInscription: dossierPdf,
      candidat: { dossier: inscription.candidat?.dossier ?? null },
    },
  });
}

async function main() {
  let inscription = await loadInscription('817df7ff-f49c-4532-a286-810f325651ae');
  if (!inscription) {
    inscription = await findTestInscription();
  }
  if (!inscription?.dossierInscription) {
    throw new Error('Aucune inscription VALIDE avec centres trouvee pour le test');
  }

  const concoursCentre = await prisma.concourscentreComposition.findFirst({
    where: { concoursId: inscription.concoursId, estActif: true },
    include: { centre: true },
  });
  if (!concoursCentre) {
    throw new Error('Aucun centre actif pour ce concours');
  }

  const dossierId = inscription.dossierInscription.id;
  const backup = {
    statut: inscription.dossierInscription.statut,
    concoursCentreId: inscription.dossierInscription.concoursCentreId,
    centreCompositionChoisi: inscription.dossierInscription.centreCompositionChoisi,
    numeroInscription: inscription.numeroInscription,
  };

  console.log('Inscription test:', inscription.id);
  console.log('Concours:', inscription.concours?.libelle);
  console.log('Centre dispo:', concoursCentre.centre.nom, '-', concoursCentre.centre.ville);

  try {
    // Prérequis: VALIDE + n° de table (isole le garde-fou CENTRE du garde-fou N°)
    await prisma.dossierInscription.update({
      where: { id: dossierId },
      data: {
        statut: 'VALIDE',
        concoursCentreId: null,
        centreCompositionChoisi: null,
      },
    });
    await ensureNumeroTable(inscription.id, inscription.concoursId);

    console.log('\n--- Test 1: VALIDE + n° table, sans centre ---');
    let blocked = false;
    try {
      await tryGenererConvocation(await loadInscription(inscription.id));
      console.log('ECHEC: la generation aurait du etre bloquee');
      process.exitCode = 1;
    } catch (err) {
      blocked = err.code === 'CENTRE_NON_CHOISI'
        || /centre de composition/i.test(err.message);
      console.log('Bloque:', blocked ? 'OUI' : 'NON');
      console.log('Code:', err.code);
      console.log('Message:', err.message);
      if (!blocked) throw err;
    }

    await prisma.dossierInscription.update({
      where: { id: dossierId },
      data: { concoursCentreId: concoursCentre.id },
    });

    const withCentre = await loadInscription(inscription.id);
    const centreFlat = flattenCentreChoisi(withCentre.dossierInscription);
    console.log('\n--- Test 2: apres choix centre ---');
    console.log('Centre choisi:', `${centreFlat.nom} — ${centreFlat.ville} — ${centreFlat.adresse || '(sans adresse)'}`);

    const pdfResult = await tryGenererConvocation(withCentre);
    const exists = fs.existsSync(pdfResult.filePath);
    console.log('PDF genere:', exists ? 'OUI' : 'NON', pdfResult.filePath);
    if (!exists) {
      process.exitCode = 1;
      return;
    }

    const tempDir = path.join(__dirname, '../temp');
    const inputFiles = fs.readdirSync(tempDir).filter((f) => f.startsWith('input-convocation-'));
    const lastInput = inputFiles.sort().pop();
    if (lastInput) {
      const payload = JSON.parse(fs.readFileSync(path.join(tempDir, lastInput), 'utf8'));
      const centrePdf = payload.centreCompositionChoisi;
      console.log('Payload PDF centre:', centrePdf);
      const okCentre = centrePdf?.nom === centreFlat.nom
        && centrePdf?.ville === centreFlat.ville;
      console.log('Centre correct dans payload:', okCentre ? 'OUI' : 'NON');
      if (!okCentre) process.exitCode = 1;
    }

    if (!process.exitCode) console.log('\n✅ Flux complet OK (garde-fou centre isolé)');
  } finally {
    await prisma.dossierInscription.update({
      where: { id: dossierId },
      data: {
        statut: backup.statut,
        concoursCentreId: backup.concoursCentreId,
        centreCompositionChoisi: backup.centreCompositionChoisi,
      },
    });
    await prisma.inscription.update({
      where: { id: inscription.id },
      data: { numeroInscription: backup.numeroInscription },
    });
    console.log('\nEtat dossier/inscription restaure.');
  }
}

main()
  .catch((e) => {
    console.error('❌', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
