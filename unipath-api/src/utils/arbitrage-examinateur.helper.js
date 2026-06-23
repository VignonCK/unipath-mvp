const prisma = require('../prisma');
const emailService = require('../services/email.service');
const { isArbitrageDivergent, VERDICT_LABELS } = require('./verdict-workflow.helper');

/**
 * Notifie l'examinateur (in-app + email) lorsque le contrôleur arbitre différemment.
 */
async function notifierExaminateurArbitrageDivergent({
  dossier,
  inscription,
  concours,
  decision,
  motif,
}) {
  if (!dossier.verdict1Par || !isArbitrageDivergent(dossier.verdict1, decision)) {
    return;
  }

  const examinateur = await prisma.membreCommission.findUnique({
    where: { id: dossier.verdict1Par },
    select: { id: true, nom: true, prenom: true, email: true },
  });

  if (!examinateur) {
    return;
  }

  const verdictExaLabel = VERDICT_LABELS[dossier.verdict1] || dossier.verdict1;
  const decisionLabel = VERDICT_LABELS[decision] || decision;
  const numeroInscription = inscription.numeroInscription;

  await prisma.notification.create({
    data: {
      userId: examinateur.id,
      type: 'ALERTE',
      priority: 'HIGH',
      title: 'Arbitrage divergent — retour du contrôleur',
      message: `Sur le dossier ${numeroInscription}, le contrôleur a arbitré « ${decisionLabel} » alors que vous aviez « ${verdictExaLabel} ». Motif : ${motif}`,
      data: {
        dossierInscriptionId: dossier.id,
        numeroInscription,
        verdictExaminateur: dossier.verdict1,
        decisionControleur: decision,
        motifArbitrage: motif,
      },
    },
  });

  try {
    await emailService.envoyerEmailArbitrageDivergentExaminateur({
      examinateurId: examinateur.id,
      examinateurEmail: examinateur.email,
      examinateurNom: examinateur.nom,
      examinateurPrenom: examinateur.prenom,
      numeroInscription,
      concours: concours.libelle,
      verdictExaminateur: verdictExaLabel,
      decisionControleur: decisionLabel,
      motif,
    });
  } catch (emailErr) {
    console.error('Erreur envoi email arbitrage divergent examinateur:', emailErr);
  }
}

module.exports = { notifierExaminateurArbitrageDivergent };
