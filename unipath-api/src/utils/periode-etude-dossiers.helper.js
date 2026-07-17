/**
 * Lancement / clôture immédiate de l'étude des dossiers (DEC).
 * - Lancer = accès immédiat pour examinateurs et contrôleurs
 * - Clôturer = fermeture de l'accès
 */
const { inscriptionsSontCloses, getDateFinDepot } = require('./periode-depot.helper');

function dossierEstEtudie(dossier) {
  if (!dossier) return false;
  if (dossier.statut === 'VALIDE' || dossier.statut === 'REJETE') return true;
  if (dossier.decisionControleur) return true;
  return false;
}

/** L'étude a été lancée au moins une fois (dateDebut renseignée). */
function etudeAEteLancee(concours) {
  return !!concours?.dateDebutEtudeDossiers;
}

function etudeEstCloturee(concours) {
  return !!concours?.etudeDossiersClotureeAt;
}

/** Étude en cours : lancée et non clôturée. */
function etudeEstActive(concours) {
  return etudeAEteLancee(concours) && !etudeEstCloturee(concours);
}

function assertPeriodeEtudeActive(concours, now = new Date()) {
  if (!inscriptionsSontCloses(concours, now)) {
    const dateFin = getDateFinDepot(concours);
    return {
      ok: false,
      code: 'INSCRIPTIONS_EN_COURS',
      error: dateFin
        ? `Les inscriptions ne sont pas encore closes (fin le ${new Date(dateFin).toLocaleString('fr-FR')}).`
        : 'Les inscriptions ne sont pas encore closes.',
    };
  }

  if (!etudeAEteLancee(concours)) {
    return {
      ok: false,
      code: 'ETUDE_NON_LANCEE',
      error: "L'étude des dossiers n'a pas encore été lancée par la DEC pour ce concours.",
    };
  }

  if (etudeEstCloturee(concours)) {
    const cloture = new Date(concours.etudeDossiersClotureeAt);
    return {
      ok: false,
      code: 'ETUDE_CLOTUREE',
      error: `L'étude des dossiers a été clôturée le ${cloture.toLocaleString('fr-FR')}.`,
    };
  }

  return { ok: true };
}

function whereConcoursPeriodeEtudeActive() {
  return {
    dateDebutEtudeDossiers: { not: null },
    etudeDossiersClotureeAt: null,
    annee: { enCours: true },
  };
}

/** Dossier encore à traiter : pas de verdict examinateur, ou workflow non finalisé. */
function whereDossierNonEtudie() {
  return {
    OR: [
      { verdict1: null },
      {
        AND: [
          { statut: { notIn: ['VALIDE', 'REJETE'] } },
          { decisionControleur: null },
        ],
      },
    ],
  };
}

// Aliases rétrocompatibles
const periodeEtudeEstDefinied = etudeAEteLancee;
const estDansPeriodeEtude = etudeEstActive;
const periodeEtudeEstTerminee = etudeEstCloturee;

module.exports = {
  dossierEstEtudie,
  etudeAEteLancee,
  etudeEstCloturee,
  etudeEstActive,
  assertPeriodeEtudeActive,
  whereConcoursPeriodeEtudeActive,
  whereDossierNonEtudie,
  periodeEtudeEstDefinied,
  estDansPeriodeEtude,
  periodeEtudeEstTerminee,
};
