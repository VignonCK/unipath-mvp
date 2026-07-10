require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { supabaseAdmin } = require('../src/supabase');

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Test2026!';
const DEMO_ANNEE = '2026-2027';
const DEMO_DOC_BASE = 'https://example.com/demo/unipath';

const DEMO_CANDIDATS = [
  { index: 1, nom: 'AGOSSOU', prenom: 'Koffi', sexe: 'M', serie: 'G1', statut: 'VALIDE', etablissementEmail: 'contact@esae.bj', filiereCode: 'ESAE-SE-L', submittedAt: '2026-07-05T10:30:00.000Z', lieuNaiss: 'Cotonou', dateNaiss: '2004-03-12' },
  { index: 2, nom: 'HOUNGBO', prenom: 'Mireille', sexe: 'F', serie: 'G2', statut: 'VALIDE', etablissementEmail: 'contact@irgib.bj', filiereCode: 'IRGIB-GTIC-L', submittedAt: '2026-07-08T14:15:00.000Z', lieuNaiss: 'Porto-Novo', dateNaiss: '2005-06-22' },
  { index: 3, nom: 'KPADONOU', prenom: 'Romuald', sexe: 'M', serie: 'G3', statut: 'REJETE', motif: 'Relevé de notes non conforme aux exigences de la filière.', etablissementEmail: 'contact@iscg-benin.bj', filiereCode: 'ISCG-BF-L', submittedAt: '2026-07-10T09:00:00.000Z', lieuNaiss: 'Parakou', dateNaiss: '2003-11-08' },
  { index: 4, nom: 'DANSOU', prenom: 'Élodie', sexe: 'F', serie: 'A', statut: 'REJETE', motif: 'Pièce d\'identité illisible ou expirée.', etablissementEmail: 'contact@isma-benin.bj', filiereCode: 'ISMA-JC-L', submittedAt: '2026-07-12T16:45:00.000Z', lieuNaiss: 'Abomey-Calavi', dateNaiss: '2005-01-30' },
  { index: 5, nom: 'TOSSOU', prenom: 'Yves', sexe: 'M', serie: 'C', statut: 'EN_ATTENTE', etablissementEmail: 'contact@hecm-benin.bj', filiereCode: 'HECM-ME-L', submittedAt: '2026-07-15T11:20:00.000Z', lieuNaiss: 'Bohicon', dateNaiss: '2004-09-17' },
  { index: 6, nom: 'BIAOU', prenom: 'Aïcha', sexe: 'F', serie: 'D', statut: 'EN_ATTENTE', etablissementEmail: 'contact@pigier-benin.bj', filiereCode: 'PIGIER-RGL-L', submittedAt: '2026-07-18T08:50:00.000Z', lieuNaiss: 'Cotonou', dateNaiss: '2006-02-14' },
  { index: 7, nom: 'GANDONOU', prenom: 'Serge', sexe: 'M', serie: 'G1', statut: 'SOUS_RESERVE', motif: 'Merci de fournir une attestation de réussite au BAC complémentaire.', etablissementEmail: 'contact@ism-adonai.bj', filiereCode: 'ISMA-GE-L', submittedAt: '2026-07-20T13:10:00.000Z', lieuNaiss: 'Ouidah', dateNaiss: '2004-07-03' },
  { index: 8, nom: 'ADJOLO', prenom: 'Ayélé', sexe: 'F', serie: 'G2', statut: 'SOUS_RESERVE', motif: 'Photo d\'identité non conforme aux normes requises.', etablissementEmail: 'contact@uatm-gasa.bj', filiereCode: 'UATM-GI-L', submittedAt: '2026-07-22T15:40:00.000Z', lieuNaiss: 'Natitingou', dateNaiss: '2005-12-01' },
  { index: 9, nom: 'ZANNOU', prenom: 'Marcel', sexe: 'M', serie: 'B', statut: 'VALIDE', etablissementEmail: 'contact@esm-benin.bj', filiereCode: 'ESM-MAE-L', submittedAt: '2026-07-25T10:05:00.000Z', lieuNaiss: 'Cotonou', dateNaiss: '2003-05-19' },
  { index: 10, nom: 'KOUASSI', prenom: 'Nadia', sexe: 'F', serie: 'G3', statut: 'VALIDE', etablissementEmail: 'contact@ucao-benin.bj', filiereCode: 'UCAO-SEG-L', submittedAt: '2026-07-28T17:25:00.000Z', lieuNaiss: 'Lokossa', dateNaiss: '2004-10-11' },
  { index: 11, nom: 'DOSSOU', prenom: 'Kévin', sexe: 'M', serie: 'G1', statut: 'REJETE', motif: 'Dossier incomplet : absence de certificat de scolarité.', etablissementEmail: 'contact@iup-benin.bj', filiereCode: 'IUP-SG-L', submittedAt: '2026-08-01T09:35:00.000Z', lieuNaiss: 'Porto-Novo', dateNaiss: '2005-04-27' },
  { index: 12, nom: 'AHOUANDJINOU', prenom: 'Prisca', sexe: 'F', serie: 'A', statut: 'EN_ATTENTE', etablissementEmail: 'contact@esep-leberger.bj', filiereCode: 'ESEP-GC-L', submittedAt: '2026-08-05T12:00:00.000Z', lieuNaiss: 'Cotonou', dateNaiss: '2006-08-09' },
  { index: 13, nom: 'SOSSOU', prenom: 'Patrick', sexe: 'M', serie: 'C', statut: 'SOUS_RESERVE', motif: 'Relevé de notes du BAC en attente de validation par l\'établissement.', etablissementEmail: 'contact@esae.bj', filiereCode: 'ESAE-AF-L', submittedAt: '2026-08-08T14:55:00.000Z', lieuNaiss: 'Abomey', dateNaiss: '2004-12-23' },
  { index: 14, nom: 'OGOUNCHILE', prenom: 'Christelle', sexe: 'F', serie: 'D', statut: 'SOUS_RESERVE', motif: 'Acte de naissance à fournir en version certifiée conforme.', etablissementEmail: 'contact@irgib.bj', filiereCode: 'IRGIB-AA-L', submittedAt: '2026-08-10T11:15:00.000Z', lieuNaiss: 'Parakou', dateNaiss: '2005-03-06' },
  { index: 15, nom: 'BOCO', prenom: 'Raphaël', sexe: 'M', serie: 'G2', statut: 'EN_ATTENTE', etablissementEmail: 'contact@hecm-benin.bj', filiereCode: 'HECM-CI-L', submittedAt: '2026-08-12T16:30:00.000Z', lieuNaiss: 'Cotonou', dateNaiss: '2004-06-18' },
];

