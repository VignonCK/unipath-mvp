/**
 * Vérification post-migration emails commission forsuree15+
 * Usage: node scripts/verify-commission-emails-forsuree15.js
 */
require('dotenv').config();
const prisma = require('../src/prisma');

const BASE = process.env.API_URL || 'http://localhost:3001/api';
const PWD = 'password123';

const EXPECTED = [
  {
    email: 'forsuree15+examinateur1@gmail.com',
    id: 'adad5263-20b1-4f82-8650-e2011ed199ab',
    concoursId: null,
  },
  {
    email: 'forsuree15+examinateur2@gmail.com',
    id: '20a05243-32ba-41d2-b61f-635df62e2173',
    concoursId: null,
  },
  {
    email: 'forsuree15+controleur1@gmail.com',
    id: '754671cd-2b76-4ccb-a0bb-690adcf34443',
    concoursId: 'edda9184-3d32-4b68-a8c5-46d19a49004a',
  },
  {
    email: 'forsuree15+commission@gmail.com',
    id: '7473d8ad-77a6-4ef9-8adc-f2c8d4dd52ef',
    concoursId: null,
  },
  {
    email: 'forsuree15+examinateur-epac-gc@gmail.com',
    id: '8d6500d9-8890-4a48-9fb4-8d0642dcb1ab',
    concoursId: 'edda9184-3d32-4b68-a8c5-46d19a49004a',
  },
];

const OLD = [
  'examinateur@test.com',
  'examinateur2@test.com',
  'controleur-commission@test.com',
  'commission@test.com',
  'examinateur-epac-gc@test.com',
];

const PROTECTED = {
  email: 'forsuree15@gmail.com',
  id: '6a2e2a2f-b49e-4dc1-b8e3-3e26fa46eedc',
  concoursId: '0836d7aa-6106-48b6-bd97-7015b5cca366',
};

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
  return { status: res.status, token: body?.token, role: body?.user?.role || body?.role, body };
}

async function main() {
  const results = [];

  console.log('\n=== 1. Logins ===\n');
  for (const row of EXPECTED) {
    const l = await login(row.email, PWD);
    results.push(ok(
      `Login ${row.email}`,
      l.status === 200 && Boolean(l.token),
      `status=${l.status} role=${l.role || l.body?.user?.role}`,
    ));
  }

  console.log('\n=== 2. Pas de doublons / anciens emails absents ===\n');
  for (const email of EXPECTED.map((e) => e.email)) {
    const n = await prisma.membreCommission.count({ where: { email } });
    results.push(ok(`Un seul Prisma pour ${email}`, n === 1, `count=${n}`));
  }
  for (const email of OLD) {
    const n = await prisma.membreCommission.count({ where: { email } });
    results.push(ok(`Ancien email absent ${email}`, n === 0, `count=${n}`));
  }

  console.log('\n=== 3. Scope concoursId intact ===\n');
  for (const row of EXPECTED) {
    const m = await prisma.membreCommission.findUnique({
      where: { id: row.id },
      select: { id: true, email: true, concoursId: true, sousRole: true },
    });
    results.push(ok(
      `Scope ${row.email}`,
      m?.email === row.email && m?.concoursId === row.concoursId,
      `email=${m?.email} concoursId=${m?.concoursId} expected=${row.concoursId}`,
    ));
  }

  console.log('\n=== 4. forsuree15@gmail.com intact ===\n');
  const prot = await prisma.membreCommission.findUnique({
    where: { id: PROTECTED.id },
    select: { email: true, concoursId: true, sousRole: true },
  });
  results.push(ok(
    'forsuree15@gmail.com inchangé',
    prot?.email === PROTECTED.email && prot?.concoursId === PROTECTED.concoursId,
    `email=${prot?.email} concoursId=${prot?.concoursId}`,
  ));

  const passed = results.filter(Boolean).length;
  console.log(`\n=== Verify: ${passed}/${results.length} ===`);
  process.exit(passed === results.length ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
