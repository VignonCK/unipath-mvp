/**
 * Configuration centralisée de l'application
 * Toutes les variables d'environnement sont validées au démarrage
 */

require('dotenv').config();

const config = {
  // Environnement
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Serveur
  port: parseInt(process.env.PORT || '3001', 10),
  appUrl: process.env.APP_URL || 'http://localhost:3001',

  // Base de données
  database: {
    url: process.env.DATABASE_URL,
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },

  // Email
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
  },

  // CORS
  cors: {
    origins: [
      'http://localhost:5173',
      'http://localhost:3000',
      /\.vercel\.app$/,
    ],
  },
};

/**
 * Valide que toutes les variables d'environnement requises sont présentes
 */
function validateConfig() {
  const required = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0 && !config.isTest) {
    throw new Error(
      `Variables d'environnement manquantes: ${missing.join(', ')}\n` +
      `Vérifiez votre fichier .env`
    );
  }

  // Avertissement si les variables email sont manquantes
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Variables EMAIL_USER et EMAIL_PASS non configurées - Les fonctionnalités email seront désactivées');
  }
}

// Valider au chargement du module
if (!config.isTest) {
  validateConfig();
}

module.exports = config;
