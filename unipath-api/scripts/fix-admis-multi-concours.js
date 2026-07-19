/**
 * 1) Assigne un centre aux dossiers sans centre (si le concours en a).
 * 2) Répartit ADMIS / REFUSE sur les dossiers VALIDE encore EN_ATTENTE,
 *    pour chaque concours (pas seulement INEPS).
 */
const prisma = require('../src/prisma');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fixCentres() {
  const sansCentre = await prisma.dossierInscription.findMany({
    where: { concoursCentreId: null },
    include: {
      inscription: {
        select: {
          id: true,
          numeroInscription: true,
          concoursId: true,
          concours: { select: { libelle: true } },
        },
      },
    },
  });

  let fixed = 0;
  for (const d of sansCentre) {
    const centres = await prisma.concoursCentreComposition.findMany({
      where: { concoursId: d.inscription.concoursId, estActif: true },
      select: { id: true },
    });
    if (!centres.length) {
      console.log(
        `  skip centre ${d.inscription.numeroInscription} (${d.inscription.concours.libelle}) — aucun centre actif`
      );
      continue;
    }
    const centreId = centres[Math.floor(Math.random() * centres.length)].id;
    await prisma.dossierInscription.update({
      where: { id: d.id },
      data: { concoursCentreId: centreId },
    });
    fixed += 1;
    console.log(
      `  centre OK ${d.inscription.numeroInscription} → ${d.inscription.concours.libelle}`
    );
  }
  return { sansCentre: sansCentre.length, fixed };
}

async function setAdmisMultiConcours() {
  const dec = await prisma.administrateurDEC.findFirst({ select: { id: true } });
  const decId = dec?.id || null;
  const now = new Date();

  const validesAttente = await prisma.inscription.findMany({
    where: {
      resultatComposition: 'EN_ATTENTE',
      dossierInscription: { statut: 'VALIDE' },
    },
    select: {
      id: true,
      concoursId: true,
      numeroInscription: true,
      concours: { select: { libelle: true, code: true } },
    },
  });

  const byConcours = new Map();
  for (const insc of validesAttente) {
    if (!byConcours.has(insc.concoursId)) byConcours.set(insc.concoursId, []);
    byConcours.get(insc.concoursId).push(insc);
  }

  const summary = [];

  for (const [concoursId, list] of byConcours.entries()) {
    const shuffled = shuffle(list);
    // Au moins 1 ADMIS si possible ; ~2/3 ADMIS, 1/3 REFUSE
    const nAdmis = Math.max(1, Math.ceil(shuffled.length * 0.65));
    const admis = shuffled.slice(0, nAdmis);
    const refuses = shuffled.slice(nAdmis);

    for (const insc of admis) {
      await prisma.inscription.update({
        where: { id: insc.id },
        data: {
          resultatComposition: 'ADMIS',
          resultatCompositionAt: now,
          resultatCompositionPar: decId,
        },
      });
    }
    for (const insc of refuses) {
      await prisma.inscription.update({
        where: { id: insc.id },
        data: {
          resultatComposition: 'REFUSE',
          resultatCompositionAt: now,
          resultatCompositionPar: decId,
        },
      });
    }

    summary.push({
      concours: shuffled[0].concours.libelle,
      code: shuffled[0].concours.code,
      admis: admis.length,
      refuses: refuses.length,
    });
    console.log(
      `  ${shuffled[0].concours.libelle}: +${admis.length} ADMIS, +${refuses.length} REFUSE`
    );
  }

  return summary;
}

async function printBilan() {
  const withCentre = await prisma.dossierInscription.count({
    where: { concoursCentreId: { not: null } },
  });
  const total = await prisma.dossierInscription.count();
  const byRes = await prisma.inscription.groupBy({
    by: ['resultatComposition'],
    _count: true,
  });

  const admis = await prisma.inscription.findMany({
    where: { resultatComposition: 'ADMIS' },
    select: { concours: { select: { libelle: true, code: true } } },
  });
  const byC = {};
  for (const a of admis) {
    const k = `${a.concours.libelle} (${a.concours.code || '?'})`;
    byC[k] = (byC[k] || 0) + 1;
  }

  console.log('\n=== BILAN ===');
  console.log(JSON.stringify({ dossiers: total, avecCentre: withCentre, sansCentre: total - withCentre }));
  console.log('resultats', JSON.stringify(byRes));
  console.log('admisByConcours', JSON.stringify(byC, null, 2));
}

async function main() {
  console.log('1) Centres manquants…');
  const centres = await fixCentres();
  console.log(`   corrigés ${centres.fixed}/${centres.sansCentre}`);

  console.log('\n2) ADMIS / REFUSE multi-concours…');
  await setAdmisMultiConcours();

  await printBilan();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
