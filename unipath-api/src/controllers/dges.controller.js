const statsExportService = require('../services/statsExport.service');
const { parseStatsFilters } = require('../utils/stats-filters.helper');

function mapRepartitionSexe(repartitionSexe = {}) {
  return {
    M: Number(repartitionSexe.M) || 0,
    F: Number(repartitionSexe.F) || 0,
    non_renseigne: Number(repartitionSexe.nonRenseigne) || 0,
  };
}

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
    sous_reserve: row.sousReserve,
    repartition_sexe: mapRepartitionSexe(row.repartitionSexe),
    taux_validation_pct: row.tauxValidationPct,
  };
}

function mapParEtablissementLegacy(groups) {
  return groups.map((group) => ({
    etablissement: group.nom,
    etablissementId: group.etablissementId,
    nbConcours: group.nbConcours,
    nbCandidats: group.totalCandidats,
    valides: group.acceptes,
    rejetes: group.rejetes,
    en_attente: group.enAttente,
    sous_reserve: group.sousReserve,
    concours: group.concours.map(mapParConcoursToLegacy),
  }));
}

function mapParCampagneToLegacy(row) {
  return {
    campagne_id: row.campagneId,
    campagne: row.titre,
    anneeAcademique: row.anneeAcademique,
    statutCampagne: row.statutCampagne,
    etablissementId: row.etablissementId,
    etablissement: row.etablissement,
    ville: row.ville,
    total_candidatures: row.totalCandidats,
    valides: row.acceptes,
    rejetes: row.rejetes,
    en_attente: row.enAttente,
    sous_reserve: row.sousReserve,
    repartition_sexe: mapRepartitionSexe(row.repartitionSexe),
    taux_validation_pct: row.tauxValidationPct,
  };
}

function mapParEtablissementPriveLegacy(groups) {
  return groups.map((group) => ({
    etablissement: group.nom,
    etablissementId: group.etablissementId,
    ville: group.ville,
    nbCampagnes: group.nbCampagnes,
    nbCandidatures: group.totalCandidats,
    valides: group.acceptes,
    rejetes: group.rejetes,
    en_attente: group.enAttente,
    sous_reserve: group.sousReserve,
    campagnes: group.campagnes.map(mapParCampagneToLegacy),
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
    const statistiquesCampagnes = stats.campagnes.parCampagne.map(mapParCampagneToLegacy);

    return res.json({
      meta: stats.meta,
      totaux: {
        total_concours: statistiques.length,
        total_inscrits: stats.totaux.totalCandidats,
        total_valides: stats.totaux.acceptes,
        total_rejetes: stats.totaux.rejetes,
        total_attente: stats.totaux.enAttente,
        total_sous_reserve: stats.totaux.sousReserve,
        repartition_sexe: mapRepartitionSexe(stats.totaux.repartitionSexe),
      },
      statistiques,
      parEtablissement: mapParEtablissementLegacy(stats.parEtablissement),
      totauxCampagnes: {
        total_campagnes: statistiquesCampagnes.length,
        total_candidatures: stats.campagnes.totaux.totalCandidats,
        total_valides: stats.campagnes.totaux.acceptes,
        total_rejetes: stats.campagnes.totaux.rejetes,
        total_attente: stats.campagnes.totaux.enAttente,
        total_sous_reserve: stats.campagnes.totaux.sousReserve,
        repartition_sexe: mapRepartitionSexe(stats.campagnes.totaux.repartitionSexe),
      },
      statistiquesCampagnes,
      parEtablissementPrive: mapParEtablissementPriveLegacy(stats.campagnes.parEtablissement),
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
      parCentre: row.parCentre,
    });
  } catch (error) {
    return handleStatsError(res, error, 'Erreur DGES concours:');
  }
};
