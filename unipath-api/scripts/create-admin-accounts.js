/**
 * Script pour créer les comptes administrateurs (Commission et DGES)
 * Usage: node scripts/create-admin-accounts.js
 */

require('dotenv').config();
const { supabase } = require('../src/supabase');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Credentials pré-définis pour les comptes administrateurs
const ADMIN_ACCOUNTS = [
  {
    type: 'COMMISSION',
    email: 'commission@epac.bj',
    password: 'Commission2026!',
    nom: 'Commission',
    prenom: 'EPAC',
    telephone: '+22997000001',
  },
  {
    type: 'DGES',
    email: 'dges@mesrs.bj',
    password: 'DGES2026!',
    nom: 'DGES',
    prenom: 'MESRS',
    telephone: '+22997000002',
  },
];

async function createAdminAccounts() {
  console.log('🔧 Création des comptes administrateurs...\n');

  for (const account of ADMIN_ACCOUNTS) {
    try {
      console.log(`📝 Création du compte ${account.type}...`);
      console.log(`   Email: ${account.email}`);
      console.log(`   Mot de passe: ${account.password}`);

      // 1. Créer le compte Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // Confirmer l'email automatiquement
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`   ⚠️  Compte déjà existant, passage au suivant...\n`);
          continue;
        }
        throw authError;
      }

      // 2. Créer l'entrée dans la table appropriée
      if (account.type === 'COMMISSION') {
        await prisma.membreCommission.create({
          data: {
            id: authData.user.id,
            email: account.email,
            nom: account.nom,
            prenom: account.prenom,
            telephone: account.telephone,
            role: 'COMMISSION',
          },
        });
      } else if (account.type === 'DGES') {
        await prisma.administrateurDGES.create({
          data: {
            id: authData.user.id,
            email: account.email,
            nom: account.nom,
            prenom: account.prenom,
            telephone: account.telephone,
            role: 'DGES',
          },
        });
      }

      console.log(`   ✅ Compte ${account.type} créé avec succès\n`);
    } catch (error) {
      console.error(`   ❌ Erreur lors de la création du compte ${account.type}:`, error.message);
      console.log('');
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Création des comptes terminée !');
  console.log('');
  console.log('📋 CREDENTIALS À CONSERVER :');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  ADMIN_ACCOUNTS.forEach((account) => {
    console.log(`\n${account.type}:`);
    console.log(`  Email    : ${account.email}`);
    console.log(`  Password : ${account.password}`);
  });
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  IMPORTANT : Changez ces mots de passe en production !');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
  process.exit(0);
}

// Exécuter le script
createAdminAccounts().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
