// src/controllers/examinateur.controller.js
const prisma = require('../prisma');
const { validateAndSanitizeVerdict, validateUUID } = require('../utils/validation');
const {
  dossierVerrouillePourExaminateur,
  dossierValideParExaminateur,
  assertExaminateurPeutRendreVerdict,
  assertExaminateurPeutModifierSonVerdict,
} = require('../utils/verdict-examinateur.helper');
const { isArbitrageDivergent, VERDICT_LABELS } = require('../utils/verdict-workflow.helper');
const { runInBackground } = require('../utils/background-task');
const {
  assertPeriodeEtudeActive,
  whereConcoursPeriodeEtudeActive,
} = require('../utils/periode-etude-dossiers.helper');
const {
  resolveConcoursFilterForMembre,
} = require('../utils/affectation-commission.helper');

/**
 * Liste des dossiers à évaluer par l'examinateur connecté.
 * Uniquement pendant la période d'étude définie par la DEC,
 * et uniquement pour les concours auxquels il est affecté (si des affectations existent).
 */
exports.getDossiersAEvaluer = async (req, res) => {
  try {
    const examinateurId = req.user.id;
    const { concoursId, limite = 50, offset = 0, filtre = 'a_evaluer' } = req.query;
    const now = new Date();

    const filter = await resolveConcoursFilterForMembre(
      examinateurId,
      'EXAMINATEUR',
      concoursId || null
    );
    if (filter.forbidden || (filter.concoursIds && filter.concoursIds.length === 0 && !filter.openMode)) {
      return res.json({
        dossiers: [],
        pagination: { total: 0, limite: parseInt(limite), offset: parseInt(offset) },
        message: filter.forbidden
          ? 'Vous n\'êtes pas affecté à ce concours'
          : 'Aucun concours ne vous est affecté pour l\'étude des dossiers',
      });
    }

    const concoursWhere = {
      ...whereConcoursPeriodeEtudeActive(now),
      ...(filter.concoursIds ? { id: { in: filter.concoursIds } } : {}),
    };

    // filtre: a_evaluer (défaut) | evalues | tous
    const filtreNormalise = ['a_evaluer', 'evalues', 'tous'].includes(filtre)
      ? filtre
      : 'a_evaluer';

    let whereClause = {
      inscription: {
        concours: concoursWhere,
      },
    };

    if (filtreNormalise === 'a_evaluer') {
      whereClause = {
        ...whereClause,
        verdict1Par: null,
        decisionControleurPar: null,
      };
    } else if (filtreNormalise === 'evalues') {
      whereClause = {
        ...whereClause,
        verdict1Par: { not: null },
      };
    }

    const [dossiers, total] = await Promise.all([
      prisma.dossierInscription.findMany({
        where: whereClause,
        include: {
          inscription: {
            include: {
              candidat: { select: { nom: true, prenom: true, email: true } },
              concours: {
                select: {
                  id: true,
                  libelle: true,
                  etablissement: true,
                  dateFinDepot: true,
                  dateFin: true,
                  dateDebutEtudeDossiers: true,
                  dateFinEtudeDossiers: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: parseInt(limite),
        skip: parseInt(offset),
      }),
      prisma.dossierInscription.count({ where: whereClause }),
    ]);

    const dossiersFormates = dossiers.map((d) => {
      const evalue = !!d.verdict1Par;
      const monVerdict = d.verdict1Par === examinateurId;
      return {
        dossierInscriptionId: d.id,
        inscription: {
          numeroInscription: d.inscription.numeroInscription,
          candidat: d.inscription.candidat,
          concours: d.inscription.concours,
        },
        dateCreation: d.createdAt,
        evalue,
        monVerdict,
        verdict: evalue
          ? {
              verdict: d.verdict1,
              motif: d.verdict1Motif,
              date: d.verdict1Date,
              parMoi: monVerdict,
            }
          : null,
        decisionControleur: d.decisionControleur || null,
        nombreVerdictsRendus: d.verdict1Par ? 1 : 0,
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
      filtre: filtreNormalise,
      regleExamen: {
        periodeEtudeRequise: true,
        message:
          "L'étude des dossiers n'est possible que pendant la période définie par la DEC.",
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

    const etude = assertPeriodeEtudeActive(dossier.inscription?.concours);
    if (!etude.ok) {
      return res.status(403).json({ error: etude.error, code: etude.code });
    }

    // Déterminer si l'examinateur a déjà rendu son verdict
    const monVerdictRendu = dossier.verdict1Par === examinateurId;
    let monVerdict = null;
    let modificationsPossibles = 1;

    if (monVerdictRendu) {
      monVerdict = {
        verdict: dossier.verdict1,
        motif: dossier.verdict1Motif,
        date: dossier.verdict1Date,
      };
      modificationsPossibles = 1 - dossier.verdict1ModifieCount;
    }

    const verrouille = dossierVerrouillePourExaminateur(dossier);
    const peutRendreVerdict = !verrouille && !monVerdictRendu && !dossier.verdict1Par;
    const peutModifierMonVerdict =
      !verrouille && monVerdictRendu && modificationsPossibles > 0;
    const lectureSeule =
      verrouille || (!peutRendreVerdict && !peutModifierMonVerdict);

    let messageLectureSeule = null;
    if (verrouille) {
      messageLectureSeule = dossierValideParExaminateur(dossier)
        ? 'Ce dossier a été validé définitivement. Aucune modification n\'est possible.'
        : 'Décision du contrôleur rendue : les verdicts ne peuvent plus être modifiés par les examinateurs.';
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
          motif: dossier.decisionControleurMotif,
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
      monVerdict: {
        rendu: monVerdictRendu,
        verdict: monVerdict?.verdict || null,
        motif: monVerdict?.motif || null,
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
    const { verdict, motif } = req.body;
    const examinateurId = req.user.id;

    // Valider l'UUID
    if (!validateUUID(dossierInscriptionId)) {
      return res.status(400).json({ error: 'Identifiant de dossier invalide' });
    }

    // Valider et sanitiser le verdict et le motif
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

    const etude = assertPeriodeEtudeActive(dossier.inscription?.concours);
    if (!etude.ok) {
      return res.status(403).json({ error: etude.error, code: etude.code });
    }

    const check = assertExaminateurPeutRendreVerdict(dossier, examinateurId);
    if (!check.ok) {
      return res.status(403).json({ error: check.error });
    }

    const updateData = {
      verdict1Par: examinateurId,
      verdict1: verdict,
      verdict1Motif: validation.sanitizedMotif,
      verdict1Date: new Date(),
      verdict1ModifieCount: 0,
    };

    // Validation examinateur = décision finale (pas d'arbitrage contrôleur)
    const validationFinale = verdict === 'VALIDE';
    if (validationFinale) {
      updateData.statut = 'VALIDE';
    }

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
          typeAction: validationFinale
            ? 'VERDICT_EXAMINATEUR_VALIDATION_FINALE'
            : 'VERDICT_EXAMINATEUR_RENDU',
          details: {
            numeroVerdict: 1,
            verdict,
            motif: validation.sanitizedMotif,
            validationFinale,
          },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        },
      });

      return dossierMisAJour;
    });

    const controleur = await prisma.membreCommission.findFirst({
      where: { sousRole: 'CONTROLEUR' },
    });

    if (controleur) {
      if (validationFinale) {
        await prisma.notification.create({
          data: {
            userId: controleur.id,
            type: 'NOUVEAU_DOSSIER',
            priority: 'NORMAL',
            title: 'Dossier validé par un examinateur',
            message: `L'examinateur a validé définitivement le dossier ${dossier.inscription.numeroInscription} (${dossier.inscription.candidat.nom} ${dossier.inscription.candidat.prenom}). Aucun arbitrage n'est requis.`,
            data: {
              dossierInscriptionId,
              numeroInscription: dossier.inscription.numeroInscription,
              verdictExaminateur: verdict,
              validationFinale: true,
            },
          },
        });
      } else {
        await prisma.notification.create({
          data: {
            userId: controleur.id,
            type: 'NOUVEAU_DOSSIER',
            priority: 'HIGH',
            title: 'Verdict examinateur — arbitrage requis',
            message: `Un examinateur a rendu un verdict (${verdict}) sur le dossier ${dossier.inscription.numeroInscription} (${dossier.inscription.candidat.nom} ${dossier.inscription.candidat.prenom}). Arbitrage du contrôleur attendu.`,
            data: {
              dossierInscriptionId,
              numeroInscription: dossier.inscription.numeroInscription,
              verdictExaminateur: verdict,
            },
          },
        });
      }
    }

    if (validationFinale) {
      await prisma.notification.create({
        data: {
          userId: dossier.inscription.candidatId,
          type: 'VALIDATION',
          priority: 'HIGH',
          title: 'Décision finale sur votre dossier',
          message: `Votre dossier pour le concours ${dossier.inscription.concours.libelle} a été validé.`,
          data: {
            dossierInscriptionId,
            decision: 'VALIDE',
            motif: validation.sanitizedMotif,
          },
        },
      });

      runInBackground(async () => {
        const { envoyerEmailDecisionFinale } = require('../utils/email-decision.helper');
        await envoyerEmailDecisionFinale({
          candidat: dossier.inscription.candidat,
          concours: dossier.inscription.concours,
          inscription: dossier.inscription,
          decision: 'VALIDE',
          motif: validation.sanitizedMotif,
        });
      }, 'examinateur-validation-email');
    }

    res.status(201).json({
      message: validationFinale
        ? 'Dossier validé définitivement'
        : 'Verdict enregistré — en attente de l\'arbitrage du contrôleur',
      verdict: {
        numeroVerdict: 1,
        verdict,
        motif: validation.sanitizedMotif,
        date: result.verdict1Date,
      },
      dossierInscription: {
        id: result.id,
        statut: result.statut,
        nombreVerdictsRendus: result.verdict1Par ? 1 : 0,
        decisionControleurRendue: !!result.decisionControleur,
        validationFinale,
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
    const { verdict, motif } = req.body;
    const examinateurId = req.user.id;

    // Valider l'UUID
    if (!validateUUID(dossierInscriptionId)) {
      return res.status(400).json({ error: 'Identifiant de dossier invalide' });
    }

    // Valider et sanitiser le verdict et le motif
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

    const etude = assertPeriodeEtudeActive(dossier.inscription?.concours);
    if (!etude.ok) {
      return res.status(403).json({ error: etude.error, code: etude.code });
    }

    const check = assertExaminateurPeutModifierSonVerdict(dossier, examinateurId);
    if (!check.ok) {
      return res.status(403).json({ error: check.error });
    }

    const modifieCount = dossier.verdict1ModifieCount;
    const validationFinale = verdict === 'VALIDE';

    const updateData = {
      verdict1: verdict,
      verdict1Motif: validation.sanitizedMotif,
      verdict1Date: new Date(),
      verdict1ModifieCount: modifieCount + 1,
    };

    if (validationFinale) {
      updateData.statut = 'VALIDE';
    } else {
      // Retour vers un cas nécessitant l'arbitrage contrôleur
      updateData.statut = 'EN_ATTENTE';
    }

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
            validationFinale,
          },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        },
      });

      return dossierMisAJour;
    });

    if (validationFinale) {
      await prisma.notification.create({
        data: {
          userId: dossier.inscription.candidatId,
          type: 'VALIDATION',
          priority: 'HIGH',
          title: 'Décision finale sur votre dossier',
          message: `Votre dossier pour le concours ${dossier.inscription.concours.libelle} a été validé.`,
          data: { dossierInscriptionId, decision: 'VALIDE', motif: validation.sanitizedMotif },
        },
      });

      runInBackground(async () => {
        const { envoyerEmailDecisionFinale } = require('../utils/email-decision.helper');
        await envoyerEmailDecisionFinale({
          candidat: dossier.inscription.candidat,
          concours: dossier.inscription.concours,
          inscription: dossier.inscription,
          decision: 'VALIDE',
          motif: validation.sanitizedMotif,
        });
      }, 'examinateur-validation-email');
    } else {
      const controleur = await prisma.membreCommission.findFirst({
        where: { sousRole: 'CONTROLEUR' },
      });
      if (controleur) {
        await prisma.notification.create({
          data: {
            userId: controleur.id,
            type: 'NOUVEAU_DOSSIER',
            priority: 'HIGH',
            title: 'Verdict examinateur modifié — arbitrage requis',
            message: `Un examinateur a modifié son verdict (${dossier.verdict1} → ${verdict}) sur le dossier ${dossier.inscription.numeroInscription}. Arbitrage du contrôleur attendu.`,
            data: {
              dossierInscriptionId,
              numeroInscription: dossier.inscription.numeroInscription,
              verdictExaminateur: verdict,
            },
          },
        });
      }
    }

    res.json({
      message: validationFinale
        ? 'Dossier validé définitivement'
        : 'Verdict modifié — en attente de l\'arbitrage du contrôleur',
      verdict: {
        numeroVerdict: 1,
        verdict,
        motif: validation.sanitizedMotif,
        date: result.verdict1Date,
        modificationsPossibles: 0,
      },
      dossierInscription: {
        id: result.id,
        statut: result.statut,
        validationFinale,
      },
    });
  } catch (error) {
    console.error('Erreur modifierVerdict:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
