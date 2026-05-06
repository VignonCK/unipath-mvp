// src/controllers/concours.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {
  validateDatesDepot,
  validateDatesComposition,
  validateDatesCoherence,
  validateSeries,
  validatePiecesRequises
} = require('../utils/concours.validation');

exports.getAllConcours = async (req, res) => {
  try {
    const userId = req.user?.id; // Si authentifié
    let candidat = null;

    // Si l'utilisateur est authentifié, récupérer sa série
    if (userId) {
      candidat = await prisma.candidat.findUnique({
        where: { id: userId },
        select: { serie: true },
      });
    }

    const concours = await prisma.concours.findMany({
      orderBy: { dateDebut: 'asc' },
    });

    // Filtrer par série si le candidat a une série définie
    let concoursFiltres = concours;
    if (candidat?.serie) {
      concoursFiltres = concours.filter(c => {
        // Si le concours n'a pas de séries définies ou si le tableau est vide, il est ouvert à tous
        if (!c.seriesAcceptees || c.seriesAcceptees.length === 0) {
          return true;
        }
        // Sinon, vérifier si la série du candidat est acceptée
        return c.seriesAcceptees.includes(candidat.serie);
      });
    }

    res.json(concoursFiltres);
  } catch (error) {
    console.error('Erreur getAllConcours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getConcoursById = async (req, res) => {
  try {
    const { id } = req.params;

    const concours = await prisma.concours.findUnique({
      where: { id },
      include: {
        _count: { select: { inscriptions: true } },
      },
    });

    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    res.json(concours);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getClassement = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le concours existe
    const concours = await prisma.concours.findUnique({ where: { id } });
    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    // Récupérer toutes les inscriptions validées avec leurs notes
    const inscriptions = await prisma.inscription.findMany({
      where: {
        concoursId: id,
        statut: 'VALIDE',
      },
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
      },
      orderBy: [
        { note: 'desc' }, // Tri par note décroissante (les meilleurs en premier)
      ],
    });

    // Ajouter le rang
    const classement = inscriptions.map((inscription, index) => ({
      rang: inscription.note !== null ? index + 1 : null,
      candidat: inscription.candidat,
      note: inscription.note,
      statut: inscription.note !== null ? 'Présent' : 'Absent',
    }));

    res.json({
      concours: {
        id: concours.id,
        libelle: concours.libelle,
        etablissement: concours.etablissement,
        dateComposition: concours.dateComposition,
      },
      totalCandidats: classement.length,
      candidatsPresents: classement.filter(c => c.note !== null).length,
      candidatsAbsents: classement.filter(c => c.note === null).length,
      classement,
    });
  } catch (error) {
    console.error('Erreur récupération classement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.createConcours = async (req, res) => {
  try {
    const {
      libelle,
      etablissement,
      dateDebut,
      dateFin,
      dateComposition,
      description,
      fraisParticipation,
      seriesAcceptees,
      piecesRequises,
      dateDebutDepot,
      dateFinDepot,
      dateDebutComposition,
      dateFinComposition
    } = req.body;

    // Validation des champs obligatoires
    const missingFields = [];
    if (!libelle) missingFields.push('libelle');
    if (!etablissement) missingFields.push('etablissement');
    if (!dateDebutDepot) missingFields.push('dateDebutDepot');
    if (!dateFinDepot) missingFields.push('dateFinDepot');
    if (!dateDebutComposition) missingFields.push('dateDebutComposition');
    if (!dateFinComposition) missingFields.push('dateFinComposition');
    if (!fraisParticipation) missingFields.push('fraisParticipation');
    if (!seriesAcceptees || (Array.isArray(seriesAcceptees) && seriesAcceptees.length === 0)) {
      missingFields.push('seriesAcceptees');
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Tous les champs obligatoires doivent être renseignés',
        missingFields
      });
    }

    // Validation des dates de dépôt
    const validationDepot = validateDatesDepot(dateDebutDepot, dateFinDepot);
    if (!validationDepot.valid) {
      return res.status(400).json({ error: validationDepot.error });
    }

    // Validation des dates de composition
    const validationComposition = validateDatesComposition(dateDebutComposition, dateFinComposition);
    if (!validationComposition.valid) {
      return res.status(400).json({ error: validationComposition.error });
    }

    // Validation de la cohérence entre dépôt et composition
    const validationCoherence = validateDatesCoherence(dateFinDepot, dateDebutComposition);
    if (!validationCoherence.valid) {
      return res.status(400).json({ error: validationCoherence.error });
    }

    // Validation des séries acceptées
    const validationSeries = validateSeries(seriesAcceptees);
    if (!validationSeries.valid) {
      return res.status(400).json({
        error: validationSeries.error,
        invalidSeries: validationSeries.invalidSeries
      });
    }

    // Validation des pièces requises
    if (!piecesRequises) {
      return res.status(400).json({ error: 'La configuration des pièces requises est obligatoire' });
    }

    const validationPieces = validatePiecesRequises(piecesRequises);
    if (!validationPieces.valid) {
      return res.status(400).json({ error: validationPieces.error });
    }

    // Normaliser la structure des pièces requises
    const piecesData = Array.isArray(piecesRequises) 
      ? { pieces: piecesRequises }
      : piecesRequises;

    // Création du concours avec tous les nouveaux champs
    const concours = await prisma.concours.create({
      data: {
        libelle,
        etablissement,
        dateDebut: new Date(dateDebutDepot),
        dateFin: new Date(dateFinDepot),
        dateComposition: new Date(dateDebutComposition),
        description: description || null,
        fraisParticipation: parseInt(fraisParticipation),
        seriesAcceptees,
        piecesRequises: piecesData,
        dateDebutDepot: new Date(dateDebutDepot),
        dateFinDepot: new Date(dateFinDepot),
        dateDebutComposition: new Date(dateDebutComposition),
        dateFinComposition: new Date(dateFinComposition)
      },
    });

    res.status(201).json(concours);
  } catch (error) {
    console.error('Erreur création concours:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du concours' });
  }
};

