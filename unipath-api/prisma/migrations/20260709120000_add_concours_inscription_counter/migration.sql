-- Compteur séquentiel par concours pour numéros d'inscription ENAM-2026-0001
ALTER TABLE "Concours" ADD COLUMN IF NOT EXISTS "sigle" TEXT;
ALTER TABLE "Concours" ADD COLUMN IF NOT EXISTS "inscriptionCompteur" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Concours" ADD COLUMN IF NOT EXISTS "inscriptionCompteurAnnee" INTEGER;
