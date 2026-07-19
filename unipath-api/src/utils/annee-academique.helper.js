/**
 * Années académiques :
 * - Module 1 (concours) → année en cours DEC (enCoursDec)
 * - Module 2 (établissements privés) → année en cours DGES (enCoursDges)
 */
const prisma = require('../prisma');

const LIBELLE_REGEX = /^\d{4}-\d{4}$/;
const SCOPE_DEC = 'DEC';
const SCOPE_DGES = 'DGES';

function enCoursFlag(scope) {
  return scope === SCOPE_DGES ? 'enCoursDges' : 'enCoursDec';
}

function normalizeLibelle(value) {
  return String(value || '').trim();
}

function validateLibelleAnnee(libelle) {
  const value = normalizeLibelle(libelle);
  if (!LIBELLE_REGEX.test(value)) {
    return { ok: false, error: 'Le libellé doit être au format AAAA-AAAA (ex. 2025-2026).' };
  }
  const [debut, fin] = value.split('-').map(Number);
  if (fin !== debut + 1) {
    return { ok: false, error: "L'année de fin doit être l'année de début + 1 (ex. 2025-2026)." };
  }
  return { ok: true, libelle: value };
}

async function getAnneeEnCoursDec(client = prisma) {
  return client.anneeAcademique.findFirst({
    where: { enCoursDec: true },
    orderBy: { libelle: 'desc' },
  });
}

async function getAnneeEnCoursDges(client = prisma) {
  return client.anneeAcademique.findFirst({
    where: { enCoursDges: true },
    orderBy: { libelle: 'desc' },
  });
}

/** @deprecated Prefer getAnneeEnCoursDec — alias Module 1 */
async function getAnneeEnCours(client = prisma) {
  return getAnneeEnCoursDec(client);
}

async function getOrCreateAnneeEnCoursDec(client = prisma) {
  let annee = await getAnneeEnCoursDec(client);
  if (annee) return annee;

  const year = new Date().getFullYear();
  const libelle = `${year}-${year + 1}`;
  annee = await client.anneeAcademique.upsert({
    where: { libelle },
    create: { libelle, enCoursDec: true, enCoursDges: false },
    update: { enCoursDec: true },
  });
  return annee;
}

async function getOrCreateAnneeEnCoursDges(client = prisma) {
  let annee = await getAnneeEnCoursDges(client);
  if (annee) return annee;

  const year = new Date().getFullYear();
  const libelle = `${year}-${year + 1}`;
  annee = await client.anneeAcademique.upsert({
    where: { libelle },
    create: { libelle, enCoursDec: false, enCoursDges: true },
    update: { enCoursDges: true },
  });
  return annee;
}

/** @deprecated Prefer getOrCreateAnneeEnCoursDec */
async function getOrCreateAnneeEnCours(client = prisma) {
  return getOrCreateAnneeEnCoursDec(client);
}

/** DEC peut voir n'importe quelle année via query ; les autres comptes Module 1 = année DEC en cours. */
async function resolveFiltreAnneePourListe(req) {
  const role = req.user?.role;
  const queryId = req.query?.anneeAcademiqueId;
  const toutes = req.query?.toutesAnnees === '1' || req.query?.toutesAnnees === 'true';

  if (role === 'DEC') {
    if (toutes) return { where: {}, annee: null, scope: 'all' };
    if (queryId) {
      const annee = await prisma.anneeAcademique.findUnique({ where: { id: String(queryId) } });
      if (!annee) return { error: 'Année académique introuvable', status: 404 };
      return { where: { anneeAcademiqueId: annee.id }, annee, scope: 'selected' };
    }
  }

  const annee = await getAnneeEnCoursDec();
  if (!annee) {
    return { where: { anneeAcademiqueId: '__none__' }, annee: null, scope: 'current' };
  }
  return { where: { anneeAcademiqueId: annee.id }, annee, scope: 'current' };
}

async function assertConcoursAccessible(concours, req) {
  if (!concours) return { ok: false, status: 404, error: 'Concours non trouvé' };
  if (req.user?.role === 'DEC') return { ok: true };

  const annee = await getAnneeEnCoursDec();
  if (!annee) {
    return { ok: false, status: 403, error: 'Aucune année académique en cours (Module 1).' };
  }
  if (concours.anneeAcademiqueId !== annee.id) {
    return {
      ok: false,
      status: 403,
      error: "Ce concours appartient à une année archivée et n'est plus accessible.",
      code: 'CONCOURS_ARCHIVE',
    };
  }
  return { ok: true };
}

/**
 * Bornes d'une année académique AAAA-(AAAA+1) :
 * toute date dont l'année civile est AAAA ou AAAA+1.
 */
function getBornesAnneeAcademique(libelle) {
  const validation = validateLibelleAnnee(libelle);
  if (!validation.ok) return null;
  const [anneeDebut] = validation.libelle.split('-').map(Number);
  const anneeFin = anneeDebut + 1;
  const debut = new Date(anneeDebut, 0, 1, 0, 0, 0, 0);
  const fin = new Date(anneeFin, 11, 31, 23, 59, 59, 999);
  return {
    debut,
    fin,
    anneeDebut,
    anneeFin,
    anneesValides: [anneeDebut, anneeFin],
    libelle: validation.libelle,
  };
}

/**
 * Vérifie que les dates du concours restent dans l'année académique.
 */
function validateDatesDansAnneeAcademique(dates, libelleAnnee) {
  const bornes = getBornesAnneeAcademique(libelleAnnee);
  if (!bornes) {
    return { ok: false, error: 'Année académique invalide pour la validation des dates.' };
  }

  const champs = [
    ['dateDebutDepot', 'Début du dépôt'],
    ['dateFinDepot', 'Fin du dépôt'],
    ['dateDebutComposition', 'Début de composition'],
    ['dateFinComposition', 'Fin de composition'],
    ['dateDebut', 'Date de début'],
    ['dateFin', 'Date de fin'],
    ['dateComposition', 'Date de composition'],
    ['dateDebutEtudeDossiers', "Début d'étude des dossiers"],
    ['dateFinEtudeDossiers', "Fin d'étude des dossiers"],
  ];

  const horsPeriode = [];
  for (const [key, label] of champs) {
    const raw = dates?.[key];
    if (raw === undefined || raw === null || raw === '') continue;
    const d = raw instanceof Date ? raw : new Date(raw);
    if (Number.isNaN(d.getTime())) {
      return { ok: false, error: `${label} : date invalide.` };
    }
    const year = d.getFullYear();
    if (!bornes.anneesValides.includes(year)) {
      horsPeriode.push(`${label} (${year})`);
    }
  }

  if (horsPeriode.length > 0) {
    return {
      ok: false,
      error:
        `Pour l'année académique ${bornes.libelle}, chaque date doit être en ${bornes.anneeDebut} ou ${bornes.anneeFin}. `
        + `Hors période : ${horsPeriode.join(', ')}.`,
      bornes,
      champsInvalides: horsPeriode,
    };
  }

  return { ok: true, bornes };
}

module.exports = {
  LIBELLE_REGEX,
  SCOPE_DEC,
  SCOPE_DGES,
  enCoursFlag,
  normalizeLibelle,
  validateLibelleAnnee,
  getAnneeEnCours,
  getAnneeEnCoursDec,
  getAnneeEnCoursDges,
  getOrCreateAnneeEnCours,
  getOrCreateAnneeEnCoursDec,
  getOrCreateAnneeEnCoursDges,
  resolveFiltreAnneePourListe,
  assertConcoursAccessible,
  getBornesAnneeAcademique,
  validateDatesDansAnneeAcademique,
};
