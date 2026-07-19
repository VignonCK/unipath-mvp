/**
 * Tableau de bord DGES — agrégats nationaux Module 2 (établissements privés).
 *
 * Filtres : année (libelle) | toutes années, établissement, filière, ville, niveau, sexe.
 */
const prisma = require('../prisma');
const { getAnneeEnCoursDges } = require('./annee-academique.helper');

const PRE_STATUTS = ['EN_ATTENTE', 'VALIDE', 'SOUS_RESERVE', 'REJETE'];
const PRE_LABELS = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validée',
  SOUS_RESERVE: 'Sous réserve',
  REJETE: 'Rejetée',
};

const INS_STATUTS = ['EN_COURS', 'VALIDE', 'REDOUBLANT', 'ABANDONNE'];
const INS_LABELS = {
  EN_COURS: 'En cours',
  VALIDE: 'Passant (validé)',
  REDOUBLANT: 'Redoublant',
  ABANDONNE: 'Abandonné',
};

const APP_STATUTS = [
  'DRAFT',
  'DOSSIER_FEES_PAID',
  'PENDING_DOCUMENTS',
  'READY_FOR_PREINSCRIPTION',
  'FICHE_GENERATED',
];
const APP_LABELS = {
  DRAFT: 'Brouillon',
  DOSSIER_FEES_PAID: 'Frais payés',
  PENDING_DOCUMENTS: 'Pièces en attente',
  READY_FOR_PREINSCRIPTION: 'Prêt préinscription',
  FICHE_GENERATED: 'Fiche générée',
};

const CAMP_STATUTS = ['BROUILLON', 'PUBLIEE', 'CLOTUREE', 'ANNULEE'];
const CAMP_LABELS = {
  BROUILLON: 'Brouillon',
  PUBLIEE: 'Publiée',
  CLOTUREE: 'Clôturée',
  ANNULEE: 'Annulée',
};

const DEM_STATUTS = ['EN_ATTENTE', 'VALIDE', 'REJETE'];
const DEM_LABELS = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validée',
  REJETE: 'Rejetée',
};

function pct(part, total) {
  if (!total) return 0;
  return Math.round((1000 * part) / total) / 10;
}

function resolveSexe(raw) {
  const key = String(raw || '').trim().toUpperCase();
  if (key === 'M' || key === 'F') return key;
  return null;
}

function parseFilters(query = {}) {
  const niveauRaw = query.niveau != null && String(query.niveau).trim() !== ''
    ? Number(query.niveau)
    : null;
  return {
    etablissementId: query.etablissementId ? String(query.etablissementId).trim() : null,
    filiereId: query.filiereId ? String(query.filiereId).trim() : null,
    ville: query.ville ? String(query.ville).trim() : null,
    niveau: Number.isFinite(niveauRaw) && niveauRaw >= 1 && niveauRaw <= 5 ? niveauRaw : null,
    sexe: resolveSexe(query.sexe),
  };
}

async function resolveScopeAnnee(req) {
  const toutes = req.query?.toutesAnnees === '1' || req.query?.toutesAnnees === 'true';
  const queryId = req.query?.anneeAcademiqueId;

  if (toutes) {
    return { anneeLibelle: null, annee: null, scope: 'all' };
  }
  if (queryId) {
    const annee = await prisma.anneeAcademique.findUnique({ where: { id: String(queryId) } });
    if (!annee) return { error: 'Année académique introuvable', status: 404 };
    return { anneeLibelle: annee.libelle, annee, scope: 'selected' };
  }
  const annee = await getAnneeEnCoursDges();
  if (!annee) {
    return { anneeLibelle: null, annee: null, scope: 'none' };
  }
  return { anneeLibelle: annee.libelle, annee, scope: 'current' };
}

function anneeWhere(anneeLibelle) {
  if (!anneeLibelle) return {};
  return { anneeAcademique: anneeLibelle };
}

