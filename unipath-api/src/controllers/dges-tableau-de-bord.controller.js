const PDFDocument = require('pdfkit');
const {
  chargerTableauDeBord,
  tableauDeBordToCsv,
  describeFiltres,
} = require('../utils/dges-tableau-de-bord.helper');
const {
  drawMesrsHeader,
  ensureTimesNewRomanFonts,
  getPdfFont,
  getPdfFontBold,
} = require('../utils/pdf-header.helper');

/**
 * GET /dges/tableau-de-bord
 * Query: anneeAcademiqueId | toutesAnnees, etablissementId, filiereId, ville, niveau, sexe
 */
exports.getTableauDeBord = async (req, res) => {
  try {
    const result = await chargerTableauDeBord(req);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    return res.json(result);
  } catch (error) {
    console.error('getTableauDeBord DGES:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement du tableau de bord' });
  }
};

function exportFilenameBase(payload) {
  const annee = payload.scope?.annee?.libelle
    || (payload.scope?.scope === 'all' ? 'toutes-annees' : 'annee-en-cours');
  return `stats-dges-${String(annee).replace(/[^\w\-]+/g, '_')}`;
}

/**
 * GET /dges/tableau-de-bord/csv
 */
exports.exportTableauDeBordCsv = async (req, res) => {
  try {
    const result = await chargerTableauDeBord(req);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    const csv = tableauDeBordToCsv(result);
    const safeName = exportFilenameBase(result);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error('exportTableauDeBordCsv DGES:', error);
    return res.status(500).json({ error: "Erreur lors de l'export Excel" });
  }
};

/**
 * GET /dges/tableau-de-bord/pdf
 */
