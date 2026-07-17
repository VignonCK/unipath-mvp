/**
 * Synchronise les centres de composition :
 * 1) tous les établissements de la base (table Etablissement)
 * 2) les établissements mentionnés sur les concours
 * 3) au moins 2 centres par département du Bénin
 *
 * Usage: node prisma/seed-centres-composition.js
 */
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

/** 12 départements du Bénin + chefs-lieux / villes de référence */
const DEPARTEMENTS = [
  {
    nom: 'Alibori',
    villes: ['Kandi', 'Banikoara', 'Malanville'],
    centres: [
      { nom: 'CEG Kandi', ville: 'Kandi', adresse: 'Kandi, Alibori' },
      { nom: 'Lycée Mathieu Bouké', ville: 'Kandi', adresse: 'Kandi, Alibori' },
    ],
  },
  {
    nom: 'Atacora',
    villes: ['Natitingou', 'Tanguiéta', 'Toucountouna'],
    centres: [
      { nom: 'CEG Natitingou', ville: 'Natitingou', adresse: 'Natitingou, Atacora' },
      { nom: 'ENS Natitingou', ville: 'Natitingou', adresse: 'Natitingou, Atacora' },
    ],
  },
  {
    nom: 'Atlantique',
    villes: ['Abomey-Calavi', 'Allada', 'Ouidah', 'Abomey Calavi'],
    centres: [
      { nom: 'Campus UAC Abomey-Calavi', ville: 'Abomey-Calavi', adresse: 'Abomey-Calavi, Atlantique' },
      { nom: 'CEG Godomey', ville: 'Abomey-Calavi', adresse: 'Godomey, Abomey-Calavi' },
    ],
  },
  {
    nom: 'Borgou',
    villes: ['Parakou', 'N\'Dali', 'Tchaourou'],
    centres: [
      { nom: 'CEG Parakou', ville: 'Parakou', adresse: 'Parakou, Borgou' },
      { nom: 'IFSIO Parakou', ville: 'Parakou', adresse: 'Parakou, Borgou' },
    ],
  },
  {
    nom: 'Collines',
    villes: ['Dassa-Zoumé', 'Dassa', 'Savalou', 'Glazoué'],
    centres: [
      { nom: 'CEG Dassa-Zoumé', ville: 'Dassa-Zoumé', adresse: 'Dassa-Zoumé, Collines' },
      { nom: 'CEG Savalou', ville: 'Savalou', adresse: 'Savalou, Collines' },
    ],
  },
  {
    nom: 'Couffo',
    villes: ['Aplahoué', 'Dogbo', 'Klouékanmè'],
    centres: [
      { nom: 'CEG Aplahoué', ville: 'Aplahoué', adresse: 'Aplahoué, Couffo' },
      { nom: 'CEG Dogbo', ville: 'Dogbo', adresse: 'Dogbo, Couffo' },
    ],
  },
  {
    nom: 'Donga',
    villes: ['Djougou', 'Bassila', 'Copargo'],
    centres: [
      { nom: 'CEG Djougou', ville: 'Djougou', adresse: 'Djougou, Donga' },
      { nom: 'Lycée Technique de Djougou', ville: 'Djougou', adresse: 'Djougou, Donga' },
    ],
  },
  {
    nom: 'Littoral',
    villes: ['Cotonou'],
    centres: [
      { nom: 'CEG Gbégamey', ville: 'Cotonou', adresse: 'Cotonou, Littoral' },
      { nom: 'CEG Sainte Rita', ville: 'Cotonou', adresse: 'Cotonou, Littoral' },
    ],
  },
  {
    nom: 'Mono',
    villes: ['Lokossa', 'Comè', 'Grand-Popo'],
    centres: [
      { nom: 'CEG Lokossa', ville: 'Lokossa', adresse: 'Lokossa, Mono' },
      { nom: 'IUT Lokossa', ville: 'Lokossa', adresse: 'Lokossa, Mono' },
    ],
  },
  {
    nom: 'Ouémé',
    villes: ['Porto-Novo', 'Akpro-Missérété', 'Adjarra'],
    centres: [
      { nom: 'CEG Porto-Novo', ville: 'Porto-Novo', adresse: 'Porto-Novo, Ouémé' },
      { nom: 'ENS Porto-Novo', ville: 'Porto-Novo', adresse: 'Porto-Novo, Ouémé' },
    ],
  },
  {
    nom: 'Plateau',
    villes: ['Pobè', 'Pobe', 'Kétou', 'Ketou', 'Sakété'],
    centres: [
      { nom: 'CEG Pobè', ville: 'Pobè', adresse: 'Pobè, Plateau' },
      { nom: 'CEG Kétou', ville: 'Kétou', adresse: 'Kétou, Plateau' },
    ],
  },
  {
    nom: 'Zou',
    villes: ['Abomey', 'Bohicon', 'Covè', 'Zagnanado'],
    centres: [
      { nom: 'CEG Abomey', ville: 'Abomey', adresse: 'Abomey, Zou' },
      { nom: 'ENSTP / UNSTIM Abomey', ville: 'Abomey', adresse: 'Abomey, Zou' },
    ],
  },
];

