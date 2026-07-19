const prisma = require('../prisma');
const {
  resolveEtablissementIdFromReq,
} = require('../utils/etablissement-access.helper');
const { getAnneeEnCoursDges } = require('../utils/annee-academique.helper');
const { assurerInscriptionAnneeSuivante } = require('../utils/passage-annee.helper');

const STATUTS = ['VALIDE', 'NON_VALIDE'];

exports.listerPourValidation = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const anneeEtude = req.query.anneeEtude !== undefined && req.query.anneeEtude !== ''
      ? Number(req.query.anneeEtude)
      : null;
    const uniteId = req.query.uniteId ? String(req.query.uniteId).trim() : '';

    if (!anneeEtude || !Number.isInteger(anneeEtude) || anneeEtude < 1 || anneeEtude > 5) {
      return res.status(400).json({ error: 'anneeEtude est requis (1 a 5)' });
    }
    if (!uniteId) {
      return res.status(400).json({ error: 'uniteId est requis' });
    }

    const annee = await getAnneeEnCoursDges();
    if (!annee?.libelle) {
      return res.status(400).json({ error: 'Aucune annee academique DGES en cours' });
    }

    const unite = await prisma.uniteEnseignement.findUnique({
      where: { id: uniteId },
      include: {
        filiere: { select: { id: true, nom: true, code: true, etablissementId: true } },
      },
    });
    if (!unite || unite.filiere.etablissementId !== etablissementId) {
      return res.status(404).json({ error: 'UE non trouvee' });
    }
    if (unite.anneeEtude !== anneeEtude) {
      return res.status(400).json({
        error: `Cette UE appartient a l'annee d'etude ${unite.anneeEtude}, pas ${anneeEtude}`,
      });
    }

    const inscriptions = await prisma.inscriptionAcademique.findMany({
      where: {
        etablissementId,
        filiereId: unite.filiereId,
        anneeAcademique: annee.libelle,
        niveau: anneeEtude,
        statut: { not: 'ABANDONNE' },
      },
      include: {
        candidat: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            email: true,
            sexe: true,
          },
        },
        filiere: { select: { id: true, nom: true, code: true } },
        validationsUE: {
          where: { uniteEnseignementId: uniteId },
          select: { id: true, statut: true, decidedAt: true },
        },
      },
      orderBy: [{ candidat: { nom: 'asc' } }, { candidat: { prenom: 'asc' } }],
    });

    const etudiants = inscriptions.map((ins) => {
      const validation = ins.validationsUE[0] || null;
      return {
        inscriptionId: ins.id,
        niveau: ins.niveau,
        anneeAcademique: ins.anneeAcademique,
        candidat: ins.candidat,
        filiere: ins.filiere,
        validation: validation
          ? { id: validation.id, statut: validation.statut, decidedAt: validation.decidedAt }
          : null,
      };
    });

    return res.json({
      anneeAcademiqueEnCours: annee.libelle,
      anneeEtude,
      unite: {
        id: unite.id,
        code: unite.code,
        libelle: unite.libelle,
        credits: unite.credits,
        semestre: unite.semestre,
        semestreLabel: `S${unite.semestre}`,
        anneeEtude: unite.anneeEtude,
        filiere: unite.filiere,
      },
      etudiants,
      stats: {
        total: etudiants.length,
        valides: etudiants.filter((e) => e.validation?.statut === 'VALIDE').length,
        nonValides: etudiants.filter((e) => e.validation?.statut === 'NON_VALIDE').length,
        nonRenseignes: etudiants.filter((e) => !e.validation).length,
      },
    });
  } catch (error) {
    console.error('Erreur listerPourValidation:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.listerUesPourAnnee = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const anneeEtude = req.query.anneeEtude !== undefined && req.query.anneeEtude !== ''
      ? Number(req.query.anneeEtude)
      : null;
    const filiereId = req.query.filiereId ? String(req.query.filiereId).trim() : '';
    const semestre = req.query.semestre !== undefined && req.query.semestre !== ''
      ? Number(req.query.semestre)
      : null;

    if (!anneeEtude || !Number.isInteger(anneeEtude) || anneeEtude < 1 || anneeEtude > 5) {
      return res.status(400).json({ error: 'anneeEtude est requis (1 a 5)' });
    }
    if (semestre != null) {
      const expected = [2 * anneeEtude - 1, 2 * anneeEtude];
      if (!Number.isInteger(semestre) || !expected.includes(semestre)) {
        return res.status(400).json({
          error: `semestre invalide pour l'annee ${anneeEtude} (attendu ${expected.join(' ou ')})`,
        });
      }
    }

    const unites = await prisma.uniteEnseignement.findMany({
      where: {
        anneeEtude,
        ...(semestre != null ? { semestre } : {}),
        filiere: {
          etablissementId,
          ...(filiereId ? { id: filiereId } : {}),
        },
      },
      include: {
        filiere: { select: { id: true, nom: true, code: true } },
      },
      orderBy: [
        { filiere: { nom: 'asc' } },
        { semestre: 'asc' },
        { code: 'asc' },
      ],
    });

    return res.json({
      anneeEtude,
      unites: unites.map((u) => ({
        ...u,
        semestreLabel: `S${u.semestre}`,
      })),
    });
  } catch (error) {
    console.error('Erreur listerUesPourAnnee:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

function roundPct(num, den) {
  if (!den || den <= 0) return null;
  return Math.round((num / den) * 1000) / 10;
}

/** Règles passage : <60% UE → redoublant auto ; 100% → passant auto ; sinon manuel. */
const SEUIL_REDOUBLEMENT_UE = 60;

function modeDecisionPassage(pourcentageUe) {
  if (pourcentageUe == null || Number.isNaN(Number(pourcentageUe))) {
    return 'INDETERMINE';
  }
  const pct = Number(pourcentageUe);
  if (pct < SEUIL_REDOUBLEMENT_UE) return 'AUTO_REDOUBLANT';
  if (pct >= 100) return 'AUTO_PASSANT';
  return 'MANUEL';
}

function labelDecisionPassage(statut) {
  if (statut === 'VALIDE') return 'Passant';
  if (statut === 'REDOUBLANT') return 'Redoublant';
  if (statut === 'EN_COURS') return 'En cours';
  return statut || '—';
}

function agregatSemestre(unites, validationsByUe) {
  let validesUe = 0;
  let validesCredits = 0;
  let nonValidesUe = 0;
  let nonValidesCredits = 0;
  let nonRenseignesUe = 0;
  let nonRenseignesCredits = 0;
  const totaux = {
    ue: unites.length,
    credits: unites.reduce((sum, u) => sum + (Number(u.credits) || 0), 0),
  };

  for (const u of unites) {
    const credits = Number(u.credits) || 0;
    const statut = validationsByUe.get(u.id)?.statut || null;
    if (statut === 'VALIDE') {
      validesUe += 1;
      validesCredits += credits;
    } else if (statut === 'NON_VALIDE') {
      nonValidesUe += 1;
      nonValidesCredits += credits;
    } else {
      nonRenseignesUe += 1;
      nonRenseignesCredits += credits;
    }
  }

  return {
    totaux,
    valides: { ue: validesUe, credits: validesCredits },
    nonValides: { ue: nonValidesUe, credits: nonValidesCredits },
    nonRenseignes: { ue: nonRenseignesUe, credits: nonRenseignesCredits },
    pourcentageCredits: roundPct(validesCredits, totaux.credits),
    pourcentageUe: roundPct(validesUe, totaux.ue),
  };
}

/**
 * Bilan de validation par étudiant pour un semestre (catalogue UE + ValidationUE).
 * GET ?filiereId&anneeEtude&semestre
 */
exports.listerBilan = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const filiereId = req.query.filiereId ? String(req.query.filiereId).trim() : '';
    const anneeEtude = req.query.anneeEtude !== undefined && req.query.anneeEtude !== ''
      ? Number(req.query.anneeEtude)
      : null;
    const semestre = req.query.semestre !== undefined && req.query.semestre !== ''
      ? Number(req.query.semestre)
      : null;

    if (!filiereId) {
      return res.status(400).json({ error: 'filiereId est requis' });
    }
    if (!anneeEtude || !Number.isInteger(anneeEtude) || anneeEtude < 1 || anneeEtude > 5) {
      return res.status(400).json({ error: 'anneeEtude est requis (1 a 5)' });
    }
    if (!semestre || !Number.isInteger(semestre) || semestre < 1 || semestre > 10) {
      return res.status(400).json({ error: 'semestre est requis (1 a 10)' });
    }
    const expected = [2 * anneeEtude - 1, 2 * anneeEtude];
    if (!expected.includes(semestre)) {
      return res.status(400).json({
        error: `semestre invalide pour l'annee ${anneeEtude} (attendu ${expected.join(' ou ')})`,
      });
    }

    const annee = await getAnneeEnCoursDges();
    if (!annee?.libelle) {
      return res.status(400).json({ error: 'Aucune annee academique DGES en cours' });
    }

    const filiere = await prisma.filiere.findFirst({
      where: { id: filiereId, etablissementId },
      select: { id: true, nom: true, code: true, niveau: true, dureeAnnees: true },
    });
    if (!filiere) {
      return res.status(404).json({ error: 'Filiere non trouvee' });
    }

    const unites = await prisma.uniteEnseignement.findMany({
      where: { filiereId, anneeEtude, semestre },
      select: {
        id: true,
        code: true,
        libelle: true,
        credits: true,
        semestre: true,
        anneeEtude: true,
        ordre: true,
      },
      orderBy: [{ ordre: 'asc' }, { code: 'asc' }],
    });

    const totaux = {
      ue: unites.length,
      credits: unites.reduce((sum, u) => sum + (Number(u.credits) || 0), 0),
    };

    const uniteIds = unites.map((u) => u.id);

    const inscriptions = await prisma.inscriptionAcademique.findMany({
      where: {
        etablissementId,
        filiereId,
        anneeAcademique: annee.libelle,
        niveau: anneeEtude,
        statut: { not: 'ABANDONNE' },
      },
      include: {
        candidat: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        validationsUE: uniteIds.length
          ? {
              where: { uniteEnseignementId: { in: uniteIds } },
              select: { uniteEnseignementId: true, statut: true, decidedAt: true },
            }
          : false,
      },
      orderBy: [{ candidat: { nom: 'asc' } }, { candidat: { prenom: 'asc' } }],
    });

    const etudiants = inscriptions.map((ins) => {
      const byUe = new Map(
        (ins.validationsUE || []).map((v) => [v.uniteEnseignementId, v])
      );

      let validesUe = 0;
      let validesCredits = 0;
      let nonValidesUe = 0;
      let nonValidesCredits = 0;
      let nonRenseignesUe = 0;
      let nonRenseignesCredits = 0;

      const detail = unites.map((u) => {
        const credits = Number(u.credits) || 0;
        const validation = byUe.get(u.id) || null;
        const statut = validation?.statut || null;
        if (statut === 'VALIDE') {
          validesUe += 1;
          validesCredits += credits;
        } else if (statut === 'NON_VALIDE') {
          nonValidesUe += 1;
          nonValidesCredits += credits;
        } else {
          nonRenseignesUe += 1;
          nonRenseignesCredits += credits;
        }
        return {
          uniteId: u.id,
          code: u.code,
          libelle: u.libelle,
          credits,
          statut,
          decidedAt: validation?.decidedAt || null,
        };
      });

      return {
        inscriptionId: ins.id,
        niveau: ins.niveau,
        anneeAcademique: ins.anneeAcademique,
        candidat: ins.candidat,
        totaux,
        valides: { ue: validesUe, credits: validesCredits },
        nonValides: { ue: nonValidesUe, credits: nonValidesCredits },
        nonRenseignes: { ue: nonRenseignesUe, credits: nonRenseignesCredits },
        pourcentageCredits: roundPct(validesCredits, totaux.credits),
        pourcentageUe: roundPct(validesUe, totaux.ue),
        unites: detail,
      };
    });

    return res.json({
      anneeAcademiqueEnCours: annee.libelle,
      filiere,
      anneeEtude,
      semestre,
      semestreLabel: `S${semestre}`,
      catalogue: {
        totaux,
        unites: unites.map((u) => ({
          id: u.id,
          code: u.code,
          libelle: u.libelle,
          credits: u.credits,
        })),
      },
      etudiants,
      stats: {
        totalEtudiants: etudiants.length,
        moyennePourcentageCredits:
          etudiants.length && totaux.credits > 0
            ? Math.round(
                (etudiants.reduce((s, e) => s + (e.pourcentageCredits || 0), 0) / etudiants.length) * 10
              ) / 10
            : null,
        moyennePourcentageUe:
          etudiants.length && totaux.ue > 0
            ? Math.round(
                (etudiants.reduce((s, e) => s + (e.pourcentageUe || 0), 0) / etudiants.length) * 10
              ) / 10
            : null,
      },
    });
  } catch (error) {
    console.error('Erreur listerBilan:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Bilan année (2 semestres) + application auto des décisions de passage.
 * GET ?filiereId&anneeEtude
 * Règles (% UE année) :
 *   < 60        → REDOUBLANT (auto)
 *   = 100       → VALIDE / Passant (auto)
 *   60 ≤ x < 100 → choix manuel
 */
exports.listerBilanAnnee = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const filiereId = req.query.filiereId ? String(req.query.filiereId).trim() : '';
    const anneeEtude = req.query.anneeEtude !== undefined && req.query.anneeEtude !== ''
      ? Number(req.query.anneeEtude)
      : null;

    if (!filiereId) {
      return res.status(400).json({ error: 'filiereId est requis' });
    }
    if (!anneeEtude || !Number.isInteger(anneeEtude) || anneeEtude < 1 || anneeEtude > 5) {
      return res.status(400).json({ error: 'anneeEtude est requis (1 a 5)' });
    }

    const annee = await getAnneeEnCoursDges();
    if (!annee?.libelle) {
      return res.status(400).json({ error: 'Aucune annee academique DGES en cours' });
    }

    const filiere = await prisma.filiere.findFirst({
      where: { id: filiereId, etablissementId },
      select: { id: true, nom: true, code: true, niveau: true, dureeAnnees: true },
    });
    if (!filiere) {
      return res.status(404).json({ error: 'Filiere non trouvee' });
    }

    const semestreImpair = 2 * anneeEtude - 1;
    const semestrePair = 2 * anneeEtude;

    const unites = await prisma.uniteEnseignement.findMany({
      where: { filiereId, anneeEtude },
      select: {
        id: true,
        code: true,
        libelle: true,
        credits: true,
        semestre: true,
        anneeEtude: true,
        ordre: true,
      },
      orderBy: [{ semestre: 'asc' }, { ordre: 'asc' }, { code: 'asc' }],
    });

    const unitesS1 = unites.filter((u) => u.semestre === semestreImpair);
    const unitesS2 = unites.filter((u) => u.semestre === semestrePair);
    const uniteIds = unites.map((u) => u.id);

    const totauxAnnee = {
      ue: unites.length,
      credits: unites.reduce((sum, u) => sum + (Number(u.credits) || 0), 0),
    };

    const inscriptions = await prisma.inscriptionAcademique.findMany({
      where: {
        etablissementId,
        filiereId,
        anneeAcademique: annee.libelle,
        niveau: anneeEtude,
        statut: { not: 'ABANDONNE' },
      },
      include: {
        candidat: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        validationsUE: uniteIds.length
          ? {
              where: { uniteEnseignementId: { in: uniteIds } },
              select: { uniteEnseignementId: true, statut: true },
            }
          : false,
      },
      orderBy: [{ candidat: { nom: 'asc' } }, { candidat: { prenom: 'asc' } }],
    });

    const autoUpdates = [];
    const etudiants = [];

    for (const ins of inscriptions) {
      const byUe = new Map(
        (ins.validationsUE || []).map((v) => [v.uniteEnseignementId, v])
      );

      const semestreA = agregatSemestre(unitesS1, byUe);
      const semestreB = agregatSemestre(unitesS2, byUe);

      const validesUe = semestreA.valides.ue + semestreB.valides.ue;
      const validesCredits = semestreA.valides.credits + semestreB.valides.credits;
      const nonValidesUe = semestreA.nonValides.ue + semestreB.nonValides.ue;
      const nonValidesCredits = semestreA.nonValides.credits + semestreB.nonValides.credits;
      const nonRenseignesUe = semestreA.nonRenseignes.ue + semestreB.nonRenseignes.ue;
      const nonRenseignesCredits = semestreA.nonRenseignes.credits + semestreB.nonRenseignes.credits;

      const pourcentageUe = roundPct(validesUe, totauxAnnee.ue);
      const pourcentageCredits = roundPct(validesCredits, totauxAnnee.credits);
      const mode = modeDecisionPassage(pourcentageUe);

      let statut = ins.statut;
      let decisionAppliquee = null;
      let suiteAnneeSuivante = null;

      if (mode === 'AUTO_REDOUBLANT' && statut !== 'REDOUBLANT') {
        await prisma.inscriptionAcademique.update({
          where: { id: ins.id },
          data: { statut: 'REDOUBLANT' },
        });
        statut = 'REDOUBLANT';
        decisionAppliquee = 'AUTO_REDOUBLANT';
        autoUpdates.push({ inscriptionId: ins.id, statut: 'REDOUBLANT' });
      } else if (mode === 'AUTO_PASSANT' && statut !== 'VALIDE') {
        await prisma.inscriptionAcademique.update({
          where: { id: ins.id },
          data: { statut: 'VALIDE' },
        });
        statut = 'VALIDE';
        decisionAppliquee = 'AUTO_PASSANT';
        autoUpdates.push({ inscriptionId: ins.id, statut: 'VALIDE' });
      }

      if (statut === 'VALIDE' || statut === 'REDOUBLANT') {
        const suiteResult = await assurerInscriptionAnneeSuivante({
          inscription: {
            id: ins.id,
            candidatId: ins.candidatId,
            etablissementId: etablissementId,
            filiereId: ins.filiereId || filiere.id,
            anneeAcademique: ins.anneeAcademique,
            niveau: ins.niveau,
            filiere,
          },
          statutPassage: statut,
        });
        suiteAnneeSuivante = suiteResult;
      }

      etudiants.push({
        inscriptionId: ins.id,
        niveau: ins.niveau,
        anneeAcademique: ins.anneeAcademique,
        candidat: ins.candidat,
        statut,
        statutLabel: labelDecisionPassage(statut),
        modeDecision: mode,
        decisionManuelle: mode === 'MANUEL',
        decisionAppliquee,
        suiteAnneeSuivante: suiteAnneeSuivante?.suite
          ? {
              anneeAcademique: suiteAnneeSuivante.suite.anneeAcademique,
              niveau: suiteAnneeSuivante.suite.niveau,
              motif: suiteAnneeSuivante.motif,
            }
          : suiteAnneeSuivante?.motif === 'fin_de_cycle'
            ? { motif: 'fin_de_cycle', anneeSuivante: suiteAnneeSuivante.anneeSuivante }
            : null,
        semestres: {
          [semestreImpair]: { semestre: semestreImpair, ...semestreA },
          [semestrePair]: { semestre: semestrePair, ...semestreB },
        },
        totaux: totauxAnnee,
        valides: { ue: validesUe, credits: validesCredits },
        nonValides: { ue: nonValidesUe, credits: nonValidesCredits },
        nonRenseignes: { ue: nonRenseignesUe, credits: nonRenseignesCredits },
        pourcentageUe,
        pourcentageCredits,
      });
    }

    return res.json({
      anneeAcademiqueEnCours: annee.libelle,
      filiere,
      anneeEtude,
      semestres: [semestreImpair, semestrePair],
      regles: {
        seuilRedoublement: SEUIL_REDOUBLEMENT_UE,
        indicateur: 'pourcentageUe',
        autoRedoublant: `< ${SEUIL_REDOUBLEMENT_UE} % UE → Redoublant`,
        autoPassant: '100 % UE → Passant',
        manuel: `${SEUIL_REDOUBLEMENT_UE} % ≤ x < 100 % → choix manuel`,
      },
      catalogue: {
        totaux: totauxAnnee,
        parSemestre: {
          [semestreImpair]: {
            ue: unitesS1.length,
            credits: unitesS1.reduce((s, u) => s + (Number(u.credits) || 0), 0),
          },
          [semestrePair]: {
            ue: unitesS2.length,
            credits: unitesS2.reduce((s, u) => s + (Number(u.credits) || 0), 0),
          },
        },
      },
      autoUpdates,
      etudiants,
      stats: {
        totalEtudiants: etudiants.length,
        passants: etudiants.filter((e) => e.statut === 'VALIDE').length,
        redoublants: etudiants.filter((e) => e.statut === 'REDOUBLANT').length,
        enCours: etudiants.filter((e) => e.statut === 'EN_COURS').length,
        aTrancher: etudiants.filter((e) => e.modeDecision === 'MANUEL' && e.statut === 'EN_COURS').length,
      },
    });
  } catch (error) {
    console.error('Erreur listerBilanAnnee:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Décision manuelle Passant / Redoublant (uniquement si 60 % ≤ % UE < 100 %).
 * POST { inscriptionId, decision: 'PASSANT' | 'REDOUBLANT' }
 */
exports.deciderPassage = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const { inscriptionId, decision } = req.body || {};
    if (!inscriptionId || !['PASSANT', 'REDOUBLANT'].includes(decision)) {
      return res.status(400).json({
        error: 'inscriptionId et decision (PASSANT|REDOUBLANT) sont requis',
      });
    }

    const annee = await getAnneeEnCoursDges();
    if (!annee?.libelle) {
      return res.status(400).json({ error: 'Aucune annee academique DGES en cours' });
    }

    const inscription = await prisma.inscriptionAcademique.findFirst({
      where: {
        id: inscriptionId,
        etablissementId,
        anneeAcademique: annee.libelle,
        statut: { not: 'ABANDONNE' },
      },
      include: {
        filiere: {
          select: { id: true, nom: true, code: true, niveau: true, dureeAnnees: true },
        },
      },
    });
    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvee' });
    }

    const unites = await prisma.uniteEnseignement.findMany({
      where: {
        filiereId: inscription.filiereId,
        anneeEtude: inscription.niveau,
      },
      select: { id: true },
    });
    if (!unites.length) {
      return res.status(400).json({ error: 'Aucun catalogue UE pour cette annee d\'etude' });
    }

    const validations = await prisma.validationUE.findMany({
      where: {
        inscriptionAcadId: inscription.id,
        uniteEnseignementId: { in: unites.map((u) => u.id) },
        statut: 'VALIDE',
      },
      select: { id: true },
    });

    const pourcentageUe = roundPct(validations.length, unites.length);
    const mode = modeDecisionPassage(pourcentageUe);

    if (mode !== 'MANUEL') {
      const attendu = mode === 'AUTO_PASSANT' ? 'VALIDE' : mode === 'AUTO_REDOUBLANT' ? 'REDOUBLANT' : null;
      if (attendu) {
        const updated = await prisma.inscriptionAcademique.update({
          where: { id: inscription.id },
          data: { statut: attendu },
        });
        const suiteResult = await assurerInscriptionAnneeSuivante({
          inscription: { ...inscription, statut: updated.statut },
          statutPassage: attendu,
        });
        return res.status(400).json({
          error:
            mode === 'AUTO_PASSANT'
              ? 'Decision automatique : 100 % UE validees → Passant'
              : `Decision automatique : moins de ${SEUIL_REDOUBLEMENT_UE} % UE → Redoublant`,
          modeDecision: mode,
          pourcentageUe,
          statut: updated.statut,
          statutLabel: labelDecisionPassage(updated.statut),
          suiteAnneeSuivante: suiteResult?.suite || null,
          motifSuite: suiteResult?.motif || null,
        });
      }
      return res.status(400).json({
        error: 'Decision manuelle impossible (pourcentage UE indetermine)',
        modeDecision: mode,
        pourcentageUe,
      });
    }

    const statut = decision === 'PASSANT' ? 'VALIDE' : 'REDOUBLANT';
    const updated = await prisma.inscriptionAcademique.update({
      where: { id: inscription.id },
      data: { statut },
    });

    const suiteResult = await assurerInscriptionAnneeSuivante({
      inscription: { ...inscription, statut: updated.statut },
      statutPassage: statut,
    });

    let message = decision === 'PASSANT'
      ? 'Étudiant déclaré passant'
      : 'Étudiant déclaré redoublant';
    if (suiteResult?.suite) {
      message += ` — inscrit en ${suiteResult.suite.anneeAcademique} (niveau ${suiteResult.suite.niveau})`;
    } else if (suiteResult?.motif === 'fin_de_cycle') {
      message += ' — fin de cycle, pas d\'inscription sur l\'année suivante';
    }

    return res.json({
      message,
      inscriptionId: updated.id,
      statut: updated.statut,
      statutLabel: labelDecisionPassage(updated.statut),
      modeDecision: 'MANUEL',
      pourcentageUe,
      suiteAnneeSuivante: suiteResult?.suite || null,
      motifSuite: suiteResult?.motif || null,
    });
  } catch (error) {
    console.error('Erreur deciderPassage:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.marquerValidation = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const { inscriptionId, uniteId, statut } = req.body || {};
    if (!inscriptionId || !uniteId || !STATUTS.includes(statut)) {
      return res.status(400).json({
        error: 'inscriptionId, uniteId et statut (VALIDE|NON_VALIDE) sont requis',
      });
    }

    const inscription = await prisma.inscriptionAcademique.findFirst({
      where: {
        id: inscriptionId,
        etablissementId,
        statut: { not: 'ABANDONNE' },
      },
      select: { id: true, filiereId: true, niveau: true },
    });
    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvee' });
    }

    const unite = await prisma.uniteEnseignement.findFirst({
      where: {
        id: uniteId,
        filiereId: inscription.filiereId,
        filiere: { etablissementId },
      },
      select: { id: true, anneeEtude: true },
    });
    if (!unite) {
      return res.status(404).json({ error: 'UE non trouvee pour cette filiere' });
    }
    if (unite.anneeEtude !== inscription.niveau) {
      return res.status(400).json({
        error: 'L\'UE ne correspond pas a l\'annee d\'etude de l\'etudiant',
      });
    }

    const validation = await prisma.validationUE.upsert({
      where: {
        inscriptionAcadId_uniteEnseignementId: {
          inscriptionAcadId: inscriptionId,
          uniteEnseignementId: uniteId,
        },
      },
      create: {
        inscriptionAcadId: inscriptionId,
        uniteEnseignementId: uniteId,
        statut,
        decidedAt: new Date(),
        decidedBy: req.user?.id || null,
      },
      update: {
        statut,
        decidedAt: new Date(),
        decidedBy: req.user?.id || null,
      },
    });

    return res.json({
      message: statut === 'VALIDE' ? 'UE marquee comme validee' : 'UE marquee comme non validee',
      validation,
    });
  } catch (error) {
    console.error('Erreur marquerValidation:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
