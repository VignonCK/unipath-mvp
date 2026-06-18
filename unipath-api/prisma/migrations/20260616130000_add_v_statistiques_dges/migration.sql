-- Vue statistiques DGES par concours (dashboard /dges/statistiques)
CREATE OR REPLACE VIEW v_statistiques_dges AS
SELECT
  c.id AS concours_id,
  c.libelle AS concours,
  c.description,
  c."dateDebut",
  c."dateFin",
  COUNT(i.id)::integer AS total_inscrits,
  COUNT(CASE WHEN di.statut = 'VALIDE' THEN 1 END)::integer AS dossiers_valides,
  COUNT(CASE WHEN di.statut = 'REJETE' THEN 1 END)::integer AS dossiers_rejetes,
  COUNT(
    CASE
      WHEN di.id IS NULL OR di.statut NOT IN ('VALIDE', 'REJETE') THEN 1
    END
  )::integer AS en_attente,
  ROUND(
    COUNT(CASE WHEN di.statut = 'VALIDE' THEN 1 END)::numeric
    / NULLIF(COUNT(i.id), 0) * 100,
    2
  )::double precision AS taux_validation_pct
FROM "Concours" c
LEFT JOIN "Inscription" i ON i."concoursId" = c.id
LEFT JOIN "DossierInscription" di ON di."inscriptionId" = i.id
GROUP BY c.id, c.libelle, c.description, c."dateDebut", c."dateFin";
