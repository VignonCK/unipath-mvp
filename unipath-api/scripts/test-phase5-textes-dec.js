/**
 * Phase 5 — vérifie textes M1 (DEC) + profil dec@test.com
 * Usage: node scripts/test-phase5-textes-dec.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ROOT = path.join(__dirname, '..');

function ok(name, pass, detail) {
  console.log(`${pass ? '✅' : '❌'} ${name}`);
  console.log(`   ${detail}`);
  return pass;
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

async function main() {
  const results = [];

  const pdfService = read('src/services/pdf.service.js');
  const emailHelper = read('src/utils/email-decision.helper.js');
  const pdfCtrl = read('src/controllers/pdf.controller.js');

  results.push(
    ok(
      '1. Message n° de table / convocation → DEC (pdf.service)',
      pdfService.includes('par la DEC') && !pdfService.includes('par la DGES'),
      'pdf.service.js',
    ),
  );
  results.push(
    ok(
      '1b. Message n° de table → DEC (email-decision.helper)',
      emailHelper.includes('par la DEC') && !emailHelper.includes('par la DGES'),
      'email-decision.helper.js',
    ),
  );
  results.push(
    ok(
      '2. Erreur PDF controller → DEC',
      pdfCtrl.includes('par la DEC') && !pdfCtrl.includes('par la DGES'),
      'pdf.controller.js',
    ),
  );

  const msg =
    "Le numéro de table n'a pas encore été attribué. La convocation sera disponible après génération des numéros par la DEC.";
  results.push(
    ok(
      '2b. Texte exact email/PDF (extrait)',
      pdfService.includes(msg) && emailHelper.includes(msg),
      msg,
    ),
  );

  const frontRoot = path.join(ROOT, '../unipath-front/src/pages');
  const detailInsc = fs.readFileSync(path.join(frontRoot, 'DetailInscription.jsx'), 'utf8');
  const detailConc = fs.readFileSync(path.join(frontRoot, 'DetailConcours.jsx'), 'utf8');
  results.push(
    ok(
      '2c. UI candidat n° de table → DEC',
      detailInsc.includes('par la DEC') &&
        detailConc.includes('par la DEC') &&
        !detailInsc.includes("attribution par la commission") &&
        !detailConc.includes("attribution par la commission"),
      'DetailInscription + DetailConcours',
    ),
  );

  const dec = await prisma.administrateurDEC.findUnique({
    where: { email: 'dec@test.com' },
    select: { nom: true, prenom: true, role: true, email: true },
  });
  results.push(
    ok(
      '3. Profil dec@test.com = Adjo Mensah / DEC',
      dec?.role === 'DEC' && dec?.prenom === 'Adjo' && dec?.nom === 'Mensah',
      JSON.stringify(dec),
    ),
  );

  const readmePath = path.resolve(ROOT, '../docs/DEC-VS-DGES.md');
  results.push(
    ok(
      '4. docs/DEC-VS-DGES.md présent',
      fs.existsSync(readmePath),
      readmePath,
    ),
  );

  const allOk = results.every(Boolean);
  console.log(allOk ? '\n✅ Phase 5 textes/profil OK\n' : '\n❌ Échecs Phase 5\n');
  process.exit(allOk ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
