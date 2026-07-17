const prisma = require('../prisma');
const { alignCandidatIdToAuth } = require('./candidat-alignment.helper');

const PROFIL_TYPE_TO_ROLE = {
  CANDIDAT: 'CANDIDAT',
  COMMISSION: 'COMMISSION',
  DGES: 'DGES',
  DEC: 'DEC',
  CONTROLEUR: 'CONTROLEUR',
  ADMIN_ETABLISSEMENT: 'ADMIN_ETABLISSEMENT',
  ETABLISSEMENT: 'ETABLISSEMENT',
};

async function loadProfileByType(profilType, profilId) {
  switch (profilType) {
    case 'CANDIDAT': {
      const candidat = await prisma.candidat.findUnique({
        where: { id: profilId },
        select: { role: true, nom: true, prenom: true },
      });
      if (!candidat) return null;
      return { role: candidat.role, sousRole: null, profile: candidat };
    }
    case 'COMMISSION': {
      const commission = await prisma.membreCommission.findUnique({
        where: { id: profilId },
        select: { role: true, sousRole: true, nom: true, prenom: true },
      });
      if (!commission) return null;
      return {
        role: commission.role,
        sousRole: commission.sousRole,
        profile: commission,
      };
    }
    case 'DGES': {
      const dges = await prisma.administrateurDGES.findUnique({
        where: { id: profilId },
        select: { role: true, nom: true, prenom: true },
      });
      if (!dges) return null;
      return { role: dges.role, sousRole: null, profile: dges };
    }
    case 'DEC': {
      const dec = await prisma.administrateurDEC.findUnique({
        where: { id: profilId },
        select: { role: true, nom: true, prenom: true },
      });
      if (!dec) return null;
      return { role: dec.role, sousRole: null, profile: dec };
    }
    case 'CONTROLEUR': {
      const controleur = await prisma.controleur.findUnique({
        where: { id: profilId },
        select: { role: true, nom: true, prenom: true },
      });
      if (!controleur) return null;
      return { role: controleur.role, sousRole: null, profile: controleur };
    }
    case 'ADMIN_ETABLISSEMENT': {
      const admin = await prisma.adminEtablissement.findUnique({
        where: { id: profilId },
        select: { role: true, nom: true, prenom: true, etablissementId: true },
      });
      if (!admin) return null;
      return {
        role: admin.role,
        sousRole: null,
        profile: admin,
        etablissementId: admin.etablissementId,
      };
    }
    case 'ETABLISSEMENT': {
      const etablissement = await prisma.etablissement.findUnique({
        where: { id: profilId },
        select: { id: true, nom: true, type: true, ville: true, email: true },
      });
      if (!etablissement) return null;
      return { role: 'ETABLISSEMENT', sousRole: null, profile: etablissement };
    }
    default:
      return null;
  }
}

/**
 * Résout le rôle d'un utilisateur — 1 requête via Compte quand possible.
 */
async function resolveUserContext(userId, email) {
  const compte = await prisma.compte.findUnique({
    where: { profilId: userId },
    select: { profilType: true, profilId: true },
  });

  if (compte) {
    const ctx = await loadProfileByType(compte.profilType, compte.profilId);
    if (ctx) return ctx;
  }

  let candidat = await prisma.candidat.findUnique({
    where: { id: userId },
    select: { role: true, nom: true, prenom: true },
  });

  if (!candidat && email) {
    candidat = await alignCandidatIdToAuth(userId, email);
  }

  if (candidat) {
    return { role: candidat.role, sousRole: null, profile: candidat };
  }

  return { role: null, sousRole: null, profile: null };
}

function contextFromToken(decoded) {
  if (!decoded?.role) return null;
  return {
    role: decoded.role,
    sousRole: decoded.sousRole || null,
    etablissementId: decoded.etablissementId || null,
  };
}

function attachUserContext(req, ctx) {
  if (!ctx?.role) return;
  req.userRole = ctx.role;
  req.user.role = ctx.role;
  if (ctx.sousRole) {
    req.user.sousRole = ctx.sousRole;
  }
  if (ctx.etablissementId) {
    req.etablissementId = ctx.etablissementId;
    req.user.etablissementId = ctx.etablissementId;
  }
}

module.exports = {
  resolveUserContext,
  attachUserContext,
  contextFromToken,
  PROFIL_TYPE_TO_ROLE,
};