async function chargerOptionsFiltres() {
  const [annees, etablissements, filieres] = await Promise.all([
    prisma.anneeAcademique.findMany({
      orderBy: { libelle: 'desc' },
      select: { id: true, libelle: true, enCoursDges: true },
    }),
    prisma.etablissement.findMany({
      where: { type: 'PRIVE' },
      select: { id: true, nom: true, ville: true },
      orderBy: { nom: 'asc' },
    }),
    prisma.filiere.findMany({
      where: { etablissement: { type: 'PRIVE' } },
      select: {
        id: true,
        nom: true,
        code: true,
        niveau: true,
        etablissementId: true,
        etablissement: { select: { nom: true } },
      },
      orderBy: [{ nom: 'asc' }],
    }),
  ]);

  const villes = [...new Set(etablissements.map((e) => e.ville).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'fr'));

  return {
    annees: annees.map((a) => ({
      id: a.id,
      libelle: a.libelle,
      enCours: Boolean(a.enCoursDges),
    })),
    etablissements: etablissements.map((e) => ({
      id: e.id,
      nom: e.nom,
      ville: e.ville,
    })),
    filieres: filieres.map((f) => ({
      id: f.id,
      nom: f.nom,
      code: f.code,
      niveauCycle: f.niveau,
      etablissementId: f.etablissementId,
      etablissementNom: f.etablissement?.nom,
    })),
    villes,
    niveaux: [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `Année ${n}` })),
    sexes: [
      { value: 'tous', label: 'Tous' },
      { value: 'M', label: 'Masculin' },
      { value: 'F', label: 'Féminin' },
    ],
  };
}

function buildEtabWhere(filters) {
  const where = { type: 'PRIVE' };
  if (filters.etablissementId) where.id = filters.etablissementId;
  if (filters.ville) where.ville = filters.ville;
  return where;
}

function buildScopedEntityWhere(filters, anneeLibelle) {
  const where = {
    ...anneeWhere(anneeLibelle),
    etablissement: buildEtabWhere(filters),
  };
  if (filters.etablissementId) {
    where.etablissementId = filters.etablissementId;
  }
  if (filters.filiereId) where.filiereId = filters.filiereId;
  if (filters.niveau) where.niveau = filters.niveau;
  if (filters.sexe) {
    where.candidat = { sexe: filters.sexe };
  }
  return where;
}

function countByKey(rows, keyField, order, labels) {
  const clean = Object.fromEntries(order.map((k) => [k, 0]));
  for (const row of rows) {
    const k = row[keyField];
    if (!(k in clean)) continue;
    const c = typeof row._count === 'number' ? row._count : row._count?._all || 0;
    clean[k] = c;
  }
  return order.map((key) => ({
    key,
    label: labels[key] || key,
    value: clean[key],
  }));
}

