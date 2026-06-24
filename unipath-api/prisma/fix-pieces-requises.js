const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PIECES_FIX = {
  // IDs avec tirets (ancienne convention)
  'acte-naissance': { obligatoire: true, sourceDossier: 'acteNaissance' },
  'carte-identite': { obligatoire: true, sourceDossier: 'carteIdentite' },
  photo: { obligatoire: true, sourceDossier: 'photo' },
  'releve-notes': { obligatoire: true, sourceDossier: 'releve' },
  // IDs avec underscores (nouvelle convention)
  acte_naissance: { obligatoire: true, sourceDossier: 'acteNaissance' },
  carte_identite: { obligatoire: true, sourceDossier: 'carteIdentite' },
  photo_identite: { obligatoire: true, sourceDossier: 'photo' },
  releve_bac: { obligatoire: true, sourceDossier: 'releve' },
};

async function main() {
  const concours = await prisma.concours.findMany();
  let updated = 0;

  for (const c of concours) {
    const pieces = c.piecesRequises?.pieces;
    if (!pieces) continue;

    let modified = false;
    const newPieces = pieces.map((piece) => {
      const fix = PIECES_FIX[piece.id];
      if (fix) {
        const needsFix = piece.obligatoire === false || !piece.sourceDossier;
        if (needsFix) {
          modified = true;
          return { ...piece, ...fix };
        }
      }
      return piece;
    });

    if (modified) {
      await prisma.concours.update({
        where: { id: c.id },
        data: {
          piecesRequises: {
            ...c.piecesRequises,
            pieces: newPieces,
          },
        },
      });
      updated++;
      console.log(`✅ Concours mis à jour : ${c.libelle}`);
    }
  }

  console.log(`\nTerminé : ${updated} concours mis à jour.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
