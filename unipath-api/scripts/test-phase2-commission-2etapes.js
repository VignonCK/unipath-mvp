/**
 * Phase 2 — création compte commission en 2 étapes
 * Usage: node scripts/test-phase2-commission-2etapes.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { supabaseAdmin } = require('../src/supabase');

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
  return { status: res.status, token: body?.token };
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

async function cleanupAuth(id) {
  try {
    await supabaseAdmin.auth.admin.deleteUser(id);
  } catch {
    /* ignore */
  }
}

async function main() {
  const results = [];
  const cleanup = { membreIds: [], concoursIds: [] };

  try {
    const dec = await login('dec@test.com', 'password123');
    results.push(ok('Login DEC', Boolean(dec.token)));
    if (!dec.token) process.exit(1);

    const etab = await prisma.etablissement.findFirst({
      where: { type: 'PUBLIC' },
      select: { id: true, nom: true },
    });
    results.push(ok('Établissement public trouvé', Boolean(etab?.id), etab?.nom));

    const now = Date.now();
    const mkConcours = async (label) => {
      const create = await api('POST', '/concours', dec.token, {
        libelle: label,
        etablissementId: etab.id,
        etablissement: etab.nom,
        dateDebutDepot: new Date(now).toISOString(),
        dateFinDepot: new Date(now + 10 * 86400000).toISOString(),
        dateDebutComposition: new Date(now + 15 * 86400000).toISOString(),
        dateFinComposition: new Date(now + 20 * 86400000).toISOString(),
        fraisParticipation: 5000,
        seriesAcceptees: ['C'],
        piecesRequises: {
          pieces: [
            { id: 'acte_naissance', nom: 'Acte de naissance', obligatoire: true, formats: ['PDF'] },
            { id: 'quittance', nom: 'Quittance', obligatoire: true, formats: ['PDF'] },
          ],
        },
      });
      if (create.data?.id) cleanup.concoursIds.push(create.data.id);
      return create;
    };

    const c1 = await mkConcours(`TEST P2 COMM A ${stamp}`);
    const c2 = await mkConcours(`TEST P2 COMM B ${stamp}`);
    results.push(ok('2 concours de test créés', c1.status === 201 && c2.status === 201,
      `c1=${c1.status} c2=${c2.status}`));
    const concoursIdA = c1.data?.id;
    const concoursIdB = c2.data?.id;
    if (!concoursIdA || !concoursIdB) {
      console.log('Abort — concours manquants');
      process.exit(1);
    }

    // 1. Créer un compte → pool
    const create = await api('POST', '/dges/commission/comptes', dec.token, {
      nom: 'Pool',
      prenom: 'Phase2',
      email: `pool.p2.${stamp}@test.local`,
    });
    const membreId = create.data?.membre?.id;
    if (membreId) cleanup.membreIds.push(membreId);
    results.push(ok(
      '1. Créer compte → succès, concoursId null',
      create.status === 201
        && create.data?.membre?.concoursId === null
        && create.data?.membre?.sousRole === 'MEMBRE',
      `status=${create.status} concoursId=${create.data?.membre?.concoursId} sousRole=${create.data?.membre?.sousRole}`,
    ));

    const listA = await api('GET', `/dges/concours/${concoursIdA}/commission`, dec.token);
    const listB = await api('GET', `/dges/concours/${concoursIdB}/commission`, dec.token);
    const inA = (listA.data?.membres || []).some((m) => m.id === membreId);
    const inB = (listB.data?.membres || []).some((m) => m.id === membreId);
    results.push(ok(
      '1b. Invisible dans les listes assignés (A et B)',
      listA.status === 200 && listB.status === 200 && !inA && !inB,
      `inA=${inA} inB=${inB}`,
    ));

    const pool1 = await api('GET', '/dges/commission/comptes?nonAssignes=1', dec.token);
    const inPool1 = (pool1.data?.comptes || []).some((m) => m.id === membreId);
    results.push(ok('1c. Présent dans le pool nonAssignes', pool1.status === 200 && inPool1));

    // 2. Assigner EXAMINATEUR sur concours A
    const assign = await api('POST', `/dges/concours/${concoursIdA}/commission/assigner`, dec.token, {
      membreId,
      sousRole: 'EXAMINATEUR',
    });
    results.push(ok(
      '2. Assigner EXAMINATEUR → succès',
      assign.status === 200
        && assign.data?.membre?.concoursId === concoursIdA
        && assign.data?.membre?.sousRole === 'EXAMINATEUR',
      `status=${assign.status} concoursId=${assign.data?.membre?.concoursId}`,
    ));

    const listA2 = await api('GET', `/dges/concours/${concoursIdA}/commission`, dec.token);
    const visibleA = (listA2.data?.membres || []).some((m) => m.id === membreId);
    results.push(ok('2b. Visible dans assignés du concours A', visibleA));

    const pool2 = await api('GET', '/dges/commission/comptes?nonAssignes=1', dec.token);
    const stillInPool = (pool2.data?.comptes || []).some((m) => m.id === membreId);
    results.push(ok('2c. Plus dans le pool', !stillInPool));

    // 3. Tentative assignation concours B → refus
    const assignB = await api('POST', `/dges/concours/${concoursIdB}/commission/assigner`, dec.token, {
      membreId,
      sousRole: 'CONTROLEUR',
    });
    results.push(ok(
      '3. Assigner au 2ème concours → refusé DEJA_ASSIGNE',
      assignB.status === 409 && assignB.data?.code === 'DEJA_ASSIGNE',
      `status=${assignB.status} code=${assignB.data?.code}`,
    ));

    // 4. Désassigner → retour pool
    const unassign = await api('DELETE', `/dges/concours/${concoursIdA}/commission/${membreId}`, dec.token);
    results.push(ok(
      '4. Désassigner → concoursId null',
      unassign.status === 200
        && unassign.data?.membre?.concoursId === null
        && unassign.data?.membre?.sousRole === 'MEMBRE',
      `status=${unassign.status} concoursId=${unassign.data?.membre?.concoursId}`,
    ));

    const pool3 = await api('GET', '/dges/commission/comptes?nonAssignes=1', dec.token);
    const backInPool = (pool3.data?.comptes || []).some((m) => m.id === membreId);
    results.push(ok('4b. Réapparaît dans le pool', backInPool));

    const listA3 = await api('GET', `/dges/concours/${concoursIdA}/commission`, dec.token);
    const goneA = !(listA3.data?.membres || []).some((m) => m.id === membreId);
    results.push(ok('4c. Absent des assignés du concours A', goneA));

    // 5. Ancien endpoint → 410
    const obsolete = await api('POST', `/dges/concours/${concoursIdA}/commission`, dec.token, {
      nom: 'Old',
      prenom: 'Flow',
      email: `old.p2.${stamp}@test.local`,
      sousRole: 'EXAMINATEUR',
    });
    results.push(ok(
      '5. Ancien POST création+assignation → 410 ENDPOINT_REMOVED',
      obsolete.status === 410 && obsolete.data?.code === 'ENDPOINT_REMOVED',
      `status=${obsolete.status} code=${obsolete.data?.code}`,
    ));
  } finally {
    console.log('\n=== Cleanup ===');
    for (const id of cleanup.membreIds) {
      await prisma.membreCommission.delete({ where: { id } }).catch(() => {});
      await cleanupAuth(id);
    }
    for (const id of cleanup.concoursIds) {
      await prisma.concours.delete({ where: { id } }).catch(() => {});
    }
  }

  const passed = results.filter(Boolean).length;
  console.log(`\n=== Phase 2 commission 2 étapes : ${passed}/${results.length} ===`);
  process.exit(passed === results.length ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
