const PDFDocument = require('pdfkit');
const {
  chargerTableauDeBord,
  tableauDeBordToCsv,
  describeFiltres,
} = require('../utils/dec-tableau-de-bord.helper');
const {
  drawMesrsHeader,
  ensureTimesNewRomanFonts,
  getPdfFont,
  getPdfFontBold,
} = require('../utils/pdf-header.helper');

/**
 * GET /dec/tableau-de-bord
 * Query: anneeAcademiqueId | toutesAnnees, concoursId, etablissement, ville, centreId, sexe
 */
exports.getTableauDeBord = async (req, res) => {
  try {
    const result = await chargerTableauDeBord(req);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    return res.json(result);
  } catch (error) {
    console.error('getTableauDeBord:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement du tableau de bord' });
  }
};

function exportFilenameBase(payload) {
  const annee = payload.scope?.annee?.libelle
    || (payload.scope?.scope === 'all' ? 'toutes-annees' : 'annee-en-cours');
  return `stats-dec-${String(annee).replace(/[^\w\-]+/g, '_')}`;
}

/**
 * GET /dec/tableau-de-bord/csv — Excel-compatible
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
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}.csv"`
    );
    return res.send(csv);
  } catch (error) {
    console.error('exportTableauDeBordCsv:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'export Excel' });
  }
};

/**
 * GET /dec/tableau-de-bord/pdf
 */
