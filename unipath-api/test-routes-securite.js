/**
 * Script de test pour valider les corrections de sécurité des routes
 * 
 * Ce script vérifie que toutes les routes sont correctement protégées
 * et que les rôles sont correctement assignés.
 * 
 * Usage: node test-routes-securite.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification des corrections de sécurité des routes...\n');

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(description, condition) {
  totalTests++;
  if (condition) {
    console.log(`${colors.green}✅${colors.reset} ${description}`);
    passedTests++;
    return true;
  } else {
    console.log(`${colors.red}❌${colors.reset} ${description}`);
    failedTests++;
    return false;
  }
}

function readRouteFile(filename) {
  const filePath = path.join(__dirname, 'src', 'routes', filename);
  return fs.readFileSync(filePath, 'utf8');
}

// ========================================
// Tests de sécurité - Routes Notifications
// ========================================
console.log(`${colors.blue}📧 Tests Routes Notifications${colors.reset}`);
const notificationsRoutes = readRouteFile('notifications.routes.js');

test(
  'Routes POST notifications protégées avec checkRole',
  notificationsRoutes.includes("router.post('/', protect, checkRole(['COMMISSION', 'CONTROLEUR', 'DGES'])") &&
  notificationsRoutes.includes("router.post('/pre-inscription', protect, checkRole(['COMMISSION', 'CONTROLEUR', 'DGES'])")
);

test(
  'Routes GET/PATCH notifications délèguent au contrôleur',
  notificationsRoutes.includes('notificationController.getUnreadCount') &&
  notificationsRoutes.includes('notificationController.markAllAsRead') &&
  notificationsRoutes.includes('notificationController.getNotifications') &&
  notificationsRoutes.includes('notificationController.markAsRead')
);

test(
  'Pas de logique inline dans notifications.routes.js',
  !notificationsRoutes.includes('await notificationService.getUnreadCount(req.user.id)')
);

// ========================================
// Tests de sécurité - Routes Concours
// ========================================
console.log(`\n${colors.blue}🎓 Tests Routes Concours${colors.reset}`);
const concoursRoutes = readRouteFile('concours.routes.js');

test(
  'Route GET / utilise protectOptional',
  concoursRoutes.includes("router.get('/', protectOptional, concoursController.getAllConcours)")
);

test(
  'Route GET /:id utilise protectOptional',
  concoursRoutes.includes("router.get('/:id', protectOptional, concoursController.getConcoursById)")
);

test(
  'Route GET /:id/classement protégée avec checkRole',
  concoursRoutes.includes("router.get('/:id/classement', protect, checkRole(['COMMISSION', 'DGES', 'CONTROLEUR'])")
);

// ========================================
// Tests de sécurité - Routes Inscription
// ========================================
console.log(`\n${colors.blue}📝 Tests Routes Inscription${colors.reset}`);
const inscriptionRoutes = readRouteFile('inscription.routes.js');

test(
  'Route POST / réservée aux CANDIDAT',
  inscriptionRoutes.includes("router.post('/', protect, checkRole(['CANDIDAT'])")
);

test(
  'Route POST quittance réservée aux CANDIDAT',
  inscriptionRoutes.includes("router.post('/:inscriptionId/quittance', protect, checkRole(['CANDIDAT'])")
);

test(
  'Route PUT pieces-extras réservée aux CANDIDAT',
  inscriptionRoutes.includes("router.put('/:inscriptionId/pieces-extras', protect, checkRole(['CANDIDAT'])")
);

test(
  'Route DELETE réservée aux CANDIDAT',
  inscriptionRoutes.includes("router.delete('/:inscriptionId', protect, checkRole(['CANDIDAT'])")
);

// ========================================
// Tests de sécurité - Routes Dossier
// ========================================
console.log(`\n${colors.blue}📁 Tests Routes Dossier${colors.reset}`);
const dossierRoutes = readRouteFile('dossier.routes.js');

test(
  'Route POST /upload réservée aux CANDIDAT',
  dossierRoutes.includes("router.post('/upload', protect, checkRole(['CANDIDAT'])")
);

test(
  'checkRole importé dans dossier.routes.js',
  dossierRoutes.includes("const { checkRole } = require('../middleware/role.middleware')")
);

// ========================================
// Tests de sécurité - Routes History
// ========================================
console.log(`\n${colors.blue}📜 Tests Routes History${colors.reset}`);
const historyRoutes = readRouteFile('history.routes.js');

test(
  'CONTROLEUR inclus dans route audit/rapport',
  historyRoutes.includes("checkRole(['COMMISSION', 'DGES', 'CONTROLEUR'])")
);

test(
  'CONTROLEUR inclus dans route export/csv',
  historyRoutes.includes("router.get('/export/csv/:dossierId', protect, checkRole(['COMMISSION', 'DGES', 'CONTROLEUR'])")
);

test(
  'CONTROLEUR inclus dans route /:dossierId',
  historyRoutes.includes("router.get('/:dossierId', protect, checkRole(['COMMISSION', 'DGES', 'CONTROLEUR'])")
);

// ========================================
// Tests de sécurité - Routes Completion
// ========================================
console.log(`\n${colors.blue}📊 Tests Routes Completion${colors.reset}`);
const completionRoutes = readRouteFile('completion.routes.js');

test(
  'CONTROLEUR inclus dans route stats/global',
  completionRoutes.includes("router.get('/stats/global', protect, checkRole(['COMMISSION', 'DGES', 'CONTROLEUR'])")
);

// ========================================
// Tests de cohérence - Routes Controleur
// ========================================
console.log(`\n${colors.blue}🎯 Tests Routes Controleur${colors.reset}`);
const controleurRoutes = readRouteFile('controleur.routes.js');

test(
  'Route valider utilise PATCH au lieu de PUT',
  controleurRoutes.includes("router.patch('/dossiers/:inscriptionId/valider'")
);

test(
  'Route valider n\'utilise pas PUT',
  !controleurRoutes.includes("router.put('/dossiers/:inscriptionId/valider'")
);

// ========================================
// Tests de nettoyage - Routes Auth
// ========================================
console.log(`\n${colors.blue}🔐 Tests Routes Auth${colors.reset}`);
const authRoutes = readRouteFile('auth.routes.js');

test(
  'commissionAuthController non importé (ou commenté)',
  authRoutes.includes('// const commissionAuthController') ||
  !authRoutes.includes("const commissionAuthController = require('../controllers/commission.auth.controller')")
);

// ========================================
// Tests de nettoyage - Routes PDF
// ========================================
console.log(`\n${colors.blue}📄 Tests Routes PDF${colors.reset}`);
const pdfRoutes = readRouteFile('pdf.routes.js');

test(
  'pdf.routes.js documenté comme obsolète',
  pdfRoutes.includes('FICHIER OBSOLÈTE') || pdfRoutes.includes('Routes PDF gérées dans candidat.routes.js')
);

test(
  'pdf.routes.js ne contient pas de routes actives',
  !pdfRoutes.includes("router.get('/convocation") && !pdfRoutes.includes("router.get('/preinscription")
);

// ========================================
// Tests de cohérence - Routes Candidat
// ========================================
console.log(`\n${colors.blue}👤 Tests Routes Candidat${colors.reset}`);
const candidatRoutes = readRouteFile('candidat.routes.js');

test(
  'Route convocation réservée aux CANDIDAT',
  candidatRoutes.includes("router.get('/convocation/:inscriptionId', protect, checkRole(['CANDIDAT'])")
);

test(
  'Route preinscription réservée aux CANDIDAT',
  candidatRoutes.includes("router.get('/preinscription/:inscriptionId', protect, checkRole(['CANDIDAT'])")
);

// ========================================
// Tests du contrôleur Notification
// ========================================
console.log(`\n${colors.blue}🔔 Tests Contrôleur Notification${colors.reset}`);
const notificationController = fs.readFileSync(
  path.join(__dirname, 'src', 'controllers', 'notification.controller.js'),
  'utf8'
);

test(
  'Méthode getUnreadCount existe dans le contrôleur',
  notificationController.includes('const getUnreadCount = async')
);

test(
  'Méthode markAllAsRead existe dans le contrôleur',
  notificationController.includes('const markAllAsRead = async')
);

test(
  'Méthode getNotifications existe dans le contrôleur',
  notificationController.includes('const getNotifications = async')
);

test(
  'Méthode markAsRead existe dans le contrôleur',
  notificationController.includes('const markAsRead = async')
);

test(
  'Toutes les méthodes sont exportées',
  notificationController.includes('getUnreadCount,') &&
  notificationController.includes('markAllAsRead,') &&
  notificationController.includes('getNotifications,') &&
  notificationController.includes('markAsRead')
);

// ========================================
// Résumé des tests
// ========================================
console.log(`\n${'='.repeat(60)}`);
console.log(`${colors.blue}📊 RÉSUMÉ DES TESTS${colors.reset}`);
console.log(`${'='.repeat(60)}`);
console.log(`Total de tests : ${totalTests}`);
console.log(`${colors.green}✅ Tests réussis : ${passedTests}${colors.reset}`);
console.log(`${colors.red}❌ Tests échoués : ${failedTests}${colors.reset}`);
console.log(`Taux de réussite : ${((passedTests / totalTests) * 100).toFixed(2)}%`);

if (failedTests === 0) {
  console.log(`\n${colors.green}🎉 TOUS LES TESTS SONT PASSÉS !${colors.reset}`);
  console.log(`${colors.green}✅ Toutes les corrections de sécurité sont appliquées.${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${colors.red}⚠️  CERTAINS TESTS ONT ÉCHOUÉ${colors.reset}`);
  console.log(`${colors.yellow}Veuillez vérifier les corrections ci-dessus.${colors.reset}\n`);
  process.exit(1);
}
