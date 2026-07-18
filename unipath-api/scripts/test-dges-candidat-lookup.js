/**
 * Tests lookup candidat DGES (Module 2).
 * Usage: node scripts/test-dges-candidat-lookup.js
 * Prérequis: API localhost:3001
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE = process.env.API_URL || 'http://localhost:3001/api';

const FORBIDDEN_KEYS = [
  'emailConfirmToken',
  'emailConfirmExpires',
  'inscriptions',
  'dossier',
  'diplome',
  'applications',
  'preinscriptionsEtablissement',
  'InscriptionAcademique',
];

function ok(name, pass, detail = '') {
  console.log(`${pass ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
  return pass;
}

function collectKeys(value, keys = new Set()) {
  if (!value || typeof value !== 'object') return keys;
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
    return keys;
  }
  for (const [k, v] of Object.entries(value)) {
    keys.add(k);
    collectKeys(v, keys);
  }
  return keys;
}

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, token: body?.token, role: body?.user?.role };
}

async function lookup(token, matricule) {
  const url = `${BASE}/dges/candidats/lookup?matricule=${encodeURIComponent(matricule)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  console.log(`API: ${BASE}\n`);
  const results = [];

  const dges = await login('dges@test.com', 'password123');
  const dec = await login('dec@test.com', 'password123');
  results.push(ok('Login DGES', dges.status === 200 && dges.role === 'DGES', `role=${dges.role}`));
  results.push(ok('Login DEC', dec.status === 200 && dec.role === 'DEC', `role=${dec.role}`));
  if (!dges.token || !dec.token) {
    console.log('\n❌ Tokens manquants\n');
    process.exit(1);
  }

  const withM2 = await prisma.candidat.findFirst({
    where: { InscriptionAcademique: { some: {} } },
    select: {
      matricule: true,
      nom: true,
      _count: { select: { InscriptionAcademique: true } },
    },
  });
  const withoutM2 = await prisma.candidat.findFirst({
    where: { InscriptionAcademique: { none: {} } },
    select: { matricule: true, nom: true },
  });

  results.push(
    ok(
      'Prérequis: candidat avec parcours M2',
      Boolean(withM2?.matricule),
      withM2
        ? `${withM2.matricule} (${withM2._count.InscriptionAcademique} insc.)`
        : 'aucun',
    ),
  );
  results.push(
    ok(
      'Prérequis: candidat sans parcours M2',
      Boolean(withoutM2?.matricule),
      withoutM2 ? withoutM2.matricule : 'aucun',
    ),
  );

  if (withM2?.matricule) {
    const r = await lookup(dges.token, withM2.matricule);
    const keys = collectKeys(r.data);
    const leak = FORBIDDEN_KEYS.filter((k) => keys.has(k));
    results.push(
      ok(
        'DGES + matricule avec M2 → 200 + identité + inscriptions',
        r.status === 200
          && r.data?.candidat?.matricule === withM2.matricule
          && Array.isArray(r.data?.inscriptionsAcademiques)
          && r.data.inscriptionsAcademiques.length > 0
          && Boolean(r.data.candidat.nom)
          && Boolean(r.data.candidat.prenom),
        `status=${r.status} n=${r.data?.inscriptionsAcademiques?.length}`,
      ),
    );
    results.push(
      ok(
        'Whitelist: aucune clé interdite (cas avec M2)',
        leak.length === 0,
        leak.length ? `fuite=${leak.join(',')}` : 'OK',
      ),
    );
  }

  if (withoutM2?.matricule) {
    const r = await lookup(dges.token, withoutM2.matricule);
    const keys = collectKeys(r.data);
    const leak = FORBIDDEN_KEYS.filter((k) => keys.has(k));
    results.push(
      ok(
        'DGES + matricule sans M2 → 200 + liste vide',
        r.status === 200
          && r.data?.candidat?.matricule === withoutM2.matricule
          && Array.isArray(r.data?.inscriptionsAcademiques)
          && r.data.inscriptionsAcademiques.length === 0,
        `status=${r.status} n=${r.data?.inscriptionsAcademiques?.length}`,
      ),
    );
    results.push(
      ok(
        'Whitelist: aucune clé interdite (cas sans M2)',
        leak.length === 0,
        leak.length ? `fuite=${leak.join(',')}` : 'OK',
      ),
    );
  }

  const unknown = await lookup(dges.token, 'UnP-2099-999999');
  results.push(
    ok('DGES + matricule inconnu → 404', unknown.status === 404, `status=${unknown.status}`),
  );

  const bad = await lookup(dges.token, 'INVALID');
  results.push(
    ok('DGES + matricule invalide → 400', bad.status === 400, `status=${bad.status}`),
  );

  if (withM2?.matricule) {
    const forbidden = await lookup(dec.token, withM2.matricule);
    results.push(
      ok('DEC → 403 sur lookup DGES', forbidden.status === 403, `status=${forbidden.status}`),
    );
  } else {
    const forbidden = await lookup(dec.token, 'UnP-2026-000001');
    results.push(
      ok('DEC → 403 sur lookup DGES', forbidden.status === 403, `status=${forbidden.status}`),
    );
  }

  const allOk = results.every(Boolean);
  console.log(`\n══ VERDICT: ${allOk ? 'PASS' : 'FAIL'} (${results.filter(Boolean).length}/${results.length}) ══\n`);
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
