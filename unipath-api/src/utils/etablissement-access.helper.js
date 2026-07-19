/**
 * Résout l'établissement courant pour :
 * - ADMIN_ETABLISSEMENT → req.user.etablissementId / req.etablissementId
 * - ETABLISSEMENT (legacy) → req.user.id
 */
function resolveEtablissementIdFromReq(req) {
  const role = req.userRole || req.user?.role;
  if (role === 'ADMIN_ETABLISSEMENT') {
    return req.etablissementId || req.user?.etablissementId || null;
  }
  if (role === 'ETABLISSEMENT') {
    return req.user?.id || null;
  }
  return req.etablissementId || req.user?.etablissementId || req.user?.id || null;
}

function canAccessEtablissementResource(req, etablissementId) {
  if (!etablissementId) return false;
  const role = req.userRole || req.user?.role;
  if (role === 'ADMIN_ETABLISSEMENT') {
    const adminEtabId = req.etablissementId || req.user?.etablissementId;
    return adminEtabId === etablissementId;
  }
  if (role === 'ETABLISSEMENT') {
    return req.user?.id === etablissementId;
  }
  return false;
}

module.exports = {
  resolveEtablissementIdFromReq,
  canAccessEtablissementResource,
};
