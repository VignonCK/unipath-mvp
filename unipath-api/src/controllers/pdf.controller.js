// src/controllers/pdf.controller.js
const fs = require('fs');
const prisma = require('../prisma');
const pdfService = require('../services/pdf.service');
const { enrichDossierInscriptionForPdf, peutEnvoyerConvocationPdf } = require('../utils/centres-composition.helper');

const INSCRIPTION_PDF_INCLUDE = {
  candidat: {
    include: {
      dossier: true,
    },
  },
  concours: true,
  dossierInscription: {
    include: {
      centreChoisi: {
        include: { centre: true },
      },
    },
  },
};

function buildNomFichierPdf(prefix, candidat, numeroInscription) {
  const numero = numeroInscription || 'N-A';
  return `${prefix}-${candidat.nom}-${candidat.prenom}-${numero}.pdf`
    .replace(/\s+/g, '-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

async function envoyerPdfGenere(res, pdfResult, nomFichier) {
  const pdfBuffer = await fs.promises.readFile(pdfResult.filePath);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nomFichier}"`);
  console.log('[PDF] Content-Disposition envoyé:', `attachment; filename="${nomFichier}"`);
  console.log('[PDF] Access-Control-Expose-Headers:', res.getHeader('Access-Control-Expose-Headers'));
  res.send(pdfBuffer);

  setTimeout(() => pdfService.nettoyerPDF(pdfResult.filePath), 10000);
}

exports.telechargerConvocation = async (req, res) => {
  try {
    const { inscriptionId } = req.params;

    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: INSCRIPTION_PDF_INCLUDE,
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

    const convocationCheck = await peutEnvoyerConvocationPdf(
      {
        concoursId: inscription.concoursId,
        concours: inscription.concours,
        dossierInscription: inscription.dossierInscription,
      },
      prisma,
    );

    if (!convocationCheck.ok) {
      return res.status(400).json({
        error: 'Veuillez choisir votre centre de composition avant de telecharger la convocation',
      });
    }

    const dossierPdf = enrichDossierInscriptionForPdf(inscription.dossierInscription);

    const pdfResult = await pdfService.genererConvocation({
      candidat: {
        ...inscription.candidat,
        dossier: inscription.candidat?.dossier ?? null,
      },
      concours: inscription.concours,
      inscription: {
        id: inscription.id,
        numeroInscription: inscription.numeroInscription,
        concours: inscription.concours,
        dossierInscription: dossierPdf,
        candidat: {
          dossier: inscription.candidat?.dossier ?? null,
        },
      },
    });

    const nomFichier = buildNomFichierPdf(
      'convocation',
      inscription.candidat,
      inscription.numeroInscription,
    );

    await envoyerPdfGenere(res, pdfResult, nomFichier);
  } catch (error) {
    console.error('telechargerConvocation error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.telechargerPreinscription = async (req, res) => {
  try {
    const { inscriptionId } = req.params;

    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: INSCRIPTION_PDF_INCLUDE,
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    if (inscription.candidatId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const pdfResult = await pdfService.genererFichePreInscriptionDepuisInscription(inscription);

    const nomFichier = buildNomFichierPdf(
      'fiche-preinscription',
      inscription.candidat,
      inscription.numeroInscription,
    );

    await envoyerPdfGenere(res, pdfResult, nomFichier);
  } catch (error) {
    console.error('telechargerPreinscription error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
