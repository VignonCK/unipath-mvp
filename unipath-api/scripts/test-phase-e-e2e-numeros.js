/**
 * Phase E — vérification E2E nouveau format n° de table (9 chiffres)
 *
 * 1. Garde-fou convocation (sans / avec numéro)
 * 2. Cycle DEC 2 centres : clôture → génération → séquences → PDF → append
 *
 * Usage: node scripts/test-phase-e-e2e-numeros.js
 * Prérequis: API localhost:3001
 */
require('dotenv').config();
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const pdfService = require('../src/services/pdf.service');
const {
  enrichDossierInscriptionForPdf,
  DOSSIER_CENTRE_INCLUDE,
} = require('../src/utils/centres-composition.helper');
const { NUMERO_TABLE_REGEX } = require('../src/utils/numero-inscription.helper');

const prisma = new PrismaClient();
const BASE = process.env.API_URL || 'http://localhost:3001/api';
const stamp = Date.now();

function ok(name, pass, detail = '') {
  console.log(`${pass ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
  return pass;
}

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, token: body?.token };
}

async function api(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function createCandidat(nom, prenom, suffix) {
  return prisma.candidat.create({
    data: {
      matricule: `UnP-2026-E${String(suffix).padStart(5, '0')}`,
      nom,
      prenom,
      email: `phasee.${stamp}.${suffix}@test.local`,
    },
  });
}

async function createInscriptionValide(candidatId, concoursId, concoursCentreId) {
  return prisma.inscription.create({
    data: {
      candidatId,
      concoursId,
      dossierInscription: {
        create: { statut: 'VALIDE', concoursCentreId },
      },
    },
    include: {
      candidat: { include: { dossier: true } },
      concours: true,
      dossierInscription: { include: DOSSIER_CENTRE_INCLUDE },
    },
  });
}

async function tryConvocation(inscription) {
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
    },
  });
}

async function main() {
  const results = [];
  const cleanup = {
    inscriptionIds: [],
    candidatIds: [],
    concoursCentreIds: [],
    centreIds: [],
    concoursId: null,
    pdfPaths: [],
  };

  console.log('\n=== Phase E — setup isolé ===\n');

  try {
    const dec = await login('dec@test.com', 'password123');
    results.push(ok('Login DEC', Boolean(dec.token)));
    if (!dec.token) {
      process.exit(1);
    }

    const concours = await prisma.concours.create({
      data: {
        libelle: `TEST PHASE E E2E ${stamp}`,
        etablissement: 'EPAC',
        codeFiliere: '40',
        dateDebut: new Date('2026-01-01'),
        dateFin: new Date('2026-12-31'),
        dateDebutDepot: new Date('2026-01-01'),
        dateFinDepot: new Date('2026-06-01'),
        dateDebutComposition: new Date('2026-07-01'),
        dateFinComposition: new Date('2026-07-05'),
        fraisParticipation: 5000,
        seriesAcceptees: ['C'],
        etudeCloturee: false,
      },
    });
    cleanup.concoursId = concours.id;

    const centreA = await prisma.centreComposition.create({
      data: {
        nom: `Centre E Cotonou ${stamp}`,
        ville: 'Cotonou',
        codeVille: '01',
      },
    });
    const centreB = await prisma.centreComposition.create({
      data: {
        nom: `Centre E Parakou ${stamp}`,
        ville: 'Parakou',
        codeVille: '14',
      },
    });
    cleanup.centreIds.push(centreA.id, centreB.id);

    const annee = '2025-2026';
    const linkA = await prisma.concourscentreComposition.create({
      data: {
        concoursId: concours.id,
        centreId: centreA.id,
        anneeAcademique: annee,
        estActif: true,
      },
    });
    const linkB = await prisma.concourscentreComposition.create({
      data: {
        concoursId: concours.id,
        centreId: centreB.id,
        anneeAcademique: annee,
        estActif: true,
      },
    });
    cleanup.concoursCentreIds.push(linkA.id, linkB.id);

    const base = Number(String(stamp).slice(-4));
    const cA1 = await createCandidat('Zinsou', 'Paul', base + 1);
    const cA2 = await createCandidat('Adjovi', 'Marie', base + 2);
    const cB1 = await createCandidat('Bello', 'Ibrahim', base + 3);
    cleanup.candidatIds.push(cA1.id, cA2.id, cB1.id);

    const iA1 = await createInscriptionValide(cA1.id, concours.id, linkA.id);
    const iA2 = await createInscriptionValide(cA2.id, concours.id, linkA.id);
    const iB1 = await createInscriptionValide(cB1.id, concours.id, linkB.id);
    cleanup.inscriptionIds.push(iA1.id, iA2.id, iB1.id);

    // ─── 1. Garde-fou sans numéro ───
    console.log('\n=== 1. Garde-fou convocation (sans numéro) ===');
    const sansNum = await prisma.inscription.findUnique({
      where: { id: iA2.id },
      include: {
        candidat: { include: { dossier: true } },
        concours: true,
        dossierInscription: { include: DOSSIER_CENTRE_INCLUDE },
      },
    });
    results.push(ok('1a. VALIDE + centre, numeroInscription null', sansNum.numeroInscription == null));

    let blocked = false;
    let blockCode = '';
    try {
      await tryConvocation(sansNum);
    } catch (err) {
      blocked = err.code === 'NUMERO_TABLE_MANQUANT';
      blockCode = err.code || err.message;
    }
    results.push(ok('1b. Convocation bloquée (NUMERO_TABLE_MANQUANT)', blocked, blockCode));

    // ─── 2. Cycle DEC ───
    console.log('\n=== 2. Cycle DEC : clôture → génération auto ===');
    const cloture = await api('POST', `/dges/concours/${concours.id}/cloturer-etude`, dec.token);
    results.push(ok('2a. DEC clôture l\'étude', cloture.status === 200 && cloture.data?.concours?.etudeCloturee === true, `status=${cloture.status}`));

    const gen = await api('POST', `/dges/concours/${concours.id}/generer-numeros-table`, dec.token);
    console.log(gen.data.message || gen.data.error);
    (gen.data.attribues || []).forEach((r) => {
      console.log(`  ${r.numeroInscription} → ${r.nom} ${r.prenom} [${r.centreNom}]`);
    });

    const numsA = (gen.data.attribues || []).filter((r) => r.codeVille === '01').map((r) => r.numeroInscription);
    const numsB = (gen.data.attribues || []).filter((r) => r.codeVille === '14').map((r) => r.numeroInscription);
    const nomsA = (gen.data.attribues || []).filter((r) => r.codeVille === '01').map((r) => r.nom);

    results.push(
      ok(
        '2b. Génération auto → 3 attribués',
        gen.status === 200 && gen.data.count === 3,
        `count=${gen.data.count}`,
      ),
    );
    results.push(
      ok(
        '2c. Séquences séparées par centre',
        numsA.join(',') === '260140001,260140002' && numsB.join(',') === '261440001',
        `A=[${numsA}] B=[${numsB}]`,
      ),
    );
    results.push(
      ok(
        '2d. Alpha centre A (Adjovi puis Zinsou)',
        nomsA.join(',') === 'Adjovi,Zinsou',
        `noms=${nomsA}`,
      ),
    );
    results.push(
      ok(
        '2e. Format 9 chiffres',
        (gen.data.attribues || []).every((r) => NUMERO_TABLE_REGEX.test(r.numeroInscription)),
      ),
    );

    // ─── 3. Convocation avec vrai numéro ───
    console.log('\n=== 3. Convocation avec numéro 9 chiffres ===');
    const withNum = await prisma.inscription.findUnique({
      where: { id: iA2.id },
      include: {
        candidat: { include: { dossier: true } },
        concours: true,
        dossierInscription: { include: DOSSIER_CENTRE_INCLUDE },
      },
    });
    results.push(
      ok(
        '3a. Adjovi a 260140001',
        withNum.numeroInscription === '260140001',
        withNum.numeroInscription,
      ),
    );

    let pdfOk = false;
    let pdfDetail = '';
    try {
      const pdfResult = await tryConvocation(withNum);
      cleanup.pdfPaths.push(pdfResult.filePath);
      const exists = fs.existsSync(pdfResult.filePath);
      const size = exists ? fs.statSync(pdfResult.filePath).size : 0;
      // Le numéro passe dans le payload / logs ; on vérifie aussi le nom de fichier ou taille
      pdfOk = exists && size > 500;
      pdfDetail = `path=${pdfResult.filePath} size=${size} numero=${withNum.numeroInscription}`;
      console.log(`[PDF] généré avec numéro ${withNum.numeroInscription}, size=${size}`);
    } catch (err) {
      pdfDetail = err.message;
    }
    results.push(ok('3b. Convocation PDF générée avec n° 9 chiffres', pdfOk, pdfDetail));

    // ─── 4. Append tardif ───
    console.log('\n=== 4. Append tardif après réouverture ===');
    const rouvre = await api('POST', `/dges/concours/${concours.id}/rouvrir-etude`, dec.token);
    results.push(ok('4a. DEC rouvre l\'étude', rouvre.status === 200 && rouvre.data?.concours?.etudeCloturee === false, `status=${rouvre.status}`));

    const cAppend = await createCandidat('Bernard', 'Late', base + 9);
    cleanup.candidatIds.push(cAppend.id);
    const iAppend = await createInscriptionValide(cAppend.id, concours.id, linkA.id);
    cleanup.inscriptionIds.push(iAppend.id);

    const gen2 = await api('POST', `/dges/concours/${concours.id}/generer-numeros-table`, dec.token);
    console.log(gen2.data.message || gen2.data.error);
    (gen2.data.attribues || []).forEach((r) => {
      console.log(`  ${r.numeroInscription} → ${r.nom} ${r.prenom}`);
    });
    const appendNum = gen2.data.attribues?.[0]?.numeroInscription;
    results.push(
      ok(
        '4b. Append centre A → 260140003',
        gen2.status === 200 && gen2.data.count === 1 && appendNum === '260140003',
        `count=${gen2.data.count} num=${appendNum}`,
      ),
    );

    // Vérifier que les numéros antérieurs n'ont pas bougé
    const still = await prisma.inscription.findMany({
      where: { id: { in: [iA1.id, iA2.id, iB1.id] } },
      select: { id: true, numeroInscription: true },
    });
    const map = Object.fromEntries(still.map((r) => [r.id, r.numeroInscription]));
    results.push(
      ok(
        '4c. Numéros antérieurs inchangés',
        map[iA2.id] === '260140001' && map[iA1.id] === '260140002' && map[iB1.id] === '261440001',
        JSON.stringify(map),
      ),
    );
  } finally {
    console.log('\n=== Cleanup ===');
    for (const p of cleanup.pdfPaths) {
      try { fs.unlinkSync(p); } catch { /* ignore */ }
    }
    if (cleanup.inscriptionIds.length) {
      await prisma.inscription.deleteMany({ where: { id: { in: cleanup.inscriptionIds } } });
    }
    if (cleanup.candidatIds.length) {
      await prisma.candidat.deleteMany({ where: { id: { in: cleanup.candidatIds } } });
    }
    if (cleanup.concoursCentreIds.length) {
      await prisma.concourscentreComposition.deleteMany({
        where: { id: { in: cleanup.concoursCentreIds } },
      });
    }
    if (cleanup.centreIds.length) {
      await prisma.centreComposition.deleteMany({ where: { id: { in: cleanup.centreIds } } });
    }
    if (cleanup.concoursId) {
      await prisma.concours.delete({ where: { id: cleanup.concoursId } }).catch(() => {});
    }
  }

  const passed = results.filter(Boolean).length;
  console.log(`\n=== Résultat Phase E : ${passed}/${results.length} ===`);
  process.exit(passed === results.length ? 0 : 1);
}

main()
  .catch((err) => {
    console.error('❌ Phase E échouée:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
