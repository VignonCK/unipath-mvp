/**
 * Phase 1 Salle — CRUD DEC + 403 DGES
 * Usage: node scripts/test-salle-crud-phase1.js
 */
require('dotenv').config();
const prisma = require('../src/prisma');

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

async function main() {
  const results = [];
  let salleId = null;
  let centreId = null;
  let createdCentre = false;

  try {
    console.log('\n=== Phase 1 Salle CRUD ===\n');

    const dec = await login('dec@test.com', 'password123');
    results.push(ok('Login DEC', Boolean(dec.token), `status=${dec.status}`));
    if (!dec.token) throw new Error('DEC login failed');

    const dges = await login('dges@test.com', 'password123');
    results.push(ok('Login DGES', Boolean(dges.token)));

    let centre = await prisma.centreComposition.findFirst({
      where: { actif: true },
      select: { id: true, nom: true },
    });
    if (!centre) {
      centre = await prisma.centreComposition.create({
        data: {
          nom: `Centre Salle Test ${stamp}`,
          ville: 'Cotonou',
          codeVille: '99',
        },
      });
      createdCentre = true;
    }
    centreId = centre.id;
    results.push(ok('Centre disponible', Boolean(centreId), centre.nom));

    // 1. Créer
    const create = await api('POST', `/dec/centres/${centreId}/salles`, dec.token, {
      nom: `Salle A-${stamp}`,
      capacite: 40,
    });
    salleId = create.data?.id || null;
    results.push(ok(
      '1. Créer une salle',
      create.status === 201 && Boolean(salleId),
      `status=${create.status} nom=${create.data?.nom}`,
    ));

    // 2. Lister
    const list = await api('GET', `/dec/centres/${centreId}/salles`, dec.token);
    const found = (list.data?.salles || []).some((s) => s.id === salleId);
    results.push(ok(
      '2. Lister les salles',
      list.status === 200 && found,
      `status=${list.status} n=${(list.data?.salles || []).length}`,
    ));

    // 3. Éditer
    const edit = await api('PUT', `/dec/salles/${salleId}`, dec.token, {
      nom: `Salle B-${stamp}`,
      capacite: 55,
    });
    results.push(ok(
      '3. Éditer une salle',
      edit.status === 200 && edit.data?.nom === `Salle B-${stamp}` && edit.data?.capacite === 55,
      `status=${edit.status} nom=${edit.data?.nom} cap=${edit.data?.capacite}`,
    ));

    // 5. DGES → 403 (avant delete)
    const forbiddenCreate = await api('POST', `/dec/centres/${centreId}/salles`, dges.token, {
      nom: 'ShouldFail',
      capacite: 10,
    });
    const forbiddenList = await api('GET', `/dec/centres/${centreId}/salles`, dges.token);
    const forbiddenPut = await api('PUT', `/dec/salles/${salleId}`, dges.token, { nom: 'Nope' });
    results.push(ok(
      '5. DGES → 403',
      forbiddenCreate.status === 403
        && forbiddenList.status === 403
        && forbiddenPut.status === 403,
      `POST=${forbiddenCreate.status} GET=${forbiddenList.status} PUT=${forbiddenPut.status}`,
    ));

    // 4. Supprimer
    const del = await api('DELETE', `/dec/salles/${salleId}`, dec.token);
    results.push(ok(
      '4. Supprimer une salle',
      del.status === 200,
      `status=${del.status}`,
    ));
    salleId = null;

    const after = await api('GET', `/dec/centres/${centreId}/salles`, dec.token);
    results.push(ok(
      'Salle absente après suppression',
      !(after.data?.salles || []).some((s) => s.nom === `Salle B-${stamp}`),
    ));

    const forbiddenDel = await api('DELETE', `/dec/salles/00000000-0000-0000-0000-000000000001`, dges.token);
    results.push(ok('5bis. DGES DELETE → 403', forbiddenDel.status === 403, `status=${forbiddenDel.status}`));

    const passed = results.filter(Boolean).length;
    console.log(`\n=== RÉSUMÉ ${passed}/${results.length} PASS ===`);
    process.exit(passed === results.length ? 0 : 1);
  } catch (err) {
    console.error('FATAL', err);
    process.exit(1);
  } finally {
    if (salleId) {
      await prisma.salle.delete({ where: { id: salleId } }).catch(() => {});
    }
    if (createdCentre && centreId) {
      await prisma.centreComposition.delete({ where: { id: centreId } }).catch(() => {});
    }
    await prisma.$disconnect().catch(() => {});
  }
}

main();
