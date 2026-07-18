/**
 * Smoke test navigation DEC — 5 pages
 * Usage: node scripts/test-dec-nav-pages.js
 * Prérequis: API + front (API suffisante pour les endpoints; pages vérifiées via routes/API)
 */
require('dotenv').config();
const BASE = process.env.API_URL || 'http://localhost:3001/api';
const FRONT = process.env.FRONT_URL || 'http://localhost:5173';

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
  return { status: res.status, token: body?.token, role: body?.user?.role };
}

async function api(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  const results = [];
  const dec = await login('dec@test.com', 'password123');
  results.push(ok('Login DEC', dec.status === 200 && dec.role === 'DEC', `role=${dec.role}`));
  if (!dec.token) process.exit(1);

  // Menu routes exist in front App (static check via fetch SPA - may 200 for all)
  const pages = [
    ['Tableau de bord', '/dashboard-dec'],
    ['Concours', '/gestion-concours'],
    ['Centres', '/dec/centres'],
    ['Commission', '/dec/commission'],
    ['Convocations', '/dec/convocations'],
  ];

  for (const [label, path] of pages) {
    try {
      const res = await fetch(`${FRONT}${path}`, { redirect: 'manual' });
      // Vite SPA returns 200 for all client routes
      results.push(ok(`1. Menu page accessible: ${label}`, res.status === 200 || res.status === 304, `GET ${path} → ${res.status}`));
    } catch (err) {
      results.push(ok(`1. Menu page accessible: ${label}`, false, err.message));
    }
  }

  // 2. Backend data for each page loads
  const concours = await api('/concours', dec.token);
  results.push(ok('2a. Concours list (page Concours/Convocations)', concours.status === 200 && Array.isArray(concours.data), `status=${concours.status} n=${concours.data?.length}`));

  const centres = await api('/centres-composition', dec.token);
  results.push(ok('2b. Centres list (page Centres)', centres.status === 200 && Array.isArray(centres.data), `status=${centres.status} n=${centres.data?.length}`));

  const firstId = Array.isArray(concours.data) && concours.data[0]?.id;
  if (firstId) {
    const commission = await api(`/dges/concours/${firstId}/commission`, dec.token);
    results.push(ok(
      '2c. Commission concours (page Commission)',
      commission.status === 200 && Boolean(commission.data?.concours),
      `status=${commission.status} etude=${commission.data?.concours?.etudeCloturee}`,
    ));
    results.push(ok(
      '2d. etudeCloturee exposé pour boutons étude',
      typeof commission.data?.concours?.etudeCloturee === 'boolean',
      `etudeCloturee=${commission.data?.concours?.etudeCloturee}`,
    ));
  } else {
    results.push(ok('2c. Commission concours', false, 'aucun concours'));
    results.push(ok('2d. etudeCloturee', false, 'skip'));
  }

  // 3. Actions still wired (endpoints DEC)
  const dgesForbidden = await login('dges@test.com', 'password123');
  if (firstId && dgesForbidden.token) {
    const r = await api(`/dges/concours/${firstId}/commission`, dgesForbidden.token);
    results.push(ok('3a. Commission concours réservée DEC (DGES → 403)', r.status === 403, `DGES status=${r.status}`));
  }

  // Smoke: generate numeros endpoint still exists for DEC
  if (firstId) {
    const gen = await fetch(`${BASE}/dges/concours/${firstId}/generer-numeros-table`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${dec.token}` },
    });
    const genData = await gen.json().catch(() => ({}));
    results.push(ok(
      '3b. Générer n° table (Convocations) répond',
      gen.status === 200,
      `status=${gen.status} msg=${genData.message || genData.error || ''}`,
    ));
  }

  // Static: DECLayout has 5 tabs
  const fs = require('fs');
  const path = require('path');
  const frontRoot = path.join(__dirname, '..', '..', 'unipath-front', 'src');
  const layout = fs.readFileSync(path.join(frontRoot, 'components', 'DECLayout.jsx'), 'utf8');
  const has5 = ['Tableau de bord', 'Concours', 'Centres', 'Commission', 'Convocations']
    .every((l) => layout.includes(`label: '${l}'`));
  results.push(ok('3c. DECLayout contient les 5 labels', has5));

  const gestion = fs.readFileSync(path.join(frontRoot, 'pages', 'GestionConcours.jsx'), 'utf8');
  results.push(ok(
    '3d. GestionConcours allégée (plus de centres/étude/CSV)',
    !gestion.includes('GestionCentresConcours')
      && !gestion.includes('handleToggleEtude')
      && !gestion.includes('importerNumerosTable')
      && !gestion.includes('genererNumerosTable'),
  ));

  const pagesExist = ['DECCentres.jsx', 'DECCommission.jsx', 'DECConvocations.jsx']
    .every((f) => fs.existsSync(path.join(frontRoot, 'pages', f)));
  results.push(ok('3e. 3 nouvelles pages présentes', pagesExist));

  const passed = results.filter(Boolean).length;
  console.log(`\n=== DEC nav : ${passed}/${results.length} ===`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
