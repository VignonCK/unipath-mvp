/**
 * Pour les concours avec décisions ADMIS/REFUSE :
 * - clôturer les inscriptions (dateFinDepot passée)
 * - clôturer l'étude des dossiers
 * - générer les N° de table des retenus (VALIDE)
 */
const prisma = require('../src/prisma');
const { genererNumerosTableConcours } = require('../src/utils/numero-table.helper');

async function main() {
  const now = new Date();
  const hier = new Date(now.getTime() - 24 * 3600 * 1000);
  const avantHier = new Date(now.getTime() - 3 * 24 * 3600 * 1000);
  const debutEtude = new Date(now.getTime() - 10 * 24 * 3600 * 1000);

  const decided = await prisma.inscription.findMany({
    where: { resultatComposition: { in: ['ADMIS', 'REFUSE'] } },
    select: { concoursId: true },
    distinct: ['concoursId'],
  });
  const concoursIds = decided.map((d) => d.concoursId);
  console.log(`Concours concernés: ${concoursIds.length}`);

  for (const concoursId of concoursIds) {
    const c = await prisma.concours.findUnique({
      where: { id: concoursId },
      select: {
        id: true,
        libelle: true,
        code: true,
        dateDebutDepot: true,
        dateFinDepot: true,
        dateFinDepotAvantCloture: true,
        dateDebutEtudeDossiers: true,
        dateFinEtudeDossiers: true,
        etudeDossiersClotureeAt: true,
        dateComposition: true,
        dateDebutComposition: true,
        dateFinComposition: true,
      },
    });
    if (!c) continue;

    console.log(`\n>>> ${c.libelle} (${c.code})`);

    // 1) Clôturer inscriptions si encore ouvertes
    const depotOuvert = !c.dateFinDepot || c.dateFinDepot >= now;
    const data = {};
    if (depotOuvert) {
      if (c.dateFinDepot && !c.dateFinDepotAvantCloture) {
        data.dateFinDepotAvantCloture = c.dateFinDepot;
      }
      data.dateFinDepot = hier;
      console.log('  - inscriptions clôturées (dateFinDepot → hier)');
    } else {
      console.log('  - inscriptions déjà clôturées');
    }

    // 2) Clôturer étude
    if (!c.dateDebutEtudeDossiers) {
      data.dateDebutEtudeDossiers = debutEtude;
    }
    data.dateFinEtudeDossiers = avantHier;
    data.etudeDossiersClotureeAt = avantHier;
    data.etudeDossiersAlerteAt = null;
    console.log('  - étude des dossiers clôturée');

    // S'assurer qu'une date de composition existe (requis pour N° de table AA)
    if (!c.dateComposition && !c.dateDebutComposition) {
      data.dateComposition = now;
      data.dateDebutComposition = now;
      data.dateFinComposition = new Date(now.getTime() + 2 * 24 * 3600 * 1000);
      console.log('  - dates de composition renseignées');
    }

    await prisma.concours.update({ where: { id: concoursId }, data });

    // 3) Générer N° de table pour les retenus VALIDE
    const result = await genererNumerosTableConcours(concoursId, { regenerer: true });
    if (!result.ok) {
      console.log(`  - N° table ÉCHEC: ${result.error}`);
      if (result.details) console.log('   ', JSON.stringify(result.details));
    } else {
      console.log(`  - N° table générés: ${result.totalGeneres ?? result.updates?.length ?? '?'}`);
    }

    // Stats locaux
    const retenus = await prisma.inscription.findMany({
      where: {
        concoursId,
        dossierInscription: { statut: 'VALIDE' },
      },
      select: {
        numeroInscription: true,
        numeroTable: true,
        resultatComposition: true,
      },
    });
    const avecTable = retenus.filter((r) => r.numeroTable).length;
    const admis = retenus.filter((r) => r.resultatComposition === 'ADMIS').length;
    const refuses = retenus.filter((r) => r.resultatComposition === 'REFUSE').length;
    console.log(
      `  - retenus VALIDE: ${retenus.length} | avec N° table: ${avecTable} | ADMIS: ${admis} | REFUSE: ${refuses}`
    );
  }

  // Bilan global
  const decidedAll = await prisma.inscription.findMany({
    where: { resultatComposition: { in: ['ADMIS', 'REFUSE'] } },
    select: {
      numeroInscription: true,
      numeroTable: true,
      resultatComposition: true,
      concours: { select: { libelle: true } },
      dossierInscription: { select: { statut: true, concoursCentreId: true } },
    },
  });
  const sansTable = decidedAll.filter((i) => !i.numeroTable);
  console.log('\n=== BILAN ADMIS/REFUSE ===');
  console.log(`Total décisions: ${decidedAll.length}`);
  console.log(`Avec N° table: ${decidedAll.length - sansTable.length}`);
  console.log(`Sans N° table: ${sansTable.length}`);
  if (sansTable.length) {
    sansTable.slice(0, 10).forEach((i) => {
      console.log(
        `  ! ${i.numeroInscription} ${i.resultatComposition} ${i.concours.libelle} statut=${i.dossierInscription?.statut} centre=${!!i.dossierInscription?.concoursCentreId}`
      );
    });
  }

  const concoursState = await prisma.concours.findMany({
    where: { id: { in: concoursIds } },
    select: {
      libelle: true,
      code: true,
      dateFinDepot: true,
      etudeDossiersClotureeAt: true,
      dateFinEtudeDossiers: true,
    },
    orderBy: { libelle: 'asc' },
  });
  console.log('\n=== ÉTAT CONCOURS ===');
  for (const c of concoursState) {
    const inscClosed = c.dateFinDepot && c.dateFinDepot < now;
    const etudeClosed = !!c.etudeDossiersClotureeAt;
    console.log(
      `  ${c.libelle} (${c.code}): inscriptions=${inscClosed ? 'CLÔTURÉES' : 'OUVERTES'} | étude=${etudeClosed ? 'CLÔTURÉE' : 'OUVERTE'}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
