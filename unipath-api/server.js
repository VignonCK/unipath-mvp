// src/app.js
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Routes principales
const authRoutes = require('./src/routes/auth.routes');
const candidatRoutes = require('./src/routes/candidat.routes');
const concoursRoutes = require('./src/routes/concours.routes');
const inscriptionRoutes = require('./src/routes/inscription.routes');
const commissionRoutes = require('./src/routes/commission.routes');
const dossierRoutes = require('./src/routes/dossier.routes');
const dgesRoutes = require('./src/routes/dges.routes');
const pdfRoutes = require('./src/routes/pdf.routes');

// Nouvelles routes (avec gestion d'erreur)
try {
  const completionRoutes = require('./src/routes/completion.routes');
  const historyRoutes = require('./src/routes/history.routes');
  
  app.use('/api/completion', completionRoutes);
  app.use('/api/history', historyRoutes);
  console.log('✅ Routes completion et history chargées');
} catch (error) {
  console.warn('⚠️  Erreur chargement routes completion/history:', error.message);
}

app.use('/api/auth', authRoutes);
app.use('/api/candidats', candidatRoutes);
app.use('/api/concours', concoursRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/dossier', dossierRoutes);
app.use('/api/dges', dgesRoutes);
app.use('/api/pdf', pdfRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'UniPath API fonctionne !',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err.message);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur UniPath démarré sur le port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Signal SIGINT reçu, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

module.exports = app;