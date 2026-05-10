# Migrations SQL - Refonte Dossier Candidat et Inscription

## Vue d'Ensemble

Ce document contient les scripts de migration SQL pour transformer la structure actuelle vers la nouvelle architecture "Upload Once, Use Everywhere".

## Migration "Up" - Vers la Nouvelle Structure

### Étape 1 : Créer la Table `DossierInscription`

```sql
-- Créer la table DossierInscription
CREATE TABLE "DossierInscription" (
    "id" TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "quittanceUrl" TEXT,
    "piecesExtras" JSONB,
    "statut" "StatutDossier" NOT NULL DEFAULT 'EN_ATTENTE',
    "commentaireRejet" TEXT,
    "commentaireSousReserve" TEXT,
    "decisionCommissionPar" TEXT,
    "decisionCommissionDate" TIMESTAMP(3),
    "decisionControleurPar" TEXT,
    "decisionControleurDate" TIMESTAMP(3),
    "commentaireControleur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierInscription_pkey" PRIMARY KEY ("id")
);

-- Créer l'index unique sur inscriptionId
CREATE UNIQUE INDEX "DossierInscription_inscriptionId_key" ON "DossierInscription"("inscriptionId");

-- Créer les index pour optimisation
CREATE INDEX "DossierInscription_inscriptionId_idx" ON "DossierInscription"("inscriptionId");
CREATE INDEX "DossierInscription_statut_idx" ON "DossierInscription"("statut");
CREATE INDEX "DossierInscription_createdAt_idx" ON "DossierInscription"("createdAt");

-- Ajouter la contrainte de clé étrangère
ALTER TABLE "DossierInscription" ADD CONSTRAINT "DossierInscription_inscriptionId_fkey" 
    FOREIGN KEY ("inscriptionId") REFERENCES "Inscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Étape 2 : Migrer les Données de `Inscription` vers `DossierInscription`

```sql
-- Migrer les données existantes
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
    "decisionControleurDate",
    "commentaireControleur",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid(),  -- Générer un nouvel UUID pour DossierInscription
    "id" as "inscriptionId",
    "quittanceUrl",
    "piecesExtras",
    "statut",
    "commentaireRejet",
    "commentaireSousReserve",
    "decisionCommissionPar",
    "decisionCommissionDate",
    "decisionControleurPar",
    "decisionControleurDate",
    "commentaireControleur",
    "createdAt",
    "updatedAt"
FROM "Inscription";

-- Vérifier que toutes les inscriptions ont un dossier
DO $$
DECLARE
    inscription_count INTEGER;
    dossier_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inscription_count FROM "Inscription";
    SELECT COUNT(*) INTO dossier_count FROM "DossierInscription";
    
    IF inscription_count != dossier_count THEN
        RAISE EXCEPTION 'Migration échouée: % inscriptions mais % dossiers créés', 
            inscription_count, dossier_count;
    END IF;
    
    RAISE NOTICE 'Migration réussie: % dossiers d''inscription créés', dossier_count;
END $$;
```

### Étape 3 : Créer la Table de Mapping Temporaire

```sql
-- Créer une table temporaire pour mapper les anciennes références
CREATE TEMP TABLE "InscriptionDossierMapping" AS
SELECT 
    i."id" as "inscriptionId",
    di."id" as "dossierInscriptionId"
FROM "Inscription" i
INNER JOIN "DossierInscription" di ON di."inscriptionId" = i."id";

-- Vérifier le mapping
SELECT COUNT(*) as "mappings_created" FROM "InscriptionDossierMapping";
```

### Étape 4 : Migrer `ActionHistory` (dossierId → dossierInscriptionId)

```sql
-- Ajouter la nouvelle colonne dossierInscriptionId
ALTER TABLE "ActionHistory" ADD COLUMN "dossierInscriptionId" TEXT;

-- Migrer les données en utilisant le mapping
-- Note: Les anciennes actions pointaient vers Dossier (dossier personnel)
-- Nous devons les mapper vers DossierInscription (dossier concours)
-- Stratégie: Associer les actions au premier DossierInscription du candidat

UPDATE "ActionHistory" ah
SET "dossierInscriptionId" = (
    SELECT di."id"
    FROM "DossierInscription" di
    INNER JOIN "Inscription" i ON i."id" = di."inscriptionId"
    INNER JOIN "Dossier" d ON d."candidatId" = i."candidatId"
    WHERE d."id" = ah."dossierId"
    ORDER BY di."createdAt" ASC
    LIMIT 1
)
WHERE "dossierId" IS NOT NULL;

