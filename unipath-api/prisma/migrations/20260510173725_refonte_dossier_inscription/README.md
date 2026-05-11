# Migration: Refonte Dossier Candidat et Inscription

## Overview

This migration implements the **"Upload Once, Use Everywhere"** architectural principle for the UniPath application. It separates the personal folder (Dossier) containing 4 base documents from the competition-specific folder (DossierInscription) containing the receipt and extra documents.

**Migration Name**: `20260510173725_refonte_dossier_inscription`

**Created**: May 10, 2026 at 17:37:25

## What This Migration Does

### 1. Creates DossierInscription Table
- New table to store competition-specific documents and status
- 1-1 relationship with Inscription table
- Contains: quittanceUrl, piecesExtras (JSON), statut, decision fields, comments
- Configured with CASCADE delete for data integrity

### 2. Migrates Data from Inscription
- Automatically copies existing data from Inscription to DossierInscription
- Preserves all status, documents, and decision information
- Uses UUID generation for new DossierInscription IDs
- Maintains historical timestamps (createdAt from Inscription)

### 3. Updates ActionHistory References
- Changes reference from `dossierId` to `dossierInscriptionId`
- Maps old references to new DossierInscription records
- Adds CASCADE delete constraint for proper cleanup

### 4. Cleans Up Inscription Table
- Removes migrated fields (statut, quittanceUrl, piecesExtras, decision fields)
- Keeps only core fields (id, numeroInscription, candidatId, concoursId, note, createdAt)
- Maintains existing indexes and constraints

## Database Schema Changes

### New Table: DossierInscription

```sql
CREATE TABLE "DossierInscription" (
    "id" TEXT PRIMARY KEY,
    "inscriptionId" TEXT UNIQUE NOT NULL,
    "quittanceUrl" TEXT,
    "piecesExtras" JSONB,
    "statut" "StatutDossier" DEFAULT 'EN_ATTENTE',
    "commentaireRejet" TEXT,
    "commentaireSousReserve" TEXT,
    "decisionCommissionPar" TEXT,
    "decisionCommissionDate" TIMESTAMP(3),
    "decisionControleurPar" TEXT,
    "decisionControleurDate" TIMESTAMP(3),
    "commentaireControleur" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
```

### Modified Table: ActionHistory

**Before**:
- `dossierId` TEXT → References Dossier (incorrect)

**After**:
- `dossierInscriptionId` TEXT → References DossierInscription (correct)

### Modified Table: Inscription

**Removed Fields**:
- statut
- quittanceUrl
- piecesExtras
- commentaireRejet
- commentaireSousReserve
- decisionCommissionPar
- decisionCommissionDate
- decisionControleurPar
- decisionControleurDate
- commentaireControleur

**Remaining Fields**:
- id
- numeroInscription
- candidatId
- concoursId
- note
- createdAt

## Indexes Created

### DossierInscription
- `DossierInscription_inscriptionId_key` (UNIQUE)
- `DossierInscription_inscriptionId_idx`
- `DossierInscription_statut_idx`
- `DossierInscription_createdAt_idx`

### ActionHistory
- `ActionHistory_dossierInscriptionId_idx`
- `ActionHistory_dossierInscriptionId_timestamp_idx` (composite, DESC)

### Inscription
- `Inscription_candidatId_idx`
- `Inscription_concoursId_idx`

## Foreign Key Constraints

### DossierInscription → Inscription
- **Constraint**: `DossierInscription_inscriptionId_fkey`
- **Action**: ON DELETE CASCADE ON UPDATE CASCADE
- **Purpose**: Ensures DossierInscription is deleted when Inscription is deleted

### ActionHistory → DossierInscription
- **Constraint**: `ActionHistory_dossierInscriptionId_fkey`
- **Action**: ON DELETE CASCADE ON UPDATE CASCADE
- **Purpose**: Ensures ActionHistory is deleted when DossierInscription is deleted

## Migration Safety Features

### Idempotency
The migration is designed to be idempotent (can be run multiple times safely):
- Uses `CREATE TABLE IF NOT EXISTS`
- Uses `CREATE INDEX IF NOT EXISTS`
- Uses `DROP COLUMN IF EXISTS`
- Checks for existing constraints before adding them
- Checks for existing columns before migrating data

### Data Preservation
- Existing data is migrated before dropping columns
- Uses `COALESCE` for nullable fields
- Preserves historical timestamps
- Prevents duplicate insertions with `WHERE NOT IN` clause

### Error Handling
- Uses PostgreSQL DO blocks for conditional logic
- Checks for column existence before operations
- Checks for constraint existence before adding

## Requirements Satisfied

This migration satisfies the following requirements from the spec:

- ✅ **Requirement 2.1**: Create DossierInscription table with all required fields
- ✅ **Requirement 2.2**: 1-1 relation with Inscription via inscriptionId
- ✅ **Requirement 2.3**: Include decision fields (commission, controleur)
- ✅ **Requirement 2.4**: Use StatutDossier enum for statut field
- ✅ **Requirement 2.5**: Include timestamps (createdAt, updatedAt)
- ✅ **Requirement 3.1-3.6**: Migrate fields from Inscription to DossierInscription
- ✅ **Requirement 4.1**: Rename dossierId to dossierInscriptionId in ActionHistory
- ✅ **Requirement 4.2**: Reference DossierInscription.id instead of Dossier.id
- ✅ **Requirement 4.3**: Create indexes on dossierInscriptionId

## How to Apply This Migration

### Option 1: Using Prisma Migrate (Recommended)

```bash
cd unipath-api
npx prisma migrate deploy
```

This will apply all pending migrations including this one.

### Option 2: Manual Application

```bash
cd unipath-api
psql $DATABASE_URL -f prisma/migrations/20260510173725_refonte_dossier_inscription/migration.sql
```

