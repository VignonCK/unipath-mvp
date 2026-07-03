/** Nombre d'inscriptions avec une action utile (fiche, convocation, décision à lire). */
export function countAlertesConcours(inscriptions = []) {
  return inscriptions.filter(needsConcoursAttention).length;
}

function needsCentreChoice(ins) {
  const hasCentres = ins?.concours?.hasCentresActifs
    || (Array.isArray(ins?.concours?.centresComposition?.centres)
      && ins.concours.centresComposition.centres.length > 0);
  const centreChoisi = ins?.centreChoisi;
  const aChoisi = Boolean(centreChoisi?.concoursCentreId || centreChoisi?.nom);
  return hasCentres
    && ['VALIDE_PAR_COMMISSION', 'VALIDE'].includes(ins?.statut)
    && !aChoisi;
}

export function needsConcoursAttention(ins) {
  if (!ins) return false;
  if (needsCentreChoice(ins)) return true;
  if (['REJETE', 'REJETE_PAR_COMMISSION'].includes(ins.statut)) return false;
  if (ins.statut === 'VALIDE') return true;
  if (['VALIDE_PAR_COMMISSION', 'SOUS_RESERVE', 'SOUS_RESERVE_PAR_COMMISSION'].includes(ins.statut)) return true;
  if (ins.quittanceUrl) return true;
  return false;
}

export function buildConcoursNotifications(inscriptions = []) {
  const notifications = [];
  inscriptions.forEach((ins) => {
    const libelle = ins.concours?.libelle || 'ce concours';
    if (ins.statut === 'VALIDE') {
      notifications.push({
        type: needsCentreChoice(ins) ? 'warning' : 'success',
        msg: needsCentreChoice(ins)
          ? `"${libelle}" : choisissez votre centre de composition.`
          : `"${libelle}" : votre convocation est disponible.`,
      });
    } else if (ins.statut === 'VALIDE_PAR_COMMISSION') {
      notifications.push({
        type: needsCentreChoice(ins) ? 'warning' : 'success',
        msg: needsCentreChoice(ins)
          ? `"${libelle}" : dossier validé — choisissez votre centre de composition.`
          : `"${libelle}" : dossier validé par la commission.`,
      });
    } else if (['REJETE', 'REJETE_PAR_COMMISSION'].includes(ins.statut)) {
      notifications.push({ type: 'error', msg: `"${libelle}" : dossier non retenu.` });
    } else if (['SOUS_RESERVE', 'SOUS_RESERVE_PAR_COMMISSION'].includes(ins.statut)) {
      notifications.push({ type: 'warning', msg: `"${libelle}" : accepté sous réserve — corrigez la pièce indiquée dans le motif.` });
    } else if (ins.quittanceUrl) {
      notifications.push({ type: 'info', msg: `"${libelle}" : fiche de pré-inscription disponible.` });
    }
  });
  return notifications;
}

const STORAGE_KEY = 'concours_alertes_vues';

/** Récupère les IDs des inscriptions déjà vues */
export function getAlertesVues() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/** Marque une liste d'IDs comme vus */
export function marquerAlertesCommeVues(ids = []) {
  try {
    const vues = getAlertesVues();
    const nouvelles = [...new Set([...vues, ...ids])];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nouvelles));
  } catch {
    /* ignore */
  }
}

/** Même logique que countAlertesConcours mais en excluant les IDs déjà vus */
export function countAlertesNonVues(inscriptions = []) {
  const vues = getAlertesVues();
  return inscriptions.filter(
    (ins) => needsConcoursAttention(ins) && !vues.includes(ins.id),
  ).length;
}

/** Retire un ID du localStorage (utile si un dossier repasse en alerte) */
export function retirerAlerteVue(id) {
  try {
    const vues = getAlertesVues();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(vues.filter((v) => v !== id)),
    );
  } catch {
    /* ignore */
  }
}
