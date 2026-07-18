/**
 * Phase B — n° de table format YY+codeVille+codeFiliere+seq (par centre)
 *
 * Usage: node scripts/test-phase-b-numeros-table.js
 *
 * Crée un concours isolé + centres + candidats, exécute les 6 scénarios, nettoie.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const {
  attribuerNumerosTableParConcours,
  NUMERO_TABLE_REGEX,
} = require('../src/utils/numero-inscription.helper');

const prisma = new PrismaClient();
const stamp = Date.now();

function ok(name, pass, detail = '') {
  console.log(`${pass ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
  return pass;
}

async function createCandidat(nom, prenom, suffix) {
  return prisma.candidat.create({
    data: {
      matricule: `TST-B-${stamp}-${suffix}`,
      nom,
      prenom,
      email: `phaseb.${stamp}.${suffix}@test.local`,
    },
  });
}

async function createInscriptionValide({ candidatId, concoursId, concoursCentreId = null }) {
  return prisma.inscription.create({
    data: {
      candidatId,
      concoursId,
      dossierInscription: {
        create: {
          statut: 'VALIDE',
          ...(concoursCentreId ? { concoursCentreId } : {}),
        },
      },
    },
    include: {
      candidat: { select: { nom: true, prenom: true } },
      dossierInscription: { select: { id: true, concoursCentreId: true } },
    },
  });
}

async function runAttrib(concoursId) {
  return prisma.$transaction(
    (tx) => attribuerNumerosTableParConcours(tx, concoursId),
    { maxWait: 15_000, timeout: 60_000 },
  );
}

async function main() {
  const results = [];
  const cleanup = {
    inscriptionIds: [],
    candidatIds: [],
    concoursCentreIds: [],
    centreIds: [],
    concoursId: null,
  };

  console.log('\n=== Phase B — setup isolé ===\n');

  try {
    const concours = await prisma.concours.create({
      data: {
        libelle: `TEST PHASE B NUMEROS ${stamp}`,
        etablissement: 'EPAC',
        codeFiliere: '40',
        sigle: 'EPAC',
        dateDebut: new Date('2026-01-01'),
        dateFin: new Date('2026-12-31'),
        dateDebutDepot: new Date('2026-01-01'),
        dateFinDepot: new Date('2026-06-01'),
        dateDebutComposition: new Date('2026-07-01'),
        dateFinComposition: new Date('2026-07-05'),
        fraisParticipation: 5000,
        seriesAcceptees: ['C'],
      },
    });
    cleanup.concoursId = concours.id;

    const centreA = await prisma.centreComposition.create({
      data: {
        nom: `Centre PhaseB Cotonou ${stamp}`,
        ville: 'Cotonou',
        codeVille: '01',
        adresse: 'Test A',
      },
    });
    const centreB = await prisma.centreComposition.create({
      data: {
        nom: `Centre PhaseB Parakou ${stamp}`,
        ville: 'Parakou',
        codeVille: '14',
        adresse: 'Test B',
      },
    });
    const centreSansCode = await prisma.centreComposition.create({
      data: {
        nom: `Centre PhaseB SansCode ${stamp}`,
        ville: 'Abomey',
        adresse: 'Test sans code',
      },
    });
    cleanup.centreIds.push(centreA.id, centreB.id, centreSansCode.id);

    const annee = '2025-2026';
    const linkA = await prisma.concourscentreComposition.create({
      data: {
        concoursId: concours.id,
        centreId: centreA.id,
        anneeAcademique: annee,
        estActif: true,
      },
    });
    const linkB = await prisma.concourscentreComposition.create({
      data: {
        concoursId: concours.id,
        centreId: centreB.id,
        anneeAcademique: annee,
        estActif: true,
      },
    });
    const linkSans = await prisma.concourscentreComposition.create({
      data: {
        concoursId: concours.id,
        centreId: centreSansCode.id,
        anneeAcademique: annee,
        estActif: true,
      },
    });
    cleanup.concoursCentreIds.push(linkA.id, linkB.id, linkSans.id);

    // Centre A (codeVille 01) — ordre alpha attendu : Adjovi, Houngbo, Zinsou
    const cA1 = await createCandidat('Zinsou', 'Paul', 'a1');
    const cA2 = await createCandidat('Adjovi', 'Marie', 'a2');
    const cA3 = await createCandidat('Houngbo', 'Jean', 'a3');
    // Centre B (codeVille 14) — ordre : Bello puis Koffi
    const cB1 = await createCandidat('Koffi', 'Awa', 'b1');
    const cB2 = await createCandidat('Bello', 'Ibrahim', 'b2');
    // Sans centre
    const cSansCentre = await createCandidat('Orphelin', 'Centre', 'sc');
    // Centre sans codeVille
    const cSansCode = await createCandidat('Sanscode', 'Ville', 'sv');

    cleanup.candidatIds.push(
      cA1.id, cA2.id, cA3.id, cB1.id, cB2.id, cSansCentre.id, cSansCode.id,
    );

    const insA = [];
    for (const c of [cA1, cA2, cA3]) {
      const ins = await createInscriptionValide({
        candidatId: c.id,
        concoursId: concours.id,
        concoursCentreId: linkA.id,
      });
      insA.push(ins);
      cleanup.inscriptionIds.push(ins.id);
    }
    const insB = [];
    for (const c of [cB1, cB2]) {
      const ins = await createInscriptionValide({
        candidatId: c.id,
        concoursId: concours.id,
        concoursCentreId: linkB.id,
      });
      insB.push(ins);
      cleanup.inscriptionIds.push(ins.id);
    }
    const insSansCentre = await createInscriptionValide({
      candidatId: cSansCentre.id,
      concoursId: concours.id,
      concoursCentreId: null,
    });
    cleanup.inscriptionIds.push(insSansCentre.id);

    const insSansCode = await createInscriptionValide({
      candidatId: cSansCode.id,
      concoursId: concours.id,
      concoursCentreId: linkSans.id,
    });
    cleanup.inscriptionIds.push(insSansCode.id);

    console.log(`Concours ${concours.id} (codeFiliere=40, YY=26)`);
    console.log(`Centre A codeVille=01 (${linkA.id}) — 3 candidats`);
    console.log(`Centre B codeVille=14 (${linkB.id}) — 2 candidats`);
    console.log('Sans centre + centre sans codeVille — 2 exclus attendus\n');

    // ——— Batch 1 ———
    console.log('=== Batch 1 ===');
    const batch1 = await runAttrib(concours.id);
    console.log(`Attribués (${batch1.attribues.length}):`);
    for (const r of batch1.attribues) {
      console.log(`  ${r.numeroInscription} → ${r.nom} ${r.prenom} [${r.centreNom}]`);
    }
    console.log(`Exclus (${batch1.exclus.length}):`);
    for (const e of batch1.exclus) {
      console.log(`  ${e.nom} ${e.prenom} — ${e.motif}`);
    }

    const numsA = batch1.attribues
      .filter((r) => r.codeVille === '01')
      .map((r) => r.numeroInscription);
    const numsB = batch1.attribues
      .filter((r) => r.codeVille === '14')
      .map((r) => r.numeroInscription);

    // Test 1 — séquences indépendantes par centre
    const seqA = numsA.map((n) => n.slice(6));
    const seqB = numsB.map((n) => n.slice(6));
    results.push(
      ok(
        '1. Séquences indépendantes par centre',
        seqA.join(',') === '001,002,003' && seqB.join(',') === '001,002',
        `A=[${seqA}] B=[${seqB}]`,
      ),
    );

    // Test 2 — ordre alpha dans chaque centre
    const nomsA = batch1.attribues.filter((r) => r.codeVille === '01').map((r) => r.nom);
    const nomsB = batch1.attribues.filter((r) => r.codeVille === '14').map((r) => r.nom);
    results.push(
      ok(
        '2. Ordre alphabétique dans chaque centre',
        nomsA.join(',') === 'Adjovi,Houngbo,Zinsou' && nomsB.join(',') === 'Bello,Koffi',
        `A=[${nomsA}] B=[${nomsB}]`,
      ),
    );

    // Test 3 — sans centre
    const excluSansCentre = batch1.exclus.find((e) => e.inscriptionId === insSansCentre.id);
    results.push(
      ok(
        '3. VALIDE sans centre → exclu + motif',
        Boolean(excluSansCentre)
          && /centre/i.test(excluSansCentre.motif)
          && batch1.attribues.every((a) => a.inscriptionId !== insSansCentre.id),
        excluSansCentre?.motif || 'absent',
      ),
    );

    // Test 4 — centre sans codeVille
    const excluSansCode = batch1.exclus.find((e) => e.inscriptionId === insSansCode.id);
    results.push(
      ok(
        '4. Centre sans codeVille → exclu + message clair',
        Boolean(excluSansCode)
          && /codeVille/i.test(excluSansCode.motif)
          && /SansCode|Abomey/i.test(excluSansCode.motif),
        excluSansCode?.motif || 'absent',
      ),
    );

    // Test 6 — format 9 chiffres (fait ici ; test 5 = append après)
    const formatOk = batch1.attribues.every(
      (r) => NUMERO_TABLE_REGEX.test(r.numeroInscription) && r.numeroInscription.length === 9,
    );
    const sampleA = numsA[0];
    const sampleB = numsB[0];
    results.push(
      ok(
        '6. Format exact 9 chiffres (ex. 260140001 / 261440001)',
        formatOk
          && sampleA === '260140001'
          && sampleB === '261440001'
          && numsA[1] === '260140002'
          && numsA[2] === '260140003'
          && numsB[1] === '261440002',
        `samples A0=${sampleA} B0=${sampleB}`,
      ),
    );

    // ——— Test 5 APPEND ———
    console.log('\n=== Batch 2 (APPEND sur centre A) ===');
    const cAppend = await createCandidat('Bernard', 'Late', 'ap');
    cleanup.candidatIds.push(cAppend.id);
    const insAppend = await createInscriptionValide({
      candidatId: cAppend.id,
      concoursId: concours.id,
      concoursCentreId: linkA.id,
    });
    cleanup.inscriptionIds.push(insAppend.id);

    const batch2 = await runAttrib(concours.id);
    console.log(`Attribués (${batch2.attribues.length}):`);
    for (const r of batch2.attribues) {
      console.log(`  ${r.numeroInscription} → ${r.nom} ${r.prenom}`);
    }

    const appendNum = batch2.attribues.find((a) => a.inscriptionId === insAppend.id)?.numeroInscription;
    results.push(
      ok(
        '5. Append tardif centre A → 260140004 (pas global, pas centre B)',
        batch2.attribues.length === 1 && appendNum === '260140004',
        `got=${appendNum}, n=${batch2.attribues.length}`,
      ),
    );

    // Idempotence rapide
    const batch3 = await runAttrib(concours.id);
    results.push(
      ok('Bonus. Batch vide si plus rien à numéroter', batch3.attribues.length === 0 && batch3.exclus.length === 2, `attr=${batch3.attribues.length} excl=${batch3.exclus.length}`),
    );

    // Vérif DB : exclus toujours sans numéro
    const dbExclus = await prisma.inscription.findMany({
      where: { id: { in: [insSansCentre.id, insSansCode.id] } },
      select: { id: true, numeroInscription: true },
    });
    results.push(
      ok(
        'Bonus. Exclus restent sans numeroInscription',
        dbExclus.every((r) => r.numeroInscription == null),
      ),
    );
  } finally {
    console.log('\n=== Cleanup ===');
    if (cleanup.inscriptionIds.length) {
      await prisma.inscription.deleteMany({ where: { id: { in: cleanup.inscriptionIds } } });
    }
    if (cleanup.candidatIds.length) {
      await prisma.candidat.deleteMany({ where: { id: { in: cleanup.candidatIds } } });
    }
    if (cleanup.concoursCentreIds.length) {
      await prisma.concourscentreComposition.deleteMany({
        where: { id: { in: cleanup.concoursCentreIds } },
      });
    }
    if (cleanup.centreIds.length) {
      await prisma.centreComposition.deleteMany({ where: { id: { in: cleanup.centreIds } } });
    }
    if (cleanup.concoursId) {
      await prisma.concours.delete({ where: { id: cleanup.concoursId } }).catch(() => {});
    }
    console.log('Fixtures Phase B supprimées.');
  }

  const passed = results.filter(Boolean).length;
  console.log(`\n=== Résultat Phase B : ${passed}/${results.length} ===`);
  process.exit(passed === results.length ? 0 : 1);
}

main()
  .catch((err) => {
    console.error('❌ Phase B échouée:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
