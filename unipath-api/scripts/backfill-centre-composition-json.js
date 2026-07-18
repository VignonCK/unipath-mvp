/**
 * Backfill centreCompositionChoisi JSON from the relational centre
 * for dossiers that already have concoursCentreId but a null/empty JSON snapshot.
 * Needed so fiche PDF shows the chosen centre without re-saving.
 *
 * Usage: node scripts/backfill-centre-composition-json.js [--apply]
 */
require('dotenv').config();
const prisma = require('../src/prisma');

const APPLY = process.argv.includes('--apply');

async function main() {
  const dossiers = await prisma.dossierInscription.findMany({
    where: { concoursCentreId: { not: null } },
    include: {
      centreChoisi: { include: { centre: true } },
    },
  });

  let toUpdate = 0;
  let updated = 0;

  for (const d of dossiers) {
    const centre = d.centreChoisi?.centre;
    if (!centre?.nom) continue;
    if (d.centreCompositionChoisi?.nom) continue;

    toUpdate += 1;
    const snapshot = {
      nom: centre.nom,
      ville: centre.ville,
      adresse: centre.adresse || '',
      choisiLe: new Date().toISOString(),
    };

    console.log(`${APPLY ? 'UPDATE' : 'DRY'} ${d.id} → ${snapshot.nom} — ${snapshot.ville}`);

    if (APPLY) {
      await prisma.dossierInscription.update({
        where: { id: d.id },
        data: { centreCompositionChoisi: snapshot },
      });
      updated += 1;
    }
  }

  console.log(`\nÀ corriger: ${toUpdate}${APPLY ? `, mis à jour: ${updated}` : ' (dry-run, passe --apply pour écrire)'}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