async function chargerTableauDeBord(req) {
  const scope = await resolveScopeAnnee(req);
  if (scope.error) return { ok: false, error: scope.error, status: scope.status };

  const filters = parseFilters(req.query || {});
  const anneeLibelle = scope.anneeLibelle;
  const options = await chargerOptionsFiltres();
  const etabWhere = buildEtabWhere(filters);
  const entityWhere = buildScopedEntityWhere(filters, anneeLibelle);

  const [
    etablissementsCount,
    filieresCount,
    adminsCount,
    campagnesGrouped,
    applicationsGrouped,
    preinscriptionsGrouped,
    inscriptionsGrouped,
    demandesGrouped,
    inscriptionsList,
    preinscriptionsList,
    applicationsList,
    campagnesList,
  ] = await Promise.all([
    prisma.etablissement.count({ where: etabWhere }),
    prisma.filiere.count({
      where: {
        etablissement: etabWhere,
        ...(filters.filiereId ? { id: filters.filiereId } : {}),
      },
    }),
    prisma.adminEtablissement.count({
      where: { etablissement: etabWhere },
    }),
    prisma.campagneInscription.groupBy({
      by: ['statut'],
      where: {
        ...anneeWhere(anneeLibelle),
        etablissement: etabWhere,
      },
      _count: true,
    }),
    prisma.application.groupBy({
      by: ['status'],
      where: entityWhere,
      _count: true,
    }),
    prisma.preinscriptionEtablissement.groupBy({
      by: ['statut'],
      where: entityWhere,
      _count: true,
    }),
    prisma.inscriptionAcademique.groupBy({
      by: ['statut'],
      where: entityWhere,
      _count: true,
    }),
    prisma.demandeAjoutFiliere.groupBy({
      by: ['statut'],
      where: { etablissement: etabWhere },
      _count: true,
    }),
    prisma.inscriptionAcademique.findMany({
      where: entityWhere,
      select: {
        id: true,
        statut: true,
        niveau: true,
        anneeAcademique: true,
        etablissementId: true,
        filiereId: true,
        candidat: { select: { sexe: true } },
        etablissement: { select: { id: true, nom: true, ville: true } },
        filiere: { select: { id: true, nom: true, code: true, niveau: true } },
      },
    }),
    prisma.preinscriptionEtablissement.findMany({
      where: entityWhere,
      select: {
        id: true,
        statut: true,
        niveau: true,
        etablissementId: true,
        filiereId: true,
        candidat: { select: { sexe: true } },
        etablissement: { select: { id: true, nom: true, ville: true } },
        filiere: { select: { id: true, nom: true, code: true } },
      },
    }),
    prisma.application.findMany({
      where: entityWhere,
      select: {
        id: true,
        status: true,
        niveau: true,
        etablissementId: true,
        filiereId: true,
        candidat: { select: { sexe: true } },
        etablissement: { select: { id: true, nom: true, ville: true } },
        filiere: { select: { id: true, nom: true, code: true } },
      },
    }),
    prisma.campagneInscription.findMany({
      where: {
        ...anneeWhere(anneeLibelle),
        etablissement: etabWhere,
      },
      select: {
        id: true,
        titre: true,
        statut: true,
        anneeAcademique: true,
        etablissementId: true,
        etablissement: { select: { id: true, nom: true, ville: true } },
        _count: { select: { filieres: true } },
      },
      orderBy: { titre: 'asc' },
    }),
  ]);

  const campagnesParStatut = countByKey(campagnesGrouped, 'statut', CAMP_STATUTS, CAMP_LABELS);
  const applicationsParStatut = countByKey(applicationsGrouped, 'status', APP_STATUTS, APP_LABELS);
  const preinscriptionsParStatut = countByKey(preinscriptionsGrouped, 'statut', PRE_STATUTS, PRE_LABELS);
  const inscriptionsParStatut = countByKey(inscriptionsGrouped, 'statut', INS_STATUTS, INS_LABELS);
  const demandesParStatut = countByKey(demandesGrouped, 'statut', DEM_STATUTS, DEM_LABELS);

  const sum = (arr) => arr.reduce((a, b) => a + b.value, 0);
  const totalPre = sum(preinscriptionsParStatut);
  const totalIns = sum(inscriptionsParStatut);
  const totalApp = sum(applicationsParStatut);
  const totalCamp = sum(campagnesParStatut);
  const preValidees = preinscriptionsParStatut.find((x) => x.key === 'VALIDE')?.value || 0;
  const preRejetees = preinscriptionsParStatut.find((x) => x.key === 'REJETE')?.value || 0;
  const insValides = inscriptionsParStatut.find((x) => x.key === 'VALIDE')?.value || 0;
  const insRedoublants = inscriptionsParStatut.find((x) => x.key === 'REDOUBLANT')?.value || 0;
  const insEnCours = inscriptionsParStatut.find((x) => x.key === 'EN_COURS')?.value || 0;
  const decisionsAnnee = insValides + insRedoublants;
  const campPubliees = campagnesParStatut.find((x) => x.key === 'PUBLIEE')?.value || 0;
  const demAttente = demandesParStatut.find((x) => x.key === 'EN_ATTENTE')?.value || 0;

  const etabMap = new Map();
  function touchEtab(etab) {
    if (!etab?.id) return null;
    if (!etabMap.has(etab.id)) {
      etabMap.set(etab.id, {
        etablissementId: etab.id,
        nom: etab.nom,
        ville: etab.ville,
        candidatures: 0,
        preinscriptions: 0,
        preValidees: 0,
        preRejetees: 0,
        preAttente: 0,
        inscriptions: 0,
        enCours: 0,
        passants: 0,
        redoublants: 0,
        abandonnes: 0,
        campagnes: 0,
        campagnesPubliees: 0,
      });
    }
    return etabMap.get(etab.id);
  }

  for (const c of campagnesList) {
    const row = touchEtab(c.etablissement);
    if (!row) continue;
    row.campagnes += 1;
    if (c.statut === 'PUBLIEE') row.campagnesPubliees += 1;
  }
  for (const a of applicationsList) {
    const row = touchEtab(a.etablissement);
    if (row) row.candidatures += 1;
  }
  for (const pe of preinscriptionsList) {
    const row = touchEtab(pe.etablissement);
    if (!row) continue;
    row.preinscriptions += 1;
    if (pe.statut === 'VALIDE') row.preValidees += 1;
    else if (pe.statut === 'REJETE') row.preRejetees += 1;
    else if (pe.statut === 'EN_ATTENTE') row.preAttente += 1;
  }
  for (const ins of inscriptionsList) {
    const row = touchEtab(ins.etablissement);
    if (!row) continue;
    row.inscriptions += 1;
    if (ins.statut === 'EN_COURS') row.enCours += 1;
    else if (ins.statut === 'VALIDE') row.passants += 1;
    else if (ins.statut === 'REDOUBLANT') row.redoublants += 1;
    else if (ins.statut === 'ABANDONNE') row.abandonnes += 1;
  }

  const parEtablissement = [...etabMap.values()]
    .map((row) => ({
      ...row,
      tauxValidationPre: pct(row.preValidees, row.preinscriptions),
      tauxReussite: pct(row.passants, row.passants + row.redoublants),
    }))
    .sort((a, b) => b.inscriptions - a.inscriptions || a.nom.localeCompare(b.nom, 'fr'));

  const filMap = new Map();
  function touchFil(filiere, etab) {
    if (!filiere?.id) return null;
    if (!filMap.has(filiere.id)) {
      filMap.set(filiere.id, {
        filiereId: filiere.id,
        nom: filiere.nom,
        code: filiere.code,
        etablissementId: etab?.id,
        etablissementNom: etab?.nom,
        candidatures: 0,
        preinscriptions: 0,
        preValidees: 0,
        inscriptions: 0,
        enCours: 0,
        passants: 0,
        redoublants: 0,
      });
    }
    return filMap.get(filiere.id);
  }
  for (const a of applicationsList) {
    const row = touchFil(a.filiere, a.etablissement);
    if (row) row.candidatures += 1;
  }
  for (const pe of preinscriptionsList) {
    const row = touchFil(pe.filiere, pe.etablissement);
    if (!row) continue;
    row.preinscriptions += 1;
    if (pe.statut === 'VALIDE') row.preValidees += 1;
  }
  for (const ins of inscriptionsList) {
    const row = touchFil(ins.filiere, ins.etablissement);
    if (!row) continue;
    row.inscriptions += 1;
    if (ins.statut === 'EN_COURS') row.enCours += 1;
    else if (ins.statut === 'VALIDE') row.passants += 1;
    else if (ins.statut === 'REDOUBLANT') row.redoublants += 1;
  }
  const parFiliere = [...filMap.values()]
    .map((row) => ({
      ...row,
      tauxValidationPre: pct(row.preValidees, row.preinscriptions),
      tauxReussite: pct(row.passants, row.passants + row.redoublants),
    }))
    .sort((a, b) => b.inscriptions - a.inscriptions || a.nom.localeCompare(b.nom, 'fr'));

  const sexeBuckets = {
    M: { key: 'M', label: 'Masculin', candidatures: 0, preinscriptions: 0, preValidees: 0, inscriptions: 0, passants: 0, redoublants: 0 },
    F: { key: 'F', label: 'Féminin', candidatures: 0, preinscriptions: 0, preValidees: 0, inscriptions: 0, passants: 0, redoublants: 0 },
    NA: { key: 'NA', label: 'Non renseigné', candidatures: 0, preinscriptions: 0, preValidees: 0, inscriptions: 0, passants: 0, redoublants: 0 },
  };
  const sexeKey = (c) => {
    const s = String(c?.sexe || '').toUpperCase();
    if (s === 'M' || s === 'F') return s;
    return 'NA';
  };
  for (const a of applicationsList) sexeBuckets[sexeKey(a.candidat)].candidatures += 1;
  for (const pe of preinscriptionsList) {
    const b = sexeBuckets[sexeKey(pe.candidat)];
    b.preinscriptions += 1;
    if (pe.statut === 'VALIDE') b.preValidees += 1;
  }
  for (const ins of inscriptionsList) {
    const b = sexeBuckets[sexeKey(ins.candidat)];
    b.inscriptions += 1;
    if (ins.statut === 'VALIDE') b.passants += 1;
    if (ins.statut === 'REDOUBLANT') b.redoublants += 1;
  }
  const parSexe = Object.values(sexeBuckets);

  const niveauMap = new Map();
  for (let n = 1; n <= 5; n++) {
    niveauMap.set(n, {
      niveau: n,
      label: `Année ${n}`,
      candidatures: 0,
      preinscriptions: 0,
      preValidees: 0,
      inscriptions: 0,
      enCours: 0,
      passants: 0,
      redoublants: 0,
    });
  }
  for (const a of applicationsList) {
    const n = Number(a.niveau);
    if (niveauMap.has(n)) niveauMap.get(n).candidatures += 1;
  }
  for (const pe of preinscriptionsList) {
    const n = Number(pe.niveau);
    if (!niveauMap.has(n)) continue;
    const row = niveauMap.get(n);
    row.preinscriptions += 1;
    if (pe.statut === 'VALIDE') row.preValidees += 1;
  }
  for (const ins of inscriptionsList) {
    const n = Number(ins.niveau);
    if (!niveauMap.has(n)) continue;
    const row = niveauMap.get(n);
    row.inscriptions += 1;
    if (ins.statut === 'EN_COURS') row.enCours += 1;
    else if (ins.statut === 'VALIDE') row.passants += 1;
    else if (ins.statut === 'REDOUBLANT') row.redoublants += 1;
  }
  const parNiveau = [...niveauMap.values()];

  const villeMap = new Map();
  for (const row of parEtablissement) {
    const v = row.ville || '—';
    if (!villeMap.has(v)) {
      villeMap.set(v, {
        ville: v,
        etablissements: 0,
        candidatures: 0,
        preinscriptions: 0,
        inscriptions: 0,
        passants: 0,
        redoublants: 0,
      });
    }
    const bucket = villeMap.get(v);
    bucket.etablissements += 1;
    bucket.candidatures += row.candidatures;
    bucket.preinscriptions += row.preinscriptions;
    bucket.inscriptions += row.inscriptions;
    bucket.passants += row.passants;
    bucket.redoublants += row.redoublants;
  }
  const parVille = [...villeMap.values()].sort((a, b) => b.inscriptions - a.inscriptions);

  const kpis = {
    etablissements: etablissementsCount,
    filieres: filieresCount,
    admins: adminsCount,
    campagnes: totalCamp,
    campagnesPubliees: campPubliees,
    candidatures: totalApp,
    preinscriptions: totalPre,
    preValidees,
    preRejetees,
    preAttente: preinscriptionsParStatut.find((x) => x.key === 'EN_ATTENTE')?.value || 0,
    tauxValidationPre: pct(preValidees, totalPre),
    inscriptions: totalIns,
    inscriptionsEnCours: insEnCours,
    passants: insValides,
    redoublants: insRedoublants,
    tauxReussite: pct(insValides, decisionsAnnee),
    demandesFilieresAttente: demAttente,
    demandesFilieres: sum(demandesParStatut),
  };

  return {
    ok: true,
    scope: {
      scope: scope.scope,
      annee: scope.annee
        ? { id: scope.annee.id, libelle: scope.annee.libelle, enCoursDges: scope.annee.enCoursDges }
        : null,
    },
    filters,
    options,
    kpis,
    campagnesParStatut,
    applicationsParStatut,
    preinscriptionsParStatut,
    inscriptionsParStatut,
    demandesParStatut,
    parSexe,
    parNiveau,
    parVille,
    parEtablissement,
    parFiliere,
    campagnes: campagnesList.map((c) => ({
      id: c.id,
      titre: c.titre,
      statut: c.statut,
      anneeAcademique: c.anneeAcademique,
      etablissementId: c.etablissementId,
      etablissementNom: c.etablissement?.nom,
      ville: c.etablissement?.ville,
      nFilieres: c._count?.filieres || 0,
    })),
  };
}

