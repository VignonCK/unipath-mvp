const prisma = require('../prisma');

/**
 * Résout le rôle (et sous-rôle commission) d'un utilisateur Supabase.
 */
async function resolveUserContext(userId) {
  const candidat = await prisma.candidat.findUnique({
    where: { id: userId },
    select: { role: true, nom: true, prenom: true },
  });
  if (candidat) {
    return { role: candidat.role, sousRole: null, profile: candidat };
  }

  const commission = await prisma.membreCommission.findUnique({
    where: { id: userId },
    select: { role: true, sousRole: true, nom: true, prenom: true },
  });
  if (commission) {
    return { role: commission.role, sousRole: commission.sousRole, profile: commission };
  }

  const dges = await prisma.administrateurDGES.findUnique({
    where: { id: userId },
    select: { role: true, nom: true, prenom: true },
  });
  if (dges) {
    return { role: dges.role, sousRole: null, profile: dges };
  }

  const controleur = await prisma.controleur.findUnique({
    where: { id: userId },
    select: { role: true, nom: true, prenom: true },
  });
  if (controleur) {
    return { role: controleur.role, sousRole: null, profile: controleur };
  }

  return { role: null, sousRole: null, profile: null };
}

function attachUserContext(req, ctx) {
  if (!ctx?.role) return;
  req.userRole = ctx.role;
  req.user.role = ctx.role;
  if (ctx.sousRole) {
    req.user.sousRole = ctx.sousRole;
  }
}

module.exports = { resolveUserContext, attachUserContext };
