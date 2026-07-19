const prisma = require('../prisma');
const logger = require('../config/logger');
const {
  getAnneeEnCoursDges,
  getOrCreateAnneeEnCoursDges,
} = require('../utils/annee-academique.helper');
const { validatePiecesCampagne } = require('../utils/concours.validation');
const {
  normalizePiecesPayload,
  extractPiecesList,
  getDefaultPiecesCampagne,
} = require('../utils/campagne-pieces.helper');

const CAMPAGNE_INCLUDE = {
  filieres: {
    include: {
      filiere: {
        select: { id: true, nom: true, code: true, niveau: true, dureeAnnees: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
  etablissement: {
    select: { id: true, nom: true, type: true, ville: true, adresse: true },
  },
};

async function getAdminContext(req) {
  return prisma.adminEtablissement.findUnique({
    where: { id: req.user.id },
    select: { id: true, etablissementId: true },
  });
}

function parseDate(value, fieldName) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    return { error: `${fieldName} invalide` };
  }
  return { date };
}

/** Extrait A1 depuis « A1-A2 » (ex. 2025-2026 → 2025). */
function anneeA1FromLibelle(libelle) {
  const match = String(libelle || '').trim().match(/^(\d{4})-\d{4}$/);
  return match ? Number(match[1]) : null;
}

/** Année civile d'une date ISO / Date (évite les décalages fuseau sur YYYY-MM-DD). */
function yearFromDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const iso = value.toISOString();
    return Number(iso.slice(0, 4));
  }
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return Number(raw.slice(0, 4));
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return Number(d.toISOString().slice(0, 4));
}

function assertDatesDansAnneeA1(dateOuverture, dateCloture, anneeLibelle) {
  const a1 = anneeA1FromLibelle(anneeLibelle);
  if (!a1) {
    return { error: `Année académique invalide (« ${anneeLibelle} »).` };
  }
  const yOuv = yearFromDateValue(dateOuverture);
  const yClo = yearFromDateValue(dateCloture);
  if (yOuv !== a1 || yClo !== a1) {
    return {
      error: `Les dates d'ouverture et de clôture doivent être en ${a1} (année A1 de ${anneeLibelle}).`,
    };
  }
  return { ok: true, a1 };
}

/** Toujours l'année en cours Module 2 (DGES) — l'admin ne choisit pas l'année. */
async function resolveAnneeAcademiqueModule2() {
  const anneeDges = await getOrCreateAnneeEnCoursDges();
  return { ok: true, libelle: anneeDges.libelle };
}

function validerFilieresCampagne(filieres, etablissementId) {
  if (!Array.isArray(filieres)) return null;
  for (const f of filieres) {
    if (!f.filiereId) return 'Chaque filière doit avoir un filiereId';
    if (f.fraisDossier === undefined || f.fraisDossier === null || Number(f.fraisDossier) < 0) {
      return 'fraisDossier est obligatoire et doit être >= 0 pour chaque filière';
    }
    if (f.seriesAcceptees && !Array.isArray(f.seriesAcceptees)) {
      return 'seriesAcceptees doit être un tableau';
    }
  }
  return null;
}

async function assertFilieresAppartiennentEtablissement(filieres, etablissementId) {
  if (!filieres?.length) return null;
  const ids = filieres.map((f) => f.filiereId);
  const count = await prisma.filiere.count({
    where: { id: { in: ids }, etablissementId },
  });
  if (count !== ids.length) {
    return 'Une ou plusieurs filières n\'appartiennent pas à votre établissement';
  }
  return null;
}

function mapFiliereInput(f) {
  return {
    filiereId: f.filiereId,
    fraisDossier: Number(f.fraisDossier),
    placesDisponibles: null,
    criteresSelection: f.criteresSelection?.trim() || null,
    seriesAcceptees: Array.isArray(f.seriesAcceptees) ? f.seriesAcceptees : [],
    niveauMinBac: f.niveauMinBac?.trim() || null,
    autresCriteres: f.autresCriteres ?? null,
  };
}

