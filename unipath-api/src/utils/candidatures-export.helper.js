const prisma = require('../prisma');
const PDFDocument = require('pdfkit');
const {
  drawMesrsHeader,
  ensureTimesNewRomanFonts,
  getPdfFont,
  getPdfFontBold,
} = require('./pdf-header.helper');

const CODE_NIVEAU = {
  1: 'L1',
  2: 'L2',
  3: 'L3',
  4: 'M1',
  5: 'M2',
};

const LABEL_STATUT = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validée',
  SOUS_RESERVE: 'Sous réserve',
  REJETE: 'Rejetée',
};

function labelSexe(sexe) {
  const s = String(sexe || '').trim().toUpperCase();
  if (s === 'M') return 'Masculin';
  if (s === 'F') return 'Féminin';
  return '—';
}

function labelNiveau(niveau) {
  if (niveau == null || niveau === '') return '—';
  const n = Number(niveau);
  return CODE_NIVEAU[n] || String(niveau);
}

function parseExportFilters(query = {}) {
  const filiere = query.filiere ? String(query.filiere).trim() : '';
  const annee = query.annee ? String(query.annee).trim() : '';
  const sexe = String(query.sexe || '').trim().toUpperCase();
  const statut = query.statut ? String(query.statut).trim().toUpperCase() : '';
  const niveauRaw = query.niveau;
  const niveau =
    niveauRaw !== undefined && niveauRaw !== null && String(niveauRaw).trim() !== ''
      ? Number(niveauRaw)
      : null;

  return {
    filiere: filiere || null,
    annee: annee || null,
    niveau: Number.isFinite(niveau) ? niveau : null,
    sexe: sexe === 'M' || sexe === 'F' ? sexe : null,
    statut: ['EN_ATTENTE', 'VALIDE', 'SOUS_RESERVE', 'REJETE'].includes(statut) ? statut : null,
  };
}

async function getExportReadiness(etablissementId, annee = null) {
  const { getAnneeEnCoursDges } = require('./annee-academique.helper');
  const anneeEnCours = await getAnneeEnCoursDges();
  const anneeEnCoursLibelle = anneeEnCours?.libelle || null;
  const anneeFiltre = annee ? String(annee).trim() : null;

  // Année passée (≠ année DGES en cours) : exports toujours disponibles
  const isAnneeAnterieure = Boolean(
    anneeFiltre && anneeEnCoursLibelle && anneeFiltre !== anneeEnCoursLibelle
  );

  if (isAnneeAnterieure) {
    return {
      inscriptionsCloses: true,
      tousDossiersEtudies: true,
      exportReady: true,
      anneeAnterieure: true,
      anneeEnCours: anneeEnCoursLibelle,
      anneeFiltre,
      nbCampagnesPubliees: 0,
      nbCampagnesCloturees: 0,
      nbDossiersEnAttente: 0,
      message: 'Exports disponibles (année antérieure — étude considérée terminée).',
    };
  }

  const campagneWhere = {
    etablissementId,
    ...(anneeFiltre ? { anneeAcademique: anneeFiltre } : {}),
  };

  const [nbPubliees, nbCloturees, nbEnAttente] = await Promise.all([
    prisma.campagneInscription.count({
      where: { ...campagneWhere, statut: 'PUBLIEE' },
    }),
    prisma.campagneInscription.count({
      where: { ...campagneWhere, statut: 'CLOTUREE' },
    }),
    prisma.preinscriptionEtablissement.count({
      where: {
        etablissementId,
        statut: 'EN_ATTENTE',
        ...(anneeFiltre ? { anneeAcademique: anneeFiltre } : {}),
      },
    }),
  ]);

  const inscriptionsCloses = nbCloturees > 0 && nbPubliees === 0;
  const tousDossiersEtudies = nbEnAttente === 0;
  const exportReady = inscriptionsCloses && tousDossiersEtudies;

  return {
    inscriptionsCloses,
    tousDossiersEtudies,
    exportReady,
    anneeAnterieure: false,
    anneeEnCours: anneeEnCoursLibelle,
    anneeFiltre,
    nbCampagnesPubliees: nbPubliees,
    nbCampagnesCloturees: nbCloturees,
    nbDossiersEnAttente: nbEnAttente,
    message: !inscriptionsCloses
      ? 'Clôturez d\'abord toutes les campagnes d\'inscription (aucune campagne encore publiée).'
      : !tousDossiersEtudies
        ? `${nbEnAttente} dossier(s) encore en attente de décision.`
        : 'Exports disponibles.',
  };
}

