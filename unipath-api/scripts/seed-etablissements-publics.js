/**
 * Synchronise les établissements publics organisateurs de concours.
 * Usage: npm run seed:etablissements-publics
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ETABLISSEMENTS_PUBLICS = [
  { nom: 'ANAPA', ville: 'Cotonou', adresse: "Agence Nationale de Promotion de l'Architecture" },
  { nom: 'ENAM', ville: 'Cotonou', adresse: "École Nationale d'Administration et de Magistrature" },
  { nom: 'ENEAM', ville: 'Cotonou', adresse: "École Nationale d'Économie Appliquée et de Management" },
  { nom: 'ENSET', ville: 'Lokossa', adresse: "École Nationale Supérieure de l'Enseignement Technique" },
  { nom: 'ENSGTI', ville: 'Abomey', adresse: 'École Nationale Supérieure de Génie des Technologies Industrielles' },
  { nom: 'ENS Natitingou', ville: 'Natitingou', adresse: 'École Normale Supérieure de Natitingou' },
  { nom: 'ENS Porto-Novo', ville: 'Porto-Novo', adresse: 'École Normale Supérieure de Porto-Novo' },
  { nom: 'ENSPD', ville: 'Parakou', adresse: 'École Nationale de la Statistique, de la Planification et de la Démographie' },
  { nom: 'ENSTIC', ville: 'Abomey-Calavi', adresse: "École Nationale des Sciences et Techniques de l'Information et de la Communication" },
  { nom: 'EPAC', ville: 'Abomey-Calavi', adresse: "École Polytechnique d'Abomey-Calavi" },
  { nom: 'ESMA', ville: 'Ketou', adresse: 'École Supérieure des Métiers de l’Agriculture' },
  { nom: 'FADESP', ville: 'Abomey-Calavi', adresse: 'Faculté de Droit et de Sciences Politiques' },
  { nom: 'FAST', ville: 'Abomey-Calavi', adresse: 'Faculté des Sciences et Techniques' },
  { nom: 'FLASH', ville: 'Abomey-Calavi', adresse: 'Faculté des Lettres, Arts et Sciences Humaines' },
  { nom: 'FSA', ville: 'Abomey-Calavi', adresse: 'Faculté des Sciences Agronomiques' },
  { nom: 'FSEA', ville: 'Abomey-Calavi', adresse: 'Faculté des Sciences Économiques et de Gestion' },
  { nom: 'FSS', ville: 'Cotonou', adresse: 'Faculté des Sciences de la Santé' },
  { nom: 'IFRI', ville: 'Abomey-Calavi', adresse: 'Institut de Formation et de Recherche en Informatique' },
  { nom: 'IFSIO', ville: 'Parakou', adresse: 'Institut de Formation en Soins Infirmiers et Obstétricaux' },
  { nom: 'INEPS', ville: 'Porto-Novo', adresse: "Institut National de l'Éducation Physique et Sportive" },
  { nom: 'INMeS', ville: 'Cotonou', adresse: 'Institut National Médico-Sanitaire' },
  { nom: 'INSPEI', ville: 'Abomey', adresse: "Institut National Supérieur des Classes Préparatoires aux Études d'Ingénieurs" },
  { nom: 'IPEN', ville: 'Cotonou', adresse: "Institut de Perfectionnement en Éducation et Nutrition" },
  { nom: 'IUEP-MA', ville: 'Ketou', adresse: "Institut Universitaire d'Enseignement Professionnel aux Métiers de l'Agriculture" },
  { nom: 'IUT-Lokossa', ville: 'Lokossa', adresse: 'Institut Universitaire de Technologie de Lokossa' },
];

const INVALID_PUBLIC_NOMS = [
  'Abomey',
  'Abomey-Calavi',
  'Cotonou',
  'Ketou',
  'Lokossa',
  'Natitingou',
  'Parakou',
  'Porto-Novo',
  'Faculté des Sciences de la Santé',
  'Institut National Medico',
  "Institut Universitaire d'Enseignement Professionnel aux Metiers de l'Agriculture (IUEP",
  'Institut Universitaire de Technologie de Lokossa (IUT',
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
  return (
    new RegExp(`\\(${escaped}\\)`, 'i').test(hay)
    || new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(hay)
    || hay === needle
  );
}

async function upsertPublic(data) {
  const existing = await prisma.etablissement.findFirst({
    where: { nom: data.nom, type: 'PUBLIC' },
  });

  if (existing) {
    await prisma.etablissement.update({
      where: { id: existing.id },
      data: {
        ville: data.ville,
        adresse: data.adresse,
      },
    });
    return { created: false };
  }

  await prisma.etablissement.create({
    data: {
      nom: data.nom,
      type: 'PUBLIC',
      ville: data.ville,
      adresse: data.adresse,
    },
  });
  return { created: true };
}

async function main() {
  console.log('Synchronisation des établissements publics…\n');

  const deleted = await prisma.etablissement.deleteMany({
    where: { type: 'PUBLIC', nom: { in: INVALID_PUBLIC_NOMS } },
  });
  if (deleted.count > 0) {
    console.log(`Nettoyage : ${deleted.count} entrée(s) incorrecte(s) supprimée(s)\n`);
  }

  let created = 0;
  let updated = 0;
  for (const item of ETABLISSEMENTS_PUBLICS) {
    const result = await upsertPublic(item);
    if (result.created) {
      created += 1;
      console.log(`  [créé]     ${item.nom}`);
    } else {
      updated += 1;
      console.log(`  [existant] ${item.nom}`);
    }
  }

  const concours = await prisma.concours.findMany({
    select: { libelle: true, etablissement: true },
  });
  const unmatched = concours.filter(
    (c) => !ETABLISSEMENTS_PUBLICS.some((e) => matchesEtablissementNom(c.etablissement, e.nom))
  );

  const totalPublic = await prisma.etablissement.count({ where: { type: 'PUBLIC' } });
  console.log('\n=== Résumé ===');
  console.log(`Référentiel               : ${ETABLISSEMENTS_PUBLICS.length}`);
  console.log(`Créés                     : ${created}`);
  console.log(`Mis à jour                : ${updated}`);
  console.log(`Total PUBLIC en base      : ${totalPublic}`);
  if (unmatched.length > 0) {
    console.log(`\nConcours sans établissement référencé (${unmatched.length}) :`);
    unmatched.forEach((c) => console.log(`  - ${c.libelle} | ${c.etablissement}`));
  } else {
    console.log('\nTous les concours correspondent à un établissement public du référentiel.');
  }
}

main()
  .catch((error) => {
    console.error('Erreur seed établissements publics:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
