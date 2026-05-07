// src/middleware/role.middleware.js
const prisma = require('../prisma');

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 * @param {Array<string>} rolesAutorises - Liste des rôles autorisés (ex: ['CANDIDAT', 'COMMISSION'])
 */
const checkRole = (rolesAutorises) => {
  return async (req, res, next) => {
    try {
      // req.user est défini par le middleware auth.middleware.js
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'Utilisateur non authentifié',
        });
      }

      const userId = req.user.id;

      // Chercher l'utilisateur dans les 3 tables possibles
      let utilisateur = null;
      let role = null;

      // 1. Vérifier dans Candidat
      const candidat = await prisma.candidat.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (candidat) {
        utilisateur = candidat;
        role = candidat.role;
      }

      // 2. Vérifier dans MembreCommission
      if (!utilisateur) {
        const commission = await prisma.membreCommission.findUnique({
          where: { id: userId },
          select: { role: true },
        });

        if (commission) {
          utilisateur = commission;
          role = commission.role;
        }
      }

      // 3. Vérifier dans AdministrateurDGES
      if (!utilisateur) {
        const dges = await prisma.administrateurDGES.findUnique({
          where: { id: userId },
          select: { role: true },
        });

        if (dges) {
          utilisateur = dges;
          role = dges.role;
        }
      }

      // Si l'utilisateur n'existe dans aucune table
      if (!utilisateur || !role) {
        return res.status(403).json({
          error: 'Utilisateur non trouvé ou rôle non défini',
        });
      }

      // Vérifier si le rôle est autorisé
      if (!rolesAutorises.includes(role)) {
        return res.status(403).json({
          error: `Accès refusé. Rôle requis: ${rolesAutorises.join(' ou ')}`,
          roleActuel: role,
        });
      }

      // Ajouter le rôle à la requête pour utilisation ultérieure
      req.userRole = role;
      next();
    } catch (error) {
      console.error('Erreur vérification rôle:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la vérification du rôle' });
    }
  };
};

module.exports = { checkRole };
