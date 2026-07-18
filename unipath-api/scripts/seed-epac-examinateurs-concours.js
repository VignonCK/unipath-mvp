/**
 * Seed / upsert examinateurs EPAC pour tests d'isolation par concours.
 * Usage: node scripts/seed-epac-examinateurs-concours.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../src/prisma');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const PASSWORD = 'password123';

const EPAC_ID = '696e24e5-ffbf-4246-bc57-9db5eff6afef';
const CONCOURS_GI = '0836d7aa-6106-48b6-bd97-7015b5cca366'; // Génie Informatique (1er)
const CONCOURS_GC = 'edda9184-3d32-4b68-a8c5-46d19a49004a'; // Génie Civil (2e)

const ACCOUNTS = [
  {
    email: 'forsuree15@gmail.com',
    nom: 'EPAC',
    prenom: 'ExaminateurGI',
    sousRole: 'EXAMINATEUR',
    concoursId: CONCOURS_GI,
    keepExistingProfile: true,
  },
  {
    email: 'examinateur-epac-gc@test.com',
    nom: 'EPAC',
    prenom: 'ExaminateurGC',
    telephone: '+22997000077',
    sousRole: 'EXAMINATEUR',
    concoursId: CONCOURS_GC,
    keepExistingProfile: false,
  },
];

async function ensureAuthUser(email, password) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (!error) return data.user.id;

  const exists =
    error.message.includes('already registered') ||
    error.message.includes('already been registered');
  if (!exists) throw error;

  let page = 1;
  while (page <= 10) {
    const { data: list } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (list.users.length < 200) break;
    page += 1;
  }
  throw new Error(`Auth user introuvable: ${email}`);
}

async function main() {
  const etab = await prisma.etablissement.findUnique({ where: { id: EPAC_ID } });
  if (!etab) throw new Error('EPAC introuvable');

  for (const id of [CONCOURS_GI, CONCOURS_GC]) {
    const c = await prisma.concours.findUnique({ where: { id } });
    if (!c || c.etablissementId !== EPAC_ID) {
      throw new Error(`Concours ${id} introuvable ou hors EPAC`);
    }
  }

  console.log('\n=== Seed examinateurs EPAC par concours ===\n');

  for (const account of ACCOUNTS) {
    const userId = await ensureAuthUser(account.email, PASSWORD);
    const existing = await prisma.membreCommission.findUnique({ where: { email: account.email } });

    if (existing) {
      await prisma.membreCommission.update({
        where: { id: existing.id },
        data: {
          concoursId: account.concoursId,
          etablissementId: EPAC_ID,
          sousRole: account.sousRole,
          role: 'COMMISSION',
          ...(account.keepExistingProfile
            ? {}
            : { nom: account.nom, prenom: account.prenom, telephone: account.telephone || null }),
        },
      });
      console.log(`UPDATED ${account.email} → concours ${account.concoursId} (id=${existing.id})`);
    } else {
      await prisma.membreCommission.create({
        data: {
          id: userId,
          email: account.email,
          nom: account.nom,
          prenom: account.prenom,
          telephone: account.telephone || null,
          role: 'COMMISSION',
          sousRole: account.sousRole,
          concoursId: account.concoursId,
          etablissementId: EPAC_ID,
        },
      });
      console.log(`CREATED ${account.email} → concours ${account.concoursId} (id=${userId})`);
    }
  }

  const membres = await prisma.membreCommission.findMany({
    where: { etablissementId: EPAC_ID },
    select: {
      email: true,
      sousRole: true,
      concoursId: true,
      concours: { select: { libelle: true } },
    },
  });
  console.log('\nMembres EPAC:');
  console.log(JSON.stringify(membres, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
