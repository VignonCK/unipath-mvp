// src/controllers/controleur-commission.controller.js
const prisma = require('../prisma');
const { validateAndSanitizeVerdict, validateUUID } = require('../utils/validation');

/**
 * Tableau de bord avec indicateurs clés
 */
exports.getTableauDeBord = async (req, res) => {
  try {
    // Compter les dossiers par catégorie
    const [dossiersAvec1Verdict, dossiersAvec2Verdicts, dossiersAvecDecision] = await Promise.all([
      prisma.dossierInscription.count({
        where: {
          OR: [
            { verdict1Par: { not: null }, verdict2Par: null },
            { verdict1Par: null, verdict2Par: { not: null } },
          ],
        },
      }),
      prisma.dossierInscription.count({
        where: {
          verdict1Par: { not: null },
          verdict2Par: { not: null },
        },
      }),
      prisma.dossierInscription.count({
        where: { decisionControleur: { not: null } },
      }),
    ]);

    // Compter les verdicts divergents
    const dossiers2Verdicts = await prisma.dossierInscription.findMany({
      where: {
        verdict1Par: { not: null },
        verdict2Par: { not: null },
      },
      select: { verdict1: true, verdict2: true },
    });

    const dossiersVerdictsDivergents = dossiers2Verdicts.filter((d) => d.verdict1 !== d.verdict2).length;

    const tauxDivergence =
      dossiersAvec2Verdicts > 0 ? ((dossiersVerdictsDivergents / dossiersAvec2Verdicts) * 100).toFixed(2) : 0;

    // Répartition des verdicts
    const tousLesDossiers = await prisma.dossierInscription.findMany({
      where: {
        OR: [{ verdict1: { not: null } }, { verdict2: { not: null } }],
      },
      select: { verdict1: true, verdict2: true },
    });

    const repartitionVerdicts = {
      verdict1: { VALIDE: 0, REJETE: 0, SOUS_RESERVE: 0 },
      verdict2: { VALIDE: 0, REJETE: 0, SOUS_RESERVE: 0 },
    };

    tousLesDossiers.forEach((d) => {
      if (d.verdict1) repartitionVerdicts.verdict1[d.verdict1]++;
      if (d.verdict2) repartitionVerdicts.verdict2[d.verdict2]++;
    });

    res.json({
      indicateurs: {
        dossiersAvec1Verdict,
        dossiersAvec2Verdicts,
        dossiersVerdictsDivergents,
        dossiersAvecDecisionFinale: dossiersAvecDecision,
        tauxDivergence: parseFloat(tauxDivergence),
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
      OR: [{ verdict1Par: { not: null } }, { verdict2Par: { not: null } }],
    };

    // Appliquer les filtres
    if (filtre === '1_verdict') {
      whereClause = {
        OR: [
          { verdict1Par: { not: null }, verdict2Par: null },
          { verdict1Par: null, verdict2Par: { not: null } },
        ],
      };
    } else if (filtre === '2_verdicts') {
      whereClause = {
        verdict1Par: { not: null },
        verdict2Par: { not: null },
      };
    } else if (filtre === 'sans_decision') {
      whereClause.decisionControleur = null;
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

    // Récupérer les noms des examinateurs
    const examinateurIds = [
      ...new Set(dossiers.flatMap((d) => [d.verdict1Par, d.verdict2Par].filter(Boolean))),
    ];
    const examinateurs = await prisma.membreCommission.findMany({
      where: { id: { in: examinateurIds } },
      select: { id: true, nom: true, prenom: true },
    });
    const examinateursMap = Object.fromEntries(examinateurs.map((e) => [e.id, `${e.nom} ${e.prenom}`]));

    const dossiersFormates = dossiers.map((d) => {
      const verdictsDivergents = d.verdict1 && d.verdict2 && d.verdict1 !== d.verdict2;

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
                nomExaminateur: examinateursMap[d.verdict1Par],
                date: d.verdict1Date,
                motif: d.verdict1Motif,
              }
            : null,
          verdict2: d.verdict2Par
            ? {
                verdict: d.verdict2,
                par: d.verdict2Par,
                nomExaminateur: examinateursMap[d.verdict2Par],
                date: d.verdict2Date,
                motif: d.verdict2Motif,
              }
            : null,
        },
        statutVerdicts: `${(d.verdict1Par ? 1 : 0) + (d.verdict2Par ? 1 : 0)}/2`,
        verdictsDivergents,
        decisionFinale: d.decisionControleur,
        priorite: verdictsDivergents ? 'HIGH' : 'NORMAL',
        dateCreation: d.createdAt,
      };
    });

    // Filtrer les divergents si demandé
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
      verdict2Par: { not: null },
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

    // Filtrer uniquement les divergents
    const dossiersDivergents = dossiers.filter((d) => d.verdict1 !== d.verdict2);

    // Pagination manuelle
    const total = dossiersDivergents.length;
    const dossiersPagines = dossiersDivergents.slice(parseInt(offset), parseInt(offset) + parseInt(limite));

    // Récupérer les noms des examinateurs
    const examinateurIds = [
      ...new Set(dossiersPagines.flatMap((d) => [d.verdict1Par, d.verdict2Par].filter(Boolean))),
    ];
    const examinateurs = await prisma.membreCommission.findMany({
      where: { id: { in: examinateurIds } },
      select: { id: true, nom: true, prenom: true },
    });
    const examinateursMap = Object.fromEntries(examinateurs.map((e) => [e.id, `${e.nom} ${e.prenom}`]));

    const dossiersFormates = dossiersPagines.map((d) => ({
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
          nomExaminateur: examinateursMap[d.verdict1Par],
          date: d.verdict1Date,
          motif: d.verdict1Motif,
        },
        verdict2: {
          verdict: d.verdict2,
          par: d.verdict2Par,
          nomExaminateur: examinateursMap[d.verdict2Par],
          date: d.verdict2Date,
          motif: d.verdict2Motif,
        },
      },
      statutVerdicts: '2/2',
      verdictsDivergents: true,
      decisionFinale: d.decisionControleur,
      priorite: 'HIGH',
      dateCreation: d.createdAt,
    }));

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

    // Récupérer les noms des examinateurs
    const examinateurIds = [dossier.verdict1Par, dossier.verdict2Par].filter(Boolean);
    const examinateurs = await prisma.membreCommission.findMany({
      where: { id: { in: examinateurIds } },
      select: { id: true, nom: true, prenom: true },
    });
    const examinateursMap = Object.fromEntries(examinateurs.map((e) => [e.id, { nom: e.nom, prenom: e.prenom }]));

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
              examinateur: examinateursMap[dossier.verdict1Par],
            }
          : null,
        verdict2: dossier.verdict2Par
          ? {
              verdict: dossier.verdict2,
              motif: dossier.verdict2Motif,
              date: dossier.verdict2Date,
              examinateur: examinateursMap[dossier.verdict2Par],
            }
          : null,
      },
      verdictsDivergents: dossier.verdict1 && dossier.verdict2 && dossier.verdict1 !== dossier.verdict2,
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
    if (num !== 1 && num !== 2) {
      return res.status(400).json({ error: 'numeroVerdict doit être 1 ou 2' });
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

    const auteurId = num === 1 ? dossier.verdict1Par : dossier.verdict2Par;
    if (!auteurId) {
      return res.status(400).json({ error: `Aucun verdict examinateur ${num} à modifier sur ce dossier` });
    }

    const ancienVerdict = num === 1 ? dossier.verdict1 : dossier.verdict2;
    const ancienMotif = num === 1 ? dossier.verdict1Motif : dossier.verdict2Motif;

    const updateData =
      num === 1
        ? {
            verdict1: verdict,
            verdict1Motif: validation.sanitizedMotif,
            verdict1Date: new Date(),
          }
        : {
            verdict2: verdict,
            verdict2Motif: validation.sanitizedMotif,
            verdict2Date: new Date(),
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

    if (result.verdict1 && result.verdict2 && result.verdict1 !== result.verdict2) {
      const controleur = await prisma.membreCommission.findFirst({
        where: { sousRole: 'CONTROLEUR' },
      });
      if (controleur) {
        await prisma.notification.create({
          data: {
            userId: controleur.id,
            type: 'ALERTE',
            priority: 'HIGH',
            title: '⚠️ Verdicts divergents détectés',
            message: `Le dossier ${dossier.inscription.numeroInscription} a des verdicts divergents après correction.`,
            data: {
              dossierInscriptionId,
              verdict1: result.verdict1,
              verdict2: result.verdict2,
            },
          },
        });
      }
    }

    res.json({
      message: 'Verdict examinateur modifié par le contrôleur',
      numeroVerdict: num,
      verdict: { verdict, motif: validation.sanitizedMotif },
      verdictsDivergents:
        result.verdict1 && result.verdict2 && result.verdict1 !== result.verdict2,
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

    // Valider et sanitiser la décision et le motif
    const validation = validateAndSanitizeVerdict(decision, motif);
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

    // Accepter les décisions même si un seul verdict est rendu (intervention précoce)
    const nombreVerdictsPresents = (dossier.verdict1Par ? 1 : 0) + (dossier.verdict2Par ? 1 : 0);

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
      decisionControleurPar: controleurId,
      decisionControleur: decision,
      decisionControleurMotif: validation.sanitizedMotif,
      decisionControleurDate: new Date(),
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

    // Valider et sanitiser la décision et le motif
    const validation = validateAndSanitizeVerdict(decision, motif);
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

    // Vérifier qu'une décision existe déjà
    if (!dossier.decisionControleur) {
      return res.status(400).json({ error: 'Aucune décision n\'a encore été rendue sur ce dossier' });
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
      decisionControleur: decision,
      decisionControleurMotif: validation.sanitizedMotif,
      decisionControleurDate: new Date(),
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

    // Créer des notifications pour les examinateurs
    const examinateurIds = [dossier.verdict1Par, dossier.verdict2Par].filter(Boolean);
    for (const examinateurId of examinateurIds) {
      await prisma.notification.create({
        data: {
          userId: examinateurId,
          type: 'ALERTE',
          priority: 'NORMAL',
          title: 'Décision modifiée par le contrôleur',
          message: `La décision sur le dossier ${dossier.inscription.numeroInscription} (${dossier.inscription.candidat.nom} ${dossier.inscription.candidat.prenom}) a été modifiée : ${ancienneDecision} → ${decision}`,
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
      verdict2Par: null,
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