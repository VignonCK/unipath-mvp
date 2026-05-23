// src/middleware/role.middleware.js
const { resolveUserContext, attachUserContext } = require('../utils/user-context');

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 * @param {Array<string>} rolesAutorises - Liste des rôles autorisés (ex: ['CANDIDAT', 'COMMISSION'])
 */
const checkRole = (rolesAutorises) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'Utilisateur non authentifié',
        });
      }

      const ctx = await resolveUserContext(req.user.id);

      if (!ctx.role) {
        return res.status(403).json({
          error: 'Utilisateur non trouvé ou rôle non défini',
        });
      }

      if (!rolesAutorises.includes(ctx.role)) {
        return res.status(403).json({
          error: `Accès refusé. Rôle requis: ${rolesAutorises.join(' ou ')}`,
          roleActuel: ctx.role,
        });
      }

      attachUserContext(req, ctx);
      next();
    } catch (error) {
      console.error('Erreur vérification rôle:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la vérification du rôle' });
    }
  };
};

module.exports = { checkRole };
