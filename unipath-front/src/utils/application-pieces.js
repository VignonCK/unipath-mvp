import { resolvePublicAssetUrl } from '../services/api';

const DOSSIER_FIELD_BY_CODE = {
  acte_naissance: 'acteNaissance',
  'acte-naissance': 'acteNaissance',
  acteNaissance: 'acteNaissance',
  carte_identite: 'carteIdentite',
  'carte-identite': 'carteIdentite',
  carteIdentite: 'carteIdentite',
  photo_identite: 'photo',
  'photo-identite': 'photo',
  photo: 'photo',
  releve_bac: 'releve',
  'releve-notes': 'releve',
  releve: 'releve',
};

const DOSSIER_LABELS = {
  acteNaissance: 'Acte de naissance',
  carteIdentite: "Carte d'identité",
  photo: "Photo d'identité",
  releve: 'Relevé de notes',
};

/** Transforme un chemin stocké en URL absolue ouvrable (API /uploads). */
export function resolvePieceOpenUrl(rawPath) {
  if (!rawPath) return null;
  const s = String(rawPath).trim();
  if (!s) return null;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.includes('uploads/') || s.startsWith('/uploads/')) {
    return resolvePublicAssetUrl(s.startsWith('/') ? s : `/${s}`);
  }
  return resolvePublicAssetUrl(`/uploads/dossiers-candidats/${s.replace(/^\//, '')}`);
}

/** Fusionne documents application + pièces dossier personnel. */
export function buildUnifiedPieces(application) {
  const dossier = application?.candidat?.dossier || {};
  const docs = Array.isArray(application?.documents) ? application.documents : [];
  const seenDossierFields = new Set();
  const pieces = [];

  for (const doc of docs) {
    const dossierField = DOSSIER_FIELD_BY_CODE[doc.code] || null;
    if (dossierField) seenDossierFields.add(dossierField);

    const rawUrl = doc.documentUrl || (dossierField ? dossier[dossierField] : null) || null;
    pieces.push({
      key: doc.id || doc.code,
      label: doc.label || DOSSIER_LABELS[dossierField] || doc.code,
      status: doc.status,
      openUrl: resolvePieceOpenUrl(rawUrl),
    });
  }

  for (const [field, label] of Object.entries(DOSSIER_LABELS)) {
    if (seenDossierFields.has(field)) continue;
    const rawUrl = dossier[field];
    if (!rawUrl) continue;
    pieces.push({
      key: `dossier-${field}`,
      label,
      status: 'PROVIDED',
      openUrl: resolvePieceOpenUrl(rawUrl),
    });
  }

  return pieces;
}
