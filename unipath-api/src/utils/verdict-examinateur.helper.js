/**
 * Règles métier : verdicts examinateurs immuables entre pairs.
 * Seul le contrôleur peut modifier le verdict d'un autre examinateur.
 */

function dossierVerrouilleParControleur(dossier) {
  return !!(dossier.decisionControleurPar || dossier.decisionControleur);
}

function getSlotExaminateur(dossier, numeroVerdict) {
  return numeroVerdict === 1 ? dossier.verdict1Par : dossier.verdict2Par;
}

function slotOccupeParAutre(dossier, examinateurId, numeroVerdict) {
  const auteur = getSlotExaminateur(dossier, numeroVerdict);
  return auteur != null && auteur !== examinateurId;
}

function getMonNumeroVerdict(dossier, examinateurId) {
  if (dossier.verdict1Par === examinateurId) return 1;
  if (dossier.verdict2Par === examinateurId) return 2;
  return null;
}

function getProchainSlotLibre(dossier) {
  if (!dossier.verdict1Par) return 1;
  if (!dossier.verdict2Par) return 2;
  return null;
}

function assertExaminateurPeutRendreVerdict(dossier, examinateurId) {
  if (dossierVerrouilleParControleur(dossier)) {
    return { ok: false, error: 'Ce dossier est verrouillé : la décision du contrôleur a déjà été rendue.' };
  }
  if (getMonNumeroVerdict(dossier, examinateurId)) {
    return { ok: false, error: 'Vous avez déjà rendu votre verdict sur ce dossier.' };
  }
  const slot = getProchainSlotLibre(dossier);
  if (!slot) {
    return { ok: false, error: 'Les 2 verdicts ont déjà été rendus sur ce dossier.' };
  }
  if (slotOccupeParAutre(dossier, examinateurId, slot)) {
    return { ok: false, error: 'Ce verdict a déjà été rendu par un autre examinateur et ne peut pas être modifié.' };
  }
  return { ok: true, slot };
}

function assertExaminateurPeutModifierSonVerdict(dossier, examinateurId) {
  if (dossierVerrouilleParControleur(dossier)) {
    return { ok: false, error: 'Ce dossier est verrouillé : seul le contrôleur peut modifier les verdicts.' };
  }
  const numeroVerdict = getMonNumeroVerdict(dossier, examinateurId);
  if (!numeroVerdict) {
    return { ok: false, error: "Vous n'avez pas rendu de verdict sur ce dossier. Vous ne pouvez pas modifier le verdict d'un autre examinateur." };
  }
  const modifieCount = numeroVerdict === 1 ? dossier.verdict1ModifieCount : dossier.verdict2ModifieCount;
  if (modifieCount >= 1) {
    return {
      ok: false,
      error: "Vous avez déjà modifié votre verdict une fois. Contactez le contrôleur pour toute correction.",
    };
  }
  return { ok: true, numeroVerdict };
}

module.exports = {
  dossierVerrouilleParControleur,
  slotOccupeParAutre,
  getMonNumeroVerdict,
  getProchainSlotLibre,
  assertExaminateurPeutRendreVerdict,
  assertExaminateurPeutModifierSonVerdict,
};
