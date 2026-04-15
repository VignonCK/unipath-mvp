// src/controllers/dges.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getStatistiques = async (req, res) => {
  try {
    const statistiques = await prisma.$queryRaw`
      SELECT
        concours_id,
        concours,
        description,
        "dateDebut",
        "dateFin",
        total_inscrits::integer,
        dossiers_valides::integer,
        dossiers_rejetes::integer,
        en_attente::integer,
        taux_validation_pct::float
      FROM v_statistiques_dges
    `;

    const totaux = {
      total_concours: statistiques.length,
      total_inscrits: statistiques.reduce((s, r) => s + Number(r.total_inscrits), 0),
      total_valides: statistiques.reduce((s, r) => s + Number(r.dossiers_valides), 0),
      total_rejetes: statistiques.reduce((s, r) => s + Number(r.dossiers_rejetes), 0),
      total_attente: statistiques.reduce((s, r) => s + Number(r.en_attente), 0),
    };

    res.json({ totaux, statistiques });
  } catch (error) {
    console.error('Erreur DGES:', error);
    res.status(500).json({ error: 'Erreur lors de la recuperation des statistiques' });
  }
};

exports.getStatistiquesConcours = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const stats = await prisma.$queryRaw`
      SELECT * FROM v_statistiques_dges
      WHERE concours_id = ${concoursId}::uuid
    `;

    if (!stats.length) {
      return res.status(404).json({ error: 'Concours non trouve' });
    }

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};