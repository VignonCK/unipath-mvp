/**
 * Fonctions utilitaires de validation pour la configuration des concours
 */

const { SERIES_VALIDES, FORMATS_DISPONIBLES } = require('../constants/pieces.constants');

/**
 * Valide les dates de dépôt de dossier
 * @param {Date|string} dateDebut - Date de début de dépôt
 * @param {Date|string} dateFin - Date de fin de dépôt
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateDatesDepot(dateDebut, dateFin) {
  if (!dateDebut || !dateFin) {
    return {
      valid: false,
      error: 'Les dates de début et de fin de dépôt sont obligatoires'
    };
  }

  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);

  if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
    return {
      valid: false,
      error: 'Les dates de dépôt sont invalides'
    };
  }

  if (fin <= debut) {
    return {
      valid: false,
      error: 'La date de fin de dépôt doit être postérieure à la date de début de dépôt'
    };
  }

  return { valid: true };
}

/**
 * Valide les dates de composition
 * @param {Date|string} dateDebut - Date de début de composition
 * @param {Date|string} dateFin - Date de fin de composition
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateDatesComposition(dateDebut, dateFin) {
  if (!dateDebut || !dateFin) {
    return {
      valid: false,
      error: 'Les dates de début et de fin de composition sont obligatoires'
    };
  }

  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);

  if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
    return {
      valid: false,
      error: 'Les dates de composition sont invalides'
    };
  }

  if (fin <= debut) {
    return {
      valid: false,
      error: 'La date de fin de composition doit être postérieure à la date de début de composition'
    };
  }

  return { valid: true };
}

/**
 * Valide la cohérence entre les dates de dépôt et de composition
 * @param {Date|string} dateFinDepot - Date de fin de dépôt
 * @param {Date|string} dateDebutComposition - Date de début de composition
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateDatesCoherence(dateFinDepot, dateDebutComposition) {
  if (!dateFinDepot || !dateDebutComposition) {
    return {
      valid: false,
      error: 'Les dates de fin de dépôt et de début de composition sont obligatoires'
    };
  }

  const finDepot = new Date(dateFinDepot);
  const debutCompo = new Date(dateDebutComposition);

  if (isNaN(finDepot.getTime()) || isNaN(debutCompo.getTime())) {
    return {
      valid: false,
      error: 'Les dates sont invalides'
    };
  }

  if (debutCompo <= finDepot) {
    return {
      valid: false,
      error: 'La date de début de composition doit être postérieure à la date de fin de dépôt'
    };
  }

  return { valid: true };
}

/**
 * Valide les séries scolaires acceptées
 * @param {string[]} seriesAcceptees - Liste des séries acceptées
 * @returns {Object} { valid: boolean, error?: string, invalidSeries?: string[] }
 */
function validateSeries(seriesAcceptees) {
  if (!seriesAcceptees || !Array.isArray(seriesAcceptees)) {
    return {
      valid: false,
      error: 'Les séries acceptées doivent être un tableau'
    };
  }

  if (seriesAcceptees.length === 0) {
    // Si aucune série n'est spécifiée, toutes les séries sont acceptées par défaut
    return { valid: true };
  }

  const seriesInvalides = seriesAcceptees.filter(s => !SERIES_VALIDES.includes(s));
  
  if (seriesInvalides.length > 0) {
    return {
      valid: false,
      error: `Séries invalides : ${seriesInvalides.join(', ')}`,
      invalidSeries: seriesInvalides
    };
  }

  return { valid: true };
}

/**
 * Valide la configuration des pièces requises
 * @param {Object} piecesRequises - Configuration des pièces (format: { pieces: [...] })
 * @returns {Object} { valid: boolean, error?: string }
 */
function validatePiecesRequises(piecesRequises) {
  if (!piecesRequises || typeof piecesRequises !== 'object') {
    return {
      valid: false,
      error: 'La configuration des pièces est invalide'
    };
  }

  const pieces = piecesRequises.pieces || piecesRequises;
  
  if (!Array.isArray(pieces)) {
    return {
      valid: false,
      error: 'Les pièces requises doivent être un tableau'
    };
  }

  if (pieces.length === 0) {
    return {
      valid: false,
      error: 'Au moins une pièce doit être configurée'
    };
  }

  // Vérifier que la quittance est présente
  const hasQuittance = pieces.some(p => p.id === 'quittance');
  if (!hasQuittance) {
    return {
      valid: false,
      error: 'La quittance de paiement est obligatoire'
    };
  }

  // Valider chaque pièce
  const formatsValides = FORMATS_DISPONIBLES.map(f => f.value);
  
  for (const piece of pieces) {
    // Vérifier que la pièce a un nom
    if (!piece.nom || typeof piece.nom !== 'string' || piece.nom.trim() === '') {
      return {
        valid: false,
        error: 'Chaque pièce doit avoir un nom valide'
      };
    }

    // Vérifier que la pièce a des formats
    if (!piece.formats || !Array.isArray(piece.formats) || piece.formats.length === 0) {
      return {
        valid: false,
        error: `La pièce "${piece.nom}" doit avoir au moins un format accepté`
      };
    }

    // Vérifier que les formats sont valides
    const formatsInvalides = piece.formats.filter(f => !formatsValides.includes(f));
    if (formatsInvalides.length > 0) {
      return {
        valid: false,
        error: `Formats invalides pour "${piece.nom}" : ${formatsInvalides.join(', ')}`
      };
    }
  }

  return { valid: true };
}

module.exports = {
  validateDatesDepot,
  validateDatesComposition,
  validateDatesCoherence,
  validateSeries,
  validatePiecesRequises
};
