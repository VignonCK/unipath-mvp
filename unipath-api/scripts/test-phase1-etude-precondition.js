/**
 * Phase 1 — précondition ouverture étude
 * Usage: node scripts/test-phase1-etude-precondition.js
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

async function main() {
  const results = [];
  const cleanup = { concoursId: null, membreIds: [] };

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
    const create = await api('POST', '/concours', dec.token, {
      libelle: `TEST ETUDE PRECOND ${stamp}`,
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
    cleanup.concoursId = create.data?.id;
    results.push(ok(
      '1. Nouveau concours → etudeCloturee=true',
      create.status === 201 && create.data?.etudeCloturee === true,
      `status=${create.status} etude=${create.data?.etudeCloturee} at=${create.data?.etudeClotureeAt}`,
    ));

    const concoursId = cleanup.concoursId;
    if (!concoursId) {
      console.log('Abort — pas de concours');
      process.exit(1);
    }

    const get1 = await api('GET', `/dges/concours/${concoursId}/commission`, dec.token);
    results.push(ok(
      '1b. GET commission → peutOuvrirEtude=false + manquants',
      get1.status === 200
        && get1.data.peutOuvrirEtude === false
        && Array.isArray(get1.data.manquants)
        && get1.data.manquants.includes('EXAMINATEUR')
        && get1.data.manquants.includes('CONTROLEUR'),
      `peut=${get1.data.peutOuvrirEtude} manquants=${JSON.stringify(get1.data.manquants)}`,
    ));

    const openSans = await api('POST', `/dges/concours/${concoursId}/rouvrir-etude`, dec.token);
    results.push(ok(
      '2. Ouvrir sans staff → 400 COMMISSION_INCOMPLETE',
      openSans.status === 400 && openSans.data.code === 'COMMISSION_INCOMPLETE',
      `status=${openSans.status} code=${openSans.data.code}`,
    ));

    const exam = await api('POST', `/dges/concours/${concoursId}/commission`, dec.token, {
      nom: 'Exam',
      prenom: 'Test',
      email: `exam.precond.${stamp}@test.local`,
      sousRole: 'EXAMINATEUR',
    });
    if (exam.data?.membre?.id) cleanup.membreIds.push(exam.data.membre.id);
    results.push(ok('3a. Créer examinateur', exam.status === 201, `status=${exam.status}`));

    const openPartial = await api('POST', `/dges/concours/${concoursId}/rouvrir-etude`, dec.token);
    results.push(ok(
      '3b. Ouvrir avec seulement examinateur → 400',
      openPartial.status === 400 && openPartial.data.code === 'COMMISSION_INCOMPLETE',
      `status=${openPartial.status} manquants=${JSON.stringify(openPartial.data.manquants)}`,
    ));

    const ctrl = await api('POST', `/dges/concours/${concoursId}/commission`, dec.token, {
      nom: 'Ctrl',
      prenom: 'Test',
      email: `ctrl.precond.${stamp}@test.local`,
      sousRole: 'CONTROLEUR',
    });
    if (ctrl.data?.membre?.id) cleanup.membreIds.push(ctrl.data.membre.id);
    results.push(ok('3c. Créer contrôleur', ctrl.status === 201, `status=${ctrl.status}`));

    const get2 = await api('GET', `/dges/concours/${concoursId}/commission`, dec.token);
    results.push(ok(
      '3d. GET commission → peutOuvrirEtude=true',
      get2.status === 200 && get2.data.peutOuvrirEtude === true && get2.data.manquants?.length === 0,
      `peut=${get2.data.peutOuvrirEtude}`,
    ));

    const openOk = await api('POST', `/dges/concours/${concoursId}/rouvrir-etude`, dec.token);
    results.push(ok(
      '3e. Ouvrir avec staff complet → 200',
      openOk.status === 200 && openOk.data?.concours?.etudeCloturee === false,
      `status=${openOk.status} etude=${openOk.data?.concours?.etudeCloturee}`,
    ));
  } finally {
    console.log('\n=== Cleanup ===');
    for (const id of cleanup.membreIds) {
      await prisma.membreCommission.delete({ where: { id } }).catch(() => {});
    }
    if (cleanup.concoursId) {
      await prisma.concours.delete({ where: { id: cleanup.concoursId } }).catch(() => {});
    }
  }

  const passed = results.filter(Boolean).length;
  console.log(`\n=== Phase 1 précondition : ${passed}/${results.length} ===`);
  process.exit(passed === results.length ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
