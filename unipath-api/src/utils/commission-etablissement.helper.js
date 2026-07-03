const prisma = require('../prisma');

const LIMITES_SOUS_ROLE = {
  EXAMINATEUR: 2,
  CONTROLEUR: 1,
};

async function getEtablissementPublic(etablissementId) {
  const etablissement = await prisma.etablissement.findUnique({
    where: { id: etablissementId },
    select: { id: true, nom: true, ville: true, type: true },
  });

  if (!etablissement) {
    return { error: 'Établissement non trouvé', status: 404 };
  }

  if (etablissement.type !== 'PUBLIC') {
    return {
      error: 'La commission ne peut être rattachée qu\'à un établissement public.',
      status: 400,
    };
  }

  return { etablissement };
}

async function resolveCommissionScope(userId) {
  const membre = await prisma.membreCommission.findUnique({
    where: { id: userId },
    select: { etablissementId: true, sousRole: true },
  });

  if (!membre?.etablissementId) {
    return null;
  }

  const concours = await prisma.concours.findMany({
    where: { etablissementId: membre.etablissementId },
    select: { id: true },
  });

  return {
    etablissementId: membre.etablissementId,
    concoursIds: concours.map((c) => c.id),
  };
}

function applyConcoursScope(where = {}, concoursIds) {
  if (concoursIds === null || concoursIds === undefined) {
    return where;
  }

  const inscriptionScope =
    concoursIds.length === 0
      ? { concoursId: { in: [] } }
      : { concoursId: { in: concoursIds } };

  if (where.inscription) {
    return {
      ...where,
      inscription: { ...where.inscription, ...inscriptionScope },
    };
  }

  return { ...where, inscription: inscriptionScope };
}

async function assertDossierDansScope(dossierInscriptionId, concoursIds) {
  if (concoursIds === null || concoursIds === undefined) {
    return true;
  }

  if (concoursIds.length === 0) {
    return false;
  }

  const dossier = await prisma.dossierInscription.findUnique({
    where: { id: dossierInscriptionId },
    select: { inscription: { select: { concoursId: true } } },
  });

  if (!dossier) {
    return false;
  }

  return concoursIds.includes(dossier.inscription.concoursId);
}

module.exports = {
  LIMITES_SOUS_ROLE,
  getEtablissementPublic,
  resolveCommissionScope,
  applyConcoursScope,
  assertDossierDansScope,
};
