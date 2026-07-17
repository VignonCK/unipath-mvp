const PDFDocument = require('pdfkit');
const { runInBackground } = require('../utils/background-task');
const { envoyerEmailDecisionFinale } = require('../utils/email-decision.helper');
const {
  chargerListeRetenus,
  listeRetenusToCsv,
} = require('../utils/liste-retenus.helper');
const { genererNumerosTableConcours } = require('../utils/numero-table.helper');
const prisma = require('../prisma');

/**
 * GET JSON liste retenus (VALIDE) par centre + alpha
 */
exports.getListeRetenus = async (req, res) => {
  try {
    const result = await chargerListeRetenus(req.params.concoursId);
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
 */
exports.exportListeRetenusExcel = async (req, res) => {
  try {
    const result = await chargerListeRetenus(req.params.concoursId);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    const csv = listeRetenusToCsv(result);
    const safeName = String(result.concours.libelle || 'concours')
      .replace(/[^\w\-]+/g, '_')
      .slice(0, 60);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="liste-retenus-${safeName}.csv"`
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
    const result = await chargerListeRetenus(req.params.concoursId);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    const safeName = String(result.concours.libelle || 'concours')
      .replace(/[^\w\-]+/g, '_')
      .slice(0, 60);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="liste-retenus-${safeName}.pdf"`
    );

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(14).text('Liste des candidats retenus', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(11).text(result.concours.libelle, { align: 'center' });
    if (result.concours.code) {
      doc.fontSize(9).fillColor('#555').text(`Code concours : ${result.concours.code}`, {
        align: 'center',
      });
    }
    doc.fillColor('#000');
    doc.moveDown(0.3);
    doc.fontSize(9).text(
      `Établissement : ${result.concours.etablissement || '—'} · Total retenus : ${result.total}`,
      { align: 'center' }
    );
    doc.moveDown(0.8);

    if (result.centres.length === 0) {
      doc.fontSize(10).text('Aucun candidat retenu avec centre de composition.');
    }

    for (const centre of result.centres) {
      doc.fontSize(11).fillColor('#111').text(
        `${centre.ville} — ${centre.centreNom} (${centre.total})`
        + (centre.communeCode ? ` · commune ${centre.communeCode}` : '')
      );
      doc.moveDown(0.3);

      doc.fontSize(8).fillColor('#333');
      for (const row of centre.candidats) {
        const line = [
          String(row.rangCentre).padStart(3, '0'),
          `${row.candidat?.nom || ''} ${row.candidat?.prenom || ''}`.trim(),
          row.numeroTable || row.numeroInscription || '',
          row.candidat?.email || '',
        ].join('  |  ');
        doc.text(line, { width: 520 });
      }
      doc.moveDown(0.6);
      doc.fillColor('#000');
    }

    doc.fontSize(8).fillColor('#666').text(
      `Généré le ${new Date(result.genereAt).toLocaleString('fr-FR')}`,
      { align: 'right' }
    );
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
