/**
 * Crée (ou répare) le compte de test DEC.
 * Usage: node scripts/seed-dec-test-account.js
 *
 * Email    : dec@test.com
 * Password : password123
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const EMAIL = 'dec@test.com';
const PASSWORD = 'password123';

async function findAuthUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const found = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  console.log('🌱 Seed compte DEC de test...\n');

  let authUser = null;

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });

  if (createError) {
    console.log('⚠️  Création Auth:', createError.message);
    authUser = await findAuthUserByEmail(EMAIL);
    if (!authUser) {
      throw new Error(`Impossible de trouver ou créer l'utilisateur Auth ${EMAIL}`);
    }
    console.log(`   → Auth existant réutilisé (id=${authUser.id})`);
    const { error: pwdError } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: PASSWORD,
      email_confirm: true,
    });
    if (pwdError) throw pwdError;
    console.log('   → Mot de passe réaligné sur password123');
  } else {
    authUser = created.user;
    console.log(`✅ Auth créé (id=${authUser.id})`);
  }

  const existing = await prisma.administrateurDEC.findUnique({
    where: { id: authUser.id },
  });

  if (existing) {
    console.log('✅ Profil AdministrateurDEC déjà présent');
  } else {
    const byEmail = await prisma.administrateurDEC.findUnique({
      where: { email: EMAIL },
    });
    if (byEmail && byEmail.id !== authUser.id) {
      throw new Error(
        `Conflit: AdministrateurDEC email=${EMAIL} existe avec id=${byEmail.id}, Auth id=${authUser.id}`
      );
    }
    await prisma.administrateurDEC.create({
      data: {
        id: authUser.id,
        email: EMAIL,
        nom: 'TEST',
        prenom: 'DEC',
        telephone: '+22997000004',
        role: 'DEC',
      },
    });
    console.log('✅ Profil AdministrateurDEC créé');
  }

  console.log('\n📌 Compte DEC prêt:');
  console.log(`   Email    : ${EMAIL}`);
  console.log(`   Password : ${PASSWORD}`);
  console.log(`   Role     : DEC`);
  console.log(`   Auth id  : ${authUser.id}\n`);
}

main()
  .catch((e) => {
    console.error('❌', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
