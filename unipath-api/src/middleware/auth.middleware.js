// src/middleware/auth.middleware.js
const { supabase } = require('../supabase');
const prisma = require('../prisma');
const { resolveUserContext, attachUserContext } = require('../utils/user-context');

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
    const ctx = await resolveUserContext(user.id, user.email);

    if (!ctx.role) {
      return res.status(403).json({
        error:
          'Profil UniPath introuvable pour ce compte. Déconnectez-vous, reconnectez-vous, ou réinscrivez-vous si le problème persiste.',
        profileIncomplete: true,
      });
    }

    attachUserContext(req, ctx);
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

/**
 * Middleware pour vérifier le sous-rôle d'un membre de la commission
 * @param {Array<string>} sousRolesAutorises - Liste des sous-rôles autorisés (ex: ['EXAMINATEUR'], ['CONTROLEUR'])
 * @returns {Function} Middleware Express
 */
const verifierSousRole = (sousRolesAutorises) => {
  return async (req, res, next) => {
    try {
      // Vérifier que l'utilisateur est authentifié
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'Authentification requise',
        });
      }

      // Récupérer le membre de la commission depuis la base de données
      const membreCommission = await prisma.membreCommission.findUnique({
        where: { id: req.user.id },
        select: { sousRole: true, nom: true, prenom: true },
      });

      if (!membreCommission) {
        return res.status(403).json({
          error: 'Accès refusé. Vous n\'êtes pas membre de la commission.',
        });
      }

      // Vérifier que le sous-rôle correspond
      if (!sousRolesAutorises.includes(membreCommission.sousRole)) {
        const messageErreur = sousRolesAutorises.includes('EXAMINATEUR')
          ? 'Accès réservé aux examinateurs'
          : sousRolesAutorises.includes('CONTROLEUR')
          ? 'Accès réservé aux contrôleurs'
          : 'Accès refusé. Sous-rôle non autorisé.';

        // Enregistrer la tentative d'accès refusée dans ActionHistory
        try {
          await prisma.actionHistory.create({
            data: {
              utilisateurId: req.user.id,
              dossierInscriptionId: req.params.dossierInscriptionId || 'N/A',
              typeAction: 'ACCES_REFUSE',
              details: {
                route: req.originalUrl,
                method: req.method,
                sousRoleRequis: sousRolesAutorises,
                sousRoleActuel: membreCommission.sousRole,
                raison: messageErreur,
              },
              ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
              userAgent: req.headers['user-agent'],
            },
          });
        } catch (logError) {
          console.error('Erreur lors de l\'enregistrement de l\'accès refusé:', logError);
        }

        return res.status(403).json({
          error: messageErreur,
        });
      }

      // Ajouter les informations du membre à la requête
      req.membreCommission = membreCommission;
      next();
    } catch (error) {
      console.error('Erreur verifierSousRole:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la vérification du sous-rôle' });
    }
  };
};

module.exports = { protect, protectOptional, verifierSousRole };