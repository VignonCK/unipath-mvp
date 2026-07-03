const { etapesCompletees, verdictsDivergents } = require('./verdict-workflow.helper');
const { formatMotifForClient } = require('./motif.helper');

function mapCommentairesFromDossier(dossier) {
  if (!dossier) {
    return {
      commentaireRejet: null,
      commentaireSousReserve: null,
      commentaireControleur: null,
    };
  }

  return {
    commentaireRejet: formatMotifForClient(dossier.commentaireRejet),
    commentaireSousReserve: formatMotifForClient(dossier.commentaireSousReserve),
    commentaireControleur: formatMotifForClient(dossier.commentaireControleur),
  };
}

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
    ...mapCommentairesFromDossier(dossier),
    decisionCommissionPar: dossier.decisionCommissionPar,
    decisionCommissionDate: dossier.decisionCommissionDate,
    decisionControleurPar: dossier.decisionControleurPar,
    decisionControleurDate: dossier.decisionControleurDate,
    dossierInscriptionId: dossier.id,
    quittanceUrl: dossier.quittanceUrl,
    piecesExtras: dossier.piecesExtras,
    documentsCompl: dossier.documentsCompl,
    centreCompositionChoisi: dossier.centreCompositionChoisi,
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

module.exports = { mapDossierInscriptionToInscription, mapCommentairesFromDossier };