function normalizeKey(nom, ville) {
  return `${String(nom || '').trim().toLowerCase()}|${String(ville || '').trim().toLowerCase()}`;
}

function resolveDepartement(ville) {
  const v = String(ville || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!v) return null;

  // Correspondance exacte d'abord
  for (const dep of DEPARTEMENTS) {
    for (const x of dep.villes) {
      const xv = String(x)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (v === xv) return dep.nom;
    }
  }

  // Puis préfixe / containment, en évitant Abomey ⊂ Abomey-Calavi
  for (const dep of DEPARTEMENTS) {
    for (const x of dep.villes) {
      const xv = String(x)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (v.length < 4 || xv.length < 4) continue;
      if (v === 'abomey' && xv.startsWith('abomey-')) continue;
      if (xv === 'abomey' && v.startsWith('abomey-')) continue;
      if (v.startsWith(xv) || xv.startsWith(v)) return dep.nom;
    }
  }

  return null;
}

/**
 * Extrait un libellé court et une ville depuis la chaîne Concours.etablissement
 * Ex: "Faculte des Sciences Agronomiques (FSA) - Universite d'Abomey-Calavi - Abomey-Calavi"
 */
function parseConcoursEtablissement(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;

  // Protéger les toponymes à tirets avant le split
  const protectedCities = [
    'Abomey-Calavi',
    'Porto-Novo',
    'Dassa-Zoumé',
    'Dassa-Zoume',
    'Grand-Popo',
    'Akpro-Missérété',
    'Akpro-Misserete',
    'N\'Dali',
  ];
  let safe = text;
  const placeholders = [];
  protectedCities.forEach((city, i) => {
    const re = new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    safe = safe.replace(re, () => {
      const token = `__CITY${i}__`;
      placeholders.push({ token, city });
      return token;
    });
  });

  const parts = safe.split(/\s*-\s*/).map((p) => p.trim()).filter(Boolean);
  const restore = (s) => {
    let out = s;
    for (const { token, city } of placeholders) {
      out = out.replace(new RegExp(token, 'g'), city);
    }
    return out;
  };

  let ville = parts.length >= 2 ? restore(parts[parts.length - 1]) : null;
  let nom = restore(parts[0] || text);

  const sigleMatch = nom.match(/\(([^)]+)\)\s*$/);
  if (sigleMatch) {
    nom = sigleMatch[1].trim();
  }

  // Dernier segment trop court / sigle → pas une ville
  if (ville && (ville.length <= 6 || /^[A-Z0-9-]{2,8}$/i.test(ville)) && !resolveDepartement(ville)) {
    ville = null;
  }

  if (!ville || ville.length > 40 || /universit/i.test(ville)) {
    ville = null;
    for (const dep of DEPARTEMENTS) {
      const hit = dep.villes.find((x) => text.toLowerCase().includes(String(x).toLowerCase()));
      if (hit) {
        ville = hit;
        break;
      }
    }
  }

  if (!nom) return null;
  return {
    nom: nom.slice(0, 180),
    ville: (ville || 'Cotonou').slice(0, 80),
    adresse: text.slice(0, 191),
  };
}