exports.exportTableauDeBordPdf = async (req, res) => {
  try {
    const result = await chargerTableauDeBord(req);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    const safeName = exportFilenameBase(result);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      layout: 'portrait',
      info: {
        Title: 'Tableau de bord DGES — statistiques',
        Author: 'UniPath',
      },
    });
    doc.pipe(res);
    ensureTimesNewRomanFonts(doc);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const marginLeft = 40;
    const usableWidth = pageWidth - 80;
    const bottomLimit = pageHeight - 42;
    const k = result.kpis || {};

    const drawHeader = () => drawMesrsHeader(doc, {
      marginLeft,
      usableWidth,
      title: 'Tableau de bord DGES',
      subtitle: 'Statistiques Module 2 — établissements privés',
      metaLine: describeFiltres(result),
      yStart: 18,
    });

    const ensureSpace = (needed, y) => {
      if (y + needed <= bottomLimit) return y;
      doc.addPage();
      return drawHeader();
    };

    const sectionTitle = (text, y) => {
      y = ensureSpace(28, y);
      doc.fillColor('#0f172a').font(getPdfFontBold()).fontSize(11).text(text, marginLeft, y);
      return y + 18;
    };

    const kv = (label, value, y) => {
      y = ensureSpace(14, y);
      doc.font(getPdfFont()).fontSize(9).fillColor('#334155')
        .text(label, marginLeft, y, { width: usableWidth * 0.55, continued: false });
      doc.font(getPdfFontBold()).fillColor('#0f172a')
        .text(String(value ?? 0), marginLeft + usableWidth * 0.55, y, {
          width: usableWidth * 0.45,
          align: 'right',
        });
      return y + 13;
    };

    const drawSimpleTable = (columns, rows, y) => {
      const headerH = 20;
      const rowH = 16;
      const totalW = columns.reduce((s, c) => s + c.width, 0);

      y = ensureSpace(headerH + rowH + 8, y);
      doc.save();
      doc.rect(marginLeft, y, totalW, headerH).fill('#9a3412');
      let x = marginLeft;
      doc.fillColor('#ffffff').font(getPdfFontBold()).fontSize(8);
      for (const col of columns) {
        doc.text(col.label, x + 3, y + 5, {
          width: col.width - 6,
          align: col.align || 'left',
          lineBreak: false,
        });
        x += col.width;
      }
      doc.restore();
      y += headerH;

      rows.forEach((row, index) => {
        y = ensureSpace(rowH + 2, y);
        const bg = index % 2 === 0 ? '#fff7ed' : '#ffffff';
        doc.save();
        doc.rect(marginLeft, y, totalW, rowH).fill(bg);
        let xx = marginLeft;
        doc.fillColor('#111827').font(getPdfFont()).fontSize(8);
        for (const col of columns) {
          doc.text(String(row[col.key] ?? '—'), xx + 3, y + 4, {
            width: col.width - 6,
            align: col.align || 'left',
            lineBreak: false,
            ellipsis: true,
          });
          xx += col.width;
        }
        doc.restore();
        y += rowH;
      });

      return y + 10;
    };

    let y = drawHeader();

    y = sectionTitle('Indicateurs globaux', y);
    for (const [label, value] of [
      ['Établissements privés', k.etablissements],
      ['Filières (offres établissements)', k.filieres],
      ['Admins établissement', k.admins],
      ['Campagnes', k.campagnes],
      ['Campagnes publiées', k.campagnesPubliees],
      ['Candidatures', k.candidatures],
      ['Préinscriptions', k.preinscriptions],
      ['Préinscriptions validées', k.preValidees],
      ['Préinscriptions rejetées', k.preRejetees],
      ['Préinscriptions en attente', k.preAttente],
      ['Taux validation préinscription', `${k.tauxValidationPre ?? 0} %`],
      ['Inscriptions académiques', k.inscriptions],
      ['Inscriptions en cours', k.inscriptionsEnCours],
      ['Passants', k.passants],
      ['Redoublants', k.redoublants],
      ['Taux de réussite', `${k.tauxReussite ?? 0} %`],
      ['Demandes de filières', k.demandesFilieres],
      ['Demandes en attente', k.demandesFilieresAttente],
    ]) {
      y = kv(label, value, y);
    }

    y = sectionTitle('Campagnes par statut', y + 6);
    y = drawSimpleTable(
      [
        { key: 'label', label: 'Statut', width: usableWidth * 0.7 },
        { key: 'value', label: 'Nombre', width: usableWidth * 0.3, align: 'right' },
      ],
      (result.campagnesParStatut || []).map((r) => ({ label: r.label, value: r.value })),
      y
    );

    y = sectionTitle('Préinscriptions par statut', y);
    y = drawSimpleTable(
      [
        { key: 'label', label: 'Statut', width: usableWidth * 0.7 },
        { key: 'value', label: 'Nombre', width: usableWidth * 0.3, align: 'right' },
      ],
      (result.preinscriptionsParStatut || []).map((r) => ({ label: r.label, value: r.value })),
      y
    );

    y = sectionTitle('Inscriptions académiques par statut', y);
    y = drawSimpleTable(
      [
        { key: 'label', label: 'Statut', width: usableWidth * 0.7 },
        { key: 'value', label: 'Nombre', width: usableWidth * 0.3, align: 'right' },
      ],
      (result.inscriptionsParStatut || []).map((r) => ({ label: r.label, value: r.value })),
      y
    );

    y = sectionTitle('Pipeline candidatures', y);
    y = drawSimpleTable(
      [
        { key: 'label', label: 'Statut', width: usableWidth * 0.7 },
        { key: 'value', label: 'Nombre', width: usableWidth * 0.3, align: 'right' },
      ],
      (result.applicationsParStatut || []).map((r) => ({ label: r.label, value: r.value })),
      y
    );

    y = sectionTitle('Répartition par sexe', y);
    y = drawSimpleTable(
      [
        { key: 'label', label: 'Sexe', width: usableWidth * 0.22 },
        { key: 'candidatures', label: 'Cand.', width: usableWidth * 0.13, align: 'right' },
        { key: 'preinscriptions', label: 'Préinsc.', width: usableWidth * 0.13, align: 'right' },
        { key: 'inscriptions', label: 'Inscr.', width: usableWidth * 0.13, align: 'right' },
        { key: 'passants', label: 'Pass.', width: usableWidth * 0.13, align: 'right' },
        { key: 'redoublants', label: 'Red.', width: usableWidth * 0.13, align: 'right' },
        { key: 'preValidees', label: 'Pré. val.', width: usableWidth * 0.13, align: 'right' },
      ],
      result.parSexe || [],
      y
    );

    y = sectionTitle('Volumes par niveau d\'étude', y);
    y = drawSimpleTable(
      [
        { key: 'label', label: 'Niveau', width: usableWidth * 0.22 },
        { key: 'candidatures', label: 'Cand.', width: usableWidth * 0.156, align: 'right' },
        { key: 'preinscriptions', label: 'Préinsc.', width: usableWidth * 0.156, align: 'right' },
        { key: 'inscriptions', label: 'Inscr.', width: usableWidth * 0.156, align: 'right' },
        { key: 'passants', label: 'Pass.', width: usableWidth * 0.156, align: 'right' },
        { key: 'redoublants', label: 'Red.', width: usableWidth * 0.156, align: 'right' },
      ],
      (result.parNiveau || []).map((r) => ({
        label: r.label,
        candidatures: r.candidatures,
        preinscriptions: r.preinscriptions,
        inscriptions: r.inscriptions,
        passants: r.passants,
        redoublants: r.redoublants,
      })),
      y
    );

    y = sectionTitle('Détail par établissement', y);
    y = drawSimpleTable(
      [
        { key: 'nom', label: 'Établissement', width: usableWidth * 0.28 },
        { key: 'ville', label: 'Ville', width: usableWidth * 0.12 },
        { key: 'candidatures', label: 'Cand.', width: usableWidth * 0.1, align: 'right' },
        { key: 'preinscriptions', label: 'Pré.', width: usableWidth * 0.1, align: 'right' },
        { key: 'inscriptions', label: 'Inscr.', width: usableWidth * 0.1, align: 'right' },
        { key: 'passants', label: 'Pass.', width: usableWidth * 0.1, align: 'right' },
        { key: 'redoublants', label: 'Red.', width: usableWidth * 0.1, align: 'right' },
        { key: 'taux', label: 'Réuss.%', width: usableWidth * 0.1, align: 'right' },
      ],
      (result.parEtablissement || []).map((r) => ({
        nom: r.nom,
        ville: r.ville || '—',
        candidatures: r.candidatures,
        preinscriptions: r.preinscriptions,
        inscriptions: r.inscriptions,
        passants: r.passants,
        redoublants: r.redoublants,
        taux: r.tauxReussite,
      })),
      y
    );

    y = sectionTitle('Détail par filière (extrait)', y);
    y = drawSimpleTable(
      [
        { key: 'nom', label: 'Filière', width: usableWidth * 0.26 },
        { key: 'etab', label: 'Établissement', width: usableWidth * 0.24 },
        { key: 'inscriptions', label: 'Inscr.', width: usableWidth * 0.125, align: 'right' },
        { key: 'passants', label: 'Pass.', width: usableWidth * 0.125, align: 'right' },
        { key: 'redoublants', label: 'Red.', width: usableWidth * 0.125, align: 'right' },
        { key: 'taux', label: 'Réuss.%', width: usableWidth * 0.125, align: 'right' },
      ],
      (result.parFiliere || []).slice(0, 40).map((r) => ({
        nom: r.nom,
        etab: r.etablissementNom || '—',
        inscriptions: r.inscriptions,
        passants: r.passants,
        redoublants: r.redoublants,
        taux: r.tauxReussite,
      })),
      y
    );

    if ((result.parVille || []).length > 0) {
      y = sectionTitle('Répartition par ville', y);
      y = drawSimpleTable(
        [
          { key: 'ville', label: 'Ville', width: usableWidth * 0.28 },
          { key: 'etablissements', label: 'Étab.', width: usableWidth * 0.12, align: 'right' },
          { key: 'candidatures', label: 'Cand.', width: usableWidth * 0.12, align: 'right' },
          { key: 'preinscriptions', label: 'Pré.', width: usableWidth * 0.12, align: 'right' },
          { key: 'inscriptions', label: 'Inscr.', width: usableWidth * 0.12, align: 'right' },
          { key: 'passants', label: 'Pass.', width: usableWidth * 0.12, align: 'right' },
          { key: 'redoublants', label: 'Red.', width: usableWidth * 0.12, align: 'right' },
        ],
        result.parVille || [],
        y
      );
    }

    doc.end();
  } catch (error) {
    console.error('exportTableauDeBordPdf DGES:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Erreur lors de l'export PDF" });
    }
  }
};

exports._describeFiltres = describeFiltres;
