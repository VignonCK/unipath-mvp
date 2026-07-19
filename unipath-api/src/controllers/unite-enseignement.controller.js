const { Prisma } = require('@prisma/client');
const prisma = require('../prisma');
const {
  resolveEtablissementIdFromReq,
} = require('../utils/etablissement-access.helper');
const {
  anneeEtudeFromSemestre,
  isValidSemestre,
  listAllSemestres,
  labelAnneeEtude,
  semestresForAnneeEtude,
} = require('../utils/semestre-etude.helper');

async function assertFiliereOfEtablissement(filiereId, etablissementId) {
  const filiere = await prisma.filiere.findFirst({
    where: { id: filiereId, etablissementId },
    select: { id: true, nom: true, code: true, dureeAnnees: true },
  });
  return filiere;
}

exports.getSemestresMeta = async (_req, res) => {
  try {
    return res.json({
      semestres: listAllSemestres(),
      anneesEtude: [1, 2, 3, 4, 5].map((a) => ({
        value: a,
        label: labelAnneeEtude(a),
        semestres: semestresForAnneeEtude(a),
      })),
    });
  } catch (error) {
    console.error('Erreur getSemestresMeta:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.listerUnites = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const filiereId = req.query.filiereId ? String(req.query.filiereId).trim() : '';
    const semestre = req.query.semestre !== undefined && req.query.semestre !== ''
      ? Number(req.query.semestre)
      : null;
    const anneeEtude = req.query.anneeEtude !== undefined && req.query.anneeEtude !== ''
      ? Number(req.query.anneeEtude)
      : null;

    if (!filiereId) {
      return res.status(400).json({ error: 'filiereId est requis' });
    }

    const filiere = await assertFiliereOfEtablissement(filiereId, etablissementId);
    if (!filiere) {
      return res.status(404).json({ error: 'Filiere non trouvee pour cet etablissement' });
    }

    if (semestre != null && !isValidSemestre(semestre)) {
      return res.status(400).json({ error: 'semestre invalide (attendu 1 a 10)' });
    }
    if (anneeEtude != null && (!Number.isInteger(anneeEtude) || anneeEtude < 1 || anneeEtude > 5)) {
      return res.status(400).json({ error: 'anneeEtude invalide (attendu 1 a 5)' });
    }

    const unites = await prisma.uniteEnseignement.findMany({
      where: {
        filiereId,
        ...(semestre != null ? { semestre } : {}),
        ...(anneeEtude != null ? { anneeEtude } : {}),
      },
      orderBy: [{ semestre: 'asc' }, { ordre: 'asc' }, { code: 'asc' }],
    });

    return res.json({
      filiere,
      unites,
      meta: {
        semestres: listAllSemestres(),
      },
    });
  } catch (error) {
    console.error('Erreur listerUnites:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.creerUnite = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const {
      filiereId,
      code,
      libelle,
      credits = 0,
      semestre,
      coefficient,
      description,
      ordre = 0,
    } = req.body || {};

    if (!filiereId || !code || !libelle || semestre === undefined || semestre === null) {
      return res.status(400).json({
        error: 'filiereId, code, libelle et semestre sont requis',
      });
    }
    if (!isValidSemestre(semestre)) {
      return res.status(400).json({ error: 'semestre invalide (attendu 1 a 10)' });
    }

    const filiere = await assertFiliereOfEtablissement(filiereId, etablissementId);
    if (!filiere) {
      return res.status(404).json({ error: 'Filiere non trouvee pour cet etablissement' });
    }

    const anneeEtude = anneeEtudeFromSemestre(semestre);
    const unite = await prisma.uniteEnseignement.create({
      data: {
        filiereId,
        code: String(code).trim().toUpperCase(),
        libelle: String(libelle).trim(),
        credits: Number(credits) || 0,
        semestre: Number(semestre),
        anneeEtude,
        coefficient: coefficient === undefined || coefficient === null || coefficient === ''
          ? null
          : Number(coefficient),
        description: description ? String(description).trim() : null,
        ordre: Number(ordre) || 0,
      },
    });

    return res.status(201).json({
      message: 'Unite d\'enseignement creee avec succes',
      unite,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({
        error: 'Une UE avec ce code existe deja pour ce semestre dans la filiere',
      });
    }
    console.error('Erreur creerUnite:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.modifierUnite = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const { id } = req.params;
    const existing = await prisma.uniteEnseignement.findUnique({
      where: { id },
      include: { filiere: { select: { id: true, etablissementId: true } } },
    });
    if (!existing || existing.filiere.etablissementId !== etablissementId) {
      return res.status(404).json({ error: 'Unite d\'enseignement non trouvee' });
    }

    const {
      code,
      libelle,
      credits,
      semestre,
      coefficient,
      description,
      ordre,
    } = req.body || {};

    if (semestre !== undefined && semestre !== null && !isValidSemestre(semestre)) {
      return res.status(400).json({ error: 'semestre invalide (attendu 1 a 10)' });
    }

    const nextSemestre = semestre !== undefined && semestre !== null
      ? Number(semestre)
      : existing.semestre;

    const unite = await prisma.uniteEnseignement.update({
      where: { id },
      data: {
        ...(code !== undefined ? { code: String(code).trim().toUpperCase() } : {}),
        ...(libelle !== undefined ? { libelle: String(libelle).trim() } : {}),
        ...(credits !== undefined ? { credits: Number(credits) || 0 } : {}),
        ...(semestre !== undefined && semestre !== null
          ? { semestre: nextSemestre, anneeEtude: anneeEtudeFromSemestre(nextSemestre) }
          : {}),
        ...(coefficient !== undefined
          ? {
              coefficient: coefficient === null || coefficient === ''
                ? null
                : Number(coefficient),
            }
          : {}),
        ...(description !== undefined
          ? { description: description ? String(description).trim() : null }
          : {}),
        ...(ordre !== undefined ? { ordre: Number(ordre) || 0 } : {}),
      },
    });

    return res.json({
      message: 'Unite d\'enseignement mise a jour',
      unite,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({
        error: 'Une UE avec ce code existe deja pour ce semestre dans la filiere',
      });
    }
    console.error('Erreur modifierUnite:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.supprimerUnite = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const { id } = req.params;
    const existing = await prisma.uniteEnseignement.findUnique({
      where: { id },
      include: { filiere: { select: { etablissementId: true } } },
    });
    if (!existing || existing.filiere.etablissementId !== etablissementId) {
      return res.status(404).json({ error: 'Unite d\'enseignement non trouvee' });
    }

    await prisma.uniteEnseignement.delete({ where: { id } });
    return res.json({ message: 'Unite d\'enseignement supprimee' });
  } catch (error) {
    console.error('Erreur supprimerUnite:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
