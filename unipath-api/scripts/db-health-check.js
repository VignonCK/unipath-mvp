/**
 * Audit santé base de données UniPath
 * Usage: node scripts/db-health-check.js
 */
const prisma = require('../src/prisma');
const { supabaseAdmin } = require('../src/supabase');
const fs = require('fs');
const path = require('path');

const issues = [];
const ok = [];

function report(level, message, detail) {
  issues.push({ level, message, detail });
}

function pass(message) {
  ok.push(message);
}

async function checkMigrations() {
  const blocking = await prisma.$queryRaw`
    SELECT migration_name, started_at
    FROM _prisma_migrations
    WHERE finished_at IS NULL AND rolled_back_at IS NULL
  `;
  if (blocking.length) {
    report('CRITICAL', 'Migrations bloquantes (P3009)', blocking);
  } else {
    pass('Aucune migration bloquante');
  }

  const localMigrations = fs
    .readdirSync(path.join(__dirname, '../prisma/migrations'))
    .filter((d) => fs.statSync(path.join(__dirname, '../prisma/migrations', d)).isDirectory())
    .sort();

  const applied = await prisma.$queryRaw`
    SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL
  `;
  const appliedSet = new Set(applied.map((r) => r.migration_name));
  const missing = localMigrations.filter((m) => !appliedSet.has(m));
  if (missing.length) {
    report('CRITICAL', 'Migrations locales non appliquées en base', missing);
  } else {
    pass(`Toutes les migrations locales sont appliquées (${localMigrations.length})`);
  }
}

async function checkEnums() {
  const roles = await prisma.$queryRaw`
    SELECT unnest(enum_range(NULL::"Role"))::text AS role
  `;
  const expected = ['CANDIDAT', 'COMMISSION', 'CONTROLEUR', 'DGES', 'DEC', 'ADMIN_ETABLISSEMENT', 'ETUDIANT'];
  const found = roles.map((r) => r.role);
  const missing = expected.filter((r) => !found.includes(r));
  if (missing.length) {
    report('CRITICAL', 'Valeurs Role enum manquantes', { missing, found });
  } else {
    pass('Enum Role complet');
  }

  try {
    await prisma.$queryRaw`SELECT unnest(enum_range(NULL::"StatutCampagne"))::text AS s LIMIT 1`;
    pass('Enum StatutCampagne présent');
  } catch {
    report('CRITICAL', 'Enum StatutCampagne absent (campagnes cassées)');
  }
}

