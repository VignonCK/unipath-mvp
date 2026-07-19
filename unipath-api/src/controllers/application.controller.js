const fs = require('fs');
const prisma = require('../prisma');
const localFileStorage = require('../services/local-file-storage.service');
const pdfService = require('../services/pdf.service');
const emailService = require('../services/email.service');
const { runInBackground } = require('../utils/background-task');
const { getOrCreateAnneeEnCoursDges } = require('../utils/annee-academique.helper');
const {
  resolveEtablissementIdFromReq,
  canAccessEtablissementResource,
} = require('../utils/etablissement-access.helper');
const {
  extractPiecesList,
  piecesToVirtualRequirements,
  withNiveauSuperieurRequirements,
  getDefaultPiecesCampagne,
} = require('../utils/campagne-pieces.helper');
const {
  parseExportFilters,
  getExportReadiness,
  loadCandidaturesForExport,
  rowsToCsv,
  streamCandidaturesPdf,
} = require('../utils/candidatures-export.helper');
const {
  resolveContrainteNiveauTransfert,
  assertNiveauTransfertAutorise,
} = require('../utils/transfert-filiere.helper');

const REQUIRED_PROFILE_FIELDS = {
  nom: (c) => c?.nom,
  prenom: (c) => c?.prenom,
  email: (c) => c?.email,
  telephone: (c) => c?.telephone,
  sexe: (c) => c?.sexe,
  nationalite: (c) => c?.nationalite,
  dateNaiss: (c) => c?.dateNaiss,
  lieuNaiss: (c) => c?.lieuNaiss,
  anip: (c) => c?.anip,
  matricule: (c) => c?.matricule,
  acteNaissance: (c) => c?.dossier?.acteNaissance,
  carteIdentite: (c) => c?.dossier?.carteIdentite,
  photo: (c) => c?.dossier?.photo,
  releve: (c) => c?.dossier?.releve,
};

const DEFAULT_DOSSIER_FEES = 5000;

const buildApplicationNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `APP-${year}-${rand}`;
};

