// src/app.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth.routes');
const candidatRoutes = require('./routes/candidat.routes');
const concoursRoutes = require('./routes/concours.routes');
const inscriptionRoutes = require('./routes/inscription.routes');
const commissionRoutes = require('./routes/commission.routes');
const dossierRoutes = require('./routes/dossier.routes');
const dgesRoutes = require('./routes/dges.routes');
const pdfRoutes = require('./routes/pdf.routes');

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

module.exports = app;