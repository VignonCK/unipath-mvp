const CHAMPS_PROFIL_REQUIS = ['telephone', 'dateNaiss', 'lieuNaiss'];

/** piece.id → champ Dossier Prisma (aligné avec le frontend). */
const PIECE_ID_TO_DOSSIER = {
  acteNaissance: 'acteNaissance',
  'acte-naissance': 'acteNaissance',
  acte_naissance: 'acteNaissance',
  carteIdentite: 'carteIdentite',
  'carte-identite': 'carteIdentite',
  carte_identite: 'carteIdentite',
  photo: 'photo',
  photo_identite: 'photo',
  releve: 'releve',
  'releve-notes': 'releve',
  releve_bac: 'releve',
};

function getConcoursPieces(concours) {
  const raw = concours?.piecesRequises?.pieces;
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => (typeof p === 'string' ? { id: p, nom: p } : p));
}

function isPieceLieeDossierPersonnel(piece) {
  if (piece.sourceDossier) return true;
  return !!PIECE_ID_TO_DOSSIER[piece.id];
}

/**
 * Pièces requises pour soumettre : quittance + pièces personnalisées du concours.
 * Les pièces liées au dossier personnel (Mon compte) ne bloquent pas la soumission.
 */
function getPiecesPourSoumission(concours) {
  return getConcoursPieces(concours).filter(
    (p) => p.id === 'quittance' || !isPieceLieeDossierPersonnel(p)
  );
}

function isPieceFournie(inscription, piece) {
  const dossier = inscription.candidat?.dossier;
  const di = inscription.dossierInscription;
  const id = piece.id;

  if (id === 'quittance') return !!di?.quittanceUrl;

  const sourceDossier = piece.sourceDossier || PIECE_ID_TO_DOSSIER[id];
  if (sourceDossier) return !!dossier?.[sourceDossier];

  return !!di?.piecesExtras?.[id];
}

/**
 * Complétude pour soumission : quittance + pièces personnalisées du concours.
 */
function computeInscriptionCompletude(inscription) {
  const piecesSoumission = getPiecesPourSoumission(inscription.concours);
  const total = piecesSoumission.length;
  const presentes = piecesSoumission.filter((p) => isPieceFournie(inscription, p)).length;
  const pourcentage = total > 0 ? Math.round((presentes / total) * 100) : 0;
  const piecesManquantes = piecesSoumission
    .filter((p) => !isPieceFournie(inscription, p))
    .map((p) => p.nom || p.id);

  return {
    total,
    presentes,
    pourcentage,
    estComplet: total > 0 && presentes === total,
    piecesManquantes,
  };
}

function profilCandidatComplet(candidat) {
  if (!candidat) return false;
  return CHAMPS_PROFIL_REQUIS.every((c) => candidat[c]);
}

module.exports = {
  CHAMPS_PROFIL_REQUIS,
  computeInscriptionCompletude,
  profilCandidatComplet,
  getPiecesPourSoumission,
};
