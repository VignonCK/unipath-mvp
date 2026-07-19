const PDFDocument = require('pdfkit');
const { runInBackground } = require('../utils/background-task');
const { envoyerEmailDecisionFinale } = require('../utils/email-decision.helper');
const {
  chargerListeRetenus,
  listeRetenusToCsv,
  parseFilters,
} = require('../utils/liste-retenus.helper');
const {
  chargerResultatsSelection,
  deciderResultatComposition,
  importerAdmisParNumerosTable,
  marquerAutresCommeRefuses,
  annulerToutesLesDecisions,
  resultatsSelectionToCsv,
} = require('../utils/selection-resultats.helper');
const { genererNumerosTableConcours } = require('../utils/numero-table.helper');
const { drawMesrsHeader, ensureTimesNewRomanFonts, getPdfFont, getPdfFontBold } = require('../utils/pdf-header.helper');
const prisma = require('../prisma');

function filtersFromReq(req) {
  return parseFilters(req.query || {});
}

function filtersResultatsFromReq(req) {
  return {
    ...filtersFromReq(req),
    resultat: req.query?.resultat,
    sexe: req.query?.sexe,
  };
}

/**
 * GET JSON résultats post-composition (décision DEC Admis / Refusé)
 * Population : candidatures VALIDE uniquement
 * Query: resultat, centreId, ville, q
 */
