/**
 * Vérification statique de la sécurité des routes (checkRole / protect).
 *
 * Ce n'est PAS un smoke test optionnel : un vert ici signifie que les
 * déclarations de rôles dans le code correspondent à la politique attendue.
 * Un vert sur d'anciennes attentes (DGES sur Module 1) donnerait une fausse
 * impression de sécurité après la séparation DEC/DGES.
 *
 * Politique :
 *   DEC  = Module 1 (concours)
 *   DGES = Module 2 (établissements privés)
 * Voir docs/DEC-VS-DGES.md
 *
 * Usage: node test-routes-securite.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification sécurité des routes (DEC Module 1 / DGES Module 2)…\n');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(description, condition) {
  totalTests++;
  if (condition) {
    console.log(`${colors.green}✅${colors.reset} ${description}`);
    passedTests++;
    return true;
  }
  console.log(`${colors.red}❌${colors.reset} ${description}`);
  failedTests++;
  return false;
}

function readRouteFile(filename) {
  const filePath = path.join(__dirname, 'src', 'routes', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier routes manquant: ${filename}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function readMaybe(filename) {
  const filePath = path.join(__dirname, 'src', 'routes', filename);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

/** Normalise le source (une ligne) pour des includes robustes. */
function flat(src) {
  return src.replace(/\s+/g, ' ');
}

