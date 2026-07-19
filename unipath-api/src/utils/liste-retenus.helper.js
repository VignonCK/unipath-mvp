/**
 * Liste des candidats retenus (VALIDE) d'un concours,
 * groupés par centre de composition puis ordre alphabétique.
 * Filtres optionnels : centreId, ville, q (nom/prénom/n° table), sexe (M|F).
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

function resolveSexeFilter(raw) {
  const key = String(raw || '').trim().toUpperCase();
  if (key === 'M' || key === 'F') return key;
  return null;
}

function labelSexe(sexe) {
  if (sexe === 'M') return 'M';
  if (sexe === 'F') return 'F';
  return '—';
}

function parseFilters(raw = {}) {
  const centreId = raw.centreId ? String(raw.centreId).trim() : null;
  const ville = raw.ville ? String(raw.ville).trim() : null;
  const q = raw.q ? String(raw.q).trim().toLowerCase() : null;
  const sexe = resolveSexeFilter(raw.sexe);
  return { centreId, ville, q, sexe };
}

async function buildCentresRetenus(
  concoursId,
  { statut = 'VALIDE', centreId = null, ville = null, q = null, sexe = null } = {}
) {
  const dossierWhere = {
    statut,
    concoursCentreId: { not: null },
  };
  if (centreId) {
    dossierWhere.centreChoisi = { centreId };
  }

  const inscriptionWhere = {
    concoursId,
    dossierInscription: dossierWhere,
  };
  if (sexe) {
    inscriptionWhere.candidat = { sexe };
  }

  const inscriptions = await prisma.inscription.findMany({
    where: inscriptionWhere,
    include: {
      candidat: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          matricule: true,
          sexe: true,
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
    if (ville && String(centre.ville || '').toLowerCase() !== ville.toLowerCase()) {
      continue;
    }
    if (!byCentre.has(centre.id)) byCentre.set(centre.id, []);
    byCentre.get(centre.id).push(insc);
  }

  const centres = [];
  let rangGlobal = 0;

  for (const [cId, group] of [...byCentre.entries()].sort((a, b) => {
    const ca = a[1][0].dossierInscription.centreChoisi.centre;
    const cb = b[1][0].dossierInscription.centreChoisi.centre;
    return `${ca.ville} ${ca.nom}`.localeCompare(`${cb.ville} ${cb.nom}`, 'fr');
  })) {
    const centre = group[0].dossierInscription.centreChoisi.centre;
    group.sort(compareAlpha);

    let filtered = group;
    if (q) {
      filtered = group.filter((insc) => {
        const hay = [
          insc.candidat?.nom,
          insc.candidat?.prenom,
          insc.numeroTable,
          insc.numeroInscription,
          insc.candidat?.matricule,
          labelSexe(insc.candidat?.sexe),
        ].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    if (filtered.length === 0) continue;

    const communeCode = centre.communeCode || resolveCommuneCode(centre.ville);
    const candidats = filtered.map((insc, index) => {
      rangGlobal += 1;
      const sx = insc.candidat?.sexe || null;
      return {
        rangCentre: index + 1,
        rangGlobal,
        inscriptionId: insc.id,
        numeroInscription: insc.numeroInscription,
        numeroTable: insc.numeroTable,
        candidat: {
          ...insc.candidat,
          sexe: sx,
          sexeLabel: labelSexe(sx),
        },
      };
    });
    centres.push({
      centreId: cId,
      centreNom: centre.nom,
      ville: centre.ville,
      communeCode,
      centreCode: centre.code || null,
      adresse: centre.adresse,
      total: candidats.length,
      candidats,
    });
  }

  return { centres, total: rangGlobal };
}

async function chargerListeRetenus(concoursId, filters = {}) {
  const { centreId, ville, q, sexe } = parseFilters(filters);
  const statut = filters.statut || 'VALIDE';

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

  const { centres, total } = await buildCentresRetenus(concoursId, {
    statut,
    centreId,
    ville,
    q,
    sexe,
  });

  // Options de filtres = tous les centres avec retenus (sans filtre)
  const base = (centreId || ville || q || sexe)
    ? await buildCentresRetenus(concoursId, { statut })
    : { centres, total };

  const options = {
    centres: base.centres.map((c) => ({
      centreId: c.centreId,
      centreNom: c.centreNom,
      ville: c.ville,
      total: c.total,
    })),
    villes: [...new Set(base.centres.map((c) => c.ville).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'fr')),
    sexes: [
      { value: 'tous', label: 'Tous' },
      { value: 'M', label: 'Masculin' },
      { value: 'F', label: 'Féminin' },
    ],
  };

  return {
    ok: true,
    concours,
    total,
    centres,
    sexe: sexe || 'tous',
    filtres: { centreId, ville, q, sexe },
    options,
    genereAt: new Date().toISOString(),
  };
}

function escapeCsv(value) {
  const s = value == null ? '' : String(value);
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function listeRetenusToCsv(payload) {
  const headers = [
    'Centre',
    'Nom',
    'Prénom',
    'Sexe',
    'N° de table',
  ];
  const lines = [headers.join(';')];
  for (const centre of payload.centres) {
    for (const row of centre.candidats) {
      lines.push([
        centre.centreNom,
        row.candidat?.nom || '',
        row.candidat?.prenom || '',
        row.candidat?.sexeLabel || labelSexe(row.candidat?.sexe),
        row.numeroTable || '',
      ].map(escapeCsv).join(';'));
    }
  }
  return `\uFEFF${lines.join('\n')}`;
}

module.exports = {
  chargerListeRetenus,
  listeRetenusToCsv,
  parseFilters,
  labelSexe,
};
