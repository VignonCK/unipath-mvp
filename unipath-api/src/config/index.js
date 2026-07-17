/**
 * Configuration centralisée de l'application
 */

require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  port: parseInt(process.env.PORT || '3001', 10),
  appUrl: process.env.APP_URL || 'http://localhost:5173',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'unipath-dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  email: {
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10),
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM_EMAIL,
  },

  cors: {
    origins: [
      'http://localhost:5173',
      'http://localhost:3000',
      /\.vercel\.app$/,
    ],
  },
};

function validateConfig() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0 && !config.isTest) {
    if (missing.length === 1 && missing[0] === 'JWT_SECRET') {
      console.warn('⚠️  JWT_SECRET non défini — utilisation du secret de développement');
    } else {
      throw new Error(
        `Variables d'environnement manquantes: ${missing.join(', ')}\n` +
        'Vérifiez votre fichier .env'
      );
    }
  }

  if (!process.env.EMAIL_USER && !process.env.SMTP_USER) {
    console.warn('⚠️  SMTP non configuré — les emails seront désactivés ou loggés en console');
  }
}

if (!config.isTest) {
  validateConfig();
}

module.exports = config;
