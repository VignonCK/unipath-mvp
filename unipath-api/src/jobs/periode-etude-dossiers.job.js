// src/jobs/periode-etude-dossiers.job.js
const cron = require('node-cron');
const prisma = require('../prisma');
const logger = require('../utils/logger');
const { notifierDecSiEtudeIncomplete } = require('../utils/notif-etude-incomplete.helper');

async function notifierDecEtudeIncomplete() {
  const concoursTermines = await prisma.concours.findMany({
    where: {
      dateDebutEtudeDossiers: { not: null },
      etudeDossiersClotureeAt: { not: null },
      etudeDossiersAlerteAt: null,
    },
    select: {
      id: true,
      libelle: true,
      etablissement: true,
      dateFinEtudeDossiers: true,
      etudeDossiersClotureeAt: true,
    },
  });

  if (concoursTermines.length === 0) {
    return { verifies: 0, notifies: 0 };
  }

  let notifies = 0;
  for (const concours of concoursTermines) {
    const result = await notifierDecSiEtudeIncomplete(concours);
    notifies += result.notifications;
  }

  return { verifies: concoursTermines.length, notifies };
}

const job = cron.schedule(
  '15 8 * * *',
  async () => {
    try {
      logger.info('🔍 Job: vérification période étude dossiers');
      const result = await notifierDecEtudeIncomplete();
      logger.success(
        `✅ Job période étude: ${result.verifies} concours vérifié(s), ${result.notifies} notification(s)`
      );
    } catch (error) {
      logger.error('❌ Erreur job période étude dossiers:', error);
    }
  },
  { scheduled: false, timezone: 'Africa/Porto-Novo' }
);

const start = () => {
  job.start();
  logger.info('✅ Job "periode-etude-dossiers" démarré (quotidien 8h15)');
};

const stop = () => {
  job.stop();
  logger.info('🛑 Job "periode-etude-dossiers" arrêté');
};

const runNow = async () => {
  logger.info('🔄 Exécution manuelle du job période étude');
  return notifierDecEtudeIncomplete();
};

module.exports = { start, stop, runNow, notifierDecEtudeIncomplete };
