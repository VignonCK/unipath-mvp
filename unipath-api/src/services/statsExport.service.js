const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const prisma = require('../prisma');
const {
  metaFiltersFromParsed,
  buildInscriptionWhere,
  buildCampagneApplicationWhere,
} = require('../utils/stats-filters.helper');

const ACCEPTES = ['VALIDE', 'VALIDE_PAR_COMMISSION'];
const REJETES = ['REJETE', 'REJETE_PAR_COMMISSION'];
const SOUS_RESERVE = ['SOUS_RESERVE', 'SOUS_RESERVE_PAR_COMMISSION'];
const PREINSCRIPTION_ACCEPTES = ['VALIDE'];
const PREINSCRIPTION_REJETES = ['REJETE'];
const PREINSCRIPTION_SOUS_RESERVE = ['SOUS_RESERVE'];

const EMPTY_COUNTS = { acceptes: 0, rejetes: 0, enAttente: 0, sousReserve: 0 };
const EMPTY_SEXE = { M: 0, F: 0, nonRenseigne: 0 };

const HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDBEAFE' },
};

function categorizeStatut(statut) {
  if (ACCEPTES.includes(statut)) return 'acceptes';
  if (REJETES.includes(statut)) return 'rejetes';
  if (SOUS_RESERVE.includes(statut)) return 'sousReserve';
  return 'enAttente';
}

function categorizePreinscriptionStatut(statut) {
  if (PREINSCRIPTION_ACCEPTES.includes(statut)) return 'acceptes';
  if (PREINSCRIPTION_REJETES.includes(statut)) return 'rejetes';
  if (PREINSCRIPTION_SOUS_RESERVE.includes(statut)) return 'sousReserve';
  return 'enAttente';
}

function categorizeSexe(sexe) {
  const normalized = String(sexe || '').trim().toUpperCase();
  if (normalized === 'M') return 'M';
  if (normalized === 'F') return 'F';
  return 'nonRenseigne';
}

function emptyCounts() {
  return { ...EMPTY_COUNTS };
}

function emptySexeCounts() {
  return { ...EMPTY_SEXE };
}

function countSexeFromItems(items, getSexe) {
  const counts = emptySexeCounts();
  for (const item of items) {
    counts[categorizeSexe(getSexe(item))] += 1;
  }
  return counts;
}

function sumCounts(acc, row) {
  return {
    totalCandidats: acc.totalCandidats + row.totalCandidats,
    acceptes: acc.acceptes + row.acceptes,
    rejetes: acc.rejetes + row.rejetes,
    enAttente: acc.enAttente + row.enAttente,
    sousReserve: acc.sousReserve + row.sousReserve,
  };
}

function sumSexe(acc, row) {
  const sexe = row.repartitionSexe || EMPTY_SEXE;
  return {
    M: acc.M + sexe.M,
    F: acc.F + sexe.F,
    nonRenseigne: acc.nonRenseigne + sexe.nonRenseigne,
  };
}

function formatSexeLine(repartitionSexe = EMPTY_SEXE) {
  return `Masculin : ${repartitionSexe.M} | Féminin : ${repartitionSexe.F}`
    + ` | Non renseigné : ${repartitionSexe.nonRenseigne}`;
}

function resolvePreinscriptionStatut(application) {
  return application.preinscription?.statut || 'EN_ATTENTE';
}

function getEtablissementLabel(concours) {
  return concours.etablissementOrganisateur?.nom
    || concours.etablissement
    || 'Non renseigné';
}

