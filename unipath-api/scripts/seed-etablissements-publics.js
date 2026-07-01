/**
 * Seed des établissements publics organisateurs de concours + liaison Concours.etablissementId
 * Usage: npm run seed:etablissements-publics
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ETABLISSEMENTS_PUBLICS = [
  { nom: 'EPAC', ville: 'Abomey-Calavi', adresse: "Université d'Abomey-Calavi" },
  { nom: 'INMeS', ville: 'Cotonou', adresse: 'Institut National Médico-Sanitaire' },
  { nom: 'FAST', ville: 'Abomey-Calavi', adresse: 'Faculté des Sciences et Techniques' },
  { nom: 'ENAM', ville: 'Cotonou', adresse: "École Nationale d'Administration et de Magistrature" },
  { nom: 'FADESP', ville: 'Abomey-Calavi', adresse: 'Faculté de Droit et de Sciences Politiques' },
  { nom: 'FLASH', ville: 'Abomey-Calavi', adresse: 'Faculté des Lettres, Arts et Sciences Humaines' },
  { nom: 'FSEA', ville: 'Abomey-Calavi', adresse: 'Faculté des Sciences Agronomiques' },
  { nom: 'IFSIO', ville: 'Cotonou', adresse: "Institut de Formation Sociale et d'Ingénierie Organisationnelle" },
  { nom: 'FSS', ville: 'Cotonou', adresse: 'Faculté des Sciences de la Santé' },
  { nom: 'ENEAM', ville: 'Cotonou', adresse: "École Nationale d'Économie Appliquée et de Management" },
];

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesEtablissementNom(concoursEtablissement, seedNom) {
  const hay = normalizeText(concoursEtablissement);
  const needle = normalizeText(seedNom);
  if (!hay || !needle) return false;

  const escaped = escapeRegex(needle);
  const boundaryPattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
  const parenthesisPattern = new RegExp(`\\(${escaped}\\)`, 'i');

  return boundaryPattern.test(hay) || parenthesisPattern.test(hay) || hay.includes(needle);
}

function findMatchingEtablissement(concoursEtablissement, etablissementsByNom) {
  const orderedNoms = [...etablissementsByNom.keys()].sort((a, b) => b.length - a.length);

  for (const nom of orderedNoms) {
    if (matchesEtablissementNom(concoursEtablissement, nom)) {
      return etablissementsByNom.get(nom);
    }
  }

  return null;
}

async function upsertEtablissementPublic(data) {
  const existing = await prisma.etablissement.findFirst({
    where: {
      nom: data.nom,
      type: 'PUBLIC',
    },
  });

  if (existing) {
    const updated = await prisma.etablissement.update({
      where: { id: existing.id },
      data: {
        ville: data.ville,
        adresse: data.adresse,
      },
    });
    console.log(`  [existant] ${data.nom} (${updated.id}) — ville/adresse mises à jour si besoin`);
    return updated;
  }

  const created = await prisma.etablissement.create({
    data: {
      nom: data.nom,
      type: 'PUBLIC',
      ville: data.ville,
      adresse: data.adresse,
    },
  });
  console.log(`  [créé]     ${data.nom} (${created.id})`);
  return created;
}

async function seedEtablissementsPublics() {
  console.log('\n=== Établissements publics (upsert) ===\n');

  const etablissementsByNom = new Map();

  for (const item of ETABLISSEMENTS_PUBLICS) {
    const etablissement = await upsertEtablissementPublic(item);
    etablissementsByNom.set(item.nom, etablissement);
  }

  return etablissementsByNom;
}

async function linkConcoursToEtablissements(etablissementsByNom) {
  console.log('\n=== Liaison Concours → Etablissement ===\n');

  const concoursList = await prisma.concours.findMany({
    where: {
      etablissementId: null,
      etablissement: { not: null },
    },
    select: {
      id: true,
      libelle: true,
      etablissement: true,
    },
  });

  const matched = [];
  const unmatched = [];

  for (const concours of concoursList) {
    const etablissement = findMatchingEtablissement(concours.etablissement, etablissementsByNom);

    if (!etablissement) {
      unmatched.push(concours);
      continue;
    }

    await prisma.concours.update({
      where: { id: concours.id },
      data: { etablissementId: etablissement.id },
    });

    matched.push({
      concoursId: concours.id,
      libelle: concours.libelle,
      etablissementTexte: concours.etablissement,
      etablissementNom: etablissement.nom,
    });
  }

  if (matched.length > 0) {
    console.log(`Concours matchés (${matched.length}) :`);
    matched.forEach((item) => {
      console.log(`  ✓ ${item.libelle} → ${item.etablissementNom}`);
      console.log(`    texte: ${item.etablissementTexte}`);
    });
  } else {
    console.log('Aucun concours matché.');
  }

  if (unmatched.length > 0) {
    console.log(`\nConcours non matchés (${unmatched.length}) :`);
    unmatched.forEach((item) => {
      console.log(`  ✗ ${item.libelle}`);
      console.log(`    texte: ${item.etablissement}`);
    });
  } else {
    console.log('\nTous les concours éligibles ont été matchés.');
  }

  return { matched, unmatched };
}

async function main() {
  console.log('Seed établissements publics organisateurs de concours...');

  const etablissementsByNom = await seedEtablissementsPublics();
  const { matched, unmatched } = await linkConcoursToEtablissements(etablissementsByNom);

  console.log('\n=== Résumé ===');
  console.log(`Établissements publics traités : ${ETABLISSEMENTS_PUBLICS.length}`);
  console.log(`Concours liés             : ${matched.length}`);
  console.log(`Concours non matchés      : ${unmatched.length}`);
  console.log('');
}

main()
  .catch((error) => {
    console.error('Erreur seed établissements publics:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
