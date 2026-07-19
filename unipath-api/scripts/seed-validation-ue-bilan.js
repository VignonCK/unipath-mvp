/**
 * Seed qualité — inscriptions académiques + validations UE (bilan).
 *
 * Cible : Pigier Bénin + UATM, année DGES en cours.
 * Profils de validation par semestre (6 UE catalogue) :
 *   excellent  → 6 VALIDE
 *   bon        → 5 VALIDE, 1 non renseigné
 *   moyen      → 3 VALIDE, 1 NON_VALIDE, 2 non renseignés
 *   faible     → 1 VALIDE, 3 NON_VALIDE, 2 non renseignés
 *   echec      → 2 VALIDE, 4 NON_VALIDE
 *   vide       → aucune validation
 *
 * Idempotent : nettoie les ValidationUE de ce seed (decidedBy = SEED-VAL-UE)
 * et (re)aligne les inscriptions ciblées.
 *
 * Usage : node scripts/seed-validation-ue-bilan.js
 */
const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient();
const TAG = 'SEED-VAL-UE';

/** Profils : liste ordonnée de 'V' | 'N' | null (longueur = nb UE du semestre). */
const PROFILS = {
  excellent: ['V', 'V', 'V', 'V', 'V', 'V'],
  bon: ['V', 'V', 'V', 'V', 'V', null],
  moyen: ['V', 'V', 'V', 'N', null, null],
  faible: ['V', 'N', 'N', 'N', null, null],
  echec: ['V', 'V', 'N', 'N', 'N', 'N'],
  vide: [null, null, null, null, null, null],
};

/**
 * Cohortes : chaque ligne = un étudiant (email) sur une filière / niveau,
 * avec un profil S impair et un profil S pair de son année.
 */
const COHORTES = [
  // ── Pigier Licence GTL — 1ʳᵉ année (S1–S2) ───────────────────────
  { email: 'harrydedji+candidat12@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-GTL-L', niveau: 1, sImpair: 'excellent', sPair: 'bon' },
  { email: 'harrydedji+candidat13@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-GTL-L', niveau: 1, sImpair: 'bon', sPair: 'moyen' },
  { email: 'harrydedji+candidat14@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-GTL-L', niveau: 1, sImpair: 'moyen', sPair: 'faible' },
  { email: 'harrydedji+candidat15@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-GTL-L', niveau: 1, sImpair: 'faible', sPair: 'vide' },
  { email: 'harrydedji+candidat5@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-GTL-L', niveau: 1, sImpair: 'echec', sPair: 'moyen' },
  { email: 'harrydedji+candidat4@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-GTL-L', niveau: 1, sImpair: 'vide', sPair: 'vide' },

  // ── Pigier Licence GTL — 2ᵉ année (S3–S4) ────────────────────────
  { email: 'harrydedji+candidat10@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-GTL-L', niveau: 2, sImpair: 'excellent', sPair: 'excellent' },
  { email: 'harrydedji+candidat2@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-GTL-L', niveau: 2, sImpair: 'bon', sPair: 'moyen' },
  { email: 'harrydedji+candidat3@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-GTL-L', niveau: 2, sImpair: 'moyen', sPair: 'faible' },

  // ── Pigier Licence RGL — 1ʳᵉ année ───────────────────────────────
  { email: 'harrydedji+candidat9@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-RGL-L', niveau: 1, sImpair: 'excellent', sPair: 'bon' },
  { email: 'harrydedji+candidat11@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-RGL-L', niveau: 1, sImpair: 'moyen', sPair: 'echec' },

  // ── Pigier Master CM — M1 (année 4, S7–S8) ───────────────────────
  { email: 'harrydedji+candidat1@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-CM-M', niveau: 4, sImpair: 'excellent', sPair: 'bon' },
  { email: 'harrydedji+candidat7@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-CM-M', niveau: 4, sImpair: 'bon', sPair: 'moyen' },
  { email: 'harrydedji+candidat8@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-CM-M', niveau: 4, sImpair: 'faible', sPair: 'vide' },

  // ── Pigier Master CM — M2 (année 5, S9–S10) ──────────────────────
  { email: 'harrydedji+candidat6@gmail.com', etab: 'Pigier', filiereCode: 'PIGIER-CM-M', niveau: 5, sImpair: 'excellent', sPair: 'excellent' },

  // ── UATM Licence GC — 1ʳᵉ année ──────────────────────────────────
  { email: 'harrydedji+candidat13@gmail.com', etab: 'Université Africaine de Technologie', filiereCode: 'UATM-GC-L', niveau: 1, sImpair: 'bon', sPair: 'moyen' },
  { email: 'harrydedji+candidat14@gmail.com', etab: 'Université Africaine de Technologie', filiereCode: 'UATM-GC-L', niveau: 1, sImpair: 'moyen', sPair: 'faible' },
  { email: 'harrydedji+candidat15@gmail.com', etab: 'Université Africaine de Technologie', filiereCode: 'UATM-GC-L', niveau: 1, sImpair: 'excellent', sPair: 'bon' },

  // ── UATM Licence GI — 2ᵉ année ───────────────────────────────────
  { email: 'harrydedji+candidat9@gmail.com', etab: 'Université Africaine de Technologie', filiereCode: 'UATM-GI-L', niveau: 2, sImpair: 'bon', sPair: 'excellent' },
  { email: 'harrydedji+candidat11@gmail.com', etab: 'Université Africaine de Technologie', filiereCode: 'UATM-GI-L', niveau: 2, sImpair: 'faible', sPair: 'moyen' },
];

function statutFromToken(token) {
  if (token === 'V') return 'VALIDE';
  if (token === 'N') return 'NON_VALIDE';
  return null;
}

