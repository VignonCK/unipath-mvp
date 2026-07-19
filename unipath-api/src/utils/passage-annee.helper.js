/**
 * Passage / redoublement → inscription sur l'année académique suivante.
 *
 * - Passant (VALIDE)     → même établissement + même filière, niveau + 1
 * - Redoublant           → même établissement + même filière, même niveau
 *
 * Si le passant est en fin de cycle (niveau max de la filière), aucune suite.
 */
const prisma = require('../prisma');
const { validateLibelleAnnee } = require('./annee-academique.helper');

function libelleAnneeSuivante(libelle) {
  const validation = validateLibelleAnnee(libelle);
  if (!validation.ok) return null;
  const debut = Number(validation.libelle.split('-')[0]);
  return `${debut + 1}-${debut + 2}`;
}

function maxNiveauPourFiliere(filiere) {
  const duree = Math.min(Math.max(Number(filiere?.dureeAnnees) || 3, 1), 5);
  const niveau = String(filiere?.niveau || '').toUpperCase();
  const code = String(filiere?.code || '').toUpperCase();
  const isMaster = niveau === 'MASTER' || code.endsWith('-M');
  if (isMaster) return 5;
  return duree;
}

/**
 * @param {object} params
 * @param {object} params.inscription - inscription de l'année en cours (avec filiere si possible)
 * @param {'VALIDE'|'REDOUBLANT'} params.statutPassage
 * @param {import('@prisma/client').PrismaClient} [params.client]
 */
async function assurerInscriptionAnneeSuivante({ inscription, statutPassage, client = prisma }) {
  if (!inscription?.id || !['VALIDE', 'REDOUBLANT'].includes(statutPassage)) {
    return { ok: false, error: 'parametres_invalides' };
  }

  const anneeSuivante = libelleAnneeSuivante(inscription.anneeAcademique);
  if (!anneeSuivante) {
    return { ok: false, error: 'annee_invalide' };
  }

  let filiere = inscription.filiere;
  if (!filiere?.id) {
    filiere = await client.filiere.findUnique({
      where: { id: inscription.filiereId },
      select: { id: true, nom: true, code: true, niveau: true, dureeAnnees: true, etablissementId: true },
    });
  }
  if (!filiere) {
    return { ok: false, error: 'filiere_introuvable' };
  }

  const niveauActuel = Number(inscription.niveau);
  const maxNiveau = maxNiveauPourFiliere(filiere);

  let niveauCible;
  if (statutPassage === 'REDOUBLANT') {
    niveauCible = niveauActuel;
  } else {
    niveauCible = niveauActuel + 1;
    if (niveauCible > maxNiveau) {
      // Fin de cycle : pas d'inscription N+1
      return {
        ok: true,
        suite: null,
        motif: 'fin_de_cycle',
        anneeSuivante,
        niveauMax: maxNiveau,
      };
    }
  }

  await client.anneeAcademique.upsert({
    where: { libelle: anneeSuivante },
    create: {
      libelle: anneeSuivante,
      enCoursDec: false,
      enCoursDges: false,
    },
    update: {},
  });

  const existing = await client.inscriptionAcademique.findFirst({
    where: {
      candidatId: inscription.candidatId,
      filiereId: inscription.filiereId,
      anneeAcademique: anneeSuivante,
    },
  });

  let suite;
  let created = false;
  if (existing) {
    suite = await client.inscriptionAcademique.update({
      where: { id: existing.id },
      data: {
        etablissementId: inscription.etablissementId,
        niveau: niveauCible,
        statut: 'EN_COURS',
      },
    });
  } else {
    suite = await client.inscriptionAcademique.create({
      data: {
        candidatId: inscription.candidatId,
        etablissementId: inscription.etablissementId,
        filiereId: inscription.filiereId,
        anneeAcademique: anneeSuivante,
        niveau: niveauCible,
        statut: 'EN_COURS',
      },
    });
    created = true;
  }

  return {
    ok: true,
    suite: {
      id: suite.id,
      anneeAcademique: suite.anneeAcademique,
      niveau: suite.niveau,
      filiereId: suite.filiereId,
      statut: suite.statut,
      created,
    },
    motif: statutPassage === 'REDOUBLANT' ? 'redoublement' : 'passage',
    anneeSuivante,
  };
}

module.exports = {
  libelleAnneeSuivante,
  maxNiveauPourFiliere,
  assurerInscriptionAnneeSuivante,
};
