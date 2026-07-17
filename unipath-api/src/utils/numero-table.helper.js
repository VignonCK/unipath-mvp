/**
 * Numéro de table concours — format AAVVCCOOORD (9 chiffres)
 * Exemple: 260140601
 *  - 26  : année de composition
 *  - 01  : code commune du centre (Cotonou)
 *  - 40  : code unique du concours
 *  - 601 : rang alphabétique dans le centre (001, 002, …)
 */
const prisma = require('../prisma');
const { resolveCommuneCode } = require('../constants/communes-benin.constants');

const STATUTS_RETENUS = ['VALIDE', 'VALIDE_PAR_COMMISSION'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function pad3(n) {
  return String(n).padStart(3, '0');
}

function anneeCompositionFromConcours(concours) {
  const date =
    concours.dateDebutComposition
    || concours.dateComposition
    || concours.dateFinComposition;
  if (!date) return null;
  const y = new Date(date).getFullYear();
  if (!Number.isFinite(y)) return null;
  return pad2(y % 100);
}

function compareAlpha(a, b) {
  const na = `${a.candidat?.nom || ''} ${a.candidat?.prenom || ''}`.trim().localeCompare(
    `${b.candidat?.nom || ''} ${b.candidat?.prenom || ''}`.trim(),
    'fr',
    { sensitivity: 'base' }
  );
  if (na !== 0) return na;
  return String(a.id).localeCompare(String(b.id));
}

/**
 * Alloue le prochain code concours unique sur 2 chiffres (01–99).
 */
async function allocuerCodeConcours(tx = prisma) {
  const rows = await tx.concours.findMany({
    where: { code: { not: null } },
    select: { code: true },
  });
  const used = new Set(rows.map((r) => String(r.code).padStart(2, '0')));
  for (let i = 1; i <= 99; i += 1) {
    const code = pad2(i);
    if (!used.has(code)) return code;
  }
  throw new Error('Plus de code concours disponible (01–99)');
}

/**
 * Garantit qu'un concours a un code ; en crée un si besoin.
 */
async function ensureConcoursCode(concoursId, tx = prisma) {
  const concours = await tx.concours.findUnique({
    where: { id: concoursId },
    select: { id: true, code: true },
  });
  if (!concours) throw new Error('Concours introuvable');
  if (concours.code) return String(concours.code).padStart(2, '0');

  const code = await allocuerCodeConcours(tx);
  await tx.concours.update({
    where: { id: concoursId },
    data: { code },
  });
  return code;
}

/**
 * Rattache communeCode au centre si manquant, à partir de la ville.
 */
async function ensureCentreCommuneCode(centre, tx = prisma) {
  if (centre.communeCode) return String(centre.communeCode).padStart(2, '0');
  const code = resolveCommuneCode(centre.ville);
  if (!code) return null;
  await tx.centreComposition.update({
    where: { id: centre.id },
    data: { communeCode: code },
  });
  return code;
}

/**
 * Génère / régénère les numéros de table pour les candidats retenus d'un concours.
 * Groupement par centre de composition, tri alphabétique nom/prénom.
 */
async function genererNumerosTableConcours(concoursId, { regenerer = true } = {}) {
  const concours = await prisma.concours.findUnique({ where: { id: concoursId } });
  if (!concours) {
    return { ok: false, status: 404, error: 'Concours non trouvé' };
  }

  const annee = anneeCompositionFromConcours(concours);
  if (!annee) {
    return {
      ok: false,
      status: 400,
      error: 'Date de composition manquante — impossible de dériver l\'année (AA)',
    };
  }

  const codeConcours = await ensureConcoursCode(concoursId);

  const inscriptions = await prisma.inscription.findMany({
    where: {
      concoursId,
      dossierInscription: {
        statut: { in: STATUTS_RETENUS },
        concoursCentreId: { not: null },
      },
    },
    include: {
      candidat: { select: { id: true, nom: true, prenom: true, matricule: true } },
      dossierInscription: {
        include: {
          centreChoisi: {
            include: { centre: true },
          },
        },
      },
    },
  });

  const sansCentre = await prisma.inscription.count({
    where: {
      concoursId,
      dossierInscription: {
        statut: { in: STATUTS_RETENUS },
        concoursCentreId: null,
      },
    },
  });

  if (inscriptions.length === 0) {
    return {
      ok: false,
      status: 400,
      error: 'Aucun candidat retenu avec un centre de composition choisi',
      details: { retenusSansCentre: sansCentre },
    };
  }

  /** @type {Map<string, typeof inscriptions>} */
  const byCentre = new Map();
  for (const insc of inscriptions) {
    const centreLink = insc.dossierInscription?.centreChoisi;
    const centreId = centreLink?.centreId || centreLink?.centre?.id;
    if (!centreId) continue;
    if (!byCentre.has(centreId)) byCentre.set(centreId, []);
    byCentre.get(centreId).push(insc);
  }

  const updates = [];
  const errors = [];
  const apercuParCentre = [];

  for (const [centreId, group] of byCentre.entries()) {
    const centre = group[0].dossierInscription.centreChoisi.centre;
    const codeVille = await ensureCentreCommuneCode(centre);
    if (!codeVille) {
      errors.push({
        centreId,
        centre: centre.nom,
        ville: centre.ville,
        error: `Ville « ${centre.ville} » non reconnue dans le référentiel des 77 communes`,
      });
      continue;
    }

    group.sort(compareAlpha);

    const lignes = [];
    group.forEach((insc, index) => {
      const ordre = pad3(index + 1);
      const numeroTable = `${annee}${codeVille}${codeConcours}${ordre}`;
      updates.push({ id: insc.id, numeroTable });
      lignes.push({
        inscriptionId: insc.id,
        candidat: insc.candidat,
        ordre: index + 1,
        numeroTable,
      });
    });

    apercuParCentre.push({
      centreId,
      centreNom: centre.nom,
      ville: centre.ville,
      communeCode: codeVille,
      total: group.length,
      candidats: lignes,
    });
  }

  if (errors.length > 0 && updates.length === 0) {
    return {
      ok: false,
      status: 400,
      error: 'Impossible de générer les numéros de table : communes non résolues',
      details: { errors },
    };
  }

  await prisma.$transaction(async (tx) => {
    if (regenerer) {
      await tx.inscription.updateMany({
        where: { concoursId, numeroTable: { not: null } },
        data: { numeroTable: null },
      });
    }
    for (const u of updates) {
      await tx.inscription.update({
        where: { id: u.id },
        data: { numeroTable: u.numeroTable },
      });
    }
  });

  return {
    ok: true,
    format: 'AAVVCCORD (ex: 260140601)',
    concours: {
      id: concours.id,
      libelle: concours.libelle,
      code: codeConcours,
      anneeComposition: annee,
    },
    totalGeneres: updates.length,
    retenusSansCentre: sansCentre,
    erreursCentres: errors,
    centres: apercuParCentre.sort((a, b) =>
      `${a.ville} ${a.centreNom}`.localeCompare(`${b.ville} ${b.centreNom}`, 'fr')
    ),
  };
}

async function listerNumerosTableConcours(concoursId) {
  const concours = await prisma.concours.findUnique({
    where: { id: concoursId },
    select: {
      id: true,
      libelle: true,
      code: true,
      dateComposition: true,
      dateDebutComposition: true,
    },
  });
  if (!concours) return { ok: false, status: 404, error: 'Concours non trouvé' };

  const inscriptions = await prisma.inscription.findMany({
    where: {
      concoursId,
      numeroTable: { not: null },
    },
    include: {
      candidat: { select: { id: true, nom: true, prenom: true, matricule: true } },
      dossierInscription: {
        include: {
          centreChoisi: { include: { centre: true } },
        },
      },
    },
    orderBy: { numeroTable: 'asc' },
  });

  return {
    ok: true,
    concours: {
      ...concours,
      anneeComposition: anneeCompositionFromConcours(concours),
    },
    total: inscriptions.length,
    numeros: inscriptions.map((i) => ({
      inscriptionId: i.id,
      numeroTable: i.numeroTable,
      numeroInscription: i.numeroInscription,
      candidat: i.candidat,
      centre: i.dossierInscription?.centreChoisi?.centre
        ? {
            id: i.dossierInscription.centreChoisi.centre.id,
            nom: i.dossierInscription.centreChoisi.centre.nom,
            ville: i.dossierInscription.centreChoisi.centre.ville,
            communeCode: i.dossierInscription.centreChoisi.centre.communeCode,
          }
        : null,
    })),
  };
}

module.exports = {
  STATUTS_RETENUS,
  anneeCompositionFromConcours,
  allocuerCodeConcours,
  ensureConcoursCode,
  ensureCentreCommuneCode,
  genererNumerosTableConcours,
  listerNumerosTableConcours,
};
