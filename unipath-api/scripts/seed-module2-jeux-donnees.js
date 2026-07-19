/**
 * Jeu de données Module 2 — comptes harrydedji+candidat1..12
 * Écoles : Pigier Bénin + UATM (campagnes PUBLIEE 2026-2027)
 *
 * Scénarios :
 *  1  VALIDE Pigier F1
 *  2  REJETE Pigier F1
 *  3  SOUS_RESERVE Pigier F1
 *  4  EN_ATTENTE Pigier F1
 *  5  DRAFT incomplet Pigier F1
 *  6  2× VALIDE Pigier+UATM (choix Confirmé à faire)
 *  7  2× VALIDE puis Confirmé sur Pigier (autre ABANDONNE)
 *  8  2× VALIDE Pigier F1+F2 (multi-filières)
 *  9  VALIDE UATM F1
 * 10  VALIDE Pigier F1 niveau 2
 * 11  VALIDE Pigier F1
 * 12  VALIDE Pigier F2 (profil F)
 */
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const p = new PrismaClient();
const ANNEE = '2026-2027';
const TAG = 'SEED-M2';

function appNum(n) {
  return `APP-${TAG}-${String(n).padStart(3, '0')}`;
}
function peNum(n) {
  return `PE-${TAG}-${String(n).padStart(3, '0')}`;
}

async function ensureEsaticSkippedNote() {
  // ESATIC sans campagne : on documente dans le résumé
  return null;
}

