/**
 * Crée l'année académique en cours (DEC + DGES) et rattache les concours existants.
 * Usage: node scripts/seed-annees-academiques.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function inferLibelleFromConcours(libelle) {
  const m = String(libelle || '').match(/20\d{2}/);
  if (!m) return null;
  const y = Number(m[0]);
  return `${y}-${y + 1}`;
}

async function main() {
  const nowYear = new Date().getFullYear();
  const currentLibelle = `${nowYear}-${nowYear + 1}`;

  console.log(`Année en cours cible : ${currentLibelle}`);

  await prisma.anneeAcademique.updateMany({
    where: { OR: [{ enCoursDec: true }, { enCoursDges: true }] },
    data: { enCoursDec: false, enCoursDges: false },
  });

  const current = await prisma.anneeAcademique.upsert({
    where: { libelle: currentLibelle },
    create: { libelle: currentLibelle, enCoursDec: true, enCoursDges: true },
    update: { enCoursDec: true, enCoursDges: true },
  });

  const concours = await prisma.concours.findMany({
    select: { id: true, libelle: true, anneeAcademiqueId: true },
  });

  let linked = 0;
  const cache = new Map([[current.libelle, current]]);

  for (const c of concours) {
    if (c.anneeAcademiqueId) continue;
    const inferred = inferLibelleFromConcours(c.libelle) || currentLibelle;
    let annee = cache.get(inferred);
    if (!annee) {
      annee = await prisma.anneeAcademique.upsert({
        where: { libelle: inferred },
        create: { libelle: inferred, enCoursDec: false, enCoursDges: false },
        update: {},
      });
      cache.set(inferred, annee);
    }
    await prisma.concours.update({
      where: { id: c.id },
      data: { anneeAcademiqueId: annee.id },
    });
    linked += 1;
  }

  const totalAnnees = await prisma.anneeAcademique.count();
  console.log(`Années en base        : ${totalAnnees}`);
  console.log(`Concours rattachés    : ${linked}`);
  console.log(`Année en cours DEC/DGES : ${current.libelle} (${current.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
