const BUCKET_DOSSIERS_CANDIDATS = 'dossiers-candidats';

function extractStorageRelativePath(filePath) {
  if (!filePath) return null;
  let relativePath = String(filePath).trim();
  if (relativePath.includes(`/${BUCKET_DOSSIERS_CANDIDATS}/`)) {
    relativePath = relativePath.split(`/${BUCKET_DOSSIERS_CANDIDATS}/`)[1];
  }
  return decodeURIComponent(relativePath.split('?')[0]);
}

module.exports = {
  BUCKET_DOSSIERS_CANDIDATS,
  extractStorageRelativePath,
};
