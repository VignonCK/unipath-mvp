const express = require('express');
const cors = require('cors');
const app = express();

// ── Middlewares ─────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    /\.vercel\.app$/,
  ],
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Fichiers locaux : routes authentifiées (/api/uploads) et publiques (/api/public) — voir uploads.routes.js
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ──────────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const candidatRoutes = require('./routes/candidat.routes');
const concoursRoutes = require('./routes/concours.routes');
const inscriptionRoutes = require('./routes/inscription.routes');
const commissionRoutes = require('./routes/commission.routes');
const controleurRoutes = require('./routes/controleur.routes');
const dossierRoutes = require('./routes/dossier.routes');
const dgesRoutes = require('./routes/dges.routes');
const completionRoutes = require('./routes/completion.routes');
const historyRoutes = require('./routes/history.routes');
const notificationRoutes = require('./routes/notifications.routes');
const emailRoutes = require('./routes/email.routes');
const examinateurRoutes = require('./routes/examinateur.routes');
const controleurCommissionRoutes = require('./routes/controleur-commission.routes');
const etablissementRoutes = require('./routes/etablissement.routes');
const filiereRoutes = require('./routes/filiere.routes');
const inscriptionAcadRoutes = require('./routes/inscriptionAcad.routes');
const notesRoutes = require('./routes/notes.routes');
const parcoursRoutes = require('./routes/parcours.routes');
const preinscriptionEtablissementRoutes = require('./routes/preinscriptionEtablissement.routes');
const applicationRoutes = require('./routes/application.routes');
const campagneAdminRoutes = require('./routes/campagneAdmin.routes');
const filiereAdminRoutes = require('./routes/filiereAdmin.routes');
const campagneRoutes = require('./routes/campagne.routes');
const { centreRouter, concoursCentresRouter } = require('./routes/centreComposition.routes');
const uploadsRoutes = require('./routes/uploads.routes');
const statsRoutes = require('./routes/stats.routes');

app.use('/api/auth', authRoutes);
app.use('/api/candidats', candidatRoutes);
app.use('/api/concours', concoursRoutes);
app.use('/api/concours/:concoursId/centres', concoursCentresRouter);
app.use('/api/centres-composition', centreRouter);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/controleur', controleurRoutes);
app.use('/api/dossier', (req, res, next) => {
  req.setTimeout(60000);
  res.setTimeout(60000);
  next();
});
app.use('/api/dossier', dossierRoutes);
app.use('/api/dges', dgesRoutes);
app.use('/api/completion', completionRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/email', emailRoutes);
// Routes pour le système de double verdict
app.use('/api/examinateur', examinateurRoutes);
app.use('/api/controleur-commission', controleurCommissionRoutes);
app.use('/api/etablissements', etablissementRoutes);
app.use('/api/filieres', filiereRoutes);
app.use('/api/inscriptions-academiques', inscriptionAcadRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/parcours', parcoursRoutes);
app.use('/api/preinscriptions-etablissement', preinscriptionEtablissementRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/etablissement/campagnes', campagneAdminRoutes);
app.use('/api/etablissement/filieres', filiereAdminRoutes);
app.use('/api/campagnes', campagneRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api', uploadsRoutes);

// ── Health check ────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const payload = {
    status: 'OK',
    message: 'UniPath API fonctionne !',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'unknown',
  };

  try {
    if (process.env.NODE_ENV === 'test') {
      payload.database = 'skipped';
      return res.json(payload);
    }

    const prisma = require('./prisma');
    const { pingDatabase } = require('./utils/prisma-retry.helper');
    await pingDatabase(prisma, { retries: 2, baseDelayMs: 300 });
    payload.database = 'connected';
    return res.json(payload);
  } catch (error) {
    payload.status = 'DEGRADED';
    payload.database = 'unreachable';
    payload.databaseError = error.code || error.message;
    return res.status(503).json(payload);
  }
});

// ── 404 API (évite les pages HTML Express en dev) ───────────────
app.use('/api', (req, res) => {
  res.status(404).json({
    error: `Route API introuvable: ${req.method} ${req.originalUrl}`,
  });
});

// ── Gestion des erreurs globales ───────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;