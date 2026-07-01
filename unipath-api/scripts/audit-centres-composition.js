require('dotenv').config();
const prisma = require('../src/prisma');

async function main() {
  const concoursTotal = await prisma.concours.count();
  const concoursAvecCentresNonNull = await prisma.concours.count({
    where: { centresComposition: { not: null } },
  });

  const concoursAvecCentres = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS n FROM "Concours"
    WHERE "centresComposition" IS NOT NULL
      AND jsonb_typeof("centresComposition") = 'object'
      AND jsonb_array_length(COALESCE("centresComposition"->'centres', '[]'::jsonb)) > 0
  `;

  const dossiersChoixAny = await prisma.dossierInscription.count({
    where: { centreCompositionChoisi: { not: null } },
  });

  const dossiersAvecChoix = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS n FROM "DossierInscription"
    WHERE "centreCompositionChoisi" IS NOT NULL
      AND jsonb_typeof("centreCompositionChoisi") = 'object'
      AND ("centreCompositionChoisi"->>'nom') IS NOT NULL
      AND trim("centreCompositionChoisi"->>'nom') <> ''
  `;

  const sampleCentres = await prisma.concours.findMany({
    where: { centresComposition: { not: null } },
    select: { id: true, libelle: true, centresComposition: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const sampleChoix = await prisma.dossierInscription.findMany({
    where: { centreCompositionChoisi: { not: null } },
    select: {
      id: true,
      statut: true,
      centreCompositionChoisi: true,
      inscription: { select: { concours: { select: { libelle: true } } } },
    },
    take: 20,
  });

  console.log(JSON.stringify({
    concoursTotal,
    concoursCentresJsonNonNull: concoursAvecCentresNonNull,
    concoursCentresAvecTableauNonVide: Number(concoursAvecCentres[0]?.n ?? 0),
    dossiersChoixJsonNonNull: dossiersChoixAny,
    dossiersChoixAvecNom: Number(dossiersAvecChoix[0]?.n ?? 0),
    sampleCentres: sampleCentres.map((c) => ({
      libelle: c.libelle,
      createdAt: c.createdAt,
      centresComposition: c.centresComposition,
    })),
    sampleChoix: sampleChoix.map((d) => ({
      statut: d.statut,
      concours: d.inscription?.concours?.libelle,
      centreCompositionChoisi: d.centreCompositionChoisi,
    })),
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
