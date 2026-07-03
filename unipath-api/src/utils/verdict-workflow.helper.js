const { formatMotifForClient } = require('./motif.helper');

/**
 * Workflow : 1 examinateur (verdict1) + arbitrage final du contrôleur (decisionControleur).
 * verdict2 est synchronisé avec la décision du contrôleur pour l'affichage « 2/2 ».
 */

function etapesCompletees(dossier) {
  let n = 0;
  if (dossier.verdict1Par) n += 1;
  if (dossier.decisionControleur) n += 1;
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
    motif: formatMotifForClient(dossier.verdict1Motif),
  };
}

function getVerdictControleur(dossier) {
  if (!dossier.decisionControleur) return null;
  return {
    verdict: dossier.decisionControleur,
    par: dossier.decisionControleurPar,
    date: dossier.decisionControleurDate,
    motif: formatMotifForClient(dossier.decisionControleurMotif),
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
  etapesCompletees,
  verdictsDivergents,
  buildDecisionControleurUpdate,
  getVerdictExaminateur,
  getVerdictControleur,
  isArbitrageDivergent,
  VERDICT_LABELS,
};
