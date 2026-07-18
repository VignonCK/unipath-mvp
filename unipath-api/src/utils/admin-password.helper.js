const TEMP_PASSWORD_VALIDITY_HOURS = 48;

function getTempPasswordExpiresAt(fromDate = new Date()) {
  return new Date(fromDate.getTime() + TEMP_PASSWORD_VALIDITY_HOURS * 60 * 60 * 1000);
}

function buildAdminEtablissementMetadata(etablissementId, sousRole = 'ADMIN') {
  return {
    role: 'ADMIN_ETABLISSEMENT',
    sousRole,
    etablissementId,
    mustChangePassword: true,
    tempPasswordExpiresAt: getTempPasswordExpiresAt().toISOString(),
  };
}

function buildMembreCommissionMetadata({ concoursId, etablissementId = null, sousRole }) {
  return {
    role: 'COMMISSION',
    sousRole,
    concoursId,
    etablissementId,
    mustChangePassword: true,
    tempPasswordExpiresAt: getTempPasswordExpiresAt().toISOString(),
  };
}

function isTempPasswordExpired(metadata) {
  if (!metadata?.mustChangePassword) return false;
  if (!metadata?.tempPasswordExpiresAt) return false;
  return new Date() > new Date(metadata.tempPasswordExpiresAt);
}

function mustChangeAdminPassword(metadata) {
  return metadata?.mustChangePassword === true;
}

function mustChangeTempPassword(metadata) {
  return metadata?.mustChangePassword === true;
}

module.exports = {
  TEMP_PASSWORD_VALIDITY_HOURS,
  buildAdminEtablissementMetadata,
  buildMembreCommissionMetadata,
  isTempPasswordExpired,
  mustChangeAdminPassword,
  mustChangeTempPassword,
};
