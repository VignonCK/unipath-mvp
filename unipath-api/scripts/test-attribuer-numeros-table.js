/**
 * Tests Phase 1 — attribution alphabétique + APPEND des n° de table.
 *
 * Prérequis : migration reset déjà exécutée
 *   (node scripts/migrate-reset-numeros-table.js)
 *
 * Usage :
 *   node scripts/test-attribuer-numeros-table.js
 *   node scripts/test-attribuer-numeros-table.js --concoursId=<uuid>
 */
require('dotenv').config();
const prisma = require('../src/prisma');
const {
  attribuerNumerosTableParConcours,
} = require('../src/utils/numero-inscription.helper');

function check(label, ok, detail = '') {
  console.log(`${ok ? 'OK' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

function parseSeq(numero) {
  const parts = String(numero || '').split('-');
  return Number(parts[parts.length - 1]) || 0;
}

async function resolveConcours(preferredId) {
  if (preferredId) {
    const c = await prisma.concours.findUnique({
      where: { id: preferredId },
      select: { id: true, libelle: true },
    });
    if (!c) throw new Error(`Concours ${preferredId} introuvable`);
    return c;
  }

  const epac = await prisma.concours.findFirst({
    where: {
      OR: [
        { libelle: { contains: 'EPAC', mode: 'insensitive' } },
        { etablissementOrganisateur: { nom: { contains: 'EPAC', mode: 'insensitive' } } },
      ],
      inscriptions: { some: {} },
    },
    select: { id: true, libelle: true },
    orderBy: { libelle: 'asc' },
  });
  if (epac) return epac;

  return prisma.concours.findFirst({
    where: { inscriptions: { some: {} } },
    select: { id: true, libelle: true },
  });
}

async function main() {
  let all = true;
  const arg = process.argv.find((a) => a.startsWith('--concoursId='));
  const preferredId = arg ? arg.split('=')[1] : null;
  const promotions = []; // { dossierId, previousStatut }

  console.log('\n=== Pré-check migration ===');
  const remaining = await prisma.inscription.count({ where: { numeroInscription: { not: null } } });
  const compteurs = await prisma.concours.count({ where: { inscriptionCompteur: { gt: 0 } } });
  all = check('numeros nullifiés (ou absents)', remaining === 0, `restants=${remaining}`) && all;
  all = check('compteurs à 0', compteurs === 0, `compteurs>0=${compteurs}`) && all;

  const concours = await resolveConcours(preferredId);
  if (!concours) {
    console.log('FAIL aucun concours avec inscriptions');
    process.exit(1);
  }
  console.log(`\nConcours test : ${concours.libelle} (${concours.id})`);

  // S'assurer d'avoir ≥ 2 dossiers VALIDE pour le test alpha (promotion temporaire)
  let valides = await prisma.inscription.findMany({
    where: {
      concoursId: concours.id,
      dossierInscription: { statut: 'VALIDE' },
    },
    include: {
      candidat: { select: { nom: true, prenom: true } },
      dossierInscription: { select: { id: true, statut: true } },
    },
  });

  if (valides.length < 2) {
    const candidats = await prisma.inscription.findMany({
      where: {
        concoursId: concours.id,
        dossierInscription: { isNot: null },
      },
      include: {
        candidat: { select: { nom: true, prenom: true } },
        dossierInscription: { select: { id: true, statut: true } },
      },
      take: 5,
    });

    for (const ins of candidats) {
      if (valides.some((v) => v.id === ins.id)) continue;
      if (valides.length >= 3) break;
      promotions.push({
        dossierId: ins.dossierInscription.id,
        previousStatut: ins.dossierInscription.statut,
      });
      await prisma.dossierInscription.update({
        where: { id: ins.dossierInscription.id },
        data: { statut: 'VALIDE' },
      });
      console.log(
        `Promotion temporaire VALIDE : ${ins.candidat.nom} ${ins.candidat.prenom} (était ${ins.dossierInscription.statut})`,
      );
    }

    valides = await prisma.inscription.findMany({
      where: {
        concoursId: concours.id,
        dossierInscription: { statut: 'VALIDE' },
      },
      include: {
        candidat: { select: { nom: true, prenom: true } },
        dossierInscription: { select: { id: true, statut: true } },
      },
    });
  }

  valides.sort((a, b) => {
    const n = String(a.candidat.nom).localeCompare(String(b.candidat.nom), 'fr', { sensitivity: 'base' });
    if (n !== 0) return n;
    return String(a.candidat.prenom).localeCompare(String(b.candidat.prenom), 'fr', { sensitivity: 'base' });
  });

  console.log(`Candidats VALIDE pour le test : ${valides.length}`);
  valides.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.candidat.nom} ${v.candidat.prenom}`);
  });
  all = check('au moins 2 VALIDE pour test alpha', valides.length >= 2) && all;

  await prisma.inscription.updateMany({
    where: { concoursId: concours.id },
    data: { numeroInscription: null },
  });
  await prisma.concours.update({
    where: { id: concours.id },
    data: { inscriptionCompteur: 0, inscriptionCompteurAnnee: null },
  });

  const txOpts = { maxWait: 15_000, timeout: 60_000 };

  console.log('\n=== Batch 1 (attribution alphabétique) ===');
  const { attribues: batch1 } = await prisma.$transaction(
    (tx) => attribuerNumerosTableParConcours(tx, concours.id),
    txOpts,
  );
  batch1.forEach((r) => console.log(`  ${r.numeroInscription} → ${r.nom} ${r.prenom}`));

  all = check('batch1 numérote tous les VALIDE', batch1.length === valides.length, `n=${batch1.length}`) && all;

  let alphaOk = true;
  for (let i = 0; i < batch1.length; i += 1) {
    const expected = valides[i];
    const got = batch1[i];
    if (
      got.inscriptionId !== expected.id
      || got.nom !== expected.candidat.nom
      || got.prenom !== expected.candidat.prenom
    ) {
      alphaOk = false;
    }
    if (parseSeq(got.numeroInscription) !== i + 1) alphaOk = false;
  }
  all = check('ordre alphabétique + SEQ 0001..N', alphaOk) && all;

  const snapshot = batch1.map((r) => ({ id: r.inscriptionId, numero: r.numeroInscription }));

  console.log('\n=== Batch 2 (idempotent) ===');
  const { attribues: batch2 } = await prisma.$transaction(
    (tx) => attribuerNumerosTableParConcours(tx, concours.id),
    txOpts,
  );
  all = check('batch2 n\'attribue rien', batch2.length === 0, `n=${batch2.length}`) && all;

  const after2 = await prisma.inscription.findMany({
    where: { id: { in: snapshot.map((s) => s.id) } },
    select: { id: true, numeroInscription: true },
  });
  all = check(
    'numéros inchangés après batch2',
    snapshot.every((s) => after2.find((r) => r.id === s.id)?.numeroInscription === s.numero),
  ) && all;

  console.log('\n=== Batch 3 (APPEND) ===');
  const extraCandidat = await prisma.candidat.findFirst({
    where: { NOT: { inscriptions: { some: { concoursId: concours.id } } } },
    select: { id: true, nom: true, prenom: true },
  });

  let extraInscriptionId = null;
  if (!extraCandidat) {
    all = check('candidat dispo pour APPEND', false) && all;
  } else {
    const created = await prisma.inscription.create({
      data: {
        candidatId: extraCandidat.id,
        concoursId: concours.id,
        dossierInscription: { create: { statut: 'VALIDE' } },
      },
    });
    extraInscriptionId = created.id;
    console.log(`Nouveau VALIDE temporaire : ${extraCandidat.nom} ${extraCandidat.prenom}`);

    const maxAvant = Math.max(0, ...snapshot.map((s) => parseSeq(s.numero)));
    const { attribues: batch3 } = await prisma.$transaction(
      (tx) => attribuerNumerosTableParConcours(tx, concours.id),
      txOpts,
    );
    batch3.forEach((r) => console.log(`  ${r.numeroInscription} → ${r.nom} ${r.prenom}`));

    all = check('batch3 attribue 1 numéro', batch3.length === 1) && all;
    all = check(
      'append = max+1',
      batch3[0] && parseSeq(batch3[0].numeroInscription) === maxAvant + 1,
      batch3[0] ? `got=${batch3[0].numeroInscription}` : 'none',
    ) && all;

    const after3 = await prisma.inscription.findMany({
      where: { id: { in: snapshot.map((s) => s.id) } },
      select: { id: true, numeroInscription: true },
    });
    all = check(
      'numéros antérieurs non perturbés',
      snapshot.every((s) => after3.find((r) => r.id === s.id)?.numeroInscription === s.numero),
    ) && all;
  }

  // Cleanup
  if (extraInscriptionId) {
    await prisma.inscription.delete({ where: { id: extraInscriptionId } });
    await prisma.concours.update({
      where: { id: concours.id },
      data: { inscriptionCompteur: snapshot.length },
    });
    console.log('Inscription APPEND temporaire supprimée');
  }

  for (const p of promotions) {
    await prisma.dossierInscription.update({
      where: { id: p.dossierId },
      data: { statut: p.previousStatut },
    });
  }
  if (promotions.length) {
    console.log(`${promotions.length} statut(s) restauré(s)`);
  }

  // Remettre les numéros de test à null sur ce concours (état post-migration)
  await prisma.inscription.updateMany({
    where: { concoursId: concours.id },
    data: { numeroInscription: null },
  });
  await prisma.concours.update({
    where: { id: concours.id },
    data: { inscriptionCompteur: 0, inscriptionCompteurAnnee: null },
  });
  console.log('Numéros de test nettoyés sur le concours (retour état post-migration)');

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
