/**
 * Attribue exactement 4 centres de composition à chaque concours,
 * dans des départements différents.
 * Usage: node scripts/assign-centres-to-concours.js
 */
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

const TARGET = 4;

const DEPARTEMENTS = [
  { nom: 'Alibori', villes: ['Kandi', 'Banikoara', 'Malanville'] },
  { nom: 'Atacora', villes: ['Natitingou', 'Tanguiéta', 'Toucountouna'] },
  { nom: 'Atlantique', villes: ['Abomey-Calavi', 'Allada', 'Ouidah', 'Abomey Calavi'] },
  { nom: 'Borgou', villes: ['Parakou', "N'Dali", 'Tchaourou'] },
  { nom: 'Collines', villes: ['Dassa-Zoumé', 'Dassa', 'Savalou', 'Glazoué'] },
  { nom: 'Couffo', villes: ['Aplahoué', 'Dogbo', 'Klouékanmè'] },
  { nom: 'Donga', villes: ['Djougou', 'Bassila', 'Copargo'] },
  { nom: 'Littoral', villes: ['Cotonou'] },
  { nom: 'Mono', villes: ['Lokossa', 'Comè', 'Grand-Popo'] },
  { nom: 'Ouémé', villes: ['Porto-Novo', 'Akpro-Missérété', 'Adjarra'] },
  { nom: 'Plateau', villes: ['Pobè', 'Pobe', 'Kétou', 'Ketou', 'Sakété'] },
  { nom: 'Zou', villes: ['Abomey', 'Bohicon', 'Covè', 'Zagnanado'] },
];

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function resolveDepartement(villeOrText) {
  const v = normalize(villeOrText);
  if (!v) return null;

  for (const dep of DEPARTEMENTS) {
    for (const x of dep.villes) {
      if (v === normalize(x)) return dep.nom;
    }
  }

  for (const dep of DEPARTEMENTS) {
    for (const x of dep.villes) {
      const xv = normalize(x);
      if (v.length < 4 || xv.length < 4) continue;
      if (v === 'abomey' && xv.startsWith('abomey-')) continue;
      if (xv === 'abomey' && v.startsWith('abomey-')) continue;
      if (v.includes(xv) || xv.includes(v)) return dep.nom;
    }
  }
  return null;
}

function defaultAnneeFromLibelle(libelle) {
  const match = String(libelle || '').match(/20\d{2}/);
  if (match) {
    const y = parseInt(match[0], 10);
    return `${y - 1}-${y}`;
  }
  return '2025-2026';
}

function hashOffset(id) {
  return String(id).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

/** Un centre par département, en variant selon l'offset. */
function pickFourDiverse(allCentres, offset) {
  const byDep = new Map();
  for (const c of allCentres.filter((x) => x.actif)) {
    const dep = resolveDepartement(c.ville) || 'Autre';
    if (!byDep.has(dep)) byDep.set(dep, []);
    byDep.get(dep).push(c);
  }

  const deps = [...byDep.keys()].sort();
  // Rotation pour que chaque concours n'ait pas les mêmes 4 départements
  const rotated = [...deps.slice(offset % deps.length), ...deps.slice(0, offset % deps.length)];
  const picked = [];

  for (const dep of rotated) {
    if (picked.length >= TARGET) break;
    const list = byDep.get(dep);
    if (!list?.length) continue;
    picked.push(list[offset % list.length]);
  }

  return picked;
}

async function upsertLink(concoursId, centreId, annee) {
  try {
    await prisma.concoursCentreComposition.create({
      data: {
        id: randomUUID(),
        concoursId,
        centreId,
        anneeAcademique: annee,
        estActif: true,
      },
    });
    return 'created';
  } catch (err) {
    if (err.code === 'P2002') {
      await prisma.concoursCentreComposition.updateMany({
        where: { concoursId, centreId, anneeAcademique: annee },
        data: { estActif: true },
      });
      return 'reactivated';
    }
    throw err;
  }
}

async function main() {
  const concoursList = await prisma.concours.findMany({
    orderBy: { libelle: 'asc' },
  });

  const allCentres = await prisma.centreComposition.findMany({
    where: { actif: true },
    orderBy: [{ ville: 'asc' }, { nom: 'asc' }],
  });

  if (allCentres.length < TARGET) {
    throw new Error(`Il faut au moins ${TARGET} centres actifs. Lancez seed-centres-composition.js`);
  }

  let updated = 0;
  let linksCreated = 0;

  for (const concours of concoursList) {
    const annee = defaultAnneeFromLibelle(concours.libelle);
    const offset = hashOffset(concours.id);
    const chosen = pickFourDiverse(allCentres, offset);
    const chosenIds = new Set(chosen.map((c) => c.id));

    // Désactiver les liaisons qui ne font pas partie des 4 retenus
    await prisma.concoursCentreComposition.updateMany({
      where: {
        concoursId: concours.id,
        centreId: { notIn: [...chosenIds] },
        estActif: true,
      },
      data: { estActif: false },
    });

    for (const centre of chosen) {
      const result = await upsertLink(concours.id, centre.id, annee);
      if (result === 'created') linksCreated += 1;
    }

    const finalLinks = await prisma.concoursCentreComposition.findMany({
      where: { concoursId: concours.id, estActif: true },
      include: { centre: { select: { ville: true, nom: true } } },
      orderBy: { centre: { ville: 'asc' } },
    });

    const deps = [
      ...new Set(finalLinks.map((l) => resolveDepartement(l.centre.ville)).filter(Boolean)),
    ];
    const labels = finalLinks.map((l) => `${l.centre.ville}`).join(', ');

    updated += 1;
    console.log(
      `SET ${concours.libelle} — ${finalLinks.length} centres / ${deps.length} dép. — ${labels}`
    );
  }

  console.log(`\nTerminé: ${updated} concours à ${TARGET} centres, ${linksCreated} nouvelles liaisons.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
