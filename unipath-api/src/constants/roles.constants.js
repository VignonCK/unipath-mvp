/**
 * Rôles « étudiant » sur la plateforme (compte UniPath).
 * Le statut « candidat » pour un concours est porté par la table Inscription,
 * pas par le rôle global du compte.
 */
const ROLES_ETUDIANT = ['ETUDIANT', 'CANDIDAT'];

const isEtudiantRole = (role) => ROLES_ETUDIANT.includes(role);

module.exports = {
  ROLES_ETUDIANT,
  isEtudiantRole,
};
