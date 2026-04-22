const express = require('express');
const cors = require('cors');
const app = express();
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
const dossierRoutes = require('./routes/dossier.routes');
<<<<<<< HEAD
const dgesRoutes = require('./routes/dges.routes'); // ← AJOUTÉ ICI avec les autres
=======
const dgesRoutes = require('./routes/dges.routes');
const pdfRoutes = require('./routes/pdf.routes');
>>>>>>> f7bce72 (feat: jours 6-7 backend)

app.use('/api/auth', authRoutes);
app.use('/api/candidats', candidatRoutes);
app.use('/api/concours', concoursRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/dossier', dossierRoutes);
<<<<<<< HEAD
app.use('/api/dges', dgesRoutes); // ← AJOUTÉ ICI avec les autres
=======
app.use('/api/dges', dgesRoutes);
app.use('/api/pdf', pdfRoutes);
>>>>>>> f7bce72 (feat: jours 6-7 backend)

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'UniPath API fonctionne !' });
});

module.exports = app; // ← Toujours en dernier