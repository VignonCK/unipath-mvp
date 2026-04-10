// prisma/seed.js
// Ce fichier crée des données de test dans la base de données
// Pour l'exécuter : npx prisma db seed

// Importe le client Prisma pour interagir avec la base de données
const { PrismaClient } = require('@prisma/client');
// Instancie un nouvel objet PrismaClient
const prisma = new PrismaClient();

// Fonction principale asynchrone qui exécute le seed
async function main() {
  // Affiche un message de début dans la console
  console.log('Début de l insertion des données de test...');

  // ── Supprimer les données existantes (ordre important !)
  // On supprime dans l'ordre inverse des dépendances pour éviter les erreurs de clé étrangère
  await prisma.dossier.deleteMany();
  await prisma.inscription.deleteMany();
  await prisma.concours.deleteMany();
  await prisma.candidat.deleteMany();
  // Affiche un message une fois la suppression terminée
  console.log('Données existantes supprimées');

  // ── Créer 3 concours de test
  // Création d'un concours pour Génie Informatique
  const concours1 = await prisma.concours.create({
    data: {
      libelle: 'Concours EPAC 2026 Génie Informatique',
      dateDebut: new Date('2026-09-01'),
      dateFin: new Date('2026-09-03'),
      description: 'Concours d\'entrée au département GIT',
    },
  });
  // Création d'un concours pour Génie Civil
  const concours2 = await prisma.concours.create({
    data: {
      libelle: 'Concours EPAC 2026 - Génie Civil',
      dateDebut: new Date('2026-09-05'),
      dateFin: new Date('2026-09-07'),
      description: 'Concours d\'entrée au département GC',
    },
  });
  // Création d'un concours pour Médecine, avec dates qui chevauchent le premier concours (pour tester les conflits)
  const concours3 = await prisma.concours.create({
    data: {
      libelle: 'Concours UAC 2026 - Médecine',
      // Dates qui chevauchent concours1 - pour tester le trigger anti-conflit
      dateDebut: new Date('2026-09-02'),
      dateFin: new Date('2026-09-04'),
      description: 'Concours médecine - dates en conflit avec GIT pour test',
    },
  });
  // Affiche un message une fois les concours créés
  console.log('3 concours créés');

  // ── Créer 5 candidats de test
  // Note : le trigger trg_matricule attribue automatiquement le matricule
  // Création du premier candidat
  const candidat1 = await prisma.candidat.create({
    data: {
      email: 'kofi.mensah@test.bj',
      nom: 'MENSAH',
      prenom: 'Kofi',
      telephone: '+22961000001',
      dateNaiss: new Date('2008-03-15'),
      lieuNaiss: 'Cotonou',
      matricule: 'TEMP', // Valeur temporaire, le trigger la remplacera par le vrai matricule au moment
    },
  });
  // Création du deuxième candidat
  const candidat2 = await prisma.candidat.create({
    data: {
      email: 'ama.kone@test.bj',
      nom: 'KONE',
      prenom: 'Ama',
      telephone: '+22961000002',
      dateNaiss: new Date('2007-07-22'),
      lieuNaiss: 'Porto-Novo',
      matricule: 'TEMP', // Valeur temporaire, le trigger la remplacera par le vrai matricule au moment
    },
  });
  // Création du troisième candidat
  const candidat3 = await prisma.candidat.create({
    data: {
      email: 'seun.adeyemi@test.bj',
      nom: 'ADEYEMI',
      prenom: 'Seun',
      telephone: '+22961000003',
      dateNaiss: new Date('2008-11-08'),
      lieuNaiss: 'Parakou',
      matricule: 'TEMP', // Valeur temporaire, le trigger la remplacera par le vrai matricule au moment
    },
  });
  // Création du quatrième candidat
  const candidat4 = await prisma.candidat.create({
  data: {
    email: 'fatou.diallo@test.bj',
    nom: 'DIALLO',
    prenom: 'Fatou',
    telephone: '+22961000004',
    dateNaiss: new Date('2008-06-10'),
    lieuNaiss: 'Abomey-Calavi',
    matricule: 'TEMP', // Valeur temporaire, le trigger la remplacera par le vrai matricule au moment
  },
});
// Création du cinquième candidat
    const candidat5 = await prisma.candidat.create({
    data: {
        email: 'joel.ahouansou@test.bj',
        nom: 'AHOUANSOU',
        prenom: 'Joël',
        telephone: '+22961000005',
        dateNaiss: new Date('2004-12-03'),
        lieuNaiss: 'Natitingou',
        matricule: 'TEMP', // Valeur temporaire, le trigger la remplacera par le vrai matricule au moment
    },
    });

  // Affiche un message une fois les candidats créés
  console.log('5 candidats créés');

  // ── Créer des inscriptions de test
  // Inscription du candidat1 au concours1, statut EN_ATTENTE
  await prisma.inscription.create({
    data: {
      candidatId: candidat1.id,
      concoursId: concours1.id,
      statut: 'EN_ATTENTE',
    },
  });
  // Inscription du candidat2 au concours1, statut VALIDE
  await prisma.inscription.create({
    data: {
      candidatId: candidat2.id,
      concoursId: concours1.id,
      statut: 'VALIDE',
    },
  });
  // Inscription du candidat3 au concours2, statut REJETE
  await prisma.inscription.create({
    data: {
      candidatId: candidat3.id,
      concoursId: concours2.id,
      statut: 'REJETE',
    },
  });
  // Inscription du candidat4 au concours2, statut EN_ATTENTE
  await prisma.inscription.create({
  data: {
    candidatId: candidat4.id,
    concoursId: concours2.id,
    statut: 'EN_ATTENTE',
  },
});
 // Inscription du candidat5 au concours1, statut VALIDE (pour tester le trigger de création de dossier)
await prisma.inscription.create({
  data: {
    candidatId: candidat5.id,
    concoursId: concours1.id,
    statut: 'VALIDE',
  },
});

  // Affiche un message une fois les inscriptions créées
  console.log('Inscriptions créées');
  // Affiche un message de fin
  console.log('Seed terminé avec succès !');
}

// Exécute la fonction main et gère les erreurs
main()
  .catch((e) => {
    // Affiche l’erreur en cas d’échec
    console.error('Erreur lors du seed :', e);
    // Termine le processus avec un code d’erreur
    process.exit(1);
  })
  .finally(async () => {
    // Déconnecte Prisma proprement, que ce soit en cas de succès ou d’échec
    await prisma.$disconnect();
  });