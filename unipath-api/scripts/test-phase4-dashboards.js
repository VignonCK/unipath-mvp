/**
 * Phase 4 — dashboards DEC (M1) vs DGES (M2) + exports scopés.
 * Usage: node scripts/test-phase4-dashboards.js
 */

require('dotenv').config();
const ExcelJS = require('exceljs');

const BASE = process.env.API_URL || 'http://localhost:3001/api';

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function getJson(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function getBlob(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, buf, contentType: res.headers.get('content-type') || '' };
}

function ok(name, pass, detail) {
  console.log(`${pass ? '✅' : '❌'} ${name}`);
  console.log(`   ${detail}`);
  return pass;
}

function hasAnyKey(obj, keys) {
  return keys.some((k) => Object.prototype.hasOwnProperty.call(obj || {}, k));
}

async function excelSheetNames(buf) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  return wb.worksheets.map((ws) => ws.name);
}

async function main() {
  console.log(`API: ${BASE}\n`);
  const results = [];

  const decLogin = await login('dec@test.com', 'password123');
  const dgesLogin = await login('dges@test.com', 'password123');
  const decToken = decLogin.body?.token;
  const dgesToken = dgesLogin.body?.token;

  results.push(
    ok(
      'Login DEC + DGES',
      decLogin.body?.user?.role === 'DEC' && dgesLogin.body?.user?.role === 'DGES',
      `DEC=${decLogin.body?.user?.role} DGES=${dgesLogin.body?.user?.role}`,
    ),
  );

  if (!decToken || !dgesToken) {
    process.exit(1);
  }

  // 1. DEC stats M1 only
  const decStats = await getJson('/dec/statistiques', decToken);
  const decKeys = Object.keys(decStats.data || {});
  results.push(
    ok(
      '1. DEC /dec/statistiques → M1 uniquement',
      decStats.status === 200
        && hasAnyKey(decStats.data, ['totaux', 'statistiques', 'parEtablissement'])
        && !hasAnyKey(decStats.data, ['totauxCampagnes', 'statistiquesCampagnes', 'parEtablissementPrive']),
      `status=${decStats.status} keys=${decKeys.join(',')} rejetes=${decStats.data?.totaux?.total_rejetes} sous_reserve=${decStats.data?.totaux?.total_sous_reserve} sexe=${JSON.stringify(decStats.data?.totaux?.repartition_sexe)}`,
    ),
  );

  // DEC cannot call DGES stats
  const decOnDges = await getJson('/dges/statistiques', decToken);
  results.push(
    ok('1b. DEC bloqué sur /dges/statistiques', decOnDges.status === 403, `status=${decOnDges.status}`),
  );

  // 2. DGES stats M2 only
  const dgesStats = await getJson('/dges/statistiques', dgesToken);
  const dgesKeys = Object.keys(dgesStats.data || {});
  results.push(
    ok(
      '2. DGES /dges/statistiques → M2 uniquement',
      dgesStats.status === 200
        && hasAnyKey(dgesStats.data, ['totauxCampagnes', 'statistiquesCampagnes', 'parEtablissementPrive'])
        && !hasAnyKey(dgesStats.data, ['totaux', 'statistiques', 'parEtablissement']),
      `status=${dgesStats.status} keys=${dgesKeys.join(',')} rejetes=${dgesStats.data?.totauxCampagnes?.total_rejetes} sous_reserve=${dgesStats.data?.totauxCampagnes?.total_sous_reserve} sexe=${JSON.stringify(dgesStats.data?.totauxCampagnes?.repartition_sexe)}`,
    ),
  );

  const dgesOnDec = await getJson('/dec/statistiques', dgesToken);
  results.push(
    ok('2b. DGES bloqué sur /dec/statistiques', dgesOnDec.status === 403, `status=${dgesOnDec.status}`),
  );

  // 5. KPI presence
  results.push(
    ok(
      '5a. KPI M1 présents (rejetés, sous réserve, sexe, parEtablissement)',
      Number.isFinite(Number(decStats.data?.totaux?.total_rejetes))
        && Number.isFinite(Number(decStats.data?.totaux?.total_sous_reserve))
        && decStats.data?.totaux?.repartition_sexe
        && Array.isArray(decStats.data?.parEtablissement),
      `ok`,
    ),
  );
  results.push(
    ok(
      '5b. KPI M2 présents (rejetés, sous réserve, sexe, parEtablissementPrive)',
      Number.isFinite(Number(dgesStats.data?.totauxCampagnes?.total_rejetes))
        && Number.isFinite(Number(dgesStats.data?.totauxCampagnes?.total_sous_reserve))
        && dgesStats.data?.totauxCampagnes?.repartition_sexe
        && Array.isArray(dgesStats.data?.parEtablissementPrive),
      `ok`,
    ),
  );

  // 3. Export DEC Excel = M1 sheets only
  const decXlsx = await getBlob('/stats/export?format=excel', decToken);
  let decSheets = [];
  if (decXlsx.status === 200) {
    decSheets = await excelSheetNames(decXlsx.buf);
  }
  const m1Sheets = ['Synthèse concours', 'Par établissement', 'Centres de composition'];
  const m2Sheets = ['Synthèse campagnes', 'EP privés par établissement'];
  results.push(
    ok(
      '3. Export Excel DEC = M1 (pas M2)',
      decXlsx.status === 200
        && m1Sheets.every((s) => decSheets.includes(s))
        && !m2Sheets.some((s) => decSheets.includes(s)),
      `status=${decXlsx.status} sheets=${decSheets.join(' | ')}`,
    ),
  );

  // 4. Export DGES Excel = M2 sheets only
  const dgesXlsx = await getBlob('/stats/export?format=excel', dgesToken);
  let dgesSheets = [];
  if (dgesXlsx.status === 200) {
    dgesSheets = await excelSheetNames(dgesXlsx.buf);
  }
  results.push(
    ok(
      '4. Export Excel DGES = M2 (pas M1)',
      dgesXlsx.status === 200
        && m2Sheets.every((s) => dgesSheets.includes(s))
        && !m1Sheets.some((s) => dgesSheets.includes(s)),
      `status=${dgesXlsx.status} sheets=${dgesSheets.join(' | ')}`,
    ),
  );

  // PDF smoke (contenu compressé : on vérifie surtout le succès + taille)
  const decPdf = await getBlob('/stats/export?format=pdf', decToken);
  const dgesPdf = await getBlob('/stats/export?format=pdf', dgesToken);
  results.push(
    ok(
      '3b/4b. PDF DEC + DGES générés',
      decPdf.status === 200
        && dgesPdf.status === 200
        && decPdf.buf.length > 500
        && dgesPdf.buf.length > 500
        && decPdf.buf.slice(0, 4).toString() === '%PDF'
        && dgesPdf.buf.slice(0, 4).toString() === '%PDF',
      `DEC bytes=${decPdf.buf.length} DGES bytes=${dgesPdf.buf.length}`,
    ),
  );

  const allOk = results.every(Boolean);
  console.log(allOk ? '\n✅ Tous les tests Phase 4 passent\n' : '\n❌ Échecs Phase 4\n');
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
