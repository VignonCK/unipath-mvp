-- CreateEnum pour Verdict et SousRoleCommission
DO $$ BEGIN
 CREATE TYPE "Verdict" AS ENUM ('VALIDE', 'REJETE', 'SOUS_RESERVE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "SousRoleCommission" AS ENUM ('EXAMINATEUR', 'CONTROLEUR');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Ajouter le champ sousRole à MembreCommission
ALTER TABLE "MembreCommission" ADD COLUMN IF NOT EXISTS "sousRole" "SousRoleCommission";

-- Créer la table DossierInscription
CREATE TABLE IF NOT EXISTS "DossierInscription" (
    "id" TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "quittanceUrl" TEXT,
    "piecesExtras" JSONB,
    "statut" "StatutDossier" NOT NULL DEFAULT 'EN_ATTENTE',
    "verdict1Par" TEXT,
    "verdict1" "Verdict",
    "verdict1Motif" TEXT,
    "verdict1Date" TIMESTAMP(3),
    "verdict1ModifieCount" INTEGER NOT NULL DEFAULT 0,
    "verdict2Par" TEXT,
    "verdict2" "Verdict",
    "verdict2Motif" TEXT,
    "verdict2Date" TIMESTAMP(3),
    "verdict2ModifieCount" INTEGER NOT NULL DEFAULT 0,
    "decisionControleur" "Verdict",
    "decisionControleurMotif" TEXT,
    "decisionControleurDate" TIMESTAMP(3),
    "decisionControleurPar" TEXT,
    "commentaireRejet" TEXT,
    "commentaireSousReserve" TEXT,
    "decisionCommissionPar" TEXT,
    "decisionCommissionDate" TIMESTAMP(3),
    "commentaireControleur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierInscription_pkey" PRIMARY KEY ("id")
);

-- Migrer les données existantes de Inscription vers DossierInscription
INSERT INTO "DossierInscription" (
    "id",
    "inscriptionId",
    "quittanceUrl",
    "piecesExtras",
    "statut",
    "commentaireRejet",
    "commentaireSousReserve",
    "decisionCommissionPar",
    "decisionCommissionDate",
    "decisionControleurPar",
    "commentaireControleur",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    "id",
    "quittanceUrl",
    "piecesExtras",
    "statut",
    "commentaireRejet",
    "commentaireSousReserve",
    "decisionCommissionPar",
    "decisionCommissionDate",
    "decisionControleurPar",
    "commentaireControleur",
    "createdAt",
    NOW()
FROM "Inscription"
WHERE NOT EXISTS (
    SELECT 1 FROM "DossierInscription" WHERE "DossierInscription"."inscriptionId" = "Inscription"."id"
);

-- Créer les index sur DossierInscription
CREATE UNIQUE INDEX IF NOT EXISTS "DossierInscription_inscriptionId_key" ON "DossierInscription"("inscriptionId");
CREATE INDEX IF NOT EXISTS "DossierInscription_inscriptionId_idx" ON "DossierInscription"("inscriptionId");
CREATE INDEX IF NOT EXISTS "DossierInscription_statut_idx" ON "DossierInscription"("statut");
CREATE INDEX IF NOT EXISTS "DossierInscription_verdict1Par_idx" ON "DossierInscription"("verdict1Par");
CREATE INDEX IF NOT EXISTS "DossierInscription_verdict2Par_idx" ON "DossierInscription"("verdict2Par");
CREATE INDEX IF NOT EXISTS "DossierInscription_decisionControleurPar_idx" ON "DossierInscription"("decisionControleurPar");
CREATE INDEX IF NOT EXISTS "DossierInscription_createdAt_idx" ON "DossierInscription"("createdAt");

-- Créer l'index sur MembreCommission
CREATE INDEX IF NOT EXISTS "MembreCommission_sousRole_idx" ON "MembreCommission"("sousRole");

-- Créer les index sur Inscription
CREATE INDEX IF NOT EXISTS "Inscription_candidatId_idx" ON "Inscription"("candidatId");
CREATE INDEX IF NOT EXISTS "Inscription_concoursId_idx" ON "Inscription"("concoursId");

-- Ajouter la foreign key sur DossierInscription
DO $$ BEGIN
 ALTER TABLE "DossierInscription" ADD CONSTRAINT "DossierInscription_inscriptionId_fkey" 
 FOREIGN KEY ("inscriptionId") REFERENCES "Inscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Migrer ActionHistory : renommer dossierId en dossierInscriptionId
-- Étape 1: Ajouter la nouvelle colonne
ALTER TABLE "ActionHistory" ADD COLUMN IF NOT EXISTS "dossierInscriptionId" TEXT;

-- Étape 2: Copier les données de dossierId vers dossierInscriptionId
-- On suppose que dossierId fait référence à l'ID de l'inscription
UPDATE "ActionHistory" 
SET "dossierInscriptionId" = (
    SELECT "id" FROM "DossierInscription" WHERE "DossierInscription"."inscriptionId" = "ActionHistory"."dossierId"
)
WHERE "dossierInscriptionId" IS NULL AND "dossierId" IS NOT NULL;

-- Étape 3: Supprimer les anciens index sur dossierId
DROP INDEX IF EXISTS "ActionHistory_dossierId_idx";
DROP INDEX IF EXISTS "ActionHistory_dossierId_timestamp_idx";

-- Étape 4: Créer les nouveaux index sur dossierInscriptionId
CREATE INDEX IF NOT EXISTS "ActionHistory_dossierInscriptionId_idx" ON "ActionHistory"("dossierInscriptionId");
CREATE INDEX IF NOT EXISTS "ActionHistory_dossierInscriptionId_timestamp_idx" ON "ActionHistory"("dossierInscriptionId", "timestamp" DESC);

-- Étape 5: Ajouter la foreign key
DO $$ BEGIN
 ALTER TABLE "ActionHistory" ADD CONSTRAINT "ActionHistory_dossierInscriptionId_fkey" 
 FOREIGN KEY ("dossierInscriptionId") REFERENCES "DossierInscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Étape 6: Supprimer l'ancienne colonne dossierId (optionnel, à faire après vérification)
-- ALTER TABLE "ActionHistory" DROP COLUMN IF EXISTS "dossierId";

-- Supprimer les colonnes de Inscription qui ont été migrées vers DossierInscription
-- ATTENTION: Cette étape est commentée pour préserver les données pendant la transition
-- Décommenter après avoir vérifié que tout fonctionne correctement
/*
ALTER TABLE "Inscription" DROP COLUMN IF EXISTS "statut";
ALTER TABLE "Inscription" DROP COLUMN IF EXISTS "quittanceUrl";
ALTER TABLE "Inscription" DROP COLUMN IF EXISTS "piecesExtras";
ALTER TABLE "Inscription" DROP COLUMN IF EXISTS "commentaireRejet";
ALTER TABLE "Inscription" DROP COLUMN IF EXISTS "commentaireSousReserve";
ALTER TABLE "Inscription" DROP COLUMN IF EXISTS "decisionCommissionPar";
ALTER TABLE "Inscription" DROP COLUMN IF EXISTS "decisionCommissionDate";
ALTER TABLE "Inscription" DROP COLUMN IF EXISTS "decisionControleurPar";
ALTER TABLE "Inscription" DROP COLUMN IF EXISTS "decisionControleurDate";
ALTER TABLE "Inscription" DROP COLUMN IF EXISTS "commentaireControleur";
*/
