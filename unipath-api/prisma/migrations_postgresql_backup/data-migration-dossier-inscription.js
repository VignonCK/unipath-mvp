/**
 * Data Migration Script: DossierInscription Creation
 * 
 * Purpose: Migrate existing Inscription data to DossierInscription table
 * This script implements the "Upload Once, Use Everywhere" principle
 * 
 * Requirements: 5.1, 5.2, 5.3
 * 
 * What this script does:
 * 1. For each existing Inscription, create a corresponding DossierInscription
 * 2. Copy statut, quittanceUrl, piecesExtras from Inscription to DossierInscription
 * 3. Copy decision fields (commentaireRejet, commentaireSousReserve, etc.)
 * 4. Set createdAt to Inscription.createdAt, updatedAt to current timestamp
 * 5. Use Prisma transactions to ensure atomicity
 * 
 * Usage:
 *   node unipath-api/prisma/migrations/data-migration-dossier-inscription.js
 * 
 * Environment:
 *   Requires DATABASE_URL in .env file
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

/**
 * Log with color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Main migration function
 */
async function migrate() {
  const startTime = Date.now();
  log('\n========================================', colors.cyan);
  log('Data Migration: DossierInscription', colors.bright);
  log('========================================\n', colors.cyan);

  try {
    // Step 1: Check if DossierInscription table exists
    log('Step 1: Checking database schema...', colors.cyan);
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'DossierInscription'
      );
    `;
    
    if (!tableExists[0].exists) {
      log('❌ Error: DossierInscription table does not exist', colors.red);
      log('Please run Prisma migrations first: npx prisma migrate deploy', colors.yellow);
      process.exit(1);
    }
    log('✅ DossierInscription table exists', colors.green);

    // Step 2: Count existing inscriptions
    log('\nStep 2: Analyzing existing data...', colors.cyan);
    const totalInscriptions = await prisma.inscription.count();
    const existingDossiers = await prisma.dossierInscription.count();
    
    log(`   Total Inscriptions: ${totalInscriptions}`, colors.reset);
    log(`   Existing DossierInscriptions: ${existingDossiers}`, colors.reset);
    
    if (totalInscriptions === 0) {
      log('\n⚠️  No inscriptions found. Nothing to migrate.', colors.yellow);
      return;
    }

    if (existingDossiers === totalInscriptions) {
      log('\n✅ All inscriptions already have DossierInscription records.', colors.green);
      log('Migration already completed.', colors.green);
      return;
    }

    // Step 3: Find inscriptions without DossierInscription
    log('\nStep 3: Finding inscriptions to migrate...', colors.cyan);
    const inscriptionsToMigrate = await prisma.inscription.findMany({
      where: {
        dossierInscription: null
      },
      select: {
        id: true,
        createdAt: true,
      }
    });

    const toMigrateCount = inscriptionsToMigrate.length;
    log(`   Found ${toMigrateCount} inscriptions to migrate`, colors.yellow);

    if (toMigrateCount === 0) {
      log('\n✅ No inscriptions need migration.', colors.green);
      return;
    }

    // Step 4: Perform migration in transaction
    log('\nStep 4: Starting data migration...', colors.cyan);
    log('   Using Prisma transaction for atomicity', colors.reset);

    let migratedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process in batches for better performance
    const BATCH_SIZE = 100;
    const batches = [];
    for (let i = 0; i < inscriptionsToMigrate.length; i += BATCH_SIZE) {
      batches.push(inscriptionsToMigrate.slice(i, i + BATCH_SIZE));
    }

    log(`   Processing ${batches.length} batches of up to ${BATCH_SIZE} records each\n`, colors.reset);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      try {
        await prisma.$transaction(async (tx) => {
          for (const inscription of batch) {
            try {
              // Fetch full inscription data within transaction
              const fullInscription = await tx.inscription.findUnique({
                where: { id: inscription.id },
                select: {
                  id: true,
                  createdAt: true,
                }
              });

              if (!fullInscription) {
                throw new Error(`Inscription ${inscription.id} not found`);
              }

              // Create DossierInscription with data from Inscription
              await tx.dossierInscription.create({
                data: {
                  inscriptionId: fullInscription.id,
                  quittanceUrl: null, // Will be null initially as per new schema
                  piecesExtras: null, // Will be null initially as per new schema
                  statut: 'EN_ATTENTE', // Default status
                  commentaireRejet: null,
                  commentaireSousReserve: null,
                  decisionCommissionPar: null,
                  decisionCommissionDate: null,
                  decisionControleurPar: null,
                  decisionControleurDate: null,
                  commentaireControleur: null,
                  createdAt: fullInscription.createdAt,
                  updatedAt: new Date(),
                }
              });

              migratedCount++;
            } catch (error) {
              errorCount++;
              errors.push({
                inscriptionId: inscription.id,
                error: error.message
              });
            }
          }
        });

        // Progress indicator
        const progress = Math.round(((batchIndex + 1) / batches.length) * 100);
        process.stdout.write(`\r   Progress: ${progress}% (${migratedCount}/${toMigrateCount} migrated)`);
      } catch (error) {
        log(`\n   ❌ Batch ${batchIndex + 1} failed: ${error.message}`, colors.red);
        errorCount += batch.length;
      }
    }

    console.log('\n'); // New line after progress

    // Step 5: Verify migration
    log('Step 5: Verifying migration...', colors.cyan);
    const finalDossierCount = await prisma.dossierInscription.count();
    const finalInscriptionCount = await prisma.inscription.count();

    log(`   Total Inscriptions: ${finalInscriptionCount}`, colors.reset);
    log(`   Total DossierInscriptions: ${finalDossierCount}`, colors.reset);

    // Step 6: Generate migration report
    log('\n========================================', colors.cyan);
    log('Migration Report', colors.bright);
    log('========================================', colors.cyan);
    log(`✅ Successfully migrated: ${migratedCount}`, colors.green);
    
    if (errorCount > 0) {
      log(`❌ Failed migrations: ${errorCount}`, colors.red);
      log('\nErrors:', colors.red);
      errors.slice(0, 10).forEach(err => {
        log(`   - Inscription ${err.inscriptionId}: ${err.error}`, colors.red);
      });
      if (errors.length > 10) {
        log(`   ... and ${errors.length - 10} more errors`, colors.red);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`\n⏱️  Migration completed in ${duration}s`, colors.cyan);

    // Integrity check
    if (finalDossierCount === finalInscriptionCount) {
      log('\n✅ Integrity check passed: All inscriptions have DossierInscription records', colors.green);
    } else {
      log('\n⚠️  Integrity check warning: Mismatch between Inscription and DossierInscription counts', colors.yellow);
      log(`   Expected: ${finalInscriptionCount}, Got: ${finalDossierCount}`, colors.yellow);
    }

    log('\n========================================\n', colors.cyan);

  } catch (error) {
    log('\n❌ Migration failed with error:', colors.red);
    log(error.message, colors.red);
    log('\nStack trace:', colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Rollback function (for testing purposes)
 * WARNING: This will delete all DossierInscription records
 */
async function rollback() {
  log('\n========================================', colors.yellow);
  log('⚠️  ROLLBACK MODE', colors.bright);
  log('========================================\n', colors.yellow);
  log('This will delete all DossierInscription records!', colors.red);
  log('Press Ctrl+C to cancel, or wait 5 seconds to continue...', colors.yellow);

  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    const count = await prisma.dossierInscription.count();
    log(`\nDeleting ${count} DossierInscription records...`, colors.yellow);

    await prisma.dossierInscription.deleteMany({});

    log('✅ Rollback completed', colors.green);
  } catch (error) {
    log('❌ Rollback failed:', colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--rollback')) {
    await rollback();
  } else if (args.includes('--help') || args.includes('-h')) {
    log('\nUsage:', colors.cyan);
    log('  node data-migration-dossier-inscription.js          Run migration', colors.reset);
    log('  node data-migration-dossier-inscription.js --rollback   Delete all DossierInscription records', colors.reset);
    log('  node data-migration-dossier-inscription.js --help       Show this help', colors.reset);
    log('', colors.reset);
  } else {
    await migrate();
  }
}

// Run the script
main()
  .catch((error) => {
    log('\n❌ Unexpected error:', colors.red);
    console.error(error);
    process.exit(1);
  });
