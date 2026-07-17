const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const candidat = await prisma.candidat.findUnique({
    where: { email: 'bkoussedoh@gmail.com' },
    select: { id: true, nom: true, prenom: true, matricule: true },
  });
  console.log('candidat:', candidat);
  if (!candidat) return;

  const inscriptions = await prisma.inscription.findMany({
    where: { candidatId: candidat.id },
    include: {
      concours: { select: { id: true, libelle: true, etablissement: true } },
      dossierInscription: {
        include: {
          centreChoisi: { include: { centre: true } },
        },
      },
    },
  });

  for (const i of inscriptions) {
    const d = i.dossierInscription;
    console.log('---');
    console.log('inscription:', i.id, i.numeroInscription);
    console.log('concours:', i.concours.libelle, '| etablissement:', i.concours.etablissement);
    console.log('statut:', d?.statut);
    console.log('concoursCentreId:', d?.concoursCentreId);
    console.log('centreChoisi relation:', d?.centreChoisi ? {
      id: d.centreChoisi.id,
      centre: d.centreChoisi.centre,
    } : null);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
