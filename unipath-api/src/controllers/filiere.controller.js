const prisma = require('../prisma');

exports.getAllFilieres = async (req, res) => {
  try {
    const { etablissementId } = req.query;

    const filieres = await prisma.filiere.findMany({
      where: {
        ...(etablissementId ? { etablissementId } : {}),
      },
      include: {
        etablissement: {
          select: { id: true, nom: true, type: true, ville: true },
        },
      },
      orderBy: [{ niveau: 'asc' }, { nom: 'asc' }],
    });

    return res.json({
      message: 'Filieres recuperees avec succes',
      filieres,
    });
  } catch (error) {
    console.error('Erreur getAllFilieres:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

