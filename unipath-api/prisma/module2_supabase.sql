CREATE OR REPLACE FUNCTION check_progression() RETURNS TRIGGER AS $$
DECLARE prev_inscription RECORD;
BEGIN
  SELECT * INTO prev_inscription FROM "InscriptionAcademique"
  WHERE "candidatId" = NEW."candidatId"
    AND "filiereId" = NEW."filiereId"
    AND niveau = NEW.niveau - 1;
  IF FOUND AND prev_inscription.statut != 'VALIDE' THEN
    RAISE EXCEPTION 'Progression bloquee : annee precedente non validee';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_progression ON "InscriptionAcademique";
CREATE TRIGGER trg_check_progression
BEFORE INSERT ON "InscriptionAcademique"
FOR EACH ROW EXECUTE FUNCTION check_progression();

CREATE OR REPLACE VIEW v_statistiques_module2 AS
SELECT e.nom AS etablissement, e.type, f.nom AS filiere, f.niveau,
  ia."anneeAcademique" AS annee,
  COUNT(ia.id) AS total_inscrits,
  COUNT(CASE WHEN ia.statut = 'VALIDE' THEN 1 END) AS valides,
  COUNT(CASE WHEN ia.statut = 'REDOUBLANT' THEN 1 END) AS redoublants,
  ROUND(COUNT(CASE WHEN ia.statut='VALIDE' THEN 1 END)::NUMERIC
    / NULLIF(COUNT(ia.id),0) * 100, 2) AS taux_reussite
FROM "Etablissement" e
LEFT JOIN "Filiere" f ON f."etablissementId" = e.id
LEFT JOIN "InscriptionAcademique" ia ON ia."filiereId" = f.id
GROUP BY e.id, e.nom, e.type, f.nom, f.niveau, ia."anneeAcademique";
