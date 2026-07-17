/**
 * Notifie les administrateurs DEC lorsqu'une étude est clôturée
 * alors que des dossiers n'ont pas encore de verdict final.
 */
const prisma = require('../prisma');
const { whereDossierNonEtudie } = require('./periode-etude-dossiers.helper');

const ALERTE_ETUDE_INCOMPLETE = 'ETUDE_DOSSIERS_INCOMPLETE';

/**
 * @param {object} concours — au minimum { id, libelle, etablissement? }
 * @returns {{ incomplete: boolean, dossiersNonEtudies: number, totalDossiers: number, notifications: number }}
 */
async function notifierDecSiEtudeIncomplete(concours) {
  const now = new Date();
  const concoursId = concours.id;

  const [dossiersNonEtudies, totalDossiers] = await Promise.all([
    prisma.dossierInscription.count({
      where: {
        inscription: { concoursId },
        ...whereDossierNonEtudie(),
      },
    }),
    prisma.dossierInscription.count({
      where: { inscription: { concoursId } },
    }),
  ]);

  if (dossiersNonEtudies === 0) {
    await prisma.concours.update({
      where: { id: concoursId },
      data: { etudeDossiersAlerteAt: now },
    });
    return {
      incomplete: false,
      dossiersNonEtudies: 0,
      totalDossiers,
      notifications: 0,
    };
  }

  const decAdmins = await prisma.administrateurDEC.findMany({
    select: { id: true },
  });

  let notifications = 0;
  const title = 'Étude des dossiers incomplète';
  const message =
    `Le concours « ${concours.libelle} » a été clôturé alors que ${dossiersNonEtudies} dossier(s) `
    + `sur ${totalDossiers} n'ont pas encore été examinés (sans verdict final). `
    + `Vous pouvez relancer l'étude pour traiter les dossiers restants.`;

  for (const admin of decAdmins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'ALERTE',
        priority: 'HIGH',
        title,
        message,
        data: {
          alerteJob: ALERTE_ETUDE_INCOMPLETE,
          concoursId,
          libelle: concours.libelle,
          etablissement: concours.etablissement || null,
          dossiersNonEtudies,
          totalDossiers,
          declenchePar: 'CLOTURE_ETUDE',
        },
      },
    });
    notifications += 1;
  }

  await prisma.concours.update({
    where: { id: concoursId },
    data: { etudeDossiersAlerteAt: now },
  });

  return {
    incomplete: true,
    dossiersNonEtudies,
    totalDossiers,
    notifications,
  };
}

module.exports = {
  ALERTE_ETUDE_INCOMPLETE,
  notifierDecSiEtudeIncomplete,
};
