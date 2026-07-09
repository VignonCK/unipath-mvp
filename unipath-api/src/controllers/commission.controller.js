const prisma = require('../prisma');
const { mapDossierInscriptionToInscription } = require('../utils/dossier-inscription-mapper');
const { appendHistorique } = require('../utils/preinscription.helper');

const STATUTS_VALIDES = [
  'EN_ATTENTE',
  'VALIDE_PAR_COMMISSION',
  'REJETE_PAR_COMMISSION',
  'SOUS_RESERVE_PAR_COMMISSION',
  'VALIDE',
  'REJETE',
  'SOUS_RESERVE',
];

const STATUTS_COMMISSION = [
  'EN_ATTENTE',
  'VALIDE_PAR_COMMISSION',
  'REJETE_PAR_COMMISSION',
  'SOUS_RESERVE_PAR_COMMISSION',
];

const ALIAS_STATUTS_COMMISSION = {
  VALIDE: 'VALIDE_PAR_COMMISSION',
  REJETE: 'REJETE_PAR_COMMISSION',
  SOUS_RESERVE: 'SOUS_RESERVE_PAR_COMMISSION',
};

function resolveStatutCommissionQuery(statut) {
  if (!statut) return null;
  return ALIAS_STATUTS_COMMISSION[statut] || statut;
}

exports.getDossiers = async (req, res) => {
  try {
    const { statut } = req.query;
    const userRole = req.userRole || req.user?.role;

    if (statut && !STATUTS_VALIDES.includes(statut)) {
      return res.status(400).json({
        error: 'Statut invalide',
        statutsValides: STATUTS_VALIDES,
      });
    }

    let whereClause = {};

    if (userRole === 'COMMISSION') {
      if (statut) {
        const statutEffectif = resolveStatutCommissionQuery(statut);
        if (!STATUTS_COMMISSION.includes(statutEffectif)) {
          return res.status(403).json({
            error: 'Accès refusé à ce statut',
            statutsAutorises: STATUTS_COMMISSION,
          });
        }
        whereClause = { statut: statutEffectif };
      } else {
        whereClause = { statut: { in: STATUTS_COMMISSION } };
      }
    } else if (statut) {
      whereClause = { statut: resolveStatutCommissionQuery(statut) || statut };
    }

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
      orderBy: { createdAt: 'asc' },
    });

    const inscriptions = dossiers.map(mapDossierInscriptionToInscription);

    res.json({
      total: inscriptions.length,
      inscriptions,
    });
  } catch (error) {
    console.error('Erreur getDossiers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getCandidatsParConcours = async (req, res) => {
  try {
    const concours = await prisma.concours.findMany({
      include: {
        inscriptions: {
          where: {
            dossierInscription: {
              statut: { in: ['VALIDE_PAR_COMMISSION', 'VALIDE'] },
            },
          },
          include: {
            candidat: {
              select: {
                id: true,
                matricule: true,
                nom: true,
                prenom: true,
                email: true,
                telephone: true,
              },
            },
            dossierInscription: true,
          },
          orderBy: [{ note: 'desc' }],
        },
      },
      orderBy: { dateDebut: 'asc' },
    });

    const result = concours.map((c) => ({
      id: c.id,
      libelle: c.libelle,
      etablissement: c.etablissement,
      dateComposition: c.dateComposition,
      totalValides: c.inscriptions.length,
      candidatsAvecNote: c.inscriptions.filter((i) => i.note !== null).length,
      candidatsSansNote: c.inscriptions.filter((i) => i.note === null).length,
      inscriptions: c.inscriptions.map((i) => ({
        id: i.id,
        candidat: i.candidat,
        note: i.note,
        statut: i.note !== null ? 'Noté' : 'Non noté',
      })),
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur récupération candidats par concours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const { note } = req.body;

    if (note !== null && note !== undefined) {
      const noteNum = parseFloat(note);
      if (isNaN(noteNum) || noteNum < 0 || noteNum > 20) {
        return res.status(400).json({ error: 'La note doit être entre 0 et 20' });
      }
    }

    const inscription = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: { note: note !== null && note !== undefined ? parseFloat(note) : null },
      include: {
        candidat: true,
        concours: true,
        dossierInscription: true,
      },
    });

    res.json({
      message: 'Note mise à jour avec succès',
      inscription: {
        ...inscription,
        statut: inscription.dossierInscription?.statut,
      },
    });
  } catch (error) {
    console.error('Erreur mise à jour note:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const { statut, commentaireRejet, commentaireSousReserve } = req.body;
    const membreCommissionId = req.user?.id;

    if (!['VALIDE', 'REJETE', 'SOUS_RESERVE'].includes(statut)) {
      return res.status(400).json({
        error: 'Statut invalide. Valeurs acceptees : VALIDE, REJETE ou SOUS_RESERVE',
      });
    }

    if (statut === 'REJETE' && !commentaireRejet?.trim()) {
      return res.status(400).json({
        error: 'Le commentaire de rejet est obligatoire',
      });
    }

    if (statut === 'SOUS_RESERVE' && !commentaireSousReserve?.trim()) {
      return res.status(400).json({
        error: 'Le commentaire de validation sous réserve est obligatoire',
      });
    }

    if (statut === 'VALIDE' && (commentaireRejet || commentaireSousReserve)) {
      return res.status(400).json({
        error: 'Aucun commentaire ne doit être fourni pour une validation',
      });
    }

    const statutMapping = {
      VALIDE: 'VALIDE_PAR_COMMISSION',
      REJETE: 'REJETE_PAR_COMMISSION',
      SOUS_RESERVE: 'SOUS_RESERVE_PAR_COMMISSION',
    };

    const nouveauStatut = statutMapping[statut];

    const dossier = await prisma.dossierInscription.findUnique({
      where: { inscriptionId },
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier d\'inscription non trouvé' });
    }

    const dossierUpdated = await prisma.dossierInscription.update({
      where: { id: dossier.id },
      data: {
        statut: nouveauStatut,
        commentaireRejet: statut === 'REJETE' ? commentaireRejet : null,
        commentaireSousReserve: statut === 'SOUS_RESERVE' ? commentaireSousReserve : null,
        decisionCommissionPar: membreCommissionId,
        decisionCommissionDate: new Date(),
        historiqueStatuts: appendHistorique(dossier.historiqueStatuts, {
          statut: nouveauStatut,
          date: new Date().toISOString(),
          commentaire: statut === 'SOUS_RESERVE'
            ? commentaireSousReserve
            : statut === 'REJETE'
              ? commentaireRejet
              : `Decision commission: ${statut}`,
        }),
      },
      include: {
        inscription: {
          include: { candidat: true, concours: true },
        },
      },
    });

    res.json({
      message: 'Décision enregistrée. En attente de validation du contrôleur.',
      inscription: mapDossierInscriptionToInscription(dossierUpdated),
    });
  } catch (error) {
    console.error('Erreur updateStatut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
