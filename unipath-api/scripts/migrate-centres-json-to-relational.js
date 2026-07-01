require('dotenv').config();
const prisma = require('../src/prisma');

function extractAnneeAcademique(libelle) {
  const match = String(libelle || '').match(/20\d{2}/);
  if (match) {
    const y = parseInt(match[0], 10);
    return `${y - 1}-${y}`;
  }
  return '2025-2026';
}

async function findOrCreateCentre({ nom, ville, adresse }) {
  const nomNorm = nom.trim();
  const villeNorm = ville.trim();

  const existing = await prisma.centreComposition.findFirst({
    where: {
      nom: { equals: nomNorm, mode: 'insensitive' },
      ville: { equals: villeNorm, mode: 'insensitive' },
    },
  });

  if (existing) {
    console.log(`[TROUVÉ] CentreComposition ${existing.nom} — ${existing.ville} (${existing.id})`);
    return existing;
  }

  const created = await prisma.centreComposition.create({
    data: {
      nom: nomNorm,
      ville: villeNorm,
      adresse: adresse?.trim() || null,
    },
  });
  console.log(`[CRÉÉ] CentreComposition ${created.nom} — ${created.ville} (${created.id})`);
  return created;
}

async function findOrCreateConcoursCentre({ concoursId, centreId, anneeAcademique }) {
  const existing = await prisma.concourscentreComposition.findUnique({
    where: {
      concoursId_centreId_anneeAcademique: {
        concoursId,
        centreId,
        anneeAcademique,
      },
    },
  });

  if (existing) {
    console.log(`[TROUVÉ] ConcourscentreComposition concours=${concoursId} centre=${centreId}`);
    return existing;
  }

  const created = await prisma.concourscentreComposition.create({
    data: { concoursId, centreId, anneeAcademique },
  });
  console.log(`[CRÉÉ] ConcourscentreComposition ${created.id} (concours=${concoursId})`);
  return created;
}

async function migrateConcoursCatalogues() {
  const concoursList = await prisma.concours.findMany({
    where: { centresComposition: { not: null } },
    select: { id: true, libelle: true, centresComposition: true },
  });

  console.log(`\n=== Migration catalogues JSON (${concoursList.length} concours) ===`);

  for (const concours of concoursList) {
    const raw = concours.centresComposition;
    const centres = Array.isArray(raw?.centres) ? raw.centres : [];
    if (!centres.length) {
      console.log(`[IGNORÉ] Concours ${concours.libelle} — JSON vide`);
      continue;
    }

    const anneeAcademique = extractAnneeAcademique(concours.libelle);
    console.log(`\n→ Concours: ${concours.libelle} (${anneeAcademique})`);

    for (const bloc of centres) {
      const ville = String(bloc?.ville || '').trim();
      const lieux = Array.isArray(bloc?.lieux) ? bloc.lieux : [];
      for (const lieu of lieux) {
        const nom = String(lieu?.nom || '').trim();
        if (!nom || !ville) {
          console.log('[IGNORÉ] Lieu sans nom ou ville');
          continue;
        }

        const centre = await findOrCreateCentre({
          nom,
          ville,
          adresse: lieu?.adresse,
        });

        await findOrCreateConcoursCentre({
          concoursId: concours.id,
          centreId: centre.id,
          anneeAcademique,
        });
      }
    }
  }
}

async function migrateDossierChoix() {
  const dossiers = await prisma.dossierInscription.findMany({
    where: { centreCompositionChoisi: { not: null } },
    include: {
      inscription: { select: { concoursId: true } },
    },
  });

  console.log(`\n=== Migration choix candidats (${dossiers.length} dossiers) ===`);

  for (const dossier of dossiers) {
    const choix = dossier.centreCompositionChoisi;
    const nom = String(choix?.nom || '').trim();
    const ville = String(choix?.ville || '').trim();

    if (!nom || !ville) {
      console.log(`[IGNORÉ] Dossier ${dossier.id} — JSON choix incomplet`);
      continue;
    }

    if (dossier.concoursCentreId) {
      console.log(`[IGNORÉ] Dossier ${dossier.id} — concoursCentreId déjà défini`);
      continue;
    }

    const concoursId = dossier.inscription?.concoursId;
    if (!concoursId) {
      console.log(`[IGNORÉ] Dossier ${dossier.id} — inscription introuvable`);
      continue;
    }

    const centre = await prisma.centreComposition.findFirst({
      where: {
        nom: { equals: nom, mode: 'insensitive' },
        ville: { equals: ville, mode: 'insensitive' },
      },
    });

    if (!centre) {
      console.log(`[IGNORÉ] Dossier ${dossier.id} — centre ${nom} / ${ville} introuvable en référentiel`);
      continue;
    }

    const link = await prisma.concourscentreComposition.findFirst({
      where: { concoursId, centreId: centre.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!link) {
      console.log(`[IGNORÉ] Dossier ${dossier.id} — pas de lien concours-centre pour ${nom} / ${ville}`);
      continue;
    }

    await prisma.dossierInscription.update({
      where: { id: dossier.id },
      data: { concoursCentreId: link.id },
    });
    console.log(`[MIS À JOUR] Dossier ${dossier.id} → concoursCentreId=${link.id}`);
  }
}

async function main() {
  await migrateConcoursCatalogues();
  await migrateDossierChoix();
  console.log('\n✅ Migration terminée');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
