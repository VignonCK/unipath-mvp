// prisma/seed-roles.js — Comptes de test (auth locale)
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const authService = require('../src/services/auth.service');
require('dotenv').config();

const prisma = new PrismaClient();

async function createTestAccount({ email, password, profilType, createProfile }) {
  const existing = await authService.findCompteByEmail(email);
  if (existing) {
    console.log(`⚠️  ${email} existe déjà, ignoré`);
    return;
  }

  const profileId = crypto.randomUUID();
  await createProfile(profileId);
  await authService.createCompte({
    email,
    password,
    profilType,
    profilId: profileId,
    emailConfirme: true,
  });
  console.log(`✅ ${email} / ${password}`);
}

async function main() {
  console.log('🌱 Création des comptes de test...\n');

  await createTestAccount({
    email: 'candidat@test.com',
    password: 'password123',
    profilType: 'CANDIDAT',
    createProfile: (id) =>
      prisma.candidat.create({
        data: {
          id,
          email: 'candidat@test.com',
          nom: 'TEST',
          prenom: 'Candidat',
          telephone: '+22997000001',
          matricule: `TEST-${Date.now()}`,
          role: 'CANDIDAT',
          emailConfirme: true,
        },
      }),
  });

  await createTestAccount({
    email: 'dges@test.com',
    password: 'password123',
    profilType: 'DGES',
    createProfile: (id) =>
      prisma.administrateurDGES.create({
        data: {
          id,
          email: 'dges@test.com',
          nom: 'TEST',
          prenom: 'DGES',
          telephone: '+22997000003',
          role: 'DGES',
        },
      }),
  });

  const commissionAccounts = [
    { email: 'examinateur@test.com', prenom: 'Examinateur', telephone: '+22997000004', sousRole: 'EXAMINATEUR' },
    { email: 'examinateur2@test.com', prenom: 'Examinateur2', telephone: '+22997000006', sousRole: 'EXAMINATEUR' },
    { email: 'controleur-commission@test.com', prenom: 'Controleur', telephone: '+22997000005', sousRole: 'CONTROLEUR' },
  ];

  for (const account of commissionAccounts) {
    await createTestAccount({
      email: account.email,
      password: 'password123',
      profilType: 'COMMISSION',
      createProfile: (id) =>
        prisma.membreCommission.create({
          data: {
            id,
            email: account.email,
            nom: 'TEST',
            prenom: account.prenom,
            telephone: account.telephone,
            role: 'COMMISSION',
            sousRole: account.sousRole,
          },
        }),
    });
  }

  console.log('\n✨ Seed terminé!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
