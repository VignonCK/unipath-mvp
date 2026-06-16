/**
 * Helpers partagés pour le calcul de complétude d'un dossier d'inscription.
 *
 * Les pièces d'un concours sont stockées dans `concours.piecesRequises.pieces`
 * (tableau d'objets { id, nom, formats, ... }). On en déduit :
 *  - les pièces de base (issues du dossier personnel du candidat)
 *  - la quittance (gérée séparément)
 *  - les pièces "extra" propres au concours (tout le reste)
 *
 * Les pièces extra sont indexées par `id` dans `dossierInscription.piecesExtras`
 * (cohérent avec le frontend `DetailConcours.jsx`).
 */

const PIECES_BASE = ['acteNaissance', 'carteIdentite', 'photo', 'releve'];

/**
 * Retourne la liste des pièces extra configurées par le concours,
 * en excluant les pièces de base et la quittance.
 * @param {Object} concours
 * @returns {Array<{ id: string, nom?: string, obligatoire?: boolean }>}
 */
const getPiecesExtrasConfig = (concours) => {
  const pieces = concours?.piecesRequises?.pieces;
  if (!Array.isArray(pieces)) return [];
  return pieces
    .map((p) => (typeof p === 'string' ? { id: p, nom: p } : p))
    .filter((p) => {
      const id = p?.id;
      return id && !PIECES_BASE.includes(id) && id !== 'quittance';
    });
};

module.exports = {
  PIECES_BASE,
  getPiecesExtrasConfig,
};
