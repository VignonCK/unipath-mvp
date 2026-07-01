const fs = require('fs');
const path = require('path');

const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');

const PUBLIC_LOGO_PATTERN = /^etablissements\/logo-[0-9a-f-]+\.(jpg|jpeg|png|webp)$/i;

function normalizeRelativeUploadPath(relativePath) {
  if (!relativePath) return null;

  let requested = String(relativePath).trim().replace(/\\/g, '/');
  if (requested.startsWith('/uploads/')) {
    requested = requested.slice('/uploads/'.length);
  } else if (requested.startsWith('uploads/')) {
    requested = requested.slice('uploads/'.length);
  } else if (requested.startsWith('/')) {
    requested = requested.slice(1);
  }

  const safePath = path.posix
    .normalize(requested)
    .replace(/^(\.\.(\/|$))+/, '');

  if (safePath !== path.posix.normalize(requested)) {
    return null;
  }

  if (!safePath || safePath.startsWith('/') || safePath.includes('..')) {
    return null;
  }

  return safePath;
}

function resolveAbsoluteUploadPath(relativePath) {
  const safePath = normalizeRelativeUploadPath(relativePath);
  if (!safePath) return null;

  const absolutePath = path.resolve(UPLOADS_ROOT, safePath);
  const uploadsRootWithSep = `${UPLOADS_ROOT}${path.sep}`;

  if (absolutePath !== UPLOADS_ROOT && !absolutePath.startsWith(uploadsRootWithSep)) {
    return null;
  }

  return { safePath, absolutePath };
}

function isPublicUploadPath(relativePath) {
  const safePath = normalizeRelativeUploadPath(relativePath);
  if (!safePath) return false;
  return PUBLIC_LOGO_PATTERN.test(safePath);
}

function toPublicLogoUrl(filename) {
  const base = path.posix.basename(String(filename || ''));
  if (!base || base.includes('..')) return null;
  return `/api/public/etablissements/${base}`;
}

function resolveStoredLogoUrl(storedUrl, etablissementId) {
  if (storedUrl) {
    if (storedUrl.startsWith('/api/public/etablissements/')) {
      return storedUrl;
    }
    if (storedUrl.startsWith('/uploads/etablissements/')) {
      return toPublicLogoUrl(storedUrl);
    }
    if (storedUrl.startsWith('http://') || storedUrl.startsWith('https://')) {
      return storedUrl;
    }
  }

  if (!etablissementId) return null;

  if (!fs.existsSync(UPLOADS_ROOT)) return null;
  const logoDir = path.join(UPLOADS_ROOT, 'etablissements');
  if (!fs.existsSync(logoDir)) return null;

  const logo = fs.readdirSync(logoDir).find((name) => name.startsWith(`logo-${etablissementId}.`));
  return logo ? toPublicLogoUrl(logo) : null;
}

function userCanAccessPrivateUpload(req, safePath) {
  const userRole = req.userRole || req.user?.role;
  const userId = req.user?.id;

  if (userRole === 'ADMIN_ETABLISSEMENT' || userRole === 'DGES') {
    return true;
  }

  if (!userId) return false;

  const segments = safePath.split('/');
  if (segments[0] === userId) return true;
  if (safePath.includes(userId)) return true;

  return false;
}

module.exports = {
  UPLOADS_ROOT,
  normalizeRelativeUploadPath,
  resolveAbsoluteUploadPath,
  isPublicUploadPath,
  toPublicLogoUrl,
  resolveStoredLogoUrl,
  userCanAccessPrivateUpload,
};
