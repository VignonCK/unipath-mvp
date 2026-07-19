const prisma = require('../prisma');
const emailService = require('../services/email.service');
const pdfService = require('../services/pdf.service');
const fs = require('fs');
const localFileStorage = require('../services/local-file-storage.service');
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
} = require('../utils/campagne-pieces.helper');
const {
  resolveContrainteNiveauTransfert,
  assertNiveauTransfertAutorise,
} = require('../utils/transfert-filiere.helper');

const STATUTS_DECISION = ['VALIDE', 'SOUS_RESERVE', 'REJETE'];

async function loadSousReserveOwned(id, candidatId) {
  const preinscription = await prisma.preinscriptionEtablissement.findUnique({
    where: { id },
    include: {
      applicationSource: {
        include: {
          documents: true,
          campagneFiliere: {
            select: {
              id: true,
              campagne: { select: { piecesRequises: true } },
            },
          },
        },
      },
      etablissement: { select: { id: true, nom: true } },
      filiere: { select: { id: true, nom: true } },
    },
  });
  if (!preinscription) return { error: { status: 404, message: 'Pre-inscription non trouvee' } };
  if (preinscription.candidatId !== candidatId) {
    return { error: { status: 403, message: 'Acces refuse' } };
  }
  if (preinscription.statut !== 'SOUS_RESERVE') {
    return { error: { status: 400, message: 'Cette action est reservee aux dossiers sous reserve' } };
  }
  return { preinscription };
}

async function resolvePiecesForPreinscription(preinscription) {
  const app = preinscription.applicationSource;
  let pieces = extractPiecesList(app?.campagneFiliere?.campagne?.piecesRequises);
  if (!pieces?.length && app) {
    const cf = await prisma.campagneFiliere.findFirst({
      where: {
        filiereId: preinscription.filiereId,
        campagne: {
          etablissementId: preinscription.etablissementId,
          anneeAcademique: preinscription.anneeAcademique,
        },
      },
      include: { campagne: { select: { piecesRequises: true } } },
      orderBy: { createdAt: 'desc' },
    });
    pieces = extractPiecesList(cf?.campagne?.piecesRequises);
  }
  let requirements = pieces?.length
    ? piecesToVirtualRequirements(pieces)
    : [];
  if (!requirements.length && app) {
    requirements = await prisma.schoolRequirement.findMany({
      where: { etablissementId: preinscription.etablissementId, isRequired: true },
      orderBy: { createdAt: 'asc' },
    });
  }
  return withNiveauSuperieurRequirements(requirements, preinscription.niveau);
}

const genererNumeroPreinscription = () => {
  const now = new Date();
  const y = now.getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `PE-${y}-${rand}`;
};

const genererNumeroInscription = () => {
  const now = new Date();
  const y = now.getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `IA-${y}-${rand}`;
};

const construirePayloadPdf = (preinscription) => ({
  candidat: {
    id: preinscription.candidat.id,
    nom: preinscription.candidat.nom,
    prenom: preinscription.candidat.prenom,
    matricule: preinscription.candidat.matricule,
    email: preinscription.candidat.email,
    telephone: preinscription.candidat.telephone,
  },
  candidatId: preinscription.candidatId || preinscription.candidat.id,
  preinscription: {
    id: preinscription.id,
    numeroPreinscription: preinscription.numeroPreinscription,
    etablissementNom: preinscription.etablissement.nom,
    filiereNom: preinscription.filiere.nom,
    anneeAcademique: preinscription.anneeAcademique,
    niveau: preinscription.niveau,
    statut: preinscription.statut,
  },
});

const construirePayloadFicheInscription = (preinscription, numeroInscription) => ({
  candidat: {
    id: preinscription.candidat.id,
    nom: preinscription.candidat.nom,
    prenom: preinscription.candidat.prenom,
    matricule: preinscription.candidat.matricule,
    email: preinscription.candidat.email,
    telephone: preinscription.candidat.telephone,
  },
  candidatId: preinscription.candidatId || preinscription.candidat.id,
  preinscriptionId: preinscription.id,
  inscription: {
    numeroInscription,
    numeroPreinscription: preinscription.numeroPreinscription,
    etablissementNom: preinscription.etablissement.nom,
    filiereNom: preinscription.filiere.nom,
    anneeAcademique: preinscription.anneeAcademique,
    niveau: preinscription.niveau,
    statut: 'EN_COURS',
    preinscriptionId: preinscription.id,
  },
});

