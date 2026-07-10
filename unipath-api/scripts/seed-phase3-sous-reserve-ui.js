/**
 * Seed minimal EN_ATTENTE dossier for Phase 3 UI tests.
 * Prints credentials + IDs.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const PASSWORD = 'Phase3Ui2026!';

async function ensureAuthUser(email, password, metadata) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (!error) return data.user.id;
  const exists =
    error.message.includes('already registered') ||
    error.message.includes('already been registered');
  if (!exists) throw error;
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`Auth user ${email} introuvable`);
  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: { ...(user.user_metadata || {}), ...metadata, mustChangePassword: false },
  });
  return user.id;
}

async function main() {
  const stamp = Date.now();
  const annee = '2096-2097';
  const etab = await prisma.etablissement.findFirst({
    where: { type: 'PRIVE', nom: { contains: 'Africaine des TIC' } },
    include: { filieres: { take: 1 } },
  });
  if (!etab?.filieres?.[0]) throw new Error('ESATIC introuvable');
  const filiere = etab.filieres[0];

  const emailAdmin = 'harrydedji+admin-ecole-superieure-africaine-des-tic@gmail.com';
  // ensure admin exists linked to etab
  const admin = await prisma.adminEtablissement.findUnique({ where: { email: emailAdmin } });
  if (!admin) throw new Error(`Admin ${emailAdmin} introuvable — utilise COMPTES_DEMO`);

  const emailCand = `harrydedji+phase3-ui-${stamp}@gmail.com`;
  const candId = await ensureAuthUser(emailCand, PASSWORD, { role: 'CANDIDAT' });
  await prisma.candidat.upsert({
    where: { id: candId },
    create: {
      id: candId,
      email: emailCand,
      matricule: `P3-${stamp}`,
      nom: 'PhaseTrois',
      prenom: 'Candidat',
      telephone: '93000001',
    },
    update: { email: emailCand },
  });

  const codes = ['P3_DIPLOME', 'P3_CNI', 'P3_RELEVE', 'P3_PHOTO_DOC'].map((c) => `${c}_${stamp}`);
  const reqs = [];
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    reqs.push(
      await prisma.schoolRequirement.upsert({
        where: { etablissementId_code: { etablissementId: etab.id, code } },
        create: {
          etablissementId: etab.id,
          code,
          label: ['Diplôme', 'CNI', 'Relevé', 'Photo identité'][i],
          requirementType: 'DOCUMENT_UPLOAD',
          isRequired: true,
        },
        update: {},
      }),
    );
  }

  const application = await prisma.application.create({
    data: {
      numeroApplication: `P3-APP-${stamp}`,
      candidatId: candId,
      etablissementId: etab.id,
      filiereId: filiere.id,
      anneeAcademique: annee,
      niveau: 1,
      status: 'FICHE_GENERATED',
    },
  });

  for (let i = 0; i < codes.length; i++) {
    await prisma.applicationDocument.create({
      data: {
        applicationId: application.id,
        schoolRequirementId: reqs[i].id,
        code: codes[i],
        label: reqs[i].label,
        source: 'STUDENT_UPLOAD',
        documentUrl: `seed/${codes[i]}.pdf`,
        status: 'PROVIDED',
      },
    });
  }

  const prein = await prisma.preinscriptionEtablissement.create({
    data: {
      numeroPreinscription: `P3-PE-${stamp}`,
      candidatId: candId,
      etablissementId: etab.id,
      filiereId: filiere.id,
      anneeAcademique: annee,
      niveau: 1,
      statut: 'EN_ATTENTE',
    },
  });
  await prisma.application.update({
    where: { id: application.id },
    data: { preinscriptionId: prein.id },
  });

  console.log(JSON.stringify({
    adminEmail: emailAdmin,
    adminPassword: 'AdminEtab2026!',
    candidatEmail: emailCand,
    candidatPassword: PASSWORD,
    preinscriptionId: prein.id,
    applicationId: application.id,
    numeroPreinscription: prein.numeroPreinscription,
    codes,
    labels: reqs.map((r) => r.label),
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
