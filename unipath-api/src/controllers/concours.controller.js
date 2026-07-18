// src/controllers/concours.controller.js
const prisma = require('../prisma');
const {
  validateDatesDepot,
  validateDatesComposition,
  validateDatesCoherence,
  validateSeries,
  validatePiecesRequises,
  validateCriteresEligibilite
} = require('../utils/concours.validation');
const { candidateSerieMatchesConcours } = require('../utils/series.helper');
const { validateCentresComposition } = require('../utils/centres-composition.helper');
const { normalizePieceNom } = require('../constants/pieces.constants');
const { deriveSigleFromLibelleConcours } = require('../utils/numero-inscription.helper');

/** piece.id → champ Dossier Prisma (fallback si sourceDossier absent). */
const DOSSIER_FIELD_MAP = {
  acte_naissance: 'acteNaissance',
  'acte-naissance': 'acteNaissance',
  acteNaissance: 'acteNaissance',
  carte_identite: 'carteIdentite',
  'carte-identite': 'carteIdentite',
  carteIdentite: 'carteIdentite',
  photo_identite: 'photo',
  photo: 'photo',
  releve_notes: 'releve',
  'releve-notes': 'releve',
  releve_bac: 'releve',
  releve: 'releve',
};

const isFournieDepuisDossier = (pieceObj, dossierCandidat) => {
  if (!dossierCandidat) return false;
  if (pieceObj.sourceDossier && dossierCandidat[pieceObj.sourceDossier] != null) {
    return true;
  }
  const field = DOSSIER_FIELD_MAP[pieceObj.id];
  return field ? dossierCandidat[field] != null : false;
};

const normalizeCriteresEligibilite = (criteresEligibilite) => {
  if (criteresEligibilite === undefined || criteresEligibilite === null) return null;

  const rawList = Array.isArray(criteresEligibilite)
    ? criteresEligibilite
    : criteresEligibilite.criteres;

  if (!Array.isArray(rawList)) return { criteres: [] };

  const criteres = rawList
    .map((item) => {
      if (typeof item === 'string') {
        return { titre: item.trim(), description: null };
      }
      return {
        titre: String(item.titre || '').trim(),
        description: item.description ? String(item.description).trim() : null,
      };
    })
    .filter((item) => item.titre);

  return { criteres };
};

const ETABLISSEMENT_ORGANISATEUR_SELECT = {
  id: true,
  nom: true,
  ville: true,
  type: true,
};

async function resolveEtablissementId(etablissementId) {
  if (etablissementId === undefined) {
    return { value: undefined };
  }
  if (etablissementId === null || etablissementId === '') {
    return { value: null };
  }

  const etablissement = await prisma.etablissement.findUnique({
    where: { id: etablissementId },
    select: { id: true },
  });

  if (!etablissement) {
    return { error: 'Établissement non trouvé' };
  }

  return { value: etablissement.id };
}

