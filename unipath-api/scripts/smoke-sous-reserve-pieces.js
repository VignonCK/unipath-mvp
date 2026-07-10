/**
 * Smoke Phase 1 SOUS_RESERVE + piecesACorriger
 * Usage: node scripts/smoke-sous-reserve-pieces.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const API = process.env.API_BASE_URL || 'http://localhost:3001/api';
const PASSWORD = 'SousReservePhase1!';

const results = [];
function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
}

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

async function login(email, password) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session.access_token;
}

async function api(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function main() {
  console.log('\n=== Smoke Phase 1 SOUS_RESERVE piecesACorriger ===\n');

  const health = await fetch(`${API.replace(/\/api$/, '')}/health`).catch(() => null);
  if (!health?.ok) {
    fail('API disponible');
    console.log(`\n=== Résumé: 0/${results.length + 1} OK ===\n`);
    process.exit(1);
  }
  pass('API disponible');

  const stamp = Date.now();
  const annee = `2099-${2100}`; // unlikely collision
  const etab = await prisma.etablissement.findFirst({
    where: { type: 'PRIVE' },
    include: { filieres: { take: 1 } },
  });
  if (!etab?.filieres?.[0]) throw new Error('Pas d\'établissement privé');
  const filiere = etab.filieres[0];

  const emailAdmin = `harrydedji+sr-admin-${stamp}@gmail.com`;
  const adminId = await ensureAuthUser(emailAdmin, PASSWORD, {
    role: 'ADMIN_ETABLISSEMENT',
    mustChangePassword: false,
  });
  await prisma.adminEtablissement.upsert({
    where: { email: emailAdmin },
    create: {
      id: adminId,
      email: emailAdmin,
      nom: 'SR',
      prenom: 'Admin',
      etablissementId: etab.id,
      sousRole: 'ADMIN',
    },
    update: { id: adminId, etablissementId: etab.id, sousRole: 'ADMIN' },
  });
  const tokenAdmin = await login(emailAdmin, PASSWORD);

  const emailCand = `harrydedji+sr-cand-${stamp}@gmail.com`;
  const candId = await ensureAuthUser(emailCand, PASSWORD, { role: 'CANDIDAT' });
  await prisma.candidat.upsert({
    where: { id: candId },
    create: {
      id: candId,
      email: emailCand,
      matricule: `SR-${stamp}`,
      nom: 'Sous',
      prenom: 'Reserve',
      telephone: '91000001',
    },
    update: { email: emailCand },
  });

  // Requirements + application + docs
  const reqUpload1 = await prisma.schoolRequirement.upsert({
    where: { etablissementId_code: { etablissementId: etab.id, code: `SR_DOC_A_${stamp}` } },
    create: {
      etablissementId: etab.id,
      code: `SR_DOC_A_${stamp}`,
      label: 'Doc A',
      requirementType: 'DOCUMENT_UPLOAD',
      isRequired: true,
    },
    update: {},
  });
  const reqUpload2 = await prisma.schoolRequirement.upsert({
    where: { etablissementId_code: { etablissementId: etab.id, code: `SR_DOC_B_${stamp}` } },
    create: {
      etablissementId: etab.id,
      code: `SR_DOC_B_${stamp}`,
      label: 'Doc B',
      requirementType: 'DOCUMENT_UPLOAD',
      isRequired: true,
    },
    update: {},
  });
  const reqProfile = await prisma.schoolRequirement.upsert({
    where: { etablissementId_code: { etablissementId: etab.id, code: `SR_PHOTO_${stamp}` } },
    create: {
      etablissementId: etab.id,
      code: `SR_PHOTO_${stamp}`,
      label: 'Photo profil',
      requirementType: 'PROFILE_FIELD',
      profileFieldKey: 'photo',
      isRequired: true,
    },
    update: {},
  });
  // Extra doc not selected
  const reqUpload3 = await prisma.schoolRequirement.upsert({
    where: { etablissementId_code: { etablissementId: etab.id, code: `SR_DOC_C_${stamp}` } },
    create: {
      etablissementId: etab.id,
      code: `SR_DOC_C_${stamp}`,
      label: 'Doc C',
      requirementType: 'DOCUMENT_UPLOAD',
      isRequired: true,
    },
    update: {},
  });

  const application = await prisma.application.create({
    data: {
      numeroApplication: `SR-APP-${stamp}`,
      candidatId: candId,
      etablissementId: etab.id,
      filiereId: filiere.id,
      anneeAcademique: annee,
      niveau: 1,
      status: 'FICHE_GENERATED',
    },
  });

  const docA = await prisma.applicationDocument.create({
    data: {
      applicationId: application.id,
      schoolRequirementId: reqUpload1.id,
      code: reqUpload1.code,
      label: reqUpload1.label,
      source: 'STUDENT_UPLOAD',
      documentUrl: 'https://example.com/a.pdf',
      status: 'PROVIDED',
    },
  });
  const docB = await prisma.applicationDocument.create({
    data: {
      applicationId: application.id,
      schoolRequirementId: reqUpload2.id,
      code: reqUpload2.code,
      label: reqUpload2.label,
      source: 'STUDENT_UPLOAD',
      documentUrl: 'https://example.com/b.pdf',
      status: 'PROVIDED',
    },
  });
  const docProfile = await prisma.applicationDocument.create({
    data: {
      applicationId: application.id,
      schoolRequirementId: reqProfile.id,
      code: reqProfile.code,
      label: reqProfile.label,
      source: 'PROFILE_AUTO',
      status: 'PROVIDED',
      metadata: { value: 'photo-url' },
    },
  });
  const docC = await prisma.applicationDocument.create({
    data: {
      applicationId: application.id,
      schoolRequirementId: reqUpload3.id,
      code: reqUpload3.code,
      label: reqUpload3.label,
      source: 'STUDENT_UPLOAD',
      documentUrl: 'https://example.com/c.pdf',
      status: 'PROVIDED',
    },
  });

  const prein = await prisma.preinscriptionEtablissement.create({
    data: {
      numeroPreinscription: `SR-PE-${stamp}`,
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

  // --- Test 1: sans piecesACorriger → 400 ---
  const t1 = await api('PATCH', `/preinscriptions-etablissement/${prein.id}/decision`, tokenAdmin, {
    statut: 'SOUS_RESERVE',
    commentaireAdmin: 'Conditions manquantes',
  });
  if (t1.status === 400) {
    pass('1. SOUS_RESERVE sans piecesACorriger → 400', t1.data?.error);
  } else {
    fail('1. SOUS_RESERVE sans piecesACorriger → 400', `status=${t1.status}`);
  }

  // Reset statut if somehow changed
  await prisma.preinscriptionEtablissement.update({
    where: { id: prein.id },
    data: { statut: 'EN_ATTENTE', piecesACorriger: null, commentaireAdmin: null, decidedAt: null },
  });

  // --- Test 2: PROFILE_AUTO → 400 (rejet) ---
  const t2 = await api('PATCH', `/preinscriptions-etablissement/${prein.id}/decision`, tokenAdmin, {
    statut: 'SOUS_RESERVE',
    commentaireAdmin: 'Photo floue',
    piecesACorriger: [reqProfile.code],
  });
  if (t2.status === 400 && (t2.data?.codesRejetes || []).includes(reqProfile.code)) {
    pass('2. SOUS_RESERVE + PROFILE_AUTO → 400 (rejet)', JSON.stringify(t2.data?.codesRejetes));
  } else {
    fail('2. SOUS_RESERVE + PROFILE_AUTO → 400 (rejet)', `status=${t2.status} body=${JSON.stringify(t2.data)}`);
  }

  await prisma.preinscriptionEtablissement.update({
    where: { id: prein.id },
    data: { statut: 'EN_ATTENTE', piecesACorriger: null, commentaireAdmin: null, decidedAt: null },
  });

  // --- Test 3: 2 codes DOCUMENT_UPLOAD valides ---
  const t3 = await api('PATCH', `/preinscriptions-etablissement/${prein.id}/decision`, tokenAdmin, {
    statut: 'SOUS_RESERVE',
    commentaireAdmin: 'Documents illisibles — à resoumettre',
    piecesACorriger: [reqUpload1.code, reqUpload2.code],
  });

  const preinDb = await prisma.preinscriptionEtablissement.findUnique({ where: { id: prein.id } });
  const pieces = Array.isArray(preinDb?.piecesACorriger) ? preinDb.piecesACorriger : [];
  const codesPersisted = pieces.map((p) => (typeof p === 'string' ? p : p.code));
  const docsAfter = await prisma.applicationDocument.findMany({
    where: { applicationId: application.id },
  });
  const statusById = Object.fromEntries(docsAfter.map((d) => [d.id, d.status]));

  const t3Ok =
    t3.status === 200 &&
    preinDb.statut === 'SOUS_RESERVE' &&
    codesPersisted.includes(reqUpload1.code) &&
    codesPersisted.includes(reqUpload2.code) &&
    statusById[docA.id] === 'A_CORRIGER' &&
    statusById[docB.id] === 'A_CORRIGER';

  if (t3Ok) {
    pass(
      '3. SOUS_RESERVE + 2 codes DOCUMENT_UPLOAD → succès',
      `pieces=${JSON.stringify(codesPersisted)} A=${statusById[docA.id]} B=${statusById[docB.id]}`,
    );
  } else {
    fail(
      '3. SOUS_RESERVE + 2 codes DOCUMENT_UPLOAD → succès',
      `status=${t3.status} statut=${preinDb?.statut} pieces=${JSON.stringify(pieces)} statuses=${JSON.stringify(statusById)} body=${JSON.stringify(t3.data)?.slice(0, 300)}`,
    );
  }

  // --- Test 4: autres docs non touchés ---
  const othersOk =
    statusById[docC.id] === 'PROVIDED' && statusById[docProfile.id] === 'PROVIDED';
  if (othersOk) {
    pass('4. Docs non sélectionnés restent PROVIDED', `C=${statusById[docC.id]} profile=${statusById[docProfile.id]}`);
  } else {
    fail('4. Docs non sélectionnés restent PROVIDED', JSON.stringify(statusById));
  }

  // Lecture GET expose piecesACorriger
  const list = await api(
    'GET',
    '/preinscriptions-etablissement/etablissement/demandes?statut=SOUS_RESERVE',
    tokenAdmin,
  );
  const found = (list.data?.demandes || []).find((d) => d.id === prein.id);
  const readCodes = (found?.piecesACorriger || []).map((p) => (typeof p === 'string' ? p : p.code));
  if (list.status === 200 && found && readCodes.includes(reqUpload1.code) && readCodes.includes(reqUpload2.code)) {
    pass('GET demandes expose piecesACorriger', JSON.stringify(readCodes));
  } else {
    fail('GET demandes expose piecesACorriger', `found=${Boolean(found)} status=${list.status}`);
  }

  // Cleanup
  try {
    await prisma.application.update({ where: { id: application.id }, data: { preinscriptionId: null } });
    await prisma.applicationDocument.deleteMany({ where: { applicationId: application.id } });
    await prisma.application.delete({ where: { id: application.id } });
    await prisma.preinscriptionEtablissement.delete({ where: { id: prein.id } });
    await prisma.schoolRequirement.deleteMany({
      where: { id: { in: [reqUpload1.id, reqUpload2.id, reqUpload3.id, reqProfile.id] } },
    });
  } catch (e) {
    console.warn('Cleanup:', e.message);
  }

  const ok = results.filter((r) => r.ok).length;
  console.log(`\n=== Résumé: ${ok}/${results.length} OK ===\n`);
  process.exit(ok === results.length ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
