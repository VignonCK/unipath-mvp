/** Le concours a des centres relationnels actifs (liste API). */
export function concoursHasCentresRelationnels(centresRelational = []) {
  return Array.isArray(centresRelational) && centresRelational.length > 0;
}

/**
 * Le candidat doit choisir un centre avant la convocation.
 * Les concours sans centre configuré ne sont pas concernés.
 */
export function concoursRequireCentreChoice(concours, centresRelational = []) {
  if (concoursHasCentresRelationnels(centresRelational)) {
    return true;
  }
  return Boolean(concours?.hasCentresActifs);
}

export function resolveCentreChoisi(inscription) {
  if (!inscription) return null;
  return inscription.centreChoisi
    ?? inscription.dossierInscription?.centreCompositionChoisi
    ?? null;
}

export function inscriptionHasCentreChoisi(inscription) {
  const c = resolveCentreChoisi(inscription);
  return Boolean(c?.concoursCentreId || c?.nom);
}
