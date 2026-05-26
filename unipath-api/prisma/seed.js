// prisma/seed.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Module 2 - Parcours Academique...');

  await prisma.note.deleteMany();
  await prisma.inscriptionAcademique.deleteMany();
  await prisma.diplome.deleteMany();
  await prisma.filiere.deleteMany();
  await prisma.etablissement.deleteMany();

  const candidatsData = [
    {
      email: 'module2.etudiant1@unipath.test',
      nom: 'ADANDE',
      prenom: 'Mireille',
      matricule: 'UAC-M2-2026-0001',
      anip: '100000000001',
    },
    {
      email: 'module2.etudiant2@unipath.test',
      nom: 'HOUNGBO',
      prenom: 'Armel',
      matricule: 'UAC-M2-2026-0002',
      anip: '100000000002',
    },
    {
      email: 'module2.etudiant3@unipath.test',
      nom: 'KIKI',
      prenom: 'Nadia',
      matricule: 'UAC-M2-2026-0003',
      anip: '100000000003',
    },
  ];

  const candidats = [];
  for (const candidat of candidatsData) {
    const existing = await prisma.candidat.findUnique({ where: { email: candidat.email } });
    if (existing) {
      candidats.push(existing);
    } else {
      candidats.push(await prisma.candidat.create({ data: candidat }));
    }
  }

  const [uac, up, esgt] = await Promise.all([
    prisma.etablissement.create({
      data: {
        nom: 'Universite d Abomey-Calavi',
        type: 'PUBLIC',
        ville: 'Abomey-Calavi',
        adresse: 'Abomey-Calavi, Benin',
        email: 'contact@uac.bj',
      },
    }),
    prisma.etablissement.create({
      data: {
        nom: 'Universite de Parakou',
        type: 'PUBLIC',
        ville: 'Parakou',
        adresse: 'Parakou, Benin',
        email: 'contact@up.bj',
      },
    }),
    prisma.etablissement.create({
      data: {
        nom: 'ESGT Benin',
        type: 'PRIVE',
        ville: 'Cotonou',
        adresse: 'Cotonou, Benin',
        email: 'contact@esgt.bj',
      },
    }),
  ]);

  const [genieInfoL, medecineL, droitL, genieInfoM, medecineM] = await Promise.all([
    prisma.filiere.create({
      data: {
        nom: 'Genie Info',
        code: 'GI-L',
        niveau: 'LICENCE',
        dureeAnnees: 3,
        etablissementId: uac.id,
      },
    }),
    prisma.filiere.create({
      data: {
        nom: 'Medecine',
        code: 'MED-L',
        niveau: 'LICENCE',
        dureeAnnees: 6,
        etablissementId: uac.id,
      },
    }),
    prisma.filiere.create({
      data: {
        nom: 'Droit',
        code: 'DR-L',
        niveau: 'LICENCE',
        dureeAnnees: 3,
        etablissementId: up.id,
      },
    }),
    prisma.filiere.create({
      data: {
        nom: 'Genie Info',
        code: 'GI-M',
        niveau: 'MASTER',
        dureeAnnees: 2,
        etablissementId: esgt.id,
      },
    }),
    prisma.filiere.create({
      data: {
        nom: 'Medecine',
        code: 'MED-M',
        niveau: 'MASTER',
        dureeAnnees: 2,
        etablissementId: up.id,
      },
    }),
  ]);

  const inscriptions = await Promise.all([
    prisma.inscriptionAcademique.create({
      data: {
        candidatId: candidats[0].id,
        filiereId: genieInfoL.id,
        etablissementId: uac.id,
        anneeAcademique: '2025-2026',
        niveau: 1,
        statut: 'EN_COURS',
      },
    }),
    prisma.inscriptionAcademique.create({
      data: {
        candidatId: candidats[1].id,
        filiereId: medecineL.id,
        etablissementId: uac.id,
        anneeAcademique: '2024-2025',
        niveau: 2,
        statut: 'VALIDE',
      },
    }),
    prisma.inscriptionAcademique.create({
      data: {
        candidatId: candidats[2].id,
        filiereId: droitL.id,
        etablissementId: up.id,
        anneeAcademique: '2025-2026',
        niveau: 1,
        statut: 'REDOUBLANT',
      },
    }),
  ]);

  const notesData = [
    ['Algorithmique', 14, 16, 4, 1, inscriptions[0].id],
    ['Base de donnees', 13, 15, 5, 1, inscriptions[0].id],
    ['Reseaux', 12, 14, 4, 2, inscriptions[0].id],
    ['Programmation Web', 15, 17, 5, 2, inscriptions[0].id],
    ['Anatomie', 11, 13, 6, 1, inscriptions[1].id],
    ['Physiologie', 12, 14, 6, 1, inscriptions[1].id],
    ['Pharmacologie', 13, 12, 5, 2, inscriptions[1].id],
    ['Droit Civil', 9, 11, 5, 1, inscriptions[2].id],
    ['Droit Constitutionnel', 8, 10, 5, 1, inscriptions[2].id],
    ['Procedure Penale', 10, 9, 4, 2, inscriptions[2].id],
  ];

  await prisma.note.createMany({
    data: notesData.map(([matiere, noteCC, noteExamen, credits, semestre, inscriptionAcadId]) => ({
      matiere,
      noteCC,
      noteExamen,
      noteMoyenne: Number((noteCC * 0.4 + noteExamen * 0.6).toFixed(2)),
      credits,
      semestre,
      inscriptionAcadId,
    })),
  });

  console.log('Seed Module 2 termine avec succes.');
  console.log('Etablissements: 3 | Filieres: 5 | Inscriptions: 3 | Notes: 10');
}

main()
  .catch((error) => {
    console.error('Erreur seed Module 2:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });