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

const MIN_TEXTE_DECISION = 10;
const MAX_TEXTE_DECISION = 1000;

function validateTexteDecision(texte, { label, obligatoire }) {
  if (!obligatoire) {
    return { valid: true, error: null };
  }

  if (!texte || typeof texte !== 'string') {
    return {
      valid: false,
      error: `${label} est obligatoire`,
    };
  }

  const trimmed = texte.trim();
  if (trimmed.length < MIN_TEXTE_DECISION) {
    return {
      valid: false,
      error: `${label} doit contenir au moins ${MIN_TEXTE_DECISION} caractères (actuellement: ${trimmed.length})`,
    };
  }

  if (trimmed.length > MAX_TEXTE_DECISION) {
    return {
      valid: false,
      error: `${label} ne peut pas dépasser ${MAX_TEXTE_DECISION} caractères (actuellement: ${trimmed.length})`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Valide le motif de rejet (obligatoire uniquement pour REJETE).
 */
const validateMotif = (verdict, motif) => {
  if (verdict !== 'REJETE') {
    return { valid: true, error: null };
  }

  return validateTexteDecision(motif, {
    label: 'Le motif de rejet',
    obligatoire: true,
  });
};

/**
 * Valide le commentaire sous réserve (obligatoire uniquement pour SOUS_RESERVE).
 */
const validateCommentaireSousReserve = (verdict, commentaireSousReserve) => {
  if (verdict !== 'SOUS_RESERVE') {
    return { valid: true, error: null };
  }

  return validateTexteDecision(commentaireSousReserve, {
    label: 'Le commentaire sous réserve',
    obligatoire: true,
  });
};

const { decodeHtmlEntities, sanitizeMotif, formatMotifForClient } = require('./motif.helper');

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
 * Valide et sanitise un verdict, son motif (rejet) et son commentaire sous réserve.
 */
const validateAndSanitizeVerdict = (verdict, motif, commentaireSousReserve = null) => {
  if (!validateVerdict(verdict)) {
    return {
      valid: false,
      error: 'Verdict invalide. Valeurs autorisées: VALIDE, REJETE, SOUS_RESERVE',
      sanitizedMotif: null,
      sanitizedCommentaireSousReserve: null,
    };
  }

  if (verdict === 'VALIDE') {
    return {
      valid: true,
      error: null,
      sanitizedMotif: null,
      sanitizedCommentaireSousReserve: null,
    };
  }

  const sousReserveTexte = commentaireSousReserve ?? (verdict === 'SOUS_RESERVE' ? motif : null);

  const motifValidation = validateMotif(verdict, motif);
  if (!motifValidation.valid) {
    return {
      valid: false,
      error: motifValidation.error,
      sanitizedMotif: null,
      sanitizedCommentaireSousReserve: null,
    };
  }

  const sousReserveValidation = validateCommentaireSousReserve(verdict, sousReserveTexte);
  if (!sousReserveValidation.valid) {
    return {
      valid: false,
      error: sousReserveValidation.error,
      sanitizedMotif: null,
      sanitizedCommentaireSousReserve: null,
    };
  }

  return {
    valid: true,
    error: null,
    sanitizedMotif: verdict === 'REJETE' && motif ? sanitizeMotif(motif) : null,
    sanitizedCommentaireSousReserve:
      verdict === 'SOUS_RESERVE' && sousReserveTexte ? sanitizeMotif(sousReserveTexte) : null,
  };
};

/**
 * Valide une décision du contrôleur (verdict + motif, y compris arbitrage divergent).
 */
const validateDecisionControleur = (
  dossier,
  decision,
  motif,
  commentaireSousReserve = null,
  commentaireArbitrage = null,
) => {
  const base = validateAndSanitizeVerdict(decision, motif, commentaireSousReserve);
  if (!base.valid) {
    return base;
  }

  const { isArbitrageDivergent } = require('./verdict-workflow.helper');

  if (isArbitrageDivergent(dossier?.verdict1, decision) && decision === 'VALIDE') {
    const explication = (commentaireArbitrage || motif || '').trim();
    const arbitrageValidation = validateTexteDecision(explication, {
      label: "L'explication d'arbitrage",
      obligatoire: true,
    });
    if (!arbitrageValidation.valid) {
      return {
        valid: false,
        error:
          "Lorsque votre décision diffère de celle de l'examinateur, une explication d'au moins 10 caractères est obligatoire.",
        sanitizedMotif: null,
        sanitizedCommentaireSousReserve: null,
        sanitizedCommentaireArbitrage: null,
      };
    }

    return {
      ...base,
      sanitizedCommentaireArbitrage: sanitizeMotif(explication),
    };
  }

  return {
    ...base,
    sanitizedCommentaireArbitrage: null,
  };
};

module.exports = {
  validateVerdict,
  validateMotif,
  validateCommentaireSousReserve,
  sanitizeMotif,
  formatMotifForClient,
  decodeHtmlEntities,
  validateUUID,
  validateEmail,
  validateParams,
  validateAndSanitizeVerdict,
  validateDecisionControleur,
};
