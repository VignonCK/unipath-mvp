/**
 * Seed du référentiel des 77 communes + rattachement des centres
 * + attribution des codes concours manquants.
 *
 * Usage: node scripts/seed-communes-benin.js
 */
const { PrismaClient } = require('@prisma/client');
const { COMMUNES_BENIN, resolveCommuneCode } = require('../src/constants/communes-benin.constants');
const { allocuerCodeConcours } = require('../src/utils/numero-table.helper');

const prisma = new PrismaClient();

async function seedCommunes() {
  let upserted = 0;
  for (const c of COMMUNES_BENIN) {
    await prisma.commune.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        nom: c.nom,
        departement: c.departement,
        aliases: c.aliases || [],
      },
      update: {
        nom: c.nom,
        departement: c.departement,
        aliases: c.aliases || [],
      },
    });
    upserted += 1;
  }
  return upserted;
}

async function linkCentres() {
  const centres = await prisma.centreComposition.findMany();
  let linked = 0;
  let unresolved = [];

  for (const centre of centres) {
    const code = resolveCommuneCode(centre.ville);
    if (!code) {
      unresolved.push({ id: centre.id, nom: centre.nom, ville: centre.ville });
      continue;
    }
    if (centre.communeCode !== code) {
      await prisma.centreComposition.update({
        where: { id: centre.id },
        data: { communeCode: code },
      });
      linked += 1;
    }
  }
  return { linked, unresolved, total: centres.length };
}

async function assignConcoursCodes() {
  const sansCode = await prisma.concours.findMany({
    where: { OR: [{ code: null }, { code: '' }] },
    orderBy: { createdAt: 'asc' },
    select: { id: true, libelle: true },
  });

  let assigned = 0;
  for (const c of sansCode) {
    const code = await allocuerCodeConcours(prisma);
    await prisma.concours.update({
      where: { id: c.id },
      data: { code },
    });
    assigned += 1;
    console.log(`  Code ${code} → ${c.libelle}`);
  }
  return assigned;
}

async function main() {
  console.log('Seed communes Bénin (01–77)...');
  const n = await seedCommunes();
  console.log(`  ${n} communes upsertées`);

  console.log('Rattachement des centres de composition...');
  const link = await linkCentres();
  console.log(`  ${link.linked} centres mis à jour / ${link.total}`);
  if (link.unresolved.length) {
    console.warn('  Villes non résolues:');
    for (const u of link.unresolved) {
      console.warn(`   - ${u.ville} (${u.nom})`);
    }
  }

  console.log('Attribution des codes concours manquants...');
  const assigned = await assignConcoursCodes();
  console.log(`  ${assigned} concours codés`);

  console.log('Terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
