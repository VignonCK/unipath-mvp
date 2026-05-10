/**
 * ✅ HELPER DE GÉNÉRATION DE MATRICULE
 * 
 * Génère des matricules uniques pour les candidats
 * Format: {SITE}-{ANNEE}-{NUMERO}
 * Exemple: UnP-2026-000001
 */

const prisma = require('../prisma');

/**
 * Configuration des codes de site
 * Peut être étendu pour d'autres établissements
 */
const SITE_CODES = {
  DEFAULT: 'UnP', // UniPath
  // Ajouter d'autres codes si nécessaire
  // UAC: 'UAC',
  // EPAC: 'EPAC',
  // ENS: 'ENS',
};

/**
 * Obtient le code du site depuis les variables d'environnement
 * @returns {string} Code du site (ex: 'UnP')
 */
function getSiteCode() {
  return process.env.SITE_CODE || SITE_CODES.DEFAULT;
}

/**
 * Obtient l'année académique actuelle
 * @returns {string} Année (ex: '2026')
 */
function getAnneeAcademique() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 0-11 -> 1-12
  
  // Si on est entre janvier et août, on est dans l'année académique précédente
  // Exemple: Janvier 2026 = année académique 2025-2026
  // Septembre 2026 = année académique 2026-2027
  return month >= 9 ? year + 1 : year;
}

/**
 * Génère un numéro séquentiel pour le matricule
 * @param {string} siteCode - Code du site
 * @param {number} annee - Année académique
 * @returns {Promise<string>} Numéro formaté (ex: '000001')
 */
async function genererNumeroSequentiel(siteCode, annee) {
  try {
    // Compter le nombre de candidats avec un matricule commençant par {SITE}-{ANNEE}
    const prefix = `${siteCode}-${annee}-`;
    
    const count = await prisma.candidat.count({
      where: {
        matricule: {
          startsWith: prefix
        }
      }
    });

    // Incrémenter et formater sur 6 chiffres
    const numero = count + 1;
    return numero.toString().padStart(6, '0');
  } catch (error) {
    console.error('Erreur génération numéro séquentiel:', error);
    // En cas d'erreur, utiliser un timestamp
    return Date.now().toString().slice(-6);
  }
}

/**
 * Génère un matricule unique pour un candidat
 * Format: {SITE}-{ANNEE}-{NUMERO}
 * Exemple: UnP-2026-000001
 * 
 * @returns {Promise<string>} Matricule généré
 */
async function genererMatricule() {
  const siteCode = getSiteCode();
  const annee = getAnneeAcademique();
  const numero = await genererNumeroSequentiel(siteCode, annee);
  
  const matricule = `${siteCode}-${annee}-${numero}`;
  
  console.log(`✅ Matricule généré: ${matricule}`);
  return matricule;
}

/**
 * Vérifie si un matricule existe déjà
 * @param {string} matricule - Matricule à vérifier
 * @returns {Promise<boolean>} True si le matricule existe
 */
async function matriculeExiste(matricule) {
  const count = await prisma.candidat.count({
    where: { matricule }
  });
  return count > 0;
}

/**
 * Génère un matricule unique (avec vérification)
 * @returns {Promise<string>} Matricule unique garanti
 */
async function genererMatriculeUnique() {
  let matricule;
  let tentatives = 0;
  const maxTentatives = 10;

  do {
    matricule = await genererMatricule();
    tentatives++;

    if (tentatives >= maxTentatives) {
      // Fallback: ajouter un suffixe aléatoire
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      matricule = `${matricule}-${random}`;
      console.warn(`⚠️ Fallback matricule avec suffixe: ${matricule}`);
      break;
    }
  } while (await matriculeExiste(matricule));

  return matricule;
}

/**
 * Parse un matricule pour extraire ses composants
 * @param {string} matricule - Matricule à parser (ex: 'UnP-2026-000001')
 * @returns {Object} { siteCode, annee, numero }
 */
function parseMatricule(matricule) {
  const parts = matricule.split('-');
  
  if (parts.length >= 3) {
    return {
      siteCode: parts[0],
      annee: parseInt(parts[1]),
      numero: parseInt(parts[2]),
      isValid: true
    };
  }

  return {
    siteCode: null,
    annee: null,
    numero: null,
    isValid: false
  };
}

/**
 * Valide le format d'un matricule
 * @param {string} matricule - Matricule à valider
 * @returns {boolean} True si le format est valide
 */
function validerFormatMatricule(matricule) {
  // Format: XXX-YYYY-NNNNNN ou XXX-YYYY-NNNNNN-XXXX (avec suffixe optionnel)
  const regex = /^[A-Za-z]{2,4}-\d{4}-\d{6}(-[A-Z0-9]{4})?$/;
  return regex.test(matricule);
}

module.exports = {
  genererMatricule,
  genererMatriculeUnique,
  matriculeExiste,
  parseMatricule,
  validerFormatMatricule,
  getSiteCode,
  getAnneeAcademique,
  SITE_CODES,
};
