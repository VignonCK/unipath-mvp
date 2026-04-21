// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./src/routes/auth.routes');
const candidatRoutes = require('./src/routes/candidat.routes');
const concoursRoutes = require('./src/routes/concours.routes');
const inscriptionRoutes = require('./src/routes/inscription.routes');
const commissionRoutes = require('./src/routes/commission.routes');
const dossierRoutes = require('./src/routes/dossier.routes');
const dgesRoutes = require('./src/routes/dges.routes');
const pdfRoutes = require('./src/routes/pdf.routes');

app.use('/api/auth', authRoutes);
app.use('/api/candidats', candidatRoutes);
app.use('/api/concours', concoursRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/dossier', dossierRoutes);
app.use('/api/dges', dgesRoutes);
app.use('/api/pdf', pdfRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'UniPath API fonctionne !' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Serveur UniPath démarré sur le port ${PORT}`);
});

module.exports = app;