// src/middleware/auth.middleware.js
const authService = require('../services/auth.service');
const { resolveUserContext, attachUserContext, contextFromToken } = require('../utils/user-context');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Accès refusé. Token manquant.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = authService.verifyToken(token);
    } catch (_) {
      return res.status(401).json({ error: 'Token invalide ou expiré. Reconnectez-vous.' });
    }

    const userId = decoded.sub;
    const email = decoded.email;

    req.user = {
      id: userId,
      email,
      role: decoded.role,
      sousRole: decoded.sousRole,
      etablissementId: decoded.etablissementId,
    };
    req.token = token;

    const tokenCtx = contextFromToken(decoded);
    if (tokenCtx?.role) {
      attachUserContext(req, tokenCtx);
      return next();
    }

    const ctx = await resolveUserContext(userId, email);

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
      try {
        const decoded = authService.verifyToken(token);
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          sousRole: decoded.sousRole,
          etablissementId: decoded.etablissementId,
        };
      } catch (_) {}
    }
  } catch (_) {}
  next();
};

const verifierSousRole = (sousRolesAutorises) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentification requise' });
      }

      let sousRole = req.user.sousRole;

      if (!sousRole) {
        const prisma = require('../prisma');
        const membreCommission = await prisma.membreCommission.findUnique({
          where: { id: req.user.id },
          select: { sousRole: true, nom: true, prenom: true },
        });

        if (!membreCommission) {
          return res.status(403).json({ error: "Accès refusé. Vous n'êtes pas membre de la commission." });
        }

        req.membreCommission = membreCommission;
        sousRole = membreCommission.sousRole;
      }

      if (!sousRolesAutorises.includes(sousRole)) {
        const messageErreur = sousRolesAutorises.includes('EXAMINATEUR')
          ? 'Accès réservé aux examinateurs'
          : sousRolesAutorises.includes('CONTROLEUR')
          ? 'Accès réservé aux contrôleurs'
          : 'Accès refusé. Sous-rôle non autorisé.';

        try {
          const prisma = require('../prisma');
          await prisma.actionHistory.create({
            data: {
              utilisateurId: req.user.id,
              dossierInscriptionId: req.params.dossierInscriptionId || 'N/A',
              typeAction: 'ACCES_REFUSE',
              details: {
                route: req.originalUrl,
                method: req.method,
                sousRoleRequis: sousRolesAutorises,
                sousRoleActuel: sousRole,
                raison: messageErreur,
              },
              ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
              userAgent: req.headers['user-agent'],
            },
          });
        } catch (logError) {
          console.error("Erreur lors de l'enregistrement de l'accès refusé:", logError);
        }

        return res.status(403).json({ error: messageErreur });
      }

      next();
    } catch (error) {
      console.error('Erreur verifierSousRole:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la vérification du sous-rôle' });
    }
  };
};

/**
 * Autorise tout membre de la commission (rôle COMMISSION), quel que soit son
 * sous-rôle. Le rôle effectif (examinateur/contrôleur) est résolu par concours
 * via les affectations, pas au niveau du compte.
 */
const verifierMembreCommission = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const prisma = require('../prisma');
    const membre = await prisma.membreCommission.findUnique({
      where: { id: req.user.id },
      select: { id: true, nom: true, prenom: true, sousRole: true },
    });

    if (!membre) {
      return res.status(403).json({ error: "Accès refusé. Vous n'êtes pas membre de la commission." });
    }

    req.membreCommission = membre;
    next();
  } catch (error) {
    console.error('Erreur verifierMembreCommission:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la vérification de la commission' });
  }
};

/**
 * Vérifie que le membre est affecté au concours du dossier ciblé, pour le rôle
 * demandé. S'applique uniquement aux routes portant :dossierInscriptionId
 * (les listes sont filtrées côté contrôleur via resolveConcoursFilterForMembre).
 */
const verifierAffectationDossier = (roleAffectation) => {
  return async (req, res, next) => {
    try {
      const { dossierInscriptionId } = req.params;
      if (!dossierInscriptionId) return next();

      const prisma = require('../prisma');
      const { membreEstAffecte } = require('../utils/affectation-commission.helper');

      const dossier = await prisma.dossierInscription.findUnique({
        where: { id: dossierInscriptionId },
        select: { inscription: { select: { concoursId: true } } },
      });

      if (!dossier) {
        return res.status(404).json({ error: 'Dossier non trouvé' });
      }

      const concoursId = dossier.inscription?.concoursId;
      const autorise = await membreEstAffecte(req.user.id, concoursId, roleAffectation);
      if (!autorise) {
        return res.status(403).json({
          error:
            roleAffectation === 'EXAMINATEUR'
              ? "Vous n'êtes pas affecté à ce concours en tant qu'examinateur."
              : "Vous n'êtes pas affecté à ce concours en tant que contrôleur.",
        });
      }

      next();
    } catch (error) {
      console.error('Erreur verifierAffectationDossier:', error);
      res.status(500).json({ error: "Erreur serveur lors de la vérification de l'affectation" });
    }
  };
};

module.exports = {
  protect,
  protectOptional,
  verifierSousRole,
  verifierMembreCommission,
  verifierAffectationDossier,
};
