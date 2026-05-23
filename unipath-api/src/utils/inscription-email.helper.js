const notificationService = require('../services/notification.service');

/**
 * Email + PDF de pré-inscription après création d'inscription (non bloquant).
 */
async function envoyerPreInscriptionApresCreation({ candidat, concours, inscription }) {
  const numeroDossier = inscription.numeroInscription || inscription.id.substring(0, 8).toUpperCase();

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
      numeroDossier,
      inscriptionId: inscription.id,
    },
    priority: 'HIGH',
    sendEmail: true,
  });
}

module.exports = { envoyerPreInscriptionApresCreation };
