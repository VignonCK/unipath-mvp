/**
 * Seed données de test Module 1 — inscriptions multi-concours + verdicts.
 * Utilise les comptes candidats existants + fichiers Downloads (PDF/images).
 *
 * Usage: node scripts/seed-stats-dossiers-test.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const prisma = require('../src/prisma');
const { candidateSerieMatchesConcours } = require('../src/utils/series.helper');
const { genererNumeroInscriptionUnique } = require('../src/utils/numero-inscription.helper');

const DOWNLOADS = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads');
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads', 'dossiers-candidats');

const SCENARIOS = [
  'EN_ATTENTE', // soumis, pas encore traité
  'VALIDE_EXAM', // validé directement par examinateur
  'REJETE_CTRL', // rejet examinateur + confirmation contrôleur
  'SOUS_RESERVE_CTRL', // sous réserve examinateur + confirmation contrôleur
  'VALIDE_CTRL', // rejet/sous réserve examinateur corrigé en VALIDE par contrôleur
  'EN_ATTENTE_ARBITRAGE', // verdict examinateur REJETE, pas encore de décision contrôleur
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function listNewest(dir, exts, limit) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((name) => {
      const full = path.join(dir, name);
      try {
        const st = fs.statSync(full);
        if (!st.isFile()) return null;
        const ext = path.extname(name).toLowerCase();
        if (!exts.includes(ext)) return null;
        return { full, name, mtime: st.mtimeMs };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyToUploads(candidatId, typePiece, sourceFile) {
  const ext = path.extname(sourceFile.name) || '.bin';
  const destRel = path.posix.join(
    candidatId,
    `${typePiece}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}${ext}`
  );
  const destAbs = path.join(UPLOADS_ROOT, ...destRel.split('/'));
  ensureDir(path.dirname(destAbs));
  fs.copyFileSync(sourceFile.full, destAbs);
  // URL relative consommée par l'API (uploads/)
  return `uploads/dossiers-candidats/${destRel}`;
}

async function ensureDossierPersonnel(candidat, pdfs, imgs) {
  const existing = await prisma.dossier.findUnique({ where: { candidatId: candidat.id } });
  const data = {
    acteNaissance: existing?.acteNaissance || copyToUploads(candidat.id, 'acteNaissance', pick(pdfs)),
    carteIdentite: existing?.carteIdentite || copyToUploads(candidat.id, 'carteIdentite', pick(imgs)),
    photo: existing?.photo || copyToUploads(candidat.id, 'photo', pick(imgs)),
    releve: existing?.releve || copyToUploads(candidat.id, 'releve', pick(pdfs)),
  };
  await prisma.dossier.upsert({
    where: { candidatId: candidat.id },
    update: data,
    create: { candidatId: candidat.id, ...data },
  });
  return data;
}

async function ensureAffectations(concoursId, examinateurs, controleurs) {
  const existing = await prisma.affectationCommissionConcours.findMany({ where: { concoursId } });
  if (existing.some((a) => a.roleAffectation === 'EXAMINATEUR')
    && existing.some((a) => a.roleAffectation === 'CONTROLEUR')) {
    return existing;
  }

  await prisma.affectationCommissionConcours.deleteMany({ where: { concoursId } });
  const rows = [
    ...examinateurs.slice(0, 2).map((m) => ({
      concoursId,
      membreCommissionId: m.id,
      roleAffectation: 'EXAMINATEUR',
    })),
    ...controleurs.slice(0, 2).map((m) => ({
      concoursId,
      membreCommissionId: m.id,
      roleAffectation: 'CONTROLEUR',
    })),
  ];
  await prisma.affectationCommissionConcours.createMany({ data: rows });
  return prisma.affectationCommissionConcours.findMany({ where: { concoursId } });
}

async function openEtudeIfNeeded(concoursId) {
  const c = await prisma.concours.findUnique({ where: { id: concoursId } });
  const now = new Date();
  const debut = c.dateDebutEtudeDossiers;
  const fin = c.dateFinEtudeDossiers;
  const active = debut && now >= debut && (!fin || now <= fin);
  if (active) return;

  const start = new Date(now.getTime() - 24 * 3600 * 1000);
  const end = new Date(now.getTime() + 14 * 24 * 3600 * 1000);
  await prisma.concours.update({
    where: { id: concoursId },
    data: {
      dateDebutEtudeDossiers: start,
      dateFinEtudeDossiers: end,
      etudeDossiersClotureeAt: null,
    },
  });
}

function buildDecisionPayload(scenario, examinateurId, controleurId) {
  const now = new Date();
  switch (scenario) {
    case 'EN_ATTENTE':
      return { statut: 'EN_ATTENTE' };
    case 'VALIDE_EXAM':
      return {
        statut: 'VALIDE',
        verdict1: 'VALIDE',
        verdict1Par: examinateurId,
        verdict1Date: now,
        verdict1Motif: null,
      };
    case 'REJETE_CTRL':
      return {
        statut: 'REJETE',
        verdict1: 'REJETE',
        verdict1Par: examinateurId,
        verdict1Date: now,
        verdict1Motif: 'Dossier incomplet / pièce non conforme',
        decisionControleur: 'REJETE',
        decisionControleurPar: controleurId,
        decisionControleurDate: now,
        decisionControleurMotif: 'Confirmation du rejet examinateur',
        verdict2: 'REJETE',
        verdict2Par: controleurId,
        verdict2Date: now,
        commentaireRejet: 'Confirmation du rejet examinateur',
      };
    case 'SOUS_RESERVE_CTRL':
      return {
        statut: 'SOUS_RESERVE',
        verdict1: 'SOUS_RESERVE',
        verdict1Par: examinateurId,
        verdict1Date: now,
        verdict1Motif: 'Photo floue — à resoumettre',
        decisionControleur: 'SOUS_RESERVE',
        decisionControleurPar: controleurId,
        decisionControleurDate: now,
        decisionControleurMotif: 'Sous réserve maintenue',
        verdict2: 'SOUS_RESERVE',
        verdict2Par: controleurId,
        verdict2Date: now,
        commentaireSousReserve: 'Sous réserve maintenue',
      };
    case 'VALIDE_CTRL':
      return {
        statut: 'VALIDE',
        verdict1: 'REJETE',
        verdict1Par: examinateurId,
        verdict1Date: now,
        verdict1Motif: 'Verdict initial rejet',
        decisionControleur: 'VALIDE',
        decisionControleurPar: controleurId,
        decisionControleurDate: now,
        decisionControleurMotif: 'Arbitrage : dossier finalement validé',
        verdict2: 'VALIDE',
        verdict2Par: controleurId,
        verdict2Date: now,
      };
    case 'EN_ATTENTE_ARBITRAGE':
      return {
        statut: 'EN_ATTENTE',
        verdict1: 'REJETE',
        verdict1Par: examinateurId,
        verdict1Date: now,
        verdict1Motif: 'En attente d’arbitrage contrôleur',
      };
    default:
      return { statut: 'EN_ATTENTE' };
  }
}

async function createOrUpdateInscription({
  candidat,
  concours,
  centreId,
  dossierUrls,
  pdfs,
  scenario,
  examinateurId,
  controleurId,
}) {
  const existing = await prisma.inscription.findUnique({
    where: {
      candidatId_concoursId: { candidatId: candidat.id, concoursId: concours.id },
    },
    include: { dossierInscription: true },
  });

  const quittanceUrl = copyToUploads(candidat.id, 'quittance', pick(pdfs));
  const piecesExtras = {
    acte_naissance: dossierUrls.acteNaissance,
    carte_identite: dossierUrls.carteIdentite,
    photo_identite: dossierUrls.photo,
    releve_bac: dossierUrls.releve,
  };

  const decision = buildDecisionPayload(scenario, examinateurId, controleurId);

  if (existing?.dossierInscription?.quittanceUrl) {
    // Déjà soumis : on enrichit éventuellement le statut si encore EN_ATTENTE sans verdict
    if (
      existing.dossierInscription.statut === 'EN_ATTENTE'
      && !existing.dossierInscription.verdict1
      && scenario !== 'EN_ATTENTE'
    ) {
      await prisma.dossierInscription.update({
        where: { id: existing.dossierInscription.id },
        data: decision,
      });
      return { action: 'updated', inscriptionId: existing.id, scenario };
    }
    return { action: 'skipped', inscriptionId: existing.id, scenario: existing.dossierInscription.statut };
  }

  let inscription = existing;
  if (!inscription) {
    const numeroInscription = await genererNumeroInscriptionUnique();
    inscription = await prisma.inscription.create({
      data: {
        candidatId: candidat.id,
        concoursId: concours.id,
        numeroInscription,
      },
    });
  }

  if (existing?.dossierInscription) {
    await prisma.dossierInscription.update({
      where: { id: existing.dossierInscription.id },
      data: {
        quittanceUrl,
        piecesExtras,
        concoursCentreId: centreId || null,
        ...decision,
      },
    });
  } else {
    await prisma.dossierInscription.create({
      data: {
        inscriptionId: inscription.id,
        quittanceUrl,
        piecesExtras,
        concoursCentreId: centreId || null,
        ...decision,
      },
    });
  }

  return { action: 'created', inscriptionId: inscription.id, scenario };
}

async function main() {
  const pdfs = listNewest(DOWNLOADS, ['.pdf'], 5);
  const imgs = listNewest(DOWNLOADS, ['.jpg', '.jpeg', '.png', '.webp'], 5);
  if (pdfs.length < 1 || imgs.length < 1) {
    throw new Error(`Fichiers insuffisants dans Downloads (pdf=${pdfs.length}, img=${imgs.length})`);
  }
  console.log(`PDF: ${pdfs.map((p) => p.name).join(' | ')}`);
  console.log(`IMG: ${imgs.map((p) => p.name).join(' | ')}`);

  const now = new Date();
  const concoursAll = await prisma.concours.findMany({
    include: {
      centresActifs: { where: { estActif: true }, select: { id: true } },
      _count: { select: { inscriptions: true } },
    },
    orderBy: { libelle: 'asc' },
  });

  // Priorité aux concours 2026 ouverts (ou fin dépôt proche), avec centres
  let targets = concoursAll.filter((c) => {
    const open =
      (!c.dateDebutDepot || now >= c.dateDebutDepot)
      && (!c.dateFinDepot || now <= c.dateFinDepot);
    return open && c.centresActifs.length > 0;
  });

  // Si trop peu, prolonger légèrement la fin de dépôt de concours 2026 fermés récemment
  if (targets.length < 6) {
    const candidatesExtend = concoursAll.filter(
      (c) =>
        String(c.libelle || '').includes('2026')
        && c.centresActifs.length > 0
        && c.dateFinDepot
        && c.dateFinDepot < now
    );
    for (const c of candidatesExtend.slice(0, 4)) {
      const newFin = new Date(now.getTime() + 10 * 24 * 3600 * 1000);
      await prisma.concours.update({
        where: { id: c.id },
        data: { dateFinDepot: newFin },
      });
      c.dateFinDepot = newFin;
      targets.push(c);
    }
  }

  // Limiter à ~8 concours pour une répartition lisible
  targets = shuffle(targets).slice(0, 8);
  console.log(`Concours cibles (${targets.length}):`);
  targets.forEach((c) => console.log(` - ${c.libelle} (${c.code}) series=${JSON.stringify(c.seriesAcceptees)}`));

  const membres = await prisma.membreCommission.findMany({ orderBy: { email: 'asc' } });
  const examinateursPool = membres.filter((m) =>
    ['examinateur@test.com', 'examinateur2@test.com', 'commission@epac.bj', 'commission@test.com'].includes(m.email)
    || m.email.includes('examinateur')
  );
  const controleursPool = membres.filter((m) =>
    ['controleur-commission@test.com', 'forsuree15@gmail.com', 'koussedohb@gmail.com'].includes(m.email)
    || m.email.includes('controleur')
  );
  // Fallback : split membres
  const exams = examinateursPool.length >= 2 ? examinateursPool : membres.slice(0, Math.ceil(membres.length / 2));
  const ctrls = controleursPool.length >= 1
    ? controleursPool
    : membres.slice(Math.ceil(membres.length / 2));

  const candidats = await prisma.candidat.findMany({
    where: { emailConfirme: true },
    include: { dossier: true },
    orderBy: { email: 'asc' },
  });

  const eligible = candidats.filter((c) => c.serie && c.telephone && c.dateNaiss && c.lieuNaiss);
  console.log(`Candidats éligibles: ${eligible.length}`);

  const results = [];
  let scenarioIdx = 0;

  for (const concours of targets) {
    const aff = await ensureAffectations(concours.id, shuffle(exams), shuffle(ctrls));
    const examIds = aff.filter((a) => a.roleAffectation === 'EXAMINATEUR').map((a) => a.membreCommissionId);
    const ctrlIds = aff.filter((a) => a.roleAffectation === 'CONTROLEUR').map((a) => a.membreCommissionId);
    await openEtudeIfNeeded(concours.id);

    const matching = shuffle(
      eligible.filter((c) => candidateSerieMatchesConcours(c.serie, concours.seriesAcceptees))
    );

    // Viser 6–10 dossiers par concours (selon pool)
    const take = Math.min(matching.length, Math.max(6, Math.min(10, matching.length)));
    const selected = matching.slice(0, take);

    console.log(`\n>>> ${concours.libelle}: ${selected.length} candidats`);

    for (const candidat of selected) {
      const dossierUrls = await ensureDossierPersonnel(candidat, pdfs, imgs);
      const centreId = pick(concours.centresActifs).id;
      const scenario = SCENARIOS[scenarioIdx % SCENARIOS.length];
      scenarioIdx += 1;

      const examinateurId = pick(examIds);
      const controleurId = pick(ctrlIds);

      const r = await createOrUpdateInscription({
        candidat,
        concours,
        centreId,
        dossierUrls,
        pdfs,
        scenario,
        examinateurId,
        controleurId,
      });
      results.push({
        concours: concours.libelle,
        email: candidat.email,
        serie: candidat.serie,
        ...r,
      });
      console.log(`  ${r.action.padEnd(8)} ${candidat.email} → ${r.scenario}`);
    }
  }

  const byStatut = await prisma.dossierInscription.groupBy({
    by: ['statut'],
    _count: true,
  });
  const byConcours = await prisma.inscription.groupBy({
    by: ['concoursId'],
    _count: true,
  });
  const concoursMap = Object.fromEntries(
    (await prisma.concours.findMany({ select: { id: true, libelle: true } }))
      .map((c) => [c.id, c.libelle])
  );

  console.log('\n=== RÉSUMÉ STATUTS ===');
  console.log(JSON.stringify(byStatut, null, 2));
  console.log('\n=== INSCRIPTIONS / CONCOURS ===');
  byConcours
    .sort((a, b) => b._count - a._count)
    .forEach((row) => {
      console.log(` ${String(row._count).padStart(3)} | ${concoursMap[row.concoursId] || row.concoursId}`);
    });

  const created = results.filter((r) => r.action === 'created').length;
  const updated = results.filter((r) => r.action === 'updated').length;
  const skipped = results.filter((r) => r.action === 'skipped').length;
  console.log(`\nActions: created=${created} updated=${updated} skipped=${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