async function resolveAnnee() {
  const annee = await p.anneeAcademique.findFirst({ where: { enCoursDges: true } });
  if (!annee?.libelle) throw new Error('Aucune année académique DGES en cours');
  return annee.libelle;
}

async function resolveEtab(pattern) {
  const etab = await p.etablissement.findFirst({
    where: { nom: { contains: pattern } },
    select: { id: true, nom: true },
  });
  if (!etab) throw new Error(`Établissement introuvable: ${pattern}`);
  return etab;
}

async function resolveFiliere(etablissementId, code) {
  const filiere = await p.filiere.findFirst({
    where: { etablissementId, code },
    select: { id: true, nom: true, code: true, niveau: true, dureeAnnees: true },
  });
  if (!filiere) throw new Error(`Filière introuvable: ${code}`);
  return filiere;
}

async function resolveCandidat(email) {
  const c = await p.candidat.findUnique({
    where: { email },
    select: { id: true, email: true, nom: true, prenom: true, matricule: true },
  });
  if (!c) throw new Error(`Candidat manquant: ${email}`);
  return c;
}

async function wipeSeedValidations() {
  const deleted = await p.validationUE.deleteMany({
    where: { decidedBy: TAG },
  });
  return deleted.count;
}

async function ensureInscription({ candidatId, etablissementId, filiereId, anneeAcademique, niveau }) {
  const existing = await p.inscriptionAcademique.findFirst({
    where: { candidatId, filiereId, anneeAcademique },
  });

  if (existing) {
    const updated = await p.inscriptionAcademique.update({
      where: { id: existing.id },
      data: {
        niveau,
        statut: existing.statut === 'ABANDONNE' ? 'EN_COURS' : existing.statut,
        etablissementId,
      },
    });
    return { inscription: updated, created: false };
  }

  const created = await p.inscriptionAcademique.create({
    data: {
      candidatId,
      etablissementId,
      filiereId,
      anneeAcademique,
      niveau,
      statut: 'EN_COURS',
    },
  });
  return { inscription: created, created: true };
}

async function applyProfil({ inscriptionId, unites, profilKey }) {
  const pattern = PROFILS[profilKey];
  if (!pattern) throw new Error(`Profil inconnu: ${profilKey}`);
  if (!unites.length) return { applied: 0, skipped: 0 };

  let applied = 0;
  let skipped = 0;
  const n = Math.min(pattern.length, unites.length);

  for (let i = 0; i < n; i++) {
    const statut = statutFromToken(pattern[i]);
    if (!statut) {
      skipped += 1;
      continue;
    }
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
  return { applied, skipped, profil: profilKey, ueCount: unites.length };
}

(async () => {
  const anneeAcademique = await resolveAnnee();
  const wiped = await wipeSeedValidations();

  const summary = {
    anneeAcademique,
    wipedValidations: wiped,
    inscriptionsCreated: 0,
    inscriptionsUpdated: 0,
    validationsApplied: 0,
    rows: [],
    errors: [],
  };

  const etabCache = new Map();
  const filiereCache = new Map();

  for (const row of COHORTES) {
    try {
      const candidat = await resolveCandidat(row.email);

      if (!etabCache.has(row.etab)) {
        etabCache.set(row.etab, await resolveEtab(row.etab));
      }
      const etab = etabCache.get(row.etab);

      const filiereKey = `${etab.id}:${row.filiereCode}`;
      if (!filiereCache.has(filiereKey)) {
        filiereCache.set(filiereKey, await resolveFiliere(etab.id, row.filiereCode));
      }
      const filiere = filiereCache.get(filiereKey);

      const { inscription, created } = await ensureInscription({
        candidatId: candidat.id,
        etablissementId: etab.id,
        filiereId: filiere.id,
        anneeAcademique,
        niveau: row.niveau,
      });
      if (created) summary.inscriptionsCreated += 1;
      else summary.inscriptionsUpdated += 1;

      const semestreImpair = 2 * row.niveau - 1;
      const semestrePair = 2 * row.niveau;

      const unitesImpair = await p.uniteEnseignement.findMany({
        where: { filiereId: filiere.id, anneeEtude: row.niveau, semestre: semestreImpair },
        orderBy: [{ ordre: 'asc' }, { code: 'asc' }],
      });
      const unitesPair = await p.uniteEnseignement.findMany({
        where: { filiereId: filiere.id, anneeEtude: row.niveau, semestre: semestrePair },
        orderBy: [{ ordre: 'asc' }, { code: 'asc' }],
      });

      if (!unitesImpair.length || !unitesPair.length) {
        summary.errors.push({
          email: row.email,
          filiere: row.filiereCode,
          niveau: row.niveau,
          error: `UE manquantes (S${semestreImpair}=${unitesImpair.length}, S${semestrePair}=${unitesPair.length})`,
        });
        continue;
      }

      const r1 = await applyProfil({
        inscriptionId: inscription.id,
        unites: unitesImpair,
        profilKey: row.sImpair,
      });
      const r2 = await applyProfil({
        inscriptionId: inscription.id,
        unites: unitesPair,
        profilKey: row.sPair,
      });
      summary.validationsApplied += r1.applied + r2.applied;

      summary.rows.push({
        email: row.email,
        etab: etab.nom,
        filiere: filiere.code,
        niveau: row.niveau,
        inscriptionId: inscription.id,
        created,
        S_impair: { semestre: semestreImpair, ...r1 },
        S_pair: { semestre: semestrePair, ...r2 },
      });
    } catch (err) {
      summary.errors.push({ email: row.email, filiere: row.filiereCode, error: err.message });
    }
  }

  console.log(JSON.stringify(summary, null, 2));
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
