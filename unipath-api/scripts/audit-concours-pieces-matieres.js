require('dotenv').config();
const prisma = require('../src/prisma');

async function main() {
  const concours = await prisma.concours.findMany({
    select: { id: true, libelle: true, matieres: true, piecesRequises: true },
    orderBy: { libelle: 'asc' },
  });

  console.log(`Total concours: ${concours.length}\n`);

  const pieceCounts = {};
  for (const c of concours) {
    const pieces = c.piecesRequises?.pieces || [];
    console.log(`--- ${c.libelle}`);
    console.log(`  matieres (${(c.matieres || []).length}):`, (c.matieres || []).join(' | ') || '(vide)');
    console.log(`  pieces (${pieces.length}):`, pieces.map((p) => `${p.id}${p.obligatoire === false ? '?' : ''}`).join(', '));
    for (const p of pieces) {
      pieceCounts[p.id] = (pieceCounts[p.id] || 0) + 1;
    }
  }

  console.log('\n=== Fréquence des pièces ===');
  Object.entries(pieceCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([id, n]) => console.log(`  ${id}: ${n} concours`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