function buildCentreBreakdown(concours) {
  const centreMap = new Map();

  for (const cc of concours.centresActifs || []) {
    centreMap.set(cc.id, {
      concoursCentreId: cc.id,
      nom: cc.centre?.nom || 'Centre',
      ville: cc.centre?.ville || '',
      adresse: cc.centre?.adresse || null,
      capacite: cc.capacite ?? null,
      affectes: 0,
    });
  }

  let nonAssignes = 0;

  for (const ins of concours.inscriptions || []) {
    const di = ins.dossierInscription;
    if (!di) {
      nonAssignes += 1;
      continue;
    }

    if (di.concoursCentreId) {
      if (!centreMap.has(di.concoursCentreId)) {
        const cc = di.centreChoisi;
        centreMap.set(di.concoursCentreId, {
          concoursCentreId: di.concoursCentreId,
          nom: cc?.centre?.nom || 'Centre inconnu',
          ville: cc?.centre?.ville || '',
          adresse: cc?.centre?.adresse || null,
          capacite: cc?.capacite ?? null,
          affectes: 0,
        });
      }
      centreMap.get(di.concoursCentreId).affectes += 1;
    } else if (di.centreCompositionChoisi?.nom) {
      const key = `legacy:${di.centreCompositionChoisi.nom}`;
      if (!centreMap.has(key)) {
        centreMap.set(key, {
          nom: di.centreCompositionChoisi.nom,
          ville: di.centreCompositionChoisi.ville || '',
          adresse: di.centreCompositionChoisi.adresse || null,
          capacite: null,
          affectes: 0,
        });
      }
      centreMap.get(key).affectes += 1;
    } else {
      nonAssignes += 1;
    }
  }

  const parCentre = [...centreMap.values()].sort((a, b) => b.affectes - a.affectes);
  if (nonAssignes > 0) {
    parCentre.push({
      nom: 'Non assigné',
      ville: '',
      adresse: null,
      capacite: null,
      affectes: nonAssignes,
    });
  }

  return parCentre;
}

function buildConcoursStats(concours) {
  const counts = emptyCounts();
  const inscriptions = concours.inscriptions || [];
  const totalCandidats = inscriptions.length;

  for (const ins of inscriptions) {
    const statut = ins.dossierInscription?.statut || 'EN_ATTENTE';
    counts[categorizeStatut(statut)] += 1;
  }

  const tauxValidationPct = totalCandidats > 0
    ? Math.round((counts.acceptes / totalCandidats) * 10000) / 100
    : 0;

  return {
    concoursId: concours.id,
    libelle: concours.libelle,
    description: concours.description ?? null,
    dateDebut: concours.dateDebut ?? null,
    dateFin: concours.dateFin ?? null,
    etablissement: getEtablissementLabel(concours),
    etablissementId: concours.etablissementId || null,
    totalCandidats,
    acceptes: counts.acceptes,
    rejetes: counts.rejetes,
    enAttente: counts.enAttente,
    sousReserve: counts.sousReserve,
    repartitionSexe: countSexeFromItems(inscriptions, (ins) => ins.candidat?.sexe),
    tauxValidationPct,
    parCentre: buildCentreBreakdown(concours),
  };
}

