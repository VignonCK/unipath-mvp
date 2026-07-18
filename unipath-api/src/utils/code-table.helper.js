/**
 * Codes 2 chiffres pour n° de table (ville / filière concours).
 * null / "" → null ; sinon doit matcher ^\d{2}$.
 */
function parseOptionalCode2(value, fieldLabel) {
  if (value === undefined) {
    return { skip: true };
  }
  if (value === null || String(value).trim() === '') {
    return { value: null };
  }
  const normalized = String(value).trim();
  if (!/^\d{2}$/.test(normalized)) {
    return {
      error: `${fieldLabel} doit être exactement 2 chiffres (ex: 01)`,
    };
  }
  return { value: normalized };
}

module.exports = { parseOptionalCode2 };
