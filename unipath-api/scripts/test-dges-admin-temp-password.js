/**
 * DGES : création / réinit mdp admin établissement (temporaryPassword one-shot)
 * Usage: node scripts/test-dges-admin-temp-password.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('../src/prisma');
const { supabaseAdmin } = require('../src/supabase');

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

function containsPlain(haystack, secret) {
  if (!secret) return false;
  if (typeof haystack === 'string') return haystack.includes(secret);
  try {
    return JSON.stringify(haystack).includes(secret);
  } catch {
    return false;
  }
}

async function main() {
  const results = [];
  let createdAdminId = null;
  let etablissementId = null;
  let tempFromCreate = null;
  let tempFromReset = null;

  try {
    console.log('\n=== DGES admin temporary password ===\n');

    const dges = await login('dges@test.com', 'password123');
    results.push(ok('Login DGES', Boolean(dges.token), `status=${dges.status}`));
    if (!dges.token) throw new Error('DGES login failed');

    const dec = await login('dec@test.com', 'password123');
    results.push(ok('Login DEC (non-DGES)', Boolean(dec.token)));

    const etabs = await prisma.etablissement.findMany({
      where: { type: 'PRIVE' },
      select: { id: true, nom: true },
      take: 1,
    });
    etablissementId = etabs[0]?.id;
    results.push(ok('Établissement PRIVE trouvé', Boolean(etablissementId), etabs[0]?.nom || ''));
    if (!etablissementId) throw new Error('Aucun établissement PRIVE');

    // ─── 3. Création admin → temporaryPassword ───
    console.log('\n--- 3. Création admin ---\n');
    const emailCreate = `forsuree15+admin-tmp-${stamp}@gmail.com`;
    const create = await api('POST', `/dges/etablissements/${etablissementId}/admins`, dges.token, {
      nom: 'Tmp',
      prenom: 'Admin',
      email: emailCreate,
      telephone: '22900000000',
    });
    createdAdminId = create.data?.admin?.id || null;
    tempFromCreate = create.data?.temporaryPassword || null;
    results.push(ok(
      'Création admin 201 + temporaryPassword',
      create.status === 201 && typeof tempFromCreate === 'string' && tempFromCreate.length >= 8,
      `status=${create.status} hasPwd=${Boolean(tempFromCreate)} email=${create.data?.admin?.email}`,
    ));

    // ─── 1. Réinit mdp admin existant ───
    console.log('\n--- 1. Réinitialisation ---\n');
    const existing = await prisma.adminEtablissement.findFirst({
      where: {
        etablissementId,
        ...(createdAdminId ? { id: { not: createdAdminId } } : {}),
      },
      select: { id: true, email: true },
    });
    const targetId = existing?.id || createdAdminId;
    const targetEmail = existing?.email || emailCreate;
    results.push(ok('Admin cible pour réinit', Boolean(targetId), targetEmail));

    const reset = await api(
      'POST',
      `/dges/etablissements/${etablissementId}/admins/${targetId}/reinitialiser-mot-de-passe`,
      dges.token,
    );
    tempFromReset = reset.data?.temporaryPassword || null;
    results.push(ok(
      'DGES réinit → temporaryPassword une fois',
      reset.status === 200 && typeof tempFromReset === 'string' && tempFromReset.length >= 8,
      `status=${reset.status}`,
    ));

    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.getUserById(targetId);
    const meta = authUser?.user?.user_metadata || {};
    results.push(ok(
      'mustChangePassword=true après réinit',
      !authErr && meta.mustChangePassword === true,
      `mustChangePassword=${meta.mustChangePassword} err=${authErr?.message || ''}`,
    ));

    // ─── 2. Non-DGES → 403 ───
    console.log('\n--- 2. Non-DGES 403 ---\n');
    const forbidden = await api(
      'POST',
      `/dges/etablissements/${etablissementId}/admins/${targetId}/reinitialiser-mot-de-passe`,
      dec.token,
    );
    results.push(ok(
      'DEC (non-DGES) → 403',
      forbidden.status === 403,
      `status=${forbidden.status}`,
    ));

    // ─── 4. Pas de clair en log / Prisma ───
    console.log('\n--- 4. Pas de clair stocké ---\n');
    const secrets = [tempFromCreate, tempFromReset].filter(Boolean);
    const adminRow = await prisma.adminEtablissement.findUnique({ where: { id: targetId } });
    const emails = await prisma.emailDelivery.findMany({
      where: { userId: targetId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    let schemaHasPassword = false;
    try {
      schemaHasPassword = Object.prototype.hasOwnProperty.call(adminRow || {}, 'password')
        || Object.prototype.hasOwnProperty.call(adminRow || {}, 'motDePasse')
        || Object.prototype.hasOwnProperty.call(adminRow || {}, 'temporaryPassword');
    } catch { /* ignore */ }

    const inPrismaAdmin = secrets.some((s) => containsPlain(adminRow, s));
    const inEmailBodies = secrets.some((s) => emails.some((e) => containsPlain(e.htmlBody, s) || containsPlain(e.textBody, s)));

    const logCandidates = [
      path.join(__dirname, '../logs'),
      path.join(__dirname, '../logs/combined.log'),
      path.join(__dirname, '../logs/app.log'),
      path.join(__dirname, '../logs/error.log'),
    ];
    let inLogs = false;
    for (const p of logCandidates) {
      try {
        if (!fs.existsSync(p)) continue;
        const st = fs.statSync(p);
        if (st.isDirectory()) {
          for (const f of fs.readdirSync(p)) {
            const content = fs.readFileSync(path.join(p, f), 'utf8');
            if (secrets.some((s) => content.includes(s))) inLogs = true;
          }
        } else {
          const content = fs.readFileSync(p, 'utf8');
          if (secrets.some((s) => content.includes(s))) inLogs = true;
        }
      } catch { /* ignore missing */ }
    }

    results.push(ok('Pas de champ password Prisma AdminEtablissement', !schemaHasPassword));
    results.push(ok('Mdp absent de la ligne AdminEtablissement', !inPrismaAdmin));
    results.push(ok('Mdp absent des EmailDelivery (html/text)', !inEmailBodies, `emails=${emails.length}`));
    results.push(ok('Mdp absent des fichiers logs locaux', !inLogs));

    // ─── 5. Login avec mdp temporaire + mustChangePassword ───
    console.log('\n--- 5. Login admin temporaire ---\n');
    const loginTemp = await login(targetEmail, tempFromReset);
    results.push(ok(
      'Login admin avec mdp temporaire',
      loginTemp.status === 200 && Boolean(loginTemp.token),
      `status=${loginTemp.status}`,
    ));
    results.push(ok(
      'mustChangePassword dans réponse login',
      loginTemp.body?.mustChangePassword === true
        || loginTemp.body?.user?.mustChangePassword === true,
      `body.mustChangePassword=${loginTemp.body?.mustChangePassword} user=${loginTemp.body?.user?.mustChangePassword}`,
    ));

    console.log('\n=== RÉSUMÉ ===');
    const passed = results.filter(Boolean).length;
    console.log(`${passed}/${results.length} PASS`);
    process.exit(passed === results.length ? 0 : 1);
  } catch (err) {
    console.error('FATAL', err);
    process.exit(1);
  } finally {
    if (createdAdminId) {
      try {
        await prisma.adminEtablissement.delete({ where: { id: createdAdminId } }).catch(() => {});
        await supabaseAdmin.auth.admin.deleteUser(createdAdminId).catch(() => {});
      } catch { /* cleanup best-effort */ }
    }
    await prisma.$disconnect().catch(() => {});
  }
}

main();