-- Vérifier la migration
DO $$
DECLARE
    actions_with_old_ref INTEGER;
    actions_with_new_ref INTEGER;
    actions_without_ref INTEGER;
BEGIN
    SELECT COUNT(*) INTO actions_with_old_ref FROM "ActionHistory" WHERE "dossierId" IS NOT NULL;
    SELECT COUNT(*) INTO actions_with_new_ref FROM "ActionHistory" WHERE "dossierInscriptionId" IS NOT NULL;
    SELECT COUNT(*) INTO actions_without_ref FROM "ActionHistory" WHERE "dossierInscriptionId" IS NULL;
    
    RAISE NOTICE 'Actions avec ancienne référence: %', actions_with_old_ref;
    RAISE NOTICE 'Actions avec nouvelle référence: %', actions_with_new_ref;
    RAISE NOTICE 'Actions sans référence: %', actions_without_ref;
    
    IF actions_without_ref > 0 THEN
        RAISE WARNING '% actions n''ont pas pu être migrées', actions_without_ref;
    END IF;
END $$;

-- Supprimer l'ancienne colonne dossierId
ALTER TABLE "ActionHistory" DROP COLUMN "dossierId";

-- Rendre dossierInscriptionId obligatoire
ALTER TABLE "ActionHistory" ALTER COLUMN "dossierInscriptionId" SET NOT NULL;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE "ActionHistory" ADD CONSTRAINT "ActionHistory_dossierInscriptionId_fkey" 
    FOREIGN KEY ("dossierInscriptionId") REFERENCES "DossierInscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Créer les index
CREATE INDEX "ActionHistory_dossierInscriptionId_idx" ON "ActionHistory"("dossierInscriptionId");
CREATE INDEX "ActionHistory_dossierInscriptionId_timestamp_idx" ON "ActionHistory"("dossierInscriptionId", "timestamp" DESC);
```

### Étape 5 : Nettoyer la Table `Inscription`

```sql
-- Supprimer les colonnes migrées vers DossierInscription
ALTER TABLE "Inscription" DROP COLUMN "statut";
ALTER TABLE "Inscription" DROP COLUMN "quittanceUrl";
ALTER TABLE "Inscription" DROP COLUMN "piecesExtras";
ALTER TABLE "Inscription" DROP COLUMN "commentaireRejet";
ALTER TABLE "Inscription" DROP COLUMN "commentaireSousReserve";
ALTER TABLE "Inscription" DROP COLUMN "decisionCommissionPar";
ALTER TABLE "Inscription" DROP COLUMN "decisionCommissionDate";
ALTER TABLE "Inscription" DROP COLUMN "decisionControleurPar";
ALTER TABLE "Inscription" DROP COLUMN "decisionControleurDate";
ALTER TABLE "Inscription" DROP COLUMN "commentaireControleur";

-- Ajouter les index pour optimisation
CREATE INDEX "Inscription_candidatId_idx" ON "Inscription"("candidatId");
CREATE INDEX "Inscription_concoursId_idx" ON "Inscription"("concoursId");
```

### Étape 6 : Vérification de l'Intégrité

```sql
-- Vérifier que toutes les inscriptions ont un dossier
SELECT 
    COUNT(*) as "inscriptions_sans_dossier"
FROM "Inscription" i
LEFT JOIN "DossierInscription" di ON di."inscriptionId" = i."id"
WHERE di."id" IS NULL;

-- Vérifier que toutes les actions ont une référence valide
SELECT 
    COUNT(*) as "actions_avec_reference_invalide"
FROM "ActionHistory" ah
LEFT JOIN "DossierInscription" di ON di."id" = ah."dossierInscriptionId"
WHERE di."id" IS NULL;

-- Rapport de migration
SELECT 
    'Inscriptions' as "table",
    COUNT(*) as "count"
FROM "Inscription"
UNION ALL
SELECT 
    'DossierInscription' as "table",
    COUNT(*) as "count"
FROM "DossierInscription"
UNION ALL
SELECT 
    'ActionHistory' as "table",
    COUNT(*) as "count"
FROM "ActionHistory"
UNION ALL
SELECT 
    'Dossier (Personnel)' as "table",
    COUNT(*) as "count"
