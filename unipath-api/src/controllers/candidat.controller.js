// src/controllers/candidat.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getProfil = async (req, res) => {
  try {
    const candidat = await prisma.candidat.findUnique({
      where: { id: req.user.id },
      include: {
        inscriptions: {
          include: { concours: true },
        },
        dossier: true,
      },
    });

    if (!candidat) {
      return res.status(404).json({ error: 'Candidat non trouvé' });
    }

    res.json(candidat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateProfil = async (req, res) => {
  try {
    const { nom, prenom, telephone, dateNaiss, lieuNaiss } = req.body;

    const candidat = await prisma.candidat.update({
      where: { id: req.user.id },
      data: { nom, prenom, telephone, dateNaiss, lieuNaiss },
    });

    res.json({
      message: 'Profil mis à jour avec succès',
      candidat,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};