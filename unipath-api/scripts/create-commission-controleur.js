// Script pour créer les comptes Commission et Contrôleur
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { supabase } = require('../src/supabase');
const prisma = require('../src/prisma');

async function createCommissionAccount() {
  console.log('\n📝 Création du compte COMMISSION...');
  
  const email = 'commission@unipath.bj';
  const password = 'Commission2024!';
  const nom = 'Commission';
  const prenom = 'Membre';
  
  try {
    // Créer le compte Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Erreur création auth:', authError.message);
      return;
    }

    // Créer l'entrée dans la table MembreCommission
    const membre = await prisma.membreCommission.create({
      data: {
        id: authData.user.id,
        email,
        nom,
        prenom,
        role: 'COMMISSION'
      }
    });

    console.log('✅ Compte COMMISSION créé avec succès!');
    console.log('   Email:', email);
    console.log('   Mot de passe:', password);
    console.log('   ID:', membre.id);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function createControleurAccount() {
  console.log('\n📝 Création du compte CONTROLEUR...');
  
  const email = 'controleur@unipath.bj';
  const password = 'Controleur2024!';
  const nom = 'Contrôleur';
  const prenom = 'Principal';
  
  try {
    // Créer le compte Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Erreur création auth:', authError.message);
      return;
    }

    // Créer l'entrée dans la table Controleur
    const controleur = await prisma.controleur.create({
      data: {
        id: authData.user.id,
        email,
        nom,
        prenom,
        role: 'CONTROLEUR'
      }
    });

    console.log('✅ Compte CONTROLEUR créé avec succès!');
    console.log('   Email:', email);
    console.log('   Mot de passe:', password);
    console.log('   ID:', controleur.id);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function main() {
  console.log('🚀 Création des comptes Commission et Contrôleur\n');
  console.log('=' .repeat(60));
  
  await createCommissionAccount();
  await createControleurAccount();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Script terminé!\n');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
