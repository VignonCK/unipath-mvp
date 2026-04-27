// diagnostic.js
// Script pour vérifier que tout est bien configuré

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();

async function diagnostic() {
  console.log('🔍 Diagnostic du système UniPath\n');

  // 1. Vérifier les variables d'environnement
  console.log('📋 Variables d\'environnement:');
  console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
  console.log('   SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅' : '❌');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅' : '❌');
  console.log('   PORT:', process.env.PORT || '3001', '\n');

  // 2. Vérifier la connexion à la base de données
  try {
    console.log('🗄️  Test de connexion à la base de données...');
    await prisma.$connect();
    console.log('   ✅ Connexion réussie\n');
  } catch (error) {
    console.log('   ❌ Erreur de connexion:', error.message, '\n');
    return;
  }

  // 3. Vérifier les comptes de test
  console.log('👥 Comptes de test:');
  
  try {
    const candidat = await prisma.candidat.findUnique({
      where: { email: 'candidat@test.com' },
      select: { email: true, role: true, nom: true, prenom: true },
    });
    console.log('   CANDIDAT:', candidat ? '✅ ' + candidat.email : '❌ Non trouvé');
  } catch (error) {
    console.log('   CANDIDAT: ❌ Erreur -', error.message);
  }

  try {
    const commission = await prisma.membreCommission.findUnique({
      where: { email: 'commission@test.com' },
      select: { email: true, role: true, nom: true, prenom: true },
    });
    console.log('   COMMISSION:', commission ? '✅ ' + commission.email : '❌ Non trouvé');
  } catch (error) {
    console.log('   COMMISSION: ❌ Erreur -', error.message);
  }

  try {
    const dges = await prisma.administrateurDGES.findUnique({
      where: { email: 'dges@test.com' },
      select: { email: true, role: true, nom: true, prenom: true },
    });
    console.log('   DGES:', dges ? '✅ ' + dges.email : '❌ Non trouvé');
  } catch (error) {
    console.log('   DGES: ❌ Erreur -', error.message);
  }

  console.log('\n');

  // 4. Vérifier les tables
  console.log('📊 Tables de la base de données:');
  try {
    const candidats = await prisma.candidat.count();
    console.log('   Candidat:', candidats, 'enregistrement(s)');
    
    const commissions = await prisma.membreCommission.count();
    console.log('   MembreCommission:', commissions, 'enregistrement(s)');
    
    const dgesCount = await prisma.administrateurDGES.count();
    console.log('   AdministrateurDGES:', dgesCount, 'enregistrement(s)');
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
  }

  console.log('\n✨ Diagnostic terminé!\n');

  // 5. Recommandations
  console.log('💡 Recommandations:');
  const candidat = await prisma.candidat.findUnique({ where: { email: 'candidat@test.com' } });
  const commission = await prisma.membreCommission.findUnique({ where: { email: 'commission@test.com' } });
  const dges = await prisma.administrateurDGES.findUnique({ where: { email: 'dges@test.com' } });

  if (!candidat || !commission || !dges) {
    console.log('   ⚠️  Certains comptes de test sont manquants');
    console.log('   → Exécuter: node prisma/seed-roles.js\n');
  } else {
    console.log('   ✅ Tous les comptes de test sont présents');
    console.log('   → Tu peux tester le système!\n');
  }
}

diagnostic()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