async function upsertCentre({ nom, ville, adresse, telephone }, stats) {
  const existing = await prisma.centreComposition.findFirst({
    where: {
      nom,
      ville,
    },
  });

  if (existing) {
    const patch = {};
    if (adresse && !existing.adresse) patch.adresse = adresse;
    if (telephone && !existing.telephone) patch.telephone = telephone;
    if (!existing.actif) patch.actif = true;
    if (Object.keys(patch).length > 0) {
      await prisma.centreComposition.update({ where: { id: existing.id }, data: patch });
      stats.updated += 1;
    } else {
      stats.skipped += 1;
    }
    return existing;
  }

  const created = await prisma.centreComposition.create({
    data: {
      id: randomUUID(),
      nom,
      ville,
      adresse: adresse || null,
      telephone: telephone || null,
      actif: true,
    },
  });
  stats.created += 1;
  return created;
}

async function main() {
  const stats = { created: 0, updated: 0, skipped: 0 };

  // 1) Établissements de la table Etablissement
  const etablissements = await prisma.etablissement.findMany({
    select: { nom: true, ville: true, adresse: true },
    orderBy: { nom: 'asc' },
  });

  for (const e of etablissements) {
    if (!e.nom?.trim() || !e.ville?.trim()) continue;
    await upsertCentre(
      {
        nom: e.nom.trim(),
        ville: e.ville.trim(),
        adresse: e.adresse?.trim() || `${e.ville.trim()}, Bénin`,
      },
      stats
    );
  }

  // 2) Établissements mentionnés sur les concours
  const concours = await prisma.concours.findMany({
    select: { etablissement: true },
  });
  const seenConcours = new Set();
  for (const c of concours) {
    const parsed = parseConcoursEtablissement(c.etablissement);
    if (!parsed) continue;
    const key = normalizeKey(parsed.nom, parsed.ville);
    if (seenConcours.has(key)) continue;
    seenConcours.add(key);
    await upsertCentre(parsed, stats);
  }

  // 3) Au moins 2 centres par département
  for (const dep of DEPARTEMENTS) {
    for (const centre of dep.centres) {
      await upsertCentre(centre, stats);
    }
  }

  // Nettoyage des entrées mal parsées (villes tronquées)
  const bad = await prisma.centreComposition.findMany({
    where: {
      OR: [
        { ville: { in: ['Calavi', 'Novo', 'FSS'] } },
        { nom: { contains: '(Calavi)' } },
        { nom: { contains: '(Novo)' } },
        { nom: { contains: '(FSS)' } },
      ],
    },
  });
  for (const b of bad) {
    const linked = await prisma.concoursCentreComposition.count({ where: { centreId: b.id } });
    if (linked === 0) {
      await prisma.centreComposition.delete({ where: { id: b.id } });
      stats.deleted = (stats.deleted || 0) + 1;
    }
  }

  // Rapport par département
  const all = await prisma.centreComposition.findMany({
    where: { actif: true },
    select: { nom: true, ville: true },
  });

  console.log(
    `Centres: ${stats.created} créés, ${stats.updated} mis à jour, ${stats.skipped} déjà présents`
    + (stats.deleted ? `, ${stats.deleted} nettoyés` : '')
    + '.'
  );
  console.log(`Total actifs: ${all.length}`);
  console.log('\nRépartition par département :');

  for (const dep of DEPARTEMENTS) {
    const count = all.filter((c) => resolveDepartement(c.ville) === dep.nom).length;
    const ok = count >= 2 ? 'OK' : 'MANQUE';
    console.log(`  ${dep.nom.padEnd(12)} : ${count} centre(s) [${ok}]`);
  }

  const horsDep = all.filter((c) => !resolveDepartement(c.ville));
  if (horsDep.length) {
    console.log(`\nVilles non mappées (${horsDep.length}) :`);
    for (const c of horsDep.slice(0, 20)) {
      console.log(`  - ${c.nom} (${c.ville})`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
