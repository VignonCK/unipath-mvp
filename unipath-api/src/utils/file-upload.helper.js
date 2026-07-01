const { supabaseAdmin } = require('../supabase');
const {
  BUCKET_DOSSIERS_CANDIDATS,
  createDossiersCandidatsSignedUrl,
  SIGNED_URL_DEFAULT_EXPIRES_IN,
} = require('./storage.helper');

const ALLOWED_MIMETYPES = ['application/pdf', 'image/png', 'image/jpeg'];

function assertAllowedMimetype(mimetype) {
  if (!ALLOWED_MIMETYPES.includes(mimetype)) {
    throw new Error('Type de fichier non autorise (PDF, PNG, JPEG uniquement)');
  }
}

/**
 * Upload vers dossiers-candidats et retourne le chemin objet (à persister en base).
 * Ne pas stocker d'URL publique — accès via createSignedUrl / GET /dossier/signed-url.
 */
async function uploadBufferToSupabase(buffer, storagePath, contentType) {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_DOSSIERS_CANDIDATS)
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (error) {
    throw new Error(error.message);
  }

  return storagePath;
}

/**
 * Génère une URL signée temporaire pour un chemin déjà stocké en base.
 */
async function getSignedUrlForStoragePath(
  storagePath,
  expiresIn = SIGNED_URL_DEFAULT_EXPIRES_IN,
) {
  return createDossiersCandidatsSignedUrl(storagePath, expiresIn);
}

module.exports = {
  ALLOWED_MIMETYPES,
  assertAllowedMimetype,
  uploadBufferToSupabase,
  getSignedUrlForStoragePath,
};
