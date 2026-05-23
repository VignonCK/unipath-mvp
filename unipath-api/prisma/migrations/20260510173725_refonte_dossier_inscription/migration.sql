-- Migration: Refonte DossierInscription (idempotent)
-- Sépare dossier concours (DossierInscription) de l'inscription

-- Table DossierInscription (si absente)
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DossierInscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DossierInscription_inscriptionId_key" ON "DossierInscription"("inscriptionId");
CREATE INDEX IF NOT EXISTS "DossierInscription_statut_idx" ON "DossierInscription"("statut");
CREATE INDEX IF NOT EXISTS "DossierInscription_createdAt_idx" ON "DossierInscription"("createdAt");

DO $$ BEGIN
 ALTER TABLE "DossierInscription" ADD CONSTRAINT "DossierInscription_inscriptionId_fkey"
 FOREIGN KEY ("inscriptionId") REFERENCES "Inscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Migrer depuis Inscription si les anciennes colonnes existent encore
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Inscription' AND column_name = 'statut'
  ) THEN
    INSERT INTO "DossierInscription" (
      "id", "inscriptionId", "quittanceUrl", "piecesExtras", "statut",
      "commentaireRejet", "commentaireSousReserve",
      "decisionCommissionPar", "decisionCommissionDate",
      "decisionControleurPar", "commentaireControleur",
      "createdAt", "updatedAt"
    )
    SELECT
      gen_random_uuid()::text,
      i."id",
      i."quittanceUrl",
      i."piecesExtras",
      COALESCE(i."statut", 'EN_ATTENTE'::"StatutDossier"),
      i."commentaireRejet",
      i."commentaireSousReserve",
      i."decisionCommissionPar",
      i."decisionCommissionDate",
      i."decisionControleurPar",
      i."commentaireControleur",
      i."createdAt",
      NOW()
    FROM "Inscription" i
    WHERE NOT EXISTS (
      SELECT 1 FROM "DossierInscription" d WHERE d."inscriptionId" = i."id"
    );
  ELSE
    INSERT INTO "DossierInscription" ("id", "inscriptionId", "statut", "piecesExtras", "createdAt", "updatedAt")
    SELECT gen_random_uuid()::text, i."id", 'EN_ATTENTE', '{}'::jsonb, i."createdAt", NOW()
    FROM "Inscription" i
    WHERE NOT EXISTS (
      SELECT 1 FROM "DossierInscription" d WHERE d."inscriptionId" = i."id"
    );
  END IF;
END $$;

-- ActionHistory: dossierInscriptionId
ALTER TABLE "ActionHistory" ADD COLUMN IF NOT EXISTS "dossierInscriptionId" TEXT;

UPDATE "ActionHistory" ah
SET "dossierInscriptionId" = di."id"
FROM "DossierInscription" di
WHERE ah."dossierInscriptionId" IS NULL
  AND ah."dossierId" IS NOT NULL
  AND di."inscriptionId" = ah."dossierId";

UPDATE "ActionHistory" ah
SET "dossierInscriptionId" = (
  SELECT di."id" FROM "DossierInscription" di
  WHERE di."inscriptionId" = ah."dossierId" LIMIT 1
)
WHERE ah."dossierInscriptionId" IS NULL AND ah."dossierId" IS NOT NULL;

DROP INDEX IF EXISTS "ActionHistory_dossierId_idx";
DROP INDEX IF EXISTS "ActionHistory_dossierId_timestamp_idx";

CREATE INDEX IF NOT EXISTS "ActionHistory_dossierInscriptionId_idx" ON "ActionHistory"("dossierInscriptionId");
CREATE INDEX IF NOT EXISTS "ActionHistory_dossierInscriptionId_timestamp_idx" ON "ActionHistory"("dossierInscriptionId", "timestamp" DESC);

DO $$ BEGIN
 ALTER TABLE "ActionHistory" ADD CONSTRAINT "ActionHistory_dossierInscriptionId_fkey"
 FOREIGN KEY ("dossierInscriptionId") REFERENCES "DossierInscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Inscriptions sans DossierInscription (filet de sécurité)
INSERT INTO "DossierInscription" ("id", "inscriptionId", "statut", "piecesExtras", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, i."id", 'EN_ATTENTE', '{}'::jsonb, i."createdAt", NOW()
FROM "Inscription" i
WHERE NOT EXISTS (SELECT 1 FROM "DossierInscription" d WHERE d."inscriptionId" = i."id");

-- Indexes Inscription
CREATE INDEX IF NOT EXISTS "Inscription_candidatId_idx" ON "Inscription"("candidatId");
CREATE INDEX IF NOT EXISTS "Inscription_concoursId_idx" ON "Inscription"("concoursId");

-- numeroInscription sur Inscription
ALTER TABLE "Inscription" ADD COLUMN IF NOT EXISTS "numeroInscription" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Inscription_numeroInscription_key" ON "Inscription"("numeroInscription");

-- Rétro-remplir les numéros manquants
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn
  FROM "Inscription"
  WHERE "numeroInscription" IS NULL
)
UPDATE "Inscription" i
SET "numeroInscription" = 'INS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(numbered.rn::text, 6, '0')
FROM numbered
WHERE i.id = numbered.id;

-- Suppression colonnes migrées (uniquement si présentes)
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
