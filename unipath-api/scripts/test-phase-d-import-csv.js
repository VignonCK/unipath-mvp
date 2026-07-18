/**
 * Phase D — import CSV n° de table (DEC)
 * Usage: node scripts/test-phase-d-import-csv.js
 *
 * Prérequis : API démarrée (localhost:3001)
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

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

async function importCsv(token, concoursId, csvText, dryRun = true) {
  const form = new FormData();
  form.append('file', new Blob([csvText], { type: 'text/csv' }), 'numeros.csv');
  const qs = dryRun ? '?dryRun=true' : '?dryRun=false';
  const res = await fetch(
    `${BASE}/dges/concours/${concoursId}/importer-numeros-table${qs}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    },
  );
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function createCandidat(nom, prenom, suffix) {
  return prisma.candidat.create({
    data: {
      matricule: `UnP-2026-${String(suffix).padStart(6, '0')}`,
      nom,
      prenom,
      email: `phased.${stamp}.${suffix}@test.local`,
    },
  });
}

async function createInscriptionValide(candidatId, concoursId) {
  return prisma.inscription.create({
    data: {
      candidatId,
      concoursId,
      dossierInscription: { create: { statut: 'VALIDE' } },
    },
  });
}

async function main() {
  const results = [];
  const cleanup = {
    inscriptionIds: [],
    candidatIds: [],
    concoursId: null,
  };

  console.log('\n=== Phase D — setup ===\n');

  try {
    const dec = await login('dec@test.com', 'password123');
    results.push(ok('Login DEC', dec.status === 200 && Boolean(dec.token)));
    if (!dec.token) {
      console.error('API inaccessible ou login DEC échoué. Démarrez unipath-api.');
      process.exit(1);
    }

    const dges = await login('dges@test.com', 'password123');
    results.push(ok('Login DGES', dges.status === 200 && Boolean(dges.token)));

    const concours = await prisma.concours.create({
      data: {
        libelle: `TEST PHASE D IMPORT ${stamp}`,
        etablissement: 'EPAC',
        codeFiliere: '40',
        dateDebut: new Date('2026-01-01'),
        dateFin: new Date('2026-12-31'),
        dateDebutComposition: new Date('2026-07-01'),
        fraisParticipation: 5000,
        seriesAcceptees: ['C'],
      },
    });
    cleanup.concoursId = concours.id;

    // Suffixes uniques pour matricules UnP-2026-XXXXXX
    const base = Number(String(stamp).slice(-5));
    const c1 = await createCandidat('Adjovi', 'Marie', base + 1);
    const c2 = await createCandidat('Bello', 'Ibrahim', base + 2);
    const c3 = await createCandidat('Koffi', 'Awa', base + 3);
    cleanup.candidatIds.push(c1.id, c2.id, c3.id);

    const i1 = await createInscriptionValide(c1.id, concours.id);
    const i2 = await createInscriptionValide(c2.id, concours.id);
    const i3 = await createInscriptionValide(c3.id, concours.id);
    cleanup.inscriptionIds.push(i1.id, i2.id, i3.id);

    const csvAllValid = [
      'matricule_plateforme,numero_table',
      `${c1.matricule},260140001`,
      `${c2.matricule},260140002`,
    ].join('\n');

    // ——— 1. Dry-run all valid ———
    console.log('\n=== 1. Dry-run toutes lignes valides ===');
    const dry1 = await importCsv(dec.token, concours.id, csvAllValid, true);
    console.log(dry1.data.message || dry1.data.error);
    const afterDry = await prisma.inscription.findMany({
      where: { id: { in: [i1.id, i2.id] } },
      select: { id: true, numeroInscription: true },
    });
    results.push(
      ok(
        '1. Dry-run rapport correct + rien écrit',
        dry1.status === 200
          && dry1.data.dryRun === true
          && dry1.data.countValides === 2
          && dry1.data.countErreurs === 0
          && afterDry.every((r) => r.numeroInscription == null),
        `status=${dry1.status} valides=${dry1.data.countValides} nums=${JSON.stringify(afterDry)}`,
      ),
    );

    // ——— 2. Execute real ———
    console.log('\n=== 2. Exécution réelle ===');
    const exec2 = await importCsv(dec.token, concours.id, csvAllValid, false);
    console.log(exec2.data.message || exec2.data.error);
    const afterExec = await prisma.inscription.findMany({
      where: { id: { in: [i1.id, i2.id] } },
      select: { id: true, numeroInscription: true, candidatId: true },
    });
    const n1 = afterExec.find((r) => r.id === i1.id)?.numeroInscription;
    const n2 = afterExec.find((r) => r.id === i2.id)?.numeroInscription;
    results.push(
      ok(
        '2. Exécution réelle → numéros attribués',
        exec2.status === 200
          && exec2.data.dryRun === false
          && exec2.data.appliques === 2
          && n1 === '260140001'
          && n2 === '260140002',
        `appliques=${exec2.data.appliques} n1=${n1} n2=${n2}`,
      ),
    );

    // Reset i3 still null; prepare mixed CSV with unknown matricule
    // Clear i1/i2 for mixed test? Better use c3 + unknown + re-import on fresh
    // For test 3: use c3 (valid) + unknown + another valid that needs a free number
    // i1 and i2 already have numbers — use a 4th candidat
    const c4 = await createCandidat('Zinsou', 'Paul', base + 4);
    cleanup.candidatIds.push(c4.id);
    const i4 = await createInscriptionValide(c4.id, concours.id);
    cleanup.inscriptionIds.push(i4.id);

    const csvMixed = [
      'matricule_plateforme,numero_table',
      `${c3.matricule},260140003`,
      'UnP-2099-999999,260140099',
      `${c4.matricule},260140004`,
    ].join('\n');

    console.log('\n=== 3. Ligne invalide au milieu ===');
    const dry3 = await importCsv(dec.token, concours.id, csvMixed, true);
    console.log('Dry-run:', dry3.data.message);
    (dry3.data.erreurs || []).forEach((e) => console.log(`  L.${e.line}: ${e.motif}`));

    const exec3 = await importCsv(dec.token, concours.id, csvMixed, false);
    console.log('Exec:', exec3.data.message);
    const after3 = await prisma.inscription.findMany({
      where: { id: { in: [i3.id, i4.id] } },
      select: { id: true, numeroInscription: true },
    });
    const n3 = after3.find((r) => r.id === i3.id)?.numeroInscription;
    const n4 = after3.find((r) => r.id === i4.id)?.numeroInscription;
    const errUnknown = (exec3.data.erreurs || []).find((e) => /inconnu/i.test(e.motif));
    results.push(
      ok(
        '3. Matricule inconnu signalé, valides appliquées',
        exec3.status === 200
          && exec3.data.appliques === 2
          && exec3.data.countErreurs >= 1
          && Boolean(errUnknown)
          && n3 === '260140003'
          && n4 === '260140004',
        `appliques=${exec3.data.appliques} err=${errUnknown?.motif} n3=${n3} n4=${n4}`,
      ),
    );

    // ——— 4. Duplicate number ———
    console.log('\n=== 4. Numéro déjà utilisé ===');
    const c5 = await createCandidat('Orphelin', 'Dup', base + 5);
    cleanup.candidatIds.push(c5.id);
    const i5 = await createInscriptionValide(c5.id, concours.id);
    cleanup.inscriptionIds.push(i5.id);

    const csvDup = [
      'matricule_plateforme,numero_table',
      `${c5.matricule},260140001`,
    ].join('\n');
    const dry4 = await importCsv(dec.token, concours.id, csvDup, true);
    console.log(dry4.data.message);
    (dry4.data.erreurs || []).forEach((e) => console.log(`  L.${e.line}: ${e.motif}`));
    const motifDup = (dry4.data.erreurs || []).find((e) => /déjà utilisé/i.test(e.motif));
    const after4 = await prisma.inscription.findUnique({
      where: { id: i5.id },
      select: { numeroInscription: true },
    });
    results.push(
      ok(
        '4. Doublon numéro → rejeté, message clair',
        dry4.status === 200
          && dry4.data.countValides === 0
          && Boolean(motifDup)
          && after4.numeroInscription == null,
        motifDup?.motif || 'pas de motif doublon',
      ),
    );

    // ——— 5. DGES 403 ———
    console.log('\n=== 5. DGES → 403 ===');
    const forbidden = await importCsv(dges.token, concours.id, csvAllValid, true);
    results.push(
      ok(
        '5. Compte DGES → 403',
        forbidden.status === 403,
        `status=${forbidden.status} error=${forbidden.data.error || ''}`,
      ),
    );
  } finally {
    console.log('\n=== Cleanup ===');
    if (cleanup.inscriptionIds.length) {
      await prisma.inscription.deleteMany({ where: { id: { in: cleanup.inscriptionIds } } });
    }
    if (cleanup.candidatIds.length) {
      await prisma.candidat.deleteMany({ where: { id: { in: cleanup.candidatIds } } });
    }
    if (cleanup.concoursId) {
      await prisma.concours.delete({ where: { id: cleanup.concoursId } }).catch(() => {});
    }
  }

  const passed = results.filter(Boolean).length;
  console.log(`\n=== Résultat Phase D : ${passed}/${results.length} ===`);
  process.exit(passed === results.length ? 0 : 1);
}

main()
  .catch((err) => {
    console.error('❌ Phase D échouée:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
