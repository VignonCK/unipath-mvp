export const APPLICATION_STATUS = {
  DRAFT: {
    label: 'Brouillon',
    hint: 'Quittance et/ou pièces encore à déposer.',
    badge: 'bg-gray-100 text-gray-700',
  },
  DOSSIER_FEES_PAID: {
    label: 'Quittance reçue',
    hint: 'Quittance des frais de dossier déposée — pièces éventuellement en cours.',
    badge: 'bg-blue-50 text-blue-800',
  },
  PENDING_DOCUMENTS: {
    label: 'Pièces en attente',
    hint: 'Dossier incomplet — en attente du candidat.',
    badge: 'bg-amber-50 text-amber-800',
  },
  READY_FOR_PREINSCRIPTION: {
    label: 'Prêt à soumettre',
    hint: 'Quittance + pièces OK — le candidat peut soumettre.',
    badge: 'bg-indigo-50 text-indigo-800',
  },
  FICHE_GENERATED: {
    label: 'En attente de décision',
    hint: 'Dossier soumis — consultez les pièces et donnez votre verdict.',
    badge: 'bg-orange-50 text-orange-800',
  },
};

export const PREINSCRIPTION_STATUS = {
  EN_ATTENTE: { label: 'En attente', badge: 'bg-orange-50 text-orange-800' },
  VALIDE: { label: 'Validée', badge: 'bg-green-50 text-green-800' },
  SOUS_RESERVE: { label: 'Sous réserve', badge: 'bg-amber-50 text-amber-800' },
  REJETE: { label: 'Rejetée', badge: 'bg-red-50 text-red-800' },
};

export function getApplicationStatus(status) {
  return APPLICATION_STATUS[status] || { label: status, hint: '', badge: 'bg-gray-100 text-gray-700' };
}

/**
 * Affichage admin : tient compte du verdict de pré-inscription.
 */
export function getCandidatureDisplayStatus(app) {
  const preinStatut = app?.preinscription?.statut;
  if (preinStatut === 'VALIDE') {
    return {
      label: 'Validée',
      hint: 'Décision définitive — non modifiable.',
      badge: PREINSCRIPTION_STATUS.VALIDE.badge,
    };
  }
  if (preinStatut === 'REJETE') {
    return {
      label: 'Rejetée',
      hint: 'Décision définitive — non modifiable.',
      badge: PREINSCRIPTION_STATUS.REJETE.badge,
    };
  }
  if (preinStatut === 'SOUS_RESERVE') {
    return {
      label: 'Sous réserve',
      hint: 'En attente des corrections du candidat. Nouveau verdict possible après resoumission.',
      badge: PREINSCRIPTION_STATUS.SOUS_RESERVE.badge,
    };
  }
  if (preinStatut === 'EN_ATTENTE') {
    return {
      label: 'En attente de décision',
      hint: 'Consultez les pièces et donnez votre verdict.',
      badge: APPLICATION_STATUS.FICHE_GENERATED.badge,
    };
  }
  return getApplicationStatus(app?.status);
}

/**
 * L'admin peut décider uniquement si la pré-inscription est EN_ATTENTE
 * (soumission initiale ou resoumission après sous réserve).
 */
export function needsPreinscriptionDecision(app) {
  return app?.preinscription?.statut === 'EN_ATTENTE';
}

export function isVerdictLocked(app) {
  const s = app?.preinscription?.statut;
  return s === 'VALIDE' || s === 'REJETE' || s === 'SOUS_RESERVE';
}
