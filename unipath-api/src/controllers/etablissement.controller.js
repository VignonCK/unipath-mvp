const prisma = require('../prisma');

exports.getAllEtablissements = async (req, res) => {
  try {
    const etablissements = await prisma.etablissement.findMany({
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { filieres: true, inscriptions: true } },
      },
    });

    return res.json({
      message: 'Etablissements recuperes avec succes',
      etablissements,
    });
  } catch (error) {
    console.error('Erreur getAllEtablissements:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getEtablissementById = async (req, res) => {
  try {
    const { id } = req.params;

    const etablissement = await prisma.etablissement.findUnique({
      where: { id },
      include: {
        filieres: {
          orderBy: { nom: 'asc' },
        },
      },
    });

    if (!etablissement) {
      return res.status(404).json({ error: 'Etablissement non trouve' });
    }

    return res.json({
      message: 'Etablissement recupere avec succes',
      etablissement,
    });
  } catch (error) {
    console.error('Erreur getEtablissementById:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getEtudiantsEtablissement = async (req, res) => {
  try {
    const { id } = req.params;
    const { filiere, annee } = req.query;

    const etablissement = await prisma.etablissement.findUnique({
      where: { id },
      select: { id: true, nom: true },
    });

    if (!etablissement) {
      return res.status(404).json({ error: 'Etablissement non trouve' });
    }

    const where = {
      etablissementId: id,
      ...(filiere ? { filiereId: filiere } : {}),
      ...(annee ? { anneeAcademique: annee } : {}),
    };

    const inscriptions = await prisma.inscriptionAcademique.findMany({
      where,
      include: {
        candidat: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        filiere: {
          select: {
            id: true,
            nom: true,
            code: true,
            niveau: true,
          },
        },
      },
      orderBy: [{ anneeAcademique: 'asc' }, { niveau: 'asc' }],
    });

    return res.json({
      message: 'Etudiants recuperes avec succes',
      etudiants: inscriptions,
    });
  } catch (error) {
    console.error('Erreur getEtudiantsEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getStatistiquesEtablissement = async (req, res) => {
  try {
    const { id } = req.params;

    const etablissement = await prisma.etablissement.findUnique({
      where: { id },
      select: { nom: true },
    });

    if (!etablissement) {
      return res.status(404).json({ error: 'Etablissement non trouve' });
    }

    const stats = await prisma.$queryRaw`
      SELECT *
      FROM v_statistiques_module2
      WHERE etablissement = ${etablissement.nom}
      ORDER BY annee ASC, filiere ASC
    `;

    return res.json({
      message: 'Statistiques recuperees avec succes',
      statistiques: stats,
    });
  } catch (error) {
    console.error('Erreur getStatistiquesEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

