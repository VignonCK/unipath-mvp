const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const filieresPrivees = await p.filiere.count({
    where: { etablissement: { type: 'PRIVE' } },
  });
  const filieresTotal = await p.filiere.count();
  const refs = await p.filiereReference.count();
  const refsActives = await p.filiereReference.count({ where: { actif: true } });
  const etabs = await p.etablissement.count({ where: { type: 'PRIVE' } });

  const filieres = await p.filiere.findMany({
    where: { etablissement: { type: 'PRIVE' } },
    select: { nom: true, code: true },
  });
  const byNom = new Map();
  for (const f of filieres) {
    byNom.set(f.nom, (byNom.get(f.nom) || 0) + 1);
  }
  const dupes = [...byNom.entries()]
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([nom, n]) => ({ nom, n }));

  console.log(
    JSON.stringify(
      {
        filieresPrivees,
        filieresTotal,
        refs,
        refsActives,
        etabsPrives: etabs,
        moyenneParEtab: Math.round((filieresPrivees / Math.max(etabs, 1)) * 10) / 10,
        nomsDistincts: byNom.size,
        exemplesNomsDupliques: dupes,
      },
      null,
      2
    )
  );
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
