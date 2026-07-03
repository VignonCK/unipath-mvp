const DELAI_CORRECTION_MS = 24 * 60 * 60 * 1000;
const MAX_MODIFICATIONS_SOUS_RESERVE = 1;

function getDelaiCorrectionExpireAt(decisionControleurDate) {
  if (!decisionControleurDate) return null;
  return new Date(new Date(decisionControleurDate).getTime() + DELAI_CORRECTION_MS);
}

function isDelaiCorrectionExpire(decisionControleurDate) {
  const expireAt = getDelaiCorrectionExpireAt(decisionControleurDate);
  if (!expireAt) return false;
  return Date.now() > expireAt.getTime();
}

function getModificationControleurInfo(dossier) {
  if (!dossier?.decisionControleur) {
    return {
      peutModifier: false,
      modificationsRestantes: 0,
      delaiExpire: false,
      verrouille: false,
      message: null,
    };
  }

  if (dossier.decisionControleur === 'VALIDE' || dossier.decisionControleur === 'REJETE') {
    return {
      peutModifier: false,
      modificationsRestantes: 0,
      delaiExpire: false,
      verrouille: true,
      message: 'Une décision de validation ou de rejet est définitive.',
    };
  }

  const modCount = dossier.decisionControleurModifieCount ?? 0;
  const delaiExpire = isDelaiCorrectionExpire(dossier.decisionControleurDate);
  const modificationsRestantes = Math.max(0, MAX_MODIFICATIONS_SOUS_RESERVE - modCount);
  const peutModifier = modificationsRestantes > 0 && !delaiExpire;

  let message = null;
  if (delaiExpire) {
    message = 'Le délai de correction (24 h) est dépassé.';
  } else if (modCount >= MAX_MODIFICATIONS_SOUS_RESERVE) {
    message = 'La correction autorisée a déjà été utilisée. Attendez la resoumission du candidat.';
  }

  return {
    peutModifier,
    modificationsRestantes,
    delaiExpire,
    delaiCorrectionExpireAt: getDelaiCorrectionExpireAt(dossier.decisionControleurDate),
    verrouille: !peutModifier,
    message,
  };
}

function assertControleurPeutRendreDecision(dossier) {
  if (dossier?.decisionControleur) {
    return {
      ok: false,
      error:
        'Une décision a déjà été rendue sur ce dossier. Seule une correction encadrée est possible pour une décision sous réserve.',
    };
  }
  return { ok: true };
}

function assertControleurPeutModifierDecision(dossier) {
  if (!dossier?.decisionControleur) {
    return { ok: false, error: 'Aucune décision n\'a encore été rendue sur ce dossier.' };
  }

  const info = getModificationControleurInfo(dossier);
  if (info.peutModifier) {
    return { ok: true };
  }

  return {
    ok: false,
    error: info.message || 'Cette décision ne peut plus être modifiée.',
  };
}

module.exports = {
  DELAI_CORRECTION_MS,
  MAX_MODIFICATIONS_SOUS_RESERVE,
  getModificationControleurInfo,
  assertControleurPeutRendreDecision,
  assertControleurPeutModifierDecision,
};
