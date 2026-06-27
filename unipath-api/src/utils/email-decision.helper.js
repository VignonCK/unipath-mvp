const emailService = require('../services/email.service');
const pdfService = require('../services/pdf.service');

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

  if (decision === 'VALIDE') {
    let pdfPath = null;
    try {
      const pdfResult = await pdfService.genererConvocation({
        candidat,
        concours,
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
