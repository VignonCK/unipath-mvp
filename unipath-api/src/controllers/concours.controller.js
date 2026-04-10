// src/controllers/concours.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllConcours = async (req, res) => {
  try {
    const concours = await prisma.concours.findMany({
      orderBy: { dateDebut: 'asc' },
    });
    res.json(concours);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getConcoursById = async (req, res) => {
  try {
    const { id } = req.params;

    const concours = await prisma.concours.findUnique({
      where: { id },
      include: {
        _count: { select: { inscriptions: true } },
      },
    });

    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    res.json(concours);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};