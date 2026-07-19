/**
 * Tests unitaires Phase 2 — logique de répartition (sans DB)
 * Usage: node scripts/test-salle-repartition-logic-unit.js
 */
const { compareCandidatsAlpha } = require('../src/utils/numero-inscription.helper');
const { planifierRepartitionSalles } = require('../src/utils/salle.helper');

function ok(name, pass, detail = '') {
  console.log(`${pass ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
  return pass;
}

function main() {
  const results = [];

  const inscriptions = [
    { id: 'z', candidat: { nom: 'Zinsou', prenom: 'Paul' } },
    { id: 'a', candidat: { nom: 'Adjovi', prenom: 'Marie' } },
    { id: 'c', candidat: { nom: 'Clara', prenom: 'Awa' } },
    { id: 'b', candidat: { nom: 'Bello', prenom: 'Jean' } },
  ];
  inscriptions.sort(compareCandidatsAlpha);
  const order = inscriptions.map((i) => i.candidat.nom).join(',');
  results.push(ok('Tri alpha (même helper n° table)', order === 'Adjovi,Bello,Clara,Zinsou', order));

  const salles = [
    { id: 's1', nom: '01-Amphi', capacite: 2 },
    { id: 's2', nom: '02-Labo', capacite: 2 },
  ];
  const plan1 = planifierRepartitionSalles(
    inscriptions.map((i) => ({ id: i.id, nom: i.candidat.nom, prenom: i.candidat.prenom })),
    salles,
  );
  const bySalle = {};
  for (const a of plan1.assignations) {
    bySalle[a.salleNom] = bySalle[a.salleNom] || [];
    bySalle[a.salleNom].push(inscriptions.find((i) => i.id === a.inscriptionId).candidat.nom);
  }
  results.push(ok(
    '1. 4 candidats / 2×2',
    (bySalle['01-Amphi'] || []).join(',') === 'Adjovi,Bello'
      && (bySalle['02-Labo'] || []).join(',') === 'Clara,Zinsou'
      && plan1.nonAssignes.length === 0,
    `Amphi=[${(bySalle['01-Amphi'] || []).join(',')}] Labo=[${(bySalle['02-Labo'] || []).join(',')}]`,
  ));

  const withOverflow = [
    ...inscriptions.map((i) => ({ id: i.id, nom: i.candidat.nom, prenom: i.candidat.prenom })),
    { id: 'k', nom: 'Koffi', prenom: 'Ibrahim' },
    { id: 'm', nom: 'Mba', prenom: 'Lea' },
  ];
  withOverflow.sort((a, b) => compareCandidatsAlpha(
    { candidat: { nom: a.nom, prenom: a.prenom } },
    { candidat: { nom: b.nom, prenom: b.prenom } },
  ));
  const plan2 = planifierRepartitionSalles(withOverflow, salles);
  results.push(ok(
    '2. Surplus sans salle',
    plan2.assignations.length === 4
      && plan2.nonAssignes.length === 2
      && plan2.nonAssignes.every((n) => /capacité/i.test(n.motif)),
    `ass=${plan2.assignations.length} non=${plan2.nonAssignes.length}`,
  ));

  const plan3 = planifierRepartitionSalles(withOverflow, salles);
  const snap = plan2.assignations.map((a) => `${a.inscriptionId}:${a.salleId}`).join('|');
  const snap2 = plan3.assignations.map((a) => `${a.inscriptionId}:${a.salleId}`).join('|');
  results.push(ok('3. Relance idempotente', snap === snap2 && snap.length > 0, `same=${snap === snap2}`));

  // Cohérence : chaque assignation pointe vers une salle de la liste fournie (même centre)
  const salleIds = new Set(salles.map((s) => s.id));
  const coherent = plan2.assignations.every((a) => salleIds.has(a.salleId));
  results.push(ok('4. Salles uniquement du centre fourni', coherent));

  const passed = results.filter(Boolean).length;
  console.log(`\n=== UNIT ${passed}/${results.length} PASS ===`);
  process.exit(passed === results.length ? 0 : 1);
}

main();
