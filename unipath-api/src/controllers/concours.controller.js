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
const {
  resolveFiltreAnneePourListe,
  assertConcoursAccessible,
  getOrCreateAnneeEnCours,
  validateDatesDansAnneeAcademique,
} = require('../utils/annee-academique.helper');

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

/** Concours.etablissement is free text; match against Etablissement.nom (sigle or label). */
const concoursMatchesEtablissementNom = (etablissementLabel, etabNom) => {
  const label = String(etablissementLabel || '').toLowerCase().trim();
  const nom = String(etabNom || '').toLowerCase().trim();
  if (!label || !nom) return false;
  if (label === nom) return true;
  if (label.includes(`(${nom})`)) return true;
  if (label.includes(` - ${nom}`)) return true;
  if (label.startsWith(`${nom} `) || label.startsWith(`${nom}-`) || label.startsWith(`${nom}(`)) {
    return true;
  }
  const escaped = nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i').test(label);
};

exports.getAllConcours = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { etablissementId, etablissement } = req.query;
    let candidat = null;

    if (userId) {
      candidat = await prisma.candidat.findUnique({
        where: { id: userId },
        select: { serie: true },
      });
    }

    const filtreAnnee = await resolveFiltreAnneePourListe(req);
    if (filtreAnnee.error) {
      return res.status(filtreAnnee.status || 400).json({ error: filtreAnnee.error });
    }

    let filtreNom = typeof etablissement === 'string' ? etablissement.trim() : '';
    if (etablissementId) {
      const etab = await prisma.etablissement.findUnique({
        where: { id: String(etablissementId) },
        select: { nom: true },
      });
      if (!etab) {
        return res.json([]);
      }
      filtreNom = etab.nom;
    }

    const concours = await prisma.concours.findMany({
      where: filtreAnnee.where,
      orderBy: { dateDebut: 'asc' },
      include: {
        annee: { select: { id: true, libelle: true, enCoursDec: true, enCoursDges: true } },
        centresActifs: {
          where: { estActif: true },
          select: { id: true },
        },
        _count: { select: { inscriptions: true } },
      },
    });

    let concoursFiltres = concours;
    if (filtreNom) {
      concoursFiltres = concoursFiltres.filter((c) =>
        concoursMatchesEtablissementNom(c.etablissement, filtreNom)
      );
    }
    if (candidat?.serie) {
      concoursFiltres = concoursFiltres.filter(c => {
        return candidateSerieMatchesConcours(candidat.serie, c.seriesAcceptees);
      });
    }

    res.json(concoursFiltres.map((c) => ({
      ...c,
      anneeAcademique: c.annee?.libelle || null,
      nombreInscrits: c._count?.inscriptions ?? 0,
      hasCentresActifs: (c.centresActifs?.length || 0) > 0,
      centresActifs: undefined,
      _count: undefined,
    })));
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
        centresActifs: {
          where: { estActif: true },
          include: { centre: true },
        },
      },
    });

    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    const access = await assertConcoursAccessible(concours, req);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error, code: access.code });
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

          return {
            ...pieceObj,
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
      hasCentresActifs: (concours.centresActifs?.length || 0) > 0,
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
      // Par défaut (DGES, public), on ne montre que les validés définitivement
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
        dossierInscription: {
          select: {
            statut: true,
            centreChoisi: {
              select: {
                centre: {
                  select: {
                    id: true,
                    nom: true,
                    ville: true,
                    communeCode: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ note: 'desc' }],
    });

    const userRole = req.user?.role;
    const isDec = userRole === 'DEC';

    const classement = inscriptions.map((inscription, index) => {
      const centreRaw = inscription.dossierInscription?.centreChoisi?.centre || null;
      const centre = centreRaw
        ? {
            id: centreRaw.id,
            nom: centreRaw.nom,
            ville: centreRaw.ville,
            ...(isDec
              ? {
                  communeCode: centreRaw.communeCode || null,
                  code: centreRaw.code || null,
                }
              : {}),
          }
        : null;

      return {
        rang: inscription.note !== null ? index + 1 : null,
        candidat: inscription.candidat,
        note: inscription.note,
        numeroTable: inscription.numeroTable || null,
        centre,
        statut: inscription.note !== null ? 'Présent' : 'Absent',
      };
    });

    res.json({
      concours: {
        id: concours.id,
        libelle: concours.libelle,
        ...(isDec ? { code: concours.code || null } : {}),
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
      criteresEligibilite,
      dateDebutDepot,
      dateFinDepot,
      dateDebutComposition,
      dateFinComposition,
      centreIds,
      anneeAcademique,
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

    const validationCriteres = validateCriteresEligibilite(criteresEligibilite);
    if (!validationCriteres.valid) {
      return res.status(400).json({ error: validationCriteres.error });
    }

    const piecesData = Array.isArray(piecesRequises)
      ? { pieces: piecesRequises }
      : piecesRequises;
    const criteresData = normalizeCriteresEligibilite(criteresEligibilite);
    const piecesPayload = Array.isArray(piecesData) ? { pieces: piecesData } : { ...piecesData };
    if (criteresData) {
      piecesPayload.criteresEligibilite = criteresData.criteres;
    }

    const { defaultAnneeFromLibelle } = require('../utils/centres-composition.helper');
    const uniqueCentreIds = Array.isArray(centreIds)
      ? [...new Set(centreIds.filter(Boolean))]
      : [];

    if (uniqueCentreIds.length > 0) {
      const found = await prisma.centreComposition.count({
        where: { id: { in: uniqueCentreIds }, actif: true },
      });
      if (found !== uniqueCentreIds.length) {
        return res.status(400).json({ error: 'Un ou plusieurs centres de composition sont invalides' });
      }
    }

    const anneeCentres = (anneeAcademique && String(anneeAcademique).trim())
      || defaultAnneeFromLibelle(libelle);

    let anneeCourante = null;
    if (req.body?.anneeAcademiqueId) {
      anneeCourante = await prisma.anneeAcademique.findUnique({
        where: { id: String(req.body.anneeAcademiqueId) },
      });
      if (!anneeCourante) {
        return res.status(400).json({ error: 'Année académique invalide' });
      }
    } else {
      anneeCourante = await getOrCreateAnneeEnCours();
    }

    const datesVsAnnee = validateDatesDansAnneeAcademique(
      {
        dateDebutDepot,
        dateFinDepot,
        dateDebutComposition,
        dateFinComposition,
      },
      anneeCourante.libelle
    );
    if (!datesVsAnnee.ok) {
      return res.status(400).json({ error: datesVsAnnee.error });
    }

    const { allocuerCodeConcours } = require('../utils/numero-table.helper');

    const concours = await prisma.$transaction(async (tx) => {
      const codeConcours = await allocuerCodeConcours(tx);
      const created = await tx.concours.create({
        data: {
          libelle,
          code: codeConcours,
          etablissement,
          dateDebut: new Date(dateDebutDepot),
          dateFin: new Date(dateFinDepot),
          dateComposition: new Date(dateDebutComposition),
          description: description || null,
          fraisParticipation: parseInt(fraisParticipation),
          seriesAcceptees,
          matieres: matieres || [],
          piecesRequises: piecesPayload,
          dateDebutDepot: new Date(dateDebutDepot),
          dateFinDepot: new Date(dateFinDepot),
          dateDebutComposition: new Date(dateDebutComposition),
          dateFinComposition: new Date(dateFinComposition),
          anneeAcademiqueId: anneeCourante.id,
        },
      });

      if (uniqueCentreIds.length > 0) {
        await tx.concoursCentreComposition.createMany({
          data: uniqueCentreIds.map((centreId) => ({
            concoursId: created.id,
            centreId,
            anneeAcademique: anneeCentres,
          })),
        });
      }

      return created;
    });

    const withCentres = await prisma.concours.findUnique({
      where: { id: concours.id },
      include: {
        annee: { select: { id: true, libelle: true, enCoursDec: true, enCoursDges: true } },
        centresActifs: { include: { centre: true } },
      },
    });

    res.status(201).json(withCentres);
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
      criteresEligibilite,
      dateDebutDepot,
      dateFinDepot,
      dateDebutComposition,
      dateFinComposition,
      centreIds,
      anneeAcademique,
    } = req.body;

    const existing = await prisma.concours.findUnique({
      where: { id },
      include: {
        _count: { select: { inscriptions: true } },
        annee: { select: { id: true, libelle: true } },
      },
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

    const anneeCible = existing.annee
      || (existing.anneeAcademiqueId
        ? await prisma.anneeAcademique.findUnique({ where: { id: existing.anneeAcademiqueId } })
        : await getOrCreateAnneeEnCours());

    if (anneeCible?.libelle) {
      const datesVsAnnee = validateDatesDansAnneeAcademique(
        {
          dateDebutDepot: dateDebutDepot ?? existing.dateDebutDepot,
          dateFinDepot: dateFinDepot ?? existing.dateFinDepot,
          dateDebutComposition: dateDebutComposition ?? existing.dateDebutComposition,
          dateFinComposition: dateFinComposition ?? existing.dateFinComposition,
        },
        anneeCible.libelle
      );
      if (!datesVsAnnee.ok) {
        return res.status(400).json({ error: datesVsAnnee.error });
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
    }

    const concours = await prisma.concours.update({
      where: { id },
      data: updateData,
    });

    if (Array.isArray(centreIds)) {
      const { defaultAnneeFromLibelle } = require('../utils/centres-composition.helper');
      const uniqueIds = [...new Set(centreIds.filter(Boolean))];
      const annee = (anneeAcademique && String(anneeAcademique).trim())
        || defaultAnneeFromLibelle(libelle || existing.libelle);

      if (uniqueIds.length > 0) {
        const found = await prisma.centreComposition.count({
          where: { id: { in: uniqueIds }, actif: true },
        });
        if (found !== uniqueIds.length) {
          return res.status(400).json({ error: 'Un ou plusieurs centres de composition sont invalides' });
        }
      }

      await prisma.$transaction(async (tx) => {
        const existants = await tx.concoursCentreComposition.findMany({
          where: { concoursId: id },
          include: { _count: { select: { dossiers: true } } },
        });

        const toKeep = new Set();
        for (const link of existants) {
          if (uniqueIds.includes(link.centreId)) {
            toKeep.add(link.centreId);
            if (!link.estActif) {
              await tx.concoursCentreComposition.update({
                where: { id: link.id },
                data: { estActif: true },
              });
            }
          } else if (link._count.dossiers > 0) {
            await tx.concoursCentreComposition.update({
              where: { id: link.id },
              data: { estActif: false },
            });
          } else {
            await tx.concoursCentreComposition.delete({ where: { id: link.id } });
          }
        }

        for (const centreId of uniqueIds) {
          if (toKeep.has(centreId)) continue;
          if (existants.some((l) => l.centreId === centreId)) continue;
          await tx.concoursCentreComposition.create({
            data: { concoursId: id, centreId, anneeAcademique: annee },
          });
        }
      });
    }

    const withCentres = await prisma.concours.findUnique({
      where: { id },
      include: { centresActifs: { include: { centre: true } } },
    });

    const response = { ...withCentres };
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