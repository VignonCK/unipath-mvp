-- Clôture de l'étude des dossiers par concours (DGES)
ALTER TABLE "Concours" ADD COLUMN IF NOT EXISTS "etudeCloturee" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Concours" ADD COLUMN IF NOT EXISTS "etudeClotureeAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Concours_etudeCloturee_idx" ON "Concours"("etudeCloturee");
