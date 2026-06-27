const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding établissements privés...');

  const etablissementsPrives = [
    // ============================================================
    // 1. ESATIC — École Supérieure Africaine des TIC
    // ============================================================
    {
      nom: 'École Supérieure Africaine des TIC',
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Lot 1234, Quartier Cadjèhoun, Cotonou',
      email: 'contact@esatic.bj',
      filieres: [
        { nom: 'Génie Logiciel', code: 'ESATIC-GL-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Réseaux et Télécommunications', code: 'ESATIC-RT-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Systèmes Embarqués et IoT', code: 'ESATIC-SEI-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Intelligence Artificielle et Data Science', code: 'ESATIC-IADS-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 2. ESGT Bénin — École Supérieure de Gestion et de Technologie
    // ============================================================
    {
      nom: 'École Supérieure de Gestion et de Technologie du Bénin',
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Avenue Jean-Paul II, Cotonou',
      email: 'contact@esgt-benin.bj',
      filieres: [
        { nom: 'Gestion Commerciale et Marketing', code: 'ESGT-GCM-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Comptabilité et Audit', code: 'ESGT-CA-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Gestion des Ressources Humaines', code: 'ESGT-GRH-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Management des Organisations', code: 'ESGT-MO-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 3. ESGIS — École Supérieure de Gestion, d'Informatique et des Sciences
    // ============================================================
    {
      nom: 'École Supérieure de Gestion, d\'Informatique et des Sciences',
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Quartier Gbégamey, Cotonou',
      email: 'contact@esgis.bj',
      filieres: [
        { nom: 'Informatique de Gestion', code: 'ESGIS-IG-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Finance et Comptabilité', code: 'ESGIS-FC-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Commerce International', code: 'ESGIS-CI-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Audit et Contrôle de Gestion', code: 'ESGIS-ACG-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 4. HECM — Hautes Études Commerciales et de Management
    // ============================================================
    {
      nom: 'Hautes Études Commerciales et de Management',
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Rue du Commerce, Cotonou',
      email: 'contact@hecm.bj',
      filieres: [
        { nom: 'Management des Entreprises', code: 'HECM-ME-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Marketing et Communication', code: 'HECM-MC-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Banque et Finance', code: 'HECM-BF-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 5. ISM — Institut Supérieur de Management
    // ============================================================
    {
      nom: 'Institut Supérieur de Management du Bénin',
      type: 'PRIVE',
      ville: 'Porto-Novo',
      adresse: 'Avenue des Martyrs, Porto-Novo',
      email: 'contact@ism-benin.bj',
      filieres: [
        { nom: 'Administration des Affaires', code: 'ISM-AA-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Logistique et Transport', code: 'ISM-LT-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Management Stratégique', code: 'ISM-MS-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 6. ESAM — École Supérieure d'Administration et de Management
    // ============================================================
    {
      nom: 'École Supérieure d\'Administration et de Management',
      type: 'PRIVE',
      ville: 'Parakou',
      adresse: 'Boulevard de la Révolution, Parakou',
      email: 'contact@esam-parakou.bj',
      filieres: [
        { nom: 'Administration Publique', code: 'ESAM-AP-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Droit des Affaires', code: 'ESAM-DA-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Gouvernance et Développement Local', code: 'ESAM-GDL-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 7. ESCAE — École Supérieure de Commerce et d'Administration des Entreprises
    // ============================================================
    {
      nom: 'École Supérieure de Commerce et d\'Administration des Entreprises',
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Quartier Akpakpa, Cotonou',
      email: 'contact@escae-benin.bj',
      filieres: [
        { nom: 'Commerce et Distribution', code: 'ESCAE-CD-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Entrepreneuriat et Innovation', code: 'ESCAE-EI-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Management International', code: 'ESCAE-MI-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 8. ESMA — École Supérieure de Management et d'Administration
    // ============================================================
    {
      nom: 'École Supérieure de Management et d\'Administration',
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Quartier Fidjrossè, Cotonou',
      email: 'contact@esma-benin.bj',
      filieres: [
        { nom: 'Management et Administration des Entreprises', code: 'ESMA-MAE-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Gestion Financière', code: 'ESMA-GF-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Ressources Humaines et Communication', code: 'ESMA-RHC-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 9. ISPP — Institut Supérieur Polytechnique Privé du Bénin
    // ============================================================
    {
      nom: 'Institut Supérieur Polytechnique Privé du Bénin',
      type: 'PRIVE',
      ville: 'Abomey-Calavi',
      adresse: 'Route de l\'Aéroport, Abomey-Calavi',
      email: 'contact@ispp-benin.bj',
      filieres: [
        { nom: 'Génie Civil et BTP', code: 'ISPP-GC-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Électrotechnique et Énergies Renouvelables', code: 'ISPP-EER-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Génie Industriel', code: 'ISPP-GI-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 10. FSEGA — Faculté des Sciences Économiques et de Gestion Appliquée (Privé)
    // ============================================================
    {
      nom: 'Faculté des Sciences Économiques et de Gestion Appliquée',
      type: 'PRIVE',
      ville: 'Porto-Novo',
      adresse: 'Quartier Houinmè, Porto-Novo',
      email: 'contact@fsega-benin.bj',
      filieres: [
        { nom: 'Économie et Développement', code: 'FSEGA-ED-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Gestion des Projets', code: 'FSEGA-GP-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Économie Internationale', code: 'FSEGA-EI-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },
  ];

  for (const data of etablissementsPrives) {
    const { filieres, ...etablissementData } = data;

    const etablissement = await prisma.etablissement.upsert({
      where: { email: etablissementData.email },
      update: etablissementData,
      create: etablissementData,
    });

    console.log(`✅ Établissement : ${etablissement.nom}`);

    for (const filiere of filieres) {
      await prisma.filiere.upsert({
        where: { code: filiere.code },
        update: { ...filiere, etablissementId: etablissement.id },
        create: { ...filiere, etablissementId: etablissement.id },
      });
      console.log(`   └─ Filière : ${filiere.nom} (${filiere.code})`);
    }

    const campagneExistante = await prisma.campagneInscription.findFirst({
      where: {
        etablissementId: etablissement.id,
        anneeAcademique: '2026-2027',
      },
    });

    if (!campagneExistante) {
      const filieresBD = await prisma.filiere.findMany({
        where: { etablissementId: etablissement.id },
      });

      await prisma.campagneInscription.create({
        data: {
          etablissementId: etablissement.id,
          titre: `Campagne d'inscription ${etablissement.nom} 2026-2027`,
          anneeAcademique: '2026-2027',
          dateOuverture: new Date('2026-07-01T00:00:00.000Z'),
          dateCloture: new Date('2026-09-30T23:59:59.000Z'),
          description: 'Inscriptions ouvertes pour l\'année académique 2026-2027',
          statut: 'PUBLIEE',
          createdBy: 'seed',
          filieres: {
            create: filieresBD.map((f) => ({
              filiereId: f.id,
              fraisDossier: 5000,
              placesDisponibles: 50,
              seriesAcceptees: ['A', 'B', 'C', 'D', 'G1', 'G2', 'G3'],
            })),
          },
        },
      });
      console.log('   └─ Campagne 2026-2027 créée ✅');
    }
  }

  console.log('\nTerminé : 10 établissements privés seedés avec succès.');
}

main()
  .catch((error) => {
    console.error('Erreur seed établissements privés:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
