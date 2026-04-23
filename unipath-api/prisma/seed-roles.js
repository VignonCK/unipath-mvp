// prisma/seed-roles.js
// Script pour créer des comptes de test pour chaque rôle

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🌱 Création des comptes de test...\n');

  // 1. Créer un compte CANDIDAT
  try {
    console.log('📝 Création du compte CANDIDAT...');
    const { data: candidatAuth, error: candidatError } = await supabase.auth.admin.createUser({
      email: 'candidat@test.com',
      password: 'password123',
      email_confirm: true,
    });

    if (candidatError) {
      console.log('⚠️  Candidat existe déjà ou erreur:', candidatError.message);
    } else {
      await prisma.candidat.create({
        data: {
          id: candidatAuth.user.id,
          email: 'candidat@test.com',
          nom: 'TEST',
          prenom: 'Candidat',
          telephone: '+22997000001',
          matricule: 'TEMP',
          role: 'CANDIDAT',
        },
      });
      console.log('✅ Compte CANDIDAT créé');
      console.log('   Email: candidat@test.com');
      console.log('   Password: password123\n');
    }
  } catch (error) {
    console.log('⚠️  Erreur candidat:', error.message, '\n');
  }

  // 2. Créer un compte COMMISSION
  try {
    console.log('📝 Création du compte COMMISSION...');
    const { data: commissionAuth, error: commissionError } = await supabase.auth.admin.createUser({
      email: 'commission@test.com',
      password: 'password123',
      email_confirm: true,
    });

    if (commissionError) {
      console.log('⚠️  Commission existe déjà ou erreur:', commissionError.message);
    } else {
      await prisma.membreCommission.create({
        data: {
          id: commissionAuth.user.id,
          email: 'commission@test.com',
          nom: 'TEST',
          prenom: 'Commission',
          telephone: '+22997000002',
          role: 'COMMISSION',
        },
      });
      console.log('✅ Compte COMMISSION créé');
      console.log('   Email: commission@test.com');
      console.log('   Password: password123\n');
    }
  } catch (error) {
    console.log('⚠️  Erreur commission:', error.message, '\n');
  }

  // 3. Créer un compte DGES
  try {
    console.log('📝 Création du compte DGES...');
    const { data: dgesAuth, error: dgesError } = await supabase.auth.admin.createUser({
      email: 'dges@test.com',
      password: 'password123',
      email_confirm: true,
    });

    if (dgesError) {
      console.log('⚠️  DGES existe déjà ou erreur:', dgesError.message);
    } else {
      await prisma.administrateurDGES.create({
        data: {
          id: dgesAuth.user.id,
          email: 'dges@test.com',
          nom: 'TEST',
          prenom: 'DGES',
          telephone: '+22997000003',
          role: 'DGES',
        },
      });
      console.log('✅ Compte DGES créé');
      console.log('   Email: dges@test.com');
      console.log('   Password: password123\n');
    }
  } catch (error) {
    console.log('⚠️  Erreur DGES:', error.message, '\n');
  }

  console.log('✨ Seed terminé!\n');
  console.log('📌 Récapitulatif des comptes de test:');
  console.log('   CANDIDAT    → candidat@test.com / password123');
  console.log('   COMMISSION  → commission@test.com / password123');
  console.log('   DGES        → dges@test.com / password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