async function checkTables() {
  const required = [
    'Candidat',
    'AdminEtablissement',
    'CampagneInscription',
    'CampagneFiliere',
    'Inscription',
    'DossierInscription',
    'Etablissement',
    'Filiere',
  ];
  const rows = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `;
  const tables = new Set(rows.map((r) => r.table_name));
  const missing = required.filter((t) => !tables.has(t));
  if (missing.length) {
    report('CRITICAL', 'Tables manquantes', missing);
  } else {
    pass('Tables principales présentes');
  }
}

async function checkOrphanFks() {
  const checks = [
    {
      name: 'Inscription → Candidat',
      sql: `SELECT COUNT(*)::int AS n FROM "Inscription" i
            LEFT JOIN "Candidat" c ON c.id = i."candidatId" WHERE c.id IS NULL`,
    },
    {
      name: 'Dossier → Candidat',
      sql: `SELECT COUNT(*)::int AS n FROM "Dossier" d
            LEFT JOIN "Candidat" c ON c.id = d."candidatId" WHERE c.id IS NULL`,
    },
    {
      name: 'Notification → userId orphelin (Candidat)',
      sql: `SELECT COUNT(*)::int AS n FROM "Notification" n
            LEFT JOIN "Candidat" c ON c.id = n."userId" WHERE c.id IS NULL`,
    },
    {
      name: 'AdminEtablissement → Etablissement',
      sql: `SELECT COUNT(*)::int AS n FROM "AdminEtablissement" a
            LEFT JOIN "Etablissement" e ON e.id = a."etablissementId" WHERE e.id IS NULL`,
    },
    {
      name: 'CampagneInscription → Etablissement',
      sql: `SELECT COUNT(*)::int AS n FROM "CampagneInscription" c
            LEFT JOIN "Etablissement" e ON e.id = c."etablissementId" WHERE e.id IS NULL`,
    },
  ];

  for (const check of checks) {
    const [{ n }] = await prisma.$queryRawUnsafe(check.sql);
    if (n > 0) {
      report('WARN', `Références orphelines: ${check.name}`, { count: n });
    } else {
      pass(`FK OK: ${check.name}`);
    }
  }
}

async function checkCandidatDefaults() {
  const [{ column_default }] = await prisma.$queryRaw`
    SELECT column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Candidat' AND column_name = 'role'
  `;
  if (!column_default?.includes('ETUDIANT')) {
    report('WARN', 'Défaut colonne Candidat.role ≠ ETUDIANT', { column_default });
  } else {
    pass('Défaut Candidat.role = ETUDIANT');
  }
}

async function checkSupabaseAlignment() {
  const candidats = await prisma.candidat.findMany({
    select: { id: true, email: true },
  });
  const byEmail = new Map(candidats.map((c) => [c.email.toLowerCase(), c]));

  let page = 1;
  const mismatches = [];
  const orphansAuth = [];

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    for (const user of data.users) {
      if (!user.email) continue;
      const candidat = byEmail.get(user.email.toLowerCase());
      if (!candidat) {
        const meta = user.user_metadata || {};
        if (meta.nom || meta.prenom || meta.anip) {
          orphansAuth.push({ email: user.email, authId: user.id });
        }
        continue;
      }
      if (candidat.id !== user.id) {
        mismatches.push({
          email: user.email,
          candidatId: candidat.id,
          supabaseId: user.id,
        });
      }
    }

    if (data.users.length < 200) break;
    page += 1;
  }

  if (mismatches.length) {
    report('CRITICAL', 'IDs Candidat ≠ Supabase Auth (connexion impossible)', mismatches);
  } else {
    pass('Tous les Candidats alignés avec Supabase Auth');
  }

  if (orphansAuth.length) {
    report('WARN', 'Comptes Supabase sans Candidat (métadonnées inscription)', orphansAuth);
  } else {
    pass('Pas de compte Supabase candidat orphelin détecté');
  }
}

async function checkCounts() {
  const counts = {
    candidats: await prisma.candidat.count(),
    inscriptions: await prisma.inscription.count(),
    concours: await prisma.concours.count(),
    etablissements: await prisma.etablissement.count(),
    campagnes: prisma.campagneInscription
      ? await prisma.campagneInscription.count()
      : 'N/A (client Prisma obsolète)',
    adminsEtab: prisma.adminEtablissement
      ? await prisma.adminEtablissement.count()
      : 'N/A (client Prisma obsolète)',
  };
  console.log('\n--- Compteurs ---');
  console.log(JSON.stringify(counts, null, 2));
}

async function main() {
  console.log('=== Audit base de données UniPath ===\n');

  await checkMigrations();
  await checkEnums();
  await checkTables();
  await checkCandidatDefaults();
  await checkOrphanFks();
  await checkSupabaseAlignment();
  await checkCounts();

  console.log('\n--- OK ---');
  ok.forEach((m) => console.log(`✅ ${m}`));

  console.log('\n--- Problèmes ---');
  if (!issues.length) {
    console.log('✅ Aucun problème détecté');
  } else {
    issues.forEach(({ level, message, detail }) => {
      console.log(`\n[${level}] ${message}`);
      console.log(JSON.stringify(detail, null, 2));
    });
  }

  const critical = issues.filter((i) => i.level === 'CRITICAL').length;
  process.exitCode = critical > 0 ? 1 : 0;
}

main()
  .catch((e) => {
    console.error('FATAL:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