const buildReceiptNumber = (prefix) => {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${year}-${rand}`;
};

const buildPreinscriptionNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `PE-${year}-${rand}`;
};

const uploadBufferToLocal = async (buffer, storagePath, contentType) => {
  return localFileStorage.saveBuffer(buffer, storagePath);
};

const buildApplicationIncludes = () => ({
  candidat: {
    select: {
      id: true,
      matricule: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      sexe: true,
      nationalite: true,
      dateNaiss: true,
      lieuNaiss: true,
      anip: true,
      dossier: {
        select: {
          acteNaissance: true,
          carteIdentite: true,
          photo: true,
          releve: true,
        },
      },
    },
  },
  etablissement: {
    select: { id: true, nom: true, type: true, ville: true, email: true },
  },
  filiere: {
    select: { id: true, nom: true, code: true },
  },
  campagneFiliere: {
    select: {
      id: true,
      fraisDossier: true,
      campagne: {
        select: { id: true, titre: true, piecesRequises: true },
      },
    },
  },
  documents: true,
  payments: true,
  receipts: true,
  preinscription: true,
});

const getRequirementValue = (candidate, profileFieldKey) => {
  const getter = REQUIRED_PROFILE_FIELDS[profileFieldKey];
  if (!getter) return null;
  return getter(candidate);
};

const loadCampagnePiecesForApplication = async (application) => {
  if (application.campagneFiliere?.campagne?.piecesRequises) {
    return extractPiecesList(application.campagneFiliere.campagne.piecesRequises);
  }
  if (application.campagneFiliereId) {
    const cf = await prisma.campagneFiliere.findUnique({
      where: { id: application.campagneFiliereId },
      include: { campagne: { select: { piecesRequises: true } } },
    });
    return extractPiecesList(cf?.campagne?.piecesRequises);
  }
  const cf = await prisma.campagneFiliere.findFirst({
    where: {
      filiereId: application.filiereId,
      campagne: {
        etablissementId: application.etablissementId,
        anneeAcademique: application.anneeAcademique,
        statut: { in: ['PUBLIEE', 'CLOTUREE', 'BROUILLON'] },
      },
    },
    include: { campagne: { select: { piecesRequises: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return extractPiecesList(cf?.campagne?.piecesRequises);
};

const resolveApplicationRequirements = async (application) => {
  let pieces = await loadCampagnePiecesForApplication(application);
  if (pieces && pieces.length > 0) {
    return withNiveauSuperieurRequirements(piecesToVirtualRequirements(pieces), application.niveau);
  }

  const schoolReqs = await prisma.schoolRequirement.findMany({
    where: { etablissementId: application.etablissementId },
    orderBy: { createdAt: 'asc' },
  });
  if (schoolReqs.length > 0) {
    return withNiveauSuperieurRequirements(schoolReqs, application.niveau);
  }

  // Campagne sans pièces configurées → défauts Module 2 (acte, CNI, photo, relevé Bac)
  return withNiveauSuperieurRequirements(
    piecesToVirtualRequirements(getDefaultPiecesCampagne()),
    application.niveau
  );
};

const getRequirementsAndAutoDocs = async ({ application, candidate }) => {
  const requirements = await resolveApplicationRequirements(application);

  const autoSatisfied = [];
  const missing = [];

  requirements.forEach((req) => {
    if (req.isRequired === false) return;
    if (req.requirementType === 'PROFILE_FIELD' && req.profileFieldKey) {
      const value = getRequirementValue(candidate, req.profileFieldKey);
      if (value !== null && value !== undefined && value !== '') {
        autoSatisfied.push({
          code: req.code,
          label: req.label,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          schoolRequirementId: req.fromCampagne ? null : req.id,
        });
      } else {
        missing.push({ code: req.code, label: req.label, requirementType: req.requirementType });
      }
    } else {
      missing.push({ code: req.code, label: req.label, requirementType: req.requirementType });
    }
  });

  return { requirements, autoSatisfied, missing };
};

const ensureAutoDocuments = async (applicationId, autoSatisfied) => {
  for (const autoDoc of autoSatisfied) {
    await prisma.applicationDocument.upsert({
      where: {
        applicationId_code: {
          applicationId,
          code: autoDoc.code,
        },
      },
      update: {
        label: autoDoc.label,
        source: 'PROFILE_AUTO',
        status: 'PROVIDED',
        metadata: { profileValue: autoDoc.value, syncedAt: new Date().toISOString() },
      },
      create: {
        applicationId,
        schoolRequirementId: autoDoc.schoolRequirementId,
        code: autoDoc.code,
        label: autoDoc.label,
        source: 'PROFILE_AUTO',
        status: 'PROVIDED',
        metadata: { profileValue: autoDoc.value, syncedAt: new Date().toISOString() },
      },
    });
  }
};

const computeCompletion = async (applicationId) => {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      documents: true,
      payments: true,
      etablissement: { select: { id: true } },
      campagneFiliere: {
        select: {
          id: true,
          campagne: { select: { piecesRequises: true } },
        },
      },
      candidat: {
        select: {
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          sexe: true,
          nationalite: true,
          dateNaiss: true,
          lieuNaiss: true,
          anip: true,
          matricule: true,
          dossier: {
            select: {
              acteNaissance: true,
              carteIdentite: true,
              photo: true,
              releve: true,
            },
          },
        },
      },
    },
  });
  if (!app) return null;

  const requirements = (await resolveApplicationRequirements(app)).filter(
    (req) => req.isRequired !== false
  );

  const missingDocs = requirements.filter((req) => {
    const provided = app.documents.some((doc) => doc.code === req.code && doc.status === 'PROVIDED');
    if (provided) return false;
    if (req.requirementType === 'PROFILE_FIELD' && req.profileFieldKey) {
      const value = getRequirementValue(app.candidat, req.profileFieldKey);
      return value === null || value === undefined || value === '';
    }
    return true;
  });

  // Preuve des frais de dossier = quittance uploadée (style module 1) ou paiement confirmé
  const dossierFeesPaid = app.payments.some(
    (p) => p.paymentType === 'DOSSIER_FEES' && p.status === 'CONFIRMED'
  ) || app.documents.some(
    (d) => d.code === 'quittance_frais_dossier' && d.status === 'PROVIDED' && d.documentUrl
  );

  // Droits d'inscription : après acceptation de l'école (hors complétude du dépôt initial)
  const droitsPaid = app.payments.some(
    (p) => p.paymentType === 'DROITS_INSCRIPTION' && p.status === 'CONFIRMED'
  );

  const totalRequired = requirements.length;
  const providedCount = totalRequired - missingDocs.length;
  // Inclure la quittance / frais de dossier dans le % (même règle que isComplete)
  const totalSteps = totalRequired + 1;
  const doneSteps = providedCount + (dossierFeesPaid ? 1 : 0);
  const percentage = totalSteps === 0 ? 100 : Math.round((doneSteps / totalSteps) * 100);

  return {
    dossierFeesPaid,
    droitsInscriptionPaid: droitsPaid,
    missingDocuments: missingDocs,
    providedCount,
    totalRequired,
    percentage,
    pourcentage: percentage,
    isComplete: dossierFeesPaid && missingDocs.length === 0,
  };
};

const resolveFraisDossierAmount = async (application) => {
  if (application.campagneFiliere?.fraisDossier != null) {
    return Number(application.campagneFiliere.fraisDossier);
  }
  if (application.campagneFiliereId) {
    const linked = await prisma.campagneFiliere.findUnique({
      where: { id: application.campagneFiliereId },
      select: { fraisDossier: true },
    });
    if (linked?.fraisDossier != null) return Number(linked.fraisDossier);
  }
  const campagneFiliere = await prisma.campagneFiliere.findFirst({
    where: {
      filiereId: application.filiereId,
      campagne: {
        etablissementId: application.etablissementId,
        anneeAcademique: application.anneeAcademique,
        statut: { in: ['PUBLIEE', 'CLOTUREE', 'BROUILLON'] },
      },
    },
    orderBy: { createdAt: 'desc' },
    select: { fraisDossier: true },
  });
  if (campagneFiliere?.fraisDossier != null) return Number(campagneFiliere.fraisDossier);
  return DEFAULT_DOSSIER_FEES;
};

exports.createApplication = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    let { etablissementId, filiereId, niveau, campagneFiliereId } = req.body;

    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    if (!etablissementId || !filiereId || !niveau) {
      return res.status(400).json({ error: 'etablissementId, filiereId et niveau sont requis' });
    }

    let anneeLibelle = '';
    {
      const anneeDges = await getOrCreateAnneeEnCoursDges();
      anneeLibelle = anneeDges.libelle;
    }

    const etablissement = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      select: { id: true, type: true },
    });
    if (!etablissement) {
      return res.status(404).json({ error: 'Etablissement non trouve' });
    }
    if (etablissement.type !== 'PRIVE') {
      return res.status(400).json({ error: 'Le depot de dossier est reserve aux etablissements prives' });
    }

    const filiere = await prisma.filiere.findUnique({
      where: { id: filiereId },
      select: { id: true, etablissementId: true },
    });
    if (!filiere) {
      return res.status(404).json({ error: 'Filiere non trouvee' });
    }
    if (filiere.etablissementId !== etablissementId) {
      return res.status(400).json({ error: 'La filiere ne correspond pas a cet etablissement' });
    }

    const contrainte = await resolveContrainteNiveauTransfert({
      candidatId,
      filiereIdCible: filiereId,
      etablissementIdCible: etablissementId,
    });
    const checkNiveau = assertNiveauTransfertAutorise(niveau, contrainte);
    if (!checkNiveau.ok) {
      return res.status(400).json({
        error: checkNiveau.error,
        contrainte: {
          constrained: contrainte.constrained,
          niveauMax: contrainte.niveauMax,
          niveauMin: contrainte.niveauMin,
          niveauAnterieur: contrainte.niveauAnterieur,
          statutAnterieur: contrainte.statutAnterieur,
          motif: contrainte.motif,
          message: contrainte.message,
        },
      });
    }

    let resolvedCampagneFiliereId = null;
    if (campagneFiliereId) {
      const cf = await prisma.campagneFiliere.findUnique({
        where: { id: campagneFiliereId },
        include: {
          campagne: {
            select: {
              id: true,
              etablissementId: true,
              anneeAcademique: true,
              statut: true,
            },
          },
        },
      });
      if (!cf) {
        return res.status(404).json({ error: 'Offre de campagne introuvable' });
      }
      if (cf.filiereId !== filiereId || cf.campagne.etablissementId !== etablissementId) {
        return res.status(400).json({ error: 'L\'offre de campagne ne correspond pas a la filiere/etablissement' });
      }
      if (!['PUBLIEE', 'CLOTUREE'].includes(cf.campagne.statut)) {
        return res.status(400).json({ error: 'Cette campagne n\'est pas ouverte aux depots' });
      }
      resolvedCampagneFiliereId = cf.id;
    } else {
      const cf = await prisma.campagneFiliere.findFirst({
        where: {
          filiereId,
          campagne: {
            etablissementId,
            anneeAcademique: anneeLibelle,
            statut: 'PUBLIEE',
          },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      resolvedCampagneFiliereId = cf?.id || null;
    }

    const numeroApplication = buildApplicationNumber();
    const application = await prisma.application.create({
      data: {
        numeroApplication,
        candidatId,
        etablissementId,
        filiereId,
        anneeAcademique: anneeLibelle,
        niveau: Number(niveau),
        ...(resolvedCampagneFiliereId ? { campagneFiliereId: resolvedCampagneFiliereId } : {}),
      },
      include: buildApplicationIncludes(),
    });

    const { autoSatisfied } = await getRequirementsAndAutoDocs({
      application,
      candidate: application.candidat,
    });
    await ensureAutoDocuments(application.id, autoSatisfied);

    const refreshed = await prisma.application.findUnique({
      where: { id: application.id },
      include: buildApplicationIncludes(),
    });
    const completion = await computeCompletion(application.id);

    return res.status(201).json({
      message: 'Demande d inscription creee avec succes',
      application: refreshed,
      completion,
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Une demande existe deja pour cette filiere et cette annee academique' });
    }
    console.error('Erreur createApplication:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    const applications = await prisma.application.findMany({
      where: { candidatId },
      include: {
        etablissement: { select: { id: true, nom: true } },
        filiere: { select: { id: true, nom: true, code: true } },
        payments: { select: { paymentType: true, status: true, amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ applications });
  } catch (error) {
    console.error('Erreur getMyApplications:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getApplicationsForEtablissement = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    const applications = await prisma.application.findMany({
      where: { etablissementId },
      include: {
        candidat: { select: { id: true, matricule: true, nom: true, prenom: true, email: true, sexe: true } },
        filiere: { select: { id: true, nom: true, code: true } },
        payments: { select: { paymentType: true, status: true } },
        preinscription: {
          select: {
            id: true,
            numeroPreinscription: true,
            statut: true,
            niveau: true,
            motifDecision: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ applications });
  } catch (error) {
    console.error('Erreur getApplicationsForEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const application = await prisma.application.findUnique({
      where: { id },
      include: buildApplicationIncludes(),
    });

    if (!application) {
      return res.status(404).json({ error: 'Demande non trouvee' });
    }

    const canAccess =
      application.candidatId === userId ||
      canAccessEtablissementResource(req, application.etablissementId);
    if (!canAccess) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const completion = await computeCompletion(application.id);
    return res.json({ application, completion });
  } catch (error) {
    console.error('Erreur getApplicationById:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getApplicationRequirements = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const application = await prisma.application.findUnique({
      where: { id },
      include: buildApplicationIncludes(),
    });
    if (!application) {
      return res.status(404).json({ error: 'Demande non trouvee' });
    }
    if (application.candidatId !== userId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const { requirements, missing, autoSatisfied } = await getRequirementsAndAutoDocs({
      application,
      candidate: application.candidat,
    });
    await ensureAutoDocuments(application.id, autoSatisfied);

    const refreshedDocs = await prisma.applicationDocument.findMany({
      where: { applicationId: id },
      select: { code: true, status: true },
    });

    const providedCodes = new Set(
      refreshedDocs.filter((d) => d.status === 'PROVIDED').map((d) => d.code)
    );

    const normalized = requirements.map((req) => ({
      id: req.id,
      code: req.code,
      label: req.label,
      requirementType: req.requirementType,
      profileFieldKey: req.profileFieldKey,
      isRequired: req.isRequired !== false,
      provided: providedCodes.has(req.code),
      needsUpload: !providedCodes.has(req.code),
      missing: missing.some((m) => m.code === req.code),
    }));

    return res.json({ requirements: normalized });
  } catch (error) {
    console.error('Erreur getApplicationRequirements:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.payDossierFeesMock = async (req, res) => {
  return res.status(410).json({
    error:
      'Le paiement simulé n\'est plus disponible. Déposez la quittance des frais de dossier comme pour un concours.',
  });
};

/** Upload de la quittance des frais de dossier (paiement hors plateforme — comme Module 1). */
exports.uploadQuittanceFraisDossier = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const application = await prisma.application.findUnique({
      where: { id },
      include: buildApplicationIncludes(),
    });
    if (!application) {
      return res.status(404).json({ error: 'Demande non trouvee' });
    }
    if (application.candidatId !== userId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    if (['FICHE_GENERATED'].includes(application.status)) {
      return res.status(400).json({
        error:
          'Ce dossier a déjà été soumis. Les pièces ne peuvent plus être modifiées, sauf si l\'école le remet sous réserve.',
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu (PDF ou image).' });
    }

    const ext = req.file.originalname.split('.').pop();
    const fileName = `quittance-frais-dossier-${Date.now()}.${ext}`;
    const storagePath = `applications/${id}/receipts/${fileName}`;
    const receiptUrl = await uploadBufferToLocal(req.file.buffer, storagePath, req.file.mimetype);
    const amount = await resolveFraisDossierAmount(application);

    const existingPayment = await prisma.payment.findFirst({
      where: { applicationId: id, paymentType: 'DOSSIER_FEES', status: 'CONFIRMED' },
      orderBy: { createdAt: 'desc' },
      include: { receipt: true },
    });

    let payment = existingPayment;
    let receipt = existingPayment?.receipt || null;

    if (existingPayment) {
      if (existingPayment.receipt) {
        receipt = await prisma.receipt.update({
          where: { id: existingPayment.receipt.id },
          data: {
            receiptUrl,
            metadata: {
              originalFileName: req.file.originalname,
              mimeType: req.file.mimetype,
              uploadedAt: new Date().toISOString(),
              amount,
              replaced: true,
            },
          },
        });
      } else {
        receipt = await prisma.receipt.create({
          data: {
            paymentId: existingPayment.id,
            applicationId: id,
            receiptNumber: buildReceiptNumber('QFD'),
            receiptType: 'DOSSIER_FEES_RECEIPT',
            receiptUrl,
            metadata: {
              originalFileName: req.file.originalname,
              mimeType: req.file.mimetype,
              uploadedAt: new Date().toISOString(),
              amount,
            },
          },
        });
      }
    } else {
      payment = await prisma.payment.create({
        data: {
          applicationId: id,
          paymentType: 'DOSSIER_FEES',
          amount,
          currency: 'XOF',
          paymentProvider: 'BANQUE_EXTERNE',
          paymentMethod: 'BANK_TRANSFER',
          status: 'CONFIRMED',
          externalRef: `QFD-UPLOAD-${Date.now()}`,
          providerPayload: {
            uploadedByStudent: true,
            originalFileName: req.file.originalname,
            mimeType: req.file.mimetype,
          },
        },
      });

      receipt = await prisma.receipt.create({
        data: {
          paymentId: payment.id,
          applicationId: id,
          receiptNumber: buildReceiptNumber('QFD'),
          receiptType: 'DOSSIER_FEES_RECEIPT',
          receiptUrl,
          metadata: {
            originalFileName: req.file.originalname,
            mimeType: req.file.mimetype,
            uploadedAt: new Date().toISOString(),
            amount,
          },
        },
      });
    }

    await prisma.applicationDocument.upsert({
      where: {
        applicationId_code: {
          applicationId: id,
          code: 'quittance_frais_dossier',
        },
      },
      update: {
        label: 'Quittance frais de dossier',
        source: 'STUDENT_UPLOAD',
        status: 'PROVIDED',
        documentUrl: receiptUrl,
      },
      create: {
        applicationId: id,
        code: 'quittance_frais_dossier',
        label: 'Quittance frais de dossier',
        source: 'STUDENT_UPLOAD',
        status: 'PROVIDED',
        documentUrl: receiptUrl,
      },
    });

    const completion = await computeCompletion(id);
    await prisma.application.update({
      where: { id },
      data: {
        status: completion?.isComplete ? 'READY_FOR_PREINSCRIPTION' : 'PENDING_DOCUMENTS',
      },
    });

    return res.json({
      message: existingPayment ? 'Quittance des frais de dossier remplacée' : 'Quittance des frais de dossier enregistrée',
      payment,
      receipt,
      completion,
    });
  } catch (error) {
    console.error('Erreur uploadQuittanceFraisDossier:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.uploadDroitsInscriptionReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        candidat: { select: { id: true } },
      },
    });
    if (!application) {
      return res.status(404).json({ error: 'Demande non trouvee' });
    }
    if (application.candidatId !== userId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier recu' });
    }

    const ext = req.file.originalname.split('.').pop();
    const fileName = `bank-receipt-${Date.now()}.${ext}`;
    const storagePath = `applications/${id}/bank-receipts/${fileName}`;
    const receiptUrl = await uploadBufferToLocal(req.file.buffer, storagePath, req.file.mimetype);

    const payment = await prisma.payment.create({
      data: {
        applicationId: id,
        paymentType: 'DROITS_INSCRIPTION',
        amount: 0,
        currency: 'XOF',
        paymentProvider: 'BANQUE_EXTERNE',
        paymentMethod: 'BANK_TRANSFER',
        status: 'CONFIRMED',
        externalRef: `BANK-${Date.now()}`,
        providerPayload: { uploadedByStudent: true },
      },
    });

    const receipt = await prisma.receipt.create({
      data: {
        paymentId: payment.id,
        applicationId: id,
        receiptNumber: buildReceiptNumber('QBI'),
        receiptType: 'BANK_RECEIPT',
        receiptUrl,
        metadata: {
          originalFileName: req.file.originalname,
          mimeType: req.file.mimetype,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    await prisma.applicationDocument.upsert({
      where: {
        applicationId_code: {
          applicationId: id,
          code: 'quittance_bancaire',
        },
      },
      update: {
        label: 'Quittance bancaire droits d inscription',
        source: 'STUDENT_UPLOAD',
        status: 'PROVIDED',
        documentUrl: receiptUrl,
      },
      create: {
        applicationId: id,
        code: 'quittance_bancaire',
        label: 'Quittance bancaire droits d inscription',
        source: 'STUDENT_UPLOAD',
        status: 'PROVIDED',
        documentUrl: receiptUrl,
      },
    });

    const completion = await computeCompletion(id);
    await prisma.application.update({
      where: { id },
      data: {
        status: completion?.isComplete ? 'READY_FOR_PREINSCRIPTION' : 'PENDING_DOCUMENTS',
      },
    });

    return res.json({
      message: 'Quittance bancaire enregistree avec succes',
      payment,
      receipt,
      completion,
    });
  } catch (error) {
    console.error('Erreur uploadDroitsInscriptionReceipt:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.uploadApplicationDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { code } = req.body;
    const userId = req.user?.id;

    if (!code) {
      return res.status(400).json({ error: 'Le code du document est requis' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier recu' });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        etablissement: { select: { id: true } },
        campagneFiliere: {
          select: {
            id: true,
            campagne: { select: { piecesRequises: true } },
          },
        },
      },
    });
    if (!application) {
      return res.status(404).json({ error: 'Demande non trouvee' });
    }
    if (application.candidatId !== userId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    if (['FICHE_GENERATED'].includes(application.status)) {
      return res.status(400).json({
        error:
          'Ce dossier a déjà été soumis. Les pièces ne peuvent plus être modifiées, sauf si l\'école le remet sous réserve.',
      });
    }

    const requirements = await resolveApplicationRequirements(application);
    const requirement = requirements.find((r) => r.code === code);
    if (!requirement) {
      return res.status(404).json({ error: 'Exigence non trouvee pour ce dossier' });
    }
    if (requirement.requirementType !== 'DOCUMENT_UPLOAD' && requirement.requirementType !== 'PROFILE_FIELD') {
      return res.status(400).json({ error: 'Type de piece non supporté pour l\'upload' });
    }

    const ext = req.file.originalname.split('.').pop();
    const fileName = `${code}-${Date.now()}.${ext}`;
    const storagePath = `applications/${id}/documents/${fileName}`;
    const documentUrl = await uploadBufferToLocal(req.file.buffer, storagePath, req.file.mimetype);

    const schoolRequirementId =
      requirement.fromCampagne || requirement.fromSysteme
        ? null
        : requirement.id;

    const document = await prisma.applicationDocument.upsert({
      where: {
        applicationId_code: {
          applicationId: id,
          code,
        },
      },
      update: {
        label: requirement.label,
        source: 'STUDENT_UPLOAD',
        status: 'PROVIDED',
        documentUrl,
        schoolRequirementId,
      },
      create: {
        applicationId: id,
        schoolRequirementId,
        code,
        label: requirement.label,
        source: 'STUDENT_UPLOAD',
        status: 'PROVIDED',
        documentUrl,
      },
    });

    const completion = await computeCompletion(id);
    await prisma.application.update({
      where: { id },
      data: {
        status: completion?.isComplete ? 'READY_FOR_PREINSCRIPTION' : 'PENDING_DOCUMENTS',
      },
    });

    return res.json({
      message: 'Document ajoute au dossier avec succes',
      document,
      completion,
    });
  } catch (error) {
    console.error('Erreur uploadApplicationDocument:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.finalizeApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const application = await prisma.application.findUnique({
      where: { id },
      include: buildApplicationIncludes(),
    });
    if (!application) {
      return res.status(404).json({ error: 'Demande non trouvee' });
    }
    if (application.candidatId !== userId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const completion = await computeCompletion(id);
    if (!completion?.isComplete) {
      return res.status(400).json({
        error: 'Dossier incomplet : déposez la quittance des frais de dossier et toutes les pièces requises.',
        completion,
      });
    }

    let preinscriptionId = application.preinscriptionId;
    let preinscription = null;
    if (preinscriptionId) {
      preinscription = await prisma.preinscriptionEtablissement.findUnique({ where: { id: preinscriptionId } });
    } else {
      try {
        preinscription = await prisma.preinscriptionEtablissement.create({
          data: {
            numeroPreinscription: buildPreinscriptionNumber(),
            candidatId: application.candidatId,
            filiereId: application.filiereId,
            etablissementId: application.etablissementId,
            anneeAcademique: application.anneeAcademique,
            niveau: application.niveau,
            statut: 'EN_ATTENTE',
          },
        });
      } catch (error) {
        if (error?.code === 'P2002') {
          preinscription = await prisma.preinscriptionEtablissement.findFirst({
            where: {
              candidatId: application.candidatId,
              filiereId: application.filiereId,
              anneeAcademique: application.anneeAcademique,
            },
          });
        } else {
          throw error;
        }
      }
      preinscriptionId = preinscription?.id || null;
    }
    if (!preinscription) {
      return res.status(500).json({ error: 'Impossible de generer la pre-inscription associee' });
    }

    const preinscriptionPayload = {
      candidat: {
        id: application.candidat.id,
        nom: application.candidat.nom,
        prenom: application.candidat.prenom,
        matricule: application.candidat.matricule,
        email: application.candidat.email,
        telephone: application.candidat.telephone,
        dossier: application.candidat.dossier || undefined,
      },
      candidatId: application.candidatId,
      documents: application.documents || [],
      photo: (application.documents || []).find(
        (d) => ['photo', 'photo_identite', 'photo-identite'].includes(d.code) && d.documentUrl
      )?.documentUrl
        || application.candidat?.dossier?.photo
        || null,
      preinscription: {
        id: preinscription.id,
        numeroPreinscription: preinscription.numeroPreinscription,
        etablissementNom: application.etablissement.nom,
        filiereNom: application.filiere.nom,
        anneeAcademique: application.anneeAcademique,
        niveau: application.niveau,
        statut: preinscription.statut,
      },
    };

    await prisma.application.update({
      where: { id },
      data: { preinscriptionId: preinscription.id },
    });

    const applicationId = id;
    runInBackground(async () => {
      const pdfResult = await pdfService.genererFichePreinscriptionEtablissement(preinscriptionPayload);
      const fileBuffer = fs.readFileSync(pdfResult.filePath);
      const fichePath = `applications/${applicationId}/fiches/${preinscription.numeroPreinscription}.pdf`;
      const ficheUrl = await uploadBufferToLocal(fileBuffer, fichePath, 'application/pdf');

      await prisma.receipt.create({
        data: {
          applicationId,
          receiptNumber: buildReceiptNumber('FPE'),
          receiptType: 'PREINSCRIPTION_FICHE',
          receiptUrl: ficheUrl,
          metadata: {
            preinscriptionId: preinscription.id,
            numeroPreinscription: preinscription.numeroPreinscription,
          },
        },
      });

      await prisma.application.update({
        where: { id: applicationId },
        data: {
          preinscriptionId: preinscription.id,
          status: 'FICHE_GENERATED',
        },
      });

      try {
        await emailService.envoyerEmailPreinscriptionEtablissement({
          userId: application.candidat.id,
          candidatId: application.candidat.id,
          candidatEmail: application.candidat.email,
          candidatNom: application.candidat.nom,
          candidatPrenom: application.candidat.prenom,
          etablissementNom: application.etablissement.nom,
          filiereNom: application.filiere.nom,
          anneeAcademique: application.anneeAcademique,
          niveau: application.niveau,
          numeroPreinscription: preinscription.numeroPreinscription,
        }, pdfResult.filePath);
        setTimeout(() => pdfService.nettoyerPDF(pdfResult.filePath), 10 * 60 * 1000);
      } catch (emailError) {
        console.error('Erreur envoi email fiche pre-inscription finale:', emailError);
        pdfService.nettoyerPDF(pdfResult.filePath);
      }
    }, 'finalize-application-fiche');

    return res.json({
      message: 'Pre-inscription enregistree. La fiche est en cours de generation et sera envoyee par mail.',
      preinscription: {
        id: preinscription.id,
        numeroPreinscription: preinscription.numeroPreinscription,
        statut: preinscription.statut,
      },
    });
  } catch (error) {
    console.error('Erreur finalizeApplication:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.downloadPreinscriptionFiche = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const application = await prisma.application.findUnique({
      where: { id },
      include: buildApplicationIncludes(),
    });
    if (!application) {
      return res.status(404).json({ error: 'Demande non trouvee' });
    }

    const canAccess =
      application.candidatId === userId ||
      canAccessEtablissementResource(req, application.etablissementId);
    if (!canAccess) {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    if (!application.preinscriptionId) {
      return res.status(400).json({ error: 'La fiche de pre-inscription n est pas encore generee' });
    }

    const preinscription = await prisma.preinscriptionEtablissement.findUnique({
      where: { id: application.preinscriptionId },
      select: { numeroPreinscription: true, statut: true },
    });

    const pdfResult = await pdfService.genererFichePreinscriptionEtablissement({
      candidat: {
        id: application.candidat.id,
        nom: application.candidat.nom,
        prenom: application.candidat.prenom,
        matricule: application.candidat.matricule,
        email: application.candidat.email,
        telephone: application.candidat.telephone,
        dossier: application.candidat.dossier || undefined,
      },
      candidatId: application.candidatId,
      documents: application.documents || [],
      photo: (application.documents || []).find(
        (d) => ['photo', 'photo_identite', 'photo-identite'].includes(d.code) && d.documentUrl
      )?.documentUrl
        || application.candidat?.dossier?.photo
        || null,
      preinscription: {
        id: preinscription.id,
        numeroPreinscription: preinscription.numeroPreinscription,
        etablissementNom: application.etablissement.nom,
        filiereNom: application.filiere.nom,
        anneeAcademique: application.anneeAcademique,
        niveau: application.niveau,
        statut: preinscription.statut,
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="fiche_preinscription_${preinscription.numeroPreinscription}.pdf"`
    );
    const stream = fs.createReadStream(pdfResult.filePath);
    stream.pipe(res);
    stream.on('close', () => pdfService.nettoyerPDF(pdfResult.filePath));
  } catch (error) {
    console.error('Erreur downloadPreinscriptionFiche:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getSchoolRequirements = async (req, res) => {
  try {
    const { etablissementId } = req.params;
    const requirements = await prisma.schoolRequirement.findMany({
      where: { etablissementId },
      orderBy: [{ isRequired: 'desc' }, { createdAt: 'asc' }],
    });
    return res.json({ requirements });
  } catch (error) {
    console.error('Erreur getSchoolRequirements:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getMySchoolRequirements = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    const requirements = await prisma.schoolRequirement.findMany({
      where: { etablissementId },
      orderBy: [{ isRequired: 'desc' }, { createdAt: 'asc' }],
    });
    return res.json({ requirements });
  } catch (error) {
    console.error('Erreur getMySchoolRequirements:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.upsertSchoolRequirement = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    const { code, label, requirementType, profileFieldKey, isRequired = true } = req.body;
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    if (!code || !label || !requirementType) {
      return res.status(400).json({ error: 'code, label et requirementType sont requis' });
    }
    if (!['PROFILE_FIELD', 'DOCUMENT_UPLOAD'].includes(requirementType)) {
      return res.status(400).json({ error: 'requirementType invalide' });
    }
    if (requirementType === 'PROFILE_FIELD' && !profileFieldKey) {
      return res.status(400).json({ error: 'profileFieldKey est requis pour PROFILE_FIELD' });
    }

    const requirement = await prisma.schoolRequirement.upsert({
      where: {
        etablissementId_code: {
          etablissementId,
          code,
        },
      },
      update: {
        label,
        requirementType,
        profileFieldKey: requirementType === 'PROFILE_FIELD' ? profileFieldKey : null,
        isRequired: Boolean(isRequired),
      },
      create: {
        etablissementId,
        code,
        label,
        requirementType,
        profileFieldKey: requirementType === 'PROFILE_FIELD' ? profileFieldKey : null,
        isRequired: Boolean(isRequired),
      },
    });

    return res.json({
      message: 'Exigence d etablissement enregistree avec succes',
      requirement,
    });
  } catch (error) {
    console.error('Erreur upsertSchoolRequirement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.deleteSchoolRequirement = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    const { id } = req.params;
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const requirement = await prisma.schoolRequirement.findUnique({
      where: { id },
      select: { id: true, etablissementId: true },
    });
    if (!requirement) {
      return res.status(404).json({ error: 'Exigence non trouvee' });
    }
    if (requirement.etablissementId !== etablissementId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    await prisma.schoolRequirement.delete({ where: { id } });
    return res.json({ message: 'Exigence supprimee avec succes' });
  } catch (error) {
    console.error('Erreur deleteSchoolRequirement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getCandidaturesExportReadiness = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    const annee = req.query.annee ? String(req.query.annee).trim() : null;
    const readiness = await getExportReadiness(etablissementId, annee || null);
    return res.json(readiness);
  } catch (error) {
    console.error('Erreur getCandidaturesExportReadiness:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

async function assertExportAllowed(etablissementId, annee) {
  const readiness = await getExportReadiness(etablissementId, annee || null);
  if (!readiness.exportReady) {
    const err = new Error(readiness.message || 'Exports non disponibles');
    err.status = 403;
    err.readiness = readiness;
    throw err;
  }
  return readiness;
}

exports.exportCandidaturesPdf = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    const filters = parseExportFilters(req.query);
    await assertExportAllowed(etablissementId, filters.annee);

    const [etablissement, filiere, rows] = await Promise.all([
      prisma.etablissement.findUnique({
        where: { id: etablissementId },
        select: { nom: true },
      }),
      filters.filiere
        ? prisma.filiere.findFirst({
            where: { id: filters.filiere, etablissementId },
            select: { nom: true },
          })
        : Promise.resolve(null),
      loadCandidaturesForExport(etablissementId, filters),
    ]);

    await streamCandidaturesPdf(res, {
      etablissementNom: etablissement?.nom,
      filters,
      rows,
      filiereNom: filiere?.nom,
    });
  } catch (error) {
    console.error('Erreur exportCandidaturesPdf:', error);
    if (res.headersSent) return;
    const status = error.status || 500;
    return res.status(status).json({
      error: error.message || 'Erreur serveur',
      ...(error.readiness ? { readiness: error.readiness } : {}),
    });
  }
};

exports.exportCandidaturesExcel = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    const filters = parseExportFilters(req.query);
    await assertExportAllowed(etablissementId, filters.annee);

    const rows = await loadCandidaturesForExport(etablissementId, filters);
    const csv = rowsToCsv(rows);
    const filename = `candidatures-etablissement-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csv);
  } catch (error) {
    console.error('Erreur exportCandidaturesExcel:', error);
    if (res.headersSent) return;
    const status = error.status || 500;
    return res.status(status).json({
      error: error.message || 'Erreur serveur',
      ...(error.readiness ? { readiness: error.readiness } : {}),
    });
  }
};

/**
 * Contraintes de niveau pour un dépôt vers une filière (transfert inter-établissements).
 * GET ?filiereId=&etablissementId=
 */
exports.getNiveauAutoriseTransfert = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    const filiereId = String(req.query.filiereId || '').trim();
    const etablissementId = String(req.query.etablissementId || '').trim();
    if (!filiereId || !etablissementId) {
      return res.status(400).json({ error: 'filiereId et etablissementId sont requis' });
    }

    const filiere = await prisma.filiere.findFirst({
      where: { id: filiereId, etablissementId },
      select: { id: true },
    });
    if (!filiere) {
      return res.status(404).json({ error: 'Filiere non trouvee pour cet etablissement' });
    }

    const contrainte = await resolveContrainteNiveauTransfert({
      candidatId,
      filiereIdCible: filiereId,
      etablissementIdCible: etablissementId,
    });

    const niveauxAutorises = [];
    for (let n = contrainte.niveauMin; n <= contrainte.niveauMax; n++) {
      niveauxAutorises.push(n);
    }

    return res.json({
      contrainte: {
        constrained: contrainte.constrained,
        niveauMin: contrainte.niveauMin,
        niveauMax: contrainte.niveauMax,
        niveauAnterieur: contrainte.niveauAnterieur,
        statutAnterieur: contrainte.statutAnterieur,
        motif: contrainte.motif,
        message: contrainte.message,
        etablissementSource: contrainte.etablissementSource,
        filiereSource: contrainte.filiereSource,
      },
      niveauxAutorises,
    });
  } catch (error) {
    console.error('Erreur getNiveauAutoriseTransfert:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