function buildParEtablissement(parConcours) {
  const groups = new Map();

  for (const stats of parConcours) {
    const key = stats.etablissementId
      ? `id:${stats.etablissementId}`
      : `text:${stats.etablissement.toLowerCase()}`;

    if (!groups.has(key)) {
      groups.set(key, {
        etablissementId: stats.etablissementId,
        nom: stats.etablissement,
        nbConcours: 0,
        totalCandidats: 0,
        acceptes: 0,
        rejetes: 0,
        enAttente: 0,
        sousReserve: 0,
        concours: [],
      });
    }

    const group = groups.get(key);
    group.nbConcours += 1;
    group.totalCandidats += stats.totalCandidats;
    group.acceptes += stats.acceptes;
    group.rejetes += stats.rejetes;
    group.enAttente += stats.enAttente;
    group.sousReserve += stats.sousReserve;
    group.concours.push(stats);
  }

  return [...groups.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

function buildCampagneStatsRow(campagne, applications) {
  const counts = emptyCounts();
  for (const app of applications) {
    const statut = resolvePreinscriptionStatut(app);
    counts[categorizePreinscriptionStatut(statut)] += 1;
  }

  const totalCandidats = applications.length;
  const tauxValidationPct = totalCandidats > 0
    ? Math.round((counts.acceptes / totalCandidats) * 10000) / 100
    : 0;

  return {
    campagneId: campagne.id,
    titre: campagne.titre,
    anneeAcademique: campagne.anneeAcademique,
    statutCampagne: campagne.statut,
    etablissement: campagne.etablissement?.nom || 'Non renseigné',
    etablissementId: campagne.etablissementId,
    ville: campagne.etablissement?.ville || null,
    totalCandidats,
    acceptes: counts.acceptes,
    rejetes: counts.rejetes,
    enAttente: counts.enAttente,
    sousReserve: counts.sousReserve,
    repartitionSexe: countSexeFromItems(applications, (app) => app.candidat?.sexe),
    tauxValidationPct,
  };
}

function buildParEtablissementPrive(parCampagne) {
  const groups = new Map();

  for (const stats of parCampagne) {
    const key = stats.etablissementId
      ? `id:${stats.etablissementId}`
      : `text:${stats.etablissement.toLowerCase()}`;

    if (!groups.has(key)) {
      groups.set(key, {
        etablissementId: stats.etablissementId,
        nom: stats.etablissement,
        ville: stats.ville,
        nbCampagnes: 0,
        totalCandidats: 0,
        acceptes: 0,
        rejetes: 0,
        enAttente: 0,
        sousReserve: 0,
        campagnes: [],
      });
    }

    const group = groups.get(key);
    group.nbCampagnes += 1;
    group.totalCandidats += stats.totalCandidats;
    group.acceptes += stats.acceptes;
    group.rejetes += stats.rejetes;
    group.enAttente += stats.enAttente;
    group.sousReserve += stats.sousReserve;
    group.campagnes.push(stats);
  }

  return [...groups.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

async function collectCampagneStats(filters = {}, scope = null) {
  if (filters.concoursId || filters.centreId) {
    return {
      totaux: { totalCandidats: 0, ...emptyCounts(), repartitionSexe: emptySexeCounts() },
      parCampagne: [],
      parEtablissement: [],
    };
  }

  if (!assertEtablissementInScope(filters, scope)) {
    const err = new Error('Accès refusé pour les filtres demandés');
    err.status = 403;
    throw err;
  }

  const applicationWhere = buildCampagneApplicationWhere(filters, scope);
  const applications = await prisma.application.findMany({
    where: applicationWhere,
    include: {
      candidat: { select: { sexe: true } },
      preinscription: { select: { statut: true } },
      campagneFiliere: {
        include: {
          campagne: {
            include: {
              etablissement: { select: { id: true, nom: true, ville: true, type: true } },
            },
          },
        },
      },
    },
  });

  const campagneMap = new Map();
  const appsByCampagne = new Map();

  for (const app of applications) {
    const campagne = app.campagneFiliere?.campagne;
    if (!campagne) continue;

    if (!campagneMap.has(campagne.id)) {
      campagneMap.set(campagne.id, campagne);
      appsByCampagne.set(campagne.id, []);
    }
    appsByCampagne.get(campagne.id).push(app);
  }

  const parCampagne = [...campagneMap.values()]
    .map((campagne) => buildCampagneStatsRow(campagne, appsByCampagne.get(campagne.id) || []))
    .sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));

  const parEtablissement = buildParEtablissementPrive(parCampagne);

  const totaux = parCampagne.reduce(sumCounts, { totalCandidats: 0, ...emptyCounts() });
  totaux.repartitionSexe = parCampagne.reduce(sumSexe, emptySexeCounts());

  return { totaux, parCampagne, parEtablissement };
}

function getAllowedConcoursIds(scope) {
  if (!scope) return null;
  if (scope.concoursId) return [scope.concoursId];
  if (Array.isArray(scope.concoursIds)) return scope.concoursIds;
  return null;
}

function buildConcoursWhere(filters = {}, scope = null) {
  const where = {};

  if (filters.concoursId) {
    where.id = filters.concoursId;
  }

  if (filters.etablissementId) {
    where.etablissementId = filters.etablissementId;
  }

  const allowed = getAllowedConcoursIds(scope);
  if (allowed) {
    if (allowed.length === 0) {
      where.id = { in: [] };
    } else if (filters.concoursId) {
      where.id = allowed.includes(filters.concoursId) ? filters.concoursId : { in: [] };
    } else {
      where.id = { in: allowed };
    }
  }

  return where;
}

function assertFiltersInScope(filters, scope) {
  const allowed = getAllowedConcoursIds(scope);
  if (!allowed || !filters.concoursId) {
    return true;
  }
  return allowed.includes(filters.concoursId);
}

function assertEtablissementInScope(filters, scope) {
  if (!scope?.etablissementId || !filters.etablissementId) {
    return true;
  }
  return scope.etablissementId === filters.etablissementId;
}

async function collectStats(filters = {}, scope = null) {
  if (!assertFiltersInScope(filters, scope) || !assertEtablissementInScope(filters, scope)) {
    const err = new Error('Accès refusé pour les filtres demandés');
    err.status = 403;
    throw err;
  }

  const centresWhere = { estActif: true };
  if (filters.anneeAcademique) {
    centresWhere.anneeAcademique = filters.anneeAcademique;
  }

  const inscriptionWhere = buildInscriptionWhere(filters);

  const concoursList = await prisma.concours.findMany({
    where: buildConcoursWhere(filters, scope),
    include: {
      etablissementOrganisateur: {
        select: { id: true, nom: true, ville: true },
      },
      inscriptions: {
        where: inscriptionWhere,
        include: {
          candidat: { select: { sexe: true } },
          dossierInscription: {
            include: {
              centreChoisi: { include: { centre: true } },
            },
          },
        },
      },
      centresActifs: {
        where: centresWhere,
        include: {
          centre: true,
          _count: { select: { dossiers: true } },
        },
      },
    },
    orderBy: { dateDebut: 'desc' },
  });

  const parConcours = concoursList.map(buildConcoursStats);
  const parEtablissement = buildParEtablissement(parConcours);
  const campagnes = await collectCampagneStats(filters, scope);

  const totaux = parConcours.reduce(sumCounts, { totalCandidats: 0, ...emptyCounts() });
  totaux.repartitionSexe = parConcours.reduce(sumSexe, emptySexeCounts());

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      filters: metaFiltersFromParsed(filters),
    },
    totaux,
    parConcours,
    parEtablissement,
    campagnes,
  };
}

