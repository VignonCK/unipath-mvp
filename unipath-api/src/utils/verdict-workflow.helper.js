/**
 * Workflow : 1 examinateur (verdict1) + arbitrage contrôleur seulement si REJETE / SOUS_RESERVE.
 * VALIDE par l'examinateur = décision finale (pas d'étape contrôleur).
 * verdict2 est synchronisé avec la décision du contrôleur pour l'affichage « 2/2 ».
 */

function dossierValideParExaminateur(dossier) {
  return dossier.statut === 'VALIDE'
    && dossier.verdict1 === 'VALIDE'
    && !dossier.decisionControleur;
}

/** Arbitrage contrôleur requis uniquement après rejet ou sous-réserve examinateur. */
function necessiteArbitrageControleur(dossier) {
  return !!(
    dossier.verdict1Par
    && ['REJETE', 'SOUS_RESERVE'].includes(dossier.verdict1)
    && !dossier.decisionControleur
  );
}

function etapesCompletees(dossier) {
  let n = 0;
  if (dossier.verdict1Par) n += 1;
  if (dossier.decisionControleur || dossierValideParExaminateur(dossier)) n += 1;
  return n;
}

function verdictsDivergents(dossier) {
  return !!(
    dossier.verdict1 &&
    dossier.decisionControleur &&
    dossier.verdict1 !== dossier.decisionControleur
  );
}

function buildDecisionControleurUpdate(controleurId, decision, motif) {
  const now = new Date();
  return {
    decisionControleurPar: controleurId,
    decisionControleur: decision,
    decisionControleurMotif: motif,
    decisionControleurDate: now,
    verdict2Par: controleurId,
    verdict2: decision,
    verdict2Motif: motif,
    verdict2Date: now,
  };
}

function getVerdictExaminateur(dossier) {
  if (!dossier.verdict1Par) return null;
  return {
    verdict: dossier.verdict1,
    par: dossier.verdict1Par,
    date: dossier.verdict1Date,
    motif: dossier.verdict1Motif,
  };
}

function getVerdictControleur(dossier) {
  if (!dossier.decisionControleur) return null;
  return {
    verdict: dossier.decisionControleur,
    par: dossier.decisionControleurPar,
    date: dossier.decisionControleurDate,
    motif: dossier.decisionControleurMotif,
  };
}

function isArbitrageDivergent(verdictExaminateur, decisionControleur) {
  return !!(verdictExaminateur && decisionControleur && verdictExaminateur !== decisionControleur);
}

const VERDICT_LABELS = {
  VALIDE: 'Validé',
  REJETE: 'Rejeté',
  SOUS_RESERVE: 'Sous réserve',
};

module.exports = {
  dossierValideParExaminateur,
  necessiteArbitrageControleur,
  etapesCompletees,
  verdictsDivergents,
  buildDecisionControleurUpdate,
  getVerdictExaminateur,
  getVerdictControleur,
  isArbitrageDivergent,
  VERDICT_LABELS,
};
