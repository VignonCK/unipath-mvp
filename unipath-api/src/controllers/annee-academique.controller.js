// src/controllers/annee-academique.controller.js
const prisma = require('../prisma');
const {
  validateLibelleAnnee,
  getAnneeEnCours,
} = require('../utils/annee-academique.helper');

exports.lister = async (req, res) => {
  try {
    const annees = await prisma.anneeAcademique.findMany({
      orderBy: { libelle: 'desc' },
      include: {
        _count: { select: { concours: true } },
      },
    });
    return res.json({
      message: 'Années académiques récupérées',
      annees,
      anneeEnCours: annees.find((a) => a.enCours) || null,
    });
  } catch (error) {
    console.error('Erreur lister années académiques:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getEnCours = async (req, res) => {
  try {
    const annee = await getAnneeEnCours();
    return res.json({
      message: 'Année académique en cours',
      annee: annee || null,
    });
  } catch (error) {
    console.error('Erreur getEnCours:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.creer = async (req, res) => {
  try {
    const validation = validateLibelleAnnee(req.body?.libelle);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const existing = await prisma.anneeAcademique.findUnique({
      where: { libelle: validation.libelle },
    });
    if (existing) {
      return res.status(409).json({ error: 'Cette année académique existe déjà.' });
    }

    const definirEnCours = req.body?.definirEnCours === true;
    const annee = await prisma.$transaction(async (tx) => {
      if (definirEnCours) {
        await tx.anneeAcademique.updateMany({
          where: { enCours: true },
          data: { enCours: false },
        });
      }
      return tx.anneeAcademique.create({
        data: {
          libelle: validation.libelle,
          enCours: definirEnCours,
        },
        include: { _count: { select: { concours: true } } },
      });
    });

    return res.status(201).json({
      message: definirEnCours
        ? `Année ${annee.libelle} créée et définie comme année en cours`
        : `Année ${annee.libelle} créée`,
      annee,
    });
  } catch (error) {
    console.error('Erreur creer année académique:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.definirEnCours = async (req, res) => {
  try {
    const { id } = req.params;
    const annee = await prisma.anneeAcademique.findUnique({ where: { id } });
    if (!annee) {
      return res.status(404).json({ error: 'Année académique introuvable' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.anneeAcademique.updateMany({
        where: { enCours: true },
        data: { enCours: false },
      });
      return tx.anneeAcademique.update({
        where: { id },
        data: { enCours: true },
        include: { _count: { select: { concours: true } } },
      });
    });

    return res.json({
      message: `Année ${updated.libelle} définie comme année académique en cours`,
      annee: updated,
    });
  } catch (error) {
    console.error('Erreur definirEnCours:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
