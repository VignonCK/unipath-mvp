const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// ── Middlewares ─────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    /\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

app.use('/api/auth', authRoutes);
app.use('/api/candidats', candidatRoutes);
app.use('/api/concours', concoursRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/controleur', controleurRoutes);
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

// ── Health check ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'UniPath API fonctionne !',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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