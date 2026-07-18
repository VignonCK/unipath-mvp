/**
 * Phase 2/6 — bascule Module 1 concours : DEC oui, DGES non ; Module 2 reste DGES.
 * Usage: node scripts/test-phase2-dec-module1.js
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

async function req(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
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
    data = { raw: text };
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

  results.push(
    ok(
      'Prérequis login DEC + DGES',
      decLogin.status === 200 &&
        dgesLogin.status === 200 &&
        decLogin.body?.user?.role === 'DEC' &&
        dgesLogin.body?.user?.role === 'DGES',
      `DEC role=${decLogin.body?.user?.role} DGES role=${dgesLogin.body?.user?.role}`,
    ),
  );

  if (!decToken || !dgesToken) {
    console.log('\n❌ Impossible de continuer sans tokens\n');
    process.exit(1);
  }

  // ── Module 1 : DEC peut ──
  const now = Date.now();
  const createPayload = {
    libelle: `TEST PHASE2 DEC ${now}`,
    etablissement: 'EPAC',
    dateDebutDepot: new Date(now).toISOString(),
    dateFinDepot: new Date(now + 20 * 86400000).toISOString(),
    dateDebutComposition: new Date(now + 25 * 86400000).toISOString(),
    dateFinComposition: new Date(now + 30 * 86400000).toISOString(),
    fraisParticipation: 10000,
    seriesAcceptees: ['C'],
    piecesRequises: {
      pieces: [
        {
          id: 'acte_naissance',
          nom: 'Acte de naissance',
          obligatoire: true,
          formats: ['PDF', 'JPEG', 'PNG'],
        },
        {
          id: 'quittance',
          nom: 'Quittance de paiement',
          obligatoire: true,
          formats: ['PDF', 'JPEG', 'PNG'],
        },
      ],
    },
  };

  const createDec = await req('POST', '/concours', decToken, createPayload);
  let concoursId = createDec.data?.id || createDec.data?.concours?.id;
  results.push(
    ok(
      '1a. DEC crée un concours',
      createDec.status === 201 || createDec.status === 200,
      `status=${createDec.status} id=${concoursId} err=${createDec.data?.error || ''}`,
    ),
  );

  // Fallback: un concours existant pour tester les autres endpoints si création KO
  if (!concoursId) {
    const list = await req('GET', '/concours', decToken);
    const items = Array.isArray(list.data) ? list.data : list.data?.concours || [];
    concoursId = items[0]?.id;
  }

  let updateDec = { status: 0, data: {} };
  if (concoursId) {
    updateDec = await req('PUT', `/concours/${concoursId}`, decToken, {
      libelle: `${createPayload.libelle} (modifié)`,
    });
  }
  results.push(
    ok(
      '1b. DEC modifie un concours',
      !!concoursId && (updateDec.status === 200),
      `status=${updateDec.status} err=${updateDec.data?.error || ''}`,
    ),
  );

  const centresList = await req('GET', '/centres-composition', decToken);
  results.push(
    ok(
      '1c. DEC liste les centres',
      centresList.status === 200,
      `status=${centresList.status}`,
    ),
  );

  const centreCreate = await req('POST', '/centres-composition', decToken, {
    nom: `Centre Phase2 ${Date.now()}`,
    ville: 'Cotonou',
    capacite: 50,
  });
  const centreId = centreCreate.data?.id || centreCreate.data?.centre?.id;
  results.push(
    ok(
      '1d. DEC crée un centre',
      centreCreate.status === 201 || centreCreate.status === 200,
      `status=${centreCreate.status} id=${centreId} err=${centreCreate.data?.error || ''}`,
    ),
  );

  let cloture = { status: 0, data: {} };
  let rouvre = { status: 0, data: {} };
  let numeros = { status: 0, data: {} };
  if (concoursId) {
    cloture = await req('POST', `/dges/concours/${concoursId}/cloturer-etude`, decToken);
    rouvre = await req('POST', `/dges/concours/${concoursId}/rouvrir-etude`, decToken);
    numeros = await req('POST', `/dges/concours/${concoursId}/generer-numeros-table`, decToken);
  }
  results.push(
    ok(
      '1e. DEC clôture étude',
      cloture.status === 200,
      `status=${cloture.status} err=${cloture.data?.error || ''}`,
    ),
  );
  results.push(
    ok(
      '1f. DEC rouvre étude',
      rouvre.status === 200,
      `status=${rouvre.status} err=${rouvre.data?.error || ''}`,
    ),
  );
  results.push(
    ok(
      '1g. DEC génère numéros de table',
      numeros.status === 200,
      `status=${numeros.status} err=${numeros.data?.error || JSON.stringify(numeros.data).slice(0, 120)}`,
    ),
  );

  // Commission concours (lecture)
  let commission = { status: 0 };
  if (concoursId) {
    commission = await req('GET', `/dges/concours/${concoursId}/commission`, decToken);
  }
  results.push(
    ok(
      '1h. DEC lit commission concours',
      commission.status === 200,
      `status=${commission.status}`,
    ),
  );

  // ── Module 1 : DGES ne peut plus (403) ──
  const dgesCreate = await req('POST', '/concours', dgesToken, {
    ...createPayload,
    libelle: `TEST PHASE2 DGES SHOULD FAIL ${Date.now()}`,
  });
  results.push(
    ok('2a. DGES crée concours → 403', dgesCreate.status === 403, `status=${dgesCreate.status}`),
  );

  const dgesCentres = await req('GET', '/centres-composition', dgesToken);
  results.push(
    ok('2b. DGES liste centres → 403', dgesCentres.status === 403, `status=${dgesCentres.status}`),
  );

  let dgesCloture = { status: 0 };
  let dgesNumeros = { status: 0 };
  let dgesCommission = { status: 0 };
  let dgesUpdate = { status: 0 };
  if (concoursId) {
    dgesUpdate = await req('PUT', `/concours/${concoursId}`, dgesToken, { libelle: 'hack' });
    dgesCloture = await req('POST', `/dges/concours/${concoursId}/cloturer-etude`, dgesToken);
    dgesNumeros = await req('POST', `/dges/concours/${concoursId}/generer-numeros-table`, dgesToken);
    dgesCommission = await req('GET', `/dges/concours/${concoursId}/commission`, dgesToken);
  }
  results.push(
    ok('2c. DGES update concours → 403', dgesUpdate.status === 403, `status=${dgesUpdate.status}`),
  );
  results.push(
    ok('2d. DGES clôture étude → 403', dgesCloture.status === 403, `status=${dgesCloture.status}`),
  );
  results.push(
    ok('2e. DGES génère n° table → 403', dgesNumeros.status === 403, `status=${dgesNumeros.status}`),
  );
  results.push(
    ok(
      '2f. DGES commission concours → 403',
      dgesCommission.status === 403,
      `status=${dgesCommission.status}`,
    ),
  );

  // ── Module 2 : DGES continue ──
  const stats = await req('GET', '/dges/statistiques', dgesToken);
  results.push(
    ok(
      '3a. DGES stats dashboard (inchangé Phase 4) → 200',
      stats.status === 200,
      `status=${stats.status}`,
    ),
  );

  // Lister établissements via GET public ou admin route
  const etabs = await req('GET', '/etablissements', dgesToken);
  // May be public or protected — also try create path existence via listing admins if we have an etab
  let m2Ok = false;
  let m2Detail = `GET /etablissements status=${etabs.status}`;
  const etabList = Array.isArray(etabs.data)
    ? etabs.data
    : etabs.data?.etablissements || etabs.data?.data || [];
  const etabId = etabList[0]?.id;
  if (etabId) {
    const admins = await req('GET', `/dges/etablissements/${etabId}/admins`, dgesToken);
    m2Ok = admins.status === 200;
    m2Detail = `admins status=${admins.status} etab=${etabId}`;
  } else {
    // Fallback: DEC must NOT access M2 admins either if we invent id — use stats as M2-ish stay
    m2Ok = stats.status === 200;
    m2Detail += ' (pas d’établissement pour tester /admins — stats OK)';
  }
  results.push(ok('3b. DGES Module 2 établissements (admins)', m2Ok, m2Detail));

  // DEC ne doit pas accéder M2
  if (etabId) {
    const decAdmins = await req('GET', `/dges/etablissements/${etabId}/admins`, decToken);
    results.push(
      ok(
        '3c. DEC bloqué sur Module 2 admins → 403',
        decAdmins.status === 403,
        `status=${decAdmins.status}`,
      ),
    );
  }

  // Cleanup: delete only concours créé dans ce run
  if (createDec.status === 201 && concoursId) {
    await req('DELETE', `/concours/${concoursId}`, decToken);
  }

  const allOk = results.every(Boolean);
  console.log(allOk ? '\n✅ Tous les tests Phase 2 passent\n' : '\n❌ Échecs Phase 2\n');
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
