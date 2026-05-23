const prisma = require('../prisma');
const { supabaseAdmin } = require('../supabase');
const { genererNumeroInscriptionUnique } = require('../utils/numero-inscription.helper');
const { envoyerPreInscriptionApresCreation } = require('../utils/inscription-email.helper');

/**
 * Créer une nouvelle inscription à un concours
 */
exports.creerInscription = async (req, res) => {
  try {
    const { concoursId } = req.body;
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

    // Vérifier si le candidat a un Dossier, sinon le créer
    let dossier = await prisma.dossier.findUnique({
      where: { candidatId }
    });

    if (!dossier) {
      dossier = await prisma.dossier.create({
        data: { candidatId }
      });
    }

    const numeroInscription = await genererNumeroInscriptionUnique();

    // Créer l'inscription + DossierInscription dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      const inscription = await tx.inscription.create({
        data: {
          candidatId,
          concoursId,
          numeroInscription,
        },
      });

      // Créer le DossierInscription automatiquement
      const dossierInscription = await tx.dossierInscription.create({
        data: {
          inscriptionId: inscription.id,
          statut: 'EN_ATTENTE',
          piecesExtras: {},
        },
      });

      // Créer une entrée dans l'historique
      await tx.actionHistory.create({
        data: {
          utilisateurId: candidatId,
          dossierInscriptionId: dossierInscription.id,
          typeAction: 'DOSSIER_CONCOURS_CREE',
          details: { concoursId, inscriptionId: inscription.id },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        }
      });

      return { inscription, dossierInscription };
    });

    // Calculer la complétude initiale
    const piecesBase = ['acteNaissance', 'carteIdentite', 'photo', 'releve'];
    const piecesBasesPresentes = piecesBase.filter(p => dossier[p]).length;
    
    // Quittance + piecesExtras configurées par le concours
    const piecesExtrasConfig = concours.piecesRequises?.extras || [];
    const total = 4 + 1 + piecesExtrasConfig.length; // 4 base + 1 quittance + extras
    const presentes = piecesBasesPresentes; // Initialement, seules les pièces de base peuvent être présentes
    const completude = Math.round((presentes / total) * 100);

    // Récupérer l'inscription complète avec relations
    const inscriptionComplete = await prisma.inscription.findUnique({
      where: { id: result.inscription.id },
      include: {
        concours: true,
        candidat: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            dateNaiss: true,
            lieuNaiss: true,
          },
        },
        dossierInscription: true,
      },
    });

    // Email + PDF pré-inscription (asynchrone, ne bloque pas la réponse)
    envoyerPreInscriptionApresCreation({
      candidat: inscriptionComplete.candidat,
      concours: inscriptionComplete.concours,
      inscription: inscriptionComplete,
    }).catch((err) => console.error('Erreur envoi email pré-inscription:', err));

    res.status(201).json({
      message: 'Inscription créée avec succès',
      inscription: inscriptionComplete,
      completude: {
        pourcentage: completude,
        piecesPresentes: presentes,
        piecesRequises: total
      }
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
        dossierInscription: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = inscriptions.map((ins) => ({
      ...ins,
      statut: ins.dossierInscription?.statut ?? 'EN_ATTENTE',
      commentaireRejet: ins.dossierInscription?.commentaireRejet,
      commentaireSousReserve: ins.dossierInscription?.commentaireSousReserve,
    }));

    res.json(mapped);
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
        dossierInscription: true,
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

    res.json({
      ...inscription,
      statut: inscription.dossierInscription?.statut ?? 'EN_ATTENTE',
      commentaireRejet: inscription.dossierInscription?.commentaireRejet,
      commentaireSousReserve: inscription.dossierInscription?.commentaireSousReserve,
    });
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

    const dossier = await prisma.dossierInscription.findUnique({
      where: { inscriptionId },
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier d\'inscription non trouvé' });
    }

    const updated = await prisma.dossierInscription.update({
      where: { id: dossier.id },
      data: { piecesExtras },
      include: {
        inscription: { include: { concours: true } },
      },
    });

    res.json({
      message: 'Pièces extras mises à jour avec succès',
      inscription: {
        ...updated.inscription,
        dossierInscription: updated,
        piecesExtras: updated.piecesExtras,
      },
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
      include: {
        dossierInscription: true
      }
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée ou non autorisée' });
    }

    // Vérifier que le statut est EN_ATTENTE
    if (inscription.dossierInscription && inscription.dossierInscription.statut !== 'EN_ATTENTE') {
      return res.status(400).json({
        error: 'Impossible d\'annuler une inscription déjà traitée',
      });
    }

    // Supprimer l'inscription (cascade supprimera DossierInscription et ActionHistory)
    await prisma.inscription.delete({
      where: { id: inscriptionId },
    });

    res.json({ message: 'Inscription annulée avec succès' });
  } catch (error) {
    console.error('Erreur annulation inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;