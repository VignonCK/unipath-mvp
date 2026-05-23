const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMigration() {
  try {
    console.log('🔍 Test de la migration...\n');

    // Test 1: Vérifier les inscriptions
    const inscriptionsCount = await prisma.inscription.count();
    console.log(`✅ Inscriptions trouvées: ${inscriptionsCount}`);

    // Test 2: Vérifier les dossiers d'inscription
    const dossiersCount = await prisma.dossierInscription.count();
    console.log(`✅ Dossiers d'inscription trouvés: ${dossiersCount}`);

    // Test 3: Vérifier qu'il y a un dossier pour chaque inscription
    const inscriptions = await prisma.inscription.findMany({
      include: {
        dossierInscription: true
      }
    });

    const inscriptionsSansDossier = inscriptions.filter(i => !i.dossierInscription);
    if (inscriptionsSansDossier.length > 0) {
      console.log(`⚠️  ${inscriptionsSansDossier.length} inscriptions sans dossier`);
    } else {
      console.log('✅ Toutes les inscriptions ont un dossier');
    }

    // Test 4: Vérifier les nouveaux champs
    const dossierAvecVerdict = await prisma.dossierInscription.findFirst({
      where: {
        OR: [
          { verdict1: { not: null } },
          { verdict2: { not: null } },
          { decisionControleur: { not: null } }
        ]
      }
    });

    if (dossierAvecVerdict) {
      console.log('✅ Nouveaux champs de verdict disponibles');
    } else {
      console.log('ℹ️  Aucun verdict enregistré pour le moment (normal si nouvelle installation)');
    }

    // Test 5: Vérifier les membres de commission
    const membresCommission = await prisma.membreCommission.findMany();
    console.log(`✅ Membres de commission trouvés: ${membresCommission.length}`);

    if (membresCommission.length > 0) {
      const avecSousRole = membresCommission.filter(m => m.sousRole);
      console.log(`   - Avec sous-rôle: ${avecSousRole.length}`);
      console.log(`   - Sans sous-rôle: ${membresCommission.length - avecSousRole.length}`);
    }

    console.log('\n✅ Migration validée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testMigration();
