/**
 * Période de dépôt / clôture des inscriptions d'un concours.
 */

function getDateFinDepot(concours) {
  if (!concours) return null;
  return concours.dateFinDepot || concours.dateFin || null;
}

/** Inscriptions closes = date de fin de dépôt dépassée. */
function inscriptionsSontCloses(concours, now = new Date()) {
  const dateFin = getDateFinDepot(concours);
  if (!dateFin) return false;
  return now > new Date(dateFin);
}

function assertInscriptionsClosesPourExamen(concours) {
  if (inscriptionsSontCloses(concours)) {
    return { ok: true };
  }
  const dateFin = getDateFinDepot(concours);
  return {
    ok: false,
    error: dateFin
      ? `Les inscriptions ne sont pas encore closes (fin le ${new Date(dateFin).toLocaleString('fr-FR')}). L'étude des dossiers n'est possible qu'après la clôture.`
      : 'Les inscriptions ne sont pas encore closes. L\'étude des dossiers n\'est possible qu\'après la clôture.',
  };
}

/** Filtre Prisma : concours dont la période de dépôt est terminée. */
function whereConcoursInscriptionsCloses(now = new Date()) {
  return {
    OR: [
      { dateFinDepot: { lt: now } },
      { dateFinDepot: null, dateFin: { lt: now } },
    ],
  };
}

module.exports = {
  getDateFinDepot,
  inscriptionsSontCloses,
  assertInscriptionsClosesPourExamen,
  whereConcoursInscriptionsCloses,
};
