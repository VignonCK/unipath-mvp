/**
 * Liste des candidats retenus (VALIDE) d'un concours,
 * groupés par centre de composition puis ordre alphabétique.
 */
const prisma = require('../prisma');
const { resolveCommuneCode } = require('../constants/communes-benin.constants');

function compareAlpha(a, b) {
  return `${a.candidat?.nom || ''} ${a.candidat?.prenom || ''}`.trim().localeCompare(
    `${b.candidat?.nom || ''} ${b.candidat?.prenom || ''}`.trim(),
    'fr',
    { sensitivity: 'base' }
  );
}

async function chargerListeRetenus(concoursId, { statut = 'VALIDE' } = {}) {
  const concours = await prisma.concours.findUnique({
    where: { id: concoursId },
    select: {
      id: true,
      libelle: true,
      code: true,
      etablissement: true,
      dateComposition: true,
      dateDebutComposition: true,
      dateFinComposition: true,
      etudeDossiersClotureeAt: true,
      dateDebutEtudeDossiers: true,
    },
  });
  if (!concours) {
    return { ok: false, status: 404, error: 'Concours non trouvé' };
  }

  const inscriptions = await prisma.inscription.findMany({
    where: {
      concoursId,
      dossierInscription: {
        statut,
        concoursCentreId: { not: null },
      },
    },
    include: {
      candidat: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          matricule: true,
        },
      },
      dossierInscription: {
        include: {
          centreChoisi: { include: { centre: true } },
        },
      },
    },
  });

  /** @type {Map<string, any[]>} */
  const byCentre = new Map();
  for (const insc of inscriptions) {
    const centre = insc.dossierInscription?.centreChoisi?.centre;
    if (!centre) continue;
    if (!byCentre.has(centre.id)) byCentre.set(centre.id, []);
    byCentre.get(centre.id).push(insc);
  }

  const centres = [];
  let rangGlobal = 0;

  for (const [centreId, group] of [...byCentre.entries()].sort((a, b) => {
    const ca = a[1][0].dossierInscription.centreChoisi.centre;
    const cb = b[1][0].dossierInscription.centreChoisi.centre;
    return `${ca.ville} ${ca.nom}`.localeCompare(`${cb.ville} ${cb.nom}`, 'fr');
  })) {
    const centre = group[0].dossierInscription.centreChoisi.centre;
    group.sort(compareAlpha);
    const communeCode = centre.communeCode || resolveCommuneCode(centre.ville);
    const candidats = group.map((insc, index) => {
      rangGlobal += 1;
      return {
        rangCentre: index + 1,
        rangGlobal,
        inscriptionId: insc.id,
        numeroInscription: insc.numeroInscription,
        numeroTable: insc.numeroTable,
        candidat: insc.candidat,
      };
    });
    centres.push({
      centreId,
      centreNom: centre.nom,
      ville: centre.ville,
      communeCode,
      adresse: centre.adresse,
      total: candidats.length,
      candidats,
    });
  }

  return {
    ok: true,
    concours,
    total: rangGlobal,
    centres,
    genereAt: new Date().toISOString(),
  };
}

function escapeCsv(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function listeRetenusToCsv(payload) {
  const headers = [
    'Centre',
    'Ville',
    'Code commune',
    'Rang centre',
    'Nom',
    'Prénom',
    'Matricule',
    'Email',
    'Téléphone',
    'N° inscription',
    'N° de table',
  ];
  const lines = [headers.join(';')];
  for (const centre of payload.centres) {
    for (const row of centre.candidats) {
      lines.push([
        centre.centreNom,
        centre.ville,
        centre.communeCode || '',
        String(row.rangCentre).padStart(3, '0'),
        row.candidat?.nom || '',
        row.candidat?.prenom || '',
        row.candidat?.matricule || '',
        row.candidat?.email || '',
        row.candidat?.telephone || '',
        row.numeroInscription || '',
        row.numeroTable || '',
      ].map(escapeCsv).join(';'));
    }
  }
  return `\uFEFF${lines.join('\n')}`;
}

module.exports = {
  chargerListeRetenus,
  listeRetenusToCsv,
};
