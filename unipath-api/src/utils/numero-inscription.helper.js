/**
 * Numéro d'inscription concours (n° de table) : {CODE}-{ANNEE}-{SEQ4}
 * Exemple : ENAM-2026-0001
 *
 * Attribution groupée alphabétique (VALIDE sans numéro), puis APPEND
 * pour les validations tardives (dernier compteur + 1).
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

function compareCandidatsAlpha(a, b) {
  const nomA = String(a.candidat?.nom || '').localeCompare(String(b.candidat?.nom || ''), 'fr', {
    sensitivity: 'base',
  });
  if (nomA !== 0) return nomA;
  return String(a.candidat?.prenom || '').localeCompare(String(b.candidat?.prenom || ''), 'fr', {
    sensitivity: 'base',
  });
}

/**
 * Verrouille le concours et retourne le prochain numéro (incrémente le compteur).
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {string} concoursId
 */
async function genererNumeroInscriptionPourConcours(tx, concoursId) {
  const annee = getAnneeAcademique();

  // Concours.id est de type TEXT en base (pas uuid) — ne pas caster en ::uuid
  const rows = await tx.$queryRawUnsafe(
    `SELECT id, libelle, sigle, "inscriptionCompteur", "inscriptionCompteurAnnee"
     FROM "Concours"
     WHERE id = $1
     FOR UPDATE`,
    concoursId,
  );

  const concours = rows[0];
  if (!concours) {
    throw new Error('Concours introuvable');
  }

  const code = resolveCodeConcours(concours);
  const compteurAnnee = Number(concours.inscriptionCompteurAnnee);
  const compteur =
    compteurAnnee === annee
      ? (Number(concours.inscriptionCompteur) || 0) + 1
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

/**
 * Attribue les n° de table aux dossiers VALIDE sans numéro, par ordre alphabétique
 * (nom, prénom). Les inscriptions déjà numérotées sont ignorées (APPEND).
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {string} concoursId
 * @returns {Promise<Array<{ inscriptionId: string, candidatId: string, nom: string, prenom: string, numeroInscription: string }>>}
 */
async function attribuerNumerosTableParConcours(tx, concoursId) {
  const concours = await tx.concours.findUnique({
    where: { id: concoursId },
    select: { id: true, libelle: true },
  });
  if (!concours) {
    throw new Error('Concours introuvable');
  }

  const eligibles = await tx.inscription.findMany({
    where: {
      concoursId,
      numeroInscription: null,
      dossierInscription: { statut: 'VALIDE' },
    },
    include: {
      candidat: { select: { id: true, nom: true, prenom: true } },
    },
  });

  eligibles.sort(compareCandidatsAlpha);

  const attribues = [];
  for (const inscription of eligibles) {
    const numeroInscription = await genererNumeroInscriptionPourConcours(tx, concoursId);
    await tx.inscription.update({
      where: { id: inscription.id },
      data: { numeroInscription },
    });
    attribues.push({
      inscriptionId: inscription.id,
      candidatId: inscription.candidat.id,
      nom: inscription.candidat.nom,
      prenom: inscription.candidat.prenom,
      numeroInscription,
    });
  }

  return attribues;
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
    'genererNumeroInscriptionUnique est obsolète. Utiliser attribuerNumerosTableParConcours(tx, concoursId).',
  );
}

module.exports = {
  deriveSigleFromLibelleConcours,
  normalizeCodeConcours,
  resolveCodeConcours,
  formatNumeroInscription,
  genererNumeroInscriptionPourConcours,
  attribuerNumerosTableParConcours,
  pickNumeroInscriptionRecent,
  isInscriptionActive,
  genererNumeroInscriptionUnique,
  compareCandidatsAlpha,
};