exports.creerCampagne = async (req, res) => {
  try {
    const admin = await getAdminContext(req);
    if (!admin) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }

    const { titre, dateOuverture, dateCloture, description, filieres, piecesRequises } = req.body;

    if (!titre?.trim()) {
      return res.status(400).json({ error: 'titre est obligatoire' });
    }

    const anneeResolue = await resolveAnneeAcademiqueModule2();
    if (!anneeResolue.ok) {
      return res.status(400).json({ error: anneeResolue.error });
    }
    const anneeLibelle = anneeResolue.libelle;

    const ouverture = parseDate(dateOuverture, 'dateOuverture');
    if (ouverture.error) return res.status(400).json({ error: ouverture.error });
    const cloture = parseDate(dateCloture, 'dateCloture');
    if (cloture.error) return res.status(400).json({ error: cloture.error });
    if (cloture.date <= ouverture.date) {
      return res.status(400).json({ error: 'dateCloture doit être postérieure à dateOuverture' });
    }
    const datesAnnee = assertDatesDansAnneeA1(dateOuverture, dateCloture, anneeLibelle);
    if (datesAnnee.error) return res.status(400).json({ error: datesAnnee.error });

    const erreurFilieres = validerFilieresCampagne(filieres, admin.etablissementId);
    if (erreurFilieres) return res.status(400).json({ error: erreurFilieres });

    const erreurAppartenance = await assertFilieresAppartiennentEtablissement(filieres, admin.etablissementId);
    if (erreurAppartenance) return res.status(400).json({ error: erreurAppartenance });

    let piecesPayload = null;
    if (piecesRequises !== undefined && piecesRequises !== null) {
      const validationPieces = validatePiecesCampagne(piecesRequises);
      if (!validationPieces.valid) {
        return res.status(400).json({ error: validationPieces.error });
      }
      piecesPayload = normalizePiecesPayload(piecesRequises);
    } else {
      piecesPayload = normalizePiecesPayload(getDefaultPiecesCampagne());
    }

    const campagne = await prisma.campagneInscription.create({
      data: {
        etablissementId: admin.etablissementId,
        titre: titre.trim(),
        anneeAcademique: anneeLibelle,
        dateOuverture: ouverture.date,
        dateCloture: cloture.date,
        description: description?.trim() || null,
        piecesRequises: piecesPayload,
        statut: 'BROUILLON',
        createdBy: admin.id,
        ...(Array.isArray(filieres) && filieres.length > 0
          ? { filieres: { create: filieres.map(mapFiliereInput) } }
          : {}),
      },
      include: CAMPAGNE_INCLUDE,
    });

    logger.info('[Campagne] Campagne créée', { campagneId: campagne.id, etablissementId: admin.etablissementId });

    return res.status(201).json({
      message: 'Campagne créée avec succès',
      campagne,
    });
  } catch (error) {
    logger.error('[Campagne] Erreur creerCampagne', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.listerMesCampagnes = async (req, res) => {
  try {
    const admin = await getAdminContext(req);
    if (!admin) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }

    const { statut } = req.query;
    const where = {
      etablissementId: admin.etablissementId,
      ...(statut ? { statut } : {}),
    };

    const campagnes = await prisma.campagneInscription.findMany({
      where,
      include: CAMPAGNE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      message: 'Campagnes récupérées avec succès',
      campagnes,
    });
  } catch (error) {
    logger.error('[Campagne] Erreur listerMesCampagnes', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getCampagneById = async (req, res) => {
  try {
    const admin = await getAdminContext(req);
    if (!admin) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }

    const campagne = await prisma.campagneInscription.findFirst({
      where: { id: req.params.id, etablissementId: admin.etablissementId },
      include: CAMPAGNE_INCLUDE,
    });

    if (!campagne) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }

    return res.json({ message: 'Campagne récupérée avec succès', campagne });
  } catch (error) {
    logger.error('[Campagne] Erreur getCampagneById', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.modifierCampagne = async (req, res) => {
  try {
    const admin = await getAdminContext(req);
    if (!admin) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }

    const campagne = await prisma.campagneInscription.findFirst({
      where: { id: req.params.id, etablissementId: admin.etablissementId },
    });
    if (!campagne) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    if (!['BROUILLON', 'PUBLIEE'].includes(campagne.statut)) {
      return res.status(400).json({ error: 'Seules les campagnes BROUILLON ou PUBLIEE peuvent être modifiées' });
    }

    const { titre, dateOuverture, dateCloture, description, filieres, piecesRequises } = req.body;
    const updateData = {};

    if (titre !== undefined) updateData.titre = titre.trim();
    // anneeAcademique figée à la création (année DGES en cours) — non modifiable
    if (description !== undefined) updateData.description = description?.trim() || null;

    if (piecesRequises !== undefined) {
      if (piecesRequises === null) {
        updateData.piecesRequises = null;
      } else {
        const validationPieces = validatePiecesCampagne(piecesRequises);
        if (!validationPieces.valid) {
          return res.status(400).json({ error: validationPieces.error });
        }
        updateData.piecesRequises = normalizePiecesPayload(piecesRequises);
      }
    }

    let dateOuvertureParsed = campagne.dateOuverture;
    let dateClotureParsed = campagne.dateCloture;

    if (dateOuverture !== undefined) {
      const parsed = parseDate(dateOuverture, 'dateOuverture');
      if (parsed.error) return res.status(400).json({ error: parsed.error });
      dateOuvertureParsed = parsed.date;
      updateData.dateOuverture = parsed.date;
    }
    if (dateCloture !== undefined) {
      const parsed = parseDate(dateCloture, 'dateCloture');
      if (parsed.error) return res.status(400).json({ error: parsed.error });
      dateClotureParsed = parsed.date;
      updateData.dateCloture = parsed.date;
    }
    if (dateClotureParsed <= dateOuvertureParsed) {
      return res.status(400).json({ error: 'dateCloture doit être postérieure à dateOuverture' });
    }
    const datesAnnee = assertDatesDansAnneeA1(
      dateOuverture !== undefined ? dateOuverture : campagne.dateOuverture,
      dateCloture !== undefined ? dateCloture : campagne.dateCloture,
      campagne.anneeAcademique,
    );
    if (datesAnnee.error) return res.status(400).json({ error: datesAnnee.error });

    if (filieres !== undefined) {
      const erreurFilieres = validerFilieresCampagne(filieres, admin.etablissementId);
      if (erreurFilieres) return res.status(400).json({ error: erreurFilieres });
      const erreurAppartenance = await assertFilieresAppartiennentEtablissement(filieres, admin.etablissementId);
      if (erreurAppartenance) return res.status(400).json({ error: erreurAppartenance });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (filieres !== undefined) {
        await tx.campagneFiliere.deleteMany({ where: { campagneId: campagne.id } });
        if (filieres.length > 0) {
          await tx.campagneFiliere.createMany({
            data: filieres.map((f) => ({ campagneId: campagne.id, ...mapFiliereInput(f) })),
          });
        }
      }
      return tx.campagneInscription.update({
        where: { id: campagne.id },
        data: updateData,
        include: CAMPAGNE_INCLUDE,
      });
    });

    return res.json({ message: 'Campagne mise à jour avec succès', campagne: updated });
  } catch (error) {
    logger.error('[Campagne] Erreur modifierCampagne', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.supprimerCampagne = async (req, res) => {
  try {
    const admin = await getAdminContext(req);
    if (!admin) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }

    const campagne = await prisma.campagneInscription.findFirst({
      where: { id: req.params.id, etablissementId: admin.etablissementId },
    });
    if (!campagne) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    if (campagne.statut !== 'BROUILLON') {
      return res.status(400).json({ error: 'Seules les campagnes BROUILLON peuvent être supprimées' });
    }

    await prisma.campagneInscription.delete({ where: { id: campagne.id } });

    logger.info('[Campagne] Campagne supprimée', { campagneId: campagne.id });

    return res.json({ message: 'Campagne supprimée avec succès' });
  } catch (error) {
    logger.error('[Campagne] Erreur supprimerCampagne', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.publierCampagne = async (req, res) => {
  try {
    const admin = await getAdminContext(req);
    if (!admin) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }

    const campagne = await prisma.campagneInscription.findFirst({
      where: { id: req.params.id, etablissementId: admin.etablissementId },
      include: { filieres: true },
    });
    if (!campagne) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    if (campagne.statut !== 'BROUILLON') {
      return res.status(400).json({ error: 'Seule une campagne BROUILLON peut être publiée' });
    }
    if (!campagne.filieres.length) {
      return res.status(400).json({ error: 'Ajoutez au moins une filière avant de publier la campagne' });
    }
    const pieces = extractPiecesList(campagne.piecesRequises);
    if (!pieces || pieces.length === 0) {
      return res.status(400).json({
        error: 'Configurez au moins une pièce requise avant de publier la campagne',
      });
    }

    const updated = await prisma.campagneInscription.update({
      where: { id: campagne.id },
      data: { statut: 'PUBLIEE' },
      include: CAMPAGNE_INCLUDE,
    });

    return res.json({ message: 'Campagne publiée avec succès', campagne: updated });
  } catch (error) {
    logger.error('[Campagne] Erreur publierCampagne', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.cloturerCampagne = async (req, res) => {
  try {
    const admin = await getAdminContext(req);
    if (!admin) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }

    const campagne = await prisma.campagneInscription.findFirst({
      where: { id: req.params.id, etablissementId: admin.etablissementId },
    });
    if (!campagne) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    if (campagne.statut !== 'PUBLIEE') {
      return res.status(400).json({ error: 'Seule une campagne PUBLIEE peut être clôturée' });
    }

    const updated = await prisma.campagneInscription.update({
      where: { id: campagne.id },
      data: { statut: 'CLOTUREE' },
      include: CAMPAGNE_INCLUDE,
    });

    return res.json({ message: 'Campagne clôturée avec succès', campagne: updated });
  } catch (error) {
    logger.error('[Campagne] Erreur cloturerCampagne', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Consultation publique (étudiants) ─────────────────────────────

exports.listerCampagnesPubliees = async (req, res) => {
  try {
    const { ville, anneeAcademique, filiereId } = req.query;
    const now = new Date();
    const toutesAnnees = req.query?.toutesAnnees === '1' || req.query?.toutesAnnees === 'true';

    // Module 2 : sans filtre explicite, uniquement l'année en cours DGES
    let anneeFiltre = anneeAcademique ? String(anneeAcademique).trim() : '';
    if (!anneeFiltre && !toutesAnnees) {
      const anneeDges = await getAnneeEnCoursDges();
      if (anneeDges) anneeFiltre = anneeDges.libelle;
    }

    const where = {
      statut: 'PUBLIEE',
      dateOuverture: { lte: now },
      dateCloture: { gte: now },
      ...(anneeFiltre ? { anneeAcademique: anneeFiltre } : {}),
      ...(ville ? { etablissement: { ville: { equals: String(ville), mode: 'insensitive' } } } : {}),
      ...(filiereId ? { filieres: { some: { filiereId: String(filiereId) } } } : {}),
    };

    const campagnes = await prisma.campagneInscription.findMany({
      where,
      include: CAMPAGNE_INCLUDE,
      orderBy: { dateCloture: 'asc' },
    });

    return res.json({
      message: 'Campagnes publiées récupérées avec succès',
      campagnes,
      anneeAcademiqueFiltre: anneeFiltre || null,
    });
  } catch (error) {
    logger.error('[Campagne] Erreur listerCampagnesPubliees', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getCampagnePubliqueById = async (req, res) => {
  try {
    const campagne = await prisma.campagneInscription.findFirst({
      where: { id: req.params.id, statut: 'PUBLIEE' },
      include: CAMPAGNE_INCLUDE,
    });

    if (!campagne) {
      return res.status(404).json({ error: 'Campagne non trouvée ou non publiée' });
    }

    return res.json({ message: 'Campagne récupérée avec succès', campagne });
  } catch (error) {
    logger.error('[Campagne] Erreur getCampagnePubliqueById', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
