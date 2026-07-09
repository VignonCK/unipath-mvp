const statsExportService = require('../services/statsExport.service');
const { parseStatsFilters } = require('../utils/stats-filters.helper');

function mapParConcoursToLegacy(row) {
  return {
    concours_id: row.concoursId,
    concours: row.libelle,
    description: row.description ?? null,
    dateDebut: row.dateDebut ?? null,
    dateFin: row.dateFin ?? null,
    etablissementId: row.etablissementId,
    etablissement: row.etablissement,
    total_inscrits: row.totalCandidats,
    dossiers_valides: row.acceptes,
    dossiers_rejetes: row.rejetes,
    en_attente: row.enAttente,
    taux_validation_pct: row.tauxValidationPct,
  };
}

function mapParEtablissementLegacy(groups) {
  return groups.map((group) => ({
    etablissement: group.nom,
    etablissementId: group.etablissementId,
    nbConcours: group.nbConcours,
    nbCandidats: group.totalCandidats,
    concours: group.concours.map(mapParConcoursToLegacy),
  }));
}

function handleStatsError(res, error, contextLabel) {
  if (error.status === 400) {
    return res.status(400).json({ error: error.message });
  }
  if (error.status === 403) {
    return res.status(403).json({ error: error.message || 'Accès refusé' });
  }
  console.error(contextLabel, error);
  return res.status(500).json({ error: 'Erreur lors de la recuperation des statistiques' });
}

exports.getStatistiques = async (req, res) => {
  try {
    const filters = parseStatsFilters(req.query);
    const stats = await statsExportService.collectStats(filters, null);
    const statistiques = stats.parConcours.map(mapParConcoursToLegacy);

    return res.json({
      meta: stats.meta,
      totaux: {
        total_concours: statistiques.length,
        total_inscrits: stats.totaux.totalCandidats,
        total_valides: stats.totaux.acceptes,
        total_rejetes: stats.totaux.rejetes,
        total_attente: stats.totaux.enAttente,
      },
      statistiques,
      parEtablissement: mapParEtablissementLegacy(stats.parEtablissement),
    });
  } catch (error) {
    return handleStatsError(res, error, 'Erreur DGES:');
  }
};

exports.getStatistiquesConcours = async (req, res) => {
  try {
    const filters = parseStatsFilters(req.query, {
      concoursIdFromPath: req.params.concoursId,
    });
    const stats = await statsExportService.collectStats(filters, null);
    const row = stats.parConcours[0];

    if (!row) {
      return res.status(404).json({ error: 'Concours non trouve' });
    }

    return res.json({
      meta: stats.meta,
      ...mapParConcoursToLegacy(row),
    });
  } catch (error) {
    return handleStatsError(res, error, 'Erreur DGES concours:');
  }
};

module.exports = exports;
