/**
 * Génère une fiche PDF de test et affiche le centre injecté.
 * Usage: node scripts/test-fiche-centre-pdf.js [email]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const {
  DOSSIER_CENTRE_INCLUDE,
  enrichDossierInscriptionForPdf,
} = require('../src/utils/centres-composition.helper');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'bkoussedoh@gmail.com';
  const candidat = await prisma.candidat.findUnique({
    where: { email },
    include: { dossier: { select: { photo: true } } },
  });
  if (!candidat) throw new Error('Candidat introuvable');

  const inscription = await prisma.inscription.findFirst({
    where: { candidatId: candidat.id },
    include: {
      concours: true,
      dossierInscription: { include: DOSSIER_CENTRE_INCLUDE },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!inscription) throw new Error('Inscription introuvable');

  const dossierEnrichi = enrichDossierInscriptionForPdf(inscription.dossierInscription);
  const centre = dossierEnrichi?.centreCompositionChoisi;
  console.log('Centre en base / payload:', centre);

  const tmpDir = path.join(__dirname, '../tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const input = path.join(tmpDir, `test_fiche_centre_${Date.now()}.json`);
  const output = path.join(tmpDir, `test_fiche_centre_${Date.now()}.pdf`);

  fs.writeFileSync(input, JSON.stringify({
    candidat: { ...candidat, photoPath: candidat.dossier?.photo || '' },
    concours: inscription.concours,
    numeroDossier: inscription.numeroInscription || inscription.id.slice(0, 8),
    centreCompositionChoisi: centre || null,
    inscription: {
      id: inscription.id,
      numeroInscription: inscription.numeroInscription,
      dossierInscription: dossierEnrichi,
    },
    statut: inscription.dossierInscription?.statut,
  }));

  const php = path.join(__dirname, '../php/fiche-preinscription.php');
  execSync(`php "${php}" "${input}" "${output}"`, { stdio: 'inherit' });
  console.log('PDF généré:', output);
  fs.unlinkSync(input);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
