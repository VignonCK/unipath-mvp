const fs = require('fs');
const prisma = require('../prisma');
const { supabaseAdmin } = require('../supabase');
const paymentService = require('../services/payment.service');
const pdfService = require('../services/pdf.service');
const emailService = require('../services/email.service');
const {
  getAdminEtablissementId,
  canAdminAccessApplication,
} = require('../utils/admin-etablissement.helper');
const { candidateSerieMatchesConcours } = require('../utils/series.helper');

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

const { uploadBufferToSupabase } = require('../utils/file-upload.helper');

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
  documents: true,
  payments: true,
  receipts: true,
  preinscription: true,
});

const campagneFiliereDetailInclude = {
  campagneFiliere: {
    include: {
      campagne: {
        select: {
          id: true,
          titre: true,
          anneeAcademique: true,
          dateOuverture: true,
          dateCloture: true,
          statut: true,
          etablissementId: true,
        },
      },
    },
  },
};

async function resolveCampagneFiliereForApplication({
  campagneFiliereId,
  candidatId,
  etablissementId,
  filiereId,
  niveau,
}) {
  if (!campagneFiliereId) {
    return { campagneFiliereId: null, fraisDossier: DEFAULT_DOSSIER_FEES };
  }

  const campagneFiliere = await prisma.campagneFiliere.findUnique({
    where: { id: campagneFiliereId },
    include: {
      campagne: true,
      filiere: { select: { id: true, etablissementId: true } },
    },
  });

  if (!campagneFiliere) {
    return { error: { status: 404, message: 'Campagne filiere non trouvee' } };
  }

  if (campagneFiliere.filiereId !== filiereId) {
    return { error: { status: 400, message: 'La filiere ne correspond pas a la campagne selectionnee' } };
  }

  if (campagneFiliere.filiere.etablissementId !== etablissementId) {
    return { error: { status: 400, message: 'La campagne ne correspond pas a l etablissement selectionne' } };
  }

  const { campagne } = campagneFiliere;

  if (campagne.etablissementId !== etablissementId) {
    return { error: { status: 400, message: 'La campagne ne correspond pas a l etablissement selectionne' } };
  }

  if (campagne.statut !== 'PUBLIEE') {
    return { error: { status: 400, message: 'Cette campagne n est pas ouverte aux inscriptions' } };
  }

  const now = new Date();
  if (now < new Date(campagne.dateOuverture)) {
    return { error: { status: 400, message: 'La periode d inscription de cette campagne n est pas encore ouverte' } };
  }
  if (now > new Date(campagne.dateCloture)) {
    return { error: { status: 400, message: 'La periode d inscription de cette campagne est terminee' } };
  }

  const candidat = await prisma.candidat.findUnique({
    where: { id: candidatId },
    select: { serie: true },
  });

  if (campagneFiliere.seriesAcceptees?.length > 0) {
    if (!candidateSerieMatchesConcours(candidat?.serie, campagneFiliere.seriesAcceptees)) {
      return { error: { status: 400, message: 'Votre serie du bac n est pas acceptee pour cette filiere' } };
    }
  }

  if (campagneFiliere.niveauMinBac?.trim()) {
    const minBac = campagneFiliere.niveauMinBac.trim();
    const minBacNum = Number(minBac);
    if (!Number.isNaN(minBacNum) && Number.isFinite(minBacNum)) {
      if (Number(niveau) < minBacNum) {
        return {
          error: {
            status: 400,
            message: `Niveau d inscription minimum requis : ${minBacNum}`,
          },
        };
      }
    } else if (!candidateSerieMatchesConcours(candidat?.serie, [minBac])) {
      return { error: { status: 400, message: 'Vous ne remplissez pas le critere de niveau au bac requis' } };
    }
  }

  if (campagneFiliere.placesDisponibles != null) {
    const placesPrises = await prisma.application.count({
      where: {
        campagneFiliereId: campagneFiliere.id,
        status: { not: 'DRAFT' },
      },
    });
    if (placesPrises >= campagneFiliere.placesDisponibles) {
      return { error: { status: 400, message: 'Plus de places disponibles pour cette filiere' } };
    }
  }

  return {
    campagneFiliereId: campagneFiliere.id,
    fraisDossier: campagneFiliere.fraisDossier,
  };
}