FROM "Dossier";
```

## Migration "Down" - Rollback vers l'Ancienne Structure

### Étape 1 : Recréer les Colonnes dans `Inscription`

```sql
-- Ajouter les colonnes supprimées
ALTER TABLE "Inscription" ADD COLUMN "statut" "StatutDossier" DEFAULT 'EN_ATTENTE';
ALTER TABLE "Inscription" ADD COLUMN "quittanceUrl" TEXT;
ALTER TABLE "Inscription" ADD COLUMN "piecesExtras" JSONB;
ALTER TABLE "Inscription" ADD COLUMN "commentaireRejet" TEXT;
ALTER TABLE "Inscription" ADD COLUMN "commentaireSousReserve" TEXT;
ALTER TABLE "Inscription" ADD COLUMN "decisionCommissionPar" TEXT;
ALTER TABLE "Inscription" ADD COLUMN "decisionCommissionDate" TIMESTAMP(3);
ALTER TABLE "Inscription" ADD COLUMN "decisionControleurPar" TEXT;
ALTER TABLE "Inscription" ADD COLUMN "decisionControleurDate" TIMESTAMP(3);
ALTER TABLE "Inscription" ADD COLUMN "commentaireControleur" TEXT;
```

### Étape 2 : Restaurer les Données de `DossierInscription` vers `Inscription`

```sql
-- Copier les données de DossierInscription vers Inscription
UPDATE "Inscription" i
SET 
    "statut" = di."statut",
    "quittanceUrl" = di."quittanceUrl",
    "piecesExtras" = di."piecesExtras",
    "commentaireRejet" = di."commentaireRejet",
    "commentaireSousReserve" = di."commentaireSousReserve",
    "decisionCommissionPar" = di."decisionCommissionPar",
    "decisionCommissionDate" = di."decisionCommissionDate",
    "decisionControleurPar" = di."decisionControleurPar",
    "decisionControleurDate" = di."decisionControleurDate",
    "commentaireControleur" = di."commentaireControleur"
FROM "DossierInscription" di
WHERE di."inscriptionId" = i."id";

-- Vérifier la restauration
DO $$
DECLARE
    inscriptions_with_statut INTEGER;
    total_inscriptions INTEGER;
BEGIN
    SELECT COUNT(*) INTO inscriptions_with_statut FROM "Inscription" WHERE "statut" IS NOT NULL;
    SELECT COUNT(*) INTO total_inscriptions FROM "Inscription";
    
    IF inscriptions_with_statut != total_inscriptions THEN
        RAISE WARNING 'Restauration incomplète: % inscriptions sur % ont un statut', 
            inscriptions_with_statut, total_inscriptions;
    ELSE
        RAISE NOTICE 'Restauration réussie: % inscriptions restaurées', total_inscriptions;
    END IF;
END $$;
```

### Étape 3 : Restaurer `ActionHistory` (dossierInscriptionId → dossierId)

```sql
-- Ajouter l'ancienne colonne dossierId
ALTER TABLE "ActionHistory" ADD COLUMN "dossierId" TEXT;

-- Restaurer les références vers Dossier (dossier personnel)
UPDATE "ActionHistory" ah
SET "dossierId" = (
    SELECT d."id"
    FROM "DossierInscription" di
    INNER JOIN "Inscription" i ON i."id" = di."inscriptionId"
    INNER JOIN "Dossier" d ON d."candidatId" = i."candidatId"
    WHERE di."id" = ah."dossierInscriptionId"
    LIMIT 1
)
WHERE "dossierInscriptionId" IS NOT NULL;

-- Supprimer la nouvelle colonne
ALTER TABLE "ActionHistory" DROP CONSTRAINT "ActionHistory_dossierInscriptionId_fkey";
ALTER TABLE "ActionHistory" DROP COLUMN "dossierInscriptionId";

-- Recréer les index
DROP INDEX IF EXISTS "ActionHistory_dossierInscriptionId_idx";
DROP INDEX IF EXISTS "ActionHistory_dossierInscriptionId_timestamp_idx";
CREATE INDEX "ActionHistory_dossierId_idx" ON "ActionHistory"("dossierId");
CREATE INDEX "ActionHistory_dossierId_timestamp_idx" ON "ActionHistory"("dossierId", "timestamp" DESC);
```

### Étape 4 : Supprimer la Table `DossierInscription`

```sql
-- Supprimer les contraintes et index
DROP INDEX IF EXISTS "DossierInscription_inscriptionId_key";
DROP INDEX IF EXISTS "DossierInscription_inscriptionId_idx";
DROP INDEX IF EXISTS "DossierInscription_statut_idx";
DROP INDEX IF EXISTS "DossierInscription_createdAt_idx";

