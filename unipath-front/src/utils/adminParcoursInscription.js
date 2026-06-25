export const APPLICATION_STATUS = {
  DRAFT: {
    label: 'Brouillon',
    hint: 'Le candidat n\'a pas encore finalisé son dossier.',
    badge: 'bg-gray-100 text-gray-700',
  },
  DOSSIER_FEES_PAID: {
    label: 'Frais payés',
    hint: 'Paiement reçu — pièces ou finalisation en cours.',
    badge: 'bg-blue-50 text-blue-800',
  },
  PENDING_DOCUMENTS: {
    label: 'Pièces en attente',
    hint: 'Dossier incomplet — en attente du candidat.',
    badge: 'bg-amber-50 text-amber-800',
  },
  READY_FOR_PREINSCRIPTION: {
    label: 'Dossier complet',
    hint: 'Le candidat peut finaliser et déclencher la pré-inscription.',
    badge: 'bg-indigo-50 text-indigo-800',
  },
  FICHE_GENERATED: {
    label: 'En attente de décision',
    hint: 'Pré-inscription créée — à traiter dans Pré-inscriptions.',
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

export function needsPreinscriptionDecision(app) {
  const preinStatut = app?.preinscription?.statut;
  return app?.status === 'FICHE_GENERATED' || preinStatut === 'EN_ATTENTE';
}