function tableauDeBordToCsv(payload) {
  const lines = [];
  const push = (arr) => lines.push(arr.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'));

  push(['Tableau de bord DGES']);
  push(['Périmètre', payload.scope?.annee?.libelle || (payload.scope?.scope === 'all' ? 'Toutes les années' : '—')]);
  push([]);
  push(['Indicateur', 'Valeur']);
  const k = payload.kpis || {};
  for (const row of [
    ['Établissements privés', k.etablissements],
    ['Filières', k.filieres],
    ['Admins établissement', k.admins],
    ['Campagnes', k.campagnes],
    ['Campagnes publiées', k.campagnesPubliees],
    ['Candidatures', k.candidatures],
    ['Préinscriptions', k.preinscriptions],
    ['Préinscriptions validées', k.preValidees],
    ['Préinscriptions rejetées', k.preRejetees],
    ['Taux validation préinscription (%)', k.tauxValidationPre],
    ['Inscriptions académiques', k.inscriptions],
    ['En cours', k.inscriptionsEnCours],
    ['Passants', k.passants],
    ['Redoublants', k.redoublants],
    ['Taux de réussite (%)', k.tauxReussite],
    ['Demandes filières (attente)', k.demandesFilieresAttente],
  ]) {
    push(row);
  }

  push([]);
  push(['Par établissement']);
  push([
    'Établissement', 'Ville', 'Candidatures', 'Préinscriptions', 'Validées',
    'Inscriptions', 'En cours', 'Passants', 'Redoublants', 'Taux réussite %',
  ]);
  for (const row of payload.parEtablissement || []) {
    push([
      row.nom, row.ville, row.candidatures, row.preinscriptions, row.preValidees,
      row.inscriptions, row.enCours, row.passants, row.redoublants, row.tauxReussite,
    ]);
  }

  push([]);
  push(['Par filière']);
  push([
    'Filière', 'Code', 'Établissement', 'Candidatures', 'Préinscriptions',
    'Inscriptions', 'Passants', 'Redoublants', 'Taux réussite %',
  ]);
  for (const row of payload.parFiliere || []) {
    push([
      row.nom, row.code, row.etablissementNom, row.candidatures, row.preinscriptions,
      row.inscriptions, row.passants, row.redoublants, row.tauxReussite,
    ]);
  }

  return `\uFEFF${lines.join('\n')}`;
}

function describeFiltres(payload) {
  const parts = [];
  if (payload.scope?.annee?.libelle) parts.push(`Année ${payload.scope.annee.libelle}`);
  else if (payload.scope?.scope === 'all') parts.push('Toutes les années');
  const f = payload.filters || {};
  if (f.ville) parts.push(`Ville ${f.ville}`);
  if (f.etablissementId) {
    const etab = (payload.options?.etablissements || []).find((e) => e.id === f.etablissementId);
    parts.push(etab?.nom || 'Établissement filtré');
  }
  if (f.filiereId) {
    const fil = (payload.options?.filieres || []).find((x) => x.id === f.filiereId);
    parts.push(fil?.nom || 'Filière filtrée');
  }
  if (f.niveau) parts.push(`Niveau ${f.niveau}`);
  if (f.sexe) parts.push(f.sexe === 'M' ? 'Masculin' : 'Féminin');
  return parts.join(' · ') || 'Aucun filtre';
}

module.exports = {
  chargerTableauDeBord,
  tableauDeBordToCsv,
  describeFiltres,
};
