/**
 * Seed multi-années — données de qualité pour tests Module 2.
 *
 * Années :
 *   2025-2026  → archive (campagnes CLOTUREE, inscriptions VALIDE/REDOUBLANT)
 *   2026-2027  → année DGES en cours (déjà peuplée ; on complète le parcours)
 *   2027-2028  → année suivante (campagnes PUBLIEE, suites passant/redoublant)
 *
 * Couvre notamment :
 *   - parcours multi-années (passant / redoublant)
 *   - bilan UE + décisions d'année
 *   - transfert même filière (passant → niveau+1, redoublant → pas de niveau supérieur)
 *   - transfert autre filière (niveau libre)
 *   - campagnes archive / courante / suivante
 *
 * Idempotent (TAG = SEED-MULTI).
 * Usage : node scripts/seed-multi-annees-qualite.js
 */
const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient();
const TAG = 'SEED-MULTI';
const TAG_UE = 'SEED-UE';
const ANNEE_ARCHIVE = '2025-2026';
const ANNEE_COURANTE = '2026-2027';
const ANNEE_SUIVANTE = '2027-2028';

const PROFILS = {
  excellent: ['V', 'V', 'V', 'V', 'V', 'V'],
  bon: ['V', 'V', 'V', 'V', 'V', null],
  moyen: ['V', 'V', 'V', 'N', null, null],
  faible: ['V', 'N', 'N', 'N', null, null],
  echec: ['V', 'V', 'N', 'N', 'N', 'N'],
};

const UE_LIBELLES = [
  'Fondamentaux',
  'Méthodologie',
  'Applications pratiques',
  'Projet tutoré',
  'Communication professionnelle',
  'Évaluation et synthèse',
];

function emailCandidat(n) {
  return `harrydedji+candidat${n}@gmail.com`;
}

function statutFromToken(token) {
  if (token === 'V') return 'VALIDE';
  if (token === 'N') return 'NON_VALIDE';
  return null;
}