const getRequirementValue = (candidate, profileFieldKey) => {
  const getter = REQUIRED_PROFILE_FIELDS[profileFieldKey];
  if (!getter) return null;
  return getter(candidate);
};

const getRequirementsAndAutoDocs = async ({ application, candidate }) => {
  const requirements = await prisma.schoolRequirement.findMany({
    where: { etablissementId: application.etablissementId },
    orderBy: { createdAt: 'asc' },
  });

  const autoSatisfied = [];
  const missing = [];

  requirements.forEach((req) => {
    if (!req.isRequired) return;
    if (req.requirementType === 'PROFILE_FIELD' && req.profileFieldKey) {
      const value = getRequirementValue(candidate, req.profileFieldKey);
      if (value !== null && value !== undefined && value !== '') {
        autoSatisfied.push({
          code: req.code,
          label: req.label,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          schoolRequirementId: req.id,
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
    },
  });
  if (!app) return null;

  const requirements = await prisma.schoolRequirement.findMany({
    where: {
      etablissementId: app.etablissementId,
      isRequired: true,
    },
  });

  const missingDocs = requirements.filter((req) =>
    !app.documents.some((doc) => doc.code === req.code && doc.status === 'PROVIDED')
  );

  const dossierFeesPaid = app.payments.some(
    (p) => p.paymentType === 'DOSSIER_FEES' && p.status === 'CONFIRMED'
  );
  const droitsPaid = app.payments.some(
    (p) => p.paymentType === 'DROITS_INSCRIPTION' && p.status === 'CONFIRMED'
  );

  return {
    dossierFeesPaid,
    droitsInscriptionPaid: droitsPaid,
    missingDocuments: missingDocs,
    isComplete: dossierFeesPaid && missingDocs.length === 0,
  };
};

exports.createApplication = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    const { etablissementId, filiereId, anneeAcademique, niveau, campagneFiliereId } = req.body;

    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    if (!etablissementId || !filiereId || !anneeAcademique || !niveau) {
      return res.status(400).json({ error: 'etablissementId, filiereId, anneeAcademique et niveau sont requis' });
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

    const campagneResolution = await resolveCampagneFiliereForApplication({
      campagneFiliereId,
      candidatId,
      etablissementId,
      filiereId,
      niveau,
    });
    if (campagneResolution.error) {
      return res.status(campagneResolution.error.status).json({ error: campagneResolution.error.message });
    }

    const numeroApplication = buildApplicationNumber();
    const application = await prisma.application.create({
      data: {
        numeroApplication,
        candidatId,
        etablissementId,
        filiereId,
        anneeAcademique,
        niveau: Number(niveau),
        campagneFiliereId: campagneResolution.campagneFiliereId,
      },
      include: {
        ...buildApplicationIncludes(),
        ...campagneFiliereDetailInclude,
      },
    });

    const { autoSatisfied } = await getRequirementsAndAutoDocs({
      application,
      candidate: application.candidat,
    });
    await ensureAutoDocuments(application.id, autoSatisfied);

    const refreshed = await prisma.application.findUnique({
      where: { id: application.id },
      include: {
        ...buildApplicationIncludes(),
        ...campagneFiliereDetailInclude,
      },
    });
    const completion = await computeCompletion(application.id);

    return res.status(201).json({
      message: 'Demande d inscription creee avec succes',
      application: refreshed,
      completion,
      fraisDossier: campagneResolution.fraisDossier,
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
    const etablissementId = getAdminEtablissementId(req);
    if (!etablissementId) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }

    const applications = await prisma.application.findMany({
      where: { etablissementId },
      include: {
        candidat: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
          },
        },
        filiere: { select: { id: true, nom: true, code: true } },
        preinscription: { select: { id: true, numeroPreinscription: true, statut: true } },
        payments: { select: { paymentType: true, status: true } },
        documents: { select: { id: true, code: true, label: true, status: true } },
        ...campagneFiliereDetailInclude,
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
    const userRole = req.user?.role || req.userRole;
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        ...buildApplicationIncludes(),
        ...campagneFiliereDetailInclude,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Demande non trouvee' });
    }

    const canAccess =
      application.candidatId === userId ||
      canAdminAccessApplication(req, application);
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

    const { requirements, missing } = await getRequirementsAndAutoDocs({
      application,
      candidate: application.candidat,
    });

    const providedCodes = new Set(
      application.documents.filter((d) => d.status === 'PROVIDED').map((d) => d.code)
    );

    const normalized = requirements.map((req) => ({
      id: req.id,
      code: req.code,
      label: req.label,
      requirementType: req.requirementType,
      profileFieldKey: req.profileFieldKey,
      isRequired: req.isRequired,
      provided: providedCodes.has(req.code),
      needsUpload: req.requirementType === 'DOCUMENT_UPLOAD' && !providedCodes.has(req.code),
      missing: missing.some((m) => m.code === req.code),
    }));

    return res.json({ requirements: normalized });
  } catch (error) {
    console.error('Erreur getApplicationRequirements:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.payDossierFeesMock = async (req, res) => {
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

    let amount = DEFAULT_DOSSIER_FEES;
    if (application.campagneFiliereId) {
      const campagneFiliere = await prisma.campagneFiliere.findUnique({
        where: { id: application.campagneFiliereId },
        select: { fraisDossier: true },
      });
      if (campagneFiliere?.fraisDossier != null) {
        amount = campagneFiliere.fraisDossier;
      }
    }

    const initiated = await paymentService.initiatePayment({
      applicationId: id,
      amount,
      paymentType: 'DOSSIER_FEES',
      currency: 'XOF',
    });
    const confirmed = await paymentService.confirmPaymentMock({ reference: initiated.reference });

    const payment = await prisma.payment.create({
      data: {
        applicationId: id,
        paymentType: 'DOSSIER_FEES',
        amount,
        currency: 'XOF',
        paymentProvider: initiated.provider,
        paymentMethod: 'PLATFORM_GATEWAY',
        status: confirmed.status,
        externalRef: initiated.reference,
        providerPayload: confirmed.providerPayload,
      },
    });

    const receiptNumber = buildReceiptNumber('QFD');
    const receiptPayload = {
      receiptNumber,
      type: 'DOSSIER_FEES_RECEIPT',
      applicationNumber: application.numeroApplication,
      amount,
      currency: 'XOF',
      paymentReference: initiated.reference,
      issuedAt: new Date().toISOString(),
      candidat: {
        matricule: application.candidat.matricule,
        nom: application.candidat.nom,
        prenom: application.candidat.prenom,
      },
      etablissement: {
        nom: application.etablissement.nom,
      },
      filiere: application.filiere.nom,
    };

    const storagePath = `applications/${id}/receipts/${receiptNumber}.json`;
    const receiptUrl = await uploadBufferToSupabase(
      Buffer.from(JSON.stringify(receiptPayload, null, 2), 'utf-8'),
      storagePath,
      'application/json'
    );

    const receipt = await prisma.receipt.create({
      data: {
        paymentId: payment.id,
        applicationId: id,
        receiptNumber,
        receiptType: 'DOSSIER_FEES_RECEIPT',
        receiptUrl,
        metadata: receiptPayload,
      },
    });

    await prisma.applicationDocument.upsert({
      where: {
        applicationId_code: {
          applicationId: id,
          code: 'quittance_frais_dossier',
        },
      },
      update: {
        label: 'Quittance frais de dossier',
        source: 'SYSTEM_GENERATED',
        status: 'PROVIDED',
        documentUrl: receiptUrl,
      },
      create: {
        applicationId: id,
        code: 'quittance_frais_dossier',
        label: 'Quittance frais de dossier',
        source: 'SYSTEM_GENERATED',
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
      success: true,
      amount,
      message: 'Paiement des frais de dossier confirme (mode mock)',
      payment,
      receipt,
      completion,
    });
  } catch (error) {
    console.error('Erreur payDossierFeesMock:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.uploadDroitsInscriptionReceipt = async (req, res) => {
  return res.status(410).json({
    error:
      "Cette étape a été déplacée après la décision d'admission. Soumettez votre quittance via /mes-inscriptions-academiques.",
  });

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
    const receiptUrl = await uploadBufferToSupabase(req.file.buffer, storagePath, req.file.mimetype);

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
      },
    });
    if (!application) {
      return res.status(404).json({ error: 'Demande non trouvee' });
    }
    if (application.candidatId !== userId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const requirement = await prisma.schoolRequirement.findFirst({
      where: {
        etablissementId: application.etablissementId,
        code,
      },
    });
    if (!requirement) {
      return res.status(404).json({ error: 'Exigence non trouvee pour cet etablissement' });
    }
    if (requirement.requirementType !== 'DOCUMENT_UPLOAD') {
      return res.status(400).json({ error: 'Ce document est recuperable automatiquement depuis le profil' });
    }

    const ext = req.file.originalname.split('.').pop();
    const fileName = `${code}-${Date.now()}.${ext}`;
    const storagePath = `applications/${id}/documents/${fileName}`;
    const documentUrl = await uploadBufferToSupabase(req.file.buffer, storagePath, req.file.mimetype);

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
        schoolRequirementId: requirement.id,
      },
      create: {
        applicationId: id,
        schoolRequirementId: requirement.id,
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
        error: 'Le dossier n est pas complet ou les frais de dossier ne sont pas confirmes',
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
        nom: application.candidat.nom,
        prenom: application.candidat.prenom,
        matricule: application.candidat.matricule,
        email: application.candidat.email,
        telephone: application.candidat.telephone,
      },
      preinscription: {
        numeroPreinscription: preinscription.numeroPreinscription,
        etablissementNom: application.etablissement.nom,
        filiereNom: application.filiere.nom,
        anneeAcademique: application.anneeAcademique,
        niveau: application.niveau,
        statut: preinscription.statut,
      },
    };

    const pdfResult = await pdfService.genererFichePreinscriptionEtablissement(preinscriptionPayload);
    const fileBuffer = fs.readFileSync(pdfResult.filePath);
    const fichePath = `applications/${id}/fiches/${preinscription.numeroPreinscription}.pdf`;
    const ficheUrl = await uploadBufferToSupabase(fileBuffer, fichePath, 'application/pdf');

    await prisma.receipt.create({
      data: {
        applicationId: id,
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
      where: { id },
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

    return res.json({
      message: 'Fiche de pre-inscription generee avec succes et envoyee par mail',
      preinscription: {
        id: preinscription.id,
        numeroPreinscription: preinscription.numeroPreinscription,
        statut: preinscription.statut,
      },
      ficheUrl,
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
    const role = req.user?.role || req.userRole;

    const application = await prisma.application.findUnique({
      where: { id },
      include: buildApplicationIncludes(),
    });
    if (!application) {
      return res.status(404).json({ error: 'Demande non trouvee' });
    }

    const canAccess =
      application.candidatId === userId ||
      canAdminAccessApplication(req, application);
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
        nom: application.candidat.nom,
        prenom: application.candidat.prenom,
        matricule: application.candidat.matricule,
        email: application.candidat.email,
        telephone: application.candidat.telephone,
      },
      preinscription: {
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
    const etablissementId = getAdminEtablissementId(req);
    if (!etablissementId) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
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
    const etablissementId = getAdminEtablissementId(req);
    const { code, label, requirementType, profileFieldKey, isRequired = true } = req.body;
    if (!etablissementId) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
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
    const etablissementId = getAdminEtablissementId(req);
    const { id } = req.params;
    if (!etablissementId) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
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
