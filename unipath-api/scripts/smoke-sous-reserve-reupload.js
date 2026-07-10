/**
 * Smoke Phase 2 SOUS_RESERVE — reupload ciblé + resoumettre
 * Usage: node scripts/smoke-sous-reserve-reupload.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const API = process.env.API_BASE_URL || 'http://localhost:3001/api';
const PASSWORD = 'SousReservePhase2!';

// Minimal valid PDF
const PDF_BUF = Buffer.from(
  '%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n',
  'utf8',
);

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

async function uploadDoc(token, applicationId, code, buffer = PDF_BUF) {
  const form = new FormData();
  form.append('code', code);
  form.append('fichier', new Blob([buffer], { type: 'application/pdf' }), `${code}.pdf`);
  const res = await fetch(`${API}/applications/${applicationId}/documents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
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
  console.log('\n=== Smoke Phase 2 SOUS_RESERVE reupload + resoumettre ===\n');

  const health = await fetch(`${API.replace(/\/api$/, '')}/health`).catch(() => null);
  if (!health?.ok) {
    fail('API disponible');
    process.exit(1);
  }
  pass('API disponible');

  const stamp = Date.now();
  const annee = '2098-2099';
  const etab = await prisma.etablissement.findFirst({
    where: { type: 'PRIVE' },
    include: { filieres: { take: 1 } },
  });
  if (!etab?.filieres?.[0]) throw new Error('Pas d\'établissement privé');
  const filiere = etab.filieres[0];

  const emailCand = `harrydedji+sr2-cand-${stamp}@gmail.com`;
  const candId = await ensureAuthUser(emailCand, PASSWORD, { role: 'CANDIDAT' });
  await prisma.candidat.upsert({
    where: { id: candId },
    create: {
      id: candId,
      email: emailCand,
      matricule: `SR2-${stamp}`,
      nom: 'Phase',
      prenom: 'Deux',
      telephone: '92000001',
    },
    update: { email: emailCand },
  });
  const tokenCand = await login(emailCand, PASSWORD);

  const codes = {
    A: `SR2_A_${stamp}`,
    B: `SR2_B_${stamp}`,
    C: `SR2_C_${stamp}`,
    D: `SR2_D_${stamp}`,
  };

  const reqs = {};
  for (const [key, code] of Object.entries(codes)) {
    reqs[key] = await prisma.schoolRequirement.upsert({
      where: { etablissementId_code: { etablissementId: etab.id, code } },
      create: {
        etablissementId: etab.id,
        code,
        label: `Doc ${key}`,
        requirementType: 'DOCUMENT_UPLOAD',
        isRequired: true,
      },
      update: {},
    });
  }

  const application = await prisma.application.create({
    data: {
      numeroApplication: `SR2-APP-${stamp}`,
      candidatId: candId,
      etablissementId: etab.id,
      filiereId: filiere.id,
      anneeAcademique: annee,
      niveau: 1,
      status: 'FICHE_GENERATED',
    },
  });

  const docs = {};
  for (const [key, code] of Object.entries(codes)) {
    docs[key] = await prisma.applicationDocument.create({
      data: {
        applicationId: application.id,
        schoolRequirementId: reqs[key].id,
        code,
        label: `Doc ${key}`,
        source: 'STUDENT_UPLOAD',
        documentUrl: `old/${code}.pdf`,
        status: 'PROVIDED',
      },
    });
  }

  const prein = await prisma.preinscriptionEtablissement.create({
    data: {
      numeroPreinscription: `SR2-PE-${stamp}`,
      candidatId: candId,
      etablissementId: etab.id,
      filiereId: filiere.id,
      anneeAcademique: annee,
      niveau: 1,
      statut: 'SOUS_RESERVE',
      commentaireAdmin: 'Corriger A et B',
      piecesACorriger: [
        { code: codes.A, label: 'Doc A', documentId: docs.A.id },
        { code: codes.B, label: 'Doc B', documentId: docs.B.id },
      ],
    },
  });
  await prisma.application.update({
    where: { id: application.id },
    data: { preinscriptionId: prein.id },
  });
  await prisma.applicationDocument.updateMany({
    where: { id: { in: [docs.A.id, docs.B.id] } },
    data: { status: 'A_CORRIGER' },
  });

  pass(
    '1. Préinscription SOUS_RESERVE créée (2/4 codes ciblés)',
    `A,B à corriger ; C,D verrouillés`,
  );

  // --- Test 2: upload code NON sélectionné (C) → 403 ---
  const beforeC = await prisma.applicationDocument.findUnique({ where: { id: docs.C.id } });
  const t2 = await uploadDoc(tokenCand, application.id, codes.C);
  const afterC = await prisma.applicationDocument.findUnique({ where: { id: docs.C.id } });
  if (
    t2.status === 403 &&
    afterC.documentUrl === beforeC.documentUrl &&
    afterC.status === 'PROVIDED' &&
    afterC.updatedAt.getTime() === beforeC.updatedAt.getTime()
  ) {
    pass('2. POST doc code non ciblé → 403, base inchangée', t2.data?.error);
  } else {
    fail(
      '2. POST doc code non ciblé → 403, base inchangée',
      `status=${t2.status} urlChanged=${afterC.documentUrl !== beforeC.documentUrl} body=${JSON.stringify(t2.data)}`,
    );
  }

  // --- Test 3: upload code sélectionné (A) → succès PROVIDED ---
  const t3 = await uploadDoc(tokenCand, application.id, codes.A);
  const afterA = await prisma.applicationDocument.findUnique({ where: { id: docs.A.id } });
  if (t3.status === 200 && afterA.status === 'PROVIDED' && afterA.documentUrl !== beforeC.documentUrl) {
    pass('3. POST doc code ciblé A → PROVIDED', `status=${afterA.status} url=${afterA.documentUrl}`);
  } else if (t3.status === 200 && afterA.status === 'PROVIDED') {
    pass('3. POST doc code ciblé A → PROVIDED', `status=${afterA.status}`);
  } else {
    fail('3. POST doc code ciblé A → PROVIDED', `http=${t3.status} doc=${afterA?.status} body=${JSON.stringify(t3.data)?.slice(0, 250)}`);
  }

  // --- Test 4: resoumettre avec B encore A_CORRIGER → 400 ---
  const t4 = await api('POST', `/preinscriptions-etablissement/${prein.id}/resoumettre`, tokenCand);
  const missing = t4.data?.piecesEncoreEnAttente || [];
  const missingCodes = missing.map((p) => p.code);
  if (t4.status === 400 && missingCodes.includes(codes.B)) {
    pass('4. Resoumettre partiel → 400 avec code B', JSON.stringify(missingCodes));
  } else {
    fail('4. Resoumettre partiel → 400 avec code B', `status=${t4.status} body=${JSON.stringify(t4.data)}`);
  }

  // --- Test 5: upload B puis resoumettre → EN_ATTENTE ---
  const t5up = await uploadDoc(tokenCand, application.id, codes.B);
  const t5 = await api('POST', `/preinscriptions-etablissement/${prein.id}/resoumettre`, tokenCand);
  const preinAfter = await prisma.preinscriptionEtablissement.findUnique({ where: { id: prein.id } });
  if (t5up.status === 200 && t5.status === 200 && preinAfter.statut === 'EN_ATTENTE') {
    pass(
      '5. 2ème pièce + resoumettre → EN_ATTENTE',
      `piecesACorriger conservé=${Array.isArray(preinAfter.piecesACorriger) && preinAfter.piecesACorriger.length === 2}`,
    );
  } else {
    fail(
      '5. 2ème pièce + resoumettre → EN_ATTENTE',
      `up=${t5up.status} resub=${t5.status} statut=${preinAfter?.statut} body=${JSON.stringify(t5.data)?.slice(0, 200)}`,
    );
  }

  // --- Test 6: non-régression upload hors SOUS_RESERVE ---
  const annee2 = '2097-2098';
  const app2 = await prisma.application.create({
    data: {
      numeroApplication: `SR2-APP2-${stamp}`,
      candidatId: candId,
      etablissementId: etab.id,
      filiereId: filiere.id,
      anneeAcademique: annee2,
      niveau: 1,
      status: 'PENDING_DOCUMENTS',
    },
  });
  // no preinscription linked
  const t6 = await uploadDoc(tokenCand, app2.id, codes.A);
  const doc6 = await prisma.applicationDocument.findFirst({
    where: { applicationId: app2.id, code: codes.A },
  });
  if (t6.status === 200 && doc6?.status === 'PROVIDED') {
    pass('6. Non-régression upload hors SOUS_RESERVE → 200', `doc=${doc6.status}`);
  } else {
    fail('6. Non-régression upload hors SOUS_RESERVE → 200', `status=${t6.status} body=${JSON.stringify(t6.data)?.slice(0, 250)}`);
  }

  // Cleanup
  try {
    await prisma.application.update({ where: { id: application.id }, data: { preinscriptionId: null } });
    await prisma.applicationDocument.deleteMany({
      where: { applicationId: { in: [application.id, app2.id] } },
    });
    await prisma.application.deleteMany({ where: { id: { in: [application.id, app2.id] } } });
    await prisma.preinscriptionEtablissement.delete({ where: { id: prein.id } });
    await prisma.schoolRequirement.deleteMany({
      where: { code: { in: Object.values(codes) } },
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
