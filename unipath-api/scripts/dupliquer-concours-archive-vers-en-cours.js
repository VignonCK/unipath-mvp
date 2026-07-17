/**
 * Duplique les concours de l'année archive 2025-2026
 * vers l'année en cours 2026-2027 (sans les retirer de l'archive).
 *
 * Usage: node scripts/dupliquer-concours-archive-vers-en-cours.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { allocuerCodeConcours } = require('../src/utils/numero-table.helper');

const prisma = new PrismaClient();

const FROM = '2025-2026';
const TO = '2026-2027';

function addYears(date, years) {
  if (!date) return null;
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function adaptLibelle(libelle) {
  return String(libelle || '')
    .replace(/\b2025\b/g, '2026')
    .replace(/\b2025-2026\b/g, '2026-2027');
}

async function main() {
  const archive = await prisma.anneeAcademique.findUnique({ where: { libelle: FROM } });
  const courant = await prisma.anneeAcademique.findUnique({ where: { libelle: TO } });
  if (!archive || !courant) {
    throw new Error(`Années manquantes : ${FROM}=${!!archive}, ${TO}=${!!courant}`);
  }

  const sources = await prisma.concours.findMany({
    where: { anneeAcademiqueId: archive.id },
    include: {
      centresActifs: true,
    },
    orderBy: { libelle: 'asc' },
  });

  console.log(`${sources.length} concours en archive ${FROM}`);

  let created = 0;
  let skipped = 0;

  for (const src of sources) {
    const newLibelle = adaptLibelle(src.libelle);

    const already = await prisma.concours.findFirst({
      where: {
        anneeAcademiqueId: courant.id,
        libelle: newLibelle,
      },
      select: { id: true },
    });
    if (already) {
      console.log(`  skip (déjà présent) : ${newLibelle}`);
      skipped += 1;
      continue;
    }

    const code = await allocuerCodeConcours(prisma);

    const createdConcours = await prisma.concours.create({
      data: {
        libelle: newLibelle,
        code,
        etablissement: src.etablissement,
        description: src.description,
        fraisParticipation: src.fraisParticipation,
        seriesAcceptees: src.seriesAcceptees ?? [],
        matieres: src.matieres ?? [],
        piecesRequises: src.piecesRequises ?? undefined,
        centresComposition: src.centresComposition ?? undefined,
        criteresEligibilite: src.criteresEligibilite ?? undefined,
        dateDebut: addYears(src.dateDebut, 1),
        dateFin: addYears(src.dateFin, 1),
        dateComposition: addYears(src.dateComposition, 1),
        dateDebutDepot: addYears(src.dateDebutDepot, 1),
        dateFinDepot: addYears(src.dateFinDepot, 1),
        dateDebutComposition: addYears(src.dateDebutComposition, 1),
        dateFinComposition: addYears(src.dateFinComposition, 1),
        // Période d'étude non reportée : à relancer pour la nouvelle année
        dateDebutEtudeDossiers: null,
        dateFinEtudeDossiers: null,
        etudeDossiersClotureeAt: null,
        etudeDossiersAlerteAt: null,
        anneeAcademiqueId: courant.id,
      },
    });

    if (src.centresActifs?.length) {
      await prisma.concoursCentreComposition.createMany({
        data: src.centresActifs.map((link) => ({
          concoursId: createdConcours.id,
          centreId: link.centreId,
          anneeAcademique: TO,
          capacite: link.capacite,
          estActif: link.estActif,
        })),
        skipDuplicates: true,
      });
    }

    console.log(`  + ${code} ${newLibelle}`);
    created += 1;
  }

  const nArchive = await prisma.concours.count({ where: { anneeAcademiqueId: archive.id } });
  const nCourant = await prisma.concours.count({ where: { anneeAcademiqueId: courant.id } });
  console.log(`Créés : ${created} | ignorés : ${skipped}`);
  console.log(`${FROM} : ${nArchive} concours (inchangés)`);
  console.log(`${TO}   : ${nCourant} concours`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