exports.getResultatsSelection = async (req, res) => {
  try {
    const result = await chargerResultatsSelection(req.params.concoursId, filtersResultatsFromReq(req));
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    return res.json(result);
  } catch (error) {
    console.error('getResultatsSelection:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * PATCH décision DEC post-composition pour une inscription
 * Body: { resultat: 'ADMIS' | 'REFUSE' | 'EN_ATTENTE' }
 */
exports.deciderResultatComposition = async (req, res) => {
  try {
    const { concoursId, inscriptionId } = req.params;
    const resultat = String(req.body?.resultat || '').trim().toUpperCase();
    const result = await deciderResultatComposition({
      concoursId,
      inscriptionId,
      resultat,
      userId: req.user?.id,
    });
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    return res.json({
      message: `Candidat marqué : ${result.inscription.resultatLabel}`,
      inscription: result.inscription,
    });
  } catch (error) {
    console.error('deciderResultatComposition:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * POST import CSV des N° de table → marque ADMIS automatiquement
 * multipart field "fichier" (.csv/.txt) ou body JSON { csv: "..." }
 */
exports.importerAdmisCsv = async (req, res) => {
  try {
    const { concoursId } = req.params;
    let csvText = '';

    if (req.file?.buffer) {
      csvText = req.file.buffer.toString('utf8');
    } else if (typeof req.body?.csv === 'string') {
      csvText = req.body.csv;
    } else if (typeof req.body?.contenu === 'string') {
      csvText = req.body.contenu;
    }

    if (!csvText.trim()) {
      return res.status(400).json({
        error: 'Fichier CSV requis (champ « fichier ») ou contenu texte dans « csv »',
      });
    }

    const result = await importerAdmisParNumerosTable({
      concoursId,
      csvText,
      userId: req.user?.id,
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    const { resume } = result;
    return res.json({
      message:
        `${resume.admis} admis marqué(s)`
        + (resume.dejaAdmis ? `, ${resume.dejaAdmis} déjà admis` : '')
        + (resume.introuvables ? `, ${resume.introuvables} introuvable(s)` : '')
        + (resume.nonValides ? `, ${resume.nonValides} non validé(s)` : ''),
      ...result,
    });
  } catch (error) {
    console.error('importerAdmisCsv:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * POST : marque REFUSE tous les retenus non encore ADMIS
 */
exports.marquerAutresRefuses = async (req, res) => {
  try {
    const result = await marquerAutresCommeRefuses({
      concoursId: req.params.concoursId,
      userId: req.user?.id,
    });
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    return res.json({
      message: `${result.refuses} candidat(s) marqué(s) comme refusé(s)`,
      refuses: result.refuses,
      concours: result.concours,
    });
  } catch (error) {
    console.error('marquerAutresRefuses:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * POST : remet EN_ATTENTE toutes les décisions ADMIS / REFUSE
 */
exports.annulerToutesDecisions = async (req, res) => {
  try {
    const result = await annulerToutesLesDecisions({
      concoursId: req.params.concoursId,
      userId: req.user?.id,
    });
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    return res.json({
      message: `${result.annules} décision(s) annulée(s)`,
      annules: result.annules,
      concours: result.concours,
    });
  } catch (error) {
    console.error('annulerToutesDecisions:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

const RESULTAT_PDF_TITLES = {
  tous: 'Résultats de sélection',
  admis: 'Liste des candidats admis',
  refuses: 'Liste des candidats refusés',
  en_attente: 'Candidats en attente de décision',
};

/**
 * GET PDF résultats post-composition (filtres page)
 * Disponible uniquement lorsque toutes les décisions sont prises (0 en attente).
 * Query: resultat, centreId, ville, q
 */
exports.exportResultatsSelectionPdf = async (req, res) => {
  try {
    const filters = filtersResultatsFromReq(req);
    const result = await chargerResultatsSelection(req.params.concoursId, filters);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    if ((result.counts?.en_attente || 0) > 0) {
      return res.status(400).json({
        error:
          'Impossible de générer le PDF : des décisions sont encore en attente. '
          + 'Finalisez toutes les décisions (admis / refusés) avant l\'export.',
      });
    }

    if (!result.counts?.total) {
      return res.status(400).json({ error: 'Aucun candidat validé pour ce concours' });
    }

    const resultatKey = result.resultat || 'tous';
    const title = RESULTAT_PDF_TITLES[resultatKey] || RESULTAT_PDF_TITLES.tous;

    const centreSuffix = filters.centreId
      ? `-${String(result.candidats[0]?.centre?.nom || 'centre').replace(/[^\w\-]+/g, '_').slice(0, 30)}`
      : '';
    const resultatSuffix = resultatKey !== 'tous' ? `-${resultatKey}` : '';
    const safeName = String(result.concours.libelle || 'concours')
      .replace(/[^\w\-]+/g, '_')
      .slice(0, 50);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="resultats-selection-${safeName}${resultatSuffix}${centreSuffix}.pdf"`
    );

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      layout: 'portrait',
      info: {
        Title: `${title} — ${result.concours.libelle || ''}`,
        Author: 'UniPath',
      },
    });
    doc.pipe(res);
    ensureTimesNewRomanFonts(doc);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const marginLeft = 40;
    const marginRight = 40;
    const usableWidth = pageWidth - marginLeft - marginRight;
    const bottomLimit = pageHeight - 42;

    const colRang = 28;
    const colNom = 95;
    const colPrenom = 95;
    const colSexe = 36;
    const colNumeroTable = 85;
    const colDecision = 65;
    const colCentre = usableWidth - colRang - colNom - colPrenom - colSexe - colNumeroTable - colDecision;

    const columns = [
      { key: 'rang', label: 'N°', width: colRang, align: 'center' },
      { key: 'nom', label: 'Nom', width: colNom, align: 'left' },
      { key: 'prenom', label: 'Prénom', width: colPrenom, align: 'left' },
      { key: 'sexe', label: 'Sexe', width: colSexe, align: 'center' },
      { key: 'numeroTable', label: 'N° de table', width: colNumeroTable, align: 'center' },
      { key: 'centre', label: 'Centre', width: colCentre, align: 'left' },
      { key: 'decision', label: 'Décision', width: colDecision, align: 'center' },
    ];

    const rowHeight = 24;
    const headerHeight = 22;

    const drawDocumentHeader = () => {
      const metaParts = [
        result.concours.etablissement ? `Établissement : ${result.concours.etablissement}` : null,
        result.concours.code ? `Code concours : ${result.concours.code}` : null,
        `Affichés : ${result.total}`,
        `Admis : ${result.counts.admis}`,
        `Refusés : ${result.counts.refuses}`,
        filters.ville ? `Ville : ${filters.ville}` : null,
        filters.centreId && result.candidats[0]?.centre
          ? `Centre : ${result.candidats[0].centre.nom}`
          : null,
        result.sexe === 'M' ? 'Sexe : Masculin' : null,
        result.sexe === 'F' ? 'Sexe : Féminin' : null,
        resultatKey !== 'tous' ? `Filtre : ${title}` : null,
      ].filter(Boolean);

      return drawMesrsHeader(doc, {
        marginLeft,
        usableWidth,
        title,
        subtitle: result.concours.libelle || '—',
        metaLine: metaParts.join('  ·  '),
        yStart: 18,
      });
    };

    const ensureSpace = (needed, y) => {
      if (y + needed <= bottomLimit) return { y, newPage: false };
      doc.addPage();
      return { y: drawDocumentHeader(), newPage: true };
    };

    const drawTableHeader = (y) => {
      doc.save();
      doc.rect(marginLeft, y, usableWidth, headerHeight).fill('#1e3a8a');
      let x = marginLeft;
      doc.fillColor('#ffffff').font(getPdfFontBold()).fontSize(8);
      for (const col of columns) {
        doc.text(col.label, x + 3, y + 6, {
          width: col.width - 6,
          align: col.align,
          lineBreak: false,
        });
        x += col.width;
      }
      doc.restore();
      doc.strokeColor('#1e3a8a').lineWidth(1)
        .rect(marginLeft, y, usableWidth, headerHeight)
        .stroke();
      return y + headerHeight;
    };

    const drawRow = (row, y, index) => {
      const bg = index % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.save();
      doc.rect(marginLeft, y, usableWidth, rowHeight).fill(bg);

      let xLine = marginLeft;
      doc.strokeColor('#e5e7eb').lineWidth(0.5);
      for (const col of columns) {
        doc.rect(xLine, y, col.width, rowHeight).stroke();
        xLine += col.width;
      }

      const values = {
        rang: String(index + 1).padStart(3, '0'),
        nom: row.candidat?.nom || '—',
        prenom: row.candidat?.prenom || '—',
        sexe: row.candidat?.sexeLabel || row.candidat?.sexe || '—',
        numeroTable: row.numeroTable || '—',
        centre: row.centre
          ? `${row.centre.ville || ''} — ${row.centre.nom || ''}`.replace(/^ — | — $/g, '').trim() || '—'
          : '—',
        decision: row.resultatLabel || row.resultatComposition || '—',
      };

      let x = marginLeft;
      doc.fillColor('#111827').fontSize(8);
      for (const col of columns) {
        const isMono = col.key === 'numeroTable' || col.key === 'rang';
        const isDecision = col.key === 'decision';
        doc.font(isMono || isDecision ? getPdfFontBold() : getPdfFont());
        if (isDecision) {
          if (row.resultatComposition === 'ADMIS') doc.fillColor('#047857');
          else if (row.resultatComposition === 'REFUSE') doc.fillColor('#be123c');
          else doc.fillColor('#475569');
        } else {
          doc.fillColor('#111827');
        }
        doc.text(String(values[col.key] || '—'), x + 3, y + 7, {
          width: col.width - 6,
          align: col.align,
          lineBreak: false,
          ellipsis: true,
        });
        x += col.width;
      }

      doc.restore();
      return y + rowHeight;
    };

    // Grouper par centre pour lisibilité
    const groupsMap = new Map();
    for (const row of result.candidats) {
      const key = row.centre?.id || '__sans__';
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          ville: row.centre?.ville || '—',
          centreNom: row.centre?.nom || 'Sans centre',
          candidats: [],
        });
      }
      groupsMap.get(key).candidats.push(row);
    }
    const groups = [...groupsMap.values()].sort((a, b) => {
      const v = String(a.ville).localeCompare(String(b.ville), 'fr');
      if (v !== 0) return v;
      return String(a.centreNom).localeCompare(String(b.centreNom), 'fr');
    });

    let y = drawDocumentHeader();

    if (result.candidats.length === 0) {
      doc.fillColor('#6b7280').font(getPdfFont()).fontSize(10)
        .text('Aucun candidat pour les filtres sélectionnés.', marginLeft, y, {
          width: usableWidth,
          align: 'center',
        });
    } else {
      for (const group of groups) {
        let space = ensureSpace(headerHeight + rowHeight * 2 + 36, y);
        y = space.y;

        doc.fillColor('#0f172a').font(getPdfFontBold()).fontSize(10)
          .text(`${group.ville} — ${group.centreNom}`, marginLeft, y, {
            width: usableWidth,
          });
        doc.fillColor('#64748b').font(getPdfFont()).fontSize(8)
          .text(
            `${group.candidats.length} candidat${group.candidats.length > 1 ? 's' : ''}`,
            marginLeft,
            y + 14,
            { width: usableWidth }
          );
        y += 30;
        y = drawTableHeader(y);

        group.candidats.forEach((row, index) => {
          space = ensureSpace(rowHeight + 2, y);
          y = space.y;
          if (space.newPage) {
            doc.fillColor('#0f172a').font(getPdfFontBold()).fontSize(9)
              .text(
                `${group.ville} — ${group.centreNom} (suite)`,
                marginLeft,
                y,
                { width: usableWidth }
              );
            y += 16;
            y = drawTableHeader(y);
          }
          y = drawRow(row, y, index);
        });

        y += 16;
      }
    }

    doc.end();
  } catch (error) {
    console.error('exportResultatsSelectionPdf:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

/**
 * GET CSV résultats post-composition (filtres page)
 * Même condition que le PDF : 0 décision en attente.
 * Query: resultat, centreId, ville, q
 */
exports.exportResultatsSelectionCsv = async (req, res) => {
  try {
    const filters = filtersResultatsFromReq(req);
    const result = await chargerResultatsSelection(req.params.concoursId, filters);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    if ((result.counts?.en_attente || 0) > 0) {
      return res.status(400).json({
        error:
          'Impossible de générer le CSV : des décisions sont encore en attente. '
          + 'Finalisez toutes les décisions (admis / refusés) avant l\'export.',
      });
    }

    if (!result.counts?.total) {
      return res.status(400).json({ error: 'Aucun candidat validé pour ce concours' });
    }

    const resultatKey = result.resultat || 'tous';
    const centreSuffix = filters.centreId
      ? `-${String(result.candidats[0]?.centre?.nom || 'centre').replace(/[^\w\-]+/g, '_').slice(0, 30)}`
      : '';
    const resultatSuffix = resultatKey !== 'tous' ? `-${resultatKey}` : '';
    const safeName = String(result.concours.libelle || 'concours')
      .replace(/[^\w\-]+/g, '_')
      .slice(0, 50);

    const csv = resultatsSelectionToCsv(result);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="resultats-selection-${safeName}${resultatSuffix}${centreSuffix}.csv"`
    );
    return res.send(csv);
  } catch (error) {
    console.error('exportResultatsSelectionCsv:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * GET JSON liste retenus (VALIDE) par centre + alpha
 * Query: centreId, ville, q
 */
exports.getListeRetenus = async (req, res) => {
  try {
    const result = await chargerListeRetenus(req.params.concoursId, filtersFromReq(req));
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    return res.json(result);
  } catch (error) {
    console.error('getListeRetenus:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Export Excel-compatible (CSV UTF-8 BOM, séparateur ;)
 * Query: centreId, ville, q
 */
exports.exportListeRetenusExcel = async (req, res) => {
  try {
    const filters = filtersFromReq(req);
    const result = await chargerListeRetenus(req.params.concoursId, filters);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    const csv = listeRetenusToCsv(result);
    const centreSuffix = filters.centreId
      ? `-${String(result.centres[0]?.centreNom || 'centre').replace(/[^\w\-]+/g, '_').slice(0, 30)}`
      : '';
    const safeName = String(result.concours.libelle || 'concours')
      .replace(/[^\w\-]+/g, '_')
      .slice(0, 50);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="liste-retenus-${safeName}${centreSuffix}.csv"`
    );
    return res.send(csv);
  } catch (error) {
    console.error('exportListeRetenusExcel:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Export PDF liste retenus par centre
 */
exports.exportListeRetenusPdf = async (req, res) => {
  try {
    const filters = filtersFromReq(req);
    // Assure des N° de table à jour avant l'export
    await genererNumerosTableConcours(req.params.concoursId, { regenerer: true }).catch(() => null);

    const result = await chargerListeRetenus(req.params.concoursId, filters);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    const centreSuffix = filters.centreId
      ? `-${String(result.centres[0]?.centreNom || 'centre').replace(/[^\w\-]+/g, '_').slice(0, 30)}`
      : '';
    const safeName = String(result.concours.libelle || 'concours')
      .replace(/[^\w\-]+/g, '_')
      .slice(0, 50);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="liste-retenus-${safeName}${centreSuffix}.pdf"`
    );

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      layout: 'portrait',
      info: {
        Title: `Liste des retenus — ${result.concours.libelle || ''}`,
        Author: 'UniPath',
      },
    });
    doc.pipe(res);
    ensureTimesNewRomanFonts(doc);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const marginLeft = 40;
    const marginRight = 40;
    const usableWidth = pageWidth - marginLeft - marginRight;
    const bottomLimit = pageHeight - 42;

    // Colonnes utiles le jour de la composition (+ émargement pour signature)
    const colRang = 32;
    const colNom = 115;
    const colPrenom = 115;
    const colSexe = 36;
    const colNumeroTable = 90;
    const colEmargement = usableWidth - colRang - colNom - colPrenom - colSexe - colNumeroTable;

    const columns = [
      { key: 'rang', label: 'N°', width: colRang, align: 'center' },
      { key: 'nom', label: 'Nom', width: colNom, align: 'left' },
      { key: 'prenom', label: 'Prénom', width: colPrenom, align: 'left' },
      { key: 'sexe', label: 'Sexe', width: colSexe, align: 'center' },
      { key: 'numeroTable', label: 'N° de table', width: colNumeroTable, align: 'center' },
      { key: 'emargement', label: 'Émargement', width: colEmargement, align: 'center' },
    ];

    const rowHeight = 28;
    const headerHeight = 24;

    const drawDocumentHeader = () => {
      const metaParts = [
        result.concours.etablissement ? `Établissement : ${result.concours.etablissement}` : null,
        result.concours.code ? `Code concours : ${result.concours.code}` : null,
        `Total retenus : ${result.total}`,
        filters.ville ? `Ville : ${filters.ville}` : null,
        filters.centreId && result.centres[0]
          ? `Centre : ${result.centres[0].centreNom}`
          : null,
        result.sexe === 'M' ? 'Sexe : Masculin' : null,
        result.sexe === 'F' ? 'Sexe : Féminin' : null,
      ].filter(Boolean);

      return drawMesrsHeader(doc, {
        marginLeft,
        usableWidth,
        title: 'Liste des candidats retenus',
        subtitle: result.concours.libelle || '—',
        metaLine: metaParts.join('  ·  '),
        yStart: 18,
      });
    };

    const ensureSpace = (needed, y) => {
      if (y + needed <= bottomLimit) return { y, newPage: false };
      doc.addPage();
      return { y: drawDocumentHeader(), newPage: true };
    };

    const drawTableHeader = (y) => {
      doc.save();
      doc.rect(marginLeft, y, usableWidth, headerHeight).fill('#1e3a8a');
      let x = marginLeft;
      doc.fillColor('#ffffff').font(getPdfFontBold()).fontSize(8);
      for (const col of columns) {
        doc.text(col.label, x + 4, y + 6, {
          width: col.width - 8,
          align: col.align,
          lineBreak: false,
        });
        x += col.width;
      }
      doc.restore();
      doc.strokeColor('#1e3a8a').lineWidth(1)
        .rect(marginLeft, y, usableWidth, headerHeight)
        .stroke();
      return y + headerHeight;
    };

    const drawRow = (row, y, index) => {
      const bg = index % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.save();
      doc.rect(marginLeft, y, usableWidth, rowHeight).fill(bg);

      // Contours verticaux de chaque cellule
      let xLine = marginLeft;
      doc.strokeColor('#e5e7eb').lineWidth(0.5);
      for (const col of columns) {
        doc.rect(xLine, y, col.width, rowHeight).stroke();
        xLine += col.width;
      }

      const values = {
        rang: String(row.rangCentre).padStart(3, '0'),
        nom: row.candidat?.nom || '—',
        prenom: row.candidat?.prenom || '—',
        sexe: row.candidat?.sexeLabel || row.candidat?.sexe || '—',
        numeroTable: row.numeroTable || '—',
        emargement: '',
      };

      let x = marginLeft;
      doc.fillColor('#111827').fontSize(9);
      for (const col of columns) {
        if (col.key === 'emargement') {
          // Case vide pour la signature du candidat
          x += col.width;
          continue;
        }
        const isMono = col.key === 'numeroTable' || col.key === 'rang';
        doc.font(isMono ? getPdfFontBold() : getPdfFont());
        doc.text(String(values[col.key] || '—'), x + 4, y + 9, {
          width: col.width - 8,
          align: col.align,
          lineBreak: false,
          ellipsis: true,
        });
        x += col.width;
      }

      doc.restore();
      return y + rowHeight;
    };

    let y = drawDocumentHeader();

    if (result.centres.length === 0) {
      doc.fillColor('#6b7280').font(getPdfFont()).fontSize(10)
        .text('Aucun candidat retenu avec centre de composition.', marginLeft, y, {
          width: usableWidth,
          align: 'center',
        });
    } else {
      for (const centre of result.centres) {
        let space = ensureSpace(headerHeight + rowHeight * 2 + 40, y);
        y = space.y;

        doc.fillColor('#0f172a').font(getPdfFontBold()).fontSize(10)
          .text(`${centre.ville} — ${centre.centreNom}`, marginLeft, y, {
            width: usableWidth,
          });
        doc.fillColor('#64748b').font(getPdfFont()).fontSize(8)
          .text(
            `${centre.total} retenu${centre.total > 1 ? 's' : ''}`
            + (centre.communeCode ? ` · ville ${centre.communeCode}` : '')
            + (centre.centreCode ? ` · centre ${centre.centreCode}` : '')
            + (centre.adresse ? ` · ${centre.adresse}` : ''),
            marginLeft,
            y + 14,
            { width: usableWidth }
          );
        y += 32;
        y = drawTableHeader(y);

        centre.candidats.forEach((row, index) => {
          space = ensureSpace(rowHeight + 2, y);
          y = space.y;
          if (space.newPage) {
            doc.fillColor('#0f172a').font(getPdfFontBold()).fontSize(9)
              .text(
                `${centre.ville} — ${centre.centreNom} (suite)`,
                marginLeft,
                y,
                { width: usableWidth }
              );
            y += 16;
            y = drawTableHeader(y);
          }
          y = drawRow(row, y, index);
        });

        y += 18;
      }
    }

    doc.end();
  } catch (error) {
    console.error('exportListeRetenusPdf:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

/**
 * Génère les N° de table puis renvoie la liste retenus (outil post-clôture).
 */
exports.preparerListeRetenus = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const gen = await genererNumerosTableConcours(concoursId, { regenerer: true });
    if (!gen.ok) {
      return res.status(gen.status || 400).json({
        error: gen.error,
        details: gen.details,
      });
    }
    const liste = await chargerListeRetenus(concoursId);
    return res.json({
      message: 'Numéros de table générés et liste des retenus prête',
      numeros: gen,
      liste,
    });
  } catch (error) {
    console.error('preparerListeRetenus:', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

/**
 * Envoi groupé des convocations par mail aux candidats VALIDE.
 */
exports.envoyerConvocationsRetenus = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const regenererNumeros = req.body?.regenererNumeros !== false;

    if (regenererNumeros) {
      const gen = await genererNumerosTableConcours(concoursId, { regenerer: true });
      if (!gen.ok) {
        return res.status(gen.status || 400).json({
          error: gen.error || 'Impossible de générer les numéros de table avant envoi',
          details: gen.details,
        });
      }
    }

    const concours = await prisma.concours.findUnique({ where: { id: concoursId } });
    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    const inscriptions = await prisma.inscription.findMany({
      where: {
        concoursId,
        dossierInscription: { statut: 'VALIDE' },
      },
      include: {
        candidat: true,
        dossierInscription: {
          include: {
            centreChoisi: { include: { centre: true } },
          },
        },
      },
    });

    if (inscriptions.length === 0) {
      return res.status(400).json({ error: 'Aucun candidat admis (VALIDE) à convoquer' });
    }

    // Réponse immédiate, envoi en arrière-plan
    res.json({
      message: `Envoi des convocations lancé pour ${inscriptions.length} candidat(s)`,
      total: inscriptions.length,
    });

    runInBackground(async () => {
      let ok = 0;
      let ko = 0;
      for (const inscription of inscriptions) {
        try {
          await envoyerEmailDecisionFinale({
            candidat: inscription.candidat,
            concours,
            inscription,
            decision: 'VALIDE',
            motif: null,
          });
          ok += 1;
        } catch (err) {
          ko += 1;
          console.error(
            `Convocation échouée ${inscription.numeroInscription || inscription.id}:`,
            err.message
          );
        }
      }
      console.log(`[convocations] concours ${concoursId}: ${ok} OK, ${ko} échecs`);
    }, `convocations-concours-${concoursId}`);
  } catch (error) {
    console.error('envoyerConvocationsRetenus:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};
