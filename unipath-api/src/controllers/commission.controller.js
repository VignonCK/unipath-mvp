// src/controllers/commission.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { envoyerEmailValidation, envoyerEmailRejet } = require('../services/email.service');

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

exports.updateStatut = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const { statut } = req.body;

    if (!['VALIDE', 'REJETE'].includes(statut)) {
      return res.status(400).json({
        error: 'Statut invalide. Valeurs acceptees : VALIDE ou REJETE',
      });
    }

    const inscription = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: { statut },
      include: {
        candidat: true,
        concours: true,
      },
    });

    if (statut === 'VALIDE') {
      envoyerEmailValidation({
        candidatEmail: inscription.candidat.email,
        candidatNom: inscription.candidat.nom,
        candidatPrenom: inscription.candidat.prenom,
        concours: inscription.concours.libelle,
        matricule: inscription.candidat.matricule,
      });
    } else {
      envoyerEmailRejet({
        candidatEmail: inscription.candidat.email,
        candidatNom: inscription.candidat.nom,
        candidatPrenom: inscription.candidat.prenom,
        concours: inscription.concours.libelle,
      });
    }

    res.json({
      message: `Dossier ${statut.toLowerCase()} avec succes. Email de notification envoye.`,
      inscription,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};