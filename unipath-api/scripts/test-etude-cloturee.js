/**
 * Tests clôture d'étude des dossiers (DGES).
 *
 * Usage: node scripts/test-etude-cloturee.js
 */
require('dotenv').config();
const prisma = require('../src/prisma');
const {
  assertEtudeOuvertePourDossier,
  ETUDE_CLOTUREE_MESSAGE,
} = require('../src/utils/etude-cloture.helper');

function check(label, ok, detail = '') {
  console.log(`${ok ? 'OK' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

async function main() {
  let all = true;
  let restored = false;

  const dossier = await prisma.dossierInscription.findFirst({
    include: {
      inscription: {
        include: {
          concours: {
            select: {
              id: true,
              libelle: true,
              etudeCloturee: true,
              etudeClotureeAt: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!dossier?.inscription?.concours) {
    console.log('FAIL aucun dossier/concours trouvé pour le test');
    process.exit(1);
  }

  const concoursId = dossier.inscription.concours.id;
  const previous = {
    etudeCloturee: dossier.inscription.concours.etudeCloturee,
    etudeClotureeAt: dossier.inscription.concours.etudeClotureeAt,
  };

  console.log(`\nConcours test : ${dossier.inscription.concours.libelle} (${concoursId})`);
  console.log(`Dossier : ${dossier.id}`);

  // État ouvert garanti pour le scénario 4
  await prisma.concours.update({
    where: { id: concoursId },
    data: { etudeCloturee: false, etudeClotureeAt: null },
  });

  console.log('\n=== 4. Concours NON clôturé (baseline) ===');
  let openCheck = await assertEtudeOuvertePourDossier(dossier.id);
  all = check('étude ouverte → ok', openCheck.ok === true) && all;

  console.log('\n=== 1+2. Clôture DGES → mutations bloquées ===');
  await prisma.concours.update({
    where: { id: concoursId },
    data: { etudeCloturee: true, etudeClotureeAt: new Date() },
  });

  const closed = await prisma.concours.findUnique({
    where: { id: concoursId },
    select: { etudeCloturee: true, etudeClotureeAt: true },
  });
  all = check('etudeCloturee = true', closed.etudeCloturee === true) && all;
  all = check('etudeClotureeAt renseigné', Boolean(closed.etudeClotureeAt)) && all;

  const blocked = await assertEtudeOuvertePourDossier(dossier.id);
  all = check(
    'examinateur/contrôleur mutation → 403',
    blocked.ok === false && blocked.status === 403,
    `status=${blocked.status}`,
  ) && all;
  all = check(
    'message clair',
    blocked.error === ETUDE_CLOTUREE_MESSAGE,
    blocked.error,
  ) && all;

  // Lecture : le dossier reste lisible (pas de blocage GET via ce helper)
  const stillReadable = await prisma.dossierInscription.findUnique({
    where: { id: dossier.id },
    select: { id: true },
  });
  all = check('lecture dossier toujours possible', Boolean(stillReadable)) && all;

  console.log('\n=== 3. Réouverture DGES → actions possibles ===');
  await prisma.concours.update({
    where: { id: concoursId },
    data: { etudeCloturee: false, etudeClotureeAt: null },
  });
  restored = true;

  openCheck = await assertEtudeOuvertePourDossier(dossier.id);
  all = check('après réouverture → ok', openCheck.ok === true) && all;

  // Restaurer l'état initial (si le concours était déjà clôturé avant le test)
  if (previous.etudeCloturee) {
    await prisma.concours.update({
      where: { id: concoursId },
      data: {
        etudeCloturee: previous.etudeCloturee,
        etudeClotureeAt: previous.etudeClotureeAt,
      },
    });
    console.log('État initial du concours restauré (était déjà clôturé)');
  }

  console.log(`\n=== VERDICT: ${all ? 'TOUS LES TESTS OK' : 'ÉCHECS'} ===`);
  process.exit(all ? 0 : 1);
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