async function loadCandidaturesForExport(etablissementId, filters) {
  const apps = await prisma.application.findMany({
    where: {
      etablissementId,
      preinscriptionId: { not: null },
      ...(filters.filiere ? { filiereId: filters.filiere } : {}),
      ...(filters.annee ? { anneeAcademique: filters.annee } : {}),
      ...(filters.niveau != null ? { niveau: filters.niveau } : {}),
      ...(filters.sexe ? { candidat: { sexe: filters.sexe } } : {}),
      ...(filters.statut ? { preinscription: { statut: filters.statut } } : {}),
    },
    include: {
      candidat: {
        select: {
          matricule: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          sexe: true,
        },
      },
      filiere: { select: { nom: true, code: true } },
      preinscription: {
        select: {
          numeroPreinscription: true,
          statut: true,
          niveau: true,
          motifDecision: true,
          decidedAt: true,
        },
      },
    },
    orderBy: [
      { anneeAcademique: 'asc' },
      { niveau: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  apps.sort((a, b) => {
    const fa = a.filiere?.nom || '';
    const fb = b.filiere?.nom || '';
    if (fa !== fb) return fa.localeCompare(fb, 'fr');
    const na = a.candidat?.nom || '';
    const nb = b.candidat?.nom || '';
    return na.localeCompare(nb, 'fr');
  });

  return apps.map((app, index) => ({
    rang: index + 1,
    numeroApplication: app.numeroApplication,
    numeroPreinscription: app.preinscription?.numeroPreinscription || '—',
    matricule: app.candidat?.matricule || '—',
    nom: app.candidat?.nom || '—',
    prenom: app.candidat?.prenom || '—',
    sexe: labelSexe(app.candidat?.sexe),
    email: app.candidat?.email || '—',
    filiere: app.filiere?.nom || '—',
    anneeAcademique: app.anneeAcademique,
    niveau: labelNiveau(app.preinscription?.niveau ?? app.niveau),
    statut: LABEL_STATUT[app.preinscription?.statut] || app.preinscription?.statut || '—',
    motif: app.preinscription?.motifDecision || '',
  }));
}

function buildFilterLegend(filters, extras = {}) {
  const parts = [];
  if (filters.annee) parts.push(`Année : ${filters.annee}`);
  if (extras.filiereNom) parts.push(`Filière : ${extras.filiereNom}`);
  else if (filters.filiere) parts.push('Filière filtrée');
  if (filters.niveau != null) parts.push(`Niveau : ${labelNiveau(filters.niveau)}`);
  if (filters.sexe) parts.push(`Sexe : ${labelSexe(filters.sexe)}`);
  if (filters.statut) parts.push(`Statut : ${LABEL_STATUT[filters.statut] || filters.statut}`);
  return parts.length ? parts.join(' · ') : 'Tous les dossiers traités';
}

function rowsToCsv(rows) {
  const headers = [
    'N°',
    'N° demande',
    'N° pré-inscription',
    'Matricule',
    'Nom',
    'Prénom',
    'Sexe',
    'Email',
    'Filière',
    'Année',
    'Niveau',
    'Décision',
    'Motif',
  ];
  const escape = (v) => {
    const s = String(v ?? '');
    if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(';')];
  for (const r of rows) {
    lines.push([
      r.rang,
      r.numeroApplication,
      r.numeroPreinscription,
      r.matricule,
      r.nom,
      r.prenom,
      r.sexe,
      r.email,
      r.filiere,
      r.anneeAcademique,
      r.niveau,
      r.statut,
      r.motif,
    ].map(escape).join(';'));
  }
  return `\uFEFF${lines.join('\n')}`;
}

async function streamCandidaturesPdf(res, { etablissementNom, filters, rows, filiereNom }) {
  const title = 'Liste des candidatures — établissements privés';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="candidatures-etablissement-${Date.now()}.pdf"`
  );

  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    layout: 'landscape',
    info: { Title: title, Author: 'UniPath' },
  });
  doc.pipe(res);
  ensureTimesNewRomanFonts(doc);

  await drawMesrsHeader(doc);

  doc.font(getPdfFontBold()).fontSize(14).text(title, { align: 'center' });
  doc.moveDown(0.3);
  doc.font(getPdfFont()).fontSize(10).text(etablissementNom || 'Établissement', { align: 'center' });
  doc.moveDown(0.2);
  doc
    .fontSize(9)
    .fillColor('#444')
    .text(buildFilterLegend(filters, { filiereNom }), { align: 'center' });
  doc.fillColor('#000');
  doc.moveDown(0.6);
  doc.fontSize(9).text(`Nombre de dossiers : ${rows.length}`, { align: 'left' });
  doc.moveDown(0.4);

  const marginLeft = 40;
  const usableWidth = doc.page.width - 80;
  const cols = [
    { key: 'rang', label: 'N°', width: 28 },
    { key: 'nom', label: 'Nom', width: 80 },
    { key: 'prenom', label: 'Prénom', width: 80 },
    { key: 'sexe', label: 'Sexe', width: 55 },
    { key: 'filiere', label: 'Filière', width: 120 },
    { key: 'niveau', label: 'Niv.', width: 35 },
    { key: 'statut', label: 'Décision', width: 70 },
    {
      key: 'numeroApplication',
      label: 'N° demande',
      width: usableWidth - 28 - 80 - 80 - 55 - 120 - 35 - 70,
    },
  ];

  const drawHeader = () => {
    let x = marginLeft;
    const y = doc.y;
    doc.font(getPdfFontBold()).fontSize(8);
    for (const col of cols) {
      doc.text(col.label, x, y, { width: col.width, continued: false });
      x += col.width;
    }
    doc.moveDown(0.8);
    doc.moveTo(marginLeft, doc.y).lineTo(marginLeft + usableWidth, doc.y).stroke('#999');
    doc.moveDown(0.3);
  };

  drawHeader();
  doc.font(getPdfFont()).fontSize(8);

  for (const row of rows) {
    if (doc.y > doc.page.height - 50) {
      doc.addPage();
      await drawMesrsHeader(doc);
      drawHeader();
      doc.font(getPdfFont()).fontSize(8);
    }
    let x = marginLeft;
    const y = doc.y;
    for (const col of cols) {
      doc.text(String(row[col.key] ?? '—'), x, y, {
        width: col.width - 2,
        ellipsis: true,
        lineBreak: false,
      });
      x += col.width;
    }
    doc.moveDown(0.85);
  }

  doc.end();
}

module.exports = {
  parseExportFilters,
  getExportReadiness,
  loadCandidaturesForExport,
  buildFilterLegend,
  rowsToCsv,
  streamCandidaturesPdf,
  LABEL_STATUT,
};
