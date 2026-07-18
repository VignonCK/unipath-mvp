/**
 * Phase 2b — décisions cas ambigus (signed-url, notes, email, history).
 * Usage: node scripts/test-phase2b-ambigus.js
 */

require('dotenv').config();

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

async function req(method, path, token, { query, body } = {}) {
  const url = query ? `${BASE}${path}?${query}` : `${BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  return { status: res.status, data };
}

function ok(name, pass, detail) {
  console.log(`${pass ? '✅' : '❌'} ${name}`);
  console.log(`   ${detail}`);
  return pass;
}

async function main() {
  console.log(`API: ${BASE}\n`);
  const results = [];

  const decLogin = await login('dec@test.com', 'password123');
  const dgesLogin = await login('dges@test.com', 'password123');
  const decToken = decLogin.body?.token;
  const dgesToken = dgesLogin.body?.token;

  if (!decToken || !dgesToken) {
    console.log('❌ Login échoué');
    process.exit(1);
  }

  // Chemins types (auth filtrée avant existence réelle du fichier)
  const pathM1 = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/acteNaissance-demo.pdf';
  const pathM2 = 'applications/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/documents/piece.pdf';

  // 1. DEC → fichier Module 1 autorisé (200 ou 500 storage = OK côté auth ; pas 403)
  const decM1 = await req('GET', '/dossier/signed-url', decToken, {
    query: `path=${encodeURIComponent(pathM1)}`,
  });
  results.push(
    ok(
      '1. DEC signed-url Module 1 (pas 403)',
      decM1.status !== 403,
      `status=${decM1.status} err=${decM1.data?.error || ''}`,
    ),
  );

  // DEC → Module 2 interdit
  const decM2 = await req('GET', '/dossier/signed-url', decToken, {
    query: `path=${encodeURIComponent(pathM2)}`,
  });
  results.push(
    ok(
      '1b. DEC signed-url Module 2 → 403',
      decM2.status === 403,
      `status=${decM2.status} err=${decM2.data?.error || ''}`,
    ),
  );

  // 2. DGES → fichier Module 2 autorisé
  const dgesM2 = await req('GET', '/dossier/signed-url', dgesToken, {
    query: `path=${encodeURIComponent(pathM2)}`,
  });
  results.push(
    ok(
      '2. DGES signed-url Module 2 (pas 403)',
      dgesM2.status !== 403,
      `status=${dgesM2.status} err=${dgesM2.data?.error || ''}`,
    ),
  );

  // DGES → Module 1 interdit
  const dgesM1 = await req('GET', '/dossier/signed-url', dgesToken, {
    query: `path=${encodeURIComponent(pathM1)}`,
  });
  results.push(
    ok(
      '2b. DGES signed-url Module 1 → 403',
      dgesM1.status === 403,
      `status=${dgesM1.status} err=${dgesM1.data?.error || ''}`,
    ),
  );

  // 3. Notes concours = /commission/notes (pas /api/notes qui est M2 acad)
  // Chercher une inscription pour le PATCH (corps minimal)
  const concoursList = await req('GET', '/concours', decToken);
  const concoursItems = Array.isArray(concoursList.data)
    ? concoursList.data
    : concoursList.data?.concours || [];
  const concoursId = concoursItems[0]?.id;

  // Test rôle sur endpoint notes concours (même sans inscription valide : 403 vs 404)
  const fakeInscriptionId = '00000000-0000-0000-0000-000000000001';
  const decNotes = await req('PATCH', `/commission/notes/${fakeInscriptionId}`, decToken, {
    body: { note: 12 },
  });
  const dgesNotes = await req('PATCH', `/commission/notes/${fakeInscriptionId}`, dgesToken, {
    body: { note: 12 },
  });
  results.push(
    ok(
      '3a. DEC notes concours (/commission/notes) — pas 403 rôle',
      decNotes.status !== 403 || !String(decNotes.data?.error || '').includes('Rôle requis'),
      `status=${decNotes.status} err=${decNotes.data?.error || ''}`,
    ),
  );
  results.push(
    ok(
      '3b. DGES notes concours → 403',
      dgesNotes.status === 403,
      `status=${dgesNotes.status} err=${dgesNotes.data?.error || ''}`,
    ),
  );

  // /api/notes = M2 : ni DEC ni DGES en écriture
  const decApiNotes = await req('POST', '/notes', decToken, {
    body: {
      inscriptionAcadId: fakeInscriptionId,
      matiere: 'Math',
      credits: 3,
      semestre: 1,
    },
  });
  const dgesApiNotes = await req('POST', '/notes', dgesToken, {
    body: {
      inscriptionAcadId: fakeInscriptionId,
      matiere: 'Math',
      credits: 3,
      semestre: 1,
    },
  });
  results.push(
    ok(
      '3c. DEC POST /api/notes (M2 acad) → 403',
      decApiNotes.status === 403,
      `status=${decApiNotes.status}`,
    ),
  );
  results.push(
    ok(
      '3d. DGES POST /api/notes (M2 acad) → 403',
      dgesApiNotes.status === 403,
      `status=${dgesApiNotes.status}`,
    ),
  );

  // 4. Module 2 DGES intact
  const stats = await req('GET', '/dges/statistiques', dgesToken);
  const etabs = await req('GET', '/etablissements', dgesToken);
  const etabList = Array.isArray(etabs.data)
    ? etabs.data
    : etabs.data?.etablissements || etabs.data?.data || [];
  const etabId = etabList[0]?.id;
  let admins = { status: 0 };
  if (etabId) {
    admins = await req('GET', `/dges/etablissements/${etabId}/admins`, dgesToken);
  }
  results.push(
    ok(
      '4a. DGES stats + admins établissements',
      stats.status === 200 && (!etabId || admins.status === 200),
      `stats=${stats.status} admins=${admins.status} etab=${etabId || 'n/a'}`,
    ),
  );

  // Email ops : DEC + DGES
  const emailDec = await req('GET', '/email/health', decToken);
  const emailDges = await req('GET', '/email/health', dgesToken);
  results.push(
    ok(
      '4b. email/health DEC + DGES (ops)',
      emailDec.status === 200 && emailDges.status === 200,
      `DEC=${emailDec.status} DGES=${emailDges.status}`,
    ),
  );

  // History endpoint accessible aux deux (dette: pas de filtre module)
  const histDec = await req('GET', '/history/audit/rapport', decToken);
  const histDges = await req('GET', '/history/audit/rapport', dgesToken);
  results.push(
    ok(
      '4c. history audit DEC + DGES (accès OK, filtre module = dette)',
      histDec.status === 200 && histDges.status === 200,
      `DEC=${histDec.status} DGES=${histDges.status}`,
    ),
  );

  const allOk = results.every(Boolean);
  console.log(allOk ? '\n✅ Tous les tests Phase 2b passent\n' : '\n❌ Échecs Phase 2b\n');
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
