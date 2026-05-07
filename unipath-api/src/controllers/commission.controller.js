const prisma = require('../prisma');
const { envoyerEmailValidation, envoyerEmailRejet, envoyerEmailConvocation, envoyerEmailSousReserve } = require('../services/email.service');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

exports.getDossiers = async (req, res) => {
  try {
    const { statut } = req.query;

    const inscriptions = await prisma.inscription.findMany({
      where: statut ? { statut } : {},
      include: {
        candidat: {
          include: { dossier: true },
        },
        concours: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      total: inscriptions.length,
      inscriptions,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getCandidatsParConcours = async (req, res) => {
  try {
    const concours = await prisma.concours.findMany({
      include: {
        inscriptions: {
          where: { statut: 'VALIDE' },
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
          },
          orderBy: [
            { note: 'desc' },
          ],
        },
      },
      orderBy: { dateDebut: 'asc' },
    });

    const result = concours.map(c => ({
      id: c.id,
      libelle: c.libelle,
      etablissement: c.etablissement,
      dateComposition: c.dateComposition,
      totalValides: c.inscriptions.length,
      candidatsAvecNote: c.inscriptions.filter(i => i.note !== null).length,
      candidatsSansNote: c.inscriptions.filter(i => i.note === null).length,
      inscriptions: c.inscriptions.map(i => ({
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

    // Validation
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
      },
    });

    res.json({
      message: 'Note mise à jour avec succès',
      inscription,
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
    const membreCommissionId = req.user?.id; // ID du membre qui prend la décision

    if (!['VALIDE', 'REJETE', 'SOUS_RESERVE'].includes(statut)) {
      return res.status(400).json({
        error: 'Statut invalide. Valeurs acceptees : VALIDE, REJETE ou SOUS_RESERVE',
      });
    }

    // Si rejet, le commentaire est obligatoire
    if (statut === 'REJETE' && !commentaireRejet) {
      return res.status(400).json({
        error: 'Le commentaire de rejet est obligatoire',
      });
    }

    // Si sous réserve, le commentaire est obligatoire
    if (statut === 'SOUS_RESERVE' && !commentaireSousReserve) {
      return res.status(400).json({
        error: 'Le commentaire de validation sous réserve est obligatoire',
      });
    }

    // Mapper les statuts vers les statuts "PAR_COMMISSION"
    const statutMapping = {
      'VALIDE': 'VALIDE_PAR_COMMISSION',
      'REJETE': 'REJETE_PAR_COMMISSION',
      'SOUS_RESERVE': 'SOUS_RESERVE_PAR_COMMISSION'
    };

    const nouveauStatut = statutMapping[statut];

    const inscription = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: { 
        statut: nouveauStatut,
        commentaireRejet: statut === 'REJETE' ? commentaireRejet : null,
        commentaireSousReserve: statut === 'SOUS_RESERVE' ? commentaireSousReserve : null,
        decisionCommissionPar: membreCommissionId,
        decisionCommissionDate: new Date()
      },
      include: {
        candidat: true,
        concours: true,
      },
    });

    // ❌ NE PAS ENVOYER D'EMAIL ICI
    // L'email sera envoyé uniquement après validation du contrôleur

    res.json({
      message: 'Décision enregistrée. En attente de validation du contrôleur.',
      inscription,
    });
  } catch (error) {
    console.error('Erreur updateStatut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};