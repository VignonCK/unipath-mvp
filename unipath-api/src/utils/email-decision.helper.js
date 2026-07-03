const prisma = require('../prisma');
const emailService = require('../services/email.service');
const pdfService = require('../services/pdf.service');
const {
  enrichDossierInscriptionForPdf,
  peutEnvoyerConvocationPdf,
} = require('./centres-composition.helper');

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

async function resolveInscriptionForConvocationPdf(inscription) {
  if (inscription?.dossierInscription) {
    return inscription;
  }

  if (!inscription?.id) {
    return inscription;
  }

  const loaded = await prisma.inscription.findUnique({
    where: { id: inscription.id },
    include: INSCRIPTION_PDF_INCLUDE,
  });

  return loaded || inscription;
}

function buildGenererConvocationPayload(inscriptionRecord, candidat, concours) {
  const ins = inscriptionRecord || {};
  const resolvedCandidat = ins.candidat || candidat;
  const resolvedConcours = ins.concours || concours;
  const rawDossier = ins.dossierInscription ?? (
    ins.centreCompositionChoisi
      ? { centreCompositionChoisi: ins.centreCompositionChoisi }
      : null
  );
  const dossierInscription = enrichDossierInscriptionForPdf(rawDossier);

  return {
    candidat: {
      ...resolvedCandidat,
      dossier: resolvedCandidat?.dossier ?? null,
    },
    concours: resolvedConcours,
    inscription: {
      id: ins.id,
      numeroInscription: ins.numeroInscription,
      concours: resolvedConcours,
      dossierInscription,
      candidat: {
        dossier: resolvedCandidat?.dossier ?? null,
      },
    },
  };
}

function buildEmailDataDecision({ candidat, concours, inscription, motif }) {
  const numeroDossier = inscription.numeroInscription || inscription.id.substring(0, 8).toUpperCase();
  return {
    candidatEmail: candidat.email,
    candidatNom: candidat.nom,
    candidatPrenom: candidat.prenom,
    candidatMatricule: candidat.matricule,
    candidatTelephone: candidat.telephone,
    candidatId: candidat.id,
    concours: concours.libelle,
    numeroDossier,
    inscriptionId: inscription.id,
    concoursDateDebut: concours.dateDebut,
    concoursDateFin: concours.dateFin,
    concoursDescription: concours.description,
    dateExamen: concours.dateComposition
      ? new Date(concours.dateComposition).toLocaleDateString('fr-FR')
      : concours.dateDebut
        ? new Date(concours.dateDebut).toLocaleDateString('fr-FR')
        : null,
    lieuExamen: concours.etablissement || "EPAC - Université d'Abomey-Calavi",
    motif,
  };
}

async function genererPdfConvocation(inscriptionRecord, candidat, concours) {
  const inscriptionForPdf = await resolveInscriptionForConvocationPdf(inscriptionRecord);
  const pdfResult = await pdfService.genererConvocation(
    buildGenererConvocationPayload(inscriptionForPdf, candidat, concours),
  );
  return { pdfPath: pdfResult.filePath, inscriptionForPdf };
}

/**
 * Envoie la convocation PDF au candidat (centre déjà choisi si requis).
 */
async function envoyerConvocationAuCandidat({ candidat, concours, inscription }) {
  const emailData = buildEmailDataDecision({ candidat, concours, inscription });
  let pdfPath = null;

  try {
    const { pdfPath: generatedPath } = await genererPdfConvocation(inscription, candidat, concours);
    pdfPath = generatedPath;
    await emailService.envoyerEmailValidation(emailData, pdfPath);
  } catch (err) {
    console.error('Erreur PDF convocation, envoi sans pièce jointe:', err);
    await emailService.envoyerEmailValidation(emailData, null);
  } finally {
    if (pdfPath) {
      setTimeout(() => pdfService.nettoyerPDF(pdfPath), 10000);
    }
  }
}

/**
 * Envoie l'email de décision finale au candidat (avec PDF convocation si VALIDE et centre choisi).
 */
async function envoyerEmailDecisionFinale({ candidat, concours, inscription, decision, motif }) {
  const emailData = buildEmailDataDecision({ candidat, concours, inscription, motif });

  if (decision === 'VALIDE') {
    const inscriptionForPdf = await resolveInscriptionForConvocationPdf(inscription);
    const convocationCheck = await peutEnvoyerConvocationPdf(
      {
        concoursId: inscriptionForPdf.concoursId || concours.id,
        concours: inscriptionForPdf.concours || concours,
        dossierInscription: inscriptionForPdf.dossierInscription,
      },
      prisma,
    );

    if (!convocationCheck.ok) {
      await emailService.envoyerEmailDossierValideAttenteCentre(emailData);
      return;
    }

    await envoyerConvocationAuCandidat({ candidat, concours, inscription: inscriptionForPdf });
    return;
  }

  if (decision === 'REJETE') {
    await emailService.envoyerEmailRejet(emailData);
    return;
  }

  if (decision === 'SOUS_RESERVE') {
    await emailService.envoyerEmailSousReserve(emailData);
  }
}

module.exports = {
  envoyerEmailDecisionFinale,
  envoyerConvocationAuCandidat,
  resolveInscriptionForConvocationPdf,
  buildGenererConvocationPayload,
  buildEmailDataDecision,
};
