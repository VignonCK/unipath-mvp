/**
 * Test des emails avec pièces jointes PDF
 */

const emailService = require('./src/services/email.service');
const pdfService = require('./src/services/pdf.service');

async function testEmailsAvecPDF() {
  console.log('🧪 Test des emails avec PDF...\n');

  const testData = {
    candidatEmail: 'test@example.com',
    candidatNom: 'DOE',
    candidatPrenom: 'John',
    candidatMatricule: 'UAC2026001',
    candidatTelephone: '+229 97000000',
    candidatDateNaiss: '2000-01-15',
    candidatLieuNaiss: 'Cotonou',
    concours: 'Master Informatique 2025-2026',
    concoursDateDebut: '2026-01-01',
    concoursDateFin: '2026-06-30',
    concoursDescription: 'Concours d\'entrée en Master Informatique',
    numeroDossier: 'DOSS-' + Date.now(),
    dateExamen: '15 Juin 2026 à 8h00',
    lieuExamen: 'Amphithéâtre A - UAC Abomey-Calavi'
  };

  // ── TEST 1: Fiche de pré-inscription ──────────────────────
  console.log('📤 TEST 1: Email pré-inscription avec fiche PDF...\n');
  
  try {
    // Générer le PDF
    console.log('1️⃣ Génération du PDF...');
    const pdfResult = await pdfService.genererFichePreInscription({
      candidat: {
        matricule: testData.candidatMatricule,
        nom: testData.candidatNom,
        prenom: testData.candidatPrenom,
        email: testData.candidatEmail,
        telephone: testData.candidatTelephone,
        dateNaiss: testData.candidatDateNaiss,
        lieuNaiss: testData.candidatLieuNaiss
      },
      concours: {
        libelle: testData.concours,
        dateDebut: testData.concoursDateDebut,
        dateFin: testData.concoursDateFin,
        description: testData.concoursDescription
      },
      numeroDossier: testData.numeroDossier
    });
    
    console.log('✅ PDF généré:', pdfResult.fileName);
    
    // Envoyer l'email avec le PDF
    console.log('2️⃣ Envoi de l\'email avec PDF...');
    await emailService.envoyerEmailPreInscription(testData, pdfResult.filePath);
    
    console.log('✅ Email pré-inscription envoyé avec PDF !\n');
    
    // Nettoyer le PDF
    setTimeout(() => {
      pdfService.nettoyerPDF(pdfResult.filePath);
    }, 2000);
    
  } catch (error) {
    console.error('❌ ERREUR TEST 1:', error.message);
  }

  // Pause de 3 secondes
  await new Promise(resolve => setTimeout(resolve, 3000));

  // ── TEST 2: Convocation ────────────────────────────────────
  console.log('📤 TEST 2: Email validation avec convocation PDF...\n');
  
  try {
    // Générer le PDF
    console.log('1️⃣ Génération du PDF...');
    const pdfResult = await pdfService.genererConvocation({
      candidat: {
        matricule: testData.candidatMatricule,
        nom: testData.candidatNom,
        prenom: testData.candidatPrenom,
        email: testData.candidatEmail,
        telephone: testData.candidatTelephone
      },
      concours: {
        libelle: testData.concours,
        dateDebut: testData.concoursDateDebut,
        dateFin: testData.concoursDateFin,
        description: testData.concoursDescription
      }
    });
    
    console.log('✅ PDF généré:', pdfResult.fileName);
    
    // Envoyer l'email avec le PDF
    console.log('2️⃣ Envoi de l\'email avec PDF...');
    await emailService.envoyerEmailValidation(testData, pdfResult.filePath);
    
    console.log('✅ Email validation envoyé avec PDF !\n');
    
    // Nettoyer le PDF
    setTimeout(() => {
      pdfService.nettoyerPDF(pdfResult.filePath);
    }, 2000);
    
  } catch (error) {
    console.error('❌ ERREUR TEST 2:', error.message);
  }

  console.log('\n🎉 TESTS TERMINÉS !');
  console.log('📧 Vérifiez votre boîte: test@example.com');
  console.log('Vous devriez avoir reçu 2 emails avec des PDFs attachés.');
}

testEmailsAvecPDF();