async function ensureSupabaseUser(email) {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });

  if (!authError) {
    return authData.user.id;
  }

  const dejaExistant =
    authError.message.includes('already registered') ||
    authError.message.includes('already been registered');
  if (!dejaExistant) {
    throw authError;
  }

  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  const existing = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    throw new Error(`Utilisateur ${email} introuvable dans Supabase Auth`);
  }
  return existing.id;
}

async function resolveCampagneFiliere(etablissementEmail, filiereCode) {
  const etablissement = await prisma.etablissement.findUnique({ where: { email: etablissementEmail } });
  if (!etablissement) {
    throw new Error(`Établissement introuvable : ${etablissementEmail}`);
  }

  const filiere = await prisma.filiere.findFirst({
    where: { code: filiereCode, etablissementId: etablissement.id },
  });
  if (!filiere) {
    throw new Error(`Filière ${filiereCode} introuvable pour ${etablissementEmail}`);
  }

  const campagne = await prisma.campagneInscription.findFirst({
    where: { etablissementId: etablissement.id, anneeAcademique: DEMO_ANNEE },
    include: { filieres: true },
  });
  if (!campagne) {
    throw new Error(`Campagne ${DEMO_ANNEE} introuvable pour ${etablissementEmail}`);
  }

  const campagneFiliere = campagne.filieres.find((cf) => cf.filiereId === filiere.id);
  if (!campagneFiliere) {
    throw new Error(`CampagneFiliere introuvable : ${filiereCode} / ${DEMO_ANNEE}`);
  }

  return { etablissement, filiere, campagneFiliere };
}

