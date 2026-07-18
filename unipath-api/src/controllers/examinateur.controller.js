// src/controllers/examinateur.controller.js
const prisma = require('../prisma');
const { validateAndSanitizeVerdict, validateUUID, formatMotifForClient } = require('../utils/validation');
const {
  dossierVerrouilleParControleur,
  assertExaminateurPeutRendreVerdict,
  assertExaminateurPeutModifierSonVerdict,
} = require('../utils/verdict-examinateur.helper');
const { isArbitrageDivergent, VERDICT_LABELS } = require('../utils/verdict-workflow.helper');
const {
  resolveCommissionScope,
  applyConcoursScope,
  assertDossierDansScope,
} = require('../utils/commission-etablissement.helper');
const {
  assertEtudeOuvertePourDossier,
  sendEtudeClotureeSiBesoin,
} = require('../utils/etude-cloture.helper');

/**
 * Liste des dossiers à évaluer par l'examinateur connecté
 * Exclut automatiquement les dossiers déjà évalués par cet examinateur
 */
exports.getDossiersAEvaluer = async (req, res) => {
  try {
    const examinateurId = req.user.id;
    const { concoursId: concoursIdQuery, limite = 50, offset = 0 } = req.query;
    const scope = await resolveCommissionScope(examinateurId);

    if (!scope) {
      return res.status(403).json({
        error: 'Accès refusé. Aucun concours assigné à votre compte commission.',
        code: 'COMMISSION_SCOPE_REQUIRED',
      });
    }

    if (concoursIdQuery && concoursIdQuery !== scope.concoursId) {
      return res.status(403).json({ error: 'Accès refusé à ce concours' });
    }

    let whereClause = applyConcoursScope(
      {
        decisionControleurPar: null,
        verdict1Par: null,
      },
      scope.concoursId
    );

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
        orderBy: { createdAt: 'asc' },
        take: parseInt(limite),
        skip: parseInt(offset),
      }),
      prisma.dossierInscription.count({ where: whereClause }),
    ]);

    const dossiersFormates = dossiers.map((d) => ({
      dossierInscriptionId: d.id,
      inscription: {
        numeroInscription: d.inscription.numeroInscription,
        candidat: d.inscription.candidat,
        concours: d.inscription.concours,
      },
      dateCreation: d.createdAt,
      nombreVerdictsRendus: d.verdict1Par ? 1 : 0,
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
    console.error('Erreur getDossiersAEvaluer:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Détail d'un dossier pour examinateur (sans voir les verdicts des autres)
 */
exports.getDetailDossier = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;
    const examinateurId = req.user.id;

    // Valider l'UUID
    if (!validateUUID(dossierInscriptionId)) {
      return res.status(400).json({ error: 'Identifiant de dossier invalide' });
    }

    const dossier = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
      include: {
        inscription: {
          include: {
            candidat: {
              include: { dossier: true },
            },
            concours: true,
          },
        },
      },
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    const scope = await resolveCommissionScope(examinateurId);
    if (!scope || !(await assertDossierDansScope(dossierInscriptionId, scope.concoursId))) {
      return res.status(403).json({ error: 'Accès refusé à ce dossier' });
    }

    // Déterminer si l'examinateur a déjà rendu son verdict
    const monVerdictRendu = dossier.verdict1Par === examinateurId;
    let monVerdict = null;
    let modificationsPossibles = 1;

    if (monVerdictRendu) {
      monVerdict = {
        verdict: dossier.verdict1,
        motif:
          dossier.verdict1 === 'REJETE'
            ? formatMotifForClient(dossier.verdict1Motif)
            : null,
        commentaireSousReserve:
          dossier.verdict1 === 'SOUS_RESERVE'
            ? formatMotifForClient(dossier.commentaireSousReserve)
            : null,
        date: dossier.verdict1Date,
      };
      modificationsPossibles = 1 - dossier.verdict1ModifieCount;
    }

    const etudeCloturee = Boolean(dossier.inscription?.concours?.etudeCloturee);
    const verrouille = dossierVerrouilleParControleur(dossier);
    const peutRendreVerdict =
      !etudeCloturee && !verrouille && !monVerdictRendu && !dossier.verdict1Par;
    const peutModifierMonVerdict =
      !etudeCloturee && !verrouille && monVerdictRendu && modificationsPossibles > 0;
    const lectureSeule =
      etudeCloturee || verrouille || (!peutRendreVerdict && !peutModifierMonVerdict);

    let messageLectureSeule = null;
    if (etudeCloturee) {
      messageLectureSeule =
        "L'étude des dossiers est clôturée pour ce concours. Consultation seule — aucune modification possible.";
    } else if (verrouille) {
      messageLectureSeule =
        'Décision du contrôleur rendue : les verdicts ne peuvent plus être modifiés par les examinateurs.';
    } else if (!monVerdictRendu && dossier.verdict1Par) {
      messageLectureSeule =
        'Ce dossier a déjà été évalué par un examinateur. Seul le contrôleur peut intervenir.';
    } else if (monVerdictRendu && modificationsPossibles === 0) {
      messageLectureSeule =
        'Vous avez déjà utilisé votre unique modification. Contactez le contrôleur pour toute correction.';
    }

    const arbitrageDivergent =
      monVerdictRendu &&
      isArbitrageDivergent(dossier.verdict1, dossier.decisionControleur);
    const retourArbitrage = arbitrageDivergent
      ? {
          verdictExaminateur: dossier.verdict1,
          verdictExaminateurLabel: VERDICT_LABELS[dossier.verdict1] || dossier.verdict1,
          decisionControleur: dossier.decisionControleur,
          decisionControleurLabel:
            VERDICT_LABELS[dossier.decisionControleur] || dossier.decisionControleur,
          motif:
            dossier.decisionControleur === 'REJETE'
              ? formatMotifForClient(dossier.decisionControleurMotif)
              : null,
          commentaireSousReserve:
            dossier.decisionControleur === 'SOUS_RESERVE'
              ? formatMotifForClient(dossier.commentaireSousReserve)
              : null,
          date: dossier.decisionControleurDate,
        }
      : null;

    // Construire la réponse (sans révéler les verdicts des autres)
    res.json({
      dossierInscription: {
        id: dossier.id,
        statut: dossier.statut,
        createdAt: dossier.createdAt,
      },
      inscription: {
        numeroInscription: dossier.inscription.numeroInscription,
        candidat: {
          nom: dossier.inscription.candidat.nom,
          prenom: dossier.inscription.candidat.prenom,
          email: dossier.inscription.candidat.email,
          anip: dossier.inscription.candidat.anip,
          serie: dossier.inscription.candidat.serie,
        },
        concours: {
          libelle: dossier.inscription.concours.libelle,
          etablissement: dossier.inscription.concours.etablissement,
          etudeCloturee,
          etudeClotureeAt: dossier.inscription.concours.etudeClotureeAt || null,
        },
      },
      etudeCloturee,
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
      monVerdict: {
        rendu: monVerdictRendu,
        verdict: monVerdict?.verdict || null,
        motif: monVerdict?.motif || null,
        commentaireSousReserve: monVerdict?.commentaireSousReserve || null,
        date: monVerdict?.date || null,
        modificationsPossibles,
      },
      decisionControleurRendue: !!dossier.decisionControleur,
      retourArbitrage,
      permissions: {
        verrouille,
        peutRendreVerdict,
        peutModifierMonVerdict,
        lectureSeule,
        messageLectureSeule,
      },
      messageLectureSeule,
    });
  } catch (error) {
    console.error('Erreur getDetailDossier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Rendre un verdict sur un dossier
 */
exports.rendreVerdict = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;
    const { verdict, motif, commentaireSousReserve } = req.body;
    const examinateurId = req.user.id;

    // Valider l'UUID
    if (!validateUUID(dossierInscriptionId)) {
      return res.status(400).json({ error: 'Identifiant de dossier invalide' });
    }

    // Valider et sanitiser le verdict et le motif
    const validation = validateAndSanitizeVerdict(verdict, motif, commentaireSousReserve);
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

    const scope = await resolveCommissionScope(examinateurId);
    if (!scope || !(await assertDossierDansScope(dossierInscriptionId, scope.concoursId))) {
      return res.status(403).json({ error: 'Accès refusé à ce dossier' });
    }

    const etudeCheck = await assertEtudeOuvertePourDossier(dossierInscriptionId, dossier);
    if (sendEtudeClotureeSiBesoin(res, etudeCheck)) return;

    const check = assertExaminateurPeutRendreVerdict(dossier, examinateurId);
    if (!check.ok) {
      return res.status(403).json({ error: check.error });
    }

    const updateData = {
      verdict1Par: examinateurId,
      verdict1: verdict,
      verdict1Motif: validation.sanitizedMotif,
      commentaireSousReserve: validation.sanitizedCommentaireSousReserve,
      verdict1Date: new Date(),
      verdict1ModifieCount: 0,
    };

    // Transaction : mettre à jour le dossier + enregistrer l'action
    const result = await prisma.$transaction(async (tx) => {
      const dossierMisAJour = await tx.dossierInscription.update({
        where: { id: dossierInscriptionId },
        data: updateData,
      });

      await tx.actionHistory.create({
        data: {
          utilisateurId: examinateurId,
          dossierInscriptionId,
          typeAction: 'VERDICT_EXAMINATEUR_RENDU',
          details: { numeroVerdict: 1, verdict, motif: validation.sanitizedMotif },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        },
      });

      return dossierMisAJour;
    });

    // Créer une notification pour le contrôleur du même concours
    const controleurWhere = { sousRole: 'CONTROLEUR', concoursId: scope.concoursId };
    const controleur = await prisma.membreCommission.findFirst({
      where: controleurWhere,
    });

    if (controleur) {
      await prisma.notification.create({
        data: {
          userId: controleur.id,
          type: 'NOUVEAU_DOSSIER',
          priority: 'NORMAL',
          title: 'Verdict examinateur — arbitrage requis',
          message: `Un examinateur a rendu son verdict (${verdict}) sur le dossier ${dossier.inscription.numeroInscription} (${dossier.inscription.candidat.nom} ${dossier.inscription.candidat.prenom}). Arbitrage du contrôleur attendu.`,
          data: {
            dossierInscriptionId,
            numeroInscription: dossier.inscription.numeroInscription,
            verdictExaminateur: verdict,
          },
        },
      });
    }

    res.status(201).json({
      message: 'Verdict enregistré avec succès',
      verdict: {
        numeroVerdict: 1,
        verdict,
        motif: validation.sanitizedMotif,
        date: result.verdict1Date,
      },
      dossierInscription: {
        id: result.id,
        nombreVerdictsRendus: result.verdict1Par ? 1 : 0,
        decisionControleurRendue: !!result.decisionControleur,
      },
    });
  } catch (error) {
    console.error('Erreur rendreVerdict:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Modifier son propre verdict (une seule fois autorisée)
 */
exports.modifierVerdict = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;
    const { verdict, motif, commentaireSousReserve } = req.body;
    const examinateurId = req.user.id;

    // Valider l'UUID
    if (!validateUUID(dossierInscriptionId)) {
      return res.status(400).json({ error: 'Identifiant de dossier invalide' });
    }

    // Valider et sanitiser le verdict et le motif
    const validation = validateAndSanitizeVerdict(verdict, motif, commentaireSousReserve);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const dossier = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
      include: { inscription: { include: { concours: true } } },
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    const scope = await resolveCommissionScope(examinateurId);
    if (!scope || !(await assertDossierDansScope(dossierInscriptionId, scope.concoursId))) {
      return res.status(403).json({ error: 'Accès refusé à ce dossier' });
    }

    const etudeCheck = await assertEtudeOuvertePourDossier(dossierInscriptionId, dossier);
    if (sendEtudeClotureeSiBesoin(res, etudeCheck)) return;

    const check = assertExaminateurPeutModifierSonVerdict(dossier, examinateurId);
    if (!check.ok) {
      return res.status(403).json({ error: check.error });
    }

    const modifieCount = dossier.verdict1ModifieCount;

    const updateData = {
      verdict1: verdict,
      verdict1Motif: validation.sanitizedMotif,
      commentaireSousReserve: validation.sanitizedCommentaireSousReserve,
      verdict1Date: new Date(),
      verdict1ModifieCount: modifieCount + 1,
    };

    const result = await prisma.$transaction(async (tx) => {
      const dossierMisAJour = await tx.dossierInscription.update({
        where: { id: dossierInscriptionId },
        data: updateData,
      });

      await tx.actionHistory.create({
        data: {
          utilisateurId: examinateurId,
          dossierInscriptionId,
          typeAction: 'VERDICT_EXAMINATEUR_MODIFIE',
          details: {
            numeroVerdict: 1,
            ancienVerdict: dossier.verdict1,
            nouveauVerdict: verdict,
            motif: validation.sanitizedMotif,
          },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        },
      });

      return dossierMisAJour;
    });

    res.json({
      message: 'Verdict modifié avec succès',
      verdict: {
        numeroVerdict: 1,
        verdict,
        motif: validation.sanitizedMotif,
        date: result.verdict1Date,
        modificationsPossibles: 0,
      },
    });
  } catch (error) {
    console.error('Erreur modifierVerdict:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
