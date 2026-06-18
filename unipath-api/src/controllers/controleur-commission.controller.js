// src/controllers/controleur-commission.controller.js
const prisma = require('../prisma');
const { validateAndSanitizeVerdict, validateUUID, validateDecisionControleur } = require('../utils/validation');
const {
  etapesCompletees,
  verdictsDivergents,
  buildDecisionControleurUpdate,
  getVerdictControleur,
  isArbitrageDivergent,
} = require('../utils/verdict-workflow.helper');
const { notifierExaminateurArbitrageDivergent } = require('../utils/arbitrage-examinateur.helper');

/**
 * Tableau de bord avec indicateurs clés
 */
exports.getTableauDeBord = async (req, res) => {
  try {
    // Compter les dossiers par catégorie
    const [dossiersAvec1Verdict, dossiersAvec2Verdicts, dossiersAvecDecision] = await Promise.all([
      prisma.dossierInscription.count({
        where: {
          verdict1Par: { not: null },
          decisionControleur: null,
        },
      }),
      prisma.dossierInscription.count({
        where: {
          verdict1Par: { not: null },
          decisionControleur: { not: null },
        },
      }),
      prisma.dossierInscription.count({
        where: { decisionControleur: { not: null } },
      }),
    ]);

    const dossiersArbitres = await prisma.dossierInscription.findMany({
      where: {
        verdict1Par: { not: null },
        decisionControleur: { not: null },
      },
      select: { verdict1: true, decisionControleur: true },
    });

    const dossiersVerdictsDivergents = dossiersArbitres.filter(
      (d) => d.verdict1 !== d.decisionControleur
    ).length;

    const dossiersArbitragesAlignes = dossiersAvec2Verdicts - dossiersVerdictsDivergents;

    const tauxDivergence =
      dossiersAvec2Verdicts > 0
        ? parseFloat(((dossiersVerdictsDivergents / dossiersAvec2Verdicts) * 100).toFixed(2))
        : 0;

    const tauxAlignement =
      dossiersAvec2Verdicts > 0
        ? parseFloat(((dossiersArbitragesAlignes / dossiersAvec2Verdicts) * 100).toFixed(2))
        : 0;

    const tousLesDossiers = await prisma.dossierInscription.findMany({
      where: {
        OR: [{ verdict1: { not: null } }, { decisionControleur: { not: null } }],
      },
      select: { verdict1: true, decisionControleur: true },
    });

    const repartitionVerdicts = {
      verdictExaminateur: { VALIDE: 0, REJETE: 0, SOUS_RESERVE: 0 },
      verdictControleur: { VALIDE: 0, REJETE: 0, SOUS_RESERVE: 0 },
      // Alias rétrocompatibles pour le frontend existant
      verdict1: { VALIDE: 0, REJETE: 0, SOUS_RESERVE: 0 },
      verdict2: { VALIDE: 0, REJETE: 0, SOUS_RESERVE: 0 },
    };

    tousLesDossiers.forEach((d) => {
      if (d.verdict1) {
        repartitionVerdicts.verdictExaminateur[d.verdict1]++;
        repartitionVerdicts.verdict1[d.verdict1]++;
      }
      if (d.decisionControleur) {
        repartitionVerdicts.verdictControleur[d.decisionControleur]++;
        repartitionVerdicts.verdict2[d.decisionControleur]++;
      }
    });

    res.json({
      indicateurs: {
        dossiersAvec1Verdict,
        dossiersAvec2Verdicts,
        dossiersVerdictsDivergents,
        dossiersArbitragesAlignes,
        dossiersAvecDecisionFinale: dossiersAvecDecision,
        tauxDivergence,
        tauxAlignement,
      },
      repartitionVerdicts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur getTableauDeBord:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Liste des dossiers avec au moins 1 verdict
 */
exports.getDossiers = async (req, res) => {
  try {
    const { filtre, concoursId, limite = 50, offset = 0 } = req.query;

    let whereClause = {
      verdict1Par: { not: null },
    };

    if (filtre === '1_verdict') {
      whereClause = {
        verdict1Par: { not: null },
        decisionControleur: null,
      };
    } else if (filtre === '2_verdicts') {
      whereClause = {
        verdict1Par: { not: null },
        decisionControleur: { not: null },
      };
    } else if (filtre === 'sans_decision') {
      whereClause = {
        verdict1Par: { not: null },
        decisionControleur: null,
      };
    } else if (filtre === 'divergents') {
      whereClause = {
        verdict1Par: { not: null },
        decisionControleur: { not: null },
      };
    }

    if (concoursId) {
      whereClause.inscription = { concoursId };
    }

    const [dossiers, total] = await Promise.all([
      prisma.dossierInscription.findMany({
        where: whereClause,
        include: {
          inscription: {
            include: {
              candidat: { select: { nom: true, prenom: true, email: true } },
              concours: { select: { libelle: true, etablissement: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limite),
        skip: parseInt(offset),
      }),
      prisma.dossierInscription.count({ where: whereClause }),
    ]);

    const membreIds = [
      ...new Set(
        dossiers.flatMap((d) => [d.verdict1Par, d.decisionControleurPar].filter(Boolean))
      ),
    ];
    const membres = await prisma.membreCommission.findMany({
      where: { id: { in: membreIds } },
      select: { id: true, nom: true, prenom: true },
    });
    const membresMap = Object.fromEntries(membres.map((e) => [e.id, `${e.nom} ${e.prenom}`]));

    const dossiersFormates = dossiers.map((d) => {
      const divergent = verdictsDivergents(d);
      const etapes = etapesCompletees(d);
      const verdictControleur = getVerdictControleur(d);

      return {
        dossierInscriptionId: d.id,
        inscription: {
          numeroInscription: d.inscription.numeroInscription,
          candidat: d.inscription.candidat,
          concours: d.inscription.concours,
        },
        verdicts: {
          verdict1: d.verdict1Par
            ? {
                verdict: d.verdict1,
                par: d.verdict1Par,
                nomExaminateur: membresMap[d.verdict1Par],
                date: d.verdict1Date,
                motif: d.verdict1Motif,
              }
            : null,
          verdict2: verdictControleur
            ? {
                verdict: verdictControleur.verdict,
                par: verdictControleur.par,
                nomControleur: membresMap[verdictControleur.par],
                nomExaminateur: membresMap[verdictControleur.par],
                date: verdictControleur.date,
                motif: verdictControleur.motif,
              }
            : null,
        },
        statutVerdicts: `${etapes}/2`,
        verdictsDivergents: divergent,
        decisionFinale: d.decisionControleur,
        priorite: divergent ? 'HIGH' : d.verdict1Par && !d.decisionControleur ? 'HIGH' : 'NORMAL',
        dateCreation: d.createdAt,
      };
    });

    const dossiersFinaux =
      filtre === 'divergents' ? dossiersFormates.filter((d) => d.verdictsDivergents) : dossiersFormates;

    res.json({
      dossiers: dossiersFinaux,
      pagination: {
        total: filtre === 'divergents' ? dossiersFinaux.length : total,
        limite: parseInt(limite),
        offset: parseInt(offset),
        pages: Math.ceil((filtre === 'divergents' ? dossiersFinaux.length : total) / parseInt(limite)),
      },
    });
  } catch (error) {
    console.error('Erreur getDossiers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Liste des dossiers avec verdicts divergents uniquement
 */
exports.getDossiersDivergents = async (req, res) => {
  try {
    const { limite = 50, offset = 0 } = req.query;

    const whereClause = {
      verdict1Par: { not: null },
      decisionControleur: { not: null },
    };

    const dossiers = await prisma.dossierInscription.findMany({
      where: whereClause,
      include: {
        inscription: {
          include: {
            candidat: { select: { nom: true, prenom: true, email: true } },
            concours: { select: { libelle: true, etablissement: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const dossiersDivergents = dossiers.filter((d) => verdictsDivergents(d));

    // Pagination manuelle
    const total = dossiersDivergents.length;
    const dossiersPagines = dossiersDivergents.slice(parseInt(offset), parseInt(offset) + parseInt(limite));

    const membreIds = [
      ...new Set(
        dossiersPagines.flatMap((d) => [d.verdict1Par, d.decisionControleurPar].filter(Boolean))
      ),
    ];
    const membres = await prisma.membreCommission.findMany({
      where: { id: { in: membreIds } },
      select: { id: true, nom: true, prenom: true },
    });
    const membresMap = Object.fromEntries(membres.map((e) => [e.id, `${e.nom} ${e.prenom}`]));

    const dossiersFormates = dossiersPagines.map((d) => {
      const verdictControleur = getVerdictControleur(d);
      return {
        dossierInscriptionId: d.id,
        inscription: {
          numeroInscription: d.inscription.numeroInscription,
          candidat: d.inscription.candidat,
          concours: d.inscription.concours,
        },
        verdicts: {
          verdict1: {
            verdict: d.verdict1,
            par: d.verdict1Par,
            nomExaminateur: membresMap[d.verdict1Par],
            date: d.verdict1Date,
            motif: d.verdict1Motif,
          },
          verdict2: verdictControleur
            ? {
                verdict: verdictControleur.verdict,
                par: verdictControleur.par,
                nomControleur: membresMap[verdictControleur.par],
                nomExaminateur: membresMap[verdictControleur.par],
                date: verdictControleur.date,
                motif: verdictControleur.motif,
              }
            : null,
        },
        statutVerdicts: '2/2',
        verdictsDivergents: true,
        decisionFinale: d.decisionControleur,
        priorite: 'HIGH',
        dateCreation: d.createdAt,
      };
    });

    res.json({
      dossiers: dossiersFormates,
      pagination: {
        total,
        limite: parseInt(limite),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limite)),
      },
    });
  } catch (error) {
    console.error('Erreur getDossiersDivergents:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Détail complet d'un dossier avec tous les verdicts
 */
exports.getDetailDossier = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;

    // Valider l'UUID
    if (!validateUUID(dossierInscriptionId)) {
      return res.status(400).json({ error: 'Identifiant de dossier invalide' });
    }

    const dossier = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
      include: {
        inscription: {
          include: {
            candidat: { include: { dossier: true } },
            concours: true,
          },
        },
        actionHistory: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
      },
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    const membreIds = [dossier.verdict1Par, dossier.decisionControleurPar].filter(Boolean);
    const membres = await prisma.membreCommission.findMany({
      where: { id: { in: membreIds } },
      select: { id: true, nom: true, prenom: true, sousRole: true },
    });
    const membresMap = Object.fromEntries(
      membres.map((e) => [e.id, { nom: e.nom, prenom: e.prenom, sousRole: e.sousRole }])
    );
    const verdictControleur = getVerdictControleur(dossier);

    res.json({
      dossierInscription: {
        id: dossier.id,
        statut: dossier.statut,
        createdAt: dossier.createdAt,
        updatedAt: dossier.updatedAt,
      },
      inscription: {
        numeroInscription: dossier.inscription.numeroInscription,
        candidat: {
          nom: dossier.inscription.candidat.nom,
          prenom: dossier.inscription.candidat.prenom,
          email: dossier.inscription.candidat.email,
          anip: dossier.inscription.candidat.anip,
          serie: dossier.inscription.candidat.serie,
          sexe: dossier.inscription.candidat.sexe,
          nationalite: dossier.inscription.candidat.nationalite,
        },
        concours: {
          libelle: dossier.inscription.concours.libelle,
          etablissement: dossier.inscription.concours.etablissement,
          dateComposition: dossier.inscription.concours.dateComposition,
        },
      },
      piecesBase: {
        acteNaissance: {
          url: dossier.inscription.candidat.dossier?.acteNaissance,
          statut: dossier.inscription.candidat.dossier?.acteNaissance ? 'fournie' : 'manquante',
        },
        carteIdentite: {
          url: dossier.inscription.candidat.dossier?.carteIdentite,
          statut: dossier.inscription.candidat.dossier?.carteIdentite ? 'fournie' : 'manquante',
        },
        photo: {
          url: dossier.inscription.candidat.dossier?.photo,
          statut: dossier.inscription.candidat.dossier?.photo ? 'fournie' : 'manquante',
        },
        releve: {
          url: dossier.inscription.candidat.dossier?.releve,
          statut: dossier.inscription.candidat.dossier?.releve ? 'fournie' : 'manquante',
        },
      },
      piecesSpecifiques: {
        quittance: { url: dossier.quittanceUrl, statut: dossier.quittanceUrl ? 'fournie' : 'manquante' },
      },
      verdicts: {
        verdict1: dossier.verdict1Par
          ? {
              verdict: dossier.verdict1,
              motif: dossier.verdict1Motif,
              date: dossier.verdict1Date,
              examinateur: membresMap[dossier.verdict1Par],
            }
          : null,
        verdict2: verdictControleur
          ? {
              verdict: verdictControleur.verdict,
              motif: verdictControleur.motif,
              date: verdictControleur.date,
              controleur: membresMap[verdictControleur.par],
              examinateur: membresMap[verdictControleur.par],
            }
          : null,
      },
      verdictsDivergents: verdictsDivergents(dossier),
      decisionControleur: dossier.decisionControleur
        ? {
            decision: dossier.decisionControleur,
            motif: dossier.decisionControleurMotif,
            date: dossier.decisionControleurDate,
            par: dossier.decisionControleurPar,
          }
        : null,
      historique: dossier.actionHistory,
    });
  } catch (error) {
    console.error('Erreur getDetailDossier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Modifier le verdict d'un examinateur (seul le contrôleur peut le faire)
 */
exports.modifierVerdictExaminateur = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;
    const { numeroVerdict, verdict, motif } = req.body;
    const controleurId = req.user.id;

    if (!validateUUID(dossierInscriptionId)) {
      return res.status(400).json({ error: 'Identifiant de dossier invalide' });
    }

    const num = parseInt(numeroVerdict, 10);
    if (num !== 1) {
      return res.status(400).json({
        error: 'Seul le verdict de l\'examinateur (slot 1) peut être corrigé. La décision du contrôleur se modifie via la décision finale.',
      });
    }

    const validation = validateAndSanitizeVerdict(verdict, motif);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const dossier = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
      include: { inscription: { include: { candidat: true, concours: true } } },
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    const auteurId = dossier.verdict1Par;
    if (!auteurId) {
      return res.status(400).json({ error: 'Aucun verdict examinateur à modifier sur ce dossier' });
    }

    const ancienVerdict = dossier.verdict1;
    const ancienMotif = dossier.verdict1Motif;

    const updateData = {
      verdict1: verdict,
      verdict1Motif: validation.sanitizedMotif,
      verdict1Date: new Date(),
    };

    const result = await prisma.$transaction(async (tx) => {
      const dossierMisAJour = await tx.dossierInscription.update({
        where: { id: dossierInscriptionId },
        data: updateData,
      });

      await tx.actionHistory.create({
        data: {
          utilisateurId: controleurId,
          dossierInscriptionId,
          typeAction: 'VERDICT_EXAMINATEUR_MODIFIE_PAR_CONTROLEUR',
          details: {
            numeroVerdict: num,
            examinateurId: auteurId,
            ancienVerdict,
            ancienMotif,
            nouveauVerdict: verdict,
            nouveauMotif: validation.sanitizedMotif,
          },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        },
      });

      return dossierMisAJour;
    });

    if (dossier.verdict1Par) {
      await prisma.notification.create({
        data: {
          userId: dossier.verdict1Par,
          type: 'ALERTE',
          priority: 'NORMAL',
          title: 'Verdict examinateur corrigé',
          message: `Le contrôleur a corrigé votre verdict sur le dossier ${dossier.inscription.numeroInscription} : ${ancienVerdict} → ${verdict}.`,
          data: { dossierInscriptionId, ancienVerdict, nouveauVerdict: verdict },
        },
      });
    }

    res.json({
      message: 'Verdict examinateur modifié par le contrôleur',
      numeroVerdict: 1,
      verdict: { verdict, motif: validation.sanitizedMotif },
      verdictsDivergents: verdictsDivergents(result),
    });
  } catch (error) {
    console.error('Erreur modifierVerdictExaminateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Rendre une décision finale
 */
exports.rendreDecision = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;
    const { decision, motif } = req.body;
    const controleurId = req.user.id;

    // Valider l'UUID
    if (!validateUUID(dossierInscriptionId)) {
      return res.status(400).json({ error: 'Identifiant de dossier invalide' });
    }

    const dossier = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
      include: { inscription: { include: { candidat: true, concours: true } } },
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    const validation = validateDecisionControleur(dossier, decision, motif);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const nombreVerdictsPresents = etapesCompletees(dossier);

    // Mapper la décision vers le statut
    let nouveauStatut;
    switch (decision) {
      case 'VALIDE':
        nouveauStatut = 'VALIDE';
        break;
      case 'REJETE':
        nouveauStatut = 'REJETE';
        break;
      case 'SOUS_RESERVE':
        nouveauStatut = 'SOUS_RESERVE';
        break;
      default:
        nouveauStatut = dossier.statut;
    }

    // Préparer les données de mise à jour
    const updateData = {
      ...buildDecisionControleurUpdate(controleurId, decision, validation.sanitizedMotif),
      statut: nouveauStatut,
    };

    // Copier le motif vers les anciens champs pour compatibilité
    if (decision === 'REJETE') {
      updateData.commentaireRejet = validation.sanitizedMotif;
    } else if (decision === 'SOUS_RESERVE') {
      updateData.commentaireSousReserve = validation.sanitizedMotif;
    }

    // Transaction : mettre à jour le dossier + enregistrer l'action
    const result = await prisma.$transaction(async (tx) => {
      const dossierMisAJour = await tx.dossierInscription.update({
        where: { id: dossierInscriptionId },
        data: updateData,
      });

      await tx.actionHistory.create({
        data: {
          utilisateurId: controleurId,
          dossierInscriptionId,
          typeAction: 'DECISION_CONTROLEUR_RENDUE',
          details: { decision, motif: validation.sanitizedMotif, nombreVerdictsPresents },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        },
      });

      return dossierMisAJour;
    });

    // Créer une notification pour le candidat
    const typeNotification = decision === 'VALIDE' ? 'VALIDATION' : decision === 'REJETE' ? 'REJET' : 'ALERTE';
    await prisma.notification.create({
      data: {
        userId: dossier.inscription.candidatId,
        type: typeNotification,
        priority: 'HIGH',
        title: `Décision finale sur votre dossier`,
        message: `Votre dossier pour le concours ${dossier.inscription.concours.libelle} a été ${
          decision === 'VALIDE' ? 'validé' : decision === 'REJETE' ? 'rejeté' : 'validé sous réserve'
        }`,
        data: {
          dossierInscriptionId,
          decision,
          motif: validation.sanitizedMotif,
        },
      },
    });

    if (isArbitrageDivergent(dossier.verdict1, decision)) {
      await notifierExaminateurArbitrageDivergent({
        dossier,
        inscription: dossier.inscription,
        concours: dossier.inscription.concours,
        decision,
        motif: validation.sanitizedMotif,
      });
    } else if (dossier.verdict1Par) {
      await prisma.notification.create({
        data: {
          userId: dossier.verdict1Par,
          type: 'NOUVEAU_DOSSIER',
          priority: 'NORMAL',
          title: 'Décision du contrôleur enregistrée',
          message: `Le contrôleur a confirmé votre verdict (${decision}) sur le dossier ${dossier.inscription.numeroInscription}.`,
          data: {
            dossierInscriptionId,
            decision,
            verdictExaminateur: dossier.verdict1,
          },
        },
      });
    }

    try {
      const { envoyerEmailDecisionFinale } = require('../utils/email-decision.helper');
      await envoyerEmailDecisionFinale({
        candidat: dossier.inscription.candidat,
        concours: dossier.inscription.concours,
        inscription: dossier.inscription,
        decision,
        motif: validation.sanitizedMotif,
      });
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
    }

    res.status(201).json({
      message: 'Décision enregistrée avec succès',
      decision: {
        decision,
        motif: validation.sanitizedMotif,
        date: result.decisionControleurDate,
      },
      dossierInscription: {
        id: result.id,
        statut: result.statut,
        nombreVerdictsPresents,
      },
    });
  } catch (error) {
    console.error('Erreur rendreDecision:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Modifier la décision finale (modifications multiples autorisées)
 */
exports.modifierDecision = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;
    const { decision, motif } = req.body;
    const controleurId = req.user.id;

    // Valider l'UUID
    if (!validateUUID(dossierInscriptionId)) {
      return res.status(400).json({ error: 'Identifiant de dossier invalide' });
    }

    const dossier = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
      include: { inscription: { include: { candidat: true, concours: true } } },
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    if (!dossier.decisionControleur) {
      return res.status(400).json({ error: 'Aucune décision n\'a encore été rendue sur ce dossier' });
    }

    const validation = validateDecisionControleur(dossier, decision, motif);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const ancienneDecision = dossier.decisionControleur;

    // Mapper la décision vers le statut
    let nouveauStatut;
    switch (decision) {
      case 'VALIDE':
        nouveauStatut = 'VALIDE';
        break;
      case 'REJETE':
        nouveauStatut = 'REJETE';
        break;
      case 'SOUS_RESERVE':
        nouveauStatut = 'SOUS_RESERVE';
        break;
      default:
        nouveauStatut = dossier.statut;
    }

    // Préparer les données de mise à jour
    const updateData = {
      ...buildDecisionControleurUpdate(controleurId, decision, validation.sanitizedMotif),
      statut: nouveauStatut,
    };

    // Copier le motif vers les anciens champs pour compatibilité
    if (decision === 'REJETE') {
      updateData.commentaireRejet = validation.sanitizedMotif;
    } else if (decision === 'SOUS_RESERVE') {
      updateData.commentaireSousReserve = validation.sanitizedMotif;
    }

    // Transaction : mettre à jour le dossier + enregistrer l'action
    const result = await prisma.$transaction(async (tx) => {
      const dossierMisAJour = await tx.dossierInscription.update({
        where: { id: dossierInscriptionId },
        data: updateData,
      });

      await tx.actionHistory.create({
        data: {
          utilisateurId: controleurId,
          dossierInscriptionId,
          typeAction: 'DECISION_CONTROLEUR_MODIFIEE',
          details: {
            ancienneDecision,
            nouvelleDecision: decision,
            motif: validation.sanitizedMotif,
          },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        },
      });

      return dossierMisAJour;
    });

    if (isArbitrageDivergent(dossier.verdict1, decision)) {
      await notifierExaminateurArbitrageDivergent({
        dossier,
        inscription: dossier.inscription,
        concours: dossier.inscription.concours,
        decision,
        motif: validation.sanitizedMotif,
      });
    } else if (dossier.verdict1Par && decision !== ancienneDecision) {
      await prisma.notification.create({
        data: {
          userId: dossier.verdict1Par,
          type: 'ALERTE',
          priority: 'NORMAL',
          title: 'Décision modifiée par le contrôleur',
          message: `La décision sur le dossier ${dossier.inscription.numeroInscription} a été modifiée : ${ancienneDecision} → ${decision}.`,
          data: {
            dossierInscriptionId,
            ancienneDecision,
            nouvelleDecision: decision,
          },
        },
      });
    }

    if (decision !== ancienneDecision) {
      try {
        const { envoyerEmailDecisionFinale } = require('../utils/email-decision.helper');
        await envoyerEmailDecisionFinale({
          candidat: dossier.inscription.candidat,
          concours: dossier.inscription.concours,
          inscription: dossier.inscription,
          decision,
          motif: validation.sanitizedMotif,
        });
      } catch (emailErr) {
        console.error('Erreur email modification décision:', emailErr);
      }
    }

    res.json({
      message: 'Décision modifiée avec succès',
      decision: {
        ancienneDecision,
        nouvelleDecision: decision,
        motif: validation.sanitizedMotif,
        date: result.decisionControleurDate,
      },
      dossierInscription: {
        id: result.id,
        statut: result.statut,
      },
    });
  } catch (error) {
    console.error('Erreur modifierDecision:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


/**
 * Liste des dossiers sans verdict depuis plus de 2 jours
 */
exports.getDossiersSansVerdict = async (req, res) => {
  try {
    const { limite = 50, offset = 0 } = req.query;

    // Date limite : il y a 2 jours
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - 2);

    const whereClause = {
      verdict1Par: null,
      createdAt: {
        lte: dateLimite,
      },
    };

    const [dossiers, total] = await Promise.all([
      prisma.dossierInscription.findMany({
        where: whereClause,
        include: {
          inscription: {
            include: {
              candidat: { select: { nom: true, prenom: true, email: true } },
              concours: { select: { libelle: true, etablissement: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' }, // Les plus anciens en premier
        take: parseInt(limite),
        skip: parseInt(offset),
      }),
      prisma.dossierInscription.count({ where: whereClause }),
    ]);

    const dossiersFormates = dossiers.map((d) => {
      const joursEcoules = Math.floor((new Date() - new Date(d.createdAt)) / (1000 * 60 * 60 * 24));

      return {
        dossierInscriptionId: d.id,
        inscription: {
          numeroInscription: d.inscription.numeroInscription,
          candidat: d.inscription.candidat,
          concours: d.inscription.concours,
        },
        dateCreation: d.createdAt,
        joursEcoules,
        priorite: joursEcoules > 5 ? 'URGENT' : joursEcoules > 3 ? 'HIGH' : 'NORMAL',
      };
    });

    res.json({
      dossiers: dossiersFormates,
      pagination: {
        total,
        limite: parseInt(limite),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limite)),
      },
      statistiques: {
        totalDossiersSansVerdict: total,
        dossiersUrgents: dossiersFormates.filter((d) => d.priorite === 'URGENT').length,
        dossiersHigh: dossiersFormates.filter((d) => d.priorite === 'HIGH').length,
      },
    });
  } catch (error) {
    console.error('Erreur getDossiersSansVerdict:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;