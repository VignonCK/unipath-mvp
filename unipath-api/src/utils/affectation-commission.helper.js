const prisma = require('../prisma');

/**
 * IDs des concours auxquels le membre est affecté pour un rôle donné.
 * @param {'EXAMINATEUR'|'CONTROLEUR'} roleAffectation
 */
async function getConcoursIdsAffectes(membreId, roleAffectation) {
  const rows = await prisma.affectationCommissionConcours.findMany({
    where: {
      membreCommissionId: membreId,
      roleAffectation,
    },
    select: { concoursId: true },
  });
  return rows.map((r) => r.concoursId);
}

/**
 * Filtre concoursID pour les listes dossiers.
 * - Si le membre a au moins une affectation pour ce rôle → uniquement ces concours.
 * - Sinon (pas encore d'affectations) → aucun concours (liste vide),
 *   sauf si aucune affectation n'existe du tout pour ce rôle (phase transition) :
 *   alors comportement ouvert (tous les concours en étude).
 */
async function resolveConcoursFilterForMembre(membreId, roleAffectation, concoursIdQuery) {
  const assigned = await getConcoursIdsAffectes(membreId, roleAffectation);

  if (assigned.length > 0) {
    if (concoursIdQuery) {
      if (!assigned.includes(concoursIdQuery)) {
        return { concoursIds: [], forbidden: true };
      }
      return { concoursIds: [concoursIdQuery], forbidden: false };
    }
    return { concoursIds: assigned, forbidden: false };
  }

  // Transition : si aucune affectation n'existe encore en base pour ce rôle, ne pas bloquer
  const anyGlobal = await prisma.affectationCommissionConcours.count({
    where: { roleAffectation },
  });
  if (anyGlobal === 0) {
    return {
      concoursIds: concoursIdQuery ? [concoursIdQuery] : null,
      forbidden: false,
      openMode: true,
    };
  }

  return { concoursIds: [], forbidden: false };
}

function applyConcoursIdsToWhere(inscriptionConcoursWhere, concoursIds) {
  if (concoursIds == null) return inscriptionConcoursWhere;
  return {
    ...inscriptionConcoursWhere,
    id: { in: concoursIds },
  };
}

/**
 * Le membre est-il autorisé à agir sur un concours pour un rôle donné ?
 * - true s'il possède une affectation (membre, concours, rôle)
 * - true en "openMode" de transition : aucune affectation de ce rôle n'existe encore en base
 */
async function membreEstAffecte(membreId, concoursId, roleAffectation) {
  if (!membreId || !concoursId) return false;

  const aff = await prisma.affectationCommissionConcours.findFirst({
    where: { membreCommissionId: membreId, concoursId, roleAffectation },
    select: { id: true },
  });
  if (aff) return true;

  const anyGlobal = await prisma.affectationCommissionConcours.count({
    where: { roleAffectation },
  });
  return anyGlobal === 0;
}

/**
 * Liste des concours affectés au membre, tous rôles confondus,
 * avec le rôle par concours ('EXAMINATEUR' | 'CONTROLEUR').
 */
async function getConcoursDuMembre(membreId) {
  const rows = await prisma.affectationCommissionConcours.findMany({
    where: { membreCommissionId: membreId },
    select: {
      roleAffectation: true,
      concours: {
        select: {
          id: true,
          libelle: true,
          etablissement: true,
          code: true,
          dateDebutEtudeDossiers: true,
          dateFinEtudeDossiers: true,
          etudeDossiersClotureeAt: true,
        },
      },
    },
  });

  return rows
    .filter((r) => r.concours)
    .map((r) => ({
      role: r.roleAffectation,
      concours: r.concours,
    }));
}

module.exports = {
  getConcoursIdsAffectes,
  resolveConcoursFilterForMembre,
  applyConcoursIdsToWhere,
  membreEstAffecte,
  getConcoursDuMembre,
};
