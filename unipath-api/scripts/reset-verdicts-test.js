/**
 * Reset temporaire pour tests : annule tous les verdicts / décisions
 * sur les dossiers d'inscription, et remet le statut à EN_ATTENTE.
 */
const prisma = require('../src/prisma');

async function main() {
  const before = await prisma.dossierInscription.count({
    where: {
      OR: [
        { verdict1: { not: null } },
        { verdict1Par: { not: null } },
        { decisionControleur: { not: null } },
        { decisionControleurPar: { not: null } },
        { verdict2: { not: null } },
        { verdict2Par: { not: null } },
        { decisionCommissionPar: { not: null } },
        { statut: { not: 'EN_ATTENTE' } },
      ],
    },
  });

  const result = await prisma.dossierInscription.updateMany({
    data: {
      statut: 'EN_ATTENTE',
      verdict1: null,
      verdict1Par: null,
      verdict1Motif: null,
      verdict1Date: null,
      verdict1ModifieCount: 0,
      verdict2: null,
      verdict2Par: null,
      verdict2Motif: null,
      verdict2Date: null,
      verdict2ModifieCount: 0,
      decisionControleur: null,
      decisionControleurMotif: null,
      decisionControleurDate: null,
      decisionControleurPar: null,
      commentaireRejet: null,
      commentaireSousReserve: null,
      decisionCommissionPar: null,
      decisionCommissionDate: null,
      commentaireControleur: null,
    },
  });

  const remaining = await prisma.dossierInscription.count({
    where: {
      OR: [
        { verdict1: { not: null } },
        { verdict1Par: { not: null } },
        { decisionControleur: { not: null } },
        { decisionControleurPar: { not: null } },
      ],
    },
  });

  const total = await prisma.dossierInscription.count();
  const enAttente = await prisma.dossierInscription.count({ where: { statut: 'EN_ATTENTE' } });

  console.log(`Dossiers avec verdicts/décisions avant: ${before}`);
  console.log(`Dossiers mis à jour: ${result.count}`);
  console.log(`Dossiers encore avec verdict: ${remaining}`);
  console.log(`Total dossiers: ${total} | EN_ATTENTE: ${enAttente}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
