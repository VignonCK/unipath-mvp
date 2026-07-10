/**
 * Crée un admin pour chaque établissement privé sans administrateur.
 * Génère aussi un fichier texte avec les identifiants de test.
 *
 * Usage: node scripts/ensure-admin-etablissements.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { supabaseAdmin } = require('../src/supabase');
const { buildAdminEtablissementMetadata } = require('../src/utils/admin-password.helper');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const DEMO_PASSWORD = 'AdminEtab2026!';
const CREDENTIALS_FILE = path.resolve(__dirname, '../COMPTES_DEMO.txt');
const BAD_SHARED_EMAIL = 'harrydedji+admin-etab@gmail.com';

function slugFromEtablissement(etab) {
  if (etab.email) {
    const domain = String(etab.email).split('@')[1] || '';
    // contact@esae.bj -> esae ; contact@pigier-benin.bj -> pigier-benin
    const base = domain.replace(/\.bj$/i, '').replace(/\.com$/i, '').toLowerCase();
    if (base && base !== 'etab') {
      return base.replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
    }
  }

  return String(etab.nom || 'etab')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || `etab-${String(etab.id).slice(0, 8)}`;
}

function buildAdminEmail(etab) {
  return `harrydedji+admin-${slugFromEtablissement(etab)}@gmail.com`;
}

async function findAuthUserByEmail(email) {
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;
  return listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function ensureSupabaseUser(email, password, metadata) {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (!authError) {
    return { userId: authData.user.id, created: true };
  }

  const dejaExistant =
    authError.message.includes('already registered') ||
    authError.message.includes('already been registered');
  if (!dejaExistant) {
    throw authError;
  }

  const existing = await findAuthUserByEmail(email);
  if (!existing) {
    throw new Error(`Utilisateur ${email} introuvable dans Supabase Auth`);
  }

  await supabaseAdmin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: {
      ...(existing.user_metadata || {}),
      ...metadata,
      mustChangePassword: false,
    },
  });

  return { userId: existing.id, created: false };
}

async function cleanupBadSharedAdmin() {
  const bad = await prisma.adminEtablissement.findUnique({ where: { email: BAD_SHARED_EMAIL } });
  if (!bad) return;

  console.log(`Nettoyage du compte partagé erroné ${BAD_SHARED_EMAIL}...`);
  await prisma.adminEtablissement.delete({ where: { id: bad.id } });

  try {
    await supabaseAdmin.auth.admin.deleteUser(bad.id);
    console.log('  → Auth Supabase supprimé');
  } catch (err) {
    console.log(`  → Auth Supabase: ${err.message}`);
  }
}

async function ensureAdminForEtablissement(etab) {
  const email = buildAdminEmail(etab);
  const slug = slugFromEtablissement(etab);
  const nom = slug.split('-')[0].toUpperCase().slice(0, 20) || 'ETAB';
  const prenom = 'Admin';
  const hash = Math.abs(slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const telephone = `+22962${String(hash).padStart(6, '0').slice(0, 6)}`;

  const metadata = {
    ...buildAdminEtablissementMetadata(etab.id),
    mustChangePassword: false,
  };
  delete metadata.tempPasswordExpiresAt;

  const { userId, created: authCreated } = await ensureSupabaseUser(email, DEMO_PASSWORD, metadata);

  const byEmail = await prisma.adminEtablissement.findUnique({ where: { email } });
  const byId = await prisma.adminEtablissement.findUnique({ where: { id: userId } });

  let admin;
  if (byEmail) {
    admin = await prisma.adminEtablissement.update({
      where: { email },
      data: {
        nom,
        prenom,
        telephone,
        etablissementId: etab.id,
        role: 'ADMIN_ETABLISSEMENT',
      },
    });
  } else if (byId) {
    admin = await prisma.adminEtablissement.update({
      where: { id: userId },
      data: {
        email,
        nom,
        prenom,
        telephone,
        etablissementId: etab.id,
        role: 'ADMIN_ETABLISSEMENT',
      },
    });
  } else {
    admin = await prisma.adminEtablissement.create({
      data: {
        id: userId,
        email,
        nom,
        prenom,
        telephone,
        role: 'ADMIN_ETABLISSEMENT',
        etablissementId: etab.id,
      },
    });
  }

  return {
    etablissement: etab.nom,
    ville: etab.ville,
    email: admin.email,
    password: DEMO_PASSWORD,
    nom: admin.nom,
    prenom: admin.prenom,
    authCreated,
  };
}

async function main() {
  console.log('Vérification des admins établissements privés...\n');

  await cleanupBadSharedAdmin();

  const etablissements = await prisma.etablissement.findMany({
    where: { type: 'PRIVE' },
    include: {
      admins: {
        select: { id: true, email: true, nom: true, prenom: true, telephone: true },
      },
    },
    orderBy: { nom: 'asc' },
  });

  // Aperçu des emails prévus
  console.log('Emails admin prévus :');
  for (const etab of etablissements) {
    console.log(`  - ${etab.nom} → ${buildAdminEmail(etab)}`);
  }
  console.log('');

  const created = [];
  const existing = [];
  const errors = [];

  for (const etab of etablissements) {
    const hasDemoAdmin = etab.admins.some((a) => a.email.includes('harrydedji+admin-'));
    if (etab.admins.length > 0 && hasDemoAdmin) {
      existing.push({
        etablissement: etab.nom,
        ville: etab.ville,
        admins: etab.admins,
      });
      console.log(`✓ ${etab.nom} — admin démo déjà présent`);
      continue;
    }

    // École sans admin, ou avec admin(s) hors script (mot de passe inconnu) :
    // on crée un admin démo harrydedji+admin-* pour faciliter les tests.
    if (etab.admins.length > 0 && !hasDemoAdmin) {
      console.log(`→ ${etab.nom} — admin(s) existant(s) hors script, ajout d'un admin démo...`);
    }

    try {
      const result = await ensureAdminForEtablissement(etab);
      created.push(result);
      console.log(`✅ ${etab.nom} — admin créé : ${result.email}`);
    } catch (err) {
      errors.push({ etablissement: etab.nom, error: err.message });
      console.error(`❌ ${etab.nom} — ${err.message}`);
    }
  }

  const allAdmins = await prisma.adminEtablissement.findMany({
    include: {
      etablissement: { select: { nom: true, ville: true, email: true, type: true } },
    },
    orderBy: [{ etablissement: { nom: 'asc' } }, { email: 'asc' }],
  });

  const demoCandidats = await prisma.candidat.findMany({
    where: { matricule: { startsWith: 'DEMO-2026-' } },
    select: { email: true, nom: true, prenom: true, matricule: true, sexe: true },
    orderBy: { matricule: 'asc' },
  });

  const dges = await prisma.administrateurDGES.findMany({
    select: { email: true, nom: true, prenom: true },
    orderBy: { email: 'asc' },
  });

  const commissions = await prisma.membreCommission.findMany({
    select: {
      email: true,
      nom: true,
      prenom: true,
      sousRole: true,
      etablissement: { select: { nom: true } },
    },
    orderBy: { email: 'asc' },
  });

  const knownPasswords = new Map(
    created.map((c) => [c.email.toLowerCase(), c.password]),
  );
  // Comptes créés par ce script (pattern harrydedji+admin-*)
  for (const a of allAdmins) {
    if (a.email.includes('harrydedji+admin-') && a.email !== BAD_SHARED_EMAIL) {
      knownPasswords.set(a.email.toLowerCase(), DEMO_PASSWORD);
    }
  }

  const lines = [];
  lines.push('================================================================================');
  lines.push('UniPath — Identifiants de comptes de démonstration / test');
  lines.push(`Généré le : ${new Date().toISOString()}`);
  lines.push('================================================================================');
  lines.push('');
  lines.push('ATTENTION : fichier destiné aux tests locaux uniquement. Ne pas committer en prod.');
  lines.push('');

  lines.push('--------------------------------------------------------------------------------');
  lines.push('1. DGES');
  lines.push('--------------------------------------------------------------------------------');
  if (dges.length === 0) {
    lines.push('(aucun compte DGES en base)');
  } else {
    for (const a of dges) {
      lines.push(`Nom      : ${a.prenom} ${a.nom}`);
      lines.push(`Email    : ${a.email}`);
      lines.push('Password : password123   (seed-roles) ou DGES2026! (create-admins si dges@mesrs.bj)');
      lines.push('');
    }
  }

  lines.push('--------------------------------------------------------------------------------');
  lines.push('2. COMMISSION');
  lines.push('--------------------------------------------------------------------------------');
  if (commissions.length === 0) {
    lines.push('(aucun compte commission en base)');
  } else {
    for (const a of commissions) {
      lines.push(`Nom      : ${a.prenom} ${a.nom}`);
      lines.push(`Email    : ${a.email}`);
      lines.push(`Sous-rôle: ${a.sousRole}`);
      lines.push(`Étab.    : ${a.etablissement?.nom || '—'}`);
      lines.push('Password : password123   (scripts seed-roles / create-commission-sous-roles)');
      lines.push('');
    }
  }

  lines.push('--------------------------------------------------------------------------------');
  lines.push('3. ADMINISTRATEURS ÉTABLISSEMENTS PRIVÉS');
  lines.push('--------------------------------------------------------------------------------');
  lines.push(`Mot de passe commun (comptes harrydedji+admin-*) : ${DEMO_PASSWORD}`);
  lines.push('mustChangePassword = false (connexion directe pour les tests)');
  lines.push('');
  for (const a of allAdmins) {
    const pwd = knownPasswords.get(a.email.toLowerCase());
    lines.push(`Établissement : ${a.etablissement?.nom || '—'}${a.etablissement?.ville ? ` (${a.etablissement.ville})` : ''}`);
    lines.push(`Admin         : ${a.prenom} ${a.nom}`);
    lines.push(`Email         : ${a.email}`);
    lines.push(`Password      : ${pwd || '(mot de passe inconnu — compte préexistant hors script)'}`);
    lines.push('');
  }

  lines.push('--------------------------------------------------------------------------------');
  lines.push('4. CANDIDATS DÉMO (CampagneInscription / EP privés)');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('Mot de passe commun : Test2026!');
  lines.push('');
  for (const c of demoCandidats) {
    lines.push(`${c.matricule} | ${c.prenom} ${c.nom} (${c.sexe || '?'}) | ${c.email} | Test2026!`);
  }
  if (demoCandidats.length === 0) {
    lines.push('(aucun candidat DEMO-2026-* — lancer: node prisma/seed-etablissements-prives.js)');
  }

  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('RÉSUMÉ');
  lines.push('--------------------------------------------------------------------------------');
  lines.push(`Établissements privés           : ${etablissements.length}`);
  lines.push(`Admins créés / mis à jour        : ${created.length}`);
  lines.push(`Écoles qui avaient déjà un admin : ${existing.length}`);
  lines.push(`Erreurs                          : ${errors.length}`);
  lines.push(`Total admins EP en base          : ${allAdmins.length}`);
  lines.push(`Candidats démo                   : ${demoCandidats.length}`);
  lines.push(`DGES                             : ${dges.length}`);
  lines.push(`Commission                       : ${commissions.length}`);
  if (errors.length) {
    lines.push('');
    lines.push('Erreurs :');
    for (const e of errors) {
      lines.push(`- ${e.etablissement}: ${e.error}`);
    }
  }
  lines.push('');
  lines.push('================================================================================');

  fs.writeFileSync(CREDENTIALS_FILE, lines.join('\n'), 'utf8');
  console.log(`\nFichier écrit : ${CREDENTIALS_FILE}`);
  console.log(`Admins créés : ${created.length} | Déjà présents : ${existing.length} | Erreurs : ${errors.length}`);
}

main()
  .catch((err) => {
    console.error('Erreur fatale:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
