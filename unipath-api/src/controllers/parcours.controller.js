const prisma = require('../prisma');

const calculerMoyenneGeneralePonderee = (notes) => {
  const notesValides = notes.filter((n) => typeof n.noteMoyenne === 'number' && n.credits > 0);
  const totalCredits = notesValides.reduce((sum, n) => sum + n.credits, 0);
  if (!totalCredits) return { moyenneGenerale: null, totalCredits: 0 };

  const totalPondere = notesValides.reduce((sum, n) => sum + (n.noteMoyenne * n.credits), 0);
  return {
    moyenneGenerale: Number((totalPondere / totalCredits).toFixed(2)),
    totalCredits,
  };
};

exports.getMonParcours = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const inscriptions = await prisma.inscriptionAcademique.findMany({
      where: { candidatId },
      include: {
        filiere: true,
        etablissement: true,
        notes: {
          orderBy: [{ semestre: 'asc' }, { matiere: 'asc' }],
        },
      },
      orderBy: [{ anneeAcademique: 'asc' }, { niveau: 'asc' }],
    });

    const parcours = inscriptions.map((inscription) => {
      const { moyenneGenerale, totalCredits } = calculerMoyenneGeneralePonderee(inscription.notes);
      return {
        ...inscription,
        moyenneGenerale,
        totalCredits,
      };
    });

    return res.json({
      message: 'Parcours recupere avec succes',
      parcours,
    });
  } catch (error) {
    console.error('Erreur getMonParcours:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getMonReleve = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const inscriptions = await prisma.inscriptionAcademique.findMany({
      where: { candidatId },
      include: {
        filiere: true,
        etablissement: true,
        notes: {
          orderBy: [{ semestre: 'asc' }, { matiere: 'asc' }],
        },
      },
      orderBy: [{ anneeAcademique: 'asc' }, { niveau: 'asc' }],
    });

    const releve = inscriptions.map((inscription) => {
      const { moyenneGenerale, totalCredits } = calculerMoyenneGeneralePonderee(inscription.notes);
      return {
        inscriptionId: inscription.id,
        anneeAcademique: inscription.anneeAcademique,
        niveau: inscription.niveau,
        statut: inscription.statut,
        filiere: inscription.filiere.nom,
        etablissement: inscription.etablissement.nom,
        notes: inscription.notes,
        moyenneGenerale,
        totalCredits,
      };
    });

    return res.json({
      message: 'Releve recupere avec succes',
      releve,
    });
  } catch (error) {
    console.error('Erreur getMonReleve:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

