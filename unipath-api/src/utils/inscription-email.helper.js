const notificationService = require('../services/notification.service');
const prisma = require('../prisma');
const {
  DOSSIER_CENTRE_INCLUDE,
  enrichDossierInscriptionForPdf,
} = require('./centres-composition.helper');

/**
 * Email + PDF de pré-inscription après création d'inscription (non bloquant).
 */
async function envoyerPreInscriptionApresCreation({ candidat, concours, inscription }) {
  const numeroDossier = inscription.numeroInscription || inscription.id.substring(0, 8).toUpperCase();

  let centreCompositionChoisi = null;
  try {
    const full = await prisma.inscription.findUnique({
      where: { id: inscription.id },
      include: {
        dossierInscription: { include: DOSSIER_CENTRE_INCLUDE },
        concours: true,
      },
    });
    const enriched = enrichDossierInscriptionForPdf(full?.dossierInscription);
    centreCompositionChoisi = enriched?.centreCompositionChoisi || null;
  } catch (err) {
    console.error('Impossible de charger le centre pour la fiche pré-inscription:', err.message);
  }

  await notificationService.sendNotification({
    event: 'PRE_INSCRIPTION',
    userId: candidat.id,
    data: {
      candidatEmail: candidat.email,
      candidatNom: candidat.nom,
      candidatPrenom: candidat.prenom,
      candidatMatricule: candidat.matricule,
      candidatTelephone: candidat.telephone,
      candidatDateNaiss: candidat.dateNaiss,
      candidatLieuNaiss: candidat.lieuNaiss,
      concours: concours.libelle,
      concoursDateDebut: concours.dateDebut,
      concoursDateFin: concours.dateFin,
      concoursDescription: concours.description,
      etablissement: concours.etablissement,
      numeroDossier,
      inscriptionId: inscription.id,
      centreCompositionChoisi,
    },
    priority: 'HIGH',
    sendEmail: true,
  });
}

module.exports = { envoyerPreInscriptionApresCreation };
