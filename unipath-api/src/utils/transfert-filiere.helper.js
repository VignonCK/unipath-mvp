/**
 * Transfert entre établissements privés — contrainte de niveau si même filière.
 *
 * - Autre filière → libre
 * - Même filière + passant (VALIDE) → niveau max = niveau antérieur + 1
 * - Même filière + redoublant → niveau max = niveau antérieur (pas de niveau supérieur)
 * - Même filière + EN_COURS → niveau max = niveau antérieur (prudent)
 *
 * Équivalence filière : filiereReferenceId (demande DGES) sinon nom normalisé + cycle (LICENCE/MASTER/AUTRE).
 */
const prisma = require('../prisma');
const { maxNiveauPourFiliere } = require('./passage-annee.helper');

function normalizeNomFiliere(nom) {
  return String(nom || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toFiliereIdentity(filiere) {
  if (!filiere) return null;
  return {
    id: filiere.id,
    nom: filiere.nom,
    nomNorm: normalizeNomFiliere(filiere.nom),
    niveauCycle: String(filiere.niveau || '').toUpperCase(),
    dureeAnnees: filiere.dureeAnnees,
    code: filiere.code,
    filiereReferenceId: filiere.demandeAjoutSource?.filiereReferenceId || null,
  };
}

function isSameFiliere(a, b) {
  if (!a || !b) return false;
  if (a.filiereReferenceId && b.filiereReferenceId && a.filiereReferenceId === b.filiereReferenceId) {
    return true;
  }
  if (a.nomNorm && a.nomNorm === b.nomNorm && a.niveauCycle && a.niveauCycle === b.niveauCycle) {
    return true;
  }
  return false;
}

async function loadFiliereIdentity(filiereId, client = prisma) {
  const filiere = await client.filiere.findUnique({
    where: { id: filiereId },
    select: {
      id: true,
      nom: true,
      code: true,
      niveau: true,
      dureeAnnees: true,
      etablissementId: true,
      demandeAjoutSource: { select: { filiereReferenceId: true } },
    },
  });
  return toFiliereIdentity(filiere);
}

/**
 * @returns {Promise<{
 *   constrained: boolean,
 *   niveauMax: number,
 *   niveauMin: number,
 *   niveauAnterieur: number|null,
 *   statutAnterieur: string|null,
 *   motif: string|null,
 *   message: string|null,
 *   etablissementSource: object|null,
 *   filiereSource: object|null,
 * }>}
 */
async function resolveContrainteNiveauTransfert({
  candidatId,
  filiereIdCible,
  etablissementIdCible,
  client = prisma,
}) {
  const cible = await loadFiliereIdentity(filiereIdCible, client);
  if (!cible) {
    return {
      constrained: false,
      niveauMax: 5,
      niveauMin: 1,
      niveauAnterieur: null,
      statutAnterieur: null,
      motif: null,
      message: null,
      etablissementSource: null,
      filiereSource: null,
    };
  }

  const maxCycle = maxNiveauPourFiliere(cible);
  const isMaster = cible.niveauCycle === 'MASTER' || String(cible.code || '').toUpperCase().endsWith('-M');
  const niveauMin = isMaster ? Math.max(1, 6 - (Number(cible.dureeAnnees) || 2)) : 1;

  const priors = await client.inscriptionAcademique.findMany({
    where: {
      candidatId,
      etablissementId: { not: etablissementIdCible },
      etablissement: { type: 'PRIVE' },
      statut: { in: ['VALIDE', 'REDOUBLANT', 'EN_COURS'] },
    },
    include: {
      filiere: {
        select: {
          id: true,
          nom: true,
          code: true,
          niveau: true,
          dureeAnnees: true,
          demandeAjoutSource: { select: { filiereReferenceId: true } },
        },
      },
      etablissement: { select: { id: true, nom: true } },
    },
    orderBy: [{ anneeAcademique: 'desc' }, { createdAt: 'desc' }],
  });

  const match = priors.find((ins) => isSameFiliere(cible, toFiliereIdentity(ins.filiere)));
  if (!match) {
    return {
      constrained: false,
      niveauMax: maxCycle,
      niveauMin,
      niveauAnterieur: null,
      statutAnterieur: null,
      motif: null,
      message: null,
      etablissementSource: null,
      filiereSource: null,
    };
  }

  const niveauAnterieur = Number(match.niveau);
  let niveauMax;
  let motif;
  let message;

  if (match.statut === 'VALIDE') {
    niveauMax = Math.min(niveauAnterieur + 1, maxCycle);
    motif = 'passant';
    message =
      `Pour la même filière après un passage à ${match.etablissement?.nom || 'un autre établissement'}, ` +
      `vous pouvez vous inscrire jusqu'au niveau ${niveauMax} (niveau suivant).`;
  } else if (match.statut === 'REDOUBLANT') {
    niveauMax = Math.min(niveauAnterieur, maxCycle);
    motif = 'redoublant';
    message =
      `Pour la même filière, en tant que redoublant à ${match.etablissement?.nom || 'un autre établissement'}, ` +
      `vous ne pouvez pas vous inscrire à un niveau supérieur au niveau ${niveauMax}.`;
  } else {
    niveauMax = Math.min(niveauAnterieur, maxCycle);
    motif = 'en_cours';
    message =
      `Vous avez déjà une inscription en cours dans cette filière à ${match.etablissement?.nom || 'un autre établissement'} ` +
      `(niveau ${niveauAnterieur}). Vous ne pouvez pas viser un niveau supérieur.`;
  }

  if (niveauMax < niveauMin) {
    niveauMax = niveauMin;
  }

  return {
    constrained: true,
    niveauMax,
    niveauMin,
    niveauAnterieur,
    statutAnterieur: match.statut,
    motif,
    message,
    etablissementSource: match.etablissement,
    filiereSource: {
      id: match.filiere?.id,
      nom: match.filiere?.nom,
      code: match.filiere?.code,
    },
  };
}

function assertNiveauTransfertAutorise(niveauDemande, contrainte) {
  const n = Number(niveauDemande);
  if (!Number.isFinite(n) || n < 1 || n > 5) {
    return { ok: false, error: 'Niveau invalide (attendu 1 a 5)' };
  }
  if (!contrainte) return { ok: true };
  if (n < contrainte.niveauMin) {
    return {
      ok: false,
      error: `Pour cette filière, le niveau minimum autorisé est ${contrainte.niveauMin}.`,
      contrainte,
    };
  }
  if (contrainte.constrained && n > contrainte.niveauMax) {
    return {
      ok: false,
      error: contrainte.message || `Niveau ${n} non autorisé (maximum ${contrainte.niveauMax}).`,
      contrainte,
    };
  }
  return { ok: true };
}

module.exports = {
  normalizeNomFiliere,
  isSameFiliere,
  resolveContrainteNiveauTransfert,
  assertNiveauTransfertAutorise,
};
