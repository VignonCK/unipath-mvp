// src/middleware/auth.middleware.js
const { supabase } = require('../supabase');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Accès refusé. Token manquant.',
      });
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Token invalide ou expiré. Reconnectez-vous.',
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la vérification' });
  }
};

const protectOptional = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        req.user = user;
      }
    }
  } catch (_) {}
  next();
};

module.exports = { protect, protectOptional };