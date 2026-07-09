const prisma = require('../prisma');
const { getAdminEtablissementId, adminOwnsEtablissement } = require('../utils/admin-etablissement.helper');
const emailService = require('../services/email.service');
const pdfService = require('../services/pdf.service');
const { uploadBufferToSupabase } = require('../utils/file-upload.helper');
const {
  appendHistorique,
  appendDocument,
  hasDocumentsCompl,
  newDocumentId,
  PREINSCRIPTION_INCLUDE,
} = require('../utils/preinscription.helper');
const fs = require('fs');

async function notifierAdminsEtablissement(etablissementId, etablissementEmail, sendFn) {
  const admins = await prisma.adminEtablissement.findMany({
    where: { etablissementId },
    select: { id: true, email: true },
  });
  const cibles = admins.length > 0
    ? admins
    : (etablissementEmail ? [{ id: null, email: etablissementEmail }] : []);

  for (const admin of cibles) {
    try {
      await sendFn(admin);
    } catch (err) {
      console.error('Erreur notification admin etablissement:', err);
    }
  }
}

const STATUTS_DECISION = ['VALIDE', 'SOUS_RESERVE', 'REJETE'];

const genererNumeroPreinscription = () => {
  const now = new Date();
  const y = now.getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `PE-${y}-${rand}`;
};

const construirePayloadPdf = (preinscription) => ({
  candidat: {
    nom: preinscription.candidat.nom,
    prenom: preinscription.candidat.prenom,
    matricule: preinscription.candidat.matricule,
    email: preinscription.candidat.email,
    telephone: preinscription.candidat.telephone,
  },
  preinscription: {
    numeroPreinscription: preinscription.numeroPreinscription,
    etablissementNom: preinscription.etablissement.nom,
    filiereNom: preinscription.filiere.nom,
    anneeAcademique: preinscription.anneeAcademique,
    niveau: preinscription.niveau,
    statut: preinscription.statut,
  },
});

