const prisma = require('../prisma');

async function getConcoursPublic(concoursId) {
  const concours = await prisma.concours.findUnique({
    where: { id: concoursId },
    select: {
      id: true,
      libelle: true,
      sigle: true,
      etablissementId: true,
      etablissement: true,
      etudeCloturee: true,
      etudeClotureeAt: true,
      etablissementOrganisateur: {
        select: { id: true, nom: true, ville: true, type: true },
      },
    },
  });

  if (!concours) {
    return { error: 'Concours non trouvé', status: 404 };
  }

  const etab = concours.etablissementOrganisateur;
  if (etab && etab.type !== 'PUBLIC') {
    return {
      error: 'La commission ne peut être rattachée qu\'à un concours d\'établissement public.',
      status: 400,
    };
  }

  return {
    concours: {
      id: concours.id,
      libelle: concours.libelle,
      sigle: concours.sigle,
      etablissementId: concours.etablissementId,
      etablissementNom: etab?.nom || concours.etablissement || null,
      etablissement: etab || null,
      etudeCloturee: Boolean(concours.etudeCloturee),
      etudeClotureeAt: concours.etudeClotureeAt || null,
    },
  };
}

/**
 * Deny-by-default : sans concoursId → null (à traiter en 403).
 * @returns {{ concoursId: string, etablissementId: string|null } | null}
 */
async function resolveCommissionScope(userId) {
  const membre = await prisma.membreCommission.findUnique({
    where: { id: userId },
    select: { concoursId: true, etablissementId: true, sousRole: true },
  });

  if (!membre?.concoursId) {
    return null;
  }

  return {
    concoursId: membre.concoursId,
    etablissementId: membre.etablissementId || null,
  };
}

/**
 * Applique le filtre concours. null/undefined → aucun dossier (deny-by-default).
 */
function applyConcoursScope(where = {}, concoursId) {
  const inscriptionScope =
    !concoursId
      ? { concoursId: { in: [] } }
      : { concoursId };

  if (where.inscription) {
    return {
      ...where,
      inscription: { ...where.inscription, ...inscriptionScope },
    };
  }

  return { ...where, inscription: inscriptionScope };
}

async function assertDossierDansScope(dossierInscriptionId, concoursId) {
  if (!concoursId) {
    return false;
  }

  const dossier = await prisma.dossierInscription.findUnique({
    where: { id: dossierInscriptionId },
    select: { inscription: { select: { concoursId: true } } },
  });

  if (!dossier?.inscription?.concoursId) {
    return false;
  }

  return dossier.inscription.concoursId === concoursId;
}

module.exports = {
  getConcoursPublic,
  resolveCommissionScope,
  applyConcoursScope,
  assertDossierDansScope,
};
