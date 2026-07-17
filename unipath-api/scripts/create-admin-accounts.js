/**
 * Script pour créer les comptes administrateurs (Commission et DGES)
 * Usage: npm run create-admins
 */

require('dotenv').config();
const crypto = require('crypto');
const authService = require('../src/services/auth.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
  {
    type: 'DEC',
    email: 'dec@mesrs.bj',
    password: 'DEC2026!',
    nom: 'DEC',
    prenom: 'MESRS',
    telephone: '+22997000008',
  },
];

async function createAdminAccounts() {
  console.log('🔧 Création des comptes administrateurs...\n');

  for (const account of ADMIN_ACCOUNTS) {
    try {
      console.log(`📝 Création du compte ${account.type}...`);
      console.log(`   Email: ${account.email}`);

      const existing = await authService.findCompteByEmail(account.email);
      if (existing) {
        console.log('   ⚠️  Compte déjà existant, passage au suivant...\n');
        continue;
      }

      const profileId = crypto.randomUUID();

      if (account.type === 'COMMISSION') {
        await prisma.membreCommission.create({
          data: {
            id: profileId,
            email: account.email,
            nom: account.nom,
            prenom: account.prenom,
            telephone: account.telephone,
            role: 'COMMISSION',
            sousRole: 'MEMBRE',
          },
        });
      } else if (account.type === 'DGES') {
        await prisma.administrateurDGES.create({
          data: {
            id: profileId,
            email: account.email,
            nom: account.nom,
            prenom: account.prenom,
            telephone: account.telephone,
            role: 'DGES',
          },
        });
      } else if (account.type === 'DEC') {
        await prisma.administrateurDEC.create({
          data: {
            id: profileId,
            email: account.email,
            nom: account.nom,
            prenom: account.prenom,
            telephone: account.telephone,
            role: 'DEC',
          },
        });
      }

      await authService.createCompte({
        email: account.email,
        password: account.password,
        profilType: account.type,
        profilId: profileId,
        emailConfirme: true,
      });

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
  ADMIN_ACCOUNTS.forEach((account) => {
    console.log(`\n${account.type}:`);
    console.log(`  Email    : ${account.email}`);
    console.log(`  Password : ${account.password}`);
  });
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
  process.exit(0);
}

createAdminAccounts().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
