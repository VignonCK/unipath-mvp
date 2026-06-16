/**
 * Crée les comptes de test Examinateur et Contrôleur commission (double verdict).
 * Usage: node scripts/create-commission-sous-roles.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const COMMISSION_SOUS_ROLE_ACCOUNTS = [
  {
    email: 'examinateur@test.com',
    password: 'password123',
    nom: 'TEST',
    prenom: 'Examinateur',
    telephone: '+22997000004',
    sousRole: 'EXAMINATEUR',
    redirect: '/examinateur/dossiers',
  },
  {
    email: 'examinateur2@test.com',
    password: 'password123',
    nom: 'TEST',
    prenom: 'Examinateur2',
    telephone: '+22997000006',
    sousRole: 'EXAMINATEUR',
    redirect: '/examinateur/dossiers',
  },
  {
    email: 'controleur-commission@test.com',
    password: 'password123',
    nom: 'TEST',
    prenom: 'Controleur',
    telephone: '+22997000005',
    sousRole: 'CONTROLEUR',
    redirect: '/controleur-commission/tableau-de-bord',
  },
];

async function ensureCommissionAccount(account) {
  console.log(`\n📝 Compte ${account.sousRole} (${account.email})...`);

  let userId = null;

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
  });

  if (authError) {
    const dejaExistant =
      authError.message.includes('already registered') ||
      authError.message.includes('already been registered');
    if (!dejaExistant) {
      throw authError;
    }
    console.log('   ⚠️  Auth existant, recherche de l\'utilisateur...');
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    const existing = listData.users.find((u) => u.email === account.email);
    if (!existing) {
      throw new Error(`Utilisateur ${account.email} introuvable dans Supabase Auth`);
    }
    userId = existing.id;
  } else {
    userId = authData.user.id;
    console.log('   ✅ Compte Supabase Auth créé');
  }

  const existingMembre = await prisma.membreCommission.findUnique({
    where: { email: account.email },
  });

  if (existingMembre) {
    if (existingMembre.sousRole !== account.sousRole) {
      await prisma.membreCommission.update({
        where: { id: existingMembre.id },
        data: { sousRole: account.sousRole },
      });
      console.log(`   ✅ sousRole mis à jour → ${account.sousRole}`);
    } else {
      console.log('   ✅ Déjà présent dans MembreCommission');
    }
    return;
  }

  await prisma.membreCommission.create({
    data: {
      id: userId,
      email: account.email,
      nom: account.nom,
      prenom: account.prenom,
      telephone: account.telephone,
      role: 'COMMISSION',
      sousRole: account.sousRole,
    },
  });

  console.log(`   ✅ MembreCommission créé (sousRole: ${account.sousRole})`);
}

async function fixLegacyCommissionAccount() {
  const legacy = await prisma.membreCommission.findUnique({
    where: { email: 'commission@test.com' },
  });

  if (legacy && !legacy.sousRole) {
    await prisma.membreCommission.update({
      where: { id: legacy.id },
      data: { sousRole: 'EXAMINATEUR' },
    });
    console.log('\n🔧 commission@test.com : sousRole EXAMINATEUR appliqué');
  }
}

async function main() {
  console.log('🚀 Création des comptes commission (Examinateur / Contrôleur)\n');
  console.log('='.repeat(60));

  for (const account of COMMISSION_SOUS_ROLE_ACCOUNTS) {
    try {
      await ensureCommissionAccount(account);
    } catch (error) {
      console.error(`   ❌ Erreur: ${error.message}`);
    }
  }

  try {
    await fixLegacyCommissionAccount();
  } catch (error) {
    console.error(`❌ Erreur correction legacy: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📌 Comptes de test commission (double verdict):\n');
  COMMISSION_SOUS_ROLE_ACCOUNTS.forEach((account) => {
    console.log(`   ${account.sousRole.padEnd(12)} → ${account.email} / ${account.password}`);
    console.log(`   ${''.padEnd(12)}   Redirection: ${account.redirect}\n`);
  });
  console.log('   Pack complet: node prisma/seed-roles.js');
  console.log('='.repeat(60));
}

main()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