async function getCampagneContext(etabNameContains) {
  const etab = await p.etablissement.findFirst({
    where: { nom: { contains: etabNameContains } },
    select: { id: true, nom: true },
  });
  if (!etab) throw new Error(`Établissement introuvable: ${etabNameContains}`);

  const campagne = await p.campagneInscription.findFirst({
    where: { etablissementId: etab.id, anneeAcademique: ANNEE, statut: 'PUBLIEE' },
    include: {
      filieres: {
        include: { filiere: { select: { id: true, nom: true, code: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!campagne || campagne.filieres.length < 1) {
    throw new Error(`Campagne PUBLIEE manquante pour ${etab.nom}`);
  }
  return { etab, campagne, filieres: campagne.filieres };
}

async function getCandidat(email) {
  const c = await p.candidat.findUnique({
    where: { email },
    include: { dossier: true },
  });
  if (!c) throw new Error(`Candidat manquant: ${email}`);
  return c;
}

async function wipeSeedArtifacts(candidatIds) {
  // Supprime uniquement les artefacts de ce seed (numéros APP-SEED-M2 / PE-SEED-M2)
  const seedApps = await p.application.findMany({
    where: {
      OR: [
        { numeroApplication: { startsWith: `APP-${TAG}-` } },
        { candidatId: { in: candidatIds }, anneeAcademique: ANNEE },
      ],
    },
    select: { id: true, preinscriptionId: true, candidatId: true },
  });

  // On ne wipe PAS toutes les apps des candidats (données existantes utiles).
  // On wipe seulement celles créées par ce script (préfixe TAG).
  const tagged = await p.application.findMany({
    where: { numeroApplication: { startsWith: `APP-${TAG}-` } },
    select: { id: true, preinscriptionId: true },
  });

  for (const app of tagged) {
    await p.receipt.deleteMany({ where: { applicationId: app.id } });
    await p.payment.deleteMany({ where: { applicationId: app.id } });
    await p.applicationDocument.deleteMany({ where: { applicationId: app.id } });
    await p.application.delete({ where: { id: app.id } });
    if (app.preinscriptionId) {
      const pre = await p.preinscriptionEtablissement.findUnique({
        where: { id: app.preinscriptionId },
        select: { id: true, inscriptionAcadId: true },
      });
      if (pre) {
        await p.preinscriptionEtablissement.delete({ where: { id: pre.id } });
        if (pre.inscriptionAcadId) {
          await p.inscriptionAcademique.delete({ where: { id: pre.inscriptionAcadId } }).catch(() => {});
        }
      }
    }
  }

  const taggedPe = await p.preinscriptionEtablissement.findMany({
    where: { numeroPreinscription: { startsWith: `PE-${TAG}-` } },
    select: { id: true, inscriptionAcadId: true },
  });
  for (const pe of taggedPe) {
    await p.preinscriptionEtablissement.delete({ where: { id: pe.id } }).catch(() => {});
    if (pe.inscriptionAcadId) {
      await p.inscriptionAcademique.delete({ where: { id: pe.inscriptionAcadId } }).catch(() => {});
    }
  }

  return { wipedApps: tagged.length, ignoredExisting: seedApps.length - tagged.length };
}

function dossierDocs(candidat) {
  const d = candidat.dossier || {};
  return [
    { code: 'acte_naissance', label: 'Acte de naissance', url: d.acteNaissance || `https://example.com/demo/${TAG}/acte.pdf` },
    { code: 'carte_identite', label: "Carte d'identité", url: d.carteIdentite || `https://example.com/demo/${TAG}/cni.pdf` },
    { code: 'photo_identite', label: "Photo d'identité", url: d.photo || `https://example.com/demo/${TAG}/photo.jpg` },
    { code: 'releve_bac', label: 'Relevé de notes Bac', url: d.releve || `https://example.com/demo/${TAG}/releve.pdf` },
    { code: 'quittance_frais_dossier', label: 'Quittance frais de dossier', url: `https://example.com/demo/${TAG}/quittance.pdf` },
  ];
}

async function createFullApplication({
  seq,
  candidat,
  etab,
  campagneFiliere,
  niveau,
  status,
  finalize,
}) {
  const filiereId = campagneFiliere.filiereId;
  const existing = await p.application.findFirst({
    where: {
      candidatId: candidat.id,
      filiereId,
      anneeAcademique: ANNEE,
    },
  });
  if (existing) {
    return { skipped: true, reason: 'already_exists', applicationId: existing.id, email: candidat.email, filiere: campagneFiliere.filiere.nom };
  }

  const app = await p.application.create({
    data: {
      numeroApplication: appNum(seq),
      candidatId: candidat.id,
      etablissementId: etab.id,
      filiereId,
      anneeAcademique: ANNEE,
      niveau,
      status,
      campagneFiliereId: campagneFiliere.id,
    },
  });

  if (status !== 'DRAFT') {
    const docs = dossierDocs(candidat);
    for (const doc of docs) {
      await p.applicationDocument.create({
        data: {
          applicationId: app.id,
          code: doc.code,
          label: doc.label,
          source: 'STUDENT_UPLOAD',
          documentUrl: doc.url,
          status: 'PROVIDED',
        },
      });
    }
    await p.payment.create({
      data: {
        applicationId: app.id,
        paymentType: 'DOSSIER_FEES',
        amount: campagneFiliere.fraisDossier || 5000,
        paymentMethod: 'BANK_TRANSFER',
        status: 'CONFIRMED',
      },
    });
  }

  let preinscription = null;
  let inscriptionAcad = null;

  if (finalize) {
    preinscription = await p.preinscriptionEtablissement.create({
      data: {
        numeroPreinscription: peNum(seq),
        candidatId: candidat.id,
        filiereId,
        etablissementId: etab.id,
        anneeAcademique: ANNEE,
        niveau,
        statut: 'EN_ATTENTE',
      },
    });
    await p.application.update({
      where: { id: app.id },
      data: {
        preinscriptionId: preinscription.id,
        status: 'FICHE_GENERATED',
      },
    });
    await p.receipt.create({
      data: {
        applicationId: app.id,
        receiptNumber: `FPE-${TAG}-${seq}`,
        receiptType: 'PREINSCRIPTION_FICHE',
        receiptUrl: `https://example.com/demo/${TAG}/fiche-${seq}.pdf`,
        metadata: { seed: true, preinscriptionId: preinscription.id },
      },
    });
  }

  return { skipped: false, app, preinscription, inscriptionAcad, email: candidat.email };
}

async function decide(preinscriptionId, statut, motif, adminId) {
  const existing = await p.preinscriptionEtablissement.findUnique({ where: { id: preinscriptionId } });
  if (!existing || existing.statut !== 'EN_ATTENTE') {
    return { ok: false, reason: 'not_en_attente' };
  }

  let inscriptionAcadId = null;
  if (statut === 'VALIDE') {
    const found = await p.inscriptionAcademique.findFirst({
      where: {
        candidatId: existing.candidatId,
        filiereId: existing.filiereId,
        anneeAcademique: existing.anneeAcademique,
      },
    });
    if (found) {
      inscriptionAcadId = found.id;
    } else {
      const created = await p.inscriptionAcademique.create({
        data: {
          candidatId: existing.candidatId,
          filiereId: existing.filiereId,
          etablissementId: existing.etablissementId,
          anneeAcademique: existing.anneeAcademique,
          niveau: existing.niveau,
          statut: 'EN_COURS',
        },
      });
      inscriptionAcadId = created.id;
    }
  }

  await p.preinscriptionEtablissement.update({
    where: { id: preinscriptionId },
    data: {
      statut,
      motifDecision: motif || null,
      decidedAt: new Date(),
      decidedBy: adminId || 'seed-script',
      inscriptionAcadId,
    },
  });

  return { ok: true, inscriptionAcadId };
}

async function confirmerInscription(inscriptionId, candidatId) {
  const inscription = await p.inscriptionAcademique.findUnique({ where: { id: inscriptionId } });
  if (!inscription || inscription.candidatId !== candidatId) throw new Error('inscription invalid');

  const actives = await p.inscriptionAcademique.findMany({
    where: {
      candidatId,
      anneeAcademique: inscription.anneeAcademique,
      statut: { in: ['EN_COURS', 'VALIDE'] },
    },
  });
  if (actives.length < 2) return { ok: false, reason: 'need_two' };

  const autres = actives.filter((a) => a.id !== inscriptionId).map((a) => a.id);
  await p.inscriptionAcademique.update({
    where: { id: inscriptionId },
    data: { confirmeeAt: new Date() },
  });
  await p.inscriptionAcademique.updateMany({
    where: { id: { in: autres } },
    data: { statut: 'ABANDONNE', confirmeeAt: null },
  });
  await p.preinscriptionEtablissement.updateMany({
    where: { inscriptionAcadId: { in: autres } },
    data: {
      motifDecision: `Annulée par le candidat (seed ${TAG}) : confirmation d'une autre inscription.`,
    },
  });
  return { ok: true, annulees: autres.length };
}

(async () => {
  const summary = { created: [], skipped: [], decisions: [], confirm: null, prep: {} };

  const pigier = await getCampagneContext('Pigier');
  const uatm = await getCampagneContext('Université Africaine de Technologie');
  await ensureEsaticSkippedNote();

  const pigierF1 = pigier.filieres[0];
  const pigierF2 = pigier.filieres[1] || pigier.filieres[0];
  const uatmF1 = uatm.filieres[0];

  const emails = Array.from({ length: 12 }, (_, i) => `harrydedji+candidat${i + 1}@gmail.com`);
  const candidats = {};
  for (const email of emails) {
    candidats[email] = await getCandidat(email);
  }

  summary.prep = {
    annee: ANNEE,
    pigier: { nom: pigier.etab.nom, f1: pigierF1.filiere.nom, f2: pigierF2.filiere.nom },
    uatm: { nom: uatm.etab.nom, f1: uatmF1.filiere.nom },
    note: 'ESATIC sans campagne PUBLIEE — remplacé par Pigier + UATM',
  };

  const wipe = await wipeSeedArtifacts(Object.values(candidats).map((c) => c.id));
  summary.wipe = wipe;

  const adminPigier = await p.adminEtablissement.findFirst({
    where: { email: 'forfait199@gmail.com' },
    select: { id: true },
  });
  const adminId = adminPigier?.id || 'seed-script';

  // seq counter unique across creates
  let seq = 1;
  const results = {};

  async function make(key, email, ctx, cf, niveau, status, finalize) {
    const r = await createFullApplication({
      seq: seq++,
      candidat: candidats[email],
      etab: ctx.etab,
      campagneFiliere: cf,
      niveau,
      status,
      finalize,
    });
    results[key] = r;
    if (r.skipped) summary.skipped.push({ key, ...r });
    else summary.created.push({ key, email, app: r.app.numeroApplication, pe: r.preinscription?.numeroPreinscription });
    return r;
  }

  // 1 VALIDE Pigier
  await make('c1', emails[0], pigier, pigierF1, 1, 'READY_FOR_PREINSCRIPTION', true);
  // 2 REJETE
  await make('c2', emails[1], pigier, pigierF1, 1, 'READY_FOR_PREINSCRIPTION', true);
  // 3 SOUS_RESERVE
  await make('c3', emails[2], pigier, pigierF1, 1, 'READY_FOR_PREINSCRIPTION', true);
  // 4 EN_ATTENTE
  await make('c4', emails[3], pigier, pigierF1, 1, 'READY_FOR_PREINSCRIPTION', true);
  // 5 DRAFT
  await make('c5', emails[4], pigier, pigierF1, 1, 'DRAFT', false);
  // 6 dual VALIDE (no confirm yet)
  await make('c6a', emails[5], pigier, pigierF1, 1, 'READY_FOR_PREINSCRIPTION', true);
  await make('c6b', emails[5], uatm, uatmF1, 1, 'READY_FOR_PREINSCRIPTION', true);
  // 7 dual then confirm Pigier
  await make('c7a', emails[6], pigier, pigierF1, 1, 'READY_FOR_PREINSCRIPTION', true);
  await make('c7b', emails[6], uatm, uatmF1, 1, 'READY_FOR_PREINSCRIPTION', true);
  // 8 dual filières Pigier
  await make('c8a', emails[7], pigier, pigierF1, 1, 'READY_FOR_PREINSCRIPTION', true);
  await make('c8b', emails[7], pigier, pigierF2, 1, 'READY_FOR_PREINSCRIPTION', true);
  // 9 UATM only
  await make('c9', emails[8], uatm, uatmF1, 1, 'READY_FOR_PREINSCRIPTION', true);
  // 10 niveau 2
  await make('c10', emails[9], pigier, pigierF1, 2, 'READY_FOR_PREINSCRIPTION', true);
  // 11 VALIDE
  await make('c11', emails[10], pigier, pigierF1, 1, 'READY_FOR_PREINSCRIPTION', true);
  // 12 VALIDE F2
  await make('c12', emails[11], pigier, pigierF2, 1, 'READY_FOR_PREINSCRIPTION', true);

  const decisions = [
    ['c1', 'VALIDE', null],
    ['c2', 'REJETE', 'Dossier incomplet / série non conforme (jeu de test).'],
    ['c3', 'SOUS_RESERVE', 'Merci de remplacer la photo d’identité (jeu de test).'],
    // c4 stays EN_ATTENTE
    ['c6a', 'VALIDE', null],
    ['c6b', 'VALIDE', null],
    ['c7a', 'VALIDE', null],
    ['c7b', 'VALIDE', null],
    ['c8a', 'VALIDE', null],
    ['c8b', 'VALIDE', null],
    ['c9', 'VALIDE', null],
    ['c10', 'VALIDE', null],
    ['c11', 'VALIDE', null],
    ['c12', 'VALIDE', null],
  ];

  for (const [key, statut, motif] of decisions) {
    const r = results[key];
    if (!r || r.skipped || !r.preinscription) {
      summary.decisions.push({ key, ok: false, reason: 'no_preinscription' });
      continue;
    }
    const d = await decide(r.preinscription.id, statut, motif, adminId);
    summary.decisions.push({ key, statut, ...d });
    if (d.inscriptionAcadId) results[key].inscriptionAcadId = d.inscriptionAcadId;
  }

  // Confirm candidat7 on Pigier
  const c7a = results.c7a;
  if (c7a?.inscriptionAcadId) {
    summary.confirm = await confirmerInscription(c7a.inscriptionAcadId, candidats[emails[6]].id);
  } else {
    summary.confirm = { ok: false, reason: 'c7a_missing_inscription' };
  }

  // Stats finales
  const peStats = await p.preinscriptionEtablissement.groupBy({
    by: ['statut'],
    where: { numeroPreinscription: { startsWith: `PE-${TAG}-` } },
    _count: true,
  });
  const iaStats = await p.inscriptionAcademique.groupBy({
    by: ['statut'],
    where: {
      OR: [
        { candidatId: candidats[emails[5]].id },
        { candidatId: candidats[emails[6]].id },
        { candidatId: candidats[emails[7]].id },
      ],
      anneeAcademique: ANNEE,
    },
    _count: true,
  });

  summary.final = { peStats, iaStatsC6C7C8: iaStats };
  console.log(JSON.stringify(summary, null, 2));
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