async function seedDemoCandidats() {
  console.log('\n--- Candidats démo CampagneInscription (établissements privés) ---');

  const stats = { candidats: 0, applications: 0, preinscriptions: 0 };

  for (const demo of DEMO_CANDIDATS) {
    const email = `harrydedji+candidat${demo.index}@gmail.com`;
    const matricule = `DEMO-2026-${String(demo.index).padStart(3, '0')}`;
    const numeroApplication = `DEMO-APP-2026-${String(demo.index).padStart(3, '0')}`;
    const numeroPreinscription = `DEMO-PE-2026-${String(demo.index).padStart(3, '0')}`;
    const telephone = `+22961${String(100000 + demo.index).slice(1)}`;

    const userId = await ensureSupabaseUser(email);
    const { etablissement, filiere, campagneFiliere } = await resolveCampagneFiliere(
      demo.etablissementEmail,
      demo.filiereCode
    );

    const candidat = await prisma.candidat.upsert({
      where: { email },
      update: {
        nom: demo.nom,
        prenom: demo.prenom,
        sexe: demo.sexe,
        serie: demo.serie,
        nationalite: 'Béninoise',
        telephone,
        dateNaiss: new Date(demo.dateNaiss),
        lieuNaiss: demo.lieuNaiss,
        emailConfirme: true,
        role: 'ETUDIANT',
      },
      create: {
        id: userId,
        email,
        matricule,
        nom: demo.nom,
        prenom: demo.prenom,
        sexe: demo.sexe,
        serie: demo.serie,
        nationalite: 'Béninoise',
        telephone,
        dateNaiss: new Date(demo.dateNaiss),
        lieuNaiss: demo.lieuNaiss,
        emailConfirme: true,
        role: 'ETUDIANT',
      },
    });
    stats.candidats += 1;

    await prisma.dossier.upsert({
      where: { candidatId: candidat.id },
      update: {
        acteNaissance: `${DEMO_DOC_BASE}/acte-${demo.index}.pdf`,
        carteIdentite: `${DEMO_DOC_BASE}/cni-${demo.index}.pdf`,
        photo: `${DEMO_DOC_BASE}/photo-${demo.index}.jpg`,
        releve: `${DEMO_DOC_BASE}/releve-${demo.index}.pdf`,
      },
      create: {
        candidatId: candidat.id,
        acteNaissance: `${DEMO_DOC_BASE}/acte-${demo.index}.pdf`,
        carteIdentite: `${DEMO_DOC_BASE}/cni-${demo.index}.pdf`,
        photo: `${DEMO_DOC_BASE}/photo-${demo.index}.jpg`,
        releve: `${DEMO_DOC_BASE}/releve-${demo.index}.pdf`,
      },
    });

    const submittedAt = new Date(demo.submittedAt);
    const decidedAt = ['VALIDE', 'REJETE', 'SOUS_RESERVE'].includes(demo.statut) ? submittedAt : null;

    const application = await prisma.application.upsert({
      where: { numeroApplication },
      update: {
        etablissementId: etablissement.id,
        filiereId: filiere.id,
        campagneFiliereId: campagneFiliere.id,
        anneeAcademique: DEMO_ANNEE,
        niveau: 1,
        status: 'FICHE_GENERATED',
      },
      create: {
        numeroApplication,
        candidatId: candidat.id,
        etablissementId: etablissement.id,
        filiereId: filiere.id,
        campagneFiliereId: campagneFiliere.id,
        anneeAcademique: DEMO_ANNEE,
        niveau: 1,
        status: 'FICHE_GENERATED',
        createdAt: submittedAt,
      },
    });
    stats.applications += 1;

    const demoDocs = [
      { code: 'ACTE_NAISSANCE', label: 'Acte de naissance', url: `${DEMO_DOC_BASE}/acte-${demo.index}.pdf` },
      { code: 'CARTE_IDENTITE', label: 'Carte d\'identité', url: `${DEMO_DOC_BASE}/cni-${demo.index}.pdf` },
      { code: 'PHOTO', label: 'Photo d\'identité', url: `${DEMO_DOC_BASE}/photo-${demo.index}.jpg` },
      { code: 'RELEVE_NOTES', label: 'Relevé de notes', url: `${DEMO_DOC_BASE}/releve-${demo.index}.pdf` },
    ];

    for (const doc of demoDocs) {
      await prisma.applicationDocument.upsert({
        where: { applicationId_code: { applicationId: application.id, code: doc.code } },
        update: { status: 'PROVIDED', documentUrl: doc.url, source: 'STUDENT_UPLOAD' },
        create: {
          applicationId: application.id,
          code: doc.code,
          label: doc.label,
          source: 'STUDENT_UPLOAD',
          documentUrl: doc.url,
          status: 'PROVIDED',
        },
      });
    }

    const existingPayment = await prisma.payment.findFirst({
      where: { applicationId: application.id, paymentType: 'DOSSIER_FEES' },
    });
    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: { status: 'CONFIRMED', amount: campagneFiliere.fraisDossier },
      });
    } else {
      await prisma.payment.create({
        data: {
          applicationId: application.id,
          paymentType: 'DOSSIER_FEES',
          amount: campagneFiliere.fraisDossier,
          paymentMethod: 'PLATFORM_GATEWAY',
          status: 'CONFIRMED',
          externalRef: `DEMO-PAY-2026-${String(demo.index).padStart(3, '0')}`,
        },
      });
    }

    const preinscription = await prisma.preinscriptionEtablissement.upsert({
      where: { numeroPreinscription },
      update: {
        candidatId: candidat.id,
        filiereId: filiere.id,
        etablissementId: etablissement.id,
        anneeAcademique: DEMO_ANNEE,
        niveau: 1,
        statut: demo.statut,
        motifDecision: demo.statut === 'REJETE' ? demo.motif : null,
        commentaireAdmin: demo.statut === 'SOUS_RESERVE' ? demo.motif : null,
        decidedAt,
        decidedBy: decidedAt ? 'seed-demo' : null,
      },
      create: {
        numeroPreinscription,
        candidatId: candidat.id,
        filiereId: filiere.id,
        etablissementId: etablissement.id,
        anneeAcademique: DEMO_ANNEE,
        niveau: 1,
        statut: demo.statut,
        motifDecision: demo.statut === 'REJETE' ? demo.motif : null,
        commentaireAdmin: demo.statut === 'SOUS_RESERVE' ? demo.motif : null,
        decidedAt,
        decidedBy: decidedAt ? 'seed-demo' : null,
        createdAt: submittedAt,
      },
    });
    stats.preinscriptions += 1;

    await prisma.application.update({
      where: { id: application.id },
      data: { preinscriptionId: preinscription.id },
    });

    console.log(
      `   ✅ ${demo.prenom} ${demo.nom} → ${etablissement.nom.split(' ')[0]}… (${demo.statut})`
    );
  }

  const totalCandidats = await prisma.candidat.count({ where: { matricule: { startsWith: 'DEMO-2026-' } } });
  const totalApps = await prisma.application.count({ where: { numeroApplication: { startsWith: 'DEMO-APP-2026-' } } });
  const totalPe = await prisma.preinscriptionEtablissement.count({
    where: { numeroPreinscription: { startsWith: 'DEMO-PE-2026-' } },
  });

  console.log(`\nRésumé démo : ${totalCandidats} candidat(s), ${totalApps} application(s), ${totalPe} préinscription(s).`);
  console.log('Mot de passe commun : Test2026!');
  console.log('Emails : harrydedji+candidat1@gmail.com … harrydedji+candidat15@gmail.com');

  return stats;
}

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

  await seedDemoCandidats();
}

main()
  .catch((error) => {
    console.error('Erreur seed établissements privés:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
