/**
 * Crée les InscriptionAcademique manquantes pour les préinscriptions VALIDE (démo / legacy).
 * Sans ça, le candidat ne peut pas déposer la quittance bancaire.
 *
 * Usage: node scripts/fix-demo-inscriptions-acad.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

async function main() {
  const preins = await prisma.preinscriptionEtablissement.findMany({
    where: { statut: 'VALIDE' },
    select: {
      id: true,
      numeroPreinscription: true,
      candidatId: true,
      filiereId: true,
      etablissementId: true,
      anneeAcademique: true,
      niveau: true,
      inscriptionAcadId: true,
      candidat: { select: { email: true, prenom: true, nom: true } },
    },
  });

  console.log(`\nPréinscriptions VALIDE: ${preins.length}\n`);

  let created = 0;
  let linked = 0;

  for (const p of preins) {
    let inscriptionAcadId = p.inscriptionAcadId;

    if (inscriptionAcadId) {
      const exists = await prisma.inscriptionAcademique.findUnique({
        where: { id: inscriptionAcadId },
        select: { id: true, statut: true },
      });
      if (exists) {
        if (['EN_COURS', 'EN_ATTENTE_QUITTANCE'].includes(exists.statut) === false
          && exists.statut !== 'QUITTANCE_SOUMISE'
          && exists.statut !== 'VALIDE') {
          // leave other statuses alone
        } else if (exists.statut === 'EN_COURS') {
          await prisma.inscriptionAcademique.update({
            where: { id: exists.id },
            data: { statut: 'EN_ATTENTE_QUITTANCE' },
          });
        }
        continue;
      }
      inscriptionAcadId = null;
    }

    const existing = await prisma.inscriptionAcademique.findFirst({
      where: {
        candidatId: p.candidatId,
        filiereId: p.filiereId,
        anneeAcademique: p.anneeAcademique,
      },
      select: { id: true, statut: true },
    });

    if (existing) {
      inscriptionAcadId = existing.id;
      if (existing.statut === 'EN_COURS') {
        await prisma.inscriptionAcademique.update({
          where: { id: existing.id },
          data: { statut: 'EN_ATTENTE_QUITTANCE' },
        });
      }
      linked += 1;
    } else {
      const createdRow = await prisma.inscriptionAcademique.create({
        data: {
          candidatId: p.candidatId,
          filiereId: p.filiereId,
          etablissementId: p.etablissementId,
          anneeAcademique: p.anneeAcademique,
          niveau: p.niveau,
          statut: 'EN_ATTENTE_QUITTANCE',
        },
        select: { id: true },
      });
      inscriptionAcadId = createdRow.id;
      created += 1;
    }

    await prisma.preinscriptionEtablissement.update({
      where: { id: p.id },
      data: { inscriptionAcadId },
    });

    console.log(
      `✅ ${p.candidat?.prenom} ${p.candidat?.nom} (${p.candidat?.email}) → ${p.numeroPreinscription}`,
    );
  }

  console.log(`\nCréées: ${created} | Reliées: ${linked}\n`);
  console.log('Ouvre /parcours/dossiers → onglet Inscriptions (ou /parcours/mes-inscriptions)');
  console.log('→ bouton « Soumettre ma quittance bancaire »\n');
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
