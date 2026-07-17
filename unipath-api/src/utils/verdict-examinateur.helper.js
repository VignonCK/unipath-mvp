/**
 * Règles métier : un seul examinateur par dossier (verdict1).
 * - VALIDE examinateur → décision finale (pas d'arbitrage contrôleur)
 * - REJETE / SOUS_RESERVE → arbitrage contrôleur requis
 */

function dossierValideParExaminateur(dossier) {
  return dossier.statut === 'VALIDE'
    && dossier.verdict1 === 'VALIDE'
    && !dossier.decisionControleur;
}

function dossierVerrouilleParControleur(dossier) {
  return !!(dossier.decisionControleurPar || dossier.decisionControleur);
}

function dossierVerrouillePourExaminateur(dossier) {
  return dossierVerrouilleParControleur(dossier) || dossierValideParExaminateur(dossier);
}

function getMonNumeroVerdict(dossier, examinateurId) {
  if (dossier.verdict1Par === examinateurId) return 1;
  return null;
}

function assertExaminateurPeutRendreVerdict(dossier, examinateurId) {
  if (dossierVerrouillePourExaminateur(dossier)) {
    return {
      ok: false,
      error: dossierValideParExaminateur(dossier)
        ? 'Ce dossier est déjà validé définitivement.'
        : 'Ce dossier est verrouillé : la décision du contrôleur a déjà été rendue.',
    };
  }
  if (getMonNumeroVerdict(dossier, examinateurId)) {
    return { ok: false, error: 'Vous avez déjà rendu votre verdict sur ce dossier.' };
  }
  if (dossier.verdict1Par) {
    return {
      ok: false,
      error: 'Ce dossier a déjà été évalué par un examinateur. Seul le contrôleur peut intervenir.',
    };
  }
  return { ok: true, slot: 1 };
}

function assertExaminateurPeutModifierSonVerdict(dossier, examinateurId) {
  if (dossierVerrouillePourExaminateur(dossier)) {
    return {
      ok: false,
      error: dossierValideParExaminateur(dossier)
        ? 'Ce dossier est déjà validé définitivement et ne peut plus être modifié.'
        : 'Ce dossier est verrouillé : seul le contrôleur peut modifier les verdicts.',
    };
  }
  if (dossier.verdict1Par !== examinateurId) {
    return {
      ok: false,
      error: "Vous n'avez pas rendu de verdict sur ce dossier.",
    };
  }
  if (dossier.verdict1ModifieCount >= 1) {
    return {
      ok: false,
      error: 'Vous avez déjà modifié votre verdict une fois. Contactez le contrôleur pour toute correction.',
    };
  }
  return { ok: true, numeroVerdict: 1 };
}

module.exports = {
  dossierValideParExaminateur,
  dossierVerrouilleParControleur,
  dossierVerrouillePourExaminateur,
  getMonNumeroVerdict,
  assertExaminateurPeutRendreVerdict,
  assertExaminateurPeutModifierSonVerdict,
};
