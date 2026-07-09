/**
 * Numéro d'inscription concours : {CODE}-{ANNEE}-{SEQ4}
 * Exemple : ENAM-2026-0001
 * Compteur séquentiel par concours (reset à chaque nouvelle année académique).
 */
const { getAnneeAcademique } = require('./matricule.helper');

const REJET_STATUTS = ['REJETE', 'REJETE_PAR_COMMISSION'];

function deriveSigleFromLibelleConcours(libelle = '') {
  const text = String(libelle).trim();
  if (!text) return 'CONV';

  const matchConcours = text.match(/Concours\s+(.+?)\s+20\d{2}/i);
  if (matchConcours?.[1]) {
    return normalizeCodeConcours(matchConcours[1]);
  }

  const firstWord = text.replace(/^concours\s*/i, '').split(/\s+/)[0] || 'CONV';
  return normalizeCodeConcours(firstWord);
}

function normalizeCodeConcours(value) {
  const code = String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
  return code || 'CONV';
}

function resolveCodeConcours(concours) {
  if (concours?.sigle) {
    return normalizeCodeConcours(concours.sigle);
  }
  return deriveSigleFromLibelleConcours(concours?.libelle);
}

function formatNumeroInscription(code, annee, sequence) {
  return `${code}-${annee}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Génère un numéro d'inscription dans une transaction Prisma (FOR UPDATE sur Concours).
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {string} concoursId
 */
async function genererNumeroInscriptionPourConcours(tx, concoursId) {
  const annee = getAnneeAcademique();

  const rows = await tx.$queryRaw`
    SELECT id, libelle, sigle, "inscriptionCompteur", "inscriptionCompteurAnnee"
    FROM "Concours"
    WHERE id = ${concoursId}::uuid
    FOR UPDATE
  `;

  const concours = rows[0];
  if (!concours) {
    throw new Error('Concours introuvable');
  }

  const code = resolveCodeConcours(concours);
  const compteur =
    concours.inscriptionCompteurAnnee === annee
      ? (concours.inscriptionCompteur || 0) + 1
      : 1;

  const numero = formatNumeroInscription(code, annee, compteur);

  await tx.concours.update({
    where: { id: concoursId },
    data: {
      inscriptionCompteur: compteur,
      inscriptionCompteurAnnee: annee,
      ...(!concours.sigle ? { sigle: code } : {}),
    },
  });

  return numero;
}

function isInscriptionActive(statut) {
  return statut && !REJET_STATUTS.includes(statut);
}

/**
 * Retourne le numéro d'inscription le plus récent parmi les inscriptions actives.
 */
function pickNumeroInscriptionRecent(inscriptions = []) {
  const actives = inscriptions
    .filter((ins) => ins?.numeroInscription && isInscriptionActive(ins.statut))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return actives[0]?.numeroInscription || null;
}

/** @deprecated Legacy — ne pas utiliser pour les nouvelles inscriptions */
async function genererNumeroInscriptionUnique() {
  throw new Error(
    'genererNumeroInscriptionUnique est obsolète. Utiliser genererNumeroInscriptionPourConcours(tx, concoursId).',
  );
}

module.exports = {
  deriveSigleFromLibelleConcours,
  normalizeCodeConcours,
  resolveCodeConcours,
  formatNumeroInscription,
  genererNumeroInscriptionPourConcours,
  pickNumeroInscriptionRecent,
  isInscriptionActive,
  genererNumeroInscriptionUnique,
};
