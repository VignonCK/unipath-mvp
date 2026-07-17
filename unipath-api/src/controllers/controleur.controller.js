const prisma = require('../prisma');
const { mapDossierInscriptionToInscription } = require('../utils/dossier-inscription-mapper');
const { envoyerEmailDecisionFinale } = require('../utils/email-decision.helper');
const { runInBackground } = require('../utils/background-task');

const STATUTS_EN_ATTENTE = [
  'VALIDE_PAR_COMMISSION',
  'REJETE_PAR_COMMISSION',
  'SOUS_RESERVE_PAR_COMMISSION',
];

exports.getDossiersEnAttente = async (req, res) => {
  try {
    const { statut } = req.query;

    const whereClause = statut
      ? { statut }
      : { statut: { in: STATUTS_EN_ATTENTE } };

    const dossiers = await prisma.dossierInscription.findMany({
      where: whereClause,
      include: {
        inscription: {
          include: {
            candidat: { include: { dossier: true } },
            concours: true,
          },
        },
      },
      orderBy: { decisionCommissionDate: 'desc' },
    });

    res.json({
      total: dossiers.length,
      inscriptions: dossiers.map(mapDossierInscriptionToInscription),
    });
  } catch (error) {
    console.error('Erreur getDossiersEnAttente:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.validerDecision = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const { action, commentaireControleur } = req.body;
    const controleurId = req.user?.id;

    const actionsValides = ['CONFIRMER', 'VALIDER', 'REJETER', 'SOUS_RESERVE'];
    if (!actionsValides.includes(action)) {
      return res.status(400).json({
        error: `Action invalide. Actions acceptées : ${actionsValides.join(', ')}`,
      });
    }

    const dossier = await prisma.dossierInscription.findUnique({
      where: { inscriptionId },
      include: {
        inscription: {
          include: { candidat: true, concours: true },
        },
      },
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    let nouveauStatut;
    let typeEmail;

    if (action === 'CONFIRMER') {
      const mapping = {
        VALIDE_PAR_COMMISSION: 'VALIDE',
        REJETE_PAR_COMMISSION: 'REJETE',
        SOUS_RESERVE_PAR_COMMISSION: 'SOUS_RESERVE',
      };
      nouveauStatut = mapping[dossier.statut];

      if (!nouveauStatut) {
        return res.status(400).json({
          error: `Impossible de confirmer. Statut actuel : ${dossier.statut}`,
        });
      }

      typeEmail = nouveauStatut;
    } else {
      const actionToStatut = {
        VALIDER: 'VALIDE',
        REJETER: 'REJETE',
        SOUS_RESERVE: 'SOUS_RESERVE',
      };
      nouveauStatut = actionToStatut[action];
      typeEmail = nouveauStatut;
    }

    const dossierUpdated = await prisma.dossierInscription.update({
      where: { id: dossier.id },
      data: {
        statut: nouveauStatut,
        decisionControleurPar: controleurId,
        decisionControleurDate: new Date(),
        commentaireControleur: action !== 'CONFIRMER' ? commentaireControleur : null,
      },
      include: {
        inscription: {
          include: { candidat: true, concours: true },
        },
      },
    });

    const inscriptionUpdated = mapDossierInscriptionToInscription(dossierUpdated);

    runInBackground(
      () =>
        envoyerEmailDecisionFinale({
          candidat: inscriptionUpdated.candidat,
          concours: inscriptionUpdated.concours,
          inscription: inscriptionUpdated,
          decision: typeEmail,
          motif:
            inscriptionUpdated.commentaireControleur
            || inscriptionUpdated.commentaireRejet
            || inscriptionUpdated.commentaireSousReserve,
        }),
      'controleur-decision-email'
    );

    res.json({
      message: 'Décision validée. Un email sera envoyé au candidat.',
      inscription: inscriptionUpdated,
    });
  } catch (error) {
    console.error('Erreur validerDecision:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getStatistiques = async (req, res) => {
  try {
    const [enAttente, valides, rejetes, sousReserve] = await Promise.all([
      prisma.dossierInscription.count({
        where: { statut: { in: STATUTS_EN_ATTENTE } },
      }),
      prisma.dossierInscription.count({ where: { statut: 'VALIDE' } }),
      prisma.dossierInscription.count({ where: { statut: 'REJETE' } }),
      prisma.dossierInscription.count({ where: { statut: 'SOUS_RESERVE' } }),
    ]);

    res.json({
      enAttenteValidation: enAttente,
      valides,
      rejetes,
      sousReserve,
      total: valides + rejetes + sousReserve,
    });
  } catch (error) {
    console.error('Erreur getStatistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
