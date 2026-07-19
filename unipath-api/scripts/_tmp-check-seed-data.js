const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const nCandidats = await p.candidat.count();
  const candidats = await p.candidat.findMany({
    take: 15,
    select: { email: true, nom: true, prenom: true, role: true, emailConfirme: true },
    orderBy: { createdAt: 'desc' },
  });
  const nConcours = await p.concours.count();
  const concours = await p.concours.findMany({
    take: 12,
    select: {
      titre: true,
      statut: true,
      anneeAcademique: true,
      dateCloture: true,
      _count: { select: { inscriptions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const nInsc = await p.inscription.count();
  const statutsInsc = await p.inscription.groupBy({ by: ['statut'], _count: true });
  console.log(JSON.stringify({ nCandidats, nConcours, nInsc, statutsInsc, candidats, concours }, null, 2));
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
