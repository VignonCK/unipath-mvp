const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding établissements privés agréés du Bénin...');

  const etablissementsPrives = [
    // ============================================================
    // 1. ESAE — École Supérieure d'Administration et d'Économie
    // ============================================================
    {
      nom: "École Supérieure d'Administration et d'Économie",
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Atinkanmey, Quartier Gbèdjromèdé, Cotonou',
      email: 'contact@esae.bj',
      filieres: [
        { nom: 'Sciences Économiques', code: 'ESAE-SE-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Administration des Finances', code: 'ESAE-AF-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Administration Générale', code: 'ESAE-AG-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Sciences de Gestion', code: 'ESAE-SG-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Sciences Juridiques', code: 'ESAE-SJ-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Journalisme et Médias', code: 'ESAE-JM-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Administration des Affaires', code: 'ESAE-AA-M', niveau: 'MASTER', dureeAnnees: 2 },
        { nom: 'Gestion des Ressources Humaines', code: 'ESAE-GRH-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 2. IRGIB Africa University
    // ============================================================
    {
      nom: 'IRGIB Africa University',
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Face Stade René Pleven, Akpakpa, Cotonou',
      email: 'contact@irgib.bj',
      filieres: [
        { nom: 'Génie des Technologies de l\'Information et de la Communication', code: 'IRGIB-GTIC-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Génie des Procédés de Productions Industrielles', code: 'IRGIB-GPPI-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Administration des Affaires', code: 'IRGIB-AA-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Sciences Économiques', code: 'IRGIB-SE-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Analyses Biomédicales', code: 'IRGIB-AB-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Procédés de Productions Industrielles', code: 'IRGIB-PPI-M', niveau: 'MASTER', dureeAnnees: 2 },
        { nom: 'Administration des Affaires', code: 'IRGIB-AA-M', niveau: 'MASTER', dureeAnnees: 2 },
        { nom: 'Analyses Biomédicales', code: 'IRGIB-AB-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 3. ISCG — Institut Supérieur de Communication et de Gestion
    // ============================================================
    {
      nom: 'Institut Supérieur de Communication et de Gestion',
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Quartier Cadjèhoun, Cotonou',
      email: 'contact@iscg-benin.bj',
      filieres: [
        { nom: 'Banque et Finance', code: 'ISCG-BF-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Comptabilité, Contrôle et Audit', code: 'ISCG-CCA-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Journalisme', code: 'ISCG-JO-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Sciences Juridiques', code: 'ISCG-SJ-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Gestion des Ressources Humaines', code: 'ISCG-GRH-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Banque et Finance', code: 'ISCG-BF-M', niveau: 'MASTER', dureeAnnees: 2 },
        { nom: 'Comptabilité, Contrôle et Audit', code: 'ISCG-CCA-M', niveau: 'MASTER', dureeAnnees: 2 },
        { nom: 'Gestion des Ressources Humaines', code: 'ISCG-GRH-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 4. ISMA — Institut Supérieur des Métiers de l'Audiovisuel
    // ============================================================
    {
      nom: "Institut Supérieur des Métiers de l'Audiovisuel",
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Quartier Gbégamey, Cotonou',
      email: 'contact@isma-benin.bj',
      filieres: [
        { nom: 'Journalisme et Communication', code: 'ISMA-JC-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Production Audiovisuelle', code: 'ISMA-PA-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Communication et Marketing Digital', code: 'ISMA-CMD-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Management de la Communication', code: 'ISMA-MC-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 5. HECM — Haute École de Commerce et de Management
    // ============================================================
    {
      nom: 'Haute École de Commerce et de Management',
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Quartier Akpakpa, Cotonou',
      email: 'contact@hecm-benin.bj',
      filieres: [
        { nom: 'Management des Entreprises', code: 'HECM-ME-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Commerce International', code: 'HECM-CI-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Finance et Comptabilité', code: 'HECM-FC-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Management Stratégique', code: 'HECM-MS-M', niveau: 'MASTER', dureeAnnees: 2 },
        { nom: 'Finance', code: 'HECM-FI-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 6. Pigier Bénin
    // ============================================================
    {
      nom: 'Pigier Bénin',
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Avenue Jean-Paul II, Cotonou',
      email: 'contact@pigier-benin.bj',
      filieres: [
        { nom: 'Audit et Contrôle de Gestion', code: 'PIGIER-ACG-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Réseaux et Génie Logiciel', code: 'PIGIER-RGL-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Management des Ressources Humaines', code: 'PIGIER-MRH-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Gestion des Transports et Logistique', code: 'PIGIER-GTL-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Négociation et Communication Multimédia', code: 'PIGIER-NCM-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Management des Ressources Humaines', code: 'PIGIER-MRH-M', niveau: 'MASTER', dureeAnnees: 2 },
        { nom: 'Finance', code: 'PIGIER-FI-M', niveau: 'MASTER', dureeAnnees: 2 },
        { nom: 'Audit et Contrôle de Gestion', code: 'PIGIER-ACG-M', niveau: 'MASTER', dureeAnnees: 2 },
        { nom: 'Communication et Marketing', code: 'PIGIER-CM-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 7. ISM Adonaï — Institut Supérieur de Management Adonaï
    // ============================================================
    {
      nom: 'Institut Supérieur de Management Adonaï',
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Quartier Fifadji, Cotonou',
      email: 'contact@ism-adonai.bj',
      filieres: [
        { nom: 'Gestion des Entreprises', code: 'ISMA-GE-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Informatique de Gestion', code: 'ISMA-IG-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Droit des Affaires', code: 'ISMA-DA-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Management des Organisations', code: 'ISMA-MO-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 8. UATM Gasa Formation — Université Africaine de Technologie et de Management
    // ============================================================
    {
      nom: 'Université Africaine de Technologie et de Management',
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Rue du Commissariat, Cotonou',
      email: 'contact@uatm-gasa.bj',
      filieres: [
        { nom: 'Génie Informatique', code: 'UATM-GI-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Management des Organisations', code: 'UATM-MO-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Génie Civil', code: 'UATM-GC-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Électrotechnique', code: 'UATM-ET-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Génie Informatique', code: 'UATM-GI-M', niveau: 'MASTER', dureeAnnees: 2 },
        { nom: 'Management des Organisations', code: 'UATM-MO-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 9. ESM Bénin — École Supérieure de Management
    // ============================================================
    {
      nom: 'École Supérieure de Management du Bénin',
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Quartier Fidjrossè, Cotonou',
      email: 'contact@esm-benin.bj',
      filieres: [
        { nom: 'Management et Administration des Entreprises', code: 'ESM-MAE-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Finance et Comptabilité', code: 'ESM-FC-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Marketing et Stratégie Commerciale', code: 'ESM-MSC-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Management Stratégique', code: 'ESM-MS-M', niveau: 'MASTER', dureeAnnees: 2 },
        { nom: 'Finance', code: 'ESM-FI-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 10. UCAO — Université Catholique d'Afrique de l'Ouest
    // ============================================================
    {
      nom: "Université Catholique d'Afrique de l'Ouest",
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Quartier Missèbo, Cotonou',
      email: 'contact@ucao-benin.bj',
      filieres: [
        { nom: 'Droit', code: 'UCAO-DR-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Sciences Économiques et Gestion', code: 'UCAO-SEG-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Philosophie et Sciences Humaines', code: 'UCAO-PSH-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Droit des Affaires', code: 'UCAO-DA-M', niveau: 'MASTER', dureeAnnees: 2 },
        { nom: 'Économie et Développement', code: 'UCAO-ED-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 11. IUP — Institut Universitaire Panafricain
    // ============================================================
    {
      nom: 'Institut Universitaire Panafricain',
      type: 'PRIVE',
      ville: 'Porto-Novo',
      adresse: 'Avenue des Martyrs, Porto-Novo',
      email: 'contact@iup-benin.bj',
      filieres: [
        { nom: 'Sciences de Gestion', code: 'IUP-SG-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Informatique Appliquée', code: 'IUP-IA-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Administration et Gestion', code: 'IUP-AG-M', niveau: 'MASTER', dureeAnnees: 2 },
      ],
    },

    // ============================================================
    // 12. ESEP Le Berger
    // ============================================================
    {
      nom: 'École Supérieure de l\'Enseignement Professionnel Le Berger',
      type: 'PRIVE',
      ville: 'Cotonou',
      adresse: 'Quartier Sainte Rita, Cotonou',
      email: 'contact@esep-leberger.bj',
      filieres: [
        { nom: 'Gestion Commerciale', code: 'ESEP-GC-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Informatique de Gestion', code: 'ESEP-IG-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Comptabilité et Finance', code: 'ESEP-CF-L', niveau: 'LICENCE', dureeAnnees: 3 },
        { nom: 'Management des Organisations', code: 'ESEP-MO-M', niveau: 'MASTER', dureeAnnees: 2 },
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

  console.log('\nTerminé : 12 EPES agréés du Bénin seedés avec succès.');
}

main()
  .catch((error) => {
    console.error('Erreur seed établissements privés:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