exports.updateConcours = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      libelle,
      etablissement,
      dateDebut,
      dateFin,
      dateComposition,
      description,
      fraisParticipation,
      seriesAcceptees,
      piecesRequises,
      dateDebutDepot,
      dateFinDepot,
      dateDebutComposition,
      dateFinComposition
    } = req.body;

    // Vérifier que le concours existe et récupérer le nombre d'inscriptions
    const existing = await prisma.concours.findUnique({
      where: { id },
      include: { _count: { select: { inscriptions: true } } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    // Préparer les données de mise à jour
    const updateData = {};
    let hasInscriptions = existing._count.inscriptions > 0;
    let piecesModified = false;

    // Validation et mise à jour des champs de base
    if (libelle !== undefined) updateData.libelle = libelle;
    if (etablissement !== undefined) updateData.etablissement = etablissement;
    if (description !== undefined) updateData.description = description || null;
    if (fraisParticipation !== undefined) {
      updateData.fraisParticipation = parseInt(fraisParticipation);
    }

    // Validation et mise à jour des dates de dépôt
    if (dateDebutDepot !== undefined && dateFinDepot !== undefined) {
      const validationDepot = validateDatesDepot(dateDebutDepot, dateFinDepot);
      if (!validationDepot.valid) {
        return res.status(400).json({ error: validationDepot.error });
      }
      updateData.dateDebutDepot = new Date(dateDebutDepot);
      updateData.dateFinDepot = new Date(dateFinDepot);
      updateData.dateDebut = new Date(dateDebutDepot);
      updateData.dateFin = new Date(dateFinDepot);
    }

    // Validation et mise à jour des dates de composition
    if (dateDebutComposition !== undefined && dateFinComposition !== undefined) {
      const validationComposition = validateDatesComposition(dateDebutComposition, dateFinComposition);
      if (!validationComposition.valid) {
        return res.status(400).json({ error: validationComposition.error });
      }
      updateData.dateDebutComposition = new Date(dateDebutComposition);
      updateData.dateFinComposition = new Date(dateFinComposition);
      updateData.dateComposition = new Date(dateDebutComposition);
    }

    // Validation de la cohérence des dates
    const finalDateFinDepot = dateFinDepot || existing.dateFinDepot;
    const finalDateDebutComposition = dateDebutComposition || existing.dateDebutComposition;
    
    if (finalDateFinDepot && finalDateDebutComposition) {
      const validationCoherence = validateDatesCoherence(finalDateFinDepot, finalDateDebutComposition);
      if (!validationCoherence.valid) {
        return res.status(400).json({ error: validationCoherence.error });
      }
    }

    // Validation et mise à jour des séries acceptées
    if (seriesAcceptees !== undefined) {
      const validationSeries = validateSeries(seriesAcceptees);
      if (!validationSeries.valid) {
        return res.status(400).json({
          error: validationSeries.error,
          invalidSeries: validationSeries.invalidSeries
        });
      }
      updateData.seriesAcceptees = seriesAcceptees;
    }

    // Validation et mise à jour des pièces requises
    if (piecesRequises !== undefined) {
      const validationPieces = validatePiecesRequises(piecesRequises);
      if (!validationPieces.valid) {
        return res.status(400).json({ error: validationPieces.error });
      }

      // Normaliser la structure des pièces requises
      const piecesData = Array.isArray(piecesRequises) 
        ? { pieces: piecesRequises }
        : piecesRequises;

      updateData.piecesRequises = piecesData;
      piecesModified = true;
    }

    // Mettre à jour le concours
    const concours = await prisma.concours.update({
      where: { id },
      data: updateData,
    });

    // Ajouter un avertissement si des inscriptions existent et que les pièces ont été modifiées
    const response = { ...concours };
    if (hasInscriptions && piecesModified) {
      response.warning = 'Attention : Ce concours a déjà des inscriptions. La modification des pièces requises peut affecter les candidats existants.';
    }

    res.json(response);
  } catch (error) {
    console.error('Erreur mise à jour concours:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du concours' });
  }
};

exports.deleteConcours = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le concours existe
    const existing = await prisma.concours.findUnique({
      where: { id },
      include: { _count: { select: { inscriptions: true } } },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    // Empêcher la suppression si des inscriptions existent
    if (existing._count.inscriptions > 0) {
      return res.status(400).json({ 
        error: `Impossible de supprimer ce concours car ${existing._count.inscriptions} inscription(s) existe(nt)` 
      });
    }

    await prisma.concours.delete({ where: { id } });

    res.json({ message: 'Concours supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression concours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};