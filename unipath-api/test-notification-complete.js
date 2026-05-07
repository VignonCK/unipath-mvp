/**
 * Test COMPLET - Notification in-app + Email
 */

const { PrismaClient } = require('@prisma/client');
const notificationService = require('./src/services/notification.service');

const prisma = new PrismaClient();

async function testNotificationComplete() {
  console.log('🧪 Test COMPLET - Notification + Email...\n');

  try {
    // Récupérer ou créer un candidat test
    let candidat = await prisma.candidat.findUnique({
      where: { email: 'test@example.com' }
    });

    if (!candidat) {
      console.log('📝 Création d\'un candidat test...');
      candidat = await prisma.candidat.create({
        data: {
          nom: 'DOE',
          prenom: 'John',
          email: 'test@example.com',
          telephone: '+229 97000000',
          role: 'CANDIDAT'
        }
      });
      console.log('✅ Candidat créé:', candidat.id);
    } else {
      console.log('✅ Candidat trouvé:', candidat.id);
    }

    // Données de test pour une pré-inscription
    const testData = {
      candidatEmail: candidat.email,
      candidatNom: candidat.nom,
      candidatPrenom: candidat.prenom,
      concours: 'Master Informatique 2025-2026',
      numeroDossier: 'TEST-' + Date.now()
    };

    console.log('\n📤 Envoi notification PRE_INSCRIPTION...');
    console.log('Données:', testData);

    const result = await notificationService.sendNotification({
      event: 'PRE_INSCRIPTION',
      userId: candidat.id,
      data: testData,
      priority: 'HIGH',
      sendEmail: true
    });

    console.log('\n✅ NOTIFICATION ENVOYÉE AVEC SUCCÈS !');
    console.log('ID Notification:', result.notificationId);
    console.log('Canaux utilisés:', result.channels);
    console.log('\n📧 Vérifiez votre boîte email: test@example.com');
    console.log('💬 Vérifiez la base de données pour la notification in-app');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('Détails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationComplete();
