const prisma = require('../prisma');
const { alignCandidatIdToAuth } = require('./candidat-alignment.helper');

/**
 * Résout le rôle (et sous-rôle commission) d'un utilisateur Supabase.
 * @param {string} userId - ID Supabase Auth
 * @param {string} [email] - Email (fallback si id Candidat désaligné)
 */
async function resolveUserContext(userId, email) {
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

  const adminEtablissement = prisma.adminEtablissement
    ? await prisma.adminEtablissement.findUnique({
        where: { id: userId },
        select: { role: true, nom: true, prenom: true, etablissementId: true },
      })
    : null;
  if (adminEtablissement) {
    return {
      role: adminEtablissement.role,
      sousRole: null,
      profile: adminEtablissement,
      etablissementId: adminEtablissement.etablissementId,
    };
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
  if (ctx.etablissementId) {
    req.etablissementId = ctx.etablissementId;
    req.user.etablissementId = ctx.etablissementId;
  }
}

module.exports = { resolveUserContext, attachUserContext };
