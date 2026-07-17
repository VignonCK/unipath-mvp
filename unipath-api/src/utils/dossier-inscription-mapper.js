const { etapesCompletees, verdictsDivergents } = require('./verdict-workflow.helper');

/**
 * Aplatit DossierInscription + Inscription pour compatibilité front legacy.
 */
function mapDossierInscriptionToInscription(dossier) {
  const ins = dossier.inscription;
  const nombreVerdicts = etapesCompletees(dossier);
  const divergent = verdictsDivergents(dossier);

  return {
    ...ins,
    statut: dossier.statut,
    commentaireRejet: dossier.commentaireRejet,
    commentaireSousReserve: dossier.commentaireSousReserve,
    commentaireControleur: dossier.commentaireControleur,
    decisionCommissionPar: dossier.decisionCommissionPar,
    decisionCommissionDate: dossier.decisionCommissionDate,
    decisionControleurPar: dossier.decisionControleurPar,
    decisionControleurDate: dossier.decisionControleurDate,
    dossierInscriptionId: dossier.id,
    quittanceUrl: dossier.quittanceUrl,
    piecesExtras: dossier.piecesExtras,
    doubleVerdict: {
      verdict1: dossier.verdict1,
      verdict2: dossier.decisionControleur,
      verdict1Par: dossier.verdict1Par,
      verdict2Par: dossier.decisionControleurPar,
      nombreVerdicts,
      verdictsDivergents: divergent,
      decisionControleur: dossier.decisionControleur,
      decisionControleurDate: dossier.decisionControleurDate,
    },
  };
}

module.exports = { mapDossierInscriptionToInscription };
