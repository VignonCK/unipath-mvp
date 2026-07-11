const { etapesCompletees, verdictsDivergents } = require('./verdict-workflow.helper');
const { formatMotifForClient } = require('./motif.helper');

const REJET_STATUTS = ['REJETE', 'REJETE_PAR_COMMISSION'];
const SOUS_RESERVE_STATUTS = ['SOUS_RESERVE', 'SOUS_RESERVE_PAR_COMMISSION'];

function mapCommentairesFromDossier(dossier) {
  if (!dossier) {
    return {
      commentaireRejet: null,
      commentaireSousReserve: null,
      commentaireControleur: null,
      piecesACorriger: null,
    };
  }

  const statut = dossier.statut;

  return {
    commentaireRejet: REJET_STATUTS.includes(statut)
      ? formatMotifForClient(dossier.commentaireRejet)
      : null,
    commentaireSousReserve: SOUS_RESERVE_STATUTS.includes(statut)
      ? formatMotifForClient(dossier.commentaireSousReserve)
      : null,
    commentaireControleur: formatMotifForClient(dossier.commentaireControleur),
    piecesACorriger: SOUS_RESERVE_STATUTS.includes(statut)
      ? (dossier.piecesACorriger ?? null)
      : null,
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
    piecesACorriger: dossier.piecesACorriger ?? null,
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
