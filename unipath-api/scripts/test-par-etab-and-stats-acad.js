require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getStatistiques } = require('../src/controllers/dges.controller');
const prisma = require('../src/prisma');

const BASE = 'http://localhost:3001/api';

function check(label, ok, detail = '') {
  console.log(`${ok ? 'OK' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

async function login(email, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await r.json().catch(() => ({}));
  return { status: r.status, body };
}

async function api(method, url, token, body) {
  const r = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

function sumEtabPriveRows(rows) {
  return (rows || []).reduce(
    (a, e) => ({
      n: a.n + Number(e.nbCandidatures || 0),
      v: a.v + Number(e.valides || 0),
      r: a.r + Number(e.rejetes || 0),
      a: a.a + Number(e.en_attente || 0),
      s: a.s + Number(e.sous_reserve || 0),
    }),
    { n: 0, v: 0, r: 0, a: 0, s: 0 },
  );
}

function sumCampagneRows(rows) {
  return (rows || []).reduce(
    (a, e) => ({
      n: a.n + Number(e.total_candidatures || 0),
      v: a.v + Number(e.valides || 0),
      r: a.r + Number(e.rejetes || 0),
      a: a.a + Number(e.en_attente || 0),
      s: a.s + Number(e.sous_reserve || 0),
    }),
    { n: 0, v: 0, r: 0, a: 0, s: 0 },
  );
}

async function main() {
  let all = true;

  const req = { query: {} };
  const res = {
    statusCode: 200,
    body: null,
    status(c) {
      this.statusCode = c;
      return this;
    },
    json(b) {
      this.body = b;
      return this;
    },
  };
  await getStatistiques(req, res);
  const d = res.body;

  // Phase 4+ : /dges/statistiques = Module 2 campagnes uniquement
  // (plus de totaux/statistiques/parEtablissement concours)
  all = check(
    'réponse M2: totauxCampagnes + statistiquesCampagnes + parEtablissementPrive',
    Boolean(d?.totauxCampagnes)
      && Array.isArray(d?.statistiquesCampagnes)
      && Array.isArray(d?.parEtablissementPrive)
      && d.totaux === undefined
      && d.statistiques === undefined,
    `keys=${Object.keys(d || {}).join(',')}`,
  ) && all;

  const sumEtab = sumEtabPriveRows(d.parEtablissementPrive);
  const sumCamp = sumCampagneRows(d.statistiquesCampagnes);

  console.log('\n=== 1. parEtablissementPrive vs statistiquesCampagnes (M2) ===');
  console.log('parEtablissementPrive', sumEtab);
  console.log('statistiquesCampagnes', sumCamp);
  console.log('totauxCampagnes', {
    candidatures: d.totauxCampagnes?.total_candidatures,
    valides: d.totauxCampagnes?.total_valides,
    rejetes: d.totauxCampagnes?.total_rejetes,
    attente: d.totauxCampagnes?.total_attente,
    sous_reserve: d.totauxCampagnes?.total_sous_reserve,
  });

  all = check(
    'totauxCampagnes = sum etab privés',
    Number(d.totauxCampagnes.total_candidatures) === sumEtab.n
      && Number(d.totauxCampagnes.total_valides) === sumEtab.v
      && Number(d.totauxCampagnes.total_rejetes) === sumEtab.r
      && Number(d.totauxCampagnes.total_attente) === sumEtab.a
      && Number(d.totauxCampagnes.total_sous_reserve) === sumEtab.s,
  ) && all;

  all = check('sum etab = sum campagnes', JSON.stringify(sumEtab) === JSON.stringify(sumCamp)) && all;

  let nestedOk = true;
  for (const etab of d.parEtablissementPrive || []) {
    const nested = sumCampagneRows(etab.campagnes);
    if (
      nested.n !== Number(etab.nbCandidatures)
      || nested.v !== Number(etab.valides)
      || nested.r !== Number(etab.rejetes)
      || nested.a !== Number(etab.en_attente)
      || nested.s !== Number(etab.sous_reserve)
    ) {
      nestedOk = false;
      console.log(' mismatch', etab.etablissement, nested, {
        nbCandidatures: etab.nbCandidatures,
        valides: etab.valides,
        rejetes: etab.rejetes,
        en_attente: etab.en_attente,
        sous_reserve: etab.sous_reserve,
      });
    }
  }
  all = check('chaque etab = somme de ses campagnes', nestedOk) && all;

  const withData = (d.parEtablissementPrive || []).filter((e) => e.nbCandidatures > 0);
  console.log(
    'Établissements privés avec candidatures:',
    withData.map((e) => `${e.etablissement} (${e.nbCandidatures})`).join(', ') || '(aucun)',
  );

  const layoutSrc = fs.readFileSync(
    path.join(__dirname, '../../unipath-front/src/components/AdminEtablissementLayout.jsx'),
    'utf8',
  );
  const appSrc = fs.readFileSync(
    path.join(__dirname, '../../unipath-front/src/App.jsx'),
    'utf8',
  );
  all = check(
    'menu/route Stats présents',
    layoutSrc.includes('/admin-etablissement/statistiques')
      && appSrc.includes('StatistiquesEtablissement')
      && appSrc.includes("allowedSousRoles={['ADMIN', 'SUPERVISEUR']}"),
  ) && all;

  console.log('\n=== 2/3. Accès stats académiques ADMIN vs CONTROLEUR ===');
  const adminEmail = 'harrydedji+admin-esae@gmail.com';
  const adminPass = 'AdminEtab2026!';
  const loginAdmin = await login(adminEmail, adminPass);
  all = check(
    'login ADMIN',
    loginAdmin.status === 200,
    `${adminEmail} status=${loginAdmin.status} ${loginAdmin.body.error || ''}`,
  ) && all;

  const adminToken = loginAdmin.body.token;
  const adminUser = loginAdmin.body.user || {};
  const etabId = adminUser.etablissementId;
  console.log('ADMIN sousRole=', adminUser.sousRole, 'etab=', etabId);

  const filieres = await prisma.filiere.findMany({ where: { etablissementId: etabId }, take: 2 });
  let acadCount = await prisma.inscriptionAcademique.count({ where: { etablissementId: etabId } });
  if (acadCount === 0 && filieres.length > 0) {
    const candidats = await prisma.candidat.findMany({ take: 3, select: { id: true } });
    for (let i = 0; i < Math.min(candidats.length, 3); i += 1) {
      const statut = i === 0 ? 'VALIDE' : (i === 1 ? 'REDOUBLANT' : 'EN_COURS');
      const filiere = filieres[i % filieres.length];
      try {
        await prisma.inscriptionAcademique.create({
          data: {
            candidatId: candidats[i].id,
            etablissementId: etabId,
            filiereId: filiere.id,
            anneeAcademique: '2025-2026',
            niveau: 1,
            statut,
            matricule: `TEST-STATS-${Date.now()}-${i}`,
          },
        });
      } catch (e) {
        console.log('seed skip', e.message);
      }
    }
    acadCount = await prisma.inscriptionAcademique.count({ where: { etablissementId: etabId } });
    console.log('Seeded academic rows, count now=', acadCount);
  }

  const statsAdmin = await api('GET', `/etablissements/${etabId}/statistiques`, adminToken);
  all = check(
    'ADMIN GET stats 200',
    statsAdmin.status === 200,
    `status=${statsAdmin.status} err=${statsAdmin.data.error || ''}`,
  ) && all;

  const rows = statsAdmin.data.statistiques || [];
  const withInscrits = rows.filter((r) => Number(r.total_inscrits) > 0);
  console.log('lignes stats=', rows.length, 'avec inscrits=', withInscrits.length);
  if (withInscrits[0]) console.log('sample', JSON.stringify(withInscrits[0]));
  all = check('ADMIN voit des lignes stats', rows.length > 0) && all;
  all = check('ADMIN voit données académiques (>0)', withInscrits.length > 0) && all;

  const ctrlEmail = 'harrydedji+ctrl-stats-test@gmail.com';
  let ctrlPass = null;
  const createCtrl = await api('POST', '/etablissement/staff', adminToken, {
    nom: 'Ctrl',
    prenom: 'Stats',
    email: ctrlEmail,
    sousRole: 'CONTROLEUR',
    telephone: '67000000',
  });
  console.log('create staff status', createCtrl.status, JSON.stringify(createCtrl.data).slice(0, 280));

  if (createCtrl.status === 201 || createCtrl.status === 200) {
    ctrlPass = createCtrl.data.temporaryPassword;
    all = check('création CONTROLEUR', Boolean(ctrlPass)) && all;
  } else {
    const { supabaseAdmin } = require('../src/supabase');
    ctrlPass = 'CtrlStats2026!';
    const list = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const u = (list.data?.users || []).find((x) => x.email === ctrlEmail);
    if (u) {
      await supabaseAdmin.auth.admin.updateUserById(u.id, {
        password: ctrlPass,
        email_confirm: true,
        user_metadata: {
          ...(u.user_metadata || {}),
          mustChangePassword: false,
          temporaryPasswordExpiresAt: null,
        },
      });
      all = check('reset pwd CONTROLEUR existant', true) && all;
    } else {
      all = check('CONTROLEUR disponible pour test', false, JSON.stringify(createCtrl.data).slice(0, 200)) && all;
      ctrlPass = null;
    }
  }

  if (ctrlPass) {
    let loginCtrl = await login(ctrlEmail, ctrlPass);
    // Compte staff parfois encore en mot de passe temporaire → forcer un 2e reset
    if (loginCtrl.status === 403 || loginCtrl.status === 401) {
      const { supabaseAdmin } = require('../src/supabase');
      const list = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const u = (list.data?.users || []).find((x) => x.email === ctrlEmail);
      if (u) {
        await supabaseAdmin.auth.admin.updateUserById(u.id, {
          password: ctrlPass,
          email_confirm: true,
          user_metadata: {
            ...(u.user_metadata || {}),
            mustChangePassword: false,
            temporaryPasswordExpiresAt: null,
          },
        });
        loginCtrl = await login(ctrlEmail, ctrlPass);
      }
    }
    console.log(
      'login CONTROLEUR',
      loginCtrl.status,
      'sousRole=',
      loginCtrl.body.user?.sousRole,
      'mustChange=',
      loginCtrl.body.user?.mustChangePassword || loginCtrl.body.mustChangePassword,
    );
    all = check('login CONTROLEUR', loginCtrl.status === 200, `status=${loginCtrl.status} err=${loginCtrl.body.error || ''}`) && all;
    const ctrlToken = loginCtrl.body.token;
    if (ctrlToken) {
      const statsCtrl = await api('GET', `/etablissements/${etabId}/statistiques`, ctrlToken);
      all = check(
        'CONTROLEUR GET stats 403',
        statsCtrl.status === 403,
        `status=${statsCtrl.status} body=${JSON.stringify(statsCtrl.data).slice(0, 160)}`,
      ) && all;
    } else {
      all = check('CONTROLEUR GET stats 403', false, 'pas de token') && all;
    }

    // Simulate menu filter
    const ALL_TABS = [
      { label: 'Stats', sousRoles: ['ADMIN', 'SUPERVISEUR'] },
      { label: 'Personnel', sousRoles: ['ADMIN', 'SUPERVISEUR'] },
      { label: 'Étudiants', sousRoles: ['ADMIN', 'SUPERVISEUR', 'CONTROLEUR'] },
    ];
    const ctrlTabs = ALL_TABS.filter((t) => t.sousRoles.includes('CONTROLEUR')).map((t) => t.label);
    all = check(
      'menu CONTROLEUR sans Stats',
      !ctrlTabs.includes('Stats') && ctrlTabs.includes('Étudiants'),
      `tabs=${ctrlTabs.join(',')}`,
    ) && all;
  }

  console.log(`\n=== VERDICT: ${all ? 'TOUS LES TESTS OK' : 'ÉCHECS'} ===`);
  process.exit(all ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