-- Supprimer la table
DROP TABLE "DossierInscription";

-- Vérifier la suppression
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'DossierInscription') THEN
        RAISE EXCEPTION 'La table DossierInscription existe encore';
    ELSE
        RAISE NOTICE 'Rollback réussi: table DossierInscription supprimée';
    END IF;
END $$;
```

### Étape 5 : Vérification du Rollback

```sql
-- Vérifier que toutes les inscriptions ont leurs données
SELECT 
    COUNT(*) as "inscriptions_sans_statut"
FROM "Inscription"
WHERE "statut" IS NULL;

-- Vérifier que toutes les actions ont une référence valide
SELECT 
    COUNT(*) as "actions_sans_reference"
FROM "ActionHistory"
WHERE "dossierId" IS NULL;

-- Rapport de rollback
SELECT 
    'Inscriptions' as "table",
    COUNT(*) as "count",
    COUNT(CASE WHEN "statut" IS NOT NULL THEN 1 END) as "with_statut"
FROM "Inscription"
UNION ALL
SELECT 
    'ActionHistory' as "table",
    COUNT(*) as "count",
    COUNT(CASE WHEN "dossierId" IS NOT NULL THEN 1 END) as "with_dossierId"
FROM "ActionHistory"
UNION ALL
SELECT 
    'Dossier (Personnel)' as "table",
    COUNT(*) as "count",
    NULL as "with_dossierId"
