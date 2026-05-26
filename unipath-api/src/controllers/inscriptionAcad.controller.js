const { Prisma } = require('@prisma/client');
const prisma = require('../prisma');

const STATUTS = ['EN_COURS', 'VALIDE', 'REDOUBLANT', 'ABANDONNE'];

exports.creerInscriptionAcad = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    const {
      filiereId,
      etablissementId,
      anneeAcademique,
      niveau,
    } = req.body;

    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    if (!filiereId || !etablissementId || !anneeAcademique || !niveau) {
      return res.status(400).json({
        error: 'filiereId, etablissementId, anneeAcademique et niveau sont requis',
      });
    }

    const inscription = await prisma.inscriptionAcademique.create({
      data: {
        candidatId,
        filiereId,
        etablissementId,
        anneeAcademique,
        niveau: Number(niveau),
      },
      include: {
        filiere: true,
        etablissement: true,
      },
    });

    return res.status(201).json({
      message: 'Inscription academique creee avec succes',
      inscription,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Inscription deja existante pour la filiere et l annee academique' });
    }

    if (typeof error.message === 'string' && error.message.includes('Progression bloquee')) {
      return res.status(400).json({ error: 'Progression bloquee : annee precedente non validee' });
    }

    console.error('Erreur creerInscriptionAcad:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getMesInscriptions = async (req, res) => {
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
        notes: true,
      },
      orderBy: [{ anneeAcademique: 'asc' }, { niveau: 'asc' }],
    });

    return res.json({
      message: 'Mes inscriptions academiques recuperees avec succes',
      inscriptions,
    });
  } catch (error) {
    console.error('Erreur getMesInscriptions:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getInscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const inscription = await prisma.inscriptionAcademique.findUnique({
      where: { id },
      include: {
        candidat: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            matricule: true,
            email: true,
          },
        },
        filiere: true,
        etablissement: true,
        notes: true,
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription academique non trouvee' });
    }

    if (inscription.candidatId !== userId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    return res.json({
      message: 'Inscription academique recuperee avec succes',
      inscription,
    });
  } catch (error) {
    console.error('Erreur getInscriptionById:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!statut || !STATUTS.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const existing = await prisma.inscriptionAcademique.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inscription academique non trouvee' });
    }

    const inscription = await prisma.inscriptionAcademique.update({
      where: { id },
      data: { statut },
    });

    return res.json({
      message: 'Statut mis a jour avec succes',
      inscription,
    });
  } catch (error) {
    console.error('Erreur updateStatut:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

