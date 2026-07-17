/**
 * Crée l'année académique en cours et rattache les concours existants.
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
    where: { enCours: true },
    data: { enCours: false },
  });

  const current = await prisma.anneeAcademique.upsert({
    where: { libelle: currentLibelle },
    create: { libelle: currentLibelle, enCours: true },
    update: { enCours: true },
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
        create: { libelle: inferred, enCours: false },
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
  console.log(`Année en cours        : ${current.libelle} (${current.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