async function ensureAnnees() {
  await p.anneeAcademique.upsert({
    where: { libelle: ANNEE_ARCHIVE },
    create: { libelle: ANNEE_ARCHIVE, enCoursDec: false, enCoursDges: false },
    update: {},
  });
  await p.anneeAcademique.upsert({
    where: { libelle: ANNEE_COURANTE },
    create: { libelle: ANNEE_COURANTE, enCoursDec: true, enCoursDges: true },
    update: { enCoursDec: true, enCoursDges: true },
  });
  await p.anneeAcademique.upsert({
    where: { libelle: ANNEE_SUIVANTE },
    create: { libelle: ANNEE_SUIVANTE, enCoursDec: false, enCoursDges: false },
    update: {},
  });
  // Une seule année en cours DEC/DGES
  await p.anneeAcademique.updateMany({
    where: { libelle: { not: ANNEE_COURANTE } },
    data: { enCoursDec: false, enCoursDges: false },
  });
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
    select: {
      id: true,
      nom: true,
      code: true,
      niveau: true,
      dureeAnnees: true,
      etablissementId: true,
    },
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

async function ensureFiliereGiPigier(pigierId, templateFiliere) {
  let filiere = await p.filiere.findFirst({
    where: { etablissementId: pigierId, code: 'PIGIER-GI-L' },
  });
  if (!filiere) {
    filiere = await p.filiere.create({
      data: {
        etablissementId: pigierId,
        nom: 'Génie Informatique',
        code: 'PIGIER-GI-L',
        niveau: 'LICENCE',
        dureeAnnees: 3,
      },
    });
  } else if (filiere.nom !== 'Génie Informatique') {
    filiere = await p.filiere.update({
      where: { id: filiere.id },
      data: { nom: 'Génie Informatique', niveau: 'LICENCE', dureeAnnees: 3 },
    });
  }

  // UE catalogue (même schéma que seed-ue-test)
  const annees = [1, 2, 3];
  for (const anneeEtude of annees) {
    for (const semestre of [2 * anneeEtude - 1, 2 * anneeEtude]) {
      for (let i = 1; i <= 6; i++) {
        const code = `${TAG_UE}-S${semestre}-${String(i).padStart(2, '0')}-PIGIER-GI-L`.slice(0, 191);
        await p.uniteEnseignement.upsert({
          where: {
            filiereId_code_semestre: {
              filiereId: filiere.id,
              code,
              semestre,
            },
          },
          create: {
            filiereId: filiere.id,
            code,
            libelle: `${UE_LIBELLES[i - 1]} S${semestre}`,
            credits: i <= 4 ? 3 : 2,
            semestre,
            anneeEtude,
            ordre: i,
          },
          update: {
            libelle: `${UE_LIBELLES[i - 1]} S${semestre}`,
            credits: i <= 4 ? 3 : 2,
            anneeEtude,
            ordre: i,
          },
        });
      }
    }
  }

  // Référence commune pour équivalence robuste
  const ref = await p.filiereReference.upsert({
    where: { nom: 'Génie Informatique' },
    create: { nom: 'Génie Informatique', niveau: 'LICENCE', actif: true },
    update: { niveau: 'LICENCE', actif: true },
  });

  const adminPigier = await p.adminEtablissement.findFirst({
    where: { etablissementId: pigierId },
    select: { id: true },
  });
  const adminUatm = await p.adminEtablissement.findFirst({
    where: { etablissementId: templateFiliere.etablissementId },
    select: { id: true },
  });

  async function linkDemande(filiereId, etablissementId, adminId, nom) {
    if (!adminId) return;
    const existing = await p.demandeAjoutFiliere.findFirst({
      where: { filiereId },
    });
    if (existing) {
      await p.demandeAjoutFiliere.update({
        where: { id: existing.id },
        data: {
          filiereReferenceId: ref.id,
          statut: 'VALIDE',
          nom,
        },
      });
      return;
    }
    await p.demandeAjoutFiliere.create({
      data: {
        etablissementId,
        demandeParId: adminId,
        nom,
        niveau: 'LICENCE',
        dureeAnnees: 3,
        filiereReferenceId: ref.id,
        statut: 'VALIDE',
        decidedAt: new Date(),
        decidedBy: TAG,
        filiereId,
      },
    });
  }

  await linkDemande(filiere.id, pigierId, adminPigier?.id, 'Génie Informatique');
  await linkDemande(
    templateFiliere.id,
    templateFiliere.etablissementId,
    adminUatm?.id,
    templateFiliere.nom
  );

  return filiere;
}

async function cloneCampagne({ source, anneeCible, statut, createdBy }) {
  const existing = await p.campagneInscription.findFirst({
    where: {
      etablissementId: source.etablissementId,
      anneeAcademique: anneeCible,
    },
    include: { filieres: true },
  });
  if (existing) {
    // Assurer le statut et la présence des filières source
    await p.campagneInscription.update({
      where: { id: existing.id },
      data: { statut, piecesRequises: source.piecesRequises ?? undefined },
    });
    for (const cf of source.filieres) {
      await p.campagneFiliere.upsert({
        where: {
          campagneId_filiereId: {
            campagneId: existing.id,
            filiereId: cf.filiereId,
          },
        },
        create: {
          campagneId: existing.id,
          filiereId: cf.filiereId,
          fraisDossier: cf.fraisDossier,
          placesDisponibles: cf.placesDisponibles,
          criteresSelection: cf.criteresSelection,
          seriesAcceptees: cf.seriesAcceptees ?? [],
          niveauMinBac: cf.niveauMinBac,
          autresCriteres: cf.autresCriteres ?? undefined,
        },
        update: {
          fraisDossier: cf.fraisDossier,
          placesDisponibles: cf.placesDisponibles,
        },
      });
    }
    return { campagne: existing, created: false };
  }

  const yearStart = Number(anneeCible.split('-')[0]);
  const dateOuverture =
    statut === 'CLOTUREE'
      ? new Date(`${yearStart - 1}-09-01T00:00:00.000Z`)
      : new Date(`${yearStart}-09-01T00:00:00.000Z`);
  const dateCloture =
    statut === 'CLOTUREE'
      ? new Date(`${yearStart}-01-31T23:59:59.000Z`)
      : new Date(`${yearStart + 1}-01-31T23:59:59.000Z`);

  const campagne = await p.campagneInscription.create({
    data: {
      etablissementId: source.etablissementId,
      titre: source.titre.replace(ANNEE_COURANTE, anneeCible),
      anneeAcademique: anneeCible,
      dateOuverture,
      dateCloture,
      description: `${TAG} — campagne ${statut} ${anneeCible}`,
      piecesRequises: source.piecesRequises ?? undefined,
      statut,
      createdBy: createdBy || TAG,
      filieres: {
        create: source.filieres.map((cf) => ({
          filiereId: cf.filiereId,
          fraisDossier: cf.fraisDossier,
          placesDisponibles: cf.placesDisponibles,
          criteresSelection: cf.criteresSelection,
          seriesAcceptees: cf.seriesAcceptees ?? [],
          niveauMinBac: cf.niveauMinBac,
          autresCriteres: cf.autresCriteres ?? undefined,
        })),
      },
    },
    include: { filieres: true },
  });
  return { campagne, created: true };
}

async function ensureCampagneHasFiliere(campagneId, filiereId, templateCf) {
  await p.campagneFiliere.upsert({
    where: { campagneId_filiereId: { campagneId, filiereId } },
    create: {
      campagneId,
      filiereId,
      fraisDossier: templateCf?.fraisDossier || 5000,
      placesDisponibles: templateCf?.placesDisponibles || 50,
      seriesAcceptees: templateCf?.seriesAcceptees || ['A', 'B', 'C', 'D', 'G1', 'G2', 'G3'],
    },
    update: {},
  });
}

async function wipeSeedValidations() {
  return (
    await p.validationUE.deleteMany({
      where: { decidedBy: TAG },
    })
  ).count;
}

async function wipeSeedInscriptionsTagged() {
  // Les inscriptions seedées sont repérées via preinscription SEED-MULTI ou decidedBy TAG
  // On ne wipe pas tout : on upsert par (candidat, filiere, annee).
  return 0;
}

async function ensureInscription({
  candidatId,
  etablissementId,
  filiereId,
  anneeAcademique,
  niveau,
  statut,
}) {
  const existing = await p.inscriptionAcademique.findFirst({
    where: { candidatId, filiereId, anneeAcademique },
  });
  if (existing) {
    const updated = await p.inscriptionAcademique.update({
      where: { id: existing.id },
      data: {
        niveau,
        statut,
        etablissementId,
        confirmeeAt: existing.confirmeeAt || new Date(),
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
      statut,
      confirmeeAt: new Date(),
    },
  });
  return { inscription: created, created: true };
}

async function applyProfil({ inscriptionId, unites, profilKey }) {
  const pattern = PROFILS[profilKey];
  if (!pattern || !unites.length) return { applied: 0 };
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
  return { applied, profil: profilKey };
}

async function seedValidationsForInscription(inscription, profilImpair, profilPair) {
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
  const r1 = await applyProfil({
    inscriptionId: inscription.id,
    unites: unitesImpair,
    profilKey: profilImpair,
  });
  const r2 = await applyProfil({
    inscriptionId: inscription.id,
    unites: unitesPair,
    profilKey: profilPair,
  });
  return {
    applied: r1.applied + r2.applied,
    ueImpair: unitesImpair.length,
    uePair: unitesPair.length,
  };
}

(async () => {
  const summary = {
    annees: [ANNEE_ARCHIVE, ANNEE_COURANTE, ANNEE_SUIVANTE],
    campagnes: [],
    filiereGiPigier: null,
    wipedValidations: 0,
    inscriptions: [],
    validationsApplied: 0,
    errors: [],
  };

  await ensureAnnees();
  summary.wipedValidations = await wipeSeedValidations();
  await wipeSeedInscriptionsTagged();

  const pigier = await resolveEtab('Pigier');
  const uatm = await resolveEtab('Université Africaine de Technologie');

  const pigierGtl = await resolveFiliere(pigier.id, 'PIGIER-GTL-L');
  const pigierRgl = await resolveFiliere(pigier.id, 'PIGIER-RGL-L');
  const pigierCm = await resolveFiliere(pigier.id, 'PIGIER-CM-M');
  const uatmGi = await resolveFiliere(uatm.id, 'UATM-GI-L');
  const uatmGc = await resolveFiliere(uatm.id, 'UATM-GC-L');
  const uatmMo = await resolveFiliere(uatm.id, 'UATM-MO-L');

  const pigierGi = await ensureFiliereGiPigier(pigier.id, uatmGi);
  summary.filiereGiPigier = { id: pigierGi.id, code: pigierGi.code, nom: pigierGi.nom };

  // Campagnes source 2026-2027
  const sources = [];
  for (const etab of [pigier, uatm]) {
    const src = await p.campagneInscription.findFirst({
      where: { etablissementId: etab.id, anneeAcademique: ANNEE_COURANTE },
      include: { filieres: true },
    });
    if (!src) throw new Error(`Campagne ${ANNEE_COURANTE} manquante pour ${etab.nom}`);
    sources.push(src);
  }

  const adminPigier = await p.adminEtablissement.findFirst({
    where: { etablissementId: pigier.id },
    select: { id: true },
  });

  for (const src of sources) {
    for (const [annee, statut] of [
      [ANNEE_ARCHIVE, 'CLOTUREE'],
      [ANNEE_SUIVANTE, 'PUBLIEE'],
    ]) {
      const r = await cloneCampagne({
        source: src,
        anneeCible: annee,
        statut,
        createdBy: adminPigier?.id || TAG,
      });
      summary.campagnes.push({
        etabId: src.etablissementId,
        annee,
        statut,
        created: r.created,
        campagneId: r.campagne.id,
        nFilieres: r.campagne.filieres?.length ?? null,
      });

      // Ajouter PIGIER-GI-L aux campagnes Pigier
      if (src.etablissementId === pigier.id) {
        const templateCf = src.filieres[0];
        await ensureCampagneHasFiliere(r.campagne.id, pigierGi.id, templateCf);
        // Aussi sur la campagne courante
        await ensureCampagneHasFiliere(src.id, pigierGi.id, templateCf);
      }
    }
  }

  /**
   * Scénarios inscription (beaucoup de situations).
   *
   * Format :
   *  email, etab, filiere, annee, niveau, statut, sImpair, sPair, note
   */
  const SCENARIOS = [
    // ═══ 2025-2026 archive ═══════════════════════════════════════════
    // Passant L1 GTL Pigier → pourra être L2 en 2026-2027
    {
      n: 12,
      etab: pigier,
      filiere: pigierGtl,
      annee: ANNEE_ARCHIVE,
      niveau: 1,
      statut: 'VALIDE',
      sImpair: 'excellent',
      sPair: 'bon',
      note: 'passant_archive_gtl_l1',
    },
    // Redoublant L1 GTL Pigier
    {
      n: 5,
      etab: pigier,
      filiere: pigierGtl,
      annee: ANNEE_ARCHIVE,
      niveau: 1,
      statut: 'REDOUBLANT',
      sImpair: 'echec',
      sPair: 'faible',
      note: 'redoublant_archive_gtl_l1',
    },
    // Passant L2 GTL
    {
      n: 10,
      etab: pigier,
      filiere: pigierGtl,
      annee: ANNEE_ARCHIVE,
      niveau: 2,
      statut: 'VALIDE',
      sImpair: 'excellent',
      sPair: 'excellent',
      note: 'passant_archive_gtl_l2',
    },
    // Redoublant L2 GTL
    {
      n: 3,
      etab: pigier,
      filiere: pigierGtl,
      annee: ANNEE_ARCHIVE,
      niveau: 2,
      statut: 'REDOUBLANT',
      sImpair: 'faible',
      sPair: 'echec',
      note: 'redoublant_archive_gtl_l2',
    },
    // Master passant M1
    {
      n: 1,
      etab: pigier,
      filiere: pigierCm,
      annee: ANNEE_ARCHIVE,
      niveau: 4,
      statut: 'VALIDE',
      sImpair: 'excellent',
      sPair: 'bon',
      note: 'passant_archive_master_m1',
    },
    // UATM GI passant — transfert même filière vers Pigier GI (niveau max 2)
    {
      n: 15,
      etab: uatm,
      filiere: uatmGi,
      annee: ANNEE_ARCHIVE,
      niveau: 1,
      statut: 'VALIDE',
      sImpair: 'excellent',
      sPair: 'bon',
      note: 'transfert_passant_uatm_gi',
    },
    // UATM GI redoublant — transfert même filière Pigier GI (niveau max 1)
    {
      n: 14,
      etab: uatm,
      filiere: uatmGi,
      annee: ANNEE_ARCHIVE,
      niveau: 1,
      statut: 'REDOUBLANT',
      sImpair: 'echec',
      sPair: 'faible',
      note: 'transfert_redoublant_uatm_gi',
    },
    // UATM GC passant — autre filière libre chez Pigier
    {
      n: 13,
      etab: uatm,
      filiere: uatmGc,
      annee: ANNEE_ARCHIVE,
      niveau: 2,
      statut: 'VALIDE',
      sImpair: 'bon',
      sPair: 'moyen',
      note: 'transfert_autre_filiere_uatm_gc',
    },
    // RGL Pigier passant L1
    {
      n: 9,
      etab: pigier,
      filiere: pigierRgl,
      annee: ANNEE_ARCHIVE,
      niveau: 1,
      statut: 'VALIDE',
      sImpair: 'bon',
      sPair: 'excellent',
      note: 'passant_archive_rgl_l1',
    },
    // UATM MO abandonné
    {
      n: 11,
      etab: uatm,
      filiere: uatmMo,
      annee: ANNEE_ARCHIVE,
      niveau: 1,
      statut: 'ABANDONNE',
      sImpair: 'moyen',
      sPair: 'faible',
      note: 'abandon_archive_uatm_mo',
    },

    // ═══ 2026-2027 suite / continuum ═════════════════════════════════
    // Passant archive → L2 courante
    {
      n: 12,
      etab: pigier,
      filiere: pigierGtl,
      annee: ANNEE_COURANTE,
      niveau: 2,
      statut: 'EN_COURS',
      sImpair: 'bon',
      sPair: 'moyen',
      note: 'suite_passant_gtl_l2_courante',
    },
    // Redoublant archive → L1 courante
    {
      n: 5,
      etab: pigier,
      filiere: pigierGtl,
      annee: ANNEE_COURANTE,
      niveau: 1,
      statut: 'EN_COURS',
      sImpair: 'moyen',
      sPair: 'bon',
      note: 'suite_redoublant_gtl_l1_courante',
    },
    // Passant L2 archive → L3 courante
    {
      n: 10,
      etab: pigier,
      filiere: pigierGtl,
      annee: ANNEE_COURANTE,
      niveau: 3,
      statut: 'EN_COURS',
      sImpair: 'excellent',
      sPair: 'bon',
      note: 'suite_passant_gtl_l3_courante',
    },
    // Master M1 → M2 courante
    {
      n: 1,
      etab: pigier,
      filiere: pigierCm,
      annee: ANNEE_COURANTE,
      niveau: 5,
      statut: 'EN_COURS',
      sImpair: 'excellent',
      sPair: 'excellent',
      note: 'suite_passant_master_m2_courante',
    },
    // Transfert déjà effectué : passant UATM GI → Pigier GI L2 (année courante)
    {
      n: 15,
      etab: pigier,
      filiere: pigierGi,
      annee: ANNEE_COURANTE,
      niveau: 2,
      statut: 'EN_COURS',
      sImpair: 'bon',
      sPair: 'moyen',
      note: 'transfert_effectue_passant_pigier_gi_l2',
    },
    // Redoublant UATM GI reste L1 ailleurs (UATM) en courante
    {
      n: 14,
      etab: uatm,
      filiere: uatmGi,
      annee: ANNEE_COURANTE,
      niveau: 1,
      statut: 'EN_COURS',
      sImpair: 'moyen',
      sPair: 'faible',
      note: 'redoublant_reste_l1_uatm_gi_courante',
    },
    // Décisions déjà posées sur année courante (pour tester suite 2027-2028)
    {
      n: 2,
      etab: pigier,
      filiere: pigierGtl,
      annee: ANNEE_COURANTE,
      niveau: 1,
      statut: 'VALIDE',
      sImpair: 'excellent',
      sPair: 'excellent',
      note: 'decision_passant_courante_pour_suite',
    },
    {
      n: 4,
      etab: pigier,
      filiere: pigierGtl,
      annee: ANNEE_COURANTE,
      niveau: 1,
      statut: 'REDOUBLANT',
      sImpair: 'echec',
      sPair: 'faible',
      note: 'decision_redoublant_courante_pour_suite',
    },
    {
      n: 6,
      etab: uatm,
      filiere: uatmGi,
      annee: ANNEE_COURANTE,
      niveau: 2,
      statut: 'VALIDE',
      sImpair: 'excellent',
      sPair: 'bon',
      note: 'decision_passant_uatm_gi_l2_courante',
    },
    {
      n: 7,
      etab: uatm,
      filiere: uatmGc,
      annee: ANNEE_COURANTE,
      niveau: 1,
      statut: 'REDOUBLANT',
      sImpair: 'faible',
      sPair: 'echec',
      note: 'decision_redoublant_uatm_gc_courante',
    },
    {
      n: 8,
      etab: pigier,
      filiere: pigierRgl,
      annee: ANNEE_COURANTE,
      niveau: 3,
      statut: 'VALIDE',
      sImpair: 'excellent',
      sPair: 'excellent',
      note: 'fin_cycle_licence_rgl_l3_passant',
    },

    // ═══ 2027-2028 année suivante ════════════════════════════════════
    // Suite passant L1→L2
    {
      n: 2,
      etab: pigier,
      filiere: pigierGtl,
      annee: ANNEE_SUIVANTE,
      niveau: 2,
      statut: 'EN_COURS',
      sImpair: 'bon',
      sPair: 'moyen',
      note: 'suite_annee_suivante_passant_l2',
    },
    // Suite redoublant L1→L1
    {
      n: 4,
      etab: pigier,
      filiere: pigierGtl,
      annee: ANNEE_SUIVANTE,
      niveau: 1,
      statut: 'EN_COURS',
      sImpair: 'vide',
      sPair: 'vide',
      note: 'suite_annee_suivante_redoublant_l1',
      skipValidations: true,
    },
    // Suite passant UATM GI L2→L3
    {
      n: 6,
      etab: uatm,
      filiere: uatmGi,
      annee: ANNEE_SUIVANTE,
      niveau: 3,
      statut: 'EN_COURS',
      sImpair: 'vide',
      sPair: 'vide',
      note: 'suite_annee_suivante_uatm_gi_l3',
      skipValidations: true,
    },
    // Suite redoublant UATM GC L1→L1
    {
      n: 7,
      etab: uatm,
      filiere: uatmGc,
      annee: ANNEE_SUIVANTE,
      niveau: 1,
      statut: 'EN_COURS',
      sImpair: 'vide',
      sPair: 'vide',
      note: 'suite_annee_suivante_uatm_gc_redoublant',
      skipValidations: true,
    },
    // Fin de cycle L3 : pas de suite (on ne crée PAS d'inscription 2027 pour n=8)
    // Étudiant déjà en L2 courante qui passera plus tard
    {
      n: 12,
      etab: pigier,
      filiere: pigierGtl,
      annee: ANNEE_SUIVANTE,
      niveau: 3,
      statut: 'EN_COURS',
      sImpair: 'vide',
      sPair: 'vide',
      note: 'projection_passant_gtl_l3_suivante',
      skipValidations: true,
    },
    // Transfert potentiel année suivante : redoublant GI peut viser Pigier GI L1 seulement
    // (pas d'inscription Pigier pour n=14 en 2027 — laisse le test manuel de contrainte)
    // Passant GI déjà chez Pigier → L3 en suivante
    {
      n: 15,
      etab: pigier,
      filiere: pigierGi,
      annee: ANNEE_SUIVANTE,
      niveau: 3,
      statut: 'EN_COURS',
      sImpair: 'vide',
      sPair: 'vide',
      note: 'suite_transfert_pigier_gi_l3_suivante',
      skipValidations: true,
    },
  ];

  for (const row of SCENARIOS) {
    try {
      const candidat = await resolveCandidat(emailCandidat(row.n));
      const { inscription, created } = await ensureInscription({
        candidatId: candidat.id,
        etablissementId: row.etab.id,
        filiereId: row.filiere.id,
        anneeAcademique: row.annee,
        niveau: row.niveau,
        statut: row.statut,
      });

      let validations = { applied: 0 };
      if (!row.skipValidations && row.sImpair && row.sImpair !== 'vide') {
        validations = await seedValidationsForInscription(
          inscription,
          row.sImpair,
          row.sPair === 'vide' ? 'faible' : row.sPair
        );
        summary.validationsApplied += validations.applied;
      }

      summary.inscriptions.push({
        note: row.note,
        email: candidat.email,
        etab: row.etab.nom,
        filiere: row.filiere.code,
        annee: row.annee,
        niveau: row.niveau,
        statut: row.statut,
        created,
        validations,
      });
    } catch (err) {
      summary.errors.push({ note: row.note, n: row.n, error: err.message });
    }
  }

  // Stats finales
  const byAnnee = await p.inscriptionAcademique.groupBy({
    by: ['anneeAcademique', 'statut'],
    _count: true,
  });
  summary.statsFinales = byAnnee;
  summary.campagnesCount = await p.campagneInscription.groupBy({
    by: ['anneeAcademique', 'statut'],
    _count: true,
  });

  console.log(JSON.stringify(summary, null, 2));
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
