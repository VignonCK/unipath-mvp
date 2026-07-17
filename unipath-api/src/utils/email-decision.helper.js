const emailService = require('../services/email.service');
const pdfService = require('../services/pdf.service');
const prisma = require('../prisma');
const {
  DOSSIER_CENTRE_INCLUDE,
  enrichDossierInscriptionForPdf,
} = require('./centres-composition.helper');

/**
 * Envoie l'email de décision finale au candidat (avec PDF convocation si VALIDE).
 */
async function envoyerEmailDecisionFinale({ candidat, concours, inscription, decision, motif }) {
  const numeroDossier = inscription.numeroInscription || inscription.id.substring(0, 8).toUpperCase();
  const emailData = {
    candidatEmail: candidat.email,
    candidatNom: candidat.nom,
    candidatPrenom: candidat.prenom,
    candidatMatricule: candidat.matricule,
    candidatTelephone: candidat.telephone,
    candidatId: candidat.id,
    concours: concours.libelle,
    numeroDossier,
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

  if (decision === 'VALIDE') {
    let pdfPath = null;
    try {
      let dossierInscription = inscription.dossierInscription;
      if (!dossierInscription?.centreChoisi && inscription.id) {
        const full = await prisma.inscription.findUnique({
          where: { id: inscription.id },
          include: { dossierInscription: { include: DOSSIER_CENTRE_INCLUDE } },
        });
        dossierInscription = full?.dossierInscription;
      }
      const enriched = enrichDossierInscriptionForPdf(dossierInscription);
      const centreChoisi = enriched?.centreCompositionChoisi;
      if (centreChoisi?.nom) {
        emailData.lieuExamen = [centreChoisi.nom, centreChoisi.ville, centreChoisi.adresse]
          .filter(Boolean)
          .join(' — ');
      }

      const pdfResult = await pdfService.genererConvocation({
        candidat,
        concours,
        inscription: { ...inscription, dossierInscription: enriched },
        centreCompositionChoisi: centreChoisi || null,
      });
      pdfPath = pdfResult.filePath;
      await emailService.envoyerEmailValidation(emailData, pdfPath);
      if (pdfPath) setTimeout(() => pdfService.nettoyerPDF(pdfPath), 10000);
    } catch (err) {
      console.error('Erreur PDF convocation, envoi sans pièce jointe:', err);
      await emailService.envoyerEmailValidation(emailData, null);
    }
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

module.exports = { envoyerEmailDecisionFinale };
