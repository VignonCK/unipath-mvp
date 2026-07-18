/**
 * Phase 6 — lance tous les smoke tests de la soirée + sécurité routes.
 * Usage: node scripts/run-phase6-smoke-suite.js
 */

const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const SUITE = [
  { name: 'test-routes-securite.js', cwd: ROOT, file: 'test-routes-securite.js' },
  { name: 'test-phase6-regression-e2e.js', cwd: ROOT, file: 'scripts/test-phase6-regression-e2e.js' },
  { name: 'test-phase1-dec-auth.js', cwd: ROOT, file: 'scripts/test-phase1-dec-auth.js' },
  { name: 'test-phase2-dec-module1.js', cwd: ROOT, file: 'scripts/test-phase2-dec-module1.js' },
  { name: 'test-phase2b-ambigus.js', cwd: ROOT, file: 'scripts/test-phase2b-ambigus.js' },
  { name: 'test-phase2b-numeros-convocation.js', cwd: ROOT, file: 'scripts/test-phase2b-numeros-convocation.js' },
  { name: 'test-phase3-module2-audit.js', cwd: ROOT, file: 'scripts/test-phase3-module2-audit.js' },
  { name: 'test-phase4-dashboards.js', cwd: ROOT, file: 'scripts/test-phase4-dashboards.js' },
  { name: 'test-phase5-textes-dec.js', cwd: ROOT, file: 'scripts/test-phase5-textes-dec.js' },
  { name: 'test-etude-cloturee.js', cwd: ROOT, file: 'scripts/test-etude-cloturee.js' },
  { name: 'test-attribuer-numeros-table.js', cwd: ROOT, file: 'scripts/test-attribuer-numeros-table.js' },
  { name: 'test-staff-etablissement-scope.js', cwd: ROOT, file: 'scripts/test-staff-etablissement-scope.js' },
  { name: 'test-par-etab-and-stats-acad.js', cwd: ROOT, file: 'scripts/test-par-etab-and-stats-acad.js' },
  { name: 'test-convocation-centre-guard.js', cwd: ROOT, file: 'scripts/test-convocation-centre-guard.js' },
  { name: 'test-centre-composition-api.js', cwd: ROOT, file: 'scripts/test-centre-composition-api.js' },
  { name: 'test-stats-filters.js', cwd: ROOT, file: 'scripts/test-stats-filters.js' },
  { name: 'test-stats-export.js', cwd: ROOT, file: 'scripts/test-stats-export.js' },
  { name: 'verify-centres-composition-flow.js', cwd: ROOT, file: 'scripts/verify-centres-composition-flow.js' },
];

const results = [];

console.log('═══════════════════════════════════════════════════════════');
console.log(' Phase 6 — suite smoke / régression');
console.log('═══════════════════════════════════════════════════════════\n');

for (const item of SUITE) {
  console.log(`\n▶ ${item.name}`);
  console.log('─'.repeat(50));
  const started = Date.now();
  const r = spawnSync(process.execPath, [item.file], {
    cwd: item.cwd,
    encoding: 'utf8',
    env: process.env,
    timeout: item.name.includes('staff') ? 300000 : 240000,
  });
  const ms = Date.now() - started;
  const pass = r.status === 0;
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  // Print last ~40 lines for context
  const lines = out.split(/\r?\n/).filter(Boolean);
  const tail = lines.slice(-35).join('\n');
  console.log(tail || '(pas de sortie)');
  if (r.error) console.log(`spawn error: ${r.error.message}`);
  results.push({ name: item.name, pass, status: r.status, ms });
  console.log(`\n→ ${pass ? 'PASS' : 'FAIL'} (${ms} ms, exit=${r.status})`);
}

console.log('\n\n═══════════════════════════════════════════════════════════');
console.log(' RÉCAPITULATIF Phase 6');
console.log('═══════════════════════════════════════════════════════════');
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}  (${r.ms} ms)`);
}
const failed = results.filter((r) => !r.pass);
console.log('─'.repeat(50));
console.log(`Total: ${results.length}  PASS: ${results.length - failed.length}  FAIL: ${failed.length}`);
if (failed.length) {
  console.log('Échecs:', failed.map((f) => f.name).join(', '));
}
process.exit(failed.length ? 1 : 0);
