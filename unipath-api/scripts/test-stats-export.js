require('dotenv').config();
const fs = require('fs');
const path = require('path');
const statsExportService = require('../src/services/statsExport.service');

const OUT_DIR = path.join(__dirname, '../temp');

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const stats = await statsExportService.collectStats({}, null);
  const dateSlug = new Date().toISOString().slice(0, 10);

  console.log('=== Totaux globaux ===');
  console.log(JSON.stringify(stats.totaux, null, 2));
  console.log(`\nConcours exportés: ${stats.parConcours.length}`);
  console.log(`Établissements: ${stats.parEtablissement.length}`);

  console.log('\n=== Concours avec candidats ===');
  const avecCandidats = stats.parConcours.filter((row) => row.totalCandidats > 0);
  if (avecCandidats.length === 0) {
    console.log('(aucun)');
  }
  for (const row of avecCandidats) {
    console.log(
      `- ${row.libelle} (${row.etablissement}): ${row.totalCandidats} candidats`
      + ` | acceptés ${row.acceptes}, rejetés ${row.rejetes}, attente ${row.enAttente}`,
    );
    if (row.parCentre.length > 0) {
      const top = row.parCentre.map((c) => `${c.nom} (${c.affectes})`).join(', ');
      console.log(`  Centres: ${top}`);
    }
  }

  console.log('\n=== Aperçu par concours (5 premiers) ===');
  for (const row of stats.parConcours.slice(0, 5)) {
    console.log(
      `- ${row.libelle} (${row.etablissement}): ${row.totalCandidats} candidats`
      + ` | acceptés ${row.acceptes}, rejetés ${row.rejetes}, attente ${row.enAttente}`,
    );
    if (row.parCentre.length > 0) {
      const top = row.parCentre.slice(0, 3).map((c) => `${c.nom} (${c.affectes})`).join(', ');
      console.log(`  Centres: ${top}`);
    }
  }
  if (stats.parConcours.length > 5) {
    console.log(`... et ${stats.parConcours.length - 5} autre(s) concours`);
  }

  const xlsxBuffer = await statsExportService.generateExcel(stats);
  const xlsxPath = path.join(OUT_DIR, `stats-inscriptions-${dateSlug}.xlsx`);
  fs.writeFileSync(xlsxPath, Buffer.from(xlsxBuffer));
  console.log(`\n✅ Excel: ${xlsxPath} (${fs.statSync(xlsxPath).size} octets)`);

  const pdfBuffer = await statsExportService.generatePdf(stats);
  const pdfPath = path.join(OUT_DIR, `stats-inscriptions-${dateSlug}.pdf`);
  fs.writeFileSync(pdfPath, pdfBuffer);
  console.log(`✅ PDF: ${pdfPath} (${fs.statSync(pdfPath).size} octets)`);
}

main()
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  });
