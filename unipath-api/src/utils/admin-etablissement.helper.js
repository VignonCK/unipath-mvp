const SOUS_ROLES_ETABLISSEMENT = {
  ADMIN: 'ADMIN',
  SUPERVISEUR: 'SUPERVISEUR',
  CONTROLEUR: 'CONTROLEUR',
};

const STAFF_DECISION_ROLES = [
  SOUS_ROLES_ETABLISSEMENT.ADMIN,
  SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR,
  SOUS_ROLES_ETABLISSEMENT.CONTROLEUR,
];

const STAFF_STATS_ROLES = [
  SOUS_ROLES_ETABLISSEMENT.ADMIN,
  SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR,
];

const STAFF_ADMIN_ONLY = [SOUS_ROLES_ETABLISSEMENT.ADMIN];

function getStaffSousRole(req) {
  if (req.userRole !== 'ADMIN_ETABLISSEMENT') return null;
  return req.user?.sousRole || req.sousRoleEtablissement || null;
}

/**
 * Scope établissement pour tout le staff ADMIN_ETABLISSEMENT.
 * Deny-by-default : pas d'etablissementId => null (à traiter en 403).
 */
function getAdminEtablissementId(req) {
  if (req.userRole !== 'ADMIN_ETABLISSEMENT') return null;
  return req.etablissementId || req.user?.etablissementId || null;
}

function assertStaffScope(req) {
  const etablissementId = getAdminEtablissementId(req);
  if (!etablissementId) {
    const err = new Error('Accès refusé : établissement non rattaché au compte');
    err.status = 403;
    throw err;
  }
  return etablissementId;
}

function adminOwnsEtablissement(req, etablissementId) {
  const adminEtabId = getAdminEtablissementId(req);
  return Boolean(adminEtabId && etablissementId && adminEtabId === etablissementId);
}

function canAdminAccessApplication(req, application) {
  return application && adminOwnsEtablissement(req, application.etablissementId);
}

function canStaffAccessPreinscription(req, preinscription) {
  return preinscription && adminOwnsEtablissement(req, preinscription.etablissementId);
}

function hasSousRoleEtablissement(req, allowed = []) {
  const sousRole = getStaffSousRole(req);
  if (!sousRole) return false;
  return allowed.includes(sousRole);
}

function canCreateStaffSousRole(actorSousRole, targetSousRole) {
  if (actorSousRole === SOUS_ROLES_ETABLISSEMENT.ADMIN) {
    return [SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR, SOUS_ROLES_ETABLISSEMENT.CONTROLEUR].includes(targetSousRole);
  }
  if (actorSousRole === SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR) {
    return targetSousRole === SOUS_ROLES_ETABLISSEMENT.CONTROLEUR;
  }
  return false;
}

function canDeleteStaffMember(actorSousRole, targetSousRole) {
  if (actorSousRole === SOUS_ROLES_ETABLISSEMENT.ADMIN) {
    return targetSousRole !== SOUS_ROLES_ETABLISSEMENT.ADMIN;
  }
  if (actorSousRole === SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR) {
    return targetSousRole === SOUS_ROLES_ETABLISSEMENT.CONTROLEUR;
  }
  return false;
}

module.exports = {
  SOUS_ROLES_ETABLISSEMENT,
  STAFF_DECISION_ROLES,
  STAFF_STATS_ROLES,
  STAFF_ADMIN_ONLY,
  getStaffSousRole,
  getAdminEtablissementId,
  assertStaffScope,
  adminOwnsEtablissement,
  canAdminAccessApplication,
  canStaffAccessPreinscription,
  hasSousRoleEtablissement,
  canCreateStaffSousRole,
  canDeleteStaffMember,
};
