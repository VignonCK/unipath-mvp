require('dotenv').config();
const prisma = require('../src/prisma');

async function main() {
  const concours = await prisma.concours.findMany({
    select: {
      id: true,
      libelle: true,
      sigle: true,
      etablissement: true,
      centresComposition: true,
      _count: { select: { centresActifs: true } },
    },
    orderBy: { libelle: 'asc' },
  });

  const sans = concours.filter(
    (c) => c._count.centresActifs === 0
      && !(Array.isArray(c.centresComposition?.centres) && c.centresComposition.centres.length),
  );

  console.log('TOTAL', concours.length);
  console.log('SANS_CENTRE', sans.length);
  sans.forEach((c) => console.log('-', c.libelle, '| sigle:', c.sigle, '| id:', c.id));

  const avec = concours.filter((c) => c._count.centresActifs > 0);
  console.log('\nAVEC_CENTRE', avec.length);
  avec.forEach((c) => console.log('+', c._count.centresActifs, c.libelle));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
