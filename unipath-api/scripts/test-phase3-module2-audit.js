/**
 * Phase 3/6 — audit Module 2 DGES-only + commission établissement désactivée.
 * Usage: node scripts/test-phase3-module2-audit.js
 */

require('dotenv').config();

const BASE = process.env.API_URL || 'http://localhost:3001/api';
const ETAB_ID = '22222222-2222-2222-2222-222222222222';

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
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
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text.slice(0, 160) };
  }
  return { status: res.status, data };
}

function ok(name, pass, detail) {
  console.log(`${pass ? '✅' : '❌'} ${name}`);
  console.log(`   ${detail}`);
  return pass;
}

async function main() {
  console.log(`API: ${BASE}\n`);
  const results = [];

  const decLogin = await login('dec@test.com', 'password123');
  const dgesLogin = await login('dges@test.com', 'password123');
  const decToken = decLogin.body?.token;
  const dgesToken = dgesLogin.body?.token;

  if (!decToken || !dgesToken) {
    console.log('❌ Login échoué');
    process.exit(1);
  }

  // ── Module 2 : DEC bloqué ──
  const m2Paths = [
    ['GET', `/dges/etablissements/${ETAB_ID}/admins`],
    ['POST', `/dges/etablissements/${ETAB_ID}/admins`, { email: 'x@test.com', nom: 'X', prenom: 'Y' }],
    ['POST', '/dges/etablissements', { nom: 'Fake', type: 'PRIVE' }],
  ];

  for (const [method, path, body] of m2Paths) {
    const r = await req(method, path, decToken, body);
    results.push(
      ok(
        `DEC bloqué M2 ${method} ${path}`,
        r.status === 403,
        `status=${r.status} err=${r.data?.error || r.data?.code || ''}`,
      ),
    );
  }

  // ── Module 2 : DGES OK ──
  const admins = await req('GET', `/dges/etablissements/${ETAB_ID}/admins`, dgesToken);
  results.push(
    ok(
      'DGES OK M2 GET admins',
      admins.status === 200,
      `status=${admins.status}`,
    ),
  );

  // ── Commission établissement désactivée ──
  const disabledDec = await req('GET', `/dges/etablissements/${ETAB_ID}/commission`, decToken);
  const disabledDges = await req('GET', `/dges/etablissements/${ETAB_ID}/commission`, dgesToken);
  const disabledCode =
    disabledDges.data?.code === 'COMMISSION_ETABLISSEMENT_DISABLED' ||
    String(disabledDges.data?.error || '').includes('plus disponible');

  results.push(
    ok(
      'Commission établissement toujours désactivée (DGES → 403 + code)',
      disabledDges.status === 403 && disabledCode,
      `status=${disabledDges.status} code=${disabledDges.data?.code || ''} err=${disabledDges.data?.error || ''}`,
    ),
  );
  results.push(
    ok(
      'Commission établissement désactivée aussi pour DEC → 403',
      disabledDec.status === 403,
      `status=${disabledDec.status} code=${disabledDec.data?.code || ''}`,
    ),
  );

  // Sanity: DEC peut encore faire du M1
  const centres = await req('GET', '/centres-composition', decToken);
  results.push(
    ok('DEC M1 centres toujours OK', centres.status === 200, `status=${centres.status}`),
  );

  const allOk = results.every(Boolean);
  console.log(allOk ? '\n✅ Audit Phase 3 OK\n' : '\n❌ Échecs Phase 3\n');
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