### Option 3: Using Prisma Studio

```bash
cd unipath-api
npx prisma migrate resolve --applied 20260510173725_refonte_dossier_inscription
```

## Pre-Migration Checklist

Before applying this migration:

- [ ] **Create database backup**
  ```bash
  pg_dump $DATABASE_URL > backup_before_refonte_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Test on staging environment first**
  - Apply migration to staging
  - Run validation queries (see VERIFICATION.md)
  - Test application functionality

- [ ] **Review migration SQL**
  - Read migration.sql file
  - Understand each step
  - Verify it matches your expectations

- [ ] **Prepare rollback script** (if needed)
  - See ROLLBACK.md for rollback instructions

- [ ] **Notify team members**
  - Schedule maintenance window if needed
  - Inform stakeholders of changes

## Post-Migration Validation

After applying the migration, run these validation queries:

### 1. Verify DossierInscription count matches Inscription count

```sql
SELECT 
  (SELECT COUNT(*) FROM "Inscription") as inscription_count,
  (SELECT COUNT(*) FROM "DossierInscription") as dossier_inscription_count;
```

**Expected**: Both counts should be equal.

### 2. Verify all ActionHistory records have valid dossierInscriptionId

```sql
SELECT COUNT(*) 
FROM "ActionHistory" ah
LEFT JOIN "DossierInscription" di ON ah."dossierInscriptionId" = di."id"
WHERE di."id" IS NULL;
```

**Expected**: 0 (no orphaned records)

### 3. Verify foreign key constraints exist

```sql
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('DossierInscription', 'ActionHistory')
  AND tc.constraint_name LIKE '%dossierInscription%';
```

**Expected**: 2 constraints with CASCADE delete rule

### 4. Verify Inscription no longer has migrated columns

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Inscription' 
  AND column_name IN (
    'statut', 'quittanceUrl', 'piecesExtras', 
    'commentaireRejet', 'commentaireSousReserve',
    'decisionCommissionPar', 'decisionCommissionDate',
    'decisionControleurPar', 'decisionControleurDate',
    'commentaireControleur'
  );
```

**Expected**: 0 rows (all columns removed)

### 5. Verify indexes exist

```sql
SELECT 
  tablename, 
  indexname
FROM pg_indexes
WHERE tablename IN ('DossierInscription', 'ActionHistory', 'Inscription')
  AND indexname LIKE '%dossierInscription%'
ORDER BY tablename, indexname;
```

**Expected**: At least 4 indexes related to dossierInscription

## Troubleshooting

### Issue: Migration fails with "column already exists"

**Cause**: Migration was partially applied before.

**Solution**: The migration is idempotent. Simply run it again. It will skip existing objects.

### Issue: Migration fails with "foreign key violation"

**Cause**: There are ActionHistory records with invalid dossierId references.

**Solution**: 
1. Identify orphaned records:
   ```sql
   SELECT * FROM "ActionHistory" 
   WHERE "dossierId" NOT IN (SELECT "id" FROM "Inscription");
   ```
2. Either delete them or update them to valid references before re-running migration.

### Issue: Data migration creates duplicate DossierInscription records

**Cause**: Migration was run multiple times.

**Solution**: The migration includes `WHERE "id" NOT IN (SELECT "inscriptionId" FROM "DossierInscription")` to prevent duplicates. If duplicates exist, manually clean them up:
```sql
DELETE FROM "DossierInscription" 
WHERE "id" NOT IN (
  SELECT MIN("id") 
  FROM "DossierInscription" 
  GROUP BY "inscriptionId"
);
```

## Impact on Application Code

After this migration, application code must be updated to:

1. **Query DossierInscription instead of Inscription for status and documents**
   ```javascript
   // Before
   const inscription = await prisma.inscription.findUnique({
     where: { id },
     select: { statut: true, quittanceUrl: true }
   });
   
   // After
   const inscription = await prisma.inscription.findUnique({
     where: { id },
     include: { dossierInscription: true }
   });
   const statut = inscription.dossierInscription.statut;
   const quittanceUrl = inscription.dossierInscription.quittanceUrl;
   ```

2. **Use dossierInscriptionId in ActionHistory**
   ```javascript
   // Before
   await prisma.actionHistory.create({
     data: {
       dossierId: inscriptionId,
       typeAction: 'DOSSIER_VALIDE'
     }
   });
   
   // After
   await prisma.actionHistory.create({
     data: {
       dossierInscriptionId: dossierInscription.id,
       typeAction: 'DOSSIER_VALIDE'
     }
   });
   ```

3. **Access base documents via implicit reference**
   ```javascript
   const inscription = await prisma.inscription.findUnique({
     where: { id },
     include: {
       candidat: {
         include: { dossier: true }  // Base documents
       },
       dossierInscription: true  // Competition-specific documents
     }
   });
   
   // Base documents (uploaded once, reused everywhere)
   const piecesBase = inscription.candidat.dossier;
   
   // Competition-specific documents
   const piecesSpecifiques = inscription.dossierInscription;
   ```

## Related Files

- **Migration SQL**: `migration.sql` - The actual SQL migration script
- **Verification Report**: `VERIFICATION.md` - Detailed verification checklist
- **Prisma Schema**: `../../schema.prisma` - Updated schema definition

## Support

If you encounter issues with this migration:

1. Check the troubleshooting section above
2. Review the VERIFICATION.md file for validation queries
3. Check application logs for errors
4. Contact the development team

## References

- **Spec Document**: `.kiro/specs/refonte-dossier-candidat-inscription/requirements.md`
- **Design Document**: `.kiro/specs/refonte-dossier-candidat-inscription/design.md`
- **Tasks Document**: `.kiro/specs/refonte-dossier-candidat-inscription/tasks.md`
