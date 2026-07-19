/**
 * Phase 2 — répartition auto salles (tri alpha + capacité)
 * Usage: node scripts/test-salle-repartition-phase2.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { getAnneeAcademique } = require('../src/utils/matricule.helper');
const { repartirCandidatsSallesParCentre } = require('../src/utils/salle.helper');

const prisma = new PrismaClient();
const BASE = process.env.API_URL || 'http://localhost:3001/api';
const stamp = Date.now();
const annee = String(getAnneeAcademique());

function ok(name, pass, detail = '') {
  console.log(`${pass ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
  return pass;
}

async function waitDb(retries = 10) {
  for (let i = 0; i < retries; i += 1) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  return false;
}

async function withDbRetry(fn, label = 'op') {
  let lastErr;
  for (let i = 0; i < 5; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!/P1001|Can't reach database/i.test(String(err.message || err))) throw err;
      console.warn(`  retry ${label} (${i + 1}/5)…`);
      await waitDb(3);
    }
  }
  throw lastErr;
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

async function api(method, pathName, token, body) {
  const res = await fetch(`${BASE}${pathName}`, {
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
  return withDbRetry(
    () => prisma.candidat.create({
      data: {
        matricule: `TST-S2-${stamp}-${suffix}`,
        nom,
        prenom,
        email: `salle2.${stamp}.${suffix}@test.local`,
      },
    }),
    `candidat ${suffix}`,
  );
}

async function createInscriptionValide({ candidatId, concoursId, concoursCentreId }) {
  return withDbRetry(
    () => prisma.inscription.create({
      data: {
        candidatId,
        concoursId,
        dossierInscription: {
          create: {
            statut: 'VALIDE',
            concoursCentreId,
          },
        },
      },
      include: {
        candidat: { select: { nom: true, prenom: true } },
        dossierInscription: { select: { id: true, salleId: true, concoursCentreId: true } },
      },
    }),
    'inscription',
  );
}

async function runRepartir(concoursId, centreId) {
  return withDbRetry(
    () => prisma.$transaction(
      (tx) => repartirCandidatsSallesParCentre(tx, concoursId, centreId),
      { maxWait: 15_000, timeout: 120_000 },
    ),
    'repartir',
  );
}

async function main() {
  const results = [];
  const cleanup = {
    inscriptionIds: [],
    candidatIds: [],
    salleIds: [],
    concoursCentreIds: [],
    centreIds: [],
    concoursId: null,
  };

  try {
    console.log('\n=== Phase 2 répartition salles ===\n');

    const dbOk = await waitDb();
    results.push(ok('DB joignable', dbOk));
    if (!dbOk) throw new Error('Database unreachable');

    const dec = await login('dec@test.com', 'password123');
    results.push(ok('Login DEC', Boolean(dec.token), `status=${dec.status}`));
    if (!dec.token) throw new Error('DEC login failed');

    const concours = await withDbRetry(
      () => prisma.concours.create({
        data: {
          libelle: `TEST SALLES PHASE2 ${stamp}`,
          etablissement: 'EPAC',
          codeFiliere: '41',
          sigle: 'EPAC',
          dateDebut: new Date('2026-01-01'),
          dateFin: new Date('2026-12-31'),
          dateDebutDepot: new Date('2026-01-01'),
          dateFinDepot: new Date('2026-06-01'),
          dateDebutComposition: new Date('2026-07-01'),
          dateFinComposition: new Date('2026-07-05'),
          fraisParticipation: 5000,
          seriesAcceptees: ['C'],
          etudeCloturee: true,
        },
      }),
      'create concours',
    );
    cleanup.concoursId = concours.id;

    const centreA = await withDbRetry(
      () => prisma.centreComposition.create({
        data: { nom: `Centre A S2 ${stamp}`, ville: 'Cotonou', codeVille: '01', adresse: 'A' },
      }),
      'centre A',
    );
    const centreB = await withDbRetry(
      () => prisma.centreComposition.create({
        data: { nom: `Centre B S2 ${stamp}`, ville: 'Parakou', codeVille: '14', adresse: 'B' },
      }),
      'centre B',
    );
    cleanup.centreIds.push(centreA.id, centreB.id);

    const linkA = await withDbRetry(
      () => prisma.concourscentreComposition.create({
        data: {
          concoursId: concours.id,
          centreId: centreA.id,
          anneeAcademique: annee,
          capacite: 100,
        },
      }),
      'link A',
    );
    cleanup.concoursCentreIds.push(linkA.id);

    const salle1 = await withDbRetry(
      () => prisma.salle.create({
        data: { nom: '01-Amphi', capacite: 2, centreCompositionId: centreA.id },
      }),
      'salle1',
    );
    const salle2 = await withDbRetry(
      () => prisma.salle.create({
        data: { nom: '02-Labo', capacite: 2, centreCompositionId: centreA.id },
      }),
      'salle2',
    );
    const salleB = await withDbRetry(
      () => prisma.salle.create({
        data: { nom: 'Autre-Centre', capacite: 50, centreCompositionId: centreB.id },
      }),
      'salleB',
    );
    cleanup.salleIds.push(salle1.id, salle2.id, salleB.id);

    // Smoke endpoint
    const smokeEmpty = await api(
      'POST',
      `/dec/concours/${concours.id}/centres/${centreA.id}/repartir-salles`,
      dec.token,
    );
    results.push(ok(
      'Endpoint DEC répond',
      smokeEmpty.status === 200,
      `status=${smokeEmpty.status} msg=${smokeEmpty.data?.message}`,
    ));

    const names = [
      ['Zinsou', 'Paul', 'z'],
      ['Adjovi', 'Marie', 'a'],
      ['Clara', 'Awa', 'c'],
      ['Bello', 'Jean', 'b'],
    ];
    for (const [nom, prenom, suf] of names) {
      const c = await createCandidat(nom, prenom, suf);
      cleanup.candidatIds.push(c.id);
      const ins = await createInscriptionValide({
        candidatId: c.id,
        concoursId: concours.id,
        concoursCentreId: linkA.id,
      });
      cleanup.inscriptionIds.push(ins.id);
    }

    console.log('--- 1. 4 candidats / 2×2 ---');
    const r1 = await runRepartir(concours.id, centreA.id);
    const bySalle1 = {};
    for (const a of r1.assignes || []) {
      bySalle1[a.salleNom] = bySalle1[a.salleNom] || [];
      bySalle1[a.salleNom].push(a.nom);
    }
    const amphi = (bySalle1['01-Amphi'] || []).join(',');
    const labo = (bySalle1['02-Labo'] || []).join(',');
    results.push(ok(
      '1. Alpha + capacité 2/2',
      amphi === 'Adjovi,Bello' && labo === 'Clara,Zinsou' && (r1.nonAssignes || []).length === 0,
      `Amphi=[${amphi}] Labo=[${labo}] nonAss=${(r1.nonAssignes || []).length}`,
    ));

    console.log('--- 2. Overflow ---');
    for (const [nom, prenom, suf] of [['Koffi', 'Ibrahim', 'k'], ['Mba', 'Lea', 'm']]) {
      const c = await createCandidat(nom, prenom, suf);
      cleanup.candidatIds.push(c.id);
      const ins = await createInscriptionValide({
        candidatId: c.id,
        concoursId: concours.id,
        concoursCentreId: linkA.id,
      });
      cleanup.inscriptionIds.push(ins.id);
    }

    const r2 = await runRepartir(concours.id, centreA.id);
    const nonAss = r2.nonAssignes || [];
    results.push(ok(
      '2. Surplus sans salle',
      (r2.assignes || []).length === 4
        && nonAss.length === 2
        && nonAss.every((n) => /capacité/i.test(n.motif)),
      `assignes=${(r2.assignes || []).length} nonAss=${nonAss.length} noms=${nonAss.map((n) => n.nom).sort().join(',')}`,
    ));

    const snap = (r2.assignes || [])
      .map((a) => `${a.inscriptionId}:${a.salleId}`)
      .sort()
      .join('|');

    console.log('--- 3. Relance ---');
    const r3 = await runRepartir(concours.id, centreA.id);
    const snap2 = (r3.assignes || [])
      .map((a) => `${a.inscriptionId}:${a.salleId}`)
      .sort()
      .join('|');
    results.push(ok(
      '3. Relance = même affectation',
      snap.length > 0
        && snap === snap2
        && (r3.assignes || []).length === 4
        && (r3.nonAssignes || []).length === 2,
      `same=${snap === snap2} n=${(r3.assignes || []).length}`,
    ));

    console.log('--- 4. Cohérence salle/centre ---');
    const dossiers = await withDbRetry(
      () => prisma.dossierInscription.findMany({
        where: { inscriptionId: { in: cleanup.inscriptionIds } },
        select: {
          id: true,
          salleId: true,
          concoursCentreId: true,
          salle: { select: { id: true, centreCompositionId: true, nom: true } },
          centreChoisi: { select: { centreId: true } },
        },
      }),
      'dossiers',
    );

    const assigned = dossiers.filter((d) => d.salleId);
    const coherent = assigned.every(
      (d) => d.salle
        && d.centreChoisi
        && d.salle.centreCompositionId === d.centreChoisi.centreId
        && d.salle.centreCompositionId === centreA.id,
    );
    const noneOnB = assigned.every((d) => d.salleId !== salleB.id);
    const helperOk = (r3.assignes || []).every((a) => a.centreId === centreA.id);

    results.push(ok(
      '4. Aucune salle d\'un autre centre',
      coherent && noneOnB && helperOk && assigned.length === 4,
      `assigned=${assigned.length} coherent=${coherent} noneOnB=${noneOnB}`,
    ));

    // Endpoint smoke with data
    const apiRep = await api(
      'POST',
      `/dec/concours/${concours.id}/centres/${centreA.id}/repartir-salles`,
      dec.token,
    );
    results.push(ok(
      'Endpoint avec candidats',
      apiRep.status === 200 && (apiRep.data?.assignes || []).length === 4,
      `status=${apiRep.status} assignes=${(apiRep.data?.assignes || []).length}`,
    ));

    const passed = results.filter(Boolean).length;
    console.log(`\n=== RÉSUMÉ ${passed}/${results.length} PASS ===`);
    process.exit(passed === results.length ? 0 : 1);
  } catch (err) {
    console.error('FATAL', err);
    process.exit(1);
  } finally {
    try {
      await waitDb(3);
      if (cleanup.inscriptionIds.length) {
        await prisma.dossierInscription.deleteMany({
          where: { inscriptionId: { in: cleanup.inscriptionIds } },
        }).catch(() => {});
        await prisma.inscription.deleteMany({
          where: { id: { in: cleanup.inscriptionIds } },
        }).catch(() => {});
      }
      if (cleanup.candidatIds.length) {
        await prisma.candidat.deleteMany({ where: { id: { in: cleanup.candidatIds } } }).catch(() => {});
      }
      if (cleanup.salleIds.length) {
        await prisma.salle.deleteMany({ where: { id: { in: cleanup.salleIds } } }).catch(() => {});
      }
      if (cleanup.concoursCentreIds.length) {
        await prisma.concourscentreComposition.deleteMany({
          where: { id: { in: cleanup.concoursCentreIds } },
        }).catch(() => {});
      }
      if (cleanup.centreIds.length) {
        await prisma.centreComposition.deleteMany({ where: { id: { in: cleanup.centreIds } } }).catch(() => {});
      }
      if (cleanup.concoursId) {
        await prisma.concours.delete({ where: { id: cleanup.concoursId } }).catch(() => {});
      }
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }
    await prisma.$disconnect().catch(() => {});
  }
}

main();
