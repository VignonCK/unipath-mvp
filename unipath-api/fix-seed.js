// fix-seed.js
// Script pour créer les enregistrements Prisma pour les comptes Supabase existants

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixSeed() {
  console.log('🔧 Correction des comptes de test...\n');

  // 1. Récupérer les utilisateurs Supabase
  const { data: users, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Erreur récupération users:', error.message);
    return;
  }

  console.log(`📋 ${users.users.length} utilisateur(s) trouvé(s) dans Supabase Auth\n`);

  // 2. Créer les enregistrements Prisma
  for (const user of users.users) {
    const email = user.email;
    
    if (email === 'candidat@test.com') {
      try {
        // Vérifier si existe déjà
        const existing = await prisma.candidat.findUnique({ where: { email } });
        
        if (existing) {
          console.log('✅ CANDIDAT existe déjà:', email);
        } else {
          await prisma.candidat.create({
            data: {
              id: user.id,
              email: email,
              nom: 'TEST',
              prenom: 'Candidat',
              telephone: '+22997000001',
              matricule: `UAC-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
              role: 'CANDIDAT',
            },
          });
          console.log('✅ CANDIDAT créé:', email);
        }
      } catch (error) {
        console.log('⚠️  Erreur CANDIDAT:', error.message);
      }
    }
    
    if (email === 'commission@test.com') {
      try {
        const existing = await prisma.membreCommission.findUnique({ where: { email } });
        
        if (existing) {
          console.log('✅ COMMISSION existe déjà:', email);
        } else {
          await prisma.membreCommission.create({
            data: {
              id: user.id,
              email: email,
              nom: 'TEST',
              prenom: 'Commission',
              telephone: '+22997000002',
              role: 'COMMISSION',
              sousRole: 'MEMBRE',
            },
          });
          console.log('✅ COMMISSION créé:', email);
        }
      } catch (error) {
        console.log('⚠️  Erreur COMMISSION:', error.message);
      }
    }
    
    if (email === 'dges@test.com') {
      try {
        const existing = await prisma.administrateurDGES.findUnique({ where: { email } });
        
        if (existing) {
          console.log('✅ DGES existe déjà:', email);
        } else {
          await prisma.administrateurDGES.create({
            data: {
              id: user.id,
              email: email,
              nom: 'TEST',
              prenom: 'DGES',
              telephone: '+22997000003',
              role: 'DGES',
            },
          });
          console.log('✅ DGES créé:', email);
        }
      } catch (error) {
        console.log('⚠️  Erreur DGES:', error.message);
      }
    }

    // Module 1 — DEC (ne pas créer en tant que DGES)
    if (email === 'dec@test.com') {
      try {
        const existing = await prisma.administrateurDEC.findUnique({ where: { email } });

        if (existing) {
          await prisma.administrateurDEC.update({
            where: { email },
            data: { nom: 'Mensah', prenom: 'Adjo', role: 'DEC' },
          });
          console.log('✅ DEC mis à jour:', email);
        } else {
          await prisma.administrateurDEC.create({
            data: {
              id: user.id,
              email: email,
              nom: 'Mensah',
              prenom: 'Adjo',
              telephone: '+22997000004',
              role: 'DEC',
            },
          });
          console.log('✅ DEC créé:', email);
        }
      } catch (error) {
        console.log('⚠️  Erreur DEC:', error.message);
      }
    }
  }

  console.log('\n✨ Correction terminée!\n');
  console.log('📌 Comptes de test:');
  console.log('   CANDIDAT    → candidat@test.com / password123');
  console.log('   COMMISSION  → commission@test.com / password123');
  console.log('   DGES (M2)   → dges@test.com / password123');
  console.log('   DEC (M1)   → dec@test.com / password123\n');
  console.log('   Voir docs/DEC-VS-DGES.md\n');
}

fixSeed()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
