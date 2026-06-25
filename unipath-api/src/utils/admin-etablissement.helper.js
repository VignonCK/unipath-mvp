function getAdminEtablissementId(req) {
  if (req.userRole !== 'ADMIN_ETABLISSEMENT') return null;
  return req.etablissementId || req.user?.etablissementId || null;
}

function adminOwnsEtablissement(req, etablissementId) {
  const adminEtabId = getAdminEtablissementId(req);
  return Boolean(adminEtabId && adminEtabId === etablissementId);
}

function canAdminAccessApplication(req, application) {
  return application && adminOwnsEtablissement(req, application.etablissementId);
}

module.exports = {
  getAdminEtablissementId,
  adminOwnsEtablissement,
  canAdminAccessApplication,
};
