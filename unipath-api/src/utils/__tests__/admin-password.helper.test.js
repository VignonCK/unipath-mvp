const {
  buildAdminEtablissementMetadata,
  isTempPasswordExpired,
  mustChangeAdminPassword,
  TEMP_PASSWORD_VALIDITY_HOURS,
} = require('../admin-password.helper');

describe('admin-password.helper', () => {
  test('buildAdminEtablissementMetadata inclut expiration 48h', () => {
    const meta = buildAdminEtablissementMetadata('etab-1');
    expect(meta.mustChangePassword).toBe(true);
    expect(meta.etablissementId).toBe('etab-1');
    expect(meta.tempPasswordExpiresAt).toBeTruthy();

    const expires = new Date(meta.tempPasswordExpiresAt).getTime();
    const now = Date.now();
    const diffHours = (expires - now) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(TEMP_PASSWORD_VALIDITY_HOURS - 0.1);
    expect(diffHours).toBeLessThanOrEqual(TEMP_PASSWORD_VALIDITY_HOURS);
  });

  test('isTempPasswordExpired détecte expiration', () => {
    const expired = {
      mustChangePassword: true,
      tempPasswordExpiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    const valid = {
      mustChangePassword: true,
      tempPasswordExpiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
    expect(isTempPasswordExpired(expired)).toBe(true);
    expect(isTempPasswordExpired(valid)).toBe(false);
  });

  test('mustChangeAdminPassword', () => {
    expect(mustChangeAdminPassword({ mustChangePassword: true })).toBe(true);
    expect(mustChangeAdminPassword({ mustChangePassword: false })).toBe(false);
    expect(mustChangeAdminPassword({})).toBe(false);
  });
});
