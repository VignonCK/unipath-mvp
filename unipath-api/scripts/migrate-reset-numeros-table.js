/**
 * Migration one-shot — reset des n° de table (ancienne logique ordre d'arrivée).
 *
 * Avant attribution alphabétique groupée :
 * 1. Logue par concours combien d'inscriptions ont un numeroInscription
 * 2. Nullifie tous les Inscription.numeroInscription non nuls
 * 3. Remet Concours.inscriptionCompteur = 0 et inscriptionCompteurAnnee = null
 *
 * Usage (après validation explicite) :
 *   node scripts/migrate-reset-numeros-table.js
 *   node scripts/migrate-reset-numeros-table.js --dry-run
 */
require('dotenv').config();
const prisma = require('../src/prisma');

const dryRun = process.argv.includes('--dry-run');

async function main() {
  console.log('=== Migration reset n° de table Module 1 ===');
  console.log(dryRun ? 'Mode: DRY-RUN (aucune écriture)' : 'Mode: ÉCRITURE');

  const avecNumero = await prisma.inscription.findMany({
    where: { numeroInscription: { not: null } },
    select: {
      id: true,
      numeroInscription: true,
      concoursId: true,
      concours: { select: { id: true, libelle: true, inscriptionCompteur: true } },
    },
    orderBy: [{ concoursId: 'asc' }, { numeroInscription: 'asc' }],
  });

  const parConcours = new Map();
  for (const row of avecNumero) {
    if (!parConcours.has(row.concoursId)) {
      parConcours.set(row.concoursId, {
        libelle: row.concours?.libelle || row.concoursId,
        compteurActuel: row.concours?.inscriptionCompteur ?? 0,
        inscriptions: [],
      });
    }
    parConcours.get(row.concoursId).inscriptions.push({
      id: row.id,
      numero: row.numeroInscription,
    });
  }

  console.log(`\nTotal inscriptions avec numeroInscription : ${avecNumero.length}`);
  console.log(`Concours impactés : ${parConcours.size}\n`);

  for (const [concoursId, info] of parConcours) {
    console.log(`- ${info.libelle}`);
    console.log(`  concoursId=${concoursId}`);
    console.log(`  dossiers à nullifier=${info.inscriptions.length}`);
    console.log(`  inscriptionCompteur actuel=${info.compteurActuel}`);
    for (const ins of info.inscriptions.slice(0, 10)) {
      console.log(`    ${ins.numero} (${ins.id})`);
    }
    if (info.inscriptions.length > 10) {
      console.log(`    ... +${info.inscriptions.length - 10} autre(s)`);
    }
  }

  const concoursAvecCompteur = await prisma.concours.findMany({
    where: {
      OR: [
        { inscriptionCompteur: { gt: 0 } },
        { inscriptionCompteurAnnee: { not: null } },
      ],
    },
    select: {
      id: true,
      libelle: true,
      inscriptionCompteur: true,
      inscriptionCompteurAnnee: true,
    },
  });

  console.log(`\nConcours avec compteur > 0 ou année renseignée : ${concoursAvecCompteur.length}`);
  for (const c of concoursAvecCompteur) {
    if (!parConcours.has(c.id)) {
      console.log(
        `- ${c.libelle} (compteur=${c.inscriptionCompteur}, annee=${c.inscriptionCompteurAnnee}) — reset compteur seulement`,
      );
    }
  }

  if (dryRun) {
    console.log('\nDRY-RUN terminé — aucune modification.');
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const nullified = await tx.inscription.updateMany({
      where: { numeroInscription: { not: null } },
      data: { numeroInscription: null },
    });

    const countersReset = await tx.concours.updateMany({
      where: {
        OR: [
          { inscriptionCompteur: { gt: 0 } },
          { inscriptionCompteurAnnee: { not: null } },
        ],
      },
      data: {
        inscriptionCompteur: 0,
        inscriptionCompteurAnnee: null,
      },
    });

    return { nullified: nullified.count, countersReset: countersReset.count };
  });

  console.log('\n=== Résultat ===');
  console.log(`Inscriptions nullifiées : ${result.nullified}`);
  console.log(`Compteurs Concours remis à 0 : ${result.countersReset}`);

  const remaining = await prisma.inscription.count({
    where: { numeroInscription: { not: null } },
  });
  const compteursRestants = await prisma.concours.count({
    where: { inscriptionCompteur: { gt: 0 } },
  });
  console.log(`Vérif post-migration : numeroInscription restants=${remaining}, compteurs>0=${compteursRestants}`);
}

main()
  .catch((err) => {
    console.error('❌ Migration échouée:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
