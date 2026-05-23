/**
 * Aplatit DossierInscription + Inscription pour compatibilité front legacy.
 */
function mapDossierInscriptionToInscription(dossier) {
  const ins = dossier.inscription;
  const nombreVerdicts = (dossier.verdict1Par ? 1 : 0) + (dossier.verdict2Par ? 1 : 0);
  const verdictsDivergents =
    dossier.verdict1 && dossier.verdict2 && dossier.verdict1 !== dossier.verdict2;

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
      verdict2: dossier.verdict2,
      verdict1Par: dossier.verdict1Par,
      verdict2Par: dossier.verdict2Par,
      nombreVerdicts,
      verdictsDivergents,
      decisionControleur: dossier.decisionControleur,
      decisionControleurDate: dossier.decisionControleurDate,
    },
  };
}

module.exports = { mapDossierInscriptionToInscription };
