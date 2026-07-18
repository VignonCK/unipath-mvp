-- Scope MembreCommission : par établissement → par concours
-- concoursId nullable (comptes seed legacy) ; deny-by-default côté code si NULL.

ALTER TABLE "MembreCommission" ADD COLUMN IF NOT EXISTS "concoursId" TEXT;

-- Backfill : 1er concours de l'établissement (createdAt ASC)
DO $$
DECLARE
  r RECORD;
  first_concours RECORD;
  autres_count INT;
BEGIN
  FOR r IN
    SELECT mc.id, mc.email, mc."etablissementId", e.nom AS etab_nom
    FROM "MembreCommission" mc
    LEFT JOIN "Etablissement" e ON e.id = mc."etablissementId"
    WHERE mc."concoursId" IS NULL
  LOOP
    IF r."etablissementId" IS NULL THEN
      RAISE WARNING 'LEGACY [%] sans etablissementId ni concoursId — à réassigner manuellement', r.email;
      CONTINUE;
    END IF;

    SELECT c.id, c.libelle, c.sigle
    INTO first_concours
    FROM "Concours" c
    WHERE c."etablissementId" = r."etablissementId"
    ORDER BY c."createdAt" ASC
    LIMIT 1;

    IF first_concours.id IS NULL THEN
      RAISE WARNING 'FALLBACK ÉCHEC [%] etablissement=% (%) — aucun concours trouvé',
        r.email, r.etab_nom, r."etablissementId";
      CONTINUE;
    END IF;

    SELECT COUNT(*)::INT INTO autres_count
    FROM "Concours" c
    WHERE c."etablissementId" = r."etablissementId"
      AND c.id <> first_concours.id;

    UPDATE "MembreCommission"
    SET "concoursId" = first_concours.id
    WHERE id = r.id;

    RAISE NOTICE 'FALLBACK [%] etablissement=% → concours=% (%) — % autre(s) concours non assigné(s)',
      r.email,
      COALESCE(r.etab_nom, r."etablissementId"),
      first_concours.id,
      COALESCE(first_concours.libelle, first_concours.sigle, first_concours.id::text),
      autres_count;
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MembreCommission_concoursId_fkey'
  ) THEN
    ALTER TABLE "MembreCommission"
      ADD CONSTRAINT "MembreCommission_concoursId_fkey"
      FOREIGN KEY ("concoursId") REFERENCES "Concours"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "MembreCommission_concoursId_idx"
  ON "MembreCommission"("concoursId");

CREATE INDEX IF NOT EXISTS "MembreCommission_concoursId_sousRole_idx"
  ON "MembreCommission"("concoursId", "sousRole");
