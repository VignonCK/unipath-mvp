/**
 * Tests Phase 2b — génération n° de table + blocage convocation sans numéro.
 *
 * Usage: node scripts/test-phase2b-numeros-convocation.js
 */
require('dotenv').config();
const prisma = require('../src/prisma');
const pdfService = require('../src/services/pdf.service');
const { attribuerNumerosTableParConcours } = require('../src/utils/numero-inscription.helper');
const {
  enrichDossierInscriptionForPdf,
  DOSSIER_CENTRE_INCLUDE,
} = require('../src/utils/centres-composition.helper');
const fs = require('fs');

function check(label, ok, detail = '') {
  console.log(`${ok ? 'OK' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

function parseSeq(numero) {
  const parts = String(numero || '').split('-');
  return Number(parts[parts.length - 1]) || 0;
}

async function ensureCentreChoisi(dossier, concoursId) {
  if (dossier?.concoursCentreId || dossier?.centreChoisi?.centre) {
    return dossier;
  }

  const lien = await prisma.concourscentreComposition.findFirst({
    where: { concoursId, estActif: true },
    include: { centre: true },
  });

  if (!lien) {
    throw new Error('Aucun centre actif sur ce concours — impossible de tester le PDF');
  }

  return prisma.dossierInscription.update({
    where: { id: dossier.id },
    data: {
      concoursCentreId: lien.id,
      centreCompositionChoisi: {
        nom: lien.centre.nom,
        ville: lien.centre.ville,
        adresse: lien.centre.adresse || '',
      },
    },
    include: DOSSIER_CENTRE_INCLUDE,
  });
}

async function main() {
  let all = true;

  const inscription = await prisma.inscription.findFirst({
    where: {
      dossierInscription: { statut: 'VALIDE' },
    },
    include: {
      candidat: { include: { dossier: true } },
      concours: true,
      dossierInscription: {
        include: DOSSIER_CENTRE_INCLUDE,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!inscription?.dossierInscription) {
    console.log('FAIL aucun dossier VALIDE trouvé');
    process.exit(1);
  }

  const concoursId = inscription.concoursId;
  const previousCentre = {
    concoursCentreId: inscription.dossierInscription.concoursCentreId,
    centreCompositionChoisi: inscription.dossierInscription.centreCompositionChoisi,
  };

  console.log(`\nConcours : ${inscription.concours.libelle} (${concoursId})`);
  console.log(`Candidat test : ${inscription.candidat.nom} ${inscription.candidat.prenom}`);
  console.log(`Inscription : ${inscription.id}`);

  await prisma.inscription.updateMany({
    where: { concoursId },
    data: { numeroInscription: null },
  });
  await prisma.concours.update({
    where: { id: concoursId },
    data: { inscriptionCompteur: 0, inscriptionCompteurAnnee: null },
  });

  await ensureCentreChoisi(inscription.dossierInscription, concoursId);

  const withoutNumero = await prisma.inscription.findUnique({
    where: { id: inscription.id },
    include: {
      candidat: { include: { dossier: true } },
      concours: true,
      dossierInscription: { include: DOSSIER_CENTRE_INCLUDE },
    },
  });

  console.log('\n=== 1. VALIDE sans numéro → convocation bloquée ===');
  all = check('numeroInscription null', withoutNumero.numeroInscription == null) && all;

  let blockedOk = false;
  try {
    await pdfService.genererConvocation({
      candidat: withoutNumero.candidat,
      concours: withoutNumero.concours,
      inscription: {
        id: withoutNumero.id,
        numeroInscription: withoutNumero.numeroInscription,
        concours: withoutNumero.concours,
        dossierInscription: enrichDossierInscriptionForPdf(withoutNumero.dossierInscription),
      },
    });
  } catch (err) {
    blockedOk = err.code === 'NUMERO_TABLE_MANQUANT';
    all = check('backend refuse (NUMERO_TABLE_MANQUANT)', blockedOk, err.code || err.message) && all;
  }
  if (!blockedOk) {
    all = check('backend refuse (NUMERO_TABLE_MANQUANT)', false, 'aucune erreur levée') && all;
  }
  all = check('front désactiverait le bouton', !withoutNumero.numeroInscription) && all;

  console.log('\n=== 2. DGES génère les numéros (ordre alpha) ===');
  const valides = await prisma.inscription.findMany({
    where: {
      concoursId,
      dossierInscription: { statut: 'VALIDE' },
    },
    include: { candidat: { select: { nom: true, prenom: true } } },
  });
  valides.sort((a, b) => {
    const n = String(a.candidat.nom).localeCompare(String(b.candidat.nom), 'fr', { sensitivity: 'base' });
    if (n !== 0) return n;
    return String(a.candidat.prenom).localeCompare(String(b.candidat.prenom), 'fr', { sensitivity: 'base' });
  });

  const attribues = await prisma.$transaction(
    (tx) => attribuerNumerosTableParConcours(tx, concoursId),
    { maxWait: 15_000, timeout: 120_000 },
  );
  attribues.forEach((r) => console.log(`  ${r.numeroInscription} → ${r.nom} ${r.prenom}`));

  all = check('batch attribue tous les VALIDE', attribues.length === valides.length, `n=${attribues.length}`) && all;

  let alphaOk = true;
  for (let i = 0; i < attribues.length; i += 1) {
    if (attribues[i].inscriptionId !== valides[i].id) alphaOk = false;
    if (parseSeq(attribues[i].numeroInscription) !== i + 1) alphaOk = false;
  }
  all = check('ordre alphabétique + SEQ', alphaOk) && all;

  console.log('\n=== 3. Même candidat → convocation avec VRAI numéro ===');
  const withNumero = await prisma.inscription.findUnique({
    where: { id: inscription.id },
    include: {
      candidat: { include: { dossier: true } },
      concours: true,
      dossierInscription: { include: DOSSIER_CENTRE_INCLUDE },
    },
  });

  all = check('numéro attribué', Boolean(withNumero.numeroInscription), withNumero.numeroInscription) && all;

  let pdfPath = null;
  try {
    const pdfResult = await pdfService.genererConvocation({
      candidat: withNumero.candidat,
      concours: withNumero.concours,
      inscription: {
        id: withNumero.id,
        numeroInscription: withNumero.numeroInscription,
        concours: withNumero.concours,
        dossierInscription: enrichDossierInscriptionForPdf(withNumero.dossierInscription),
      },
    });
    pdfPath = pdfResult.filePath;
    all = check('PDF généré', fs.existsSync(pdfPath), pdfPath) && all;
    all = check(
      'vrai numéro (pas CONV-faux)',
      Boolean(withNumero.numeroInscription) && !String(withNumero.numeroInscription).startsWith('CONV-'),
      withNumero.numeroInscription,
    ) && all;
  } catch (err) {
    all = check('PDF généré', false, err.message) && all;
  } finally {
    if (pdfPath) {
      try { fs.unlinkSync(pdfPath); } catch { /* ignore */ }
    }
  }

  console.log('\n=== 4. Aucun faux numéro possible (garde email/PDF) ===');
  let fakeBlocked = false;
  try {
    await pdfService.genererConvocation({
      candidat: withNumero.candidat,
      concours: withNumero.concours,
      inscription: {
        id: withNumero.id,
        numeroInscription: null,
        concours: withNumero.concours,
        dossierInscription: enrichDossierInscriptionForPdf(withNumero.dossierInscription),
      },
    });
  } catch (err) {
    fakeBlocked = err.code === 'NUMERO_TABLE_MANQUANT';
    all = check('pas de PDF avec faux numéro', fakeBlocked, err.code) && all;
  }
  if (!fakeBlocked) {
    all = check('pas de PDF avec faux numéro', false) && all;
  }

  await prisma.inscription.updateMany({
    where: { concoursId },
    data: { numeroInscription: null },
  });
  await prisma.concours.update({
    where: { id: concoursId },
    data: { inscriptionCompteur: 0, inscriptionCompteurAnnee: null },
  });
  await prisma.dossierInscription.update({
    where: { id: inscription.dossierInscription.id },
    data: {
      concoursCentreId: previousCentre.concoursCentreId,
      centreCompositionChoisi: previousCentre.centreCompositionChoisi,
    },
  });
  console.log('\nÉtat test nettoyé (numéros + centre restaurés)');

  console.log(`\n=== VERDICT: ${all ? 'TOUS LES TESTS OK' : 'ÉCHECS'} ===`);
  process.exit(all ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
