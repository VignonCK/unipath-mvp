// src/controllers/concours.controller.js
const prisma = require('../prisma');
const {
  validateDatesDepot,
  validateDatesComposition,
  validateDatesCoherence,
  validateSeries,
  validatePiecesRequises
} = require('../utils/concours.validation');

exports.getAllConcours = async (req, res) => {
  try {
    const userId = req.user?.id;
    let candidat = null;

    if (userId) {
      candidat = await prisma.candidat.findUnique({
        where: { id: userId },
        select: { serie: true },
      });
    }

    const concours = await prisma.concours.findMany({
      orderBy: { dateDebut: 'asc' },
    });

    let concoursFiltres = concours;
    if (candidat?.serie) {
      concoursFiltres = concours.filter(c => {
        if (!c.seriesAcceptees || c.seriesAcceptees.length === 0) return true;
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
    const userId = req.user?.id;

    const concours = await prisma.concours.findUnique({
      where: { id },
      include: {
        _count: { select: { inscriptions: true } },
      },
    });

    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    // Récupérer le dossier du candidat si authentifié
    let dossierCandidat = null;
    if (userId) {
      dossierCandidat = await prisma.dossier.findUnique({
        where: { candidatId: userId },
      });
    }

    res.json({ ...concours, dossierCandidat });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getClassement = async (req, res) => {
  try {
    const { id } = req.params;

    const concours = await prisma.concours.findUnique({ where: { id } });
    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

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
      orderBy: [{ note: 'desc' }],
    });

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
      matieres,
      piecesRequises,
      dateDebutDepot,
      dateFinDepot,
      dateDebutComposition,
      dateFinComposition
    } = req.body;

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

    const validationDepot = validateDatesDepot(dateDebutDepot, dateFinDepot);
    if (!validationDepot.valid) {
      return res.status(400).json({ error: validationDepot.error });
    }

    const validationComposition = validateDatesComposition(dateDebutComposition, dateFinComposition);
    if (!validationComposition.valid) {
      return res.status(400).json({ error: validationComposition.error });
    }

    const validationCoherence = validateDatesCoherence(dateFinDepot, dateDebutComposition);
    if (!validationCoherence.valid) {
      return res.status(400).json({ error: validationCoherence.error });
    }

    const validationSeries = validateSeries(seriesAcceptees);
    if (!validationSeries.valid) {
      return res.status(400).json({
        error: validationSeries.error,
        invalidSeries: validationSeries.invalidSeries
      });
    }

    if (!piecesRequises) {
      return res.status(400).json({ error: 'La configuration des pièces requises est obligatoire' });
    }

    const validationPieces = validatePiecesRequises(piecesRequises);
    if (!validationPieces.valid) {
      return res.status(400).json({ error: validationPieces.error });
    }

    const piecesData = Array.isArray(piecesRequises)
      ? { pieces: piecesRequises }
      : piecesRequises;

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
        matieres: matieres || [],
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
      matieres,
      piecesRequises,
      dateDebutDepot,
      dateFinDepot,
      dateDebutComposition,
      dateFinComposition
    } = req.body;

    const existing = await prisma.concours.findUnique({
      where: { id },
      include: { _count: { select: { inscriptions: true } } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    const updateData = {};
    let hasInscriptions = existing._count.inscriptions > 0;
    let piecesModified = false;

    if (libelle !== undefined) updateData.libelle = libelle;
    if (etablissement !== undefined) updateData.etablissement = etablissement;
    if (description !== undefined) updateData.description = description || null;
    if (fraisParticipation !== undefined) {
      updateData.fraisParticipation = parseInt(fraisParticipation);
    }

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

    if (dateDebutComposition !== undefined && dateFinComposition !== undefined) {
      const validationComposition = validateDatesComposition(dateDebutComposition, dateFinComposition);
      if (!validationComposition.valid) {
        return res.status(400).json({ error: validationComposition.error });
      }
      updateData.dateDebutComposition = new Date(dateDebutComposition);
      updateData.dateFinComposition = new Date(dateFinComposition);
      updateData.dateComposition = new Date(dateDebutComposition);
    }

    const finalDateFinDepot = dateFinDepot || existing.dateFinDepot;
    const finalDateDebutComposition = dateDebutComposition || existing.dateDebutComposition;

    if (finalDateFinDepot && finalDateDebutComposition) {
      const validationCoherence = validateDatesCoherence(finalDateFinDepot, finalDateDebutComposition);
      if (!validationCoherence.valid) {
        return res.status(400).json({ error: validationCoherence.error });
      }
    }

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

    if (matieres !== undefined) {
      updateData.matieres = Array.isArray(matieres) ? matieres : [];
    }

    if (piecesRequises !== undefined) {
      const validationPieces = validatePiecesRequises(piecesRequises);
      if (!validationPieces.valid) {
        return res.status(400).json({ error: validationPieces.error });
      }

      const piecesData = Array.isArray(piecesRequises)
        ? { pieces: piecesRequises }
        : piecesRequises;

      updateData.piecesRequises = piecesData;
      piecesModified = true;
    }

    const concours = await prisma.concours.update({
      where: { id },
      data: updateData,
    });

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

    const existing = await prisma.concours.findUnique({
      where: { id },
      include: { _count: { select: { inscriptions: true } } },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

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