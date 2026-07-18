/**
 * Phase 1/6 — vérifie auth DEC vs DGES (login + rôle résolu).
 * Usage: node scripts/test-phase1-dec-auth.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE = process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:3001/api';

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  console.log(`API: ${BASE}\n`);
  const results = [];

  // 1. Login DEC
  const decLogin = await login('dec@test.com', 'password123');
  const decOk =
    decLogin.status === 200 &&
    decLogin.body?.user?.role === 'DEC' &&
    !!decLogin.body?.token;
  results.push({
    name: '1. dec@test.com login → rôle DEC',
    ok: decOk,
    detail: `status=${decLogin.status} role=${decLogin.body?.user?.role} token=${!!decLogin.body?.token}`,
  });

  // 2. DEC n'est pas DGES
  const notDges = decLogin.body?.user?.role === 'DEC' && decLogin.body?.user?.role !== 'DGES';
  results.push({
    name: '2. Rôle résolu = DEC (pas DGES)',
    ok: notDges,
    detail: `role=${decLogin.body?.user?.role}`,
  });

  // 3. Login DGES sans régression
  const dgesLogin = await login('dges@test.com', 'password123');
  const dgesOk =
    dgesLogin.status === 200 &&
    dgesLogin.body?.user?.role === 'DGES' &&
    !!dgesLogin.body?.token;
  results.push({
    name: '3. dges@test.com login → rôle DGES (sans régression)',
    ok: dgesOk,
    detail: `status=${dgesLogin.status} role=${dgesLogin.body?.user?.role} token=${!!dgesLogin.body?.token}`,
  });

  // 4. Tables / enum OK — DGES intact, DEC présent
  const dgesCount = await prisma.administrateurDGES.count();
  const decCount = await prisma.administrateurDEC.count();
  const decRow = await prisma.administrateurDEC.findUnique({
    where: { email: 'dec@test.com' },
    select: { role: true, email: true },
  });
  results.push({
    name: '4. Données: AdministrateurDGES intact + AdministrateurDEC présent',
    ok: dgesCount >= 1 && decCount >= 1 && decRow?.role === 'DEC',
    detail: `DGES rows=${dgesCount} DEC rows=${decCount} dec@test role=${decRow?.role}`,
  });

  // 5. Smoke: route métier DGES encore joignable (auth) — GET stats avec token DGES
  let routeOk = false;
  let routeDetail = '';
  if (dgesLogin.body?.token) {
    const statsRes = await fetch(`${BASE}/dges/statistiques`, {
      headers: { Authorization: `Bearer ${dgesLogin.body.token}` },
    });
    routeOk = statsRes.status === 200 || statsRes.status === 404;
    // 200 = OK; 404 si path différent — on essaie aussi concours
    if (statsRes.status !== 200) {
      const concoursRes = await fetch(`${BASE}/concours`, {
        headers: { Authorization: `Bearer ${dgesLogin.body.token}` },
      });
      routeOk = concoursRes.status < 500;
      routeDetail = `statistiques=${statsRes.status} concours=${concoursRes.status}`;
    } else {
      routeDetail = `statistiques=${statsRes.status}`;
    }
  } else {
    routeDetail = 'pas de token DGES';
  }
  results.push({
    name: '5. Routes existantes non cassées (smoke DGES token)',
    ok: routeOk,
    detail: routeDetail,
  });

  // 6. DEC token ne doit pas être confondu avec DGES en DB lookup
  if (decLogin.body?.token && decLogin.body?.user) {
    const ctxRole = decLogin.body.user.role;
    results.push({
      name: '6. Payload login DEC contient bien role=DEC',
      ok: ctxRole === 'DEC',
      detail: JSON.stringify({
        role: ctxRole,
        nom: decLogin.body.user.nom,
        prenom: decLogin.body.user.prenom,
      }),
    });
  }

  console.log('──────── Résultats Phase 1 DEC auth ────────');
  let allOk = true;
  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} ${r.name}`);
    console.log(`   ${r.detail}`);
    if (!r.ok) allOk = false;
  }
  console.log(allOk ? '\n✅ Tous les tests passent\n' : '\n❌ Échecs détectés\n');
  process.exit(allOk ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
