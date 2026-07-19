/**
 * Augmente le taux de réussite (passants / (passants+redoublants))
 * pour certaines écoles privées ciblées.
 *
 * Usage: node scripts/boost-taux-reussite-etablissements.js
 */
const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient();
const TAG = 'SEED-BOOST-TAUX';

const PROFILS = {
  excellent: ['V', 'V', 'V', 'V', 'V', 'V'],
  bon: ['V', 'V', 'V', 'V', 'V', null],
};

function statutFromToken(token) {
  if (token === 'V') return 'VALIDE';
  if (token === 'N') return 'NON_VALIDE';
  return null;
}

async function applyProfil(inscriptionId, unites, profilKey) {
  const pattern = PROFILS[profilKey];
  if (!pattern || !unites.length) return 0;
  let applied = 0;
  const n = Math.min(pattern.length, unites.length);
  for (let i = 0; i < n; i++) {
    const statut = statutFromToken(pattern[i]);
    if (!statut) continue;
    await p.validationUE.upsert({
      where: {
        inscriptionAcadId_uniteEnseignementId: {
          inscriptionAcadId: inscriptionId,
          uniteEnseignementId: unites[i].id,
        },
      },
      create: {
        inscriptionAcadId: inscriptionId,
        uniteEnseignementId: unites[i].id,
        statut,
        decidedAt: new Date(),
        decidedBy: TAG,
      },
      update: {
        statut,
        decidedAt: new Date(),
        decidedBy: TAG,
      },
    });
    applied += 1;
  }
  return applied;
}

async function seedExcellent(inscription) {
  const semestreImpair = 2 * inscription.niveau - 1;
  const semestrePair = 2 * inscription.niveau;
  const unitesImpair = await p.uniteEnseignement.findMany({
    where: {
      filiereId: inscription.filiereId,
      anneeEtude: inscription.niveau,
      semestre: semestreImpair,
    },
    orderBy: [{ ordre: 'asc' }, { code: 'asc' }],
  });
  const unitesPair = await p.uniteEnseignement.findMany({
    where: {
      filiereId: inscription.filiereId,
      anneeEtude: inscription.niveau,
      semestre: semestrePair,
    },
    orderBy: [{ ordre: 'asc' }, { code: 'asc' }],
  });
  return (
    (await applyProfil(inscription.id, unitesImpair, 'excellent'))
    + (await applyProfil(inscription.id, unitesPair, 'bon'))
  );
}

async function tauxFor(etablissementId) {
  const rows = await p.inscriptionAcademique.groupBy({
    by: ['statut'],
    where: { etablissementId },
    _count: true,
  });
  const get = (s) => rows.find((r) => r.statut === s)?._count || 0;
  const v = get('VALIDE');
  const r = get('REDOUBLANT');
  const d = v + r;
  return {
    VALIDE: v,
    REDOUBLANT: r,
    EN_COURS: get('EN_COURS'),
    taux: d ? Math.round((1000 * v) / d) / 10 : null,
  };
}

async function promoteToPassant(etablissementId, { fromStatuts, limit, annees }) {
  const rows = await p.inscriptionAcademique.findMany({
    where: {
      etablissementId,
      statut: { in: fromStatuts },
      ...(annees?.length ? { anneeAcademique: { in: annees } } : {}),
    },
    orderBy: [{ anneeAcademique: 'asc' }, { createdAt: 'asc' }],
    take: limit,
    select: {
      id: true,
      niveau: true,
      filiereId: true,
      statut: true,
      anneeAcademique: true,
      candidat: { select: { email: true } },
      filiere: { select: { code: true } },
    },
  });

  const out = [];
  let validations = 0;
  for (const row of rows) {
    await p.inscriptionAcademique.update({
      where: { id: row.id },
      data: { statut: 'VALIDE' },
    });
    validations += await seedExcellent(row);
    out.push({
      from: row.statut,
      email: row.candidat.email,
      filiere: row.filiere.code,
      annee: row.anneeAcademique,
      niveau: row.niveau,
    });
  }
  return { converted: out.length, validations, details: out };
}

