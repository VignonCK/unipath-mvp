/**
 * Seed UE pour École Supérieure de Management et d'Administration
 * (même règle : 6 UE / semestre, Licence S1–S6, Master S7–S10)
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const ETAB_NAME = "École Supérieure de Management et d'Administration";
const UE_PER_SEMESTRE = 6;
const TAG = 'SEED-UE';

const LIBELLES = [
  'Fondamentaux',
  'Méthodologie',
  'Applications pratiques',
  'Projet tutoré',
  'Communication professionnelle',
  'Évaluation et synthèse',
];

function anneesPourFiliere(filiere) {
  const duree = Math.min(Math.max(Number(filiere.dureeAnnees) || 3, 1), 5);
  const isMaster =
    filiere.niveau === 'MASTER'
    || String(filiere.code || '').toUpperCase().endsWith('-M');

  if (isMaster) {
    const start = 6 - duree;
    return Array.from({ length: duree }, (_, i) => start + i);
  }
  return Array.from({ length: duree }, (_, i) => i + 1);
}

function semestresPourAnnee(a) {
  return [2 * a - 1, 2 * a];
}

(async () => {
  const etab = await p.etablissement.findFirst({
    where: { nom: { contains: 'Management et d\'Administration' } },
    select: {
      id: true,
      nom: true,
      filieres: {
        select: { id: true, nom: true, code: true, dureeAnnees: true, niveau: true },
      },
    },
  });

  if (!etab) {
    console.error('Établissement introuvable:', ETAB_NAME);
    process.exit(1);
  }

  const filiereIds = etab.filieres.map((f) => f.id);
  const deleted = await p.uniteEnseignement.deleteMany({
    where: {
      filiereId: { in: filiereIds },
      code: { startsWith: `${TAG}-` },
    },
  });

  let created = 0;
  const filieresSummary = [];

  for (const filiere of etab.filieres) {
    const annees = anneesPourFiliere(filiere);
    let count = 0;
    for (const anneeEtude of annees) {
      for (const semestre of semestresPourAnnee(anneeEtude)) {
        for (let i = 1; i <= UE_PER_SEMESTRE; i++) {
          const code = `${TAG}-S${semestre}-${String(i).padStart(2, '0')}-${filiere.code}`.slice(0, 191);
          await p.uniteEnseignement.create({
            data: {
              filiereId: filiere.id,
              code,
              libelle: `${LIBELLES[i - 1]} S${semestre}`,
              credits: i <= 4 ? 3 : 2,
              semestre,
              anneeEtude,
              ordre: i,
            },
          });
          created += 1;
          count += 1;
        }
      }
    }
    filieresSummary.push({
      filiere: filiere.nom,
      code: filiere.code,
      niveau: filiere.niveau,
      annees,
      ueCreated: count,
    });
  }

  console.log(JSON.stringify({
    etab: etab.nom,
    deletedPrevious: deleted.count,
    created,
    filieres: filieresSummary,
  }, null, 2));

  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
