const statsExportService = require('../services/statsExport.service');
const { parseStatsFilters } = require('../utils/stats-filters.helper');
const prisma = require('../prisma');

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
    const stats = await statsExportService.collectStats(filters, null, { module: 'campagnes' });
    const statistiquesCampagnes = stats.campagnes.parCampagne.map(mapParCampagneToLegacy);

    return res.json({
      meta: stats.meta,
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

/** Stats Module 1 (concours) — réservé DEC (+ COMMISSION pour lecture). */
exports.getStatistiquesDec = async (req, res) => {
  try {
    const filters = parseStatsFilters(req.query);
    const stats = await statsExportService.collectStats(filters, null, { module: 'concours' });
    const statistiques = stats.parConcours.map(mapParConcoursToLegacy);

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
    });
  } catch (error) {
    return handleStatsError(res, error, 'Erreur DEC:');
  }
};

exports.getStatistiquesConcours = async (req, res) => {
  try {
    const filters = parseStatsFilters(req.query, {
      concoursIdFromPath: req.params.concoursId,
    });
    const stats = await statsExportService.collectStats(filters, null, { module: 'concours' });
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
    return handleStatsError(res, error, 'Erreur DEC concours:');
  }
};

/**
 * Clôture l'étude des dossiers pour un concours (DEC).
 * POST /api/dges/concours/:concoursId/cloturer-etude
 */
exports.cloturerEtudeConcours = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const concours = await prisma.concours.findUnique({
      where: { id: concoursId },
      select: { id: true, libelle: true, etudeCloturee: true, etudeClotureeAt: true },
    });

    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    if (concours.etudeCloturee) {
      return res.json({
        message: 'L\'étude était déjà clôturée pour ce concours',
        concours: {
          id: concours.id,
          libelle: concours.libelle,
          etudeCloturee: true,
          etudeClotureeAt: concours.etudeClotureeAt,
        },
      });
    }

    const updated = await prisma.concours.update({
      where: { id: concoursId },
      data: {
        etudeCloturee: true,
        etudeClotureeAt: new Date(),
      },
      select: { id: true, libelle: true, etudeCloturee: true, etudeClotureeAt: true },
    });

    return res.json({
      message: 'Étude des dossiers clôturée pour ce concours',
      concours: updated,
    });
  } catch (error) {
    console.error('cloturerEtudeConcours:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Rouvre l'étude des dossiers pour un concours (DEC).
 * POST /api/dges/concours/:concoursId/rouvrir-etude
 */
exports.rouvrirEtudeConcours = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const concours = await prisma.concours.findUnique({
      where: { id: concoursId },
      select: { id: true, libelle: true, etudeCloturee: true, etudeClotureeAt: true },
    });

    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    if (!concours.etudeCloturee) {
      return res.json({
        message: 'L\'étude était déjà ouverte pour ce concours',
        concours: {
          id: concours.id,
          libelle: concours.libelle,
          etudeCloturee: false,
          etudeClotureeAt: null,
        },
      });
    }

    const updated = await prisma.concours.update({
      where: { id: concoursId },
      data: {
        etudeCloturee: false,
        etudeClotureeAt: null,
      },
      select: { id: true, libelle: true, etudeCloturee: true, etudeClotureeAt: true },
    });

    return res.json({
      message: 'Étude des dossiers rouverte pour ce concours',
      concours: updated,
    });
  } catch (error) {
    console.error('rouvrirEtudeConcours:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Attribue les n° de table aux dossiers VALIDE sans numéro (ordre alphabétique + APPEND).
 * POST /api/dges/concours/:concoursId/generer-numeros-table
 */
exports.genererNumerosTableConcours = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const { attribuerNumerosTableParConcours } = require('../utils/numero-inscription.helper');

    const concours = await prisma.concours.findUnique({
      where: { id: concoursId },
      select: {
        id: true,
        libelle: true,
        etudeCloturee: true,
        etudeClotureeAt: true,
      },
    });

    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    const { attribues, exclus } = await prisma.$transaction(
      (tx) => attribuerNumerosTableParConcours(tx, concoursId),
      { maxWait: 15_000, timeout: 120_000 },
    );

    const parts = [];
    if (attribues.length > 0) {
      parts.push(`${attribues.length} numéro(s) de table attribué(s)`);
    }
    if (exclus.length > 0) {
      parts.push(`${exclus.length} dossier(s) non traité(s)`);
    }
    if (parts.length === 0) {
      parts.push('Aucun candidat VALIDE en attente de numéro pour ce concours');
    }

    return res.json({
      message: parts.join(' — '),
      concours: {
        id: concours.id,
        libelle: concours.libelle,
        etudeCloturee: concours.etudeCloturee,
        etudeClotureeAt: concours.etudeClotureeAt,
      },
      count: attribues.length,
      attribues,
      exclus,
      nonTraites: exclus,
    });
  } catch (error) {
    console.error('genererNumerosTableConcours:', error);
    return res.status(500).json({
      error: error.message || 'Erreur lors de la génération des numéros de table',
    });
  }
};

/**
 * Lookup candidat plateforme par matricule (Module 2 — DGES uniquement).
 * GET /api/dges/candidats/lookup?matricule=UnP-2026-000001
 */
exports.lookupCandidatParMatricule = async (req, res) => {
  try {
    const { validerFormatMatricule } = require('../utils/matricule.helper');
    const raw = req.query.matricule;
    if (raw == null || String(raw).trim() === '') {
      return res.status(400).json({ error: 'Paramètre matricule requis' });
    }

    const matricule = String(raw).trim();
    if (!validerFormatMatricule(matricule)) {
      return res.status(400).json({
        error: 'Format de matricule invalide (attendu ex. UnP-2026-000001)',
      });
    }

    const row = await prisma.candidat.findUnique({
      where: { matricule },
      select: {
        id: true,
        matricule: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        sexe: true,
        nationalite: true,
        dateNaiss: true,
        lieuNaiss: true,
        serie: true,
        anip: true,
        InscriptionAcademique: {
          orderBy: [{ anneeAcademique: 'desc' }, { niveau: 'desc' }],
          select: {
            id: true,
            anneeAcademique: true,
            niveau: true,
            statut: true,
            matricule: true,
            createdAt: true,
            etablissement: {
              select: { id: true, nom: true, type: true, ville: true },
            },
            filiere: {
              select: { id: true, nom: true, code: true, niveau: true },
            },
          },
        },
      },
    });

    if (!row) {
      return res.status(404).json({ error: 'Candidat non trouvé pour ce matricule' });
    }

    const { InscriptionAcademique, ...candidat } = row;
    return res.json({
      candidat,
      inscriptionsAcademiques: InscriptionAcademique || [],
    });
  } catch (error) {
    console.error('lookupCandidatParMatricule:', error);
    return res.status(500).json({ error: 'Erreur lors de la recherche du candidat' });
  }
};