exports.exportTableauDeBordPdf = async (req, res) => {
  try {
    const result = await chargerTableauDeBord(req);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    const safeName = exportFilenameBase(result);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}.pdf"`
    );

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      layout: 'portrait',
      info: {
        Title: 'Tableau de bord DEC — statistiques',
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
      title: 'Tableau de bord DEC',
      subtitle: 'Statistiques des concours',
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
      doc.rect(marginLeft, y, totalW, headerH).fill('#1e3a8a');
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
        const bg = index % 2 === 0 ? '#f8fafc' : '#ffffff';
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
    const kpiPairs = [
      ['Concours', k.concours],
      ['Inscrits', k.inscrits],
      ['Retenus (validés)', k.retenus],
      ['Rejetés', k.rejetes],
      ['Pipeline intermédiaire', k.intermediaires],
      ['Admis', k.admis],
      ['Refusés (sélection)', k.refuses],
      ['Décision en attente', k.resultatsEnAttente],
      ['Taux de validation', `${k.tauxValidation ?? 0} %`],
      ['Taux d\'admission', `${k.tauxAdmission ?? 0} %`],
      ['Centres actifs', k.centresActifs],
      ['Places occupées / capacité', `${k.placesOccupeesCentres ?? 0}${k.capaciteTotale ? ` / ${k.capaciteTotale}` : ''}`],
      ['Avec N° de table', k.avecNumeroTable],
      ['Commission avec affectation', k.commission?.avecAffectation],
      ['Commission sans affectation', k.commission?.sansAffectation],
    ];
    for (const [label, value] of kpiPairs) {
      y = kv(label, value, y);
    }

    y = sectionTitle('Étude des dossiers', y + 6);
    y = drawSimpleTable(
      [
        { key: 'label', label: 'Statut', width: usableWidth * 0.7 },
        { key: 'value', label: 'Concours', width: usableWidth * 0.3, align: 'right' },
      ],
      [
        { label: 'Non lancée', value: k.etude?.non_lancee ?? 0 },
        { label: 'Planifiée', value: k.etude?.planifiee ?? 0 },
        { label: 'En cours', value: k.etude?.en_cours ?? 0 },
        { label: 'Terminée non clôturée', value: k.etude?.terminee_non_cloturee ?? 0 },
        { label: 'Clôturée', value: k.etude?.cloturee ?? 0 },
      ],
      y
    );

    y = sectionTitle('Pipeline des dossiers', y);
    y = drawSimpleTable(
      [
        { key: 'label', label: 'Statut', width: usableWidth * 0.7 },
        { key: 'value', label: 'Nombre', width: usableWidth * 0.3, align: 'right' },
      ],
      (result.dossiersParStatut || []).map((r) => ({ label: r.label, value: r.value })),
      y
    );

    y = sectionTitle('Résultats de sélection (retenus)', y);
    y = drawSimpleTable(
      [
        { key: 'label', label: 'Décision', width: usableWidth * 0.7 },
        { key: 'value', label: 'Nombre', width: usableWidth * 0.3, align: 'right' },
      ],
      (result.resultatsComposition || []).map((r) => ({ label: r.label, value: r.value })),
      y
    );

    y = sectionTitle('Répartition par sexe', y);
    y = drawSimpleTable(
      [
        { key: 'label', label: 'Sexe', width: usableWidth * 0.28 },
        { key: 'inscrits', label: 'Inscrits', width: usableWidth * 0.18, align: 'right' },
        { key: 'retenus', label: 'Retenus', width: usableWidth * 0.18, align: 'right' },
        { key: 'admis', label: 'Admis', width: usableWidth * 0.18, align: 'right' },
        { key: 'refuses', label: 'Refusés', width: usableWidth * 0.18, align: 'right' },
      ],
      result.parSexe || [],
      y
    );

    y = sectionTitle('Détail par concours', y);
    const concoursCols = [
      { key: 'libelle', label: 'Concours', width: usableWidth * 0.28 },
      { key: 'inscrits', label: 'Insc.', width: usableWidth * 0.09, align: 'right' },
      { key: 'retenus', label: 'Ret.', width: usableWidth * 0.09, align: 'right' },
      { key: 'rejetes', label: 'Rej.', width: usableWidth * 0.09, align: 'right' },
      { key: 'admis', label: 'Admis', width: usableWidth * 0.09, align: 'right' },
      { key: 'refuses', label: 'Ref.', width: usableWidth * 0.09, align: 'right' },
      { key: 'attente', label: 'Att.', width: usableWidth * 0.09, align: 'right' },
      { key: 'taux', label: 'Val.%', width: usableWidth * 0.09, align: 'right' },
      { key: 'etude', label: 'Étude', width: usableWidth * 0.09 },
    ];
    y = drawSimpleTable(
      concoursCols,
      (result.parConcours || []).map((r) => ({
        libelle: r.libelle,
        inscrits: r.inscrits,
        retenus: r.retenus,
        rejetes: r.rejetes,
        admis: r.resultats?.ADMIS || 0,
        refuses: r.resultats?.REFUSE || 0,
        attente: r.resultats?.EN_ATTENTE || 0,
        taux: r.tauxValidation,
        etude: r.etudeLabel || r.etude,
      })),
      y
    );

    if ((result.parCentre || []).length > 0) {
      y = sectionTitle('Répartition par centre', y);
      y = drawSimpleTable(
        [
          { key: 'ville', label: 'Ville', width: usableWidth * 0.2 },
          { key: 'centre', label: 'Centre', width: usableWidth * 0.32 },
          { key: 'inscrits', label: 'Insc.', width: usableWidth * 0.12, align: 'right' },
          { key: 'retenus', label: 'Ret.', width: usableWidth * 0.12, align: 'right' },
          { key: 'admis', label: 'Admis', width: usableWidth * 0.12, align: 'right' },
          { key: 'refuses', label: 'Ref.', width: usableWidth * 0.12, align: 'right' },
        ],
        (result.parCentre || []).map((r) => ({
          ville: r.ville || '—',
          centre: r.centreNom || '—',
          inscrits: r.inscrits,
          retenus: r.retenus,
          admis: r.admis,
          refuses: r.refuses,
        })),
        y
      );
    }

    doc.end();
  } catch (error) {
    console.error('exportTableauDeBordPdf:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Erreur lors de l\'export PDF' });
    }
  }
};
