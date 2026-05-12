// prisma/seed_m2.js
// Seed de demonstration pour le Module 2 : etablissements, filieres, parcours academiques.

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const EPAC_ID = '11111111-1111-1111-1111-111111111111';
const ESATIC_ID = '22222222-2222-2222-2222-222222222222';

async function upsertCandidat(data) {
  return prisma.candidat.upsert({
    where: { email: data.email },
    update: {
      nom: data.nom,
      prenom: data.prenom,
      telephone: data.telephone,
      dateNaiss: data.dateNaiss,
      lieuNaiss: data.lieuNaiss,
    },
    create: data,
  });
}

async function createInscriptionAvecResultat({
  candidatId,
  etablissementId,
  filiereId,
  niveau,
  anneeAcademique,
  moyenne,
  mention,
  valide,
}) {
  const inscription = await prisma.inscriptionAcademique.create({
    data: {
      candidatId,
      etablissementId,
      filiereId,
      niveau,
      anneeAcademique,
    },
  });

  if (moyenne !== undefined && mention && valide !== undefined) {
    await prisma.resultat.create({
      data: {
        inscriptionAcademiqueId: inscription.id,
        moyenne,
        mention,
        valide,
      },
    });
  }

  return inscription;
}

async function main() {
  console.log('Seed Module 2 en cours...');

  await prisma.resultat.deleteMany();
  await prisma.inscriptionAcademique.deleteMany();
  await prisma.diplomeLicence.deleteMany();
  await prisma.filiere.deleteMany();
  await prisma.etablissement.deleteMany();

  console.log('Anciennes donnees Module 2 supprimees');

  const epac = await prisma.etablissement.create({
    data: {
      id: EPAC_ID,
      nom: 'Ecole Polytechnique d Abomey-Calavi',
      type: 'PUBLIC',
      ville: 'Abomey-Calavi',
      code: 'EPAC',
    },
  });

  const esatic = await prisma.etablissement.create({
    data: {
      id: ESATIC_ID,
      nom: 'Ecole Superieure Africaine des TIC',
      type: 'PRIVE',
      ville: 'Cotonou',
      code: 'ESATIC',
    },
  });

  const genieInformatique = await prisma.filiere.create({
    data: {
      nom: 'Genie Informatique',
      etablissementId: epac.id,
      dureeAnnees: 5,
    },
  });

  const genieCivil = await prisma.filiere.create({
    data: {
      nom: 'Genie Civil',
      etablissementId: epac.id,
      dureeAnnees: 5,
    },
  });

  const developpementLogiciel = await prisma.filiere.create({
    data: {
      nom: 'Developpement Logiciel',
      etablissementId: esatic.id,
      dureeAnnees: 3,
    },
  });

  console.log('Etablissements et filieres crees');

  const candidats = await Promise.all([
    upsertCandidat({
      email: 'kofi.mensah@test.bj',
      nom: 'MENSAH',
      prenom: 'Kofi',
      telephone: '+22961000001',
      dateNaiss: new Date('2008-03-15'),
      lieuNaiss: 'Cotonou',
      matricule: 'M2-TEMP-001',
    }),
    upsertCandidat({
      email: 'ama.kone@test.bj',
      nom: 'KONE',
      prenom: 'Ama',
      telephone: '+22961000002',
      dateNaiss: new Date('2007-07-22'),
      lieuNaiss: 'Porto-Novo',
      matricule: 'M2-TEMP-002',
    }),
    upsertCandidat({
      email: 'seun.adeyemi@test.bj',
      nom: 'ADEYEMI',
      prenom: 'Seun',
      telephone: '+22961000003',
      dateNaiss: new Date('2008-11-08'),
      lieuNaiss: 'Parakou',
      matricule: 'M2-TEMP-003',
    }),
    upsertCandidat({
      email: 'fatou.diallo@test.bj',
      nom: 'DIALLO',
      prenom: 'Fatou',
      telephone: '+22961000004',
      dateNaiss: new Date('2008-06-10'),
      lieuNaiss: 'Abomey-Calavi',
      matricule: 'M2-TEMP-004',
    }),
    upsertCandidat({
      email: 'joel.ahouansou@test.bj',
      nom: 'AHOUANSOU',
      prenom: 'Joel',
      telephone: '+22961000005',
      dateNaiss: new Date('2004-12-03'),
      lieuNaiss: 'Natitingou',
      matricule: 'M2-TEMP-005',
    }),
  ]);

  const [kofi, ama, seun, fatou, joel] = candidats;

  console.log('Candidats de demonstration prets');

  await createInscriptionAvecResultat({
    candidatId: kofi.id,
    etablissementId: epac.id,
    filiereId: genieInformatique.id,
    niveau: 'L1',
    anneeAcademique: '2023-2024',
    moyenne: 13.5,
    mention: 'ASSEZ_BIEN',
    valide: true,
  });

  await createInscriptionAvecResultat({
    candidatId: kofi.id,
    etablissementId: epac.id,
    filiereId: genieInformatique.id,
    niveau: 'L2',
    anneeAcademique: '2024-2025',
  });

  await createInscriptionAvecResultat({
    candidatId: ama.id,
    etablissementId: epac.id,
    filiereId: genieCivil.id,
    niveau: 'L1',
    anneeAcademique: '2022-2023',
    moyenne: 14.25,
    mention: 'BIEN',
    valide: true,
  });

  await createInscriptionAvecResultat({
    candidatId: ama.id,
    etablissementId: epac.id,
    filiereId: genieCivil.id,
    niveau: 'L2',
    anneeAcademique: '2023-2024',
    moyenne: 12.75,
    mention: 'ASSEZ_BIEN',
    valide: true,
  });

  await createInscriptionAvecResultat({
    candidatId: ama.id,
    etablissementId: epac.id,
    filiereId: genieCivil.id,
    niveau: 'L3',
    anneeAcademique: '2024-2025',
  });

  await createInscriptionAvecResultat({
    candidatId: seun.id,
    etablissementId: esatic.id,
    filiereId: developpementLogiciel.id,
    niveau: 'L1',
    anneeAcademique: '2024-2025',
    moyenne: 9.5,
    mention: 'PASSABLE',
    valide: false,
  });

  await createInscriptionAvecResultat({
    candidatId: fatou.id,
    etablissementId: epac.id,
    filiereId: genieInformatique.id,
    niveau: 'L1',
    anneeAcademique: '2024-2025',
    moyenne: 15.25,
    mention: 'BIEN',
    valide: true,
  });

  await createInscriptionAvecResultat({
    candidatId: joel.id,
    etablissementId: epac.id,
    filiereId: genieInformatique.id,
    niveau: 'L1',
    anneeAcademique: '2020-2021',
    moyenne: 13.75,
    mention: 'ASSEZ_BIEN',
    valide: true,
  });

  await createInscriptionAvecResultat({
    candidatId: joel.id,
    etablissementId: epac.id,
    filiereId: genieInformatique.id,
    niveau: 'L2',
    anneeAcademique: '2021-2022',
    moyenne: 14.5,
    mention: 'BIEN',
    valide: true,
  });

  await createInscriptionAvecResultat({
    candidatId: joel.id,
    etablissementId: epac.id,
    filiereId: genieInformatique.id,
    niveau: 'L3',
    anneeAcademique: '2022-2023',
    moyenne: 16.2,
    mention: 'TRES_BIEN',
    valide: true,
  });

  await prisma.diplomeLicence.create({
    data: {
      candidatId: joel.id,
      filiereId: genieInformatique.id,
      mention: 'TRES_BIEN',
      annee: '2022-2023',
      verifie: true,
    },
  });

  await createInscriptionAvecResultat({
    candidatId: joel.id,
    etablissementId: epac.id,
    filiereId: genieInformatique.id,
    niveau: 'M1',
    anneeAcademique: '2023-2024',
  });

  console.log('Parcours academiques crees');
  console.log('Seed Module 2 termine avec succes');
}

main()
  .catch((error) => {
    console.error('Erreur lors du seed Module 2 :', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
