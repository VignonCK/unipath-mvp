// src/middleware/role.middleware.js
const { resolveUserContext, attachUserContext } = require('../utils/user-context');
const { ROLES_ETUDIANT } = require('../constants/roles.constants');

const expandAuthorizedRoles = (rolesAutorises) => {
  const expanded = new Set(rolesAutorises);
  const needsStudentAlias = rolesAutorises.some((r) => ROLES_ETUDIANT.includes(r));
  if (needsStudentAlias) {
    ROLES_ETUDIANT.forEach((r) => expanded.add(r));
  }
  return [...expanded];
};

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

      // Réutiliser le contexte déjà résolu par `protect` quand disponible
      let ctx;
      if (req.userRole) {
        ctx = { role: req.userRole, sousRole: req.user.sousRole || null };
      } else {
        ctx = await resolveUserContext(req.user.id, req.user.email);
      }

      if (!ctx.role) {
        return res.status(403).json({
          error:
            'Profil UniPath introuvable pour ce compte. Déconnectez-vous, reconnectez-vous, ou réinscrivez-vous si le problème persiste.',
          profileIncomplete: true,
        });
      }

      const rolesEffectifs = expandAuthorizedRoles(rolesAutorises);
      if (!rolesEffectifs.includes(ctx.role)) {
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
