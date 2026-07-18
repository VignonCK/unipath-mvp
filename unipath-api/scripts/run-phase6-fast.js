/**
 * Phase 6 — runner rapide : scripts en parallèle (lots), timeout 90s chacun.
 */
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const TESTS = [
  'test-routes-securite.js',
  'scripts/test-phase6-regression-e2e.js',
  'scripts/test-phase1-dec-auth.js',
  'scripts/test-phase2-dec-module1.js',
  'scripts/test-phase2b-ambigus.js',
  'scripts/test-phase2b-numeros-convocation.js',
  'scripts/test-phase3-module2-audit.js',
  'scripts/test-phase4-dashboards.js',
  'scripts/test-phase5-textes-dec.js',
  'scripts/test-etude-cloturee.js',
  'scripts/test-attribuer-numeros-table.js',
  'scripts/test-staff-etablissement-scope.js',
  'scripts/test-par-etab-and-stats-acad.js',
  'scripts/test-convocation-centre-guard.js',
  'scripts/test-stats-filters.js',
  'scripts/test-stats-export.js',
  'scripts/verify-centres-composition-flow.js',
  // skip test-centre-composition-api.js (missing jsonwebtoken — known env issue)
];

function runOne(file) {
  return new Promise((resolve) => {
    const name = path.basename(file);
    const started = Date.now();
    const child = spawn(process.execPath, [file], {
      cwd: ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    const onData = (d) => {
      out += d.toString();
      if (out.length > 8000) out = out.slice(-8000);
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ name, pass: false, status: 'TIMEOUT', ms: Date.now() - started, out });
    }, 90000);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ name, pass: code === 0, status: code, ms: Date.now() - started, out });
    });
  });
}

async function runBatch(files) {
  return Promise.all(files.map(runOne));
}

(async () => {
  const results = [];
  // 3 parallel batches to avoid DB pool exhaustion
  const size = 4;
  for (let i = 0; i < TESTS.length; i += size) {
    const batch = TESTS.slice(i, i + size);
    console.log(`\n▶ Lot ${i / size + 1}: ${batch.map((f) => path.basename(f)).join(', ')}`);
    const batchResults = await runBatch(batch);
    for (const r of batchResults) {
      console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}  (${r.ms}ms exit=${r.status})`);
      if (!r.pass) {
        const lines = r.out.split(/\r?\n/).filter(Boolean).slice(-8);
        console.log('   ' + lines.join('\n   '));
      }
      results.push(r);
    }
  }
  console.log('\n════════ RÉCAP ════════');
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}`);
  const fail = results.filter((r) => !r.pass);
  console.log(`Total ${results.length} | PASS ${results.length - fail.length} | FAIL ${fail.length}`);
  process.exit(fail.length ? 1 : 0);
})();
