const prisma = require('../prisma');
const { supabaseAdmin } = require('../supabase');

/**
 * Créer une nouvelle inscription à un concours
 */
exports.creerInscription = async (req, res) => {
  try {
    const { concoursId, piecesExtras } = req.body;
    const candidatId = req.user.id;

    // Vérifier que le concours existe
    const concours = await prisma.concours.findUnique({
      where: { id: concoursId },
    });

    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    // Vérifier que le candidat n'est pas déjà inscrit
    const inscriptionExistante = await prisma.inscription.findFirst({
      where: {
        candidatId,
        concoursId,
      },
    });

    if (inscriptionExistante) {
      return res.status(400).json({ error: 'Vous êtes déjà inscrit à ce concours' });
    }

    // Créer l'inscription
    const inscription = await prisma.inscription.create({
      data: {
        candidatId,
        concoursId,
        statut: 'EN_ATTENTE',
        piecesExtras: piecesExtras || {},
      },
      include: {
        concours: true,
        candidat: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Inscription créée avec succès',
      inscription,
    });
  } catch (error) {
    console.error('Erreur création inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer toutes les inscriptions du candidat connecté
 */
exports.getMesInscriptions = async (req, res) => {
  try {
    const candidatId = req.user.id;

    const inscriptions = await prisma.inscription.findMany({
      where: { candidatId },
      include: {
        concours: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(inscriptions);
  } catch (error) {
    console.error('Erreur récupération inscriptions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer une inscription spécifique
 */
exports.getInscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const candidatId = req.user.id;

    const inscription = await prisma.inscription.findFirst({
      where: {
        id,
        candidatId,
      },
      include: {
        concours: true,
        candidat: {
          include: {
            dossier: true,
          },
        },
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    res.json(inscription);
  } catch (error) {
    console.error('Erreur récupération inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour les pièces extras d'une inscription
 */
exports.updatePiecesExtras = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const { piecesExtras } = req.body;
    const candidatId = req.user.id;

    const inscription = await prisma.inscription.findFirst({
      where: {
        id: inscriptionId,
        candidatId,
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée ou non autorisée' });
    }

    const updated = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: { piecesExtras },
      include: {
        concours: true,
      },
    });

    res.json({
      message: 'Pièces extras mises à jour avec succès',
      inscription: updated,
    });
  } catch (error) {
    console.error('Erreur mise à jour pièces extras:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Upload de la quittance pour une inscription
 */
exports.uploadQuittanceInscription = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const candidatId = req.user.id;

    const inscription = await prisma.inscription.findFirst({
      where: { id: inscriptionId, candidatId },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée ou non autorisée' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Upload vers Supabase
    const ext = req.file.originalname.split('.').pop();
    const fileName = `${candidatId}/quittance-${inscriptionId}-${Date.now()}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from('dossiers-candidats')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('dossiers-candidats')
      .getPublicUrl(fileName);

    const quittanceUrl = urlData.publicUrl;

    const updated = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: { quittanceUrl },
    });

    res.json({
      message: 'Quittance uploadée avec succès',
      quittanceUrl,
      inscription: updated,
    });
  } catch (error) {
    console.error('Erreur upload quittance inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Annuler une inscription (si statut EN_ATTENTE)
 */
exports.annulerInscription = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const candidatId = req.user.id;

    const inscription = await prisma.inscription.findFirst({
      where: {
        id: inscriptionId,
        candidatId,
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée ou non autorisée' });
    }

    if (inscription.statut !== 'EN_ATTENTE') {
      return res.status(400).json({
        error: 'Impossible d\'annuler une inscription déjà traitée',
      });
    }

    await prisma.inscription.delete({
      where: { id: inscriptionId },
    });

    res.json({ message: 'Inscription annulée avec succès' });
  } catch (error) {
    console.error('Erreur annulation inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};