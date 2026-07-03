const CORRECTION_ACTIONS = [
  'PIECE_BASE_MISE_A_JOUR',
  'QUITTANCE_AJOUTEE',
  'PIECE_EXTRA_AJOUTEE',
  'CORRECTION_PIECE_SOUS_RESERVE',
];

const RESOUMIS_ACTION = 'DOSSIER_RESOUMIS_CANDIDAT';

const ACTIVITE_CANDIDAT_ACTIONS = [...CORRECTION_ACTIONS, RESOUMIS_ACTION];

const STATUTS_SOUS_RESERVE_ACTIF = ['SOUS_RESERVE'];
const STATUTS_SOUS_RESERVE_EN_COURS = ['SOUS_RESERVE', 'SOUS_RESERVE_PAR_COMMISSION'];

function isStatutSousReserveActif(statut) {
  return STATUTS_SOUS_RESERVE_ACTIF.includes(statut);
}

function isStatutSousReserveEnCours(statut) {
  return STATUTS_SOUS_RESERVE_EN_COURS.includes(statut);
}

function parseHistorique(historiqueStatuts) {
  if (Array.isArray(historiqueStatuts)) return historiqueStatuts;
  return [];
}

/**
 * Date à partir de laquelle une correction de pièce est attendue (décision sous réserve).
 */
function getDateDecisionSousReserve(dossier) {
  if (!dossier) return null;

  if (isStatutSousReserveActif(dossier.statut) && dossier.decisionControleurDate) {
    return new Date(dossier.decisionControleurDate);
  }

  if (dossier.statut === 'SOUS_RESERVE_PAR_COMMISSION' && dossier.decisionCommissionDate) {
    return new Date(dossier.decisionCommissionDate);
  }

  const dates = [dossier.decisionControleurDate, dossier.decisionCommissionDate]
    .filter(Boolean)
    .map((d) => new Date(d).getTime());

  if (dates.length > 0) {
    return new Date(Math.max(...dates));
  }

  const historique = parseHistorique(dossier.historiqueStatuts);
  const entreesSousReserve = historique
    .filter((e) => ['SOUS_RESERVE', 'SOUS_RESERVE_PAR_COMMISSION'].includes(e?.statut) && e?.date)
    .map((e) => new Date(e.date).getTime());

  if (entreesSousReserve.length === 0) return null;
  return new Date(Math.max(...entreesSousReserve));
}

async function hasCorrectionApresSousReserve(prisma, dossierInscriptionId, dossier) {
  if (!isStatutSousReserveActif(dossier?.statut)) {
    return false;
  }

  const since = getDateDecisionSousReserve(dossier);
  if (!since) return false;

  const correction = await prisma.actionHistory.findFirst({
    where: {
      dossierInscriptionId,
      typeAction: { in: CORRECTION_ACTIONS },
      timestamp: { gte: since },
    },
    select: { id: true },
  });

  return Boolean(correction);
}

function getInfoResoumissionCandidat(dossier) {
  const hist = parseHistorique(dossier?.historiqueStatuts);
  const entrees = hist.filter((e) =>
    String(e.commentaire || '').toLowerCase().includes('resoumission')
  );
  const derniere = entrees.length > 0 ? entrees[entrees.length - 1] : null;

  return {
    resoumis: Boolean(derniere),
    date: derniere?.date ?? null,
    commentaire: derniere?.commentaire ?? null,
    enAttenteNouvelleDecision: Boolean(
      dossier?.statut === 'EN_ATTENTE'
      && !dossier?.decisionControleur
      && derniere,
    ),
  };
}

function formatActiviteCandidat(action) {
  const labels = {
    [RESOUMIS_ACTION]: 'Dossier resoumis par le candidat',
    PIECE_BASE_MISE_A_JOUR: 'Pièce de base remplacée',
    QUITTANCE_AJOUTEE: 'Quittance remplacée',
    PIECE_EXTRA_AJOUTEE: 'Pièce spécifique remplacée',
    CORRECTION_PIECE_SOUS_RESERVE: 'Pièce corrigée (sous réserve)',
  };
  return labels[action?.typeAction] || action?.typeAction || 'Action';
}

function getActiviteCandidatRecente(actionHistory, limite = 8) {
  if (!Array.isArray(actionHistory)) return [];

  return actionHistory
    .filter((a) => ACTIVITE_CANDIDAT_ACTIONS.includes(a.typeAction))
    .slice(0, limite)
    .map((a) => ({
      typeAction: a.typeAction,
      label: formatActiviteCandidat(a),
      date: a.timestamp || a.createdAt,
      details: a.details ?? null,
    }));
}

module.exports = {
  CORRECTION_ACTIONS,
  RESOUMIS_ACTION,
  ACTIVITE_CANDIDAT_ACTIONS,
  STATUTS_SOUS_RESERVE_ACTIF,
  STATUTS_SOUS_RESERVE_EN_COURS,
  isStatutSousReserveActif,
  isStatutSousReserveEnCours,
  getDateDecisionSousReserve,
  hasCorrectionApresSousReserve,
  getInfoResoumissionCandidat,
  getActiviteCandidatRecente,
};
