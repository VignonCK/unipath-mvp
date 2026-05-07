/**
 * Test de tous les types d'emails - SANS base de données
 */

const emailService = require('./src/services/email.service');

async function testTousLesEmails() {
  console.log('🧪 Test de TOUS les types d\'emails...\n');

  const testData = {
    candidatEmail: 'test@example.com',
    candidatNom: 'DOE',
    candidatPrenom: 'John',
    concours: 'Master Informatique 2025-2026',
    numeroDossier: 'TEST-' + Date.now(),
    dateExamen: '15 Juin 2026 à 8h00',
    lieuExamen: 'Amphithéâtre A - UAC Abomey-Calavi',
    motif: 'Dossier incomplet - Relevé de notes manquant'
  };

  const tests = [
    {
      nom: '1️⃣ PRÉ-INSCRIPTION',
      methode: 'envoyerEmailPreInscription',
      data: testData
    },
    {
      nom: '2️⃣ VALIDATION/CONVOCATION',
      methode: 'envoyerEmailValidation',
      data: testData
    },
    {
      nom: '3️⃣ REJET',
      methode: 'envoyerEmailRejet',
      data: testData
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n📤 ${test.nom}...`);
      await emailService[test.methode](test.data);
      console.log(`✅ ${test.nom} - Envoyé avec succès !`);
      
      // Pause de 2 secondes entre chaque email
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ ${test.nom} - ERREUR:`, error.message);
    }
  }

  console.log('\n\n🎉 TEST TERMINÉ !');
  console.log('📧 Vérifiez votre boîte: test@example.com');
  console.log('Vous devriez avoir reçu 3 emails différents.');
}

testTousLesEmails();