exports.creerPreinscriptionEtablissement = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    const { etablissementId, filiereId, anneeAcademique, niveau } = req.body;

    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    if (!etablissementId || !filiereId || !niveau) {
      return res.status(400).json({ error: 'etablissementId, filiereId et niveau sont requis' });
    }

    let anneeLibelle = String(anneeAcademique || '').trim();
    if (!anneeLibelle) {
      const anneeDges = await getOrCreateAnneeEnCoursDges();
      anneeLibelle = anneeDges.libelle;
    }

    const filiere = await prisma.filiere.findUnique({
      where: { id: filiereId },
      select: { id: true, etablissementId: true },
    });
    if (!filiere) {
      return res.status(404).json({ error: 'Filiere non trouvee' });
    }
    if (filiere.etablissementId !== etablissementId) {
      return res.status(400).json({ error: 'La filiere ne correspond pas a l etablissement selectionne' });
    }

    const numeroPreinscription = genererNumeroPreinscription();
    const preinscription = await prisma.preinscriptionEtablissement.create({
      data: {
        numeroPreinscription,
        candidatId,
        etablissementId,
        filiereId,
        anneeAcademique: anneeLibelle,
        niveau: Number(niveau),
      },
      include: {
        candidat: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            matricule: true,
            email: true,
            telephone: true,
          },
        },
        etablissement: {
          select: { id: true, nom: true },
        },
        filiere: {
          select: { id: true, nom: true },
        },
      },
    });

    runInBackground(async () => {
      let pdfResult = null;
      try {
        pdfResult = await pdfService.genererFichePreinscriptionEtablissement(construirePayloadPdf(preinscription));
        await emailService.envoyerEmailPreinscriptionEtablissement({
          userId: preinscription.candidat.id,
          candidatId: preinscription.candidat.id,
          candidatEmail: preinscription.candidat.email,
          candidatNom: preinscription.candidat.nom,
          candidatPrenom: preinscription.candidat.prenom,
          etablissementNom: preinscription.etablissement.nom,
          filiereNom: preinscription.filiere.nom,
          anneeAcademique: preinscription.anneeAcademique,
          niveau: preinscription.niveau,
          numeroPreinscription: preinscription.numeroPreinscription,
        }, pdfResult.filePath);

        setTimeout(() => {
          pdfService.nettoyerPDF(pdfResult.filePath);
        }, 10 * 60 * 1000);
      } catch (emailErr) {
        console.error('Erreur envoi fiche pre-inscription etablissement:', emailErr);
        if (pdfResult?.filePath) {
          pdfService.nettoyerPDF(pdfResult.filePath);
        }
      }
    }, 'preinscription-etablissement-email');

    return res.status(201).json({
      message: 'Pre-inscription enregistree. La fiche sera envoyee par email sous peu.',
      preinscription,
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Une pre-inscription existe deja pour cette filiere et cette annee' });
    }
    console.error('Erreur creerPreinscriptionEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getMesPreinscriptionsEtablissement = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const preinscriptions = await prisma.preinscriptionEtablissement.findMany({
      where: { candidatId },
      include: {
        etablissement: { select: { id: true, nom: true } },
        filiere: { select: { id: true, nom: true, code: true } },
        applicationSource: {
          select: {
            id: true,
            numeroApplication: true,
            niveau: true,
            status: true,
            documents: {
              select: {
                id: true,
                code: true,
                label: true,
                status: true,
                documentUrl: true,
                source: true,
                updatedAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ preinscriptions });
  } catch (error) {
    console.error('Erreur getMesPreinscriptionsEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getDemandesEtablissement = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    const { statut } = req.query;
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const where = {
      etablissementId,
      ...(statut ? { statut } : {}),
    };

    const demandes = await prisma.preinscriptionEtablissement.findMany({
      where,
      include: {
        candidat: {
          select: { id: true, matricule: true, nom: true, prenom: true, email: true },
        },
        filiere: {
          select: { id: true, nom: true, code: true },
        },
        applicationSource: {
          select: { id: true, numeroApplication: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ demandes });
  } catch (error) {
    console.error('Erreur getDemandesEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.deciderPreinscriptionEtablissement = async (req, res) => {
  try {
    const etablissementId = resolveEtablissementIdFromReq(req);
    const { id } = req.params;
    const { statut } = req.body;
    const motifDecision = (req.body.motifDecision || req.body.commentaireAdmin || '').trim() || null;

    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    if (!STATUTS_DECISION.includes(statut)) {
      return res.status(400).json({ error: 'Statut de decision invalide' });
    }
    if ((statut === 'SOUS_RESERVE' || statut === 'REJETE') && !motifDecision) {
      return res.status(400).json({ error: 'Un motif / message au candidat est obligatoire' });
    }

    const existing = await prisma.preinscriptionEtablissement.findUnique({
      where: { id },
      include: {
        candidat: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        filiere: {
          select: { id: true, nom: true },
        },
        etablissement: {
          select: { id: true, nom: true },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pre-inscription non trouvee' });
    }
    if (existing.etablissementId !== etablissementId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    if (existing.statut !== 'EN_ATTENTE') {
      const message =
        existing.statut === 'SOUS_RESERVE'
          ? 'Dossier sous réserve : attendez la resoumission du candidat avant un nouveau verdict.'
          : 'Cette decision est definitive et ne peut plus etre modifiee.';
      return res.status(400).json({ error: message });
    }

    let inscriptionAcadId = null;
    let numeroInscriptionGenere = null;
    if (statut === 'VALIDE') {
      const inscriptionExistante = await prisma.inscriptionAcademique.findFirst({
        where: {
          candidatId: existing.candidatId,
          filiereId: existing.filiereId,
          anneeAcademique: existing.anneeAcademique,
        },
        select: { id: true, ficheInscriptionUrl: true },
      });

      if (inscriptionExistante) {
        inscriptionAcadId = inscriptionExistante.id;
      } else {
        numeroInscriptionGenere = genererNumeroInscription();
        const inscriptionAcad = await prisma.inscriptionAcademique.create({
          data: {
            candidatId: existing.candidatId,
            filiereId: existing.filiereId,
            etablissementId: existing.etablissementId,
            anneeAcademique: existing.anneeAcademique,
            niveau: existing.niveau,
            statut: 'EN_COURS',
          },
          select: { id: true },
        });
        inscriptionAcadId = inscriptionAcad.id;
      }
    }

    const preinscription = await prisma.preinscriptionEtablissement.update({
      where: { id },
      data: {
        statut,
        motifDecision,
        decidedAt: new Date(),
        decidedBy: req.user?.id || etablissementId,
        inscriptionAcadId,
      },
      include: {
        candidat: {
          select: { id: true, nom: true, prenom: true, email: true, matricule: true, telephone: true },
        },
        filiere: {
          select: { nom: true },
        },
        etablissement: {
          select: { nom: true },
        },
      },
    });

    if (statut === 'SOUS_RESERVE') {
      runInBackground(async () => {
        try {
          await emailService.envoyerEmailSousReserveEtablissement({
            userId: preinscription.candidat.id,
            candidatId: preinscription.candidat.id,
            candidatEmail: preinscription.candidat.email,
            candidatNom: preinscription.candidat.nom,
            candidatPrenom: preinscription.candidat.prenom,
            etablissementNom: preinscription.etablissement.nom,
            filiereNom: preinscription.filiere.nom,
            anneeAcademique: preinscription.anneeAcademique,
            niveau: preinscription.niveau,
            numeroPreinscription: preinscription.numeroPreinscription,
            motif: motifDecision,
          });
        } catch (emailErr) {
          console.error('Erreur email sous reserve etablissement:', emailErr);
        }
      }, 'preinscription-sous-reserve-email');
    }

    if (statut === 'VALIDE' && inscriptionAcadId) {
      const inscId = inscriptionAcadId;
      const numero = numeroInscriptionGenere || existing.numeroPreinscription || genererNumeroInscription();
      runInBackground(async () => {
        let pdfResult = null;
        try {
          const existingInsc = await prisma.inscriptionAcademique.findUnique({
            where: { id: inscId },
            select: { ficheInscriptionUrl: true },
          });
          if (existingInsc?.ficheInscriptionUrl) {
            const localPath = localFileStorage.getLocalFilePath(existingInsc.ficheInscriptionUrl);
            await emailService.envoyerEmailInscriptionAcademique({
              userId: preinscription.candidat.id,
              candidatId: preinscription.candidat.id,
              candidatEmail: preinscription.candidat.email,
              candidatNom: preinscription.candidat.nom,
              candidatPrenom: preinscription.candidat.prenom,
              filiereNom: preinscription.filiere.nom,
              etablissementNom: preinscription.etablissement.nom,
              anneeAcademique: preinscription.anneeAcademique,
              niveau: preinscription.niveau,
              numeroInscription: numero,
            }, localPath && fs.existsSync(localPath) ? localPath : null);
            return;
          }

          pdfResult = await pdfService.genererFicheInscriptionEtablissement(
            construirePayloadFicheInscription(preinscription, numero)
          );
          const fileBuffer = fs.readFileSync(pdfResult.filePath);
          const fichePath = `inscriptions-academiques/${inscId}/fiche-inscription-${numero}.pdf`;
          const ficheUrl = await localFileStorage.saveBuffer(fileBuffer, fichePath);

          await prisma.inscriptionAcademique.update({
            where: { id: inscId },
            data: { ficheInscriptionUrl: ficheUrl },
          });

          await emailService.envoyerEmailInscriptionAcademique({
            userId: preinscription.candidat.id,
            candidatId: preinscription.candidat.id,
            candidatEmail: preinscription.candidat.email,
            candidatNom: preinscription.candidat.nom,
            candidatPrenom: preinscription.candidat.prenom,
            filiereNom: preinscription.filiere.nom,
            etablissementNom: preinscription.etablissement.nom,
            anneeAcademique: preinscription.anneeAcademique,
            niveau: preinscription.niveau,
            numeroInscription: numero,
          }, pdfResult.filePath);

          setTimeout(() => pdfService.nettoyerPDF(pdfResult.filePath), 10 * 60 * 1000);
        } catch (err) {
          console.error('Erreur generation/envoi fiche inscription academique:', err);
          if (pdfResult?.filePath) pdfService.nettoyerPDF(pdfResult.filePath);
        }
      }, 'validation-preinscription-fiche-inscription');
    }

    return res.json({
      message: 'Decision enregistree avec succes',
      preinscription,
      inscriptionAcademiqueCreee: Boolean(inscriptionAcadId && statut === 'VALIDE'),
    });
  } catch (error) {
    console.error('Erreur deciderPreinscriptionEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.telechargerFichePreinscriptionEtablissement = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const preinscription = await prisma.preinscriptionEtablissement.findUnique({
      where: { id },
      include: {
        candidat: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            matricule: true,
            email: true,
            telephone: true,
          },
        },
        etablissement: {
          select: { id: true, nom: true },
        },
        filiere: {
          select: { id: true, nom: true },
        },
      },
    });

    if (!preinscription) {
      return res.status(404).json({ error: 'Pre-inscription non trouvee' });
    }

    const isOwnerEtudiant = preinscription.candidatId === userId;
    const isOwnerEtablissement = canAccessEtablissementResource(req, preinscription.etablissementId);
    if (!isOwnerEtudiant && !isOwnerEtablissement) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const pdfResult = await pdfService.genererFichePreinscriptionEtablissement(construirePayloadPdf(preinscription));
    const filename = `fiche_preinscription_etablissement_${preinscription.numeroPreinscription}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const stream = fs.createReadStream(pdfResult.filePath);
    stream.pipe(res);
    stream.on('close', () => {
      pdfService.nettoyerPDF(pdfResult.filePath);
    });
  } catch (error) {
    console.error('Erreur telechargerFichePreinscriptionEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/** Contexte de correction pour un dossier sous réserve. */
exports.getContexteCorrectionSousReserve = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    if (!candidatId) return res.status(401).json({ error: 'Utilisateur non authentifie' });

    const { preinscription, error } = await loadSousReserveOwned(req.params.id, candidatId);
    if (error) return res.status(error.status).json({ error: error.message });

    const requirements = await resolvePiecesForPreinscription(preinscription);
    const docs = preinscription.applicationSource?.documents || [];
    const byCode = new Map();

    // 1) Toutes les pièces déjà téléversées / synchronisées
    docs.forEach((d) => {
      byCode.set(d.code, {
        code: d.code,
        label: d.label || d.code,
        requirementType: 'DOCUMENT_UPLOAD',
        canReplace: true,
        alreadyUploaded: Boolean(d.documentUrl) || d.status === 'PROVIDED',
        document: {
          id: d.id,
          status: d.status,
          documentUrl: d.documentUrl,
          source: d.source,
          updatedAt: d.updatedAt,
        },
      });
    });

    // 2) Compléter avec les pièces exigées (même si pas encore de fichier)
    requirements.forEach((req) => {
      const existing = byCode.get(req.code);
      if (existing) {
        existing.label = req.label || existing.label;
        existing.requirementType = req.requirementType;
        existing.required = true;
        return;
      }
      byCode.set(req.code, {
        code: req.code,
        label: req.label,
        requirementType: req.requirementType,
        required: true,
        canReplace: true,
        alreadyUploaded: false,
        document: null,
      });
    });

    // Quittance frais de dossier toujours modifiable si présente ou attendue
    if (!byCode.has('quittance_frais_dossier')) {
      byCode.set('quittance_frais_dossier', {
        code: 'quittance_frais_dossier',
        label: 'Quittance frais de dossier',
        requirementType: 'DOCUMENT_UPLOAD',
        required: true,
        canReplace: true,
        alreadyUploaded: false,
        document: null,
      });
    }

    const pieces = Array.from(byCode.values()).sort((a, b) => {
      if (a.alreadyUploaded !== b.alreadyUploaded) return a.alreadyUploaded ? -1 : 1;
      return String(a.label).localeCompare(String(b.label), 'fr');
    });

    return res.json({
      preinscription: {
        id: preinscription.id,
        numeroPreinscription: preinscription.numeroPreinscription,
        niveau: preinscription.niveau,
        motifDecision: preinscription.motifDecision,
        decidedAt: preinscription.decidedAt,
        etablissement: preinscription.etablissement,
        filiere: preinscription.filiere,
        applicationId: preinscription.applicationSource?.id || null,
      },
      pieces,
    });
  } catch (error) {
    console.error('Erreur getContexteCorrectionSousReserve:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/** Remplace une pièce du dossier lié (sous réserve). */
exports.remplacerPieceSousReserve = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    const { code } = req.body;
    if (!candidatId) return res.status(401).json({ error: 'Utilisateur non authentifie' });
    if (!code) return res.status(400).json({ error: 'Le code de la piece est requis' });
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier recu' });

    const { preinscription, error } = await loadSousReserveOwned(req.params.id, candidatId);
    if (error) return res.status(error.status).json({ error: error.message });

    const application = preinscription.applicationSource;
    if (!application) {
      return res.status(400).json({
        error: 'Aucun dossier de candidature associe. Impossible de remplacer une piece.',
      });
    }

    const requirements = await resolvePiecesForPreinscription(preinscription);
    const requirement = requirements.find((r) => r.code === code);
    const existingDoc = (application.documents || []).find((d) => d.code === code);
    const isQuittance = code === 'quittance_frais_dossier' || code === 'quittance';

    if (!requirement && !existingDoc && !isQuittance) {
      return res.status(404).json({
        error: 'Cette piece ne fait pas partie de votre dossier ni des pieces demandees',
      });
    }

    const label =
      requirement?.label
      || existingDoc?.label
      || (isQuittance ? 'Quittance frais de dossier' : code);

    const ext = req.file.originalname.split('.').pop();
    const fileName = `${code}-${Date.now()}.${ext}`;
    const storagePath = `applications/${application.id}/documents/${fileName}`;
    const documentUrl = await localFileStorage.saveBuffer(req.file.buffer, storagePath);

    const document = await prisma.applicationDocument.upsert({
      where: {
        applicationId_code: {
          applicationId: application.id,
          code,
        },
      },
      update: {
        label,
        source: 'STUDENT_UPLOAD',
        status: 'PROVIDED',
        documentUrl,
        schoolRequirementId: null,
      },
      create: {
        applicationId: application.id,
        code,
        label,
        source: 'STUDENT_UPLOAD',
        status: 'PROVIDED',
        documentUrl,
      },
    });

    // Si quittance : garder aussi le reçu de paiement aligné
    if (isQuittance) {
      const payment = await prisma.payment.findFirst({
        where: { applicationId: application.id, paymentType: 'DOSSIER_FEES' },
        orderBy: { createdAt: 'desc' },
        include: { receipt: true },
      });
      if (payment?.receipt) {
        await prisma.receipt.update({
          where: { id: payment.receipt.id },
          data: {
            receiptUrl: documentUrl,
            metadata: {
              ...(payment.receipt.metadata && typeof payment.receipt.metadata === 'object'
                ? payment.receipt.metadata
                : {}),
              replacedSousReserve: true,
              replacedAt: new Date().toISOString(),
              originalFileName: req.file.originalname,
            },
          },
        });
      }
    }

    return res.json({
      message: 'Piece remplacee avec succes',
      document,
    });
  } catch (error) {
    console.error('Erreur remplacerPieceSousReserve:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/** Modifie le niveau d'étude (sous réserve). */
exports.modifierNiveauSousReserve = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    const niveau = Number(req.body.niveau);
    if (!candidatId) return res.status(401).json({ error: 'Utilisateur non authentifie' });
    if (!Number.isFinite(niveau) || niveau < 1 || niveau > 10) {
      return res.status(400).json({ error: 'Niveau invalide' });
    }

    const { preinscription, error } = await loadSousReserveOwned(req.params.id, candidatId);
    if (error) return res.status(error.status).json({ error: error.message });

    const contrainte = await resolveContrainteNiveauTransfert({
      candidatId,
      filiereIdCible: preinscription.filiereId,
      etablissementIdCible: preinscription.etablissementId,
    });
    const checkNiveau = assertNiveauTransfertAutorise(niveau, contrainte);
    if (!checkNiveau.ok) {
      return res.status(400).json({ error: checkNiveau.error, contrainte });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.preinscriptionEtablissement.update({
        where: { id: preinscription.id },
        data: { niveau },
      });
      if (preinscription.applicationSource?.id) {
        await tx.application.update({
          where: { id: preinscription.applicationSource.id },
          data: { niveau },
        });
      }
      return p;
    });

    return res.json({
      message: 'Niveau d\'etude mis a jour',
      preinscription: {
        id: updated.id,
        niveau: updated.niveau,
      },
    });
  } catch (error) {
    console.error('Erreur modifierNiveauSousReserve:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/** Resoumet le dossier après correction (sous réserve → en attente). */
exports.resoumettreSousReserve = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    if (!candidatId) return res.status(401).json({ error: 'Utilisateur non authentifie' });

    const { preinscription, error } = await loadSousReserveOwned(req.params.id, candidatId);
    if (error) return res.status(error.status).json({ error: error.message });

    const decidedAt = preinscription.decidedAt ? new Date(preinscription.decidedAt) : null;
    const app = preinscription.applicationSource;
    const docs = app?.documents || [];
    const docCorrige = decidedAt
      ? docs.some((d) => new Date(d.updatedAt) > decidedAt)
      : docs.length > 0;
    const niveauCorrige = decidedAt && app
      ? new Date(app.updatedAt) > decidedAt
      : false;

    if (!docCorrige && !niveauCorrige) {
      return res.status(400).json({
        error:
          'Remplacez au moins une piece demandee ou modifiez le niveau d\'etude avant de resoumettre.',
      });
    }

    const updated = await prisma.preinscriptionEtablissement.update({
      where: { id: preinscription.id },
      data: {
        statut: 'EN_ATTENTE',
        decidedAt: null,
        decidedBy: null,
        // Conserve le dernier motif pour l'historique admin ; le statut repasse en attente
      },
      include: {
        etablissement: { select: { nom: true } },
        filiere: { select: { nom: true } },
      },
    });

    return res.json({
      message: 'Dossier resoumis avec succes. Il est de nouveau en attente de decision.',
      preinscription: updated,
    });
  } catch (error) {
    console.error('Erreur resoumettreSousReserve:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
