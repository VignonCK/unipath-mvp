const { validateUUID } = require('./validation');

const STATUT_ALIASES = {
  accepte: ['VALIDE', 'VALIDE_PAR_COMMISSION'],
  rejete: ['REJETE', 'REJETE_PAR_COMMISSION'],
  attente: ['EN_ATTENTE'],
  sous_reserve: ['SOUS_RESERVE', 'SOUS_RESERVE_PAR_COMMISSION'],
};

const RAW_STATUTS = new Set(Object.values(STATUT_ALIASES).flat());

function resolveStatutPrismaFilter(statut) {
  const normalized = String(statut || '').trim().toLowerCase();
  if (STATUT_ALIASES[normalized]) {
    return { in: STATUT_ALIASES[normalized] };
  }

  const upper = String(statut || '').trim().toUpperCase();
  if (RAW_STATUTS.has(upper)) {
    return upper;
  }

  return null;
}

function parseStatsFilters(query = {}, options = {}) {
  const filters = {
    sexe: null,
    concoursId: null,
    etablissementId: null,
    statut: null,
    centreId: null,
    anneeAcademique: null,
    _statutPrisma: null,
  };
  const errors = [];

  if (query.sexe) {
    const sexe = String(query.sexe).trim().toUpperCase();
    if (!['M', 'F'].includes(sexe)) {
      errors.push('sexe doit être M ou F');
    } else {
      filters.sexe = sexe;
    }
  }

  for (const field of ['concoursId', 'etablissementId', 'centreId']) {
    if (query[field]) {
      const value = String(query[field]).trim();
      if (!validateUUID(value)) {
        errors.push(`${field} invalide`);
      } else {
        filters[field] = value;
      }
    }
  }

  if (options.concoursIdFromPath) {
    if (!validateUUID(options.concoursIdFromPath)) {
      errors.push('concoursId invalide');
    } else {
      filters.concoursId = options.concoursIdFromPath;
    }
  }

  if (query.statut) {
    const raw = String(query.statut).trim();
    const prismaFilter = resolveStatutPrismaFilter(raw);
    if (!prismaFilter) {
      errors.push('statut invalide');
    } else {
      filters.statut = raw.toLowerCase();
      filters._statutPrisma = prismaFilter;
    }
  }

  if (query.anneeAcademique) {
    filters.anneeAcademique = String(query.anneeAcademique).trim();
  }

  if (errors.length > 0) {
    const err = new Error(errors.join('; '));
    err.status = 400;
    throw err;
  }

  return filters;
}

function metaFiltersFromParsed(filters = {}) {
  return {
    sexe: filters.sexe || null,
    concoursId: filters.concoursId || null,
    etablissementId: filters.etablissementId || null,
    statut: filters.statut || null,
    centreId: filters.centreId || null,
    anneeAcademique: filters.anneeAcademique || null,
  };
}

function buildInscriptionWhere(filters = {}) {
  const where = {};
  const dossierWhere = {};

  if (filters.sexe) {
    where.candidat = { sexe: filters.sexe };
  }

  if (filters._statutPrisma) {
    dossierWhere.statut = filters._statutPrisma;
  }

  if (filters.centreId) {
    dossierWhere.centreChoisi = { centreId: filters.centreId };
  }

  if (Object.keys(dossierWhere).length > 0) {
    where.dossierInscription = dossierWhere;
  }

  return where;
}

function buildCampagneApplicationWhere(filters = {}, scope = null) {
  const where = {
    campagneFiliereId: { not: null },
    etablissement: { type: 'PRIVE' },
  };

  const etablissementId = filters.etablissementId || scope?.etablissementId || null;
  if (etablissementId) {
    where.etablissementId = etablissementId;
  }

  if (filters.anneeAcademique) {
    where.anneeAcademique = filters.anneeAcademique;
  }

  if (filters.sexe) {
    where.candidat = { sexe: filters.sexe };
  }

  if (filters._statutPrisma) {
    const PREINSCRIPTION_STATUTS = new Set(['EN_ATTENTE', 'VALIDE', 'REJETE', 'SOUS_RESERVE']);
    const raw = filters._statutPrisma;
    const candidates = raw?.in ? raw.in : [raw];
    const allowed = candidates.filter((s) => PREINSCRIPTION_STATUTS.has(s));
    if (allowed.length === 0) {
      where.id = '__no_match__';
    } else {
      where.preinscription = {
        statut: allowed.length === 1 ? allowed[0] : { in: allowed },
      };
    }
  }

  return where;
}

module.exports = {
  STATUT_ALIASES,
  parseStatsFilters,
  metaFiltersFromParsed,
  buildInscriptionWhere,
  buildCampagneApplicationWhere,
  resolveStatutPrismaFilter,
};
