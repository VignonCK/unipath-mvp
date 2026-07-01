/**
 * Applique le pack MVP (5 pièces) et corrige les matières de composition sur les concours existants.
 *
 * Usage: node scripts/simplify-concours-pieces-mvp.js [--dry-run]
 */
require('dotenv').config();
const prisma = require('../src/prisma');
const {
  SOURCE_TAG_OFFICIEL,
  buildPiecesRequisesMvp,
  extractDomaineFromDescription,
  resolveMatieresComposees,
  matieresLookLikeFilieres,
} = require('../src/constants/concours-mvp.constants');

const dryRun = process.argv.includes('--dry-run');

function extractSigleFromLibelle(libelle = '') {
  const match = String(libelle).match(/Concours\s+(.+?)\s+2026/i);
  return match ? match[1].trim() : null;
}

async function main() {
  const concoursList = await prisma.concours.findMany({
    select: {
      id: true,
      libelle: true,
      description: true,
      matieres: true,
      piecesRequises: true,
    },
    orderBy: { libelle: 'asc' },
  });

  console.log(`Concours trouvés: ${concoursList.length}${dryRun ? ' (dry-run)' : ''}\n`);

  let piecesUpdated = 0;
  let matieresUpdated = 0;

  for (const concours of concoursList) {
    const pieces = concours.piecesRequises?.pieces || [];
    const isOfficial = concours.description?.startsWith(SOURCE_TAG_OFFICIEL);
    const needsPiecesFix = pieces.length !== 5
      || pieces.some((p) => ['diplome_bac', 'casier_judiciaire', 'certificat_medical'].includes(p.id))
      || pieces.some((p) => String(p.id).includes('-'));

    const domaine = extractDomaineFromDescription(concours.description);
    const sigle = extractSigleFromLibelle(concours.libelle);
    const needsMatieresFix = isOfficial
      || matieresLookLikeFilieres(concours.matieres)
      || (concours.matieres || []).length === 0;

    const needsPhotoLabelFix = pieces.some(
      (p) => String(p.id || '').includes('photo') && /exemplaire/i.test(String(p.nom || '')),
    );

    if (!needsPiecesFix && !needsMatieresFix && !needsPhotoLabelFix) {
      console.log(`[SKIP] ${concours.libelle}`);
      continue;
    }

    const data = {};
    const changes = [];

    if (needsPiecesFix) {
      data.piecesRequises = buildPiecesRequisesMvp();
      piecesUpdated++;
      changes.push(`pièces ${pieces.length} → 5`);
    } else if (needsPhotoLabelFix) {
      const normalizedPieces = pieces.map((piece) => {
        if (!String(piece?.id || '').includes('photo')) return piece;
        return { ...piece, nom: "Photo d'identité" };
      });
      data.piecesRequises = { ...concours.piecesRequises, pieces: normalizedPieces };
      changes.push('libellé photo corrigé');
    }

    if (needsMatieresFix) {
      const nextMatieres = resolveMatieresComposees(domaine, sigle);
      data.matieres = nextMatieres;
      matieresUpdated++;
      changes.push(`matières → ${nextMatieres.join(', ')}`);
    }

    console.log(`[UPDATE] ${concours.libelle}: ${changes.join(' | ')}`);

    if (!dryRun) {
      await prisma.concours.update({
        where: { id: concours.id },
        data,
      });
    }
  }

  console.log(`\nRésumé: ${piecesUpdated} concours (pièces), ${matieresUpdated} concours (matières)`);
  if (dryRun) console.log('Aucune écriture — relancez sans --dry-run pour appliquer.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
