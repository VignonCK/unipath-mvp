const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
const BUCKET = 'dossiers-candidats';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function saveBuffer(buffer, storagePath) {
  const fullPath = path.join(UPLOADS_ROOT, BUCKET, storagePath);
  ensureDir(path.dirname(fullPath));
  await fsp.writeFile(fullPath, buffer);
  return `uploads/${BUCKET}/${storagePath}`;
}

function getLocalFilePath(relativePath) {
  if (!relativePath) return null;
  let clean = String(relativePath).trim();
  if (clean.includes(`${BUCKET}/`)) {
    clean = clean.split(`${BUCKET}/`).pop();
  }
  clean = clean.replace(/^uploads\//, '').replace(/^dossiers-candidats\//, '');
  return path.join(UPLOADS_ROOT, BUCKET, clean);
}

function readFileBuffer(relativePath) {
  const fullPath = getLocalFilePath(relativePath);
  if (!fullPath || !fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath);
}

function getPublicUrl(relativePath) {
  const clean = String(relativePath).replace(/^uploads\//, '');
  return `/uploads/${clean.replace(/^dossiers-candidats\//, `${BUCKET}/`)}`;
}

module.exports = {
  BUCKET,
  saveBuffer,
  getLocalFilePath,
  readFileBuffer,
  getPublicUrl,
};
