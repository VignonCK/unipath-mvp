const { supabaseAdmin } = require('../supabase');

const ALLOWED_MIMETYPES = ['application/pdf', 'image/png', 'image/jpeg'];

function assertAllowedMimetype(mimetype) {
  if (!ALLOWED_MIMETYPES.includes(mimetype)) {
    throw new Error('Type de fichier non autorise (PDF, PNG, JPEG uniquement)');
  }
}

async function uploadBufferToSupabase(buffer, storagePath, contentType) {
  const bucket = 'dossiers-candidats';
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

module.exports = {
  ALLOWED_MIMETYPES,
  assertAllowedMimetype,
  uploadBufferToSupabase,
};