exports.creerPreinscriptionEtablissement = async (req, res) => {
  return res.status(410).json({
    error:
      'La création directe de pré-inscription est désactivée. Passez par le dépôt de dossier via /api/applications.',
  });

  try {
    const candidatId = req.user?.id;
    const { etablissementId, filiereId, anneeAcademique, niveau } = req.body;

    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    if (!etablissementId || !filiereId || !anneeAcademique || !niveau) {
      return res.status(400).json({ error: 'etablissementId, filiereId, anneeAcademique et niveau sont requis' });
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
        anneeAcademique,
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

      // Le worker email lit la pièce jointe asynchronement.
      setTimeout(() => {
        pdfService.nettoyerPDF(pdfResult.filePath);
      }, 10 * 60 * 1000);
    } catch (emailErr) {
      console.error('Erreur envoi fiche pre-inscription etablissement:', emailErr);
    }

    return res.status(201).json({
      message: 'Pre-inscription enregistree. La fiche a ete envoyee par email.',
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
    const etablissementId = getAdminEtablissementId(req);
    const { statut } = req.query;
    if (!etablissementId) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
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
          select: { id: true, numeroApplication: true },
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

exports.ajouterDocumentComplementaire = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    const { id } = req.params;

    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const existing = await prisma.preinscriptionEtablissement.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pre-inscription non trouvee' });
    }
    if (existing.candidatId !== candidatId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    if (existing.statut !== 'SOUS_RESERVE') {
      return res.status(400).json({ error: 'Des documents complementaires ne peuvent etre ajoutes que pour un dossier sous reserve' });
    }

    const ext = req.file.originalname.split('.').pop();
    const storagePath = `preinscriptions/${id}/complements/${newDocumentId()}-${Date.now()}.${ext}`;
    const url = await uploadBufferToSupabase(req.file.buffer, storagePath, req.file.mimetype);

    const piece = {
      id: newDocumentId(),
      nom: req.file.originalname,
      url,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
    };

    const preinscription = await prisma.preinscriptionEtablissement.update({
      where: { id },
      data: {
        documentsCompl: appendDocument(existing.documentsCompl, piece),
        historiqueStatuts: appendHistorique(existing.historiqueStatuts, {
          statut: 'SOUS_RESERVE',
          date: new Date().toISOString(),
          commentaire: `Document complementaire ajoute : ${req.file.originalname}`,
        }),
      },
      include: PREINSCRIPTION_INCLUDE,
    });

    return res.json({
      message: 'Document ajoute avec succes',
      preinscription,
    });
  } catch (error) {
    console.error('Erreur ajouterDocumentComplementaire:', error);
    if (error.message?.includes('Type de fichier')) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.resoumettrePreinscription = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    const { id } = req.params;

    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const existing = await prisma.preinscriptionEtablissement.findUnique({
      where: { id },
      include: PREINSCRIPTION_INCLUDE,
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pre-inscription non trouvee' });
    }
    if (existing.candidatId !== candidatId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    if (existing.statut !== 'SOUS_RESERVE') {
      return res.status(400).json({ error: 'Seul un dossier sous reserve peut etre resoumis' });
    }
    if (!hasDocumentsCompl(existing.documentsCompl)) {
      return res.status(400).json({ error: 'Au moins un document complementaire doit etre uploade avant la resoumission' });
    }

    const preinscription = await prisma.preinscriptionEtablissement.update({
      where: { id },
      data: {
        statut: 'EN_ATTENTE',
        historiqueStatuts: appendHistorique(existing.historiqueStatuts, {
          statut: 'EN_ATTENTE',
          date: new Date().toISOString(),
          commentaire: 'Resoumission candidat',
        }),
      },
      include: PREINSCRIPTION_INCLUDE,
    });

    await notifierAdminsEtablissement(
      preinscription.etablissementId,
      preinscription.etablissement.email,
      (admin) => emailService.envoyerEmailAdminPreinscriptionResoumise({
        adminId: admin.id,
        adminEmail: admin.email,
        candidatNom: preinscription.candidat.nom,
        candidatPrenom: preinscription.candidat.prenom,
        etablissementNom: preinscription.etablissement.nom,
        numeroPreinscription: preinscription.numeroPreinscription,
      }),
    );

    return res.json({
      message: 'Dossier resoumis avec succes',
      preinscription,
    });
  } catch (error) {
    console.error('Erreur resoumettrePreinscription:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.deciderPreinscriptionEtablissement = async (req, res) => {
  try {
    const etablissementId = getAdminEtablissementId(req);
    const { id } = req.params;
    const { statut, motifDecision, commentaireAdmin } = req.body;

    if (!etablissementId) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }
    if (!STATUTS_DECISION.includes(statut)) {
      return res.status(400).json({ error: 'Statut de decision invalide' });
    }

    if (statut === 'REJETE' && (!motifDecision || !String(motifDecision).trim())) {
      return res.status(400).json({ error: 'Le motif de rejet est obligatoire' });
    }

    if (statut === 'VALIDE' && motifDecision) {
      return res.status(400).json({ error: 'Aucun motif ne doit être fourni pour une validation' });
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
      return res.status(400).json({ error: 'Cette pre-inscription a deja ete traitee' });
    }

    let inscriptionAcadId = null;
    if (statut === 'VALIDE') {
      const inscriptionExistante = await prisma.inscriptionAcademique.findFirst({
        where: {
          candidatId: existing.candidatId,
          filiereId: existing.filiereId,
          anneeAcademique: existing.anneeAcademique,
        },
        select: { id: true },
      });

      if (inscriptionExistante) {
        inscriptionAcadId = inscriptionExistante.id;
      } else {
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

    const updateData = {
      statut,
      motifDecision: statut === 'REJETE' ? String(motifDecision).trim() : null,
      decidedAt: new Date(),
      decidedBy: etablissementId,
      inscriptionAcadId,
    };

    if (statut === 'SOUS_RESERVE') {
      updateData.commentaireAdmin = commentaireAdmin || null;
      updateData.historiqueStatuts = appendHistorique(existing.historiqueStatuts, {
        statut: 'SOUS_RESERVE',
        date: new Date().toISOString(),
        commentaire: commentaireAdmin || null,
      });
    }

    const preinscription = await prisma.preinscriptionEtablissement.update({
      where: { id },
      data: updateData,
      include: PREINSCRIPTION_INCLUDE,
    });

    if (statut === 'SOUS_RESERVE') {
      try {
        await emailService.envoyerEmailPreinscriptionSousReserveEtablissement({
          userId: preinscription.candidat.id,
          candidatId: preinscription.candidat.id,
          candidatEmail: preinscription.candidat.email,
          candidatNom: preinscription.candidat.nom,
          candidatPrenom: preinscription.candidat.prenom,
          etablissementNom: preinscription.etablissement.nom,
          numeroPreinscription: preinscription.numeroPreinscription,
          commentaireAdmin: commentaireAdmin || null,
        });
      } catch (emailErr) {
        console.error('Erreur envoi email sous reserve:', emailErr);
      }
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
    const userRole = req.user?.role || req.userRole;
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
    const isAdminEtab = adminOwnsEtablissement(req, preinscription.etablissementId);
    if (!isOwnerEtudiant && !isAdminEtab) {
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
