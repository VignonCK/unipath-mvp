// src/controllers/examinateur.controller.js
const prisma = require('../prisma');
const { validateAndSanitizeVerdict, validateUUID } = require('../utils/validation');
const {
  dossierVerrouilleParControleur,
  assertExaminateurPeutRendreVerdict,
  assertExaminateurPeutModifierSonVerdict,
} = require('../utils/verdict-examinateur.helper');

/**
 * Liste des dossiers à évaluer par l'examinateur connecté
 * Exclut automatiquement les dossiers déjà évalués par cet examinateur
 */
exports.getDossiersAEvaluer = async (req, res) => {
  try {
    const examinateurId = req.user.id;
    const { concoursId, limite = 50, offset = 0 } = req.query;

    const whereClause = {
      decisionControleurPar: null,
      // Dossiers avec au moins une place disponible
      OR: [
        // Cas 1 : Aucun verdict rendu
        { verdict1Par: null, verdict2Par: null },
        // Cas 2 : verdict1 rendu par un autre, verdict2 libre
        { verdict1Par: { not: examinateurId }, verdict2Par: null },
        // Cas 3 : verdict2 rendu par un autre, verdict1 libre
        { verdict1Par: null, verdict2Par: { not: examinateurId } },
      ],
      // Exclure les dossiers où l'examinateur a déjà rendu son verdict
      NOT: {
        OR: [
          { verdict1Par: examinateurId },
          { verdict2Par: examinateurId },
        ],
      },
    };

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
      autreVerdictRendu: !!(d.verdict1Par || d.verdict2Par),
      nombreVerdictsRendus: (d.verdict1Par ? 1 : 0) + (d.verdict2Par ? 1 : 0),
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

    // Déterminer si l'examinateur a déjà rendu son verdict
    const monVerdictRendu =
      dossier.verdict1Par === examinateurId || dossier.verdict2Par === examinateurId;
    let monVerdict = null;
    let modificationsPossibles = 1;

    if (dossier.verdict1Par === examinateurId) {
      monVerdict = {
        verdict: dossier.verdict1,
        motif: dossier.verdict1Motif,
        date: dossier.verdict1Date,
      };
      modificationsPossibles = 1 - dossier.verdict1ModifieCount;
    } else if (dossier.verdict2Par === examinateurId) {
      monVerdict = {
        verdict: dossier.verdict2,
        motif: dossier.verdict2Motif,
        date: dossier.verdict2Date,
      };
      modificationsPossibles = 1 - dossier.verdict2ModifieCount;
    }

    const verrouille = dossierVerrouilleParControleur(dossier);
    const peutRendreVerdict =
      !verrouille && !monVerdictRendu && (!dossier.verdict1Par || !dossier.verdict2Par);
    const peutModifierMonVerdict =
      !verrouille && monVerdictRendu && modificationsPossibles > 0;
    const deuxVerdictsComplets = !!(dossier.verdict1Par && dossier.verdict2Par);
    const lectureSeule =
      verrouille || (!peutRendreVerdict && !peutModifierMonVerdict);

    let messageLectureSeule = null;
    if (verrouille) {
      messageLectureSeule =
        'Décision du contrôleur rendue : les verdicts ne peuvent plus être modifiés par les examinateurs.';
    } else if (!monVerdictRendu && deuxVerdictsComplets) {
      messageLectureSeule =
        'Les deux verdicts ont déjà été rendus. Seul le contrôleur peut modifier un verdict existant.';
    } else if (monVerdictRendu && modificationsPossibles === 0) {
      messageLectureSeule =
        'Vous avez déjà utilisé votre unique modification. Contactez le contrôleur pour toute correction.';
    }

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
      autreVerdictRendu:
        (dossier.verdict1Par && dossier.verdict1Par !== examinateurId) ||
        (dossier.verdict2Par && dossier.verdict2Par !== examinateurId),
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

    const check = assertExaminateurPeutRendreVerdict(dossier, examinateurId);
    if (!check.ok) {
      return res.status(403).json({ error: check.error });
    }

    const numeroVerdict = check.slot;
    const updateData =
      numeroVerdict === 1
        ? {
            verdict1Par: examinateurId,
            verdict1: verdict,
            verdict1Motif: validation.sanitizedMotif,
            verdict1Date: new Date(),
            verdict1ModifieCount: 0,
          }
        : {
            verdict2Par: examinateurId,
            verdict2: verdict,
            verdict2Motif: validation.sanitizedMotif,
            verdict2Date: new Date(),
            verdict2ModifieCount: 0,
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
          details: { numeroVerdict, verdict, motif: validation.sanitizedMotif },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        },
      });

      return dossierMisAJour;
    });

    // Créer une notification pour le contrôleur
    const controleur = await prisma.membreCommission.findFirst({
      where: { sousRole: 'CONTROLEUR' },
    });

    if (controleur) {
      const nombreVerdictsRendus = (result.verdict1Par ? 1 : 0) + (result.verdict2Par ? 1 : 0);
      await prisma.notification.create({
        data: {
          userId: controleur.id,
          type: 'NOUVEAU_DOSSIER',
          priority: 'NORMAL',
          title: `Nouveau verdict rendu (${nombreVerdictsRendus}/2)`,
          message: `Un examinateur a rendu son verdict sur le dossier ${dossier.inscription.numeroInscription} (${dossier.inscription.candidat.nom} ${dossier.inscription.candidat.prenom})`,
          data: {
            dossierInscriptionId,
            numeroInscription: dossier.inscription.numeroInscription,
            nombreVerdictsRendus,
          },
        },
      });

      // Si 2 verdicts et divergents, créer une alerte HIGH
      if (result.verdict1 && result.verdict2 && result.verdict1 !== result.verdict2) {
        await prisma.notification.create({
          data: {
            userId: controleur.id,
            type: 'ALERTE',
            priority: 'HIGH',
            title: '⚠️ Verdicts divergents détectés',
            message: `Le dossier ${dossier.inscription.numeroInscription} a des verdicts divergents : Examinateur 1 = ${result.verdict1}, Examinateur 2 = ${result.verdict2}`,
            data: {
              dossierInscriptionId,
              verdict1: result.verdict1,
              verdict2: result.verdict2,
            },
          },
        });
      }
    }

    res.status(201).json({
      message: 'Verdict enregistré avec succès',
      verdict: {
        numeroVerdict,
        verdict,
        motif: validation.sanitizedMotif,
        date: numeroVerdict === 1 ? result.verdict1Date : result.verdict2Date,
      },
      dossierInscription: {
        id: result.id,
        nombreVerdictsRendus: (result.verdict1Par ? 1 : 0) + (result.verdict2Par ? 1 : 0),
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
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    const check = assertExaminateurPeutModifierSonVerdict(dossier, examinateurId);
    if (!check.ok) {
      return res.status(403).json({ error: check.error });
    }

    const numeroVerdict = check.numeroVerdict;
    const modifieCount = numeroVerdict === 1 ? dossier.verdict1ModifieCount : dossier.verdict2ModifieCount;

    // Mettre à jour le verdict
    const updateData =
      numeroVerdict === 1
        ? {
            verdict1: verdict,
            verdict1Motif: validation.sanitizedMotif,
            verdict1Date: new Date(),
            verdict1ModifieCount: modifieCount + 1,
          }
        : {
            verdict2: verdict,
            verdict2Motif: validation.sanitizedMotif,
            verdict2Date: new Date(),
            verdict2ModifieCount: modifieCount + 1,
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
            numeroVerdict,
            ancienVerdict: numeroVerdict === 1 ? dossier.verdict1 : dossier.verdict2,
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
        numeroVerdict,
        verdict,
        motif: validation.sanitizedMotif,
        date: numeroVerdict === 1 ? result.verdict1Date : result.verdict2Date,
        modificationsPossibles: 0,
      },
    });
  } catch (error) {
    console.error('Erreur modifierVerdict:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
