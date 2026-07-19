/**
 * Configuration de l'en-tête PDF (bandeau officiel).
 * Source de vérité : fichier actif + meta.json (lisible Node et PHP),
 * synchronisée avec ParametreSysteme en base.
 */
const fs = require('fs');
const path = require('path');
const prisma = require('../prisma');

const CLE_EN_TETE_PDF = 'PDF_HEADER_IMAGE';
const DEFAULT_ASPECT = 151 / 1024;

const PARAMETRES_DIR = path.join(__dirname, '../../uploads/parametres');
const META_PATH = path.join(PARAMETRES_DIR, 'en-tete-pdf.meta.json');

const DEFAULT_CANDIDATES = [
  path.join(__dirname, '../../assets/en-tete-mesrs.jpg'),
  path.join(__dirname, '../../assets/en-tete-mesrs.png'),
  path.join(__dirname, '../assets/en-tete-mesrs.jpg'),
  path.join(__dirname, '../assets/en-tete-mesrs.png'),
];

function ensureParametresDir() {
  if (!fs.existsSync(PARAMETRES_DIR)) {
    fs.mkdirSync(PARAMETRES_DIR, { recursive: true });
  }
}

function getDefaultHeaderPath() {
  for (const candidate of DEFAULT_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function readMetaFile() {
  try {
    if (!fs.existsSync(META_PATH)) return null;
    const raw = fs.readFileSync(META_PATH, 'utf8');
    const meta = JSON.parse(raw);
    if (!meta?.fichierRelatif) return null;
    const abs = path.join(__dirname, '../..', meta.fichierRelatif.replace(/^\//, ''));
    if (!fs.existsSync(abs)) return null;
    return { ...meta, absolutePath: abs };
  } catch {
    return null;
  }
}

function writeMetaFile(meta) {
  ensureParametresDir();
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), 'utf8');
}

function getImageDimensions(buffer) {
  if (!buffer || buffer.length < 24) return null;

  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let i = 2;
    while (i < buffer.length - 8) {
      if (buffer[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buffer[i + 1];
      if (marker === 0xd9 || marker === 0xda) break;
      const len = buffer.readUInt16BE(i + 2);
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        return {
          height: buffer.readUInt16BE(i + 5),
          width: buffer.readUInt16BE(i + 7),
        };
      }
      i += 2 + len;
    }
  }

  return null;
}

/**
 * Résolution synchrone (Node PDFKit + cache fichier pour PHP).
 */
function resolvePdfHeaderSync() {
  const custom = readMetaFile();
  if (custom?.absolutePath) {
    const aspect = custom.aspectRatio
      || (custom.largeur && custom.hauteur ? custom.hauteur / custom.largeur : DEFAULT_ASPECT);
    return {
      path: custom.absolutePath,
      aspectRatio: aspect,
      isCustom: true,
      mimeType: custom.mimeType || null,
      largeur: custom.largeur || null,
      hauteur: custom.hauteur || null,
      originalName: custom.originalName || null,
      updatedAt: custom.updatedAt || null,
      publicUrl: `/${custom.fichierRelatif.replace(/\\/g, '/')}`,
    };
  }

  const def = getDefaultHeaderPath();
  return {
    path: def,
    aspectRatio: DEFAULT_ASPECT,
    isCustom: false,
    mimeType: def?.endsWith('.png') ? 'image/png' : 'image/jpeg',
    largeur: 1024,
    hauteur: 151,
    originalName: def ? path.basename(def) : null,
    updatedAt: null,
    publicUrl: null,
  };
}

async function getEnTetePdfStatus() {
  const resolved = resolvePdfHeaderSync();
  let dbRow = null;
  try {
    dbRow = await prisma.parametreSysteme.findUnique({ where: { cle: CLE_EN_TETE_PDF } });
  } catch {
    // table absente éventuelle — on continue avec le fichier
  }

  return {
    isCustom: resolved.isCustom,
    mimeType: resolved.mimeType,
    largeur: resolved.largeur,
    hauteur: resolved.hauteur,
    aspectRatio: resolved.aspectRatio,
    originalName: resolved.originalName,
    updatedAt: resolved.updatedAt || dbRow?.updatedAt || null,
    updatedById: dbRow?.updatedById || null,
    previewUrl: resolved.isCustom
      ? `${resolved.publicUrl}?t=${encodeURIComponent(String(resolved.updatedAt || Date.now()))}`
      : null,
    hasDefault: Boolean(getDefaultHeaderPath()),
  };
}

async function setCustomEnTetePdf({ buffer, mimeType, originalName, userId }) {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowed.includes(String(mimeType || '').toLowerCase())) {
    return { ok: false, status: 400, error: 'Formats acceptés : JPG ou PNG' };
  }
  if (!buffer?.length) {
    return { ok: false, status: 400, error: 'Fichier vide' };
  }
  if (buffer.length > 5 * 1024 * 1024) {
    return { ok: false, status: 400, error: 'Fichier trop volumineux (max 5 Mo)' };
  }

  const dims = getImageDimensions(buffer);
  if (!dims?.width || !dims?.height) {
    return { ok: false, status: 400, error: 'Impossible de lire les dimensions de l\'image' };
  }
  if (dims.width < 400 || dims.height < 40) {
    return {
      ok: false,
      status: 400,
      error: 'Image trop petite. Utilisez un bandeau large (recommandé ~1024×151 px).',
    };
  }

  const ext = String(mimeType).includes('png') ? '.png' : '.jpg';
  ensureParametresDir();

  // Supprimer l'ancien actif (autre extension éventuelle)
  for (const oldExt of ['.jpg', '.jpeg', '.png']) {
    const oldPath = path.join(PARAMETRES_DIR, `en-tete-pdf-actif${oldExt}`);
    if (fs.existsSync(oldPath)) {
      try { fs.unlinkSync(oldPath); } catch { /* ignore */ }
    }
  }

  const filename = `en-tete-pdf-actif${ext}`;
  const absPath = path.join(PARAMETRES_DIR, filename);
  fs.writeFileSync(absPath, buffer);

  const now = new Date().toISOString();
  const meta = {
    fichierRelatif: `uploads/parametres/${filename}`,
    mimeType: ext === '.png' ? 'image/png' : 'image/jpeg',
    largeur: dims.width,
    hauteur: dims.height,
    aspectRatio: dims.height / dims.width,
    originalName: originalName || filename,
    updatedAt: now,
  };
  writeMetaFile(meta);

  const valeur = JSON.stringify(meta);
  await prisma.parametreSysteme.upsert({
    where: { cle: CLE_EN_TETE_PDF },
    create: {
      cle: CLE_EN_TETE_PDF,
      valeur,
      updatedById: userId || null,
    },
    update: {
      valeur,
      updatedById: userId || null,
    },
  });

  return { ok: true, status: await getEnTetePdfStatus() };
}

async function restoreDefaultEnTetePdf({ userId } = {}) {
  ensureParametresDir();
  for (const oldExt of ['.jpg', '.jpeg', '.png']) {
    const oldPath = path.join(PARAMETRES_DIR, `en-tete-pdf-actif${oldExt}`);
    if (fs.existsSync(oldPath)) {
      try { fs.unlinkSync(oldPath); } catch { /* ignore */ }
    }
  }
  if (fs.existsSync(META_PATH)) {
    try { fs.unlinkSync(META_PATH); } catch { /* ignore */ }
  }

  await prisma.parametreSysteme.upsert({
    where: { cle: CLE_EN_TETE_PDF },
    create: {
      cle: CLE_EN_TETE_PDF,
      valeur: null,
      updatedById: userId || null,
    },
    update: {
      valeur: null,
      updatedById: userId || null,
    },
  });

  return { ok: true, status: await getEnTetePdfStatus() };
}

module.exports = {
  CLE_EN_TETE_PDF,
  DEFAULT_ASPECT,
  resolvePdfHeaderSync,
  getDefaultHeaderPath,
  getEnTetePdfStatus,
  setCustomEnTetePdf,
  restoreDefaultEnTetePdf,
  getImageDimensions,
};
