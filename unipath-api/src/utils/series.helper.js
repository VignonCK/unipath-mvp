/**
 * Helpers partagés pour la gestion des séries du baccalauréat.
 *
 * Gère les alias entre les séries "ombrelle" (G, F) et leurs déclinaisons
 * (G1/G2/G3, F1/F2/F3/F4) afin que le matching candidat <-> concours
 * reste cohérent entre le filtrage, l'affichage et la création d'inscription.
 */

const normalizeSerie = (serie) => String(serie || '').trim().toUpperCase();

const getSerieAliases = (serie) => {
  const s = normalizeSerie(serie);
  if (!s) return [];
  if (s === 'G') return ['G', 'G1', 'G2', 'G3'];
  if (['G1', 'G2', 'G3'].includes(s)) return [s, 'G'];
  if (s === 'F') return ['F', 'F1', 'F2', 'F3', 'F4'];
  if (['F1', 'F2', 'F3', 'F4'].includes(s)) return [s, 'F'];
  return [s];
};

/**
 * Indique si la série d'un candidat correspond aux séries acceptées d'un concours.
 * Un concours sans série configurée est considéré ouvert à toutes les séries.
 */
const candidateSerieMatchesConcours = (candidateSerie, concoursSeries = []) => {
  const candidateAliases = getSerieAliases(candidateSerie);
  if (candidateAliases.length === 0) return true;

  const concoursSeriesNormalized = new Set(
    (Array.isArray(concoursSeries) ? concoursSeries : []).map(normalizeSerie)
  );

  if (concoursSeriesNormalized.size === 0) return true;
  return candidateAliases.some((s) => concoursSeriesNormalized.has(s));
};

module.exports = {
  normalizeSerie,
  getSerieAliases,
  candidateSerieMatchesConcours,
};
