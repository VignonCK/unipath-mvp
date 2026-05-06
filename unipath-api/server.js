// Point d'entrée du serveur UniPath API
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const config = require('./src/config');
const logger = require('./src/utils/logger');
const app = require('./src/app');
const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.success(`Serveur UniPath démarré sur le port ${PORT}`);
  logger.info(`Health check: ${config.appUrl}/health`);
  logger.info(`API Base URL: ${config.appUrl}/api`);
  logger.info(`Environnement: ${config.env}`);
});

// Force le process à rester actif
setInterval(() => {}, 1 << 30);

const gracefulShutdown = (signal) => {
  logger.warn(`Signal ${signal} reçu, arrêt du serveur...`);
  server.close(() => {
    logger.success('Serveur arrêté proprement');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Arrêt forcé après timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // gracefulShutdown('unhandledRejection');
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // gracefulShutdown('uncaughtException');
});

module.exports = server;