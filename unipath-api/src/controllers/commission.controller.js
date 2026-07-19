const prisma = require('../prisma');
const { mapDossierInscriptionToInscription } = require('../utils/dossier-inscription-mapper');

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
        if (!STATUTS_COMMISSION.includes(statut)) {
          return res.status(403).json({
            error: 'Accès refusé à ce statut',
            statutsAutorises: STATUTS_COMMISSION,
          });
        }
        whereClause = { statut };
      } else {
        whereClause = { statut: { in: STATUTS_COMMISSION } };
      }
    } else if (statut) {
      whereClause = { statut };
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
    const { resolveFiltreAnneePourListe } = require('../utils/annee-academique.helper');
    const filtreAnnee = await resolveFiltreAnneePourListe(req);
    if (filtreAnnee.error) {
      return res.status(filtreAnnee.status || 400).json({ error: filtreAnnee.error });
    }

    const concours = await prisma.concours.findMany({
      where: filtreAnnee.where,
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

    if (statut === 'REJETE' && !commentaireRejet) {
      return res.status(400).json({
        error: 'Le commentaire de rejet est obligatoire',
      });
    }

    if (statut === 'SOUS_RESERVE' && !commentaireSousReserve) {
      return res.status(400).json({
        error: 'Le commentaire de validation sous réserve est obligatoire',
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

/**
 * Espace unifié commission : liste des concours affectés au membre connecté,
 * avec le rôle (EXAMINATEUR / CONTROLEUR) résolu par concours et le nombre de
 * dossiers à traiter pour ce rôle.
 */
exports.getMesConcours = async (req, res) => {
  try {
    const membreId = req.user.id;
    const { getConcoursDuMembre } = require('../utils/affectation-commission.helper');

    const affectations = await getConcoursDuMembre(membreId);

    const resultats = await Promise.all(
      affectations.map(async ({ role, concours }) => {
        let dossiersATraiter = 0;

        if (role === 'EXAMINATEUR') {
          dossiersATraiter = await prisma.dossierInscription.count({
            where: {
              verdict1Par: null,
              inscription: { concoursId: concours.id },
            },
          });
        } else if (role === 'CONTROLEUR') {
          dossiersATraiter = await prisma.dossierInscription.count({
            where: {
              verdict1: { in: ['REJETE', 'SOUS_RESERVE'] },
              decisionControleur: null,
              inscription: { concoursId: concours.id },
            },
          });
        }

        const clotureEtude = !!concours.etudeDossiersClotureeAt;

        return {
          role,
          dossiersATraiter,
          etudeCloturee: clotureEtude,
          concours: {
            id: concours.id,
            nom: concours.libelle,
            libelle: concours.libelle,
            etablissement: concours.etablissement,
            dateDebutEtudeDossiers: concours.dateDebutEtudeDossiers,
            dateFinEtudeDossiers: concours.dateFinEtudeDossiers,
            etudeDossiersClotureeAt: concours.etudeDossiersClotureeAt,
          },
        };
      })
    );

    resultats.sort((a, b) => (a.concours.libelle || '').localeCompare(b.concours.libelle || ''));

    res.json({ affectations: resultats });
  } catch (error) {
    console.error('Erreur getMesConcours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
