// src/jobs/dossiers-sans-verdict.job.js
const cron = require('node-cron');
const prisma = require('../prisma');
const logger = require('../utils/logger');

const ALERTE_SANS_VERDICT = 'SANS_VERDICT_2J';

async function notificationDejaEnvoyee(userId, dossierInscriptionId, type) {
  const depuis24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existante = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      createdAt: { gte: depuis24h },
      data: {
        path: ['alerteJob'],
        equals: ALERTE_SANS_VERDICT,
      },
    },
  });
  if (existante) return true;

  const parDossier = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      createdAt: { gte: depuis24h },
      data: {
        path: ['dossierInscriptionId'],
        equals: dossierInscriptionId,
      },
    },
  });
  return !!parDossier;
}

const dossiersSansVerdictJob = cron.schedule(
  '0 8 * * *',
  async () => {
    try {
      logger.info('🔍 Démarrage du job: Détection des dossiers sans verdict');

      const dateLimite = new Date();
      dateLimite.setDate(dateLimite.getDate() - 2);

      const dossiersSansVerdict = await prisma.dossierInscription.findMany({
        where: {
          verdict1Par: null,
          verdict2Par: null,
          createdAt: { lte: dateLimite },
        },
        include: {
          inscription: {
            include: {
              candidat: { select: { nom: true, prenom: true, email: true } },
              concours: { select: { libelle: true, etablissement: true } },
            },
          },
        },
      });

      if (dossiersSansVerdict.length === 0) {
        logger.info('✅ Aucun dossier sans verdict détecté');
        return;
      }

      logger.warn(`⚠️ ${dossiersSansVerdict.length} dossier(s) sans verdict détecté(s)`);

      const [controleur, examinateurs] = await Promise.all([
        prisma.membreCommission.findFirst({ where: { sousRole: 'CONTROLEUR' } }),
        prisma.membreCommission.findMany({ where: { sousRole: 'EXAMINATEUR' } }),
      ]);

      let notificationsCreees = 0;

      for (const dossier of dossiersSansVerdict) {
        const joursEcoules = Math.floor(
          (new Date() - new Date(dossier.createdAt)) / (1000 * 60 * 60 * 24)
        );
        const numero = dossier.inscription.numeroInscription || dossier.id.substring(0, 8);
        const dataBase = {
          dossierInscriptionId: dossier.id,
          numeroInscription: numero,
          alerteJob: ALERTE_SANS_VERDICT,
          candidat: dossier.inscription.candidat,
          concours: dossier.inscription.concours,
          joursEcoules,
          dateCreation: dossier.createdAt,
        };

        if (controleur) {
          const skip = await notificationDejaEnvoyee(controleur.id, dossier.id, 'ALERTE');
          if (!skip) {
            await prisma.notification.create({
              data: {
                userId: controleur.id,
                type: 'ALERTE',
                priority: 'HIGH',
                title: '⚠️ Dossier sans verdict depuis plus de 2 jours',
                message: `Le dossier ${numero} (${dossier.inscription.candidat.nom} ${dossier.inscription.candidat.prenom}) n'a reçu aucun verdict depuis ${joursEcoules} jours`,
                data: dataBase,
              },
            });
            notificationsCreees += 1;
          }
        }

        for (const examinateur of examinateurs) {
          const skip = await notificationDejaEnvoyee(examinateur.id, dossier.id, 'NOUVEAU_DOSSIER');
          if (!skip) {
            await prisma.notification.create({
              data: {
                userId: examinateur.id,
                type: 'NOUVEAU_DOSSIER',
                priority: 'NORMAL',
                title: "Dossier en attente d'évaluation",
                message: `Le dossier ${numero} (${dossier.inscription.candidat.nom} ${dossier.inscription.candidat.prenom}) attend votre évaluation depuis ${joursEcoules} jours`,
                data: dataBase,
              },
            });
            notificationsCreees += 1;
          }
        }
      }

      logger.success(
        `✅ Job terminé: ${dossiersSansVerdict.length} dossier(s) vérifié(s), ${notificationsCreees} notification(s) créée(s)`
      );
    } catch (error) {
      logger.error('❌ Erreur dans le job dossiers-sans-verdict:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'Africa/Porto-Novo',
  }
);

const start = () => {
  dossiersSansVerdictJob.start();
  logger.info('✅ Job "dossiers-sans-verdict" démarré (exécution quotidienne à 8h00)');
};

const stop = () => {
  dossiersSansVerdictJob.stop();
  logger.info('🛑 Job "dossiers-sans-verdict" arrêté');
};

const runNow = async () => {
  logger.info('🔄 Exécution manuelle du job "dossiers-sans-verdict"');
  await dossiersSansVerdictJob._callbacks[0]();
};

module.exports = { start, stop, runNow };
