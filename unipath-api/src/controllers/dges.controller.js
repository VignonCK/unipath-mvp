// src/controllers/dges.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); 
// prisma = l'objet qui permet de parler à la base de données Supabase

// ─── FONCTION 1 : Toutes les statistiques ──────────────────────────
exports.getStatistiques = async (req, res) => {
  try {
    const statistiques = await prisma.$queryRaw`
      SELECT
        concours_id,
        concours,
        description,
        "dateDebut",
        "dateFin",
        total_inscrits::integer,      -- ::integer = convertir en nombre entier
        dossiers_valides::integer,
        dossiers_rejetes::integer,
        en_attente::integer,
        taux_validation_pct::float    -- ::float = convertir en nombre décimal
      FROM v_statistiques_dges
    `;
    // $queryRaw = écrire du SQL brut directement
    // On l'utilise ici car "v_statistiques_dges" est une VUE SQL,
    // pas une table → Prisma ne la connaît pas, impossible d'écrire prisma.v_statistiques_dges.findMany()

    // On calcule les totaux globaux (pour les 4 cartes en haut du dashboard)
    const totaux = {
      total_concours: statistiques.length, 
      // .length = nombre de lignes retournées = nombre de concours

      total_inscrits: statistiques.reduce((s, r) => s + Number(r.total_inscrits), 0),
      // .reduce() = parcourt le tableau et additionne toutes les valeurs total_inscrits
      // Number() = sécurité car $queryRaw retourne parfois des BigInt au lieu de nombres

      total_valides: statistiques.reduce((s, r) => s + Number(r.dossiers_valides), 0),
      total_rejetes: statistiques.reduce((s, r) => s + Number(r.dossiers_rejetes), 0),
      total_attente: statistiques.reduce((s, r) => s + Number(r.en_attente), 0),
    };

    // On renvoie les 2 objets au frontend dans un seul JSON
    res.json({ totaux, statistiques });

  } catch (error) {
    console.error('Erreur DGES:', error); // Affiche l'erreur dans le terminal
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    // 500 = erreur serveur
  }
};

// ─── FONCTION 2 : Statistiques d'UN seul concours ──────────────────
exports.getStatistiquesConcours = async (req, res) => {
  try {
    const { concoursId } = req.params;
    // req.params = les variables dans l'URL
    // Ex: si l'URL est /api/dges/statistiques/abc-123 → concoursId = "abc-123"

    const stats = await prisma.$queryRaw`
      SELECT * FROM v_statistiques_dges
      WHERE concours_id = ${concoursId}::uuid
    `;
    // ${concoursId} = Prisma insère la valeur de façon sécurisée (protection injection SQL)
    // ::uuid = on précise à PostgreSQL que c'est un UUID (format identifiant de Supabase)

    if (!stats.length) {
      // Si le tableau est vide = aucun concours trouvé avec cet ID
      return res.status(404).json({ error: 'Concours non trouvé' });
      // 404 = "not found"
    }

    res.json(stats[0]); 
    // stats[0] = première (et seule) ligne du résultat
    // Un ID unique ne peut retourner qu'un seul concours

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};