async function ensureExtraPassants({ etablissementPattern, emails, annee }) {
  const etab = await p.etablissement.findFirst({
    where: { nom: { contains: etablissementPattern }, type: 'PRIVE' },
    include: {
      filieres: { take: 2, orderBy: { nom: 'asc' }, select: { id: true, code: true, nom: true } },
    },
  });
  if (!etab || !etab.filieres.length) {
    return { skipped: true, reason: `etab/filiere manquant: ${etablissementPattern}` };
  }

  const created = [];
  let validations = 0;
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    const candidat = await p.candidat.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    if (!candidat) continue;

    const filiere = etab.filieres[i % etab.filieres.length];
    const existing = await p.inscriptionAcademique.findFirst({
      where: {
        candidatId: candidat.id,
        filiereId: filiere.id,
        anneeAcademique: annee,
      },
    });

    let inscription;
    if (existing) {
      inscription = await p.inscriptionAcademique.update({
        where: { id: existing.id },
        data: { statut: 'VALIDE', niveau: existing.niveau || 1, etablissementId: etab.id },
      });
    } else {
      inscription = await p.inscriptionAcademique.create({
        data: {
          candidatId: candidat.id,
          etablissementId: etab.id,
          filiereId: filiere.id,
          anneeAcademique: annee,
          niveau: 1,
          statut: 'VALIDE',
          confirmeeAt: new Date(),
        },
      });
    }

    validations += await seedExcellent({
      id: inscription.id,
      niveau: inscription.niveau,
      filiereId: inscription.filiereId,
    });
    created.push({
      email: candidat.email,
      etab: etab.nom,
      filiere: filiere.code,
      annee,
      created: !existing,
    });
  }

  return { skipped: false, etab: etab.nom, count: created.length, validations, created };
}

(async () => {
  const pigier = await p.etablissement.findFirst({
    where: { nom: { contains: 'Pigier' } },
    select: { id: true, nom: true },
  });
  const uatm = await p.etablissement.findFirst({
    where: { nom: { contains: 'Université Africaine de Technologie' } },
    select: { id: true, nom: true },
  });
  const esma = await p.etablissement.findFirst({
    where: { nom: { contains: "Management et d'Administration" } },
    select: { id: true, nom: true },
  });

  const before = {};
  for (const e of [pigier, uatm, esma].filter(Boolean)) {
    before[e.nom] = await tauxFor(e.id);
  }

  const actions = {};

  // Pigier : viser ~85%+ — convertir redoublants → passants (garder quelques redoublants)
  if (pigier) {
    actions.pigierFromRedoublant = await promoteToPassant(pigier.id, {
      fromStatuts: ['REDOUBLANT'],
      limit: 7,
      annees: ['2025-2026', '2026-2027'],
    });
    actions.pigierFromEnCours = await promoteToPassant(pigier.id, {
      fromStatuts: ['EN_COURS'],
      limit: 2,
      annees: ['2026-2027'],
    });
  }

  // UATM : viser ~90%+
  if (uatm) {
    actions.uatmFromRedoublant = await promoteToPassant(uatm.id, {
      fromStatuts: ['REDOUBLANT'],
      limit: 2,
      annees: ['2025-2026', '2026-2027'],
    });
    actions.uatmFromEnCours = await promoteToPassant(uatm.id, {
      fromStatuts: ['EN_COURS'],
      limit: 2,
      annees: ['2026-2027'],
    });
  }

  // ESMA : sortir du 0%
  if (esma) {
    actions.esmaFromRedoublant = await promoteToPassant(esma.id, {
      fromStatuts: ['REDOUBLANT'],
      limit: 1,
      annees: ['2026-2027'],
    });
  }

  // Autres écoles : créer des cohortes de passants (taux élevé)
  actions.hecm = await ensureExtraPassants({
    etablissementPattern: 'Haute École de Commerce et de Management',
    emails: [
      'harrydedji+candidat1@gmail.com',
      'harrydedji+candidat2@gmail.com',
      'harrydedji+candidat3@gmail.com',
      'harrydedji+candidat4@gmail.com',
    ],
    annee: '2026-2027',
  });
  actions.irgib = await ensureExtraPassants({
    etablissementPattern: 'IRGIB',
    emails: [
      'harrydedji+candidat5@gmail.com',
      'harrydedji+candidat6@gmail.com',
      'harrydedji+candidat7@gmail.com',
      'harrydedji+candidat8@gmail.com',
      'harrydedji+candidat9@gmail.com',
    ],
    annee: '2026-2027',
  });
  // Un redoublant seul sur IRGIB pour ne pas être à 100% artificiel partout
  // (optionnel — on laisse 100% sur HECM / IRGIB pour contraste fort)

  const after = {};
  const targets = [];
  if (pigier) targets.push(pigier);
  if (uatm) targets.push(uatm);
  if (esma) targets.push(esma);
  for (const pattern of ['Haute École de Commerce et de Management', 'IRGIB']) {
    const e = await p.etablissement.findFirst({
      where: { nom: { contains: pattern }, type: 'PRIVE' },
      select: { id: true, nom: true },
    });
    if (e) targets.push(e);
  }
  for (const e of targets) {
    after[e.nom] = await tauxFor(e.id);
  }

  console.log(JSON.stringify({ before, actions, after }, null, 2));
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