function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  row.height = 22;
}

function autoFitWorksheet(worksheet) {
  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value == null ? '' : String(cell.value);
      maxLength = Math.max(maxLength, value.length + 2);
    });
    column.width = Math.min(maxLength, 48);
  });
}

async function generateExcel(stats) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'UniPath';
  workbook.created = new Date(stats.meta.generatedAt);

  const sheetGlobal = workbook.addWorksheet('Synthèse globale');
  sheetGlobal.addRow([
    'Module',
    'Total',
    'Acceptés / Validés',
    'Rejetés',
    'En attente',
    'Sous réserve',
    'Masculin (M)',
    'Féminin (F)',
    'Non renseigné',
  ]);
  styleHeaderRow(sheetGlobal.getRow(1));
  sheetGlobal.addRow([
    'Concours',
    stats.totaux.totalCandidats,
    stats.totaux.acceptes,
    stats.totaux.rejetes,
    stats.totaux.enAttente,
    stats.totaux.sousReserve,
    stats.totaux.repartitionSexe?.M ?? 0,
    stats.totaux.repartitionSexe?.F ?? 0,
    stats.totaux.repartitionSexe?.nonRenseigne ?? 0,
  ]);
  sheetGlobal.addRow([
    'Établissements privés',
    stats.campagnes?.totaux?.totalCandidats ?? 0,
    stats.campagnes?.totaux?.acceptes ?? 0,
    stats.campagnes?.totaux?.rejetes ?? 0,
    stats.campagnes?.totaux?.enAttente ?? 0,
    stats.campagnes?.totaux?.sousReserve ?? 0,
    stats.campagnes?.totaux?.repartitionSexe?.M ?? 0,
    stats.campagnes?.totaux?.repartitionSexe?.F ?? 0,
    stats.campagnes?.totaux?.repartitionSexe?.nonRenseigne ?? 0,
  ]);
  autoFitWorksheet(sheetGlobal);
  sheetGlobal.views = [{ state: 'frozen', ySplit: 1 }];

  const sheetSynth = workbook.addWorksheet('Synthèse concours');
  sheetSynth.addRow([
    'Établissement',
    'Concours',
    'Total candidats',
    'Acceptés',
    'Rejetés',
    'En attente',
    'Sous réserve',
    'Masculin (M)',
    'Féminin (F)',
    'Non renseigné',
    'Taux validation %',
  ]);
  styleHeaderRow(sheetSynth.getRow(1));

  for (const row of stats.parConcours) {
    sheetSynth.addRow([
      row.etablissement,
      row.libelle,
      row.totalCandidats,
      row.acceptes,
      row.rejetes,
      row.enAttente,
      row.sousReserve,
      row.repartitionSexe?.M ?? 0,
      row.repartitionSexe?.F ?? 0,
      row.repartitionSexe?.nonRenseigne ?? 0,
      row.tauxValidationPct,
    ]);
  }
  autoFitWorksheet(sheetSynth);
  sheetSynth.views = [{ state: 'frozen', ySplit: 1 }];

  const sheetEtab = workbook.addWorksheet('Par établissement');
  sheetEtab.addRow([
    'Établissement',
    'Nb concours',
    'Total candidats',
    'Acceptés',
    'Rejetés',
    'En attente',
    'Sous réserve',
  ]);
  styleHeaderRow(sheetEtab.getRow(1));

  for (const row of stats.parEtablissement) {
    sheetEtab.addRow([
      row.nom,
      row.nbConcours,
      row.totalCandidats,
      row.acceptes,
      row.rejetes,
      row.enAttente,
      row.sousReserve,
    ]);
  }
  autoFitWorksheet(sheetEtab);
  sheetEtab.views = [{ state: 'frozen', ySplit: 1 }];

  const sheetCentres = workbook.addWorksheet('Centres de composition');
  sheetCentres.addRow([
    'Établissement',
    'Concours',
    'Centre',
    'Ville',
    'Capacité',
    'Candidats affectés',
    '% remplissage',
  ]);
  styleHeaderRow(sheetCentres.getRow(1));

  for (const concours of stats.parConcours) {
    for (const centre of concours.parCentre) {
      const pct = centre.capacite
        ? Math.round((centre.affectes / centre.capacite) * 10000) / 100
        : '';
      sheetCentres.addRow([
        concours.etablissement,
        concours.libelle,
        centre.nom,
        centre.ville,
        centre.capacite ?? '',
        centre.affectes,
        pct,
      ]);
    }
  }
  autoFitWorksheet(sheetCentres);
  sheetCentres.views = [{ state: 'frozen', ySplit: 1 }];

  const sheetCampagnes = workbook.addWorksheet('Synthèse campagnes');
  sheetCampagnes.addRow([
    'Établissement',
    'Campagne',
    'Année académique',
    'Total candidatures',
    'Validées',
    'Rejetées',
    'En attente',
    'Sous réserve',
    'Masculin (M)',
    'Féminin (F)',
    'Non renseigné',
    'Taux validation %',
  ]);
  styleHeaderRow(sheetCampagnes.getRow(1));

  for (const row of stats.campagnes?.parCampagne || []) {
    sheetCampagnes.addRow([
      row.etablissement,
      row.titre,
      row.anneeAcademique,
      row.totalCandidats,
      row.acceptes,
      row.rejetes,
      row.enAttente,
      row.sousReserve,
      row.repartitionSexe?.M ?? 0,
      row.repartitionSexe?.F ?? 0,
      row.repartitionSexe?.nonRenseigne ?? 0,
      row.tauxValidationPct,
    ]);
  }
  autoFitWorksheet(sheetCampagnes);
  sheetCampagnes.views = [{ state: 'frozen', ySplit: 1 }];

  const sheetEtabPrive = workbook.addWorksheet('EP privés par établissement');
  sheetEtabPrive.addRow([
    'Établissement',
    'Ville',
    'Nb campagnes',
    'Total candidatures',
    'Validées',
    'Rejetées',
    'En attente',
    'Sous réserve',
  ]);
  styleHeaderRow(sheetEtabPrive.getRow(1));

  for (const row of stats.campagnes?.parEtablissement || []) {
    sheetEtabPrive.addRow([
      row.nom,
      row.ville || '',
      row.nbCampagnes,
      row.totalCandidats,
      row.acceptes,
      row.rejetes,
      row.enAttente,
      row.sousReserve,
    ]);
  }
  autoFitWorksheet(sheetEtabPrive);
  sheetEtabPrive.views = [{ state: 'frozen', ySplit: 1 }];

  return workbook.xlsx.writeBuffer();
}