FROM "Dossier";
```

## Script de Migration Prisma

### Fichier `prisma/migrations/YYYYMMDDHHMMSS_refonte_dossier_inscription/migration.sql`

```sql
-- CreateTable
CREATE TABLE "DossierInscription" (
    "id" TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "quittanceUrl" TEXT,
    "piecesExtras" JSONB,
    "statut" "StatutDossier" NOT NULL DEFAULT 'EN_ATTENTE',
    "commentaireRejet" TEXT,
    "commentaireSousReserve" TEXT,
    "decisionCommissionPar" TEXT,
    "decisionCommissionDate" TIMESTAMP(3),
    "decisionControleurPar" TEXT,
    "decisionControleurDate" TIMESTAMP(3),
    "commentaireControleur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierInscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DossierInscription_inscriptionId_key" ON "DossierInscription"("inscriptionId");
CREATE INDEX "DossierInscription_inscriptionId_idx" ON "DossierInscription"("inscriptionId");
CREATE INDEX "DossierInscription_statut_idx" ON "DossierInscription"("statut");
CREATE INDEX "DossierInscription_createdAt_idx" ON "DossierInscription"("createdAt");

-- AddForeignKey
ALTER TABLE "DossierInscription" ADD CONSTRAINT "DossierInscription_inscriptionId_fkey" 
    FOREIGN KEY ("inscriptionId") REFERENCES "Inscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData: Inscription -> DossierInscription
INSERT INTO "DossierInscription" (
    "id", "inscriptionId", "quittanceUrl", "piecesExtras", "statut",
    "commentaireRejet", "commentaireSousReserve", "decisionCommissionPar", "decisionCommissionDate",
    "decisionControleurPar", "decisionControleurDate", "commentaireControleur", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(), "id", "quittanceUrl", "piecesExtras", "statut",
    "commentaireRejet", "commentaireSousReserve", "decisionCommissionPar", "decisionCommissionDate",
    "decisionControleurPar", "decisionControleurDate", "commentaireControleur", "createdAt", "updatedAt"
FROM "Inscription";

-- AlterTable: ActionHistory
ALTER TABLE "ActionHistory" ADD COLUMN "dossierInscriptionId" TEXT;

UPDATE "ActionHistory" ah
SET "dossierInscriptionId" = (
    SELECT di."id"
    FROM "DossierInscription" di
    INNER JOIN "Inscription" i ON i."id" = di."inscriptionId"
    INNER JOIN "Dossier" d ON d."candidatId" = i."candidatId"
    WHERE d."id" = ah."dossierId"
    ORDER BY di."createdAt" ASC
    LIMIT 1
)
WHERE "dossierId" IS NOT NULL;

ALTER TABLE "ActionHistory" DROP COLUMN "dossierId";
ALTER TABLE "ActionHistory" ALTER COLUMN "dossierInscriptionId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ActionHistory" ADD CONSTRAINT "ActionHistory_dossierInscriptionId_fkey" 
    FOREIGN KEY ("dossierInscriptionId") REFERENCES "DossierInscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "ActionHistory_dossierInscriptionId_idx" ON "ActionHistory"("dossierInscriptionId");
CREATE INDEX "ActionHistory_dossierInscriptionId_timestamp_idx" ON "ActionHistory"("dossierInscriptionId", "timestamp" DESC);

-- AlterTable: Inscription (cleanup)
ALTER TABLE "Inscription" DROP COLUMN "statut";
ALTER TABLE "Inscription" DROP COLUMN "quittanceUrl";
ALTER TABLE "Inscription" DROP COLUMN "piecesExtras";
ALTER TABLE "Inscription" DROP COLUMN "commentaireRejet";
ALTER TABLE "Inscription" DROP COLUMN "commentaireSousReserve";
ALTER TABLE "Inscription" DROP COLUMN "decisionCommissionPar";
ALTER TABLE "Inscription" DROP COLUMN "decisionCommissionDate";
ALTER TABLE "Inscription" DROP COLUMN "decisionControleurPar";
ALTER TABLE "Inscription" DROP COLUMN "decisionControleurDate";
ALTER TABLE "Inscription" DROP COLUMN "commentaireControleur";

-- CreateIndex
CREATE INDEX "Inscription_candidatId_idx" ON "Inscription"("candidatId");
CREATE INDEX "Inscription_concoursId_idx" ON "Inscription"("concoursId");
```

## Script de Vérification Post-Migration

```javascript
// scripts/verify-migration.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Vérification de la migration...\n');
  
  // 1. Vérifier que toutes les inscriptions ont un dossier
  const inscriptionsCount = await prisma.inscription.count();
  const dossiersInscriptionCount = await prisma.dossierInscription.count();
  
  console.log(`✅ Inscriptions: ${inscriptionsCount}`);
  console.log(`✅ Dossiers d'inscription: ${dossiersInscriptionCount}`);
  
  if (inscriptionsCount !== dossiersInscriptionCount) {
    console.error(`❌ ERREUR: ${inscriptionsCount} inscriptions mais ${dossiersInscriptionCount} dossiers`);
    process.exit(1);
  }
  
  // 2. Vérifier que toutes les inscriptions ont une relation valide
  const inscriptionsSansDossier = await prisma.inscription.count({
    where: {
      dossierInscription: null
    }
  });
  
  if (inscriptionsSansDossier > 0) {
    console.error(`❌ ERREUR: ${inscriptionsSansDossier} inscriptions sans dossier`);
    process.exit(1);
  }
  
  console.log(`✅ Toutes les inscriptions ont un dossier d'inscription`);
  
  // 3. Vérifier ActionHistory
  const actionsCount = await prisma.actionHistory.count();
  const actionsSansReference = await prisma.actionHistory.count({
    where: {
      dossierInscriptionId: null
    }
  });
  
  console.log(`✅ Actions dans l'historique: ${actionsCount}`);
  
  if (actionsSansReference > 0) {
    console.warn(`⚠️  ATTENTION: ${actionsSansReference} actions sans référence`);
  } else {
    console.log(`✅ Toutes les actions ont une référence valide`);
  }
  
  // 4. Vérifier les dossiers personnels
  const dossiersPersonnelsCount = await prisma.dossier.count();
  const candidatsCount = await prisma.candidat.count();
  
  console.log(`✅ Dossiers personnels: ${dossiersPersonnelsCount}`);
  console.log(`✅ Candidats: ${candidatsCount}`);
  
  // 5. Rapport final
  console.log('\n📊 Rapport de migration:');
  console.log('━'.repeat(50));
  console.log(`Candidats:                    ${candidatsCount}`);
  console.log(`Dossiers personnels:          ${dossiersPersonnelsCount}`);
  console.log(`Inscriptions:                 ${inscriptionsCount}`);
  console.log(`Dossiers d'inscription:       ${dossiersInscriptionCount}`);
  console.log(`Actions dans l'historique:    ${actionsCount}`);
  console.log('━'.repeat(50));
  console.log('\n✅ Migration vérifiée avec succès!');
  
  await prisma.$disconnect();
}

verifyMigration().catch((error) => {
  console.error('❌ Erreur lors de la vérification:', error);
  process.exit(1);
});
```

## Commandes Prisma

```bash
# Générer la migration
npx prisma migrate dev --name refonte_dossier_inscription

# Appliquer la migration en production
npx prisma migrate deploy

# Vérifier la migration
node scripts/verify-migration.js

# Rollback (si nécessaire)
npx prisma migrate resolve --rolled-back YYYYMMDDHHMMSS_refonte_dossier_inscription
```