exports.getAllConcours = async (req, res) => {
  try {
    const { etablissementId } = req.query;
    const userId = req.user?.id;
    let candidat = null;

    const where = {};
    if (etablissementId) {
      where.etablissementId = String(etablissementId);
    }

    if (userId && !etablissementId) {
      candidat = await prisma.candidat.findUnique({
        where: { id: userId },
        select: { serie: true },
      });
    }

    const concours = await prisma.concours.findMany({
      where,
      orderBy: { dateDebut: 'asc' },
      include: {
        etablissementOrganisateur: {
          select: ETABLISSEMENT_ORGANISATEUR_SELECT,
        },
        _count: { select: { inscriptions: true } },
      },
    });

    let concoursFiltres = concours;
    if (candidat?.serie && !etablissementId) {
      concoursFiltres = concours.filter(c => {
        return candidateSerieMatchesConcours(candidat.serie, c.seriesAcceptees);
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
        etablissementOrganisateur: {
          select: ETABLISSEMENT_ORGANISATEUR_SELECT,
        },
      },
    });

    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    // Récupérer le dossier du candidat si authentifié
    let dossierCandidat = null;
    let piecesEnrichies = null;
    let dossierPersonnelCompletude = null;

    if (userId) {
      let candidatId = userId;
      const candidatParId = await prisma.candidat.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!candidatParId && req.user?.email) {
        const candidatParEmail = await prisma.candidat.findUnique({
          where: { email: req.user.email },
          select: { id: true },
        });
        if (candidatParEmail) candidatId = candidatParEmail.id;
      }

      dossierCandidat = await prisma.dossier.findUnique({
        where: { candidatId },
      });

      // Enrichir les pièces requises avec l'état du dossier personnel
      if (concours.piecesRequises) {
        const piecesData = Array.isArray(concours.piecesRequises)
          ? concours.piecesRequises
          : (concours.piecesRequises.pieces || []);

        piecesEnrichies = piecesData.map(piece => {
          const pieceObj = typeof piece === 'object' ? piece : { id: piece, nom: piece };
          const sourceDossier = pieceObj.sourceDossier || DOSSIER_FIELD_MAP[pieceObj.id] || null;
          const fournieDepuisDossier = isFournieDepuisDossier(pieceObj, dossierCandidat);
          const nom = normalizePieceNom(pieceObj.id, pieceObj.nom);

          return {
            ...pieceObj,
            nom,
            obligatoire: pieceObj.obligatoire !== false,
            sourceDossier: pieceObj.sourceDossier ?? sourceDossier,
            fournieDepuisDossier,
            urlDocument: fournieDepuisDossier && sourceDossier
              ? dossierCandidat[sourceDossier]
              : (fournieDepuisDossier && DOSSIER_FIELD_MAP[pieceObj.id]
                ? dossierCandidat[DOSSIER_FIELD_MAP[pieceObj.id]]
                : null),
          };
        });
      }

      // Complétude du dossier personnel (4 pièces de base)
      dossierPersonnelCompletude = {
        acteNaissance: !!dossierCandidat?.acteNaissance,
        carteIdentite: !!dossierCandidat?.carteIdentite,
        photo: !!dossierCandidat?.photo,
        releve: !!dossierCandidat?.releve,
      };
    }

    const response = {
      ...concours,
      dossierCandidat
    };

    // Ajouter les pièces enrichies si le candidat est authentifié
    if (piecesEnrichies) {
      response.piecesRequises = {
        ...concours.piecesRequises,
        pieces: piecesEnrichies
      };
    }

    if (dossierPersonnelCompletude) {
      response.dossierPersonnelCompletude = dossierPersonnelCompletude;
    }

    res.json(response);
  } catch (error) {
    console.error('Erreur getConcoursById:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getClassement = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query; // Nouveau paramètre pour savoir qui demande le classement

    const concours = await prisma.concours.findUnique({ where: { id } });
    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    // Déterminer les statuts à inclure selon le rôle
    let statutsValides;
    if (role === 'COMMISSION') {
      // La commission voit les candidats qu'elle a validés (avant contrôleur)
      statutsValides = ['VALIDE_PAR_COMMISSION', 'VALIDE'];
    } else {
      // Par défaut (DEC / public), on ne montre que les validés définitivement
      statutsValides = ['VALIDE'];
    }

    const inscriptions = await prisma.inscription.findMany({
      where: {
        concoursId: id,
        dossierInscription: {
          statut: { in: statutsValides },
        },
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
      sigle,
      etablissement,
      etablissementId,
      dateDebut,
      dateFin,
      dateComposition,
      description,
      fraisParticipation,
      seriesAcceptees,
      matieres,
      piecesRequises,
      criteresEligibilite,
      dateDebutDepot,
      dateFinDepot,
      dateDebutComposition,
      dateFinComposition,
      centresComposition
    } = req.body;

    const missingFields = [];
    if (!libelle) missingFields.push('libelle');
    if (!etablissement && !etablissementId) missingFields.push('etablissement');
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

    const validationCriteres = validateCriteresEligibilite(criteresEligibilite);
    if (!validationCriteres.valid) {
      return res.status(400).json({ error: validationCriteres.error });
    }

    const validationCentres = validateCentresComposition(centresComposition);
    if (!validationCentres.valid) {
      return res.status(400).json({ error: validationCentres.error });
    }

    const resolvedEtablissement = await resolveEtablissementId(etablissementId);
    if (resolvedEtablissement.error) {
      return res.status(400).json({ error: resolvedEtablissement.error });
    }

    const piecesData = Array.isArray(piecesRequises)
      ? { pieces: piecesRequises }
      : piecesRequises;
    const criteresData = normalizeCriteresEligibilite(criteresEligibilite);
    const piecesPayload = Array.isArray(piecesData) ? { pieces: piecesData } : { ...piecesData };
    if (criteresData) {
      piecesPayload.criteresEligibilite = criteresData.criteres;
    }

    const createData = {
        libelle,
        sigle: sigle ? deriveSigleFromLibelleConcours(sigle) : deriveSigleFromLibelleConcours(libelle),
        etablissement: etablissement || null,
        dateDebut: new Date(dateDebutDepot),
        dateFin: new Date(dateFinDepot),
        dateComposition: new Date(dateDebutComposition),
        description: description || null,
        fraisParticipation: parseInt(fraisParticipation),
        seriesAcceptees,
        matieres: matieres || [],
        piecesRequises: piecesPayload,
        centresComposition: validationCentres.data,
        criteresEligibilite: criteresData ? { criteres: criteresData.criteres } : null,
        dateDebutDepot: new Date(dateDebutDepot),
        dateFinDepot: new Date(dateFinDepot),
        dateDebutComposition: new Date(dateDebutComposition),
        dateFinComposition: new Date(dateFinComposition)
    };

    if (resolvedEtablissement.value !== undefined) {
      createData.etablissementId = resolvedEtablissement.value;
    }

    const concours = await prisma.concours.create({
      data: createData,
      include: {
        etablissementOrganisateur: {
          select: ETABLISSEMENT_ORGANISATEUR_SELECT,
        },
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
      sigle,
      etablissement,
      etablissementId,
      dateDebut,
      dateFin,
      dateComposition,
      description,
      fraisParticipation,
      seriesAcceptees,
      matieres,
      piecesRequises,
      criteresEligibilite,
      dateDebutDepot,
      dateFinDepot,
      dateDebutComposition,
      dateFinComposition,
      centresComposition
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

    if (libelle !== undefined) {
      updateData.libelle = libelle;
      if (!existing.sigle) {
        updateData.sigle = deriveSigleFromLibelleConcours(libelle);
      }
    }
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

    if (criteresEligibilite !== undefined) {
      const validationCriteres = validateCriteresEligibilite(criteresEligibilite);
      if (!validationCriteres.valid) {
        return res.status(400).json({ error: validationCriteres.error });
      }
      const criteresData = normalizeCriteresEligibilite(criteresEligibilite);
      const basePieces = updateData.piecesRequises !== undefined
        ? updateData.piecesRequises
        : (existing.piecesRequises || { pieces: [] });
      const normalizedPieces = Array.isArray(basePieces)
        ? { pieces: basePieces }
        : { ...basePieces };
      normalizedPieces.criteresEligibilite = criteresData ? criteresData.criteres : [];
      updateData.piecesRequises = normalizedPieces;
      updateData.criteresEligibilite = criteresData ? { criteres: criteresData.criteres } : { criteres: [] };
    }

    if (centresComposition !== undefined) {
      const validationCentres = validateCentresComposition(centresComposition);
      if (!validationCentres.valid) {
        return res.status(400).json({ error: validationCentres.error });
      }
      updateData.centresComposition = validationCentres.data;
    }

    if (etablissementId !== undefined) {
      const resolvedEtablissement = await resolveEtablissementId(etablissementId);
      if (resolvedEtablissement.error) {
        return res.status(400).json({ error: resolvedEtablissement.error });
      }
      updateData.etablissementId = resolvedEtablissement.value;
    }

    const concours = await prisma.concours.update({
      where: { id },
      data: updateData,
      include: {
        etablissementOrganisateur: {
          select: ETABLISSEMENT_ORGANISATEUR_SELECT,
        },
      },
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

module.exports = exports;