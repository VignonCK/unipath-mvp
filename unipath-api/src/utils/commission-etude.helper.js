/**
 * Précondition d'ouverture d'étude : staff commission complet.
 */
async function getCommissionStaffStatus(prismaClient, concoursId) {
  const membres = await prismaClient.membreCommission.findMany({
    where: { concoursId },
    select: { id: true, sousRole: true },
  });

  const nbExaminateurs = membres.filter((m) => m.sousRole === 'EXAMINATEUR').length;
  const nbControleurs = membres.filter((m) => m.sousRole === 'CONTROLEUR').length;
  const manquants = [];
  if (nbExaminateurs < 1) manquants.push('EXAMINATEUR');
  if (nbControleurs < 1) manquants.push('CONTROLEUR');

  return {
    nbExaminateurs,
    nbControleurs,
    manquants,
    peutOuvrirEtude: manquants.length === 0,
  };
}

/**
 * True si l'étude a déjà été ouverte au moins une fois
 * (activité verdicts/décisions, ou clôture bien après la création).
 */
async function hasEtudeDejaOuverte(prismaClient, concours) {
  if (!concours?.etudeCloturee) {
    return true; // actuellement ouverte
  }

  const activity = await prismaClient.dossierInscription.count({
    where: {
      inscription: { concoursId: concours.id },
      OR: [
        { verdict1: { not: null } },
        { verdict2: { not: null } },
        { decisionControleur: { not: null } },
        { decisionCommissionDate: { not: null } },
      ],
    },
  });
  if (activity > 0) return true;

  if (concours.etudeClotureeAt && concours.createdAt) {
    const deltaMs = new Date(concours.etudeClotureeAt) - new Date(concours.createdAt);
    if (deltaMs > 60_000) return true;
  }

  return false;
}

module.exports = {
  getCommissionStaffStatus,
  hasEtudeDejaOuverte,
};
