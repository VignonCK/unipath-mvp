// src/utils/validation.js

/**
 * Valide qu'un verdict est une valeur valide de l'enum Verdict
 * @param {string} verdict - Le verdict à valider
 * @returns {boolean} True si le verdict est valide
 */
const validateVerdict = (verdict) => {
  const verdictsValides = ['VALIDE', 'REJETE', 'SOUS_RESERVE'];
  return verdictsValides.includes(verdict);
};

/**
 * Valide qu'un motif est fourni et valide pour les verdicts REJETE et SOUS_RESERVE
 * @param {string} verdict - Le verdict
 * @param {string} motif - Le motif à valider
 * @returns {{valid: boolean, error: string|null}} Résultat de la validation
 */
const validateMotif = (verdict, motif) => {
  // Le motif est obligatoire pour REJETE et SOUS_RESERVE
  if (verdict === 'REJETE' || verdict === 'SOUS_RESERVE') {
    if (!motif || typeof motif !== 'string') {
      return {
        valid: false,
        error: `Le motif est obligatoire pour un ${verdict === 'REJETE' ? 'rejet' : 'validation sous réserve'}`,
      };
    }

    // Le motif doit contenir au moins 10 caractères
    const motifTrimmed = motif.trim();
    if (motifTrimmed.length < 10) {
      return {
        valid: false,
        error: `Le motif doit contenir au moins 10 caractères (actuellement: ${motifTrimmed.length})`,
      };
    }

    // Le motif ne doit pas dépasser 1000 caractères
    if (motifTrimmed.length > 1000) {
      return {
        valid: false,
        error: `Le motif ne peut pas dépasser 1000 caractères (actuellement: ${motifTrimmed.length})`,
      };
    }
  }

  return { valid: true, error: null };
};

/**
 * Sanitise un motif pour éviter les injections XSS
 * Échappe les caractères HTML dangereux
 * @param {string} motif - Le motif à sanitiser
 * @returns {string} Le motif sanitisé
 */
const sanitizeMotif = (motif) => {
  if (!motif || typeof motif !== 'string') {
    return '';
  }

  return motif
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Valide qu'un identifiant est un UUID valide
 * @param {string} id - L'identifiant à valider
 * @returns {boolean} True si l'identifiant est un UUID valide
 */
const validateUUID = (id) => {
  if (!id || typeof id !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Valide une adresse email
 * @param {string} email - Email à valider
 * @returns {boolean}
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Validation simple et robuste pour les besoins applicatifs
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/**
 * Vérifie la présence de paramètres obligatoires
 * @param {Object} data - Objet à valider
 * @param {Array<string>} requiredParams - Liste des champs obligatoires
 */
const validateParams = (data, requiredParams = []) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Data is required');
  }

  for (const param of requiredParams) {
    const value = data[param];
    if (value === undefined || value === null || value === '') {
      throw new Error(`${param} is required`);
    }
  }
};

/**
 * Valide et sanitise un verdict et son motif
 * @param {string} verdict - Le verdict à valider
 * @param {string} motif - Le motif à valider et sanitiser
 * @returns {{valid: boolean, error: string|null, sanitizedMotif: string}} Résultat de la validation
 */
const validateAndSanitizeVerdict = (verdict, motif) => {
  // Valider le verdict
  if (!validateVerdict(verdict)) {
    return {
      valid: false,
      error: 'Verdict invalide. Valeurs autorisées: VALIDE, REJETE, SOUS_RESERVE',
      sanitizedMotif: null,
    };
  }

  // Valider le motif
  const motifValidation = validateMotif(verdict, motif);
  if (!motifValidation.valid) {
    return {
      valid: false,
      error: motifValidation.error,
      sanitizedMotif: null,
    };
  }

  // Sanitiser le motif
  const sanitizedMotif = motif ? sanitizeMotif(motif) : null;

  return {
    valid: true,
    error: null,
    sanitizedMotif,
  };
};

module.exports = {
  validateVerdict,
  validateMotif,
  sanitizeMotif,
  validateUUID,
  validateEmail,
  validateParams,
  validateAndSanitizeVerdict,
};
