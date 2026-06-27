-- Compléments et historique pour resoumission dossier concours (SOUS_RESERVE)
ALTER TABLE "DossierInscription" ADD COLUMN IF NOT EXISTS "documentsCompl" JSONB;
ALTER TABLE "DossierInscription" ADD COLUMN IF NOT EXISTS "historiqueStatuts" JSONB;
