require('dotenv').config();
const ExcelJS = require('exceljs');
const prisma = require('../src/prisma');
const { parseStatsFilters } = require('../src/utils/stats-filters.helper');
const statsExportService = require('../src/services/statsExport.service');

function mapJsonTotaux(stats) {
  return {
    total_inscrits: stats.totaux.totalCandidats,
    total_valides: stats.totaux.acceptes,
    total_rejetes: stats.totaux.rejetes,
    total_attente: stats.totaux.enAttente,
  };
}

async function sumExcelSynth(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.getWorksheet('Synthèse concours');
  let total = 0;
  let acceptes = 0;
  let rejetes = 0;
  let attente = 0;
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    total += Number(row.getCell(3).value) || 0;
    acceptes += Number(row.getCell(4).value) || 0;
    rejetes += Number(row.getCell(5).value) || 0;
    attente += Number(row.getCell(6).value) || 0;
  });
  return { total_inscrits: total, total_valides: acceptes, total_rejetes: rejetes, total_attente: attente };
}

async function runCase(label, query) {
  const filters = parseStatsFilters(query);
  const stats = await statsExportService.collectStats(filters, null);
  const excelBuffer = await statsExportService.generateExcel(stats);
  const excelTotaux = await sumExcelSynth(excelBuffer);
  const jsonTotaux = mapJsonTotaux(stats);

  const metaOk = Object.entries(query).every(([key, value]) => {
    if (!value) return stats.meta.filters[key] == null;
    return String(stats.meta.filters[key]).toLowerCase() === String(value).toLowerCase();
  });

  const numbersOk = excelTotaux.total_inscrits === jsonTotaux.total_inscrits
    && excelTotaux.total_valides === jsonTotaux.total_valides
    && excelTotaux.total_rejetes === jsonTotaux.total_rejetes
    && excelTotaux.total_attente === jsonTotaux.total_attente;

  console.log(`\n=== ${label} ===`);
  console.log('Query:', query);
  console.log('meta.filters:', JSON.stringify(stats.meta.filters));
  console.log('JSON totaux:', jsonTotaux);
  console.log('Excel totaux:', excelTotaux);
  console.log('meta.filters OK:', metaOk ? 'OUI' : 'NON');
  console.log('JSON = Excel:', numbersOk ? 'OUI' : 'NON');

  if (!metaOk || !numbersOk) {
    process.exitCode = 1;
  }

  return { stats, filters };
}

async function discoverSamples() {
  const rows = await prisma.inscription.findMany({
    include: {
      candidat: { select: { sexe: true } },
      dossierInscription: {
        include: {
          centreChoisi: { select: { centreId: true } },
        },
      },
      concours: { select: { id: true, etablissementId: true } },
    },
    take: 20,
  });

  const withSexe = rows.find((r) => r.candidat?.sexe);
  const withCentre = rows.find((r) => r.dossierInscription?.centreChoisi?.centreId);
  const withValide = rows.find((r) => r.dossierInscription?.statut === 'VALIDE');

  return {
    sexe: withSexe?.candidat?.sexe || 'M',
    centreId: withCentre?.dossierInscription?.centreChoisi?.centreId,
    concoursId: withCentre?.concoursId || withSexe?.concoursId,
    etablissementId: withCentre?.concours?.etablissementId || withSexe?.concours?.etablissementId,
    hasCentre: Boolean(withCentre),
  };
}

async function main() {
  const samples = await discoverSamples();
  console.log('Échantillons DB:', samples);

  const baseline = await runCase('Baseline (aucun filtre)', {});

  if (samples.sexe) {
    await runCase('Filtre sexe seul', { sexe: samples.sexe });
  }

  await runCase('Filtre statut seul (accepte)', { statut: 'accepte' });
  await runCase('Filtre statut seul (attente)', { statut: 'attente' });

  if (samples.centreId) {
    await runCase('Filtre centreId seul', { centreId: samples.centreId });
  } else {
    console.log('\n⚠ Aucun centreId en base — test centreId ignoré');
  }

  if (samples.concoursId) {
    await runCase('Filtre concoursId seul', { concoursId: samples.concoursId });
  }

  if (samples.etablissementId) {
    await runCase('Filtre etablissementId seul', { etablissementId: samples.etablissementId });
  }

  const combined = {};
  if (samples.sexe) combined.sexe = samples.sexe;
  combined.statut = 'accepte';
  if (samples.centreId) combined.centreId = samples.centreId;
  await runCase('Filtres combinés (sexe + statut + centre)', combined);

  try {
    parseStatsFilters({ sexe: 'X' });
    console.log('\n❌ sexe invalide aurait dû échouer');
    process.exitCode = 1;
  } catch (err) {
    console.log('\n✅ sexe invalide rejeté:', err.message);
  }

  console.log(`\n${process.exitCode === 1 ? '❌' : '✅'} Tests filtres terminés`);
}

main()
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
