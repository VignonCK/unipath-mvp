/**
 * Tests de sécurité scope staff établissement (sous-rôles).
 * Usage: node scripts/test-staff-etablissement-scope.js
 *
 * Vérifie :
 * 1. Contrôleur école A ne peut PAS accéder aux préinscriptions école B
 * 2. Superviseur ne peut PAS forger un etablissementId différent
 * 3. Contrôleur ne peut PAS accéder aux stats
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const {
  canCreateStaffSousRole,
  canDeleteStaffMember,
  assertStaffScope,
  adminOwnsEtablissement,
  hasSousRoleEtablissement,
  STAFF_STATS_ROLES,
  SOUS_ROLES_ETABLISSEMENT,
} = require('../src/utils/admin-etablissement.helper');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

const API = process.env.API_BASE_URL || 'http://localhost:3001/api';
const PASSWORD = 'ScopeTest2026!';

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
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    data = null;
  }
  return { status: res.status, data };
}

async function cleanup(ids) {
  for (const id of ids) {
    try {
      await prisma.adminEtablissement.deleteMany({ where: { id } });
    } catch (_) { /* ignore */ }
    try {
      await supabaseAdmin.auth.admin.deleteUser(id);
    } catch (_) { /* ignore */ }
  }
}

async function main() {
  console.log('\n=== Tests sécurité scope staff établissement ===\n');

  // Unit tests helpers (no HTTP)
  if (canCreateStaffSousRole('ADMIN', 'SUPERVISEUR') && canCreateStaffSousRole('ADMIN', 'CONTROLEUR')) {
    pass('Helper: ADMIN peut créer SUPERVISEUR et CONTROLEUR');
  } else {
    fail('Helper: ADMIN peut créer SUPERVISEUR et CONTROLEUR');
  }

  if (canCreateStaffSousRole('SUPERVISEUR', 'CONTROLEUR') && !canCreateStaffSousRole('SUPERVISEUR', 'SUPERVISEUR')) {
    pass('Helper: SUPERVISEUR peut créer CONTROLEUR seulement');
  } else {
    fail('Helper: SUPERVISEUR peut créer CONTROLEUR seulement');
  }

  if (canDeleteStaffMember('SUPERVISEUR', 'CONTROLEUR') && !canDeleteStaffMember('SUPERVISEUR', 'SUPERVISEUR')) {
    pass('Helper: SUPERVISEUR peut supprimer tous les CONTROLEUR');
  } else {
    fail('Helper: SUPERVISEUR peut supprimer tous les CONTROLEUR');
  }

  try {
    assertStaffScope({ userRole: 'ADMIN_ETABLISSEMENT', etablissementId: null, user: {} });
    fail('Helper: assertStaffScope refuse scope null');
  } catch (err) {
    if (err.status === 403) pass('Helper: assertStaffScope refuse scope null');
    else fail('Helper: assertStaffScope refuse scope null', err.message);
  }

  const etabs = await prisma.etablissement.findMany({
    where: { type: 'PRIVE' },
    select: { id: true, nom: true },
    take: 2,
    orderBy: { nom: 'asc' },
  });

  if (etabs.length < 2) {
    fail('Prérequis: au moins 2 établissements privés en base');
    process.exitCode = 1;
    return;
  }

  const [etabA, etabB] = etabs;
  console.log(`École A: ${etabA.nom}`);
  console.log(`École B: ${etabB.nom}\n`);

  const emailCtrlA = `harrydedji+scope-ctrl-a-${Date.now()}@gmail.com`;
  const emailSupA = `harrydedji+scope-sup-a-${Date.now()}@gmail.com`;
  const emailCtrlB = `harrydedji+scope-ctrl-b-${Date.now()}@gmail.com`;

  const idCtrlA = await ensureAuthUser(emailCtrlA, PASSWORD, {
    role: 'ADMIN_ETABLISSEMENT',
    sousRole: 'CONTROLEUR',
    etablissementId: etabA.id,
    mustChangePassword: false,
  });
  const idSupA = await ensureAuthUser(emailSupA, PASSWORD, {
    role: 'ADMIN_ETABLISSEMENT',
    sousRole: 'SUPERVISEUR',
    etablissementId: etabA.id,
    mustChangePassword: false,
  });
  const idCtrlB = await ensureAuthUser(emailCtrlB, PASSWORD, {
    role: 'ADMIN_ETABLISSEMENT',
    sousRole: 'CONTROLEUR',
    etablissementId: etabB.id,
    mustChangePassword: false,
  });

  const createdIds = [idCtrlA, idSupA, idCtrlB];

  for (const [id, email, sousRole, etabId] of [
    [idCtrlA, emailCtrlA, 'CONTROLEUR', etabA.id],
    [idSupA, emailSupA, 'SUPERVISEUR', etabA.id],
    [idCtrlB, emailCtrlB, 'CONTROLEUR', etabB.id],
  ]) {
    await prisma.adminEtablissement.upsert({
      where: { email },
      update: { sousRole, etablissementId: etabId, role: 'ADMIN_ETABLISSEMENT' },
      create: {
        id,
        email,
        nom: 'Scope',
        prenom: sousRole,
        role: 'ADMIN_ETABLISSEMENT',
        sousRole,
        etablissementId: etabId,
      },
    });
  }

  // Helper ownership cross-school
  const fakeReqCtrlA = {
    userRole: 'ADMIN_ETABLISSEMENT',
    etablissementId: etabA.id,
    user: { sousRole: 'CONTROLEUR', etablissementId: etabA.id },
  };
  if (!adminOwnsEtablissement(fakeReqCtrlA, etabB.id)) {
    pass('Helper: contrôleur A ne possède pas école B');
  } else {
    fail('Helper: contrôleur A ne possède pas école B');
  }

  if (!hasSousRoleEtablissement(fakeReqCtrlA, STAFF_STATS_ROLES)) {
    pass('Helper: contrôleur n\'a pas le droit stats');
  } else {
    fail('Helper: contrôleur n\'a pas le droit stats');
  }

  // HTTP tests (require API running)
  let apiUp = false;
  try {
    const health = await fetch(`${API.replace(/\/api$/, '')}/health`);
    apiUp = health.ok;
  } catch (_) {
    apiUp = false;
  }

  if (!apiUp) {
    fail('API locale inaccessible — tests HTTP ignorés (démarrer unipath-api)', API);
  } else {
    const tokenCtrlA = await login(emailCtrlA, PASSWORD);
    const tokenSupA = await login(emailSupA, PASSWORD);

    // Préinscription école B (si aucune, on crée un stub minimal via raw if possible)
    let preinscB = await prisma.preinscriptionEtablissement.findFirst({
      where: { etablissementId: etabB.id },
      select: { id: true },
    });

    if (!preinscB) {
      // Chercher une application/candidat pour créer une préinscription de test
      const candidat = await prisma.candidat.findFirst({ select: { id: true } });
      const filiereB = await prisma.filiere.findFirst({
        where: { etablissementId: etabB.id },
        select: { id: true },
      });
      if (candidat && filiereB) {
        preinscB = await prisma.preinscriptionEtablissement.create({
          data: {
            numeroPreinscription: `SCOPE-TEST-B-${Date.now()}`,
            candidatId: candidat.id,
            filiereId: filiereB.id,
            etablissementId: etabB.id,
            anneeAcademique: '2026-2027',
            niveau: 1,
            statut: 'EN_ATTENTE',
          },
          select: { id: true },
        });
      }
    }

    if (preinscB) {
      const decision = await api('PATCH', `/preinscriptions-etablissement/${preinscB.id}/decision`, tokenCtrlA, {
        statut: 'VALIDE',
      });
      if (decision.status === 403) {
        pass('HTTP: contrôleur école A ne peut PAS décider sur école B', `status=${decision.status}`);
      } else {
        fail('HTTP: contrôleur école A ne peut PAS décider sur école B', `status=${decision.status} body=${JSON.stringify(decision.data)}`);
      }
    } else {
      fail('HTTP: préinscription école B indisponible pour le test cross-school');
    }

    // Superviseur forge etablissementId
    const forge = await api('POST', '/etablissement/staff', tokenSupA, {
      nom: 'Forge',
      prenom: 'Test',
      email: `harrydedji+forge-${Date.now()}@gmail.com`,
      sousRole: 'CONTROLEUR',
      etablissementId: etabB.id,
    });
    if (forge.status === 403) {
      pass('HTTP: superviseur ne peut PAS forger etablissementId d\'une autre école', `status=${forge.status}`);
    } else if (forge.status === 201 && forge.data?.staff) {
      // Si créé malgré le body forgé, vérifier qu'il est bien sur école A
      const created = await prisma.adminEtablissement.findUnique({
        where: { id: forge.data.staff.id },
      });
      if (created?.etablissementId === etabA.id) {
        pass('HTTP: etablissementId forgé ignoré — compte créé sur école A uniquement');
        createdIds.push(created.id);
      } else {
        fail('HTTP: superviseur a créé un compte sur une autre école', created?.etablissementId);
        if (created) createdIds.push(created.id);
      }
    } else {
      fail('HTTP: forge etablissementId', `status=${forge.status} ${JSON.stringify(forge.data)}`);
    }

    // Contrôleur stats
    const stats = await api('GET', `/etablissements/${etabA.id}/statistiques`, tokenCtrlA);
    if (stats.status === 403) {
      pass('HTTP: contrôleur ne peut PAS accéder aux stats', `status=${stats.status}`);
    } else {
      fail('HTTP: contrôleur ne peut PAS accéder aux stats', `status=${stats.status}`);
    }

    // Superviseur stats OK — exige un vrai 200 + payload
    const statsSup = await api('GET', `/etablissements/${etabA.id}/statistiques`, tokenSupA);
    const hasData = Array.isArray(statsSup.data?.statistiques);
    if (statsSup.status === 200 && hasData) {
      pass(
        'HTTP: superviseur stats = 200 avec données',
        `status=200 rows=${statsSup.data.statistiques.length}`,
      );
    } else {
      fail(
        'HTTP: superviseur stats = 200 avec données',
        `status=${statsSup.status} hasArray=${hasData} body=${JSON.stringify(statsSup.data)?.slice(0, 200)}`,
      );
    }
  }

  await cleanup(createdIds);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== Résumé: ${results.length - failed.length}/${results.length} OK ===`);
  if (failed.length) {
    process.exitCode = 1;
    console.log('Échecs:');
    failed.forEach((f) => console.log(` - ${f.name}: ${f.detail}`));
  }
}

main()
  .catch((err) => {
    console.error('Erreur fatale:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
