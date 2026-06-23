const { PIECES_BASE, getPiecesExtrasConfig } = require('./completude.helper');

const CHAMPS_PROFIL_REQUIS = ['telephone', 'dateNaiss', 'lieuNaiss'];

/**
 * Calcule la complétude d'une inscription (pièces base + quittance + extras).
 */
function computeInscriptionCompletude(inscription) {
  const dossier = inscription.candidat?.dossier;
  const di = inscription.dossierInscription;
  const extrasConfig = getPiecesExtrasConfig(inscription.concours);

  const piecesBasesPresentes = dossier
    ? PIECES_BASE.filter((p) => dossier[p]).length
    : 0;
  const quittancePresente = di?.quittanceUrl ? 1 : 0;
  const extrasPresentes = extrasConfig.filter(
    (p) => di?.piecesExtras?.[p.id]
  ).length;

  const total = PIECES_BASE.length + 1 + extrasConfig.length;
  const presentes = piecesBasesPresentes + quittancePresente + extrasPresentes;
  const pourcentage = total > 0 ? Math.round((presentes / total) * 100) : 0;

  return {
    total,
    presentes,
    pourcentage,
    estComplet: total > 0 && presentes === total,
    piecesManquantes: buildPiecesManquantes(inscription, extrasConfig),
  };
}

function buildPiecesManquantes(inscription, extrasConfig) {
  const manquantes = [];
  const dossier = inscription.candidat?.dossier;
  const di = inscription.dossierInscription;

  PIECES_BASE.forEach((p) => {
    if (!dossier?.[p]) manquantes.push(p);
  });
  if (!di?.quittanceUrl) manquantes.push('quittance');
  extrasConfig.forEach((p) => {
    if (!di?.piecesExtras?.[p.id]) manquantes.push(p.id);
  });

  return manquantes;
}

function profilCandidatComplet(candidat) {
  if (!candidat) return false;
  return CHAMPS_PROFIL_REQUIS.every((c) => candidat[c]);
}

module.exports = {
  CHAMPS_PROFIL_REQUIS,
  computeInscriptionCompletude,
  profilCandidatComplet,
};
