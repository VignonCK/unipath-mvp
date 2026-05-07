// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Début de l insertion des données de test...');

  await prisma.dossier.deleteMany();
  await prisma.inscription.deleteMany();
  await prisma.concours.deleteMany();
  await prisma.candidat.deleteMany();
  console.log('Données existantes supprimées');

  // ── Créer 3 concours de test
  const concours1 = await prisma.concours.create({
    data: {
      libelle: 'Concours EPAC 2026 Génie Informatique',
      dateDebut: new Date('2026-09-01'),
      dateFin: new Date('2026-09-03'),
      description: 'Concours d\'entrée au département GIT',
    },
  });
  const concours2 = await prisma.concours.create({
    data: {
      libelle: 'Concours EPAC 2026 - Génie Civil',
      dateDebut: new Date('2026-09-05'),
      dateFin: new Date('2026-09-07'),
      description: 'Concours d\'entrée au département GC',
    },
  });
  const concours3 = await prisma.concours.create({
    data: {
      libelle: 'Concours UAC 2026 - Médecine',
      dateDebut: new Date('2026-09-02'),
      dateFin: new Date('2026-09-04'),
      description: 'Concours médecine - dates en conflit avec GIT pour test',
    },
  });
  console.log('3 concours créés');

  // ── Créer 5 candidats
  // Chaque matricule temporaire est unique grâce au timestamp + index
  // Le trigger PostgreSQL trg_matricule remplacera ces valeurs automatiquement
  const now = Date.now();

  const candidat1 = await prisma.candidat.create({
    data: {
      email: 'kofi.mensah@test.bj',
      nom: 'MENSAH',
      prenom: 'Kofi',
      telephone: '+22961000001',
      dateNaiss: new Date('2008-03-15'),
      lieuNaiss: 'Cotonou',
      matricule: `TEMP-${now}-1`,
    },
  });
  const candidat2 = await prisma.candidat.create({
    data: {
      email: 'ama.kone@test.bj',
      nom: 'KONE',
      prenom: 'Ama',
      telephone: '+22961000002',
      dateNaiss: new Date('2007-07-22'),
      lieuNaiss: 'Porto-Novo',
      matricule: `TEMP-${now}-2`,
    },
  });
  const candidat3 = await prisma.candidat.create({
    data: {
      email: 'seun.adeyemi@test.bj',
      nom: 'ADEYEMI',
      prenom: 'Seun',
      telephone: '+22961000003',
      dateNaiss: new Date('2008-11-08'),
      lieuNaiss: 'Parakou',
      matricule: `TEMP-${now}-3`,
    },
  });
  const candidat4 = await prisma.candidat.create({
    data: {
      email: 'fatou.diallo@test.bj',
      nom: 'DIALLO',
      prenom: 'Fatou',
      telephone: '+22961000004',
      dateNaiss: new Date('2008-06-10'),
      lieuNaiss: 'Abomey-Calavi',
      matricule: `TEMP-${now}-4`,
    },
  });
  const candidat5 = await prisma.candidat.create({
    data: {
      email: 'joel.ahouansou@test.bj',
      nom: 'AHOUANSOU',
      prenom: 'Joël',
      telephone: '+22961000005',
      dateNaiss: new Date('2004-12-03'),
      lieuNaiss: 'Natitingou',
      matricule: `TEMP-${now}-5`,
    },
  });
  console.log('5 candidats créés');

  // ── Créer des inscriptions de test
  await prisma.inscription.create({
    data: { candidatId: candidat1.id, concoursId: concours1.id, statut: 'EN_ATTENTE' },
  });
  await prisma.inscription.create({
    data: { candidatId: candidat2.id, concoursId: concours1.id, statut: 'VALIDE' },
  });
  await prisma.inscription.create({
    data: { candidatId: candidat3.id, concoursId: concours2.id, statut: 'REJETE' },
  });
  await prisma.inscription.create({
    data: { candidatId: candidat4.id, concoursId: concours2.id, statut: 'EN_ATTENTE' },
  });
  await prisma.inscription.create({
    data: { candidatId: candidat5.id, concoursId: concours1.id, statut: 'VALIDE' },
  });
  console.log('Inscriptions créées');
  console.log('Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });