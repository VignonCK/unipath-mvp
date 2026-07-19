/**
 * Résultats après composition — décision manuelle DEC (Admis / Refusé)
 * Uniquement parmi les candidatures au statut dossier VALIDE.
 */
const prisma = require('../prisma');
const { resolveCommuneCode } = require('../constants/communes-benin.constants');
const { parseFilters } = require('./liste-retenus.helper');

const RESULTAT_LABELS = {
  EN_ATTENTE: 'En attente',
  ADMIS: 'Admis',
  REFUSE: 'Refusé',
};

const RESULTAT_FILTERS = {
  tous: null,
  en_attente: 'EN_ATTENTE',
  admis: 'ADMIS',
  refuses: 'REFUSE',
};

function resolveResultatFilter(raw) {
  const key = String(raw || 'tous').trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(RESULTAT_FILTERS, key)) return key;
  return 'tous';
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

/**
 * Liste des retenus (VALIDE) avec décision DEC post-composition.
 */
async function chargerResultatsSelection(concoursId, filters = {}) {
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
    },
  });
  if (!concours) {
    return { ok: false, status: 404, error: 'Concours non trouvé' };
  }

  const { centreId, ville, q } = parseFilters(filters);
  const resultat = resolveResultatFilter(filters.resultat);
  const sexe = resolveSexeFilter(filters.sexe);

  const dossierWhere = { statut: 'VALIDE' };
  if (centreId) {
    dossierWhere.centreChoisi = { centreId };
  }

  const inscriptionWhere = {
    concoursId,
    dossierInscription: dossierWhere,
  };
  const wanted = RESULTAT_FILTERS[resultat];
  if (wanted) {
    inscriptionWhere.resultatComposition = wanted;
  }
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
    orderBy: [
      { candidat: { nom: 'asc' } },
      { candidat: { prenom: 'asc' } },
    ],
  });

  // Compteurs globaux (tous les VALIDE du concours)
  const countsRaw = await prisma.inscription.groupBy({
    by: ['resultatComposition'],
    where: {
      concoursId,
      dossierInscription: { statut: 'VALIDE' },
    },
    _count: { _all: true },
  });
  const byRes = Object.fromEntries(
    countsRaw.map((r) => [r.resultatComposition, r._count._all])
  );
  const counts = {
    total: Object.values(byRes).reduce((a, b) => a + b, 0),
    en_attente: byRes.EN_ATTENTE || 0,
    admis: byRes.ADMIS || 0,
    refuses: byRes.REFUSE || 0,
  };

  const liensCentres = await prisma.concoursCentreComposition.findMany({
    where: { concoursId, estActif: true },
    include: { centre: true },
    orderBy: { centre: { ville: 'asc' } },
  });
  const optionsCentres = liensCentres.map((l) => ({
    id: l.centre.id,
    nom: l.centre.nom,
    ville: l.centre.ville,
    communeCode: l.centre.communeCode || resolveCommuneCode(l.centre.ville),
    centreCode: l.centre.code || null,
  }));
  const villes = [...new Set(optionsCentres.map((c) => c.ville).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'fr')
  );

  let rows = inscriptions.map((insc) => {
    const centre = insc.dossierInscription?.centreChoisi?.centre || null;
    const rc = insc.resultatComposition || 'EN_ATTENTE';
    const sx = insc.candidat?.sexe || null;
    return {
      inscriptionId: insc.id,
      numeroInscription: insc.numeroInscription,
      numeroTable: insc.numeroTable,
      resultatComposition: rc,
      resultatLabel: RESULTAT_LABELS[rc] || rc,
      resultatCompositionAt: insc.resultatCompositionAt,
      candidat: {
        ...insc.candidat,
        sexe: sx,
        sexeLabel: labelSexe(sx),
      },
      centre: centre
        ? {
            id: centre.id,
            nom: centre.nom,
            ville: centre.ville,
            communeCode: centre.communeCode || resolveCommuneCode(centre.ville),
            code: centre.code || null,
          }
        : null,
    };
  });

  if (ville) {
    rows = rows.filter((r) =>
      r.centre && String(r.centre.ville || '').toLowerCase() === ville.toLowerCase()
    );
  }
  if (q) {
    rows = rows.filter((r) => {
      const hay = [
        r.candidat?.nom,
        r.candidat?.prenom,
        r.candidat?.matricule,
        r.numeroInscription,
        r.numeroTable,
        r.resultatLabel,
        r.candidat?.sexeLabel,
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  return {
    ok: true,
    concours,
    resultat,
    sexe: sexe || 'tous',
    counts,
    total: rows.length,
    candidats: rows,
    options: {
      centres: optionsCentres,
      villes,
      resultats: [
        { value: 'tous', label: 'Tous' },
        { value: 'en_attente', label: 'En attente' },
        { value: 'admis', label: 'Admis' },
        { value: 'refuses', label: 'Refusés' },
      ],
      sexes: [
        { value: 'tous', label: 'Tous' },
        { value: 'M', label: 'Masculin' },
        { value: 'F', label: 'Féminin' },
      ],
    },
  };
}

/**
 * DEC marque un candidat (dossier VALIDE) comme ADMIS, REFUSE ou EN_ATTENTE.
 */
async function deciderResultatComposition({
  concoursId,
  inscriptionId,
  resultat,
  userId,
}) {
  const allowed = ['ADMIS', 'REFUSE', 'EN_ATTENTE'];
  if (!allowed.includes(resultat)) {
    return {
      ok: false,
      status: 400,
      error: 'Résultat invalide. Valeurs : ADMIS, REFUSE, EN_ATTENTE',
    };
  }

  const inscription = await prisma.inscription.findFirst({
    where: {
      id: inscriptionId,
      concoursId,
    },
    include: {
      dossierInscription: { select: { statut: true } },
      candidat: { select: { nom: true, prenom: true, matricule: true } },
    },
  });

  if (!inscription) {
    return { ok: false, status: 404, error: 'Inscription introuvable pour ce concours' };
  }

  if (inscription.dossierInscription?.statut !== 'VALIDE') {
    return {
      ok: false,
      status: 400,
      error: 'La décision post-composition ne concerne que les candidatures validées',
    };
  }

  const updated = await prisma.inscription.update({
    where: { id: inscriptionId },
    data: {
      resultatComposition: resultat,
      resultatCompositionAt: new Date(),
      resultatCompositionPar: userId || null,
    },
    select: {
      id: true,
      resultatComposition: true,
      resultatCompositionAt: true,
      numeroTable: true,
      candidat: { select: { nom: true, prenom: true, matricule: true } },
    },
  });

  return {
    ok: true,
    inscription: {
      ...updated,
      resultatLabel: RESULTAT_LABELS[updated.resultatComposition],
    },
  };
}

/**
 * Normalise un N° de table extrait d'un CSV (espaces, points, tirets).
 */
function normalizeNumeroTable(raw) {
  if (raw == null) return null;
  const cleaned = String(raw)
    .trim()
    .replace(/[\s.\-_/]/g, '')
    .replace(/[^\d]/g, '');
  return cleaned || null;
}

/**
 * Extrait la liste des N° de table depuis un contenu CSV / texte.
 * Accepte :
 * - une colonne "numeroTable" / "numero_table" / "n° de table" / "n de table"
 * - ou une seule colonne / une valeur par ligne
 */
function extraireNumerosTableDepuisCsv(csvText) {
  const text = String(csvText || '').replace(/^\uFEFF/, '');
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { ok: false, error: 'Fichier vide' };
  }

  const sep = lines[0].includes(';') ? ';' : ',';
  const firstCells = lines[0].split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
  const headerJoined = firstCells.join(' ').toLowerCase();
  const looksLikeHeader = /numero|n[°o]?\s*de\s*table|table/.test(headerJoined)
    && !/^\d+$/.test(firstCells[0].replace(/[\s.\-_/]/g, ''));

  let colIndex = 0;
  let start = 0;
  if (looksLikeHeader) {
    start = 1;
    const idx = firstCells.findIndex((h) => {
      const n = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return (
        n === 'numerotable'
        || n === 'numero_table'
        || n === 'numero de table'
        || n === 'n de table'
        || n === "n° de table"
        || n.includes('numero') && n.includes('table')
        || n === 'table'
      );
    });
    colIndex = idx >= 0 ? idx : 0;
  }

  const numeros = [];
  const seen = new Set();
  for (let i = start; i < lines.length; i += 1) {
    const cells = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
    const raw = cells[colIndex] ?? cells[0];
    const numero = normalizeNumeroTable(raw);
    if (!numero) continue;
    if (seen.has(numero)) continue;
    seen.add(numero);
    numeros.push(numero);
  }

  if (numeros.length === 0) {
    return { ok: false, error: 'Aucun numéro de table détecté dans le fichier' };
  }

  return { ok: true, numeros };
}

/**
 * Marque ADMIS tous les retenus (VALIDE) dont le N° de table figure dans la liste.
 */
async function importerAdmisParNumerosTable({ concoursId, csvText, userId }) {
  const concours = await prisma.concours.findUnique({
    where: { id: concoursId },
    select: { id: true, libelle: true },
  });
  if (!concours) {
    return { ok: false, status: 404, error: 'Concours non trouvé' };
  }

  const parsed = extraireNumerosTableDepuisCsv(csvText);
  if (!parsed.ok) {
    return { ok: false, status: 400, error: parsed.error };
  }

  const numeros = parsed.numeros;
  const now = new Date();

  const inscriptions = await prisma.inscription.findMany({
    where: {
      concoursId,
      numeroTable: { in: numeros },
    },
    include: {
      dossierInscription: { select: { statut: true } },
      candidat: { select: { nom: true, prenom: true, matricule: true } },
    },
  });

  const byNumero = new Map(
    inscriptions.map((i) => [String(i.numeroTable), i])
  );

  const admis = [];
  const dejaAdmis = [];
  const nonValides = [];
  const introuvables = [];

  for (const numero of numeros) {
    const insc = byNumero.get(numero);
    if (!insc) {
      introuvables.push(numero);
      continue;
    }
    if (insc.dossierInscription?.statut !== 'VALIDE') {
      nonValides.push({
        numeroTable: numero,
        matricule: insc.candidat?.matricule,
        statutDossier: insc.dossierInscription?.statut || null,
      });
      continue;
    }
    if (insc.resultatComposition === 'ADMIS') {
      dejaAdmis.push({
        numeroTable: numero,
        matricule: insc.candidat?.matricule,
        nom: insc.candidat?.nom,
        prenom: insc.candidat?.prenom,
      });
      continue;
    }

    await prisma.inscription.update({
      where: { id: insc.id },
      data: {
        resultatComposition: 'ADMIS',
        resultatCompositionAt: now,
        resultatCompositionPar: userId || null,
      },
    });
    admis.push({
      numeroTable: numero,
      matricule: insc.candidat?.matricule,
      nom: insc.candidat?.nom,
      prenom: insc.candidat?.prenom,
    });
  }

  return {
    ok: true,
    concours,
    resume: {
      lus: numeros.length,
      admis: admis.length,
      dejaAdmis: dejaAdmis.length,
      nonValides: nonValides.length,
      introuvables: introuvables.length,
    },
    admis,
    dejaAdmis,
    nonValides,
    introuvables,
  };
}

/**
 * Marque REFUSE tous les retenus (VALIDE) du concours qui ne sont pas déjà ADMIS.
 */
async function marquerAutresCommeRefuses({ concoursId, userId }) {
  const concours = await prisma.concours.findUnique({
    where: { id: concoursId },
    select: { id: true, libelle: true },
  });
  if (!concours) {
    return { ok: false, status: 404, error: 'Concours non trouvé' };
  }

  const now = new Date();
  const result = await prisma.inscription.updateMany({
    where: {
      concoursId,
      dossierInscription: { statut: 'VALIDE' },
      resultatComposition: { not: 'ADMIS' },
    },
    data: {
      resultatComposition: 'REFUSE',
      resultatCompositionAt: now,
      resultatCompositionPar: userId || null,
    },
  });

  return {
    ok: true,
    concours,
    refuses: result.count,
  };
}

/**
 * Remet EN_ATTENTE toutes les décisions ADMIS / REFUSE des retenus (VALIDE).
 */
async function annulerToutesLesDecisions({ concoursId, userId }) {
  const concours = await prisma.concours.findUnique({
    where: { id: concoursId },
    select: { id: true, libelle: true },
  });
  if (!concours) {
    return { ok: false, status: 404, error: 'Concours non trouvé' };
  }

  const now = new Date();
  const result = await prisma.inscription.updateMany({
    where: {
      concoursId,
      dossierInscription: { statut: 'VALIDE' },
      resultatComposition: { in: ['ADMIS', 'REFUSE'] },
    },
    data: {
      resultatComposition: 'EN_ATTENTE',
      resultatCompositionAt: now,
      resultatCompositionPar: userId || null,
    },
  });

  return {
    ok: true,
    concours,
    annules: result.count,
  };
}

function escapeCsv(value) {
  const s = value == null ? '' : String(value);
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * CSV UTF-8 BOM (séparateur ;) des résultats selon filtres.
 */
function resultatsSelectionToCsv(payload) {
  const headers = [
    'Ville',
    'Centre',
    'Nom',
    'Prénom',
    'Sexe',
    'Matricule',
    'N° inscription',
    'N° de table',
    'Décision',
  ];
  const lines = [headers.join(';')];
  for (const row of payload.candidats || []) {
    lines.push([
      row.centre?.ville || '',
      row.centre?.nom || '',
      row.candidat?.nom || '',
      row.candidat?.prenom || '',
      row.candidat?.sexeLabel || labelSexe(row.candidat?.sexe),
      row.candidat?.matricule || '',
      row.numeroInscription || '',
      row.numeroTable || '',
      row.resultatLabel || row.resultatComposition || '',
    ].map(escapeCsv).join(';'));
  }
  return `\uFEFF${lines.join('\n')}`;
}

module.exports = {
  RESULTAT_LABELS,
  RESULTAT_FILTERS,
  resolveResultatFilter,
  chargerResultatsSelection,
  deciderResultatComposition,
  normalizeNumeroTable,
  extraireNumerosTableDepuisCsv,
  importerAdmisParNumerosTable,
  marquerAutresCommeRefuses,
  annulerToutesLesDecisions,
  resultatsSelectionToCsv,
};
