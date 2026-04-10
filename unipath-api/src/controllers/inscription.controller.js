// src/controllers/inscription.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.creerInscription = async (req, res) => {
  try {
    const { concoursId } = req.body;
    const candidatId = req.user.id;

    const concours = await prisma.concours.findUnique({
      where: { id: concoursId },
    });

    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    const inscription = await prisma.inscription.create({
      data: {
        candidatId,
        concoursId,
        statut: 'EN_ATTENTE',
      },
      include: { concours: true },
    });

    res.status(201).json({
      message: 'Inscription créée avec succès',
      inscription,
    });
  } catch (error) {
    if (error.code === 'P2010' || error.message.includes('Conflit de dates')) {
      return res.status(409).json({
        error: 'Conflit de dates : vous êtes déjà inscrit à un concours pendant cette période.',
      });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Vous êtes déjà inscrit à ce concours.',
      });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getMesInscriptions = async (req, res) => {
  try {
    const inscriptions = await prisma.inscription.findMany({
      where: { candidatId: req.user.id },
      include: { concours: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(inscriptions);
  } catch (error) {
    console.error('Erreur inscription:', error);
res.status(500).json({ error: error.message });
  }
};