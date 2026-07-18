/**
 * Migration — verrouille les concours ouverts sans staff commission complet.
 *
 * Critère : etudeCloturee=false ET (0 EXAMINATEUR OU 0 CONTROLEUR assignés).
 * Action : etudeCloturee=true, etudeClotureeAt=now()
 *
 * Usage :
 *   node scripts/migrate-lock-concours-sans-staff.js --dry-run
 *   node scripts/migrate-lock-concours-sans-staff.js
 */
require('dotenv').config();
const prisma = require('../src/prisma');
const { getCommissionStaffStatus } = require('../src/utils/commission-etude.helper');

const dryRun = process.argv.includes('--dry-run');

async function main() {
  console.log('=== Migration verrouillage concours sans staff ===');
  console.log(dryRun ? 'Mode: DRY-RUN (aucune écriture)' : 'Mode: ÉCRITURE');

  const ouverts = await prisma.concours.findMany({
    where: { etudeCloturee: false },
    select: {
      id: true,
      libelle: true,
      etudeCloturee: true,
      etudeClotureeAt: true,
      createdAt: true,
    },
    orderBy: { libelle: 'asc' },
  });

  console.log(`\nConcours actuellement ouverts (etudeCloturee=false) : ${ouverts.length}\n`);

  const aVerrouiller = [];
  const dejaComplets = [];

  for (const c of ouverts) {
    const staff = await getCommissionStaffStatus(prisma, c.id);
    const row = {
      ...c,
      nbExaminateurs: staff.nbExaminateurs,
      nbControleurs: staff.nbControleurs,
      manquants: staff.manquants,
    };
    if (staff.peutOuvrirEtude) {
      dejaComplets.push(row);
    } else {
      aVerrouiller.push(row);
    }
  }

  console.log(`— Staff complet (laissés ouverts) : ${dejaComplets.length}`);
  for (const c of dejaComplets) {
    console.log(`  OK  ${c.libelle}  exam=${c.nbExaminateurs} ctrl=${c.nbControleurs}`);
  }

  console.log(`\n— À verrouiller (staff incomplet) : ${aVerrouiller.length}`);
  for (const c of aVerrouiller) {
    console.log(
      `  LOCK ${c.libelle}  exam=${c.nbExaminateurs} ctrl=${c.nbControleurs} manquants=[${c.manquants.join(',')}]`,
    );
  }

  if (dryRun) {
    console.log('\nDRY-RUN terminé — aucune modification.');
    return;
  }

  if (aVerrouiller.length === 0) {
    console.log('\nRien à modifier.');
    return;
  }

  const ids = aVerrouiller.map((c) => c.id);
  const result = await prisma.concours.updateMany({
    where: { id: { in: ids } },
    data: {
      etudeCloturee: true,
      etudeClotureeAt: new Date(),
    },
  });

  console.log('\n=== Résultat ===');
  console.log(`Concours verrouillés : ${result.count}`);
}

main()
  .catch((err) => {
    console.error('❌ Migration échouée:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