function formatDateFr(isoString) {
  return new Date(isoString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateText(doc, text, width) {
  if (!text) return '';
  let value = String(text);
  while (value.length > 0 && doc.widthOfString(value) > width) {
    value = value.slice(0, -1);
  }
  if (value.length < String(text).length) {
    return `${value.slice(0, Math.max(0, value.length - 3))}...`;
  }
  return value;
}

async function generatePdf(stats) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.font('Helvetica-Bold').fontSize(18).text('Statistiques des inscriptions', {
      align: 'center',
    });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).fillColor('#444444').text(
      `Généré le ${formatDateFr(stats.meta.generatedAt)}`,
      { align: 'center' },
    );

    const filters = stats.meta.filters;
    const filterParts = [];
    if (filters.sexe) filterParts.push(`Sexe: ${filters.sexe}`);
    if (filters.concoursId) filterParts.push(`Concours: ${filters.concoursId}`);
    if (filters.etablissementId) filterParts.push(`Établissement: ${filters.etablissementId}`);
    if (filters.statut) filterParts.push(`Statut: ${filters.statut}`);
    if (filters.centreId) filterParts.push(`Centre: ${filters.centreId}`);
    if (filters.anneeAcademique) filterParts.push(`Année: ${filters.anneeAcademique}`);
    if (filterParts.length > 0) {
      doc.text(`Filtres: ${filterParts.join(' | ')}`, { align: 'center' });
    }

    doc.moveDown(1.2).fillColor('#000000');
    doc.font('Helvetica-Bold').fontSize(13).text('Totaux globaux');
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(11);
    doc.text(`Total candidats : ${stats.totaux.totalCandidats}`);
    doc.text(`Acceptés : ${stats.totaux.acceptes}`);
    doc.text(`Rejetés : ${stats.totaux.rejetes}`);
    doc.text(`En attente : ${stats.totaux.enAttente}`);
    doc.text(`Sous réserve : ${stats.totaux.sousReserve}`);
    doc.text(`Répartition par sexe — ${formatSexeLine(stats.totaux.repartitionSexe)}`);

    doc.moveDown(1.2);
    doc.font('Helvetica-Bold').fontSize(13).text('Détail par concours');
    doc.moveDown(0.5);

    const columns = [
      { label: 'Concours', width: pageWidth * 0.24 },
      { label: 'Établissement', width: pageWidth * 0.18 },
      { label: 'Total', width: pageWidth * 0.09 },
      { label: 'Acceptés', width: pageWidth * 0.11 },
      { label: 'Rejetés', width: pageWidth * 0.11 },
      { label: 'Attente', width: pageWidth * 0.11 },
      { label: 'Sous rés.', width: pageWidth * 0.12 },
    ];

    const drawTableHeader = () => {
      const y = doc.y;
      let x = doc.page.margins.left;
      doc.font('Helvetica-Bold').fontSize(9);
      for (const col of columns) {
        doc.rect(x, y, col.width, 18).fillAndStroke('#DBEAFE', '#93C5FD');
        doc.fillColor('#111827').text(col.label, x + 4, y + 5, {
          width: col.width - 8,
          lineBreak: false,
        });
        x += col.width;
      }
      doc.fillColor('#000000');
      doc.y = y + 20;
    };

    const ensureSpace = (height = 18) => {
      if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        drawTableHeader();
      }
    };

    drawTableHeader();

    doc.font('Helvetica').fontSize(8.5);
    for (const row of stats.parConcours) {
      ensureSpace(18);
      const y = doc.y;
      let x = doc.page.margins.left;
      const values = [
        row.libelle,
        row.etablissement,
        String(row.totalCandidats),
        String(row.acceptes),
        String(row.rejetes),
        String(row.enAttente),
        String(row.sousReserve),
      ];

      for (let i = 0; i < columns.length; i += 1) {
        doc.rect(x, y, columns[i].width, 16).stroke('#E5E7EB');
        doc.text(truncateText(doc, values[i], columns[i].width - 8), x + 4, y + 4, {
          width: columns[i].width - 8,
          lineBreak: false,
        });
        x += columns[i].width;
      }
      doc.y = y + 18;
    }

    if (stats.parConcours.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(10).text('Aucune donnée pour les filtres sélectionnés.');
    }

    const campagneRows = stats.campagnes?.parCampagne || [];
    if (campagneRows.length > 0) {
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(13).text('Campagnes d\'inscription (établissements privés)');
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(11);
      doc.text(`Total candidatures : ${stats.campagnes.totaux.totalCandidats}`);
      doc.text(`Validées : ${stats.campagnes.totaux.acceptes}`);
      doc.text(`Rejetées : ${stats.campagnes.totaux.rejetes}`);
      doc.text(`En attente : ${stats.campagnes.totaux.enAttente}`);
      doc.text(`Sous réserve : ${stats.campagnes.totaux.sousReserve}`);
      doc.text(`Répartition par sexe — ${formatSexeLine(stats.campagnes.totaux.repartitionSexe)}`);
      doc.moveDown(0.8);

      const campagneColumns = [
        { label: 'Établissement', width: pageWidth * 0.2 },
        { label: 'Campagne', width: pageWidth * 0.22 },
        { label: 'Total', width: pageWidth * 0.09 },
        { label: 'Validées', width: pageWidth * 0.11 },
        { label: 'Rejetées', width: pageWidth * 0.11 },
        { label: 'Attente', width: pageWidth * 0.11 },
        { label: 'Sous rés.', width: pageWidth * 0.12 },
      ];

      const drawCampagneHeader = () => {
        const y = doc.y;
        let x = doc.page.margins.left;
        doc.font('Helvetica-Bold').fontSize(9);
        for (const col of campagneColumns) {
          doc.rect(x, y, col.width, 18).fillAndStroke('#D1FAE5', '#6EE7B7');
          doc.fillColor('#111827').text(col.label, x + 4, y + 5, {
            width: col.width - 8,
            lineBreak: false,
          });
          x += col.width;
        }
        doc.fillColor('#000000');
        doc.y = y + 20;
      };

      const ensureCampagneSpace = (height = 18) => {
        if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          drawCampagneHeader();
        }
      };

      drawCampagneHeader();
      doc.font('Helvetica').fontSize(8.5);
      for (const row of campagneRows) {
        ensureCampagneSpace(18);
        const y = doc.y;
        let x = doc.page.margins.left;
        const values = [
          row.etablissement,
          row.titre,
          String(row.totalCandidats),
          String(row.acceptes),
          String(row.rejetes),
          String(row.enAttente),
          String(row.sousReserve),
        ];
        for (let i = 0; i < campagneColumns.length; i += 1) {
          doc.rect(x, y, campagneColumns[i].width, 16).stroke('#E5E7EB');
          doc.text(truncateText(doc, values[i], campagneColumns[i].width - 8), x + 4, y + 4, {
            width: campagneColumns[i].width - 8,
            lineBreak: false,
          });
          x += campagneColumns[i].width;
        }
        doc.y = y + 18;
      }
    }

    doc.end();
  });
}

module.exports = {
  collectStats,
  collectCampagneStats,
  generateExcel,
  generatePdf,
  categorizeStatut,
  categorizePreinscriptionStatut,
  buildConcoursStats,
};
