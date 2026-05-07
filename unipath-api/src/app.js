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
}));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const candidatRoutes = require('./routes/candidat.routes');
const concoursRoutes = require('./routes/concours.routes');
const inscriptionRoutes = require('./routes/inscription.routes');
const commissionRoutes = require('./routes/commission.routes');
const controleurRoutes = require('./routes/controleur.routes');
const dossierRoutes = require('./routes/dossier.routes');
const dgesRoutes = require('./routes/dges.routes');
const pdfRoutes = require('./routes/pdf.routes');
const completionRoutes = require('./routes/completion.routes');
const historyRoutes = require('./routes/history.routes');
const notificationRoutes = require('./routes/notifications.routes');

app.use('/api/auth', authRoutes);
app.use('/api/candidats', candidatRoutes);
app.use('/api/concours', concoursRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/controleur', controleurRoutes);
app.use('/api/dossier', dossierRoutes);
app.use('/api/dges', dgesRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/completion', completionRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/notifications', notificationRoutes);

// ── Servir les fichiers PHP ────────────────────────────────────
const { exec } = require('child_process');
const path = require('path');

app.post('/php/:file', (req, res) => {
  const phpFile = path.join(__dirname, '../php', req.params.file);
  const input = JSON.stringify(req.body);
  
  exec(`php ${phpFile}`, { input }, (error, stdout, stderr) => {
    if (error) {
      console.error('Erreur PHP:', stderr);
      return res.status(500).json({ error: stderr });
    }
    
    try {
      const result = JSON.parse(stdout);
      res.json(result);
    } catch (e) {
      res.json({ success: true, output: stdout });
    }
  });
});

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