/** Extrait les tableaux de rôles littéraux dans checkRole([...]). */
function extractLiteralRoleArrays(src) {
  const arrays = [];
  const re = /checkRole\(\[([^\]]*)\]\)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const roles = [...m[1].matchAll(/['"]([A-Z_]+)['"]/g)].map((x) => x[1]);
    arrays.push({ raw: m[0], roles, index: m.index });
  }
  return arrays;
}

/** Résout aussi checkRole(CONST) si CONST = ['A','B'] est déclaré dans le fichier. */
function extractNamedRoleArrays(src) {
  const named = [];
  const declRe = /(?:const|let|var)\s+([A-Z_][A-Z0-9_]*)\s*=\s*\[([^\]]*)\]/g;
  const decls = {};
  let m;
  while ((m = declRe.exec(src)) !== null) {
    decls[m[1]] = [...m[2].matchAll(/['"]([A-Z_]+)['"]/g)].map((x) => x[1]);
  }
  const useRe = /checkRole\(([A-Z_][A-Z0-9_]*)\)/g;
  while ((m = useRe.exec(src)) !== null) {
    if (decls[m[1]]) {
      named.push({ raw: m[0], roles: decls[m[1]], index: m.index, name: m[1] });
    }
  }
  return named;
}

function allRoleChecks(src) {
  return [...extractLiteralRoleArrays(src), ...extractNamedRoleArrays(src)];
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((r, i) => r === sb[i]);
}

function hasExactRoleCheck(src, expectedRoles) {
  return allRoleChecks(src).some((c) => sameSet(c.roles, expectedRoles));
}

function everyLiteralCheck(src, predicate) {
  const checks = extractLiteralRoleArrays(src);
  return checks.length > 0 && checks.every(predicate);
}

function section(title) {
  console.log(`\n${colors.blue}${title}${colors.reset}`);
}

// ─── Helpers DEC / DGES ───────────────────────────────────────────
function assertM1HasDecNotDges(src, label) {
  const checks = allRoleChecks(src);
  const withDec = checks.filter((c) => c.roles.includes('DEC'));
  const withDges = checks.filter((c) => c.roles.includes('DGES'));
  test(
    `${label}: au moins un checkRole inclut DEC`,
    withDec.length > 0,
  );
  test(
    `${label}: aucun checkRole Module 1 n'inclut DGES`,
    withDges.length === 0,
  );
}

// ========================================
section('📧 Notifications (Module 1 — DEC, pas DGES)');
// ========================================
const notificationsRoutes = readRouteFile('notifications.routes.js');
test(
  'POST notifications → COMMISSION + CONTROLEUR + DEC',
  hasExactRoleCheck(notificationsRoutes, ['COMMISSION', 'CONTROLEUR', 'DEC']),
);
test(
  'POST notifications : pas de DGES',
  !flat(notificationsRoutes).includes("'DGES'"),
);
test(
  'GET/PATCH délèguent au contrôleur',
  notificationsRoutes.includes('notificationController.getUnreadCount') &&
    notificationsRoutes.includes('notificationController.markAllAsRead') &&
    notificationsRoutes.includes('notificationController.getNotifications') &&
    notificationsRoutes.includes('notificationController.markAsRead'),
);

// ========================================
section('🎓 Concours (Module 1 — CRUD DEC)');
// ========================================
const concoursRoutes = readRouteFile('concours.routes.js');
test(
  'GET / utilise protectOptional',
  flat(concoursRoutes).includes("router.get('/', protectOptional, concoursController.getAllConcours)"),
);
test(
  'GET /:id utilise protectOptional',
  flat(concoursRoutes).includes("router.get('/:id', protectOptional, concoursController.getConcoursById)"),
);
test(
  'GET classement → COMMISSION + DEC + CONTROLEUR (pas DGES)',
  hasExactRoleCheck(concoursRoutes, ['COMMISSION', 'DEC', 'CONTROLEUR']),
);
test(
  'POST/PUT/DELETE concours → DEC seul',
  hasExactRoleCheck(concoursRoutes, ['DEC']) &&
    flat(concoursRoutes).includes("router.post('/', protect, checkRole(['DEC'])") &&
    flat(concoursRoutes).includes("router.put('/:id', protect, checkRole(['DEC'])") &&
    flat(concoursRoutes).includes("router.delete('/:id', protect, checkRole(['DEC'])"),
);
test(
  'Concours : DGES absent des checkRole',
  !flat(concoursRoutes).includes("'DGES'"),
);

// ========================================
section('🏛️ DEC stats + dges.routes (split M1/M2)');
// ========================================
const decRoutes = readRouteFile('dec.routes.js');
const dgesRoutes = readRouteFile('dges.routes.js');
test(
  'GET /api/dec/statistiques → DEC + COMMISSION',
  hasExactRoleCheck(decRoutes, ['DEC', 'COMMISSION']),
);
test(
  'GET /api/dges/statistiques → DGES seul (Module 2)',
  hasExactRoleCheck(dgesRoutes, ['DGES']) &&
    flat(dgesRoutes).includes("router.get('/statistiques', protect, checkRole(['DGES'])"),
);
test(
  'Clôture / réouverture / n° table (URL /dges/concours/…) → DEC seul',
  flat(dgesRoutes).includes("'/concours/:concoursId/cloturer-etude'") &&
    flat(dgesRoutes).includes("'/concours/:concoursId/rouvrir-etude'") &&
    flat(dgesRoutes).includes("'/concours/:concoursId/generer-numeros-table'") &&
    (dgesRoutes.match(/checkRole\(\['DEC'\]\)/g) || []).length >= 3,
);
test(
  'Actions concours sous /api/dges/concours : pas de checkRole DGES',
  !/concours\/:concoursId[\s\S]{0,200}checkRole\(\[[^\]]*DGES/.test(dgesRoutes),
);

// ========================================
section('🏫 Module 2 — établissements (DGES seul, pas DEC)');
// ========================================
const adminEtabRoutes = readRouteFile('adminEtablissement.routes.js');
const commissionEtabRoutes = readRouteFile('commissionEtablissement.routes.js');
test(
  'adminEtablissement : tous les checkRole = DGES seul',
  everyLiteralCheck(adminEtabRoutes, (c) => sameSet(c.roles, ['DGES'])),
);
test(
  'adminEtablissement : DEC absent',
  !flat(adminEtabRoutes).includes("'DEC'"),
);
test(
  'commissionEtablissement : checkRole DGES (pas DEC)',
  everyLiteralCheck(commissionEtabRoutes, (c) => sameSet(c.roles, ['DGES'])) &&
    !flat(commissionEtabRoutes).includes("'DEC'"),
);

// ========================================
section('👥 Commission concours (DEC)');
// ========================================
const commissionConcoursRoutes = readRouteFile('commissionConcours.routes.js');
assertM1HasDecNotDges(commissionConcoursRoutes, 'commissionConcours');

const centreRoutes = readRouteFile('centreComposition.routes.js');
assertM1HasDecNotDges(centreRoutes, 'centreComposition');

// ========================================
section('📝 Inscription (CANDIDAT + uploads DEC)');
// ========================================
const inscriptionRoutes = readRouteFile('inscription.routes.js');
test(
  'POST / réservée aux CANDIDAT',
  flat(inscriptionRoutes).includes("router.post('/', protect, checkRole(['CANDIDAT'])"),
);
test(
  'POST quittance réservée aux CANDIDAT',
  flat(inscriptionRoutes).includes("checkRole(['CANDIDAT'])") &&
    inscriptionRoutes.includes('quittance'),
);
test(
  'PUT pieces-extras réservée aux CANDIDAT',
  flat(inscriptionRoutes).includes("router.put('/:inscriptionId/pieces-extras', protect, checkRole(['CANDIDAT'])"),
);
test(
  'DELETE inscription réservée aux CANDIDAT',
  flat(inscriptionRoutes).includes("router.delete('/:inscriptionId', protect, checkRole(['CANDIDAT'])"),
);
test(
  'Upload dossier-concours (admin) → inclut DEC, pas DGES',
  hasExactRoleCheck(inscriptionRoutes, ['CANDIDAT', 'COMMISSION', 'CONTROLEUR', 'DEC']) &&
    !/dossier-concours[\s\S]{0,120}DGES/.test(inscriptionRoutes),
);

// ========================================
section('📁 Dossier');
// ========================================
const dossierRoutes = readRouteFile('dossier.routes.js');
test(
  'POST /upload réservée aux CANDIDAT',
  /router\.post\(\s*['"]\/upload['"][\s\S]*?checkRole\(\['CANDIDAT'\]\)/.test(dossierRoutes),
);
test(
  'Dossier personnel lecture/écriture → DEC (pas DGES)',
  hasExactRoleCheck(dossierRoutes, ['CANDIDAT', 'COMMISSION', 'CONTROLEUR', 'DEC']) &&
    !/dossier-personnel[\s\S]{0,150}DGES/.test(dossierRoutes),
);
test(
  'signed-url : DEC + DGES présents (filtre module côté contrôleur)',
  hasExactRoleCheck(dossierRoutes, [
    'COMMISSION',
    'CONTROLEUR',
    'DEC',
    'DGES',
    'CANDIDAT',
    'ETUDIANT',
    'ADMIN_ETABLISSEMENT',
  ]),
);

// ========================================
section('📜 History');
// ========================================
const historyRoutes = readRouteFile('history.routes.js');
test(
  'audit/rapport → COMMISSION + DEC + DGES + CONTROLEUR',
  hasExactRoleCheck(historyRoutes, ['COMMISSION', 'DEC', 'DGES', 'CONTROLEUR']),
);
test(
  'export/csv → COMMISSION + DEC + DGES + CONTROLEUR',
  hasExactRoleCheck(historyRoutes, ['COMMISSION', 'DEC', 'DGES', 'CONTROLEUR']) &&
    historyRoutes.includes('export/csv'),
);
test(
  'HISTORY_WRITE_ROLES inclut DEC et DGES',
  historyRoutes.includes("HISTORY_WRITE_ROLES") &&
    flat(historyRoutes).includes("'DEC'") &&
    flat(historyRoutes).includes("'DGES'"),
);

// ========================================
section('📊 Completion (Module 1 — DEC, pas DGES)');
// ========================================
const completionRoutes = readRouteFile('completion.routes.js');
test(
  'stats/global → COMMISSION + DEC + CONTROLEUR',
  hasExactRoleCheck(completionRoutes, ['COMMISSION', 'DEC', 'CONTROLEUR']),
);
test(
  'Completion : DGES absent',
  !flat(completionRoutes).includes("'DGES'"),
);

// ========================================
section('🎯 Controleur + Auth + Candidat');
// ========================================
const controleurRoutes = readRouteFile('controleur.routes.js');
test(
  'Controleur : PATCH valider (pas PUT)',
  controleurRoutes.includes("router.patch('/dossiers/:inscriptionId/valider'") &&
    !controleurRoutes.includes("router.put('/dossiers/:inscriptionId/valider'"),
);
test(
  'Controleur : middleware CONTROLEUR',
  flat(controleurRoutes).includes("checkRole(['CONTROLEUR'])"),
);

const authRoutes = readRouteFile('auth.routes.js');
test(
  'commissionAuthController non importé actif',
  authRoutes.includes('// const commissionAuthController') ||
    !authRoutes.includes(
      "const commissionAuthController = require('../controllers/commission.auth.controller')",
    ),
);

const candidatRoutes = readRouteFile('candidat.routes.js');
test(
  'Convocation / préinscription → CANDIDAT',
  flat(candidatRoutes).includes(
    "router.get('/convocation/:inscriptionId', protect, checkRole(['CANDIDAT'])",
  ) &&
    flat(candidatRoutes).includes(
      "router.get('/preinscription/:inscriptionId', protect, checkRole(['CANDIDAT'])",
    ),
);

// ========================================
section('📄 PDF routes (obsolète ou absent)');
// ========================================
const pdfRoutes = readMaybe('pdf.routes.js');
if (pdfRoutes === null) {
  test('pdf.routes.js absent (routes dans candidat.routes.js) — OK', true);
} else {
  test(
    'pdf.routes.js documenté comme obsolète',
    pdfRoutes.includes('FICHIER OBSOLÈTE') ||
      pdfRoutes.includes('Routes PDF gérées dans candidat.routes.js'),
  );
  test(
    'pdf.routes.js sans routes actives',
    !pdfRoutes.includes("router.get('/convocation") &&
      !pdfRoutes.includes("router.get('/preinscription"),
  );
}

// ========================================
section('🔔 Contrôleur Notification');
// ========================================
const notificationController = fs.readFileSync(
  path.join(__dirname, 'src', 'controllers', 'notification.controller.js'),
  'utf8',
);
test(
  'Méthodes notification exportées',
  notificationController.includes('getUnreadCount') &&
    notificationController.includes('markAllAsRead') &&
    notificationController.includes('getNotifications') &&
    notificationController.includes('markAsRead'),
);

// ========================================
section('📌 Notes académiques (Module 2 — pas DEC/DGES admin)');
// ========================================
const notesRoutes = readRouteFile('notes.routes.js');
test(
  'NOTES_WRITE_ROLES = COMMISSION + CONTROLEUR + ADMIN_ETABLISSEMENT',
  hasExactRoleCheck(notesRoutes, ['COMMISSION', 'CONTROLEUR', 'ADMIN_ETABLISSEMENT']),
);
test(
  'Notes acad : ni DEC ni DGES dans les rôles d\'écriture',
  !flat(notesRoutes).includes("'DEC'") && !flat(notesRoutes).includes("'DGES'"),
);

// ========================================
console.log(`\n${'='.repeat(60)}`);
console.log(`${colors.blue}📊 RÉSUMÉ${colors.reset}`);
console.log(`${'='.repeat(60)}`);
console.log(`Total : ${totalTests}`);
console.log(`${colors.green}✅ Réussis : ${passedTests}${colors.reset}`);
console.log(`${colors.red}❌ Échoués : ${failedTests}${colors.reset}`);
console.log(`Taux : ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log(`\n${colors.green}🎉 Politique DEC (M1) / DGES (M2) respectée sur les routes contrôlées.${colors.reset}\n`);
  process.exit(0);
}
console.log(`\n${colors.red}⚠️  Échecs — les checkRole ne reflètent pas la séparation DEC/DGES.${colors.reset}\n`);
process.exit(1);
