/**
 * Corrige les documents des candidatures démo (codes legacy → codes requirements).
 * Usage: node scripts/fix-demo-application-docs.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const DEMO_DOC_BASE = 'https://example.com/demo/unipath';

const LEGACY_CODES = ['ACTE_NAISSANCE', 'CARTE_IDENTITE', 'PHOTO', 'RELEVE_NOTES'];

const CORRECT_DOCS = [
  { code: 'acte_naissance', label: 'Acte de naissance', source: 'PROFILE_AUTO', field: 'acte' },
  { code: 'carte_identite', label: "Carte d'identité", source: 'PROFILE_AUTO', field: 'cni' },
  { code: 'photo_identite', label: "Photo d'identité", source: 'PROFILE_AUTO', field: 'photo', ext: 'jpg' },
  { code: 'releve_bac', label: 'Relevé de notes du Bac', source: 'PROFILE_AUTO', field: 'releve' },
  {
    code: 'lettre_demande_inscription',
    label: "Lettre de demande d'inscription",
    source: 'STUDENT_UPLOAD',
    field: 'lettre',
  },
];

async function main() {
  const apps = await prisma.application.findMany({
    where: { numeroApplication: { startsWith: 'DEMO-APP-' } },
    select: { id: true, numeroApplication: true },
    orderBy: { numeroApplication: 'asc' },
  });

  if (apps.length === 0) {
    console.log('Aucune application DEMO-APP- trouvée.');
    return;
  }

  console.log(`\nCorrection de ${apps.length} application(s) démo\n`);

  for (const app of apps) {
    const match = app.numeroApplication.match(/DEMO-APP-2026-(\d+)/);
    const index = match ? Number(match[1]) : 1;

    await prisma.applicationDocument.deleteMany({
      where: { applicationId: app.id, code: { in: LEGACY_CODES } },
    });

    for (const doc of CORRECT_DOCS) {
      const ext = doc.ext || 'pdf';
      const url = `${DEMO_DOC_BASE}/${doc.field}-${index}.${ext}`;
      await prisma.applicationDocument.upsert({
        where: { applicationId_code: { applicationId: app.id, code: doc.code } },
        update: {
          status: 'PROVIDED',
          documentUrl: url,
          source: doc.source,
          label: doc.label,
        },
        create: {
          applicationId: app.id,
          code: doc.code,
          label: doc.label,
          source: doc.source,
          documentUrl: url,
          status: 'PROVIDED',
        },
      });
    }

    console.log(`✅ ${app.numeroApplication} → 5 pièces (codes alignés)`);
  }

  console.log('\nTerminé. Recharge /parcours/dossiers pour voir 5/5.\n');
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
