// src/app.js
const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Route de test
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'UniPath API fonctionne !' });
});

module.exports = app;