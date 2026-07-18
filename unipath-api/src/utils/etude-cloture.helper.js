const prisma = require('../prisma');

const ETUDE_CLOTUREE_MESSAGE = "L'étude des dossiers est clôturée pour ce concours";
const ETUDE_CLOTUREE_CODE = 'ETUDE_CLOTUREE';

function assertEtudeOuverteFromConcours(concours) {
  if (concours?.etudeCloturee) {
    return {
      ok: false,
      status: 403,
      error: ETUDE_CLOTUREE_MESSAGE,
      code: ETUDE_CLOTUREE_CODE,
    };
  }
  return { ok: true };
}

async function assertEtudeOuvertePourConcours(concoursId, prismaClient = prisma) {
  if (!concoursId) {
    return { ok: false, status: 400, error: 'concoursId requis' };
  }

  const concours = await prismaClient.concours.findUnique({
    where: { id: concoursId },
    select: { id: true, etudeCloturee: true, etudeClotureeAt: true },
  });

  if (!concours) {
    return { ok: false, status: 404, error: 'Concours non trouvé' };
  }

  const check = assertEtudeOuverteFromConcours(concours);
  if (!check.ok) return check;
  return { ok: true, concours };
}

/**
 * Bloque les modifications commission si l'étude du concours est clôturée.
 * @param {string} dossierInscriptionId
 * @param {{ inscription?: { concoursId?: string, concours?: { etudeCloturee?: boolean } } } | null} [dossierPrecharge]
 */
async function assertEtudeOuvertePourDossier(dossierInscriptionId, dossierPrecharge = null, prismaClient = prisma) {
  const concoursPrecharge = dossierPrecharge?.inscription?.concours;
  if (concoursPrecharge && Object.prototype.hasOwnProperty.call(concoursPrecharge, 'etudeCloturee')) {
    return assertEtudeOuverteFromConcours(concoursPrecharge);
  }

  const concoursId = dossierPrecharge?.inscription?.concoursId;
  if (concoursId) {
    return assertEtudeOuvertePourConcours(concoursId, prismaClient);
  }

  const dossier = await prismaClient.dossierInscription.findUnique({
    where: { id: dossierInscriptionId },
    select: {
      inscription: {
        select: {
          concoursId: true,
          concours: { select: { etudeCloturee: true, etudeClotureeAt: true } },
        },
      },
    },
  });

  if (!dossier?.inscription) {
    return { ok: false, status: 404, error: 'Dossier non trouvé' };
  }

  return assertEtudeOuverteFromConcours(dossier.inscription.concours);
}

function sendEtudeClotureeSiBesoin(res, check) {
  if (check.ok) return false;
  res.status(check.status || 403).json({
    error: check.error || ETUDE_CLOTUREE_MESSAGE,
    code: check.code || ETUDE_CLOTUREE_CODE,
  });
  return true;
}

module.exports = {
  ETUDE_CLOTUREE_MESSAGE,
  ETUDE_CLOTUREE_CODE,
  assertEtudeOuverteFromConcours,
  assertEtudeOuvertePourConcours,
  assertEtudeOuvertePourDossier,
  sendEtudeClotureeSiBesoin,
};
