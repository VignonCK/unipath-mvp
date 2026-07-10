/**
 * Smoke tests Phase A+B : filtre année + réinscription MVP
 * Usage: node scripts/smoke-annee-reinscription.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const API = process.env.API_BASE_URL || 'http://localhost:3001/api';
const PASSWORD = 'ReinscripTest2026!';

function previousAnneeAcademique(annee) {
  if (!annee || typeof annee !== 'string') return null;
  const match = annee.trim().match(/^(\d{4})-(\d{4})$/);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end !== start + 1) return null;
  return `${start - 1}-${end - 1}`;
}

function isEligibleReinscription(inscriptions, { filiereId, anneeCampagne }) {
  const anneeN1 = previousAnneeAcademique(anneeCampagne);
  if (!anneeN1 || !filiereId || !Array.isArray(inscriptions)) return false;
  return inscriptions.some(
    (ins) =>
      ins.filiereId === filiereId &&
      ins.anneeAcademique === anneeN1 &&
      ins.statut === 'VALIDE',
  );
}

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
  console.log('\n=== Smoke tests filtre année + réinscription MVP ===\n');

  const health = await fetch(`${API.replace(/\/api$/, '')}/health`).catch(() => null);
  if (!health?.ok) {
    fail('API disponible', `health check failed on ${API}`);
    printSummary();
    process.exit(1);
  }
  pass('API disponible');

  const anneeN = '2026-2027';
  const anneeN1 = previousAnneeAcademique(anneeN);
  const stamp = Date.now();

  const etab = await prisma.etablissement.findFirst({
    where: { type: 'PRIVE' },
    include: { filieres: { take: 1 } },
  });
  if (!etab?.filieres?.[0]) throw new Error('Aucun établissement privé avec filière');
  const filiere = etab.filieres[0];

  // Admin établissement
  const emailAdmin = `harrydedji+smoke-admin-${stamp}@gmail.com`;
  const adminAuthId = await ensureAuthUser(emailAdmin, PASSWORD, {
    role: 'ADMIN_ETABLISSEMENT',
    mustChangePassword: false,
  });
  await prisma.adminEtablissement.upsert({
    where: { email: emailAdmin },
    create: {
      id: adminAuthId,
      email: emailAdmin,
      nom: 'Smoke',
      prenom: 'Admin',
      etablissementId: etab.id,
      sousRole: 'ADMIN',
    },
    update: {
      id: adminAuthId,
      etablissementId: etab.id,
      sousRole: 'ADMIN',
    },
  });
  const tokenAdmin = await login(emailAdmin, PASSWORD);

  // Seed 2 applications différentes années pour filtre
  const emailSeed = `harrydedji+smoke-seed-${stamp}@gmail.com`;
  const seedAuthId = await ensureAuthUser(emailSeed, PASSWORD, { role: 'CANDIDAT' });
  await prisma.candidat.upsert({
    where: { id: seedAuthId },
    create: {
      id: seedAuthId,
      email: emailSeed,
      matricule: `SMK-SEED-${stamp}`,
      nom: 'Seed',
      prenom: 'Filter',
      telephone: '90000001',
    },
    update: { email: emailSeed },
  });

  const appN = await prisma.application.create({
    data: {
      numeroApplication: `SMK-N-${stamp}`,
      candidatId: seedAuthId,
      etablissementId: etab.id,
      filiereId: filiere.id,
      anneeAcademique: anneeN,
      niveau: 1,
      status: 'DRAFT',
    },
  });
  const appOther = await prisma.application.create({
    data: {
      numeroApplication: `SMK-O-${stamp}`,
      candidatId: seedAuthId,
      etablissementId: etab.id,
      filiereId: filiere.id,
      anneeAcademique: '2024-2025',
      niveau: 1,
      status: 'DRAFT',
    },
  });

  // --- Test 1: filtre candidatures ---
  const allApps = await api('GET', '/applications/etablissement/applications', tokenAdmin);
  const filteredApps = await api(
    'GET',
    `/applications/etablissement/applications?anneeAcademique=${encodeURIComponent(anneeN)}`,
    tokenAdmin,
  );
  const allIds = (allApps.data?.applications || []).map((a) => a.id);
  const filteredIds = (filteredApps.data?.applications || []).map((a) => a.id);
  const filterOk =
    allApps.status === 200 &&
    filteredApps.status === 200 &&
    filteredIds.includes(appN.id) &&
    !filteredIds.includes(appOther.id) &&
    allIds.includes(appN.id) &&
    allIds.includes(appOther.id);
  if (filterOk) {
    pass(
      '1. Filtre année candidatures admin',
      `all=${allIds.length} filtered=${filteredIds.length} containsN=${filteredIds.includes(appN.id)} excludesOther=${!filteredIds.includes(appOther.id)}`,
    );
  } else {
    fail(
      '1. Filtre année candidatures admin',
      `all=${allApps.status}/${allIds.length} filtered=${filteredApps.status}/${filteredIds.length}`,
    );
  }

  // Préinscriptions pour filtre
  const preinN = await prisma.preinscriptionEtablissement.create({
    data: {
      numeroPreinscription: `SMK-PN-${stamp}`,
      candidatId: seedAuthId,
      etablissementId: etab.id,
      filiereId: filiere.id,
      anneeAcademique: anneeN,
      niveau: 1,
      statut: 'EN_ATTENTE',
    },
  });
  const preinOther = await prisma.preinscriptionEtablissement.create({
    data: {
      numeroPreinscription: `SMK-PO-${stamp}`,
      candidatId: seedAuthId,
      etablissementId: etab.id,
      filiereId: filiere.id,
      anneeAcademique: '2024-2025',
      niveau: 1,
      statut: 'EN_ATTENTE',
    },
  });

  // --- Test 2: filtre préinscriptions ---
  const allPrein = await api(
    'GET',
    '/preinscriptions-etablissement/etablissement/demandes?statut=EN_ATTENTE',
    tokenAdmin,
  );
  const filteredPrein = await api(
    'GET',
    `/preinscriptions-etablissement/etablissement/demandes?statut=EN_ATTENTE&anneeAcademique=${encodeURIComponent(anneeN)}`,
    tokenAdmin,
  );
  const allPreinIds = (allPrein.data?.demandes || []).map((d) => d.id);
  const filteredPreinIds = (filteredPrein.data?.demandes || []).map((d) => d.id);
  const preinFilterOk =
    allPrein.status === 200 &&
    filteredPrein.status === 200 &&
    filteredPreinIds.includes(preinN.id) &&
    !filteredPreinIds.includes(preinOther.id);
  if (preinFilterOk) {
    pass(
      '2. Filtre année préinscriptions admin',
      `all=${allPreinIds.length} filtered=${filteredPreinIds.length}`,
    );
  } else {
    fail(
      '2. Filtre année préinscriptions admin',
      `all=${allPrein.status} filtered=${filteredPrein.status} ids=${JSON.stringify(filteredPreinIds.slice(0, 3))}`,
    );
  }

  // Candidat éligible (VALIDE N-1) + campagne N
  const emailEligible = `harrydedji+smoke-elig-${stamp}@gmail.com`;
  const eligAuthId = await ensureAuthUser(emailEligible, PASSWORD, { role: 'CANDIDAT' });
  await prisma.candidat.upsert({
    where: { id: eligAuthId },
    create: {
      id: eligAuthId,
      email: emailEligible,
      matricule: `SMK-ELIG-${stamp}`,
      nom: 'Eligible',
      prenom: 'Reinscrip',
      telephone: '90000002',
    },
    update: { email: emailEligible },
  });

  await prisma.inscriptionAcademique.create({
    data: {
      candidatId: eligAuthId,
      etablissementId: etab.id,
      filiereId: filiere.id,
      anneeAcademique: anneeN1,
      niveau: 1,
      statut: 'VALIDE',
    },
  });

  // Campagne N + CampagneFiliere
  const campagne = await prisma.campagneInscription.create({
    data: {
      etablissementId: etab.id,
      titre: `Smoke réinscription ${stamp}`,
      anneeAcademique: anneeN,
      dateOuverture: new Date(Date.now() - 86400000),
      dateCloture: new Date(Date.now() + 30 * 86400000),
      statut: 'PUBLIEE',
      description: 'Smoke test',
      createdBy: adminAuthId,
    },
  });
  const cf = await prisma.campagneFiliere.create({
    data: {
      campagneId: campagne.id,
      filiereId: filiere.id,
      fraisDossier: 10000,
      placesDisponibles: 50,
    },
  });

  const tokenElig = await login(emailEligible, PASSWORD);
  const mesInsc = await api('GET', '/inscriptions-academiques/mes-inscriptions', tokenElig);
  const eligible = isEligibleReinscription(mesInsc.data?.inscriptions || [], {
    filiereId: filiere.id,
    anneeCampagne: anneeN,
  });

  // --- Test 3 ---
  if (mesInsc.status === 200 && eligible) {
    pass(
      '3. Candidat VALIDE N-1 → bouton "Se réinscrire"',
      `anneeN1=${anneeN1} eligible=true (UI: Se réinscrire)`,
    );
  } else {
    fail('3. Candidat VALIDE N-1 → bouton "Se réinscrire"', `status=${mesInsc.status} eligible=${eligible}`);
  }

  // Candidat sans N-1
  const emailNo = `harrydedji+smoke-no-${stamp}@gmail.com`;
  const noAuthId = await ensureAuthUser(emailNo, PASSWORD, { role: 'CANDIDAT' });
  await prisma.candidat.upsert({
    where: { id: noAuthId },
    create: {
      id: noAuthId,
      email: emailNo,
      matricule: `SMK-NO-${stamp}`,
      nom: 'Sans',
      prenom: 'Inscription',
      telephone: '90000003',
    },
    update: { email: emailNo },
  });
  const tokenNo = await login(emailNo, PASSWORD);
  const mesInscNo = await api('GET', '/inscriptions-academiques/mes-inscriptions', tokenNo);
  const eligibleNo = isEligibleReinscription(mesInscNo.data?.inscriptions || [], {
    filiereId: filiere.id,
    anneeCampagne: anneeN,
  });

  // --- Test 4 ---
  if (mesInscNo.status === 200 && !eligibleNo) {
    pass('4. Candidat sans N-1 → bouton "Postuler"', 'eligible=false (UI: Postuler)');
  } else {
    fail('4. Candidat sans N-1 → bouton "Postuler"', `eligible=${eligibleNo}`);
  }

  // --- Test 5: créer Application année N (réinscription) ---
  const create1 = await api('POST', '/applications', tokenElig, {
    etablissementId: etab.id,
    filiereId: filiere.id,
    anneeAcademique: anneeN,
    niveau: 2,
    campagneFiliereId: cf.id,
  });
  if (create1.status === 201 && create1.data?.application?.anneeAcademique === anneeN) {
    pass(
      '5. Se réinscrire → Application année N créée',
      `status=201 id=${create1.data.application.id} niveau=${create1.data.application.niveau} (saisie libre=2)`,
    );
  } else {
    fail(
      '5. Se réinscrire → Application année N créée',
      `status=${create1.status} body=${JSON.stringify(create1.data)?.slice(0, 250)}`,
    );
  }

  // --- Test 6: double réinscription → 409 ---
  const create2 = await api('POST', '/applications', tokenElig, {
    etablissementId: etab.id,
    filiereId: filiere.id,
    anneeAcademique: anneeN,
    niveau: 3,
    campagneFiliereId: cf.id,
  });
  if (create2.status === 409) {
    pass('6. Double réinscription bloquée (409)', create2.data?.error || 'P2002');
  } else {
    fail('6. Double réinscription bloquée (409)', `status=${create2.status} body=${JSON.stringify(create2.data)?.slice(0, 200)}`);
  }

  // Cleanup best-effort
  try {
    if (create1.data?.application?.id) {
      await prisma.applicationDocument.deleteMany({ where: { applicationId: create1.data.application.id } });
      await prisma.application.delete({ where: { id: create1.data.application.id } }).catch(() => {});
    }
    await prisma.application.deleteMany({ where: { id: { in: [appN.id, appOther.id] } } });
    await prisma.preinscriptionEtablissement.deleteMany({ where: { id: { in: [preinN.id, preinOther.id] } } });
    await prisma.campagneFiliere.delete({ where: { id: cf.id } }).catch(() => {});
    await prisma.campagneInscription.delete({ where: { id: campagne.id } }).catch(() => {});
    await prisma.inscriptionAcademique.deleteMany({
      where: { candidatId: eligAuthId, anneeAcademique: anneeN1 },
    });
  } catch (e) {
    console.warn('Cleanup partiel:', e.message);
  }

  printSummary();
  const failed = results.filter((r) => !r.ok).length;
  process.exit(failed ? 1 : 0);
}

function printSummary() {
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n=== Résumé: ${ok}/${results.length} OK ===\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
