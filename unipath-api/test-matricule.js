/**
 * ✅ SCRIPT DE TEST - Système de Génération de Matricule
 * 
 * Ce script teste le système de génération de matricule unique
 * Format: {SITE}-{ANNEE}-{NUMERO}
 * Exemple: UnP-2026-000001
 */

const {
  genererMatricule,
  genererMatriculeUnique,
  matriculeExiste,
  parseMatricule,
  validerFormatMatricule,
  getSiteCode,
  getAnneeAcademique,
  SITE_CODES,
} = require('./src/utils/matricule.helper');

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function logSuccess(message) {
  log('✅', message, colors.green);
}

function logError(message) {
  log('❌', message, colors.red);
}

function logInfo(message) {
  log('ℹ️', message, colors.blue);
}

function logWarning(message) {
  log('⚠️', message, colors.yellow);
}

function logSection(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// Tests
async function runTests() {
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  logSection('🧪 TESTS DU SYSTÈME DE GÉNÉRATION DE MATRICULE');

  // Test 1: Vérifier le code du site
  totalTests++;
  logInfo('Test 1: Vérification du code du site');
  try {
    const siteCode = getSiteCode();
    if (siteCode === 'UnP' || siteCode === process.env.SITE_CODE) {
      logSuccess(`Code du site: ${siteCode}`);
      passedTests++;
    } else {
      logError(`Code du site incorrect: ${siteCode}`);
      failedTests++;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    failedTests++;
  }

  // Test 2: Vérifier l'année académique
  totalTests++;
  logInfo('Test 2: Vérification de l\'année académique');
  try {
    const annee = getAnneeAcademique();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const expectedYear = currentMonth >= 9 ? currentYear + 1 : currentYear;
    
    if (annee === expectedYear) {
      logSuccess(`Année académique: ${annee} (attendu: ${expectedYear})`);
      passedTests++;
    } else {
      logError(`Année académique incorrecte: ${annee} (attendu: ${expectedYear})`);
      failedTests++;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    failedTests++;
  }

  // Test 3: Générer un matricule
  totalTests++;
  logInfo('Test 3: Génération d\'un matricule');
  try {
    const matricule = await genererMatricule();
    if (matricule && typeof matricule === 'string') {
      logSuccess(`Matricule généré: ${matricule}`);
      passedTests++;
    } else {
      logError('Échec de la génération du matricule');
      failedTests++;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    failedTests++;
  }

  // Test 4: Valider le format du matricule
  totalTests++;
  logInfo('Test 4: Validation du format du matricule');
  try {
    const matricule = await genererMatricule();
    const isValid = validerFormatMatricule(matricule);
    
    if (isValid) {
      logSuccess(`Format valide: ${matricule}`);
      passedTests++;
    } else {
      logError(`Format invalide: ${matricule}`);
      failedTests++;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    failedTests++;
  }

  // Test 5: Parser un matricule
  totalTests++;
  logInfo('Test 5: Parsing d\'un matricule');
  try {
    const matricule = await genererMatricule();
    const parsed = parseMatricule(matricule);
    
    if (parsed.isValid && parsed.siteCode && parsed.annee && parsed.numero) {
      logSuccess(`Parsing réussi: Site=${parsed.siteCode}, Année=${parsed.annee}, Numéro=${parsed.numero}`);
      passedTests++;
    } else {
      logError(`Parsing échoué pour: ${matricule}`);
      failedTests++;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    failedTests++;
  }

  // Test 6: Générer plusieurs matricules (unicité)
  totalTests++;
  logInfo('Test 6: Génération de plusieurs matricules (unicité)');
  try {
    const matricules = [];
    for (let i = 0; i < 5; i++) {
      const matricule = await genererMatricule();
      matricules.push(matricule);
    }
    
    const unique = new Set(matricules);
    if (unique.size === matricules.length) {
      logSuccess(`5 matricules uniques générés: ${matricules.join(', ')}`);
      passedTests++;
    } else {
      logError(`Doublons détectés: ${matricules.join(', ')}`);
      failedTests++;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    failedTests++;
  }

  // Test 7: Vérifier le format avec année
  totalTests++;
  logInfo('Test 7: Vérification du format avec année');
  try {
    const matricule = await genererMatricule();
    const parts = matricule.split('-');
    
    if (parts.length >= 3 && parts[1].length === 4 && !isNaN(parts[1])) {
      logSuccess(`Format avec année correct: ${matricule}`);
      passedTests++;
    } else {
      logError(`Format avec année incorrect: ${matricule}`);
      failedTests++;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    failedTests++;
  }

  // Test 8: Vérifier le format du numéro (6 chiffres)
  totalTests++;
  logInfo('Test 8: Vérification du format du numéro (6 chiffres)');
  try {
    const matricule = await genererMatricule();
    const parts = matricule.split('-');
    const numero = parts[2];
    
    if (numero && numero.length === 6 && !isNaN(numero)) {
      logSuccess(`Numéro sur 6 chiffres: ${numero}`);
      passedTests++;
    } else {
      logError(`Numéro incorrect: ${numero} (attendu: 6 chiffres)`);
      failedTests++;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    failedTests++;
  }

  // Test 9: Valider des formats invalides
  totalTests++;
  logInfo('Test 9: Validation de formats invalides');
  try {
    const invalidFormats = [
      'UnP-2026',           // Manque le numéro
      'UnP-2026-123',       // Numéro trop court
      'UnP-2026-1234567',   // Numéro trop long
      'UnP-26-000001',      // Année trop courte
      'U-2026-000001',      // Code site trop court
      '2026-000001',        // Manque le code site
      'UnP_2026_000001',    // Mauvais séparateur
    ];
    
    let allInvalid = true;
    for (const format of invalidFormats) {
      if (validerFormatMatricule(format)) {
        logError(`Format invalide accepté: ${format}`);
        allInvalid = false;
      }
    }
    
    if (allInvalid) {
      logSuccess('Tous les formats invalides ont été rejetés');
      passedTests++;
    } else {
      logError('Certains formats invalides ont été acceptés');
      failedTests++;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    failedTests++;
  }

  // Test 10: Valider des formats valides
  totalTests++;
  logInfo('Test 10: Validation de formats valides');
  try {
    const validFormats = [
      'UnP-2026-000001',
      'UAC-2025-123456',
      'EPAC-2027-999999',
      'ENS-2024-000100',
      'UnP-2026-000001-ABCD', // Avec suffixe optionnel
    ];
    
    let allValid = true;
    for (const format of validFormats) {
      if (!validerFormatMatricule(format)) {
        logError(`Format valide rejeté: ${format}`);
        allValid = false;
      }
    }
    
    if (allValid) {
      logSuccess('Tous les formats valides ont été acceptés');
      passedTests++;
    } else {
      logError('Certains formats valides ont été rejetés');
      failedTests++;
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    failedTests++;
  }

  // Résumé
  logSection('📊 RÉSUMÉ DES TESTS');
  console.log(`Total de tests: ${totalTests}`);
  console.log(`${colors.green}✅ Tests réussis: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}❌ Tests échoués: ${failedTests}${colors.reset}`);
  console.log(`${colors.cyan}Taux de réussite: ${((passedTests / totalTests) * 100).toFixed(2)}%${colors.reset}\n`);

  if (failedTests === 0) {
    logSuccess('🎉 Tous les tests sont passés avec succès !');
    logInfo('Le système de génération de matricule est opérationnel.');
  } else {
    logError('⚠️ Certains tests ont échoué. Veuillez vérifier les erreurs ci-dessus.');
  }

  // Exemples de matricules générés
  logSection('📋 EXEMPLES DE MATRICULES GÉNÉRÉS');
  try {
    for (let i = 1; i <= 5; i++) {
      const matricule = await genererMatricule();
      const parsed = parseMatricule(matricule);
      console.log(`${i}. ${matricule} → Site: ${parsed.siteCode}, Année: ${parsed.annee}, Numéro: ${parsed.numero}`);
    }
  } catch (error) {
    logError(`Erreur lors de la génération d'exemples: ${error.message}`);
  }

  console.log('');
}

// Exécuter les tests
runTests()
  .then(() => {
    console.log('✅ Tests terminés\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de l\'exécution des tests:', error);
    process.exit(1);
  });
