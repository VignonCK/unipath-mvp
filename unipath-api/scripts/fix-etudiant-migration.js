/**
 * Vérifie l'état de la migration ETUDIANT et applique les changements manquants.
 * Usage: node scripts/fix-etudiant-migration.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const enumCheck = await prisma.$queryRaw`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'Role'
    ORDER BY e.enumsortorder;
  `;
  console.log('Valeurs enum Role:', enumCheck.map((r) => r.enumlabel));

  const hasEtudiant = enumCheck.some((r) => r.enumlabel === 'ETUDIANT');
  if (!hasEtudiant) {
    console.log('→ Ajout de ETUDIANT à l\'enum Role...');
    await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ETUDIANT'`);
  } else {
    console.log('✓ ETUDIANT déjà présent');
  }

  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Candidat" ALTER COLUMN "role" SET DEFAULT 'ETUDIANT'::"Role"`
  );
  console.log('✓ Défaut role ETUDIANT appliqué sur Candidat');

  const sample = await prisma.candidat.findFirst({
    select: { id: true, role: true, email: true },
  });
  console.log('Exemple candidat:', sample);
}

main()
  .catch((e) => {
    console.error('Erreur:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
