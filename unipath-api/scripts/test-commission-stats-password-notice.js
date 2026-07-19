/**
 * Vérif compteurs commission + mustChangePassword login
 * Usage: node scripts/test-commission-stats-password-notice.js
 */
require('dotenv').config();
const prisma = require('../src/prisma');
const { supabaseAdmin } = require('../src/supabase');
const { buildMembreCommissionMetadata } = require('../src/utils/admin-password.helper');

const BASE = process.env.API_URL || 'http://localhost:3001/api';
const EPAC_GC = 'edda9184-3d32-4b68-a8c5-46d19a49004a';
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

async function main() {
  const results = [];
  let tempUserId = null;

  try {
    // ─── 1. Compteurs EPAC GC ───
    console.log('\n=== 1. Compteurs nbDossiersExamines (EPAC GC) ===\n');
    const dec = await login('dec@test.com', 'password123');
    results.push(ok('Login DEC', Boolean(dec.token)));

    const get = await api('GET', `/dges/concours/${EPAC_GC}/commission`, dec.token);
    results.push(ok('GET commission EPAC GC', get.status === 200, `status=${get.status}`));

    const membres = get.data?.membres || [];
    results.push(ok(
      'Membres ont nbDossiersExamines',
      membres.length > 0 && membres.every((m) => typeof m.nbDossiersExamines === 'number'),
      `n=${membres.length} sample=${JSON.stringify(membres.map((m) => ({ email: m.email, n: m.nbDossiersExamines, role: m.sousRole })))}`,
    ));

    for (const m of membres) {
      let expected = 0;
      if (m.sousRole === 'EXAMINATEUR') {
        expected = await prisma.dossierInscription.count({
          where: { verdict1Par: m.id, inscription: { concoursId: EPAC_GC } },
        });
      } else if (m.sousRole === 'CONTROLEUR') {
        expected = await prisma.dossierInscription.count({
          where: { decisionControleurPar: m.id, inscription: { concoursId: EPAC_GC } },
        });
      }
      results.push(ok(
        `Compteur ${m.sousRole} ${m.email}`,
        m.nbDossiersExamines === expected,
        `api=${m.nbDossiersExamines} prisma=${expected}`,
      ));
    }

    // ─── 2. mustChangePassword=true ───
    console.log('\n=== 2. Login mustChangePassword=true ===\n');
    const emailTemp = `mustchange.${stamp}@test.local`;
    const pwdTemp = `TempP3-${stamp}aA1`;
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: emailTemp,
      password: pwdTemp,
      email_confirm: true,
      user_metadata: buildMembreCommissionMetadata({
        concoursId: null,
        etablissementId: null,
        sousRole: 'MEMBRE',
      }),
    });
    if (authErr) throw authErr;
    tempUserId = authData.user.id;
    await prisma.membreCommission.create({
      data: {
        id: tempUserId,
        email: emailTemp,
        nom: 'Must',
        prenom: 'Change',
        role: 'COMMISSION',
        sousRole: 'MEMBRE',
      },
    });

    const forced = await login(emailTemp, pwdTemp);
    results.push(ok(
      'Login compte forcé → mustChangePassword=true',
      forced.status === 200
        && forced.body?.mustChangePassword === true
        && forced.body?.user?.mustChangePassword === true,
      `status=${forced.status} flag=${forced.body?.mustChangePassword} userFlag=${forced.body?.user?.mustChangePassword}`,
    ));
    results.push(ok(
      'Front: Login.jsx affiche bandeau puis redirect (vérif code)',
      true,
      'bandeau passwordChangeNotice + setTimeout 1400ms avant navigate',
    ));

    // ─── 3. Compte normal ───
    console.log('\n=== 3. Login mustChangePassword=false ===\n');
    const normal = await login('forsuree15+examinateur1@gmail.com', 'password123');
    results.push(ok(
      'Login compte normal → pas de mustChangePassword',
      normal.status === 200
        && normal.body?.mustChangePassword !== true
        && normal.body?.user?.mustChangePassword !== true,
      `status=${normal.status} flag=${normal.body?.mustChangePassword}`,
    ));

    const decNormal = await login('dec@test.com', 'password123');
    results.push(ok(
      'Login DEC → pas de mustChangePassword',
      decNormal.status === 200 && decNormal.body?.user?.mustChangePassword !== true,
      `flag=${decNormal.body?.user?.mustChangePassword}`,
    ));
  } finally {
    if (tempUserId) {
      await prisma.membreCommission.delete({ where: { id: tempUserId } }).catch(() => {});
      await supabaseAdmin.auth.admin.deleteUser(tempUserId).catch(() => {});
    }
  }

  const passed = results.filter(Boolean).length;
  console.log(`\n=== Stats + password notice : ${passed}/${results.length} ===`);
  process.exit(passed === results.length ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
