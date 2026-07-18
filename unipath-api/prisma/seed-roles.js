// prisma/seed-roles.js
// Comptes de test : Candidat, Commission, DGES (Module 2), DEC (Module 1), …
// Voir docs/DEC-VS-DGES.md — ne pas créer de compte concours en rôle DGES.

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
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

  // 2. Créer un compte DGES
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

  // 2b. Créer un compte DEC
  try {
    console.log('📝 Création du compte DEC...');
    const { data: decAuth, error: decError } = await supabase.auth.admin.createUser({
      email: 'dec@test.com',
      password: 'password123',
      email_confirm: true,
    });

    if (decError) {
      console.log('⚠️  DEC existe déjà ou erreur:', decError.message);
      // Aligner le profil Prisma (nom/prénom) même si Auth existait déjà
      try {
        const existingDec = await prisma.administrateurDEC.findUnique({ where: { email: 'dec@test.com' } });
        if (existingDec) {
          await prisma.administrateurDEC.update({
            where: { email: 'dec@test.com' },
            data: { nom: 'Mensah', prenom: 'Adjo', role: 'DEC' },
          });
          console.log('   → Profil DEC mis à jour (Adjo Mensah)\n');
        }
      } catch (e) {
        console.log('   → Impossible de mettre à jour le profil DEC:', e.message);
      }
    } else {
      await prisma.administrateurDEC.create({
        data: {
          id: decAuth.user.id,
          email: 'dec@test.com',
          nom: 'Mensah',
          prenom: 'Adjo',
          telephone: '+22997000004',
          role: 'DEC',
        },
      });
      console.log('✅ Compte DEC créé');
      console.log('   Email: dec@test.com');
      console.log('   Password: password123\n');
    }
  } catch (error) {
    console.log('⚠️  Erreur DEC:', error.message, '\n');
  }

  // 3. Commission : 2 examinateurs + 1 contrôleur (double verdict)
  const sousRoleAccounts = [
    {
      email: 'forsuree15+examinateur1@gmail.com',
      prenom: 'Examinateur',
      telephone: '+22997000004',
      sousRole: 'EXAMINATEUR',
    },
    {
      email: 'forsuree15+examinateur2@gmail.com',
      prenom: 'Examinateur2',
      telephone: '+22997000006',
      sousRole: 'EXAMINATEUR',
    },
    {
      email: 'forsuree15+controleur1@gmail.com',
      prenom: 'Controleur',
      telephone: '+22997000005',
      sousRole: 'CONTROLEUR',
    },
  ];

  for (const account of sousRoleAccounts) {
    try {
      console.log(`📝 Création du compte ${account.sousRole}...`);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: 'password123',
        email_confirm: true,
      });

      if (authError) {
        console.log(`⚠️  ${account.sousRole} existe déjà ou erreur:`, authError.message);
      } else {
        await prisma.membreCommission.create({
          data: {
            id: authData.user.id,
            email: account.email,
            nom: 'TEST',
            prenom: account.prenom,
            telephone: account.telephone,
            role: 'COMMISSION',
            sousRole: account.sousRole,
          },
        });
        console.log(`✅ Compte ${account.sousRole} créé`);
        console.log(`   Email: ${account.email}`);
        console.log('   Password: password123\n');
      }
    } catch (error) {
      console.log(`⚠️  Erreur ${account.sousRole}:`, error.message, '\n');
    }
  }

  console.log('✨ Seed terminé!\n');
  console.log('📌 Récapitulatif des comptes de test:');
  console.log('   CANDIDAT              → candidat@test.com / password123');
  console.log('   EXAMINATEUR 1         → forsuree15+examinateur1@gmail.com / password123');
  console.log('   EXAMINATEUR 2         → forsuree15+examinateur2@gmail.com / password123');
  console.log('   CONTROLEUR COMMISSION → forsuree15+controleur1@gmail.com / password123');
  console.log('   DGES                  → dges@test.com / password123');
  console.log('   DEC                   → dec@test.com / password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
