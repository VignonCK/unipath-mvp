/**
 * Associe les centres de composition MESRS aux concours qui n'en ont pas encore.
 * Source : conditions_generales.centres_composition_principaux (concours-officiels-2026.json)
 *
 * Usage : node scripts/seed-centres-composition-concours.js
 *         node scripts/seed-centres-composition-concours.js --dry-run
 */
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const prisma = require('../src/prisma');

const DRY_RUN = process.argv.includes('--dry-run');

/** Pack national commun à tous les concours publics MESRS. */
const CENTRES_NATIONAUX = [
  { nom: 'CEG Gbégamey', ville: 'Cotonou', adresse: 'Cotonou, Bénin' },
  { nom: 'Collège Notre Dame des Apôtres', ville: 'Cotonou', adresse: 'Cotonou, Bénin' },
  { nom: 'CEG Ste Rita', ville: 'Cotonou', adresse: 'Cotonou, Bénin' },
  { nom: 'CEG les Pylônes', ville: 'Cotonou', adresse: 'Cotonou, Bénin' },
  { nom: 'IFSIO', ville: 'Parakou', adresse: 'Parakou, Bénin' },
  { nom: 'ENSTP/UNSTIM', ville: 'Abomey', adresse: 'Abomey, Bénin' },
];

/** Centres complémentaires selon la ville d'accueil du concours. */
const CENTRES_PAR_VILLE = {
  'Porto-Novo': [
    { nom: 'CEG Application', ville: 'Porto-Novo', adresse: 'Porto-Novo, Bénin' },
  ],
  'Abomey-Calavi': [
    { nom: 'CEG Zoca II', ville: 'Abomey-Calavi', adresse: 'Abomey-Calavi, Bénin' },
  ],
  Abomey: [
    { nom: 'CEG Zoca II', ville: 'Abomey-Calavi', adresse: 'Abomey-Calavi, Bénin' },
  ],
  Lokossa: [
    { nom: 'CEG Zoca II', ville: 'Abomey-Calavi', adresse: 'Abomey-Calavi, Bénin' },
  ],
  Natitingou: [
    { nom: 'IFSIO', ville: 'Parakou', adresse: 'Parakou, Bénin' },
  ],
};

function loadSigleVilleMap() {
  const filePath = path.join(__dirname, '../prisma/data/concours-officiels-2026.json');
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const map = new Map();
  for (const item of payload.concours || []) {
    if (item.sigle && item.ville) {
      map.set(item.sigle, item.ville);
    }
  }
  return map;
}

function extractSigleFromLibelle(libelle) {
  const trimmed = String(libelle || '').trim();
  const match = trimmed.match(/^Concours\s+(.+?)\s+2026(?:\s|$|-)/i);
  if (match) return match[1].trim();
  if (trimmed.startsWith('Concours ')) {
    return trimmed.replace(/^Concours\s+/i, '').replace(/\s+2026.*$/i, '').trim();
  }
  return null;
}

function extractAnneeAcademique(libelle) {
  const match = String(libelle || '').match(/20\d{2}/);
  if (match) {
    const y = parseInt(match[0], 10);
    return `${y - 1}-${y}`;
  }
  return '2025-2026';
}

function centreKey({ nom, ville }) {
  return `${nom.trim().toLowerCase()}::${ville.trim().toLowerCase()}`;
}

function buildCentresPourConcours(concours, sigleVilleMap) {
  const sigle = concours.sigle || extractSigleFromLibelle(concours.libelle);
  const ville = sigle ? sigleVilleMap.get(sigle) : null;
  const extras = ville ? (CENTRES_PAR_VILLE[ville] || []) : [];

  const merged = new Map();
  [...CENTRES_NATIONAUX, ...extras].forEach((c) => {
    merged.set(centreKey(c), c);
  });

  return [...merged.values()];
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

  if (existing) return existing;

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Créer centre ${nomNorm} — ${villeNorm}`);
    return { id: `dry-${centreKey({ nom, ville })}`, nom: nomNorm, ville: villeNorm };
  }

  return prisma.centreComposition.create({
    data: {
      nom: nomNorm,
      ville: villeNorm,
      adresse: adresse?.trim() || null,
    },
  });
}

async function linkCentreAuConcours({ concoursId, centreId, anneeAcademique }) {
  const existing = await prisma.concourscentreComposition.findUnique({
    where: {
      concoursId_centreId_anneeAcademique: {
        concoursId,
        centreId,
        anneeAcademique,
      },
    },
  });

  if (existing) return { link: existing, created: false };

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Lier concours=${concoursId} centre=${centreId}`);
    return { link: null, created: true };
  }

  const link = await prisma.concourscentreComposition.create({
    data: { concoursId, centreId, anneeAcademique },
  });
  return { link, created: true };
}

async function main() {
  const sigleVilleMap = loadSigleVilleMap();

  const concoursList = await prisma.concours.findMany({
    select: {
      id: true,
      libelle: true,
      sigle: true,
      centresComposition: true,
      _count: { select: { centresActifs: true } },
    },
    orderBy: { libelle: 'asc' },
  });

  const sansCentres = concoursList.filter(
    (c) => c._count.centresActifs === 0
      && !(Array.isArray(c.centresComposition?.centres) && c.centresComposition.centres.length),
  );

  console.log(`Concours sans centre : ${sansCentres.length} / ${concoursList.length}`);
  if (DRY_RUN) console.log('Mode dry-run — aucune écriture en base.\n');

  let centresCrees = 0;
  let liensCrees = 0;

  for (const concours of sansCentres) {
    const anneeAcademique = extractAnneeAcademique(concours.libelle);
    const centres = buildCentresPourConcours(concours, sigleVilleMap);

    console.log(`\n→ ${concours.libelle} (${anneeAcademique}) — ${centres.length} centre(s)`);

    for (const spec of centres) {
      const before = await prisma.centreComposition.findFirst({
        where: {
          nom: { equals: spec.nom, mode: 'insensitive' },
          ville: { equals: spec.ville, mode: 'insensitive' },
        },
      });

      const centre = await findOrCreateCentre(spec);
      if (!before && !DRY_RUN) centresCrees += 1;

      const { created } = await linkCentreAuConcours({
        concoursId: concours.id,
        centreId: centre.id,
        anneeAcademique,
      });

      if (created) {
        liensCrees += 1;
        console.log(`  + ${spec.nom} — ${spec.ville}`);
      } else {
        console.log(`  = ${spec.nom} — ${spec.ville} (déjà lié)`);
      }
    }
  }

  console.log(`\n✅ Terminé — ${liensCrees} lien(s) concours-centre ajouté(s), ${centresCrees} centre(s) créé(s).`);
}

main()
  .catch((e) => {
    console.error('❌', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
