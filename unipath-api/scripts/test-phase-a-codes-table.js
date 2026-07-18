/**
 * Phase A — codes codeVille / codeFiliere
 * Usage: node scripts/test-phase-a-codes-table.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE = process.env.API_URL || 'http://localhost:3001/api';

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

async function req(method, path, token, body) {
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

async function main() {
  const results = [];
  const stamp = Date.now();
  let createdCentreId = null;
  let createdConcoursId = null;

  const dec = await login('dec@test.com', 'password123');
  results.push(ok('Login DEC', dec.status === 200 && Boolean(dec.token)));
  if (!dec.token) {
    process.exit(1);
  }

  // 1. Créer centre avec codeVille=01
  const createOk = await req('POST', '/centres-composition', dec.token, {
    nom: `Centre Test PhaseA ${stamp}`,
    ville: 'Cotonou',
    codeVille: '01',
    adresse: 'Test',
  });
  createdCentreId = createOk.data?.id;
  results.push(
    ok('1. Créer centre codeVille=01 → 201', createOk.status === 201 && createOk.data?.codeVille === '01', `status=${createOk.status}`),
  );
  if (createdCentreId) {
    const db = await prisma.centreComposition.findUnique({
      where: { id: createdCentreId },
      select: { codeVille: true },
    });
    results.push(ok('1b. Vérif base codeVille', db?.codeVille === '01', JSON.stringify(db)));
  }

  // 2. Codes invalides
  const badAbc = await req('POST', '/centres-composition', dec.token, {
    nom: `Bad ABC ${stamp}`,
    ville: 'Cotonou',
    codeVille: 'ABC',
  });
  results.push(ok('2a. codeVille=ABC → 400', badAbc.status === 400, `status=${badAbc.status}`));

  const badOne = await req('POST', '/centres-composition', dec.token, {
    nom: `Bad 1 ${stamp}`,
    ville: 'Cotonou',
    codeVille: '1',
  });
  results.push(ok('2b. codeVille=1 → 400', badOne.status === 400, `status=${badOne.status}`));

  // 3. Éditer centre existant (sans code → avec code)
  const bare = await req('POST', '/centres-composition', dec.token, {
    nom: `Centre sans code ${stamp}`,
    ville: 'Parakou',
  });
  const bareId = bare.data?.id;
  results.push(ok('3a. Créer centre SANS codeVille → 201', bare.status === 201 && (bare.data?.codeVille == null), `status=${bare.status}`));

  if (bareId) {
    const edited = await req('PUT', `/centres-composition/${bareId}`, dec.token, {
      codeVille: '02',
    });
    results.push(
      ok('3b. Éditer centre → codeVille=02', edited.status === 200 && edited.data?.codeVille === '02', `status=${edited.status}`),
    );
    const dbEdit = await prisma.centreComposition.findUnique({
      where: { id: bareId },
      select: { codeVille: true },
    });
    results.push(ok('3c. Vérif base après édition', dbEdit?.codeVille === '02', JSON.stringify(dbEdit)));
  }

  // 4. Concours codeFiliere
  const now = Date.now();
  const concoursPayload = {
    libelle: `TEST PHASE A CODES ${stamp}`,
    etablissement: 'EPAC',
    codeFiliere: '40',
    dateDebutDepot: new Date(now).toISOString(),
    dateFinDepot: new Date(now + 20 * 86400000).toISOString(),
    dateDebutComposition: new Date(now + 25 * 86400000).toISOString(),
    dateFinComposition: new Date(now + 30 * 86400000).toISOString(),
    fraisParticipation: 5000,
    seriesAcceptees: ['C'],
    piecesRequises: {
      pieces: [
        { id: 'acte_naissance', nom: 'Acte de naissance', obligatoire: true, formats: ['PDF'] },
        { id: 'quittance', nom: 'Quittance', obligatoire: true, formats: ['PDF'] },
      ],
    },
  };
  const createConc = await req('POST', '/concours', dec.token, concoursPayload);
  createdConcoursId = createConc.data?.id;
  results.push(
    ok(
      '4a. Créer concours codeFiliere=40 → 201',
      (createConc.status === 201 || createConc.status === 200) && createConc.data?.codeFiliere === '40',
      `status=${createConc.status} code=${createConc.data?.codeFiliere} err=${createConc.data?.error || ''}`,
    ),
  );

  if (createdConcoursId) {
    const badFil = await req('PUT', `/concours/${createdConcoursId}`, dec.token, { codeFiliere: 'ABC' });
    results.push(ok('4b. Éditer codeFiliere invalide → 400', badFil.status === 400, `status=${badFil.status}`));

    const okFil = await req('PUT', `/concours/${createdConcoursId}`, dec.token, { codeFiliere: '41' });
    results.push(
      ok('4c. Éditer codeFiliere=41 → 200', okFil.status === 200 && okFil.data?.codeFiliere === '41', `status=${okFil.status}`),
    );
  }

  // 5. Régression : centre sans code + liste centres + concours sans codeFiliere update autre champ
  const list = await req('GET', '/centres-composition?actif=true', dec.token);
  results.push(ok('5a. Lister centres (sans code OK)', list.status === 200 && Array.isArray(list.data), `status=${list.status} n=${list.data?.length}`));

  if (createdConcoursId) {
    const patchLib = await req('PUT', `/concours/${createdConcoursId}`, dec.token, {
      libelle: `TEST PHASE A CODES ${stamp} UPDATED`,
    });
    results.push(
      ok(
        '5b. Update concours sans toucher codeFiliere',
        patchLib.status === 200 && patchLib.data?.codeFiliere === '41',
        `status=${patchLib.status} code=${patchLib.data?.codeFiliere}`,
      ),
    );
  }

  const withoutCodeStill = await prisma.centreComposition.findFirst({
    where: { codeVille: null },
    select: { id: true, nom: true },
  });
  results.push(
    ok('5c. Des centres sans codeVille existent encore en base', Boolean(withoutCodeStill), withoutCodeStill?.nom || ''),
  );

  // cleanup soft: delete test centres if possible (no delete endpoint) — leave them
  const allOk = results.every(Boolean);
  console.log(`\n══ VERDICT Phase A: ${allOk ? 'PASS' : 'FAIL'} (${results.filter(Boolean).length}/${results.length}) ══\n`);
  if (createdCentreId) console.log('centre test:', createdCentreId);
  if (createdConcoursId) console.log('concours test:', createdConcoursId);
  process.exit(allOk ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
