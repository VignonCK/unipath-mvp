// src/controllers/dges.controller.js
const prisma = require('../prisma');

function buildConcoursStats(concours) {
  const total_inscrits = concours.inscriptions.length;
  let dossiers_valides = 0;
  let dossiers_rejetes = 0;
  let en_attente = 0;

  concours.inscriptions.forEach((ins) => {
    const statut = ins.dossierInscription?.statut;
    if (statut === 'VALIDE') dossiers_valides += 1;
    else if (statut === 'REJETE') dossiers_rejetes += 1;
    else en_attente += 1;
  });

  const taux_validation_pct =
    total_inscrits > 0
      ? Math.round((dossiers_valides / total_inscrits) * 10000) / 100
      : 0;

  return {
    concours_id: concours.id,
    concours: concours.libelle,
    description: concours.description,
    dateDebut: concours.dateDebut,
    dateFin: concours.dateFin,
    etablissementId: concours.etablissementId,
    etablissement: concours.etablissementOrganisateur?.nom || concours.etablissement || null,
    total_inscrits,
    dossiers_valides,
    dossiers_rejetes,
    en_attente,
    taux_validation_pct,
  };
}

function getEtablissementGroupKey(concours) {
  if (concours.etablissementId) {
    return `id:${concours.etablissementId}`;
  }
  const label = (concours.etablissement || 'Non renseigné').trim();
  return `text:${label.toLowerCase()}`;
}

function getEtablissementGroupLabel(concours) {
  if (concours.etablissementOrganisateur?.nom) {
    return concours.etablissementOrganisateur.nom;
  }
  return (concours.etablissement || 'Non renseigné').trim();
}

function buildParEtablissement(concoursList, statistiques) {
  const groups = new Map();

  concoursList.forEach((concours, index) => {
    const key = getEtablissementGroupKey(concours);
    const stats = statistiques[index];

    if (!groups.has(key)) {
      groups.set(key, {
        etablissement: getEtablissementGroupLabel(concours),
        etablissementId: concours.etablissementId || null,
        nbConcours: 0,
        nbCandidats: 0,
        concours: [],
      });
    }

    const group = groups.get(key);
    group.nbConcours += 1;
    group.nbCandidats += Number(stats.total_inscrits);
    group.concours.push(stats);
  });

  return Array.from(groups.values()).sort((a, b) =>
    a.etablissement.localeCompare(b.etablissement, 'fr')
  );
}

const concoursStatsInclude = {
  inscriptions: {
    select: {
      dossierInscription: {
        select: { statut: true },
      },
    },
  },
};

const concoursStatsSelect = {
  id: true,
  libelle: true,
  description: true,
  dateDebut: true,
  dateFin: true,
  etablissement: true,
  etablissementId: true,
  etablissementOrganisateur: {
    select: { id: true, nom: true, ville: true, type: true },
  },
};

exports.getStatistiques = async (req, res) => {
  try {
    const concoursList = await prisma.concours.findMany({
      select: {
        ...concoursStatsSelect,
        ...concoursStatsInclude,
      },
      orderBy: { dateDebut: 'desc' },
    });

    const statistiques = concoursList.map(buildConcoursStats);
    const parEtablissement = buildParEtablissement(concoursList, statistiques);

    const totaux = {
      total_concours: statistiques.length,
      total_inscrits: statistiques.reduce((s, r) => s + Number(r.total_inscrits), 0),
      total_valides: statistiques.reduce((s, r) => s + Number(r.dossiers_valides), 0),
      total_rejetes: statistiques.reduce((s, r) => s + Number(r.dossiers_rejetes), 0),
      total_attente: statistiques.reduce((s, r) => s + Number(r.en_attente), 0),
    };

    res.json({ totaux, statistiques, parEtablissement });
  } catch (error) {
    console.error('Erreur DGES:', error);
    res.status(500).json({ error: 'Erreur lors de la recuperation des statistiques' });
  }
};

exports.getStatistiquesConcours = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const concours = await prisma.concours.findUnique({
      where: { id: concoursId },
      select: {
        ...concoursStatsSelect,
        ...concoursStatsInclude,
      },
    });

    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouve' });
    }

    res.json(buildConcoursStats(concours));
  } catch (error) {
    console.error('Erreur DGES concours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
