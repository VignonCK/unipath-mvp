require('dotenv').config();
const prisma = require('../src/prisma');
const {
  resolveChoixCentre,
  concoursHasCentres,
} = require('../src/utils/centres-composition.helper');

const CENTRES_TEST = {
  centres: [
    {
      ville: 'Cotonou',
      lieux: [
        { nom: 'CEG Gbégamey', adresse: 'Cotonou, Bénin' },
        { nom: 'Collège Notre Dame des Apôtres', adresse: 'Cotonou, Bénin' },
      ],
    },
    {
      ville: 'Parakou',
      lieux: [{ nom: 'IFSIO', adresse: 'Parakou, Bénin' }],
    },
  ],
  publieLe: '2026-07-15T00:00:00.000Z',
  note: 'Test UniPath — centres de composition',
};

const INSCRIPTION_ID = process.argv[2] || '817df7ff-f49c-4532-a286-810f325651ae';

async function main() {
  const inscription = await prisma.inscription.findUnique({
    where: { id: INSCRIPTION_ID },
    include: {
      candidat: { select: { id: true, email: true, nom: true, prenom: true } },
      concours: true,
      dossierInscription: true,
    },
  });

  if (!inscription) {
    console.error('Inscription introuvable:', INSCRIPTION_ID);
    process.exit(1);
  }

  await prisma.concours.update({
    where: { id: inscription.concoursId },
    data: { centresComposition: CENTRES_TEST },
  });

  if (inscription.dossierInscription) {
    await prisma.dossierInscription.update({
      where: { id: inscription.dossierInscription.id },
      data: {
        statut: 'VALIDE_PAR_COMMISSION',
        centreCompositionChoisi: null,
      },
    });
  }

  const refreshed = await prisma.inscription.findUnique({
    where: { id: INSCRIPTION_ID },
    include: {
      candidat: { select: { email: true, nom: true, prenom: true } },
      concours: { select: { id: true, libelle: true, centresComposition: true } },
      dossierInscription: true,
    },
  });

  console.log('OK — concours:', refreshed.concours.libelle);
  console.log('Centres configurés:', concoursHasCentres(refreshed.concours.centresComposition));
  console.log('Statut:', refreshed.dossierInscription.statut);
  console.log('Candidat:', refreshed.candidat.email);

  const resolved = resolveChoixCentre(refreshed.concours.centresComposition, {
    ville: 'Cotonou',
    nom: 'CEG Gbégamey',
  });
  console.log('Validation choix test:', resolved.valid ? resolved.data : resolved.error);

  console.log('\n→ Connectez-vous avec', refreshed.candidat.email);
  console.log('→ Ouvrez /inscription/' + INSCRIPTION_ID);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
