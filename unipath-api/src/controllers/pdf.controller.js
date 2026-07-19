// src/controllers/pdf.controller.js
const prisma = require('../prisma');
const path = require('path');
const fs = require('fs');
const pdfService = require('../services/pdf.service');
const {
  DOSSIER_CENTRE_INCLUDE,
  enrichDossierInscriptionForPdf,
  peutEnvoyerConvocationPdf,
} = require('../utils/centres-composition.helper');
const { genererNumerosTableConcours } = require('../utils/numero-table.helper');

exports.telechargerConvocation = async (req, res) => {
  try {
    const { inscriptionId } = req.params;

    let inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: {
        candidat: {
          include: {
            dossier: {
              select: {
                photo: true,
              },
            },
          },
        },
        concours: true,
        dossierInscription: { include: DOSSIER_CENTRE_INCLUDE },
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvee' });
    }

    if (inscription.candidatId !== req.user.id) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const statutDossier = inscription.dossierInscription?.statut;
    if (statutDossier !== 'VALIDE') {
      return res.status(400).json({ error: 'La convocation n\'est disponible que pour les dossiers valides' });
    }

    const gate = await peutEnvoyerConvocationPdf({
      concoursId: inscription.concoursId,
      concours: inscription.concours,
      dossierInscription: inscription.dossierInscription,
    }, prisma);
    if (!gate.ok) {
      return res.status(400).json({
        error: 'Choisissez d\'abord votre centre de composition avant de télécharger la convocation.',
      });
    }

    // Si l'étude est clôturée et le N° de table manque encore, l'attribuer
    if (!inscription.numeroTable && inscription.concours?.etudeDossiersClotureeAt) {
      await genererNumerosTableConcours(inscription.concoursId, { regenerer: false }).catch(() => null);
      inscription = await prisma.inscription.findUnique({
        where: { id: inscriptionId },
        include: {
          candidat: {
            include: {
              dossier: { select: { photo: true } },
            },
          },
          concours: true,
          dossierInscription: { include: DOSSIER_CENTRE_INCLUDE },
        },
      });
    }

    const dossierEnrichi = enrichDossierInscriptionForPdf(inscription.dossierInscription);

    const pdfResult = await pdfService.genererConvocation({
      candidat: {
        ...inscription.candidat,
        photoPath: inscription.candidat?.dossier?.photo || '',
      },
      concours: inscription.concours,
      inscription: {
        ...inscription,
        dossierInscription: dossierEnrichi,
      },
      centreCompositionChoisi: dossierEnrichi?.centreCompositionChoisi || null,
      numeroTable: inscription.numeroTable || null,
    });

    if (!pdfResult?.filePath || !fs.existsSync(pdfResult.filePath)) {
      return res.status(500).json({ error: 'Le PDF n\'a pas ete genere' });
    }

    const pdfBuffer = fs.readFileSync(pdfResult.filePath);
    const filename = pdfResult.fileName || `convocation_${inscription.candidat.matricule}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

    setTimeout(() => {
      try {
        pdfService.nettoyerPDF(pdfResult.filePath);
      } catch (_) {
        /* ignore */
      }
    }, 5000);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.telechargerPreinscription = async (req, res) => {
  try {
    const { inscriptionId } = req.params;

    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: {
        candidat: {
          include: {
            dossier: true,
          },
        },
        concours: true,
        dossierInscription: { include: DOSSIER_CENTRE_INCLUDE },
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvee' });
    }

    if (inscription.candidatId !== req.user.id) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const result = await pdfService.genererFichePreInscriptionDepuisInscription(inscription);
    if (!result?.filePath || !fs.existsSync(result.filePath)) {
      return res.status(500).json({ error: 'Le PDF n\'a pas ete genere' });
    }

    const pdfBuffer = fs.readFileSync(result.filePath);
    const filename = result.fileName || `preinscription_${inscription.candidat.matricule}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

    setTimeout(() => {
      try {
        pdfService.nettoyerPDF(result.filePath);
      } catch (_) {
        /* ignore */
      }
    }, 5000);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
