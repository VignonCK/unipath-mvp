/**
 * Constantes pour la configuration des pièces du dossier candidat
 */

/**
 * Liste des pièces prédéfinies disponibles dans le système
 */
const PIECES_PREDEFINIES = [
  {
    id: 'acte-naissance',
    nom: 'Acte de naissance',
    formatsDefaut: ['PDF'],
    description: 'Acte de naissance original ou copie certifiée'
  },
  {
    id: 'carte-identite',
    nom: "Carte d'identité",
    formatsDefaut: ['PDF', 'JPEG', 'PNG'],
    description: "Carte d'identité nationale valide"
  },
  {
    id: 'photo',
    nom: "Photo d'identité",
    formatsDefaut: ['JPEG', 'PNG'],
    description: '1 fichier image (JPEG ou PNG)',
  },
  {
    id: 'releve-notes',
    nom: 'Relevé de notes Bac',
    formatsDefaut: ['PDF'],
    description: 'Relevé de notes du baccalauréat'
  },
  {
    id: 'quittance',
    nom: 'Quittance de paiement',
    formatsDefaut: ['PDF'],
    description: 'Reçu de paiement des frais de participation',
    obligatoire: true  // Toujours obligatoire
  }
];

/**
 * Liste des formats de fichiers acceptés
 */
const FORMATS_DISPONIBLES = [
  { value: 'PDF', label: 'PDF', mimeType: 'application/pdf' },
  { value: 'JPEG', label: 'JPEG', mimeType: 'image/jpeg' },
  { value: 'PNG', label: 'PNG', mimeType: 'image/png' },
  { value: 'DOC', label: 'DOC', mimeType: 'application/msword' },
  { 
    value: 'DOCX', 
    label: 'DOCX', 
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  }
];

/**
 * Liste des séries scolaires valides
 */
const SERIES_VALIDES = ['A', 'B', 'C', 'D', 'E', 'F1', 'F2', 'F3', 'F4', 'G1', 'G2', 'G3', 'F', 'G'];

function normalizePieceNom(pieceId, nom) {
  const id = String(pieceId || '').trim();
  if (id === 'photo' || id === 'photo_identite') {
    return "Photo d'identité";
  }
  const predefined = PIECES_PREDEFINIES.find((p) => p.id === id);
  if (predefined?.nom) return predefined.nom;
  return String(nom || id)
    .replace(/\s*\(\s*\d+\s*exemplaires?\s*\)/gi, '')
    .trim() || id;
}

module.exports = {
  PIECES_PREDEFINIES,
  FORMATS_DISPONIBLES,
  SERIES_VALIDES,
  normalizePieceNom,
};
