-- Phase A n° de table : codes optionnels (nullable, sans backfill)
ALTER TABLE "CentreComposition" ADD COLUMN IF NOT EXISTS "codeVille" TEXT;
ALTER TABLE "Concours" ADD COLUMN IF NOT EXISTS "codeFiliere" TEXT;
