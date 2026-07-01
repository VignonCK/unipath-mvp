const path = require('path');
const { supabaseAdmin } = require('../supabase');

const BUCKET_DOSSIERS_CANDIDATS = 'dossiers-candidats';
const SIGNED_URL_DEFAULT_EXPIRES_IN = 3600;

function extractStorageRelativePath(filePath) {
  if (!filePath) return null;
  let relativePath = String(filePath).trim();
  if (relativePath.includes(`/${BUCKET_DOSSIERS_CANDIDATS}/`)) {
    relativePath = relativePath.split(`/${BUCKET_DOSSIERS_CANDIDATS}/`)[1];
  }
  return decodeURIComponent(relativePath.split('?')[0]);
}

/**
 * Normalise et rejette les traversées de chemin (..).
 * @returns {{ ok: true, safePath: string } | { ok: false, error: string }}
 */
function sanitizeStorageRelativePath(filePath) {
  if (!filePath) {
    return { ok: false, error: 'Chemin invalide' };
  }

  const extracted = extractStorageRelativePath(filePath);
  const requestedPath = (extracted || String(filePath).trim()).replace(/\\/g, '/');
  if (!requestedPath) {
    return { ok: false, error: 'Chemin invalide' };
  }

  const safePath = path.posix
    .normalize(requestedPath)
    .replace(/^(\.\.(\/|$))+/, '');

  if (safePath !== path.posix.normalize(requestedPath)) {
    return { ok: false, error: 'Chemin invalide' };
  }

  if (!safePath || safePath.startsWith('/') || safePath.includes('..')) {
    return { ok: false, error: 'Chemin invalide' };
  }

  return { ok: true, safePath };
}

async function createDossiersCandidatsSignedUrl(
  relativePath,
  expiresIn = SIGNED_URL_DEFAULT_EXPIRES_IN,
) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_DOSSIERS_CANDIDATS)
    .createSignedUrl(relativePath, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Impossible de générer l\'URL signée');
  }

  return data.signedUrl;
}

module.exports = {
  BUCKET_DOSSIERS_CANDIDATS,
  SIGNED_URL_DEFAULT_EXPIRES_IN,
  extractStorageRelativePath,
  sanitizeStorageRelativePath,
  createDossiersCandidatsSignedUrl,
};
