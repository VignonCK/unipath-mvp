/**
 * Script de test pour vérifier la configuration des URLs
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { getFrontendUrl, getBackendUrl, buildFrontendUrl, buildBackendUrl } = require('./src/utils/url.helper');

console.log('🧪 Test de Configuration des URLs\n');
console.log('═'.repeat(60));

// Test 1: Variables d'environnement
console.log('\n📋 Variables d\'environnement:');
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || '(non défini)'}`);
console.log(`   APP_URL: ${process.env.APP_URL || '(non défini)'}`);
console.log(`   PORT: ${process.env.PORT || '(non défini)'}`);

// Test 2: URLs de base
console.log('\n🌐 URLs de base:');
console.log(`   Frontend: ${getFrontendUrl()}`);
console.log(`   Backend: ${getBackendUrl()}`);

// Test 3: Construction d'URLs frontend
console.log('\n🔗 URLs Frontend construites:');
const confirmUrl = buildFrontendUrl('/auth/confirm', { token: 'abc123', type: 'signup' });
console.log(`   Confirmation: ${confirmUrl}`);

const resetUrl = buildFrontendUrl('/reset-password');
console.log(`   Réinitialisation: ${resetUrl}`);

const loginUrl = buildFrontendUrl('/login');
console.log(`   Connexion: ${loginUrl}`);

const dashboardUrl = buildFrontendUrl('/dashboard');
console.log(`   Dashboard: ${dashboardUrl}`);

// Test 4: Construction d'URLs backend
console.log('\n🔗 URLs Backend construites:');
const apiConfirmUrl = buildBackendUrl('/api/auth/confirm-email', { token: 'abc123' });
console.log(`   API Confirmation: ${apiConfirmUrl}`);

// Test 5: Validation
console.log('\n✅ Validation:');
const frontendUrl = getFrontendUrl();
const expectedPort = '5173';
const actualPort = new URL(frontendUrl).port;

if (actualPort === expectedPort) {
  console.log(`   ✓ Le port frontend est correct (${expectedPort})`);
} else {
  console.log(`   ✗ ERREUR: Le port frontend est ${actualPort}, attendu ${expectedPort}`);
  console.log(`   → Vérifiez FRONTEND_URL ou APP_URL dans .env`);
}

// Test 6: Configuration Email
console.log('\n📧 Configuration Email:');
console.log(`   EMAIL_HOST: ${process.env.EMAIL_HOST || '(non défini)'}`);
console.log(`   EMAIL_PORT: ${process.env.EMAIL_PORT || '(non défini)'}`);
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || '(non défini)'}`);
console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || '(non défini)'}`);
console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '***configuré***' : '(non défini)'}`);

console.log('\n' + '═'.repeat(60));
console.log('✅ Test terminé\n');
