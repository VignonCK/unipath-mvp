const { Prisma } = require('@prisma/client');
const prisma = require('../prisma');
const emailService = require('../services/email.service');
const pdfService = require('../services/pdf.service');
const localFileStorage = require('../services/local-file-storage.service');
const fs = require('fs');
const {
  canAccessEtablissementResource,
} = require('../utils/etablissement-access.helper');

const STATUTS = ['EN_COURS', 'VALIDE', 'REDOUBLANT', 'ABANDONNE'];
const STATUTS_ACTIFS_CHOIX = ['EN_COURS', 'VALIDE'];

function annotateInscriptionsForConfirmation(inscriptions) {
  const byYear = new Map();
  for (const ins of inscriptions) {
    if (!STATUTS_ACTIFS_CHOIX.includes(ins.statut)) continue;
    const key = ins.anneeAcademique || '';
    if (!byYear.has(key)) byYear.set(key, []);
    byYear.get(key).push(ins);
  }

  const yearsNeedingChoice = new Set();
  for (const [year, list] of byYear.entries()) {
    if (list.length < 2) continue;
    // Si une inscription a déjà été confirmée exclusivement, plus de choix
    const alreadyConfirmed = list.some((ins) => ins.confirmeeAt);
    if (!alreadyConfirmed) yearsNeedingChoice.add(year);
  }

  return inscriptions.map((ins) => {
    const needsConfirmation = yearsNeedingChoice.has(ins.anneeAcademique || '')
      && STATUTS_ACTIFS_CHOIX.includes(ins.statut)
      && !ins.confirmeeAt;
    return {
      ...ins,
      needsConfirmation,
      canConfirm: needsConfirmation,
    };
  });
}

exports.creerInscriptionAcad = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    const {
      filiereId,
      etablissementId,
      anneeAcademique,
      niveau,
    } = req.body;

    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    if (!filiereId || !etablissementId || !anneeAcademique || !niveau) {
      return res.status(400).json({
        error: 'filiereId, etablissementId, anneeAcademique et niveau sont requis',
      });
    }

    const inscription = await prisma.inscriptionAcademique.create({
      data: {
        candidatId,
        filiereId,
        etablissementId,
        anneeAcademique,
        niveau: Number(niveau),
      },
      include: {
        candidat: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        filiere: true,
        etablissement: true,
      },
    });

    try {
      await emailService.envoyerEmailInscriptionAcademique({
        userId: inscription.candidat.id,
        candidatId: inscription.candidat.id,
        candidatEmail: inscription.candidat.email,
        candidatNom: inscription.candidat.nom,
        candidatPrenom: inscription.candidat.prenom,
        filiereNom: inscription.filiere.nom,
        etablissementNom: inscription.etablissement.nom,
        anneeAcademique: inscription.anneeAcademique,
        niveau: inscription.niveau,
      });
    } catch (emailError) {
      console.error('Erreur envoi email inscription academique:', emailError);
    }

    return res.status(201).json({
      message: 'Inscription academique creee avec succes',
      inscription,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Inscription deja existante pour la filiere et l annee academique' });
    }

    if (typeof error.message === 'string' && error.message.includes('Progression bloquee')) {
      return res.status(400).json({ error: 'Progression bloquee : annee precedente non validee' });
    }

    console.error('Erreur creerInscriptionAcad:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getMesInscriptions = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const inscriptions = await prisma.inscriptionAcademique.findMany({
      where: { candidatId },
      include: {
        filiere: true,
        etablissement: true,
        notes: true,
        preinscriptionSource: {
          select: {
            id: true,
            numeroPreinscription: true,
            statut: true,
          },
        },
      },
      orderBy: [{ anneeAcademique: 'asc' }, { niveau: 'asc' }],
    });

    const annotated = annotateInscriptionsForConfirmation(inscriptions);
    const needsConfirmationChoice = annotated.some((ins) => ins.needsConfirmation);

    return res.json({
      message: 'Mes inscriptions academiques recuperees avec succes',
      inscriptions: annotated,
      needsConfirmationChoice,
    });
  } catch (error) {
    console.error('Erreur getMesInscriptions:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Le candidat confirme une seule inscription parmi plusieurs admissions
 * (établissements / filières différents) pour la même année académique.
 * Les autres inscriptions actives de cette année passent à ABANDONNE.
 */
exports.confirmerInscription = async (req, res) => {
  try {
    const { id } = req.params;
    const candidatId = req.user?.id;
    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const inscription = await prisma.inscriptionAcademique.findUnique({
      where: { id },
      include: {
        filiere: { select: { id: true, nom: true } },
        etablissement: { select: { id: true, nom: true } },
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription academique non trouvee' });
    }
    if (inscription.candidatId !== candidatId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    if (!STATUTS_ACTIFS_CHOIX.includes(inscription.statut)) {
      return res.status(400).json({
        error: 'Seule une inscription encore active peut etre confirmee.',
      });
    }

    const actives = await prisma.inscriptionAcademique.findMany({
      where: {
        candidatId,
        anneeAcademique: inscription.anneeAcademique,
        statut: { in: STATUTS_ACTIFS_CHOIX },
      },
      select: {
        id: true,
        statut: true,
        etablissementId: true,
        filiereId: true,
      },
    });

    if (actives.length < 2) {
      return res.status(400).json({
        error:
          'La confirmation n\'est requise que lorsque vous avez au moins deux inscriptions validees (etablissements ou filieres differents).',
      });
    }

    const autresIds = actives.filter((a) => a.id !== id).map((a) => a.id);
    const motifAnnulation =
      `Annulée par le candidat : confirmation de l'inscription à ${inscription.etablissement?.nom || 'un autre établissement'} — ${inscription.filiere?.nom || 'autre filière'} (${inscription.anneeAcademique}).`;

    const result = await prisma.$transaction(async (tx) => {
      const confirmee = await tx.inscriptionAcademique.update({
        where: { id },
        data: {
          confirmeeAt: new Date(),
        },
        include: {
          filiere: true,
          etablissement: true,
        },
      });

      await tx.inscriptionAcademique.updateMany({
        where: { id: { in: autresIds } },
        data: { statut: 'ABANDONNE', confirmeeAt: null },
      });

      // Documenter l'annulation sur les pré-inscriptions liées
      await tx.preinscriptionEtablissement.updateMany({
        where: { inscriptionAcadId: { in: autresIds } },
        data: {
          motifDecision: motifAnnulation,
        },
      });

      return confirmee;
    });

    return res.json({
      message:
        'Inscription confirmée. Vos autres inscriptions validées pour cette année ont été annulées.',
      inscription: result,
      annulees: autresIds.length,
    });
  } catch (error) {
    console.error('Erreur confirmerInscription:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getInscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const inscription = await prisma.inscriptionAcademique.findUnique({
      where: { id },
      include: {
        candidat: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            matricule: true,
            email: true,
          },
        },
        filiere: true,
        etablissement: true,
        notes: true,
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription academique non trouvee' });
    }

    if (inscription.candidatId !== userId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    return res.json({
      message: 'Inscription academique recuperee avec succes',
      inscription,
    });
  } catch (error) {
    console.error('Erreur getInscriptionById:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!statut || !STATUTS.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const existing = await prisma.inscriptionAcademique.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inscription academique non trouvee' });
    }

    const inscription = await prisma.inscriptionAcademique.update({
      where: { id },
      data: { statut },
      include: {
        candidat: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        filiere: {
          select: { nom: true },
        },
      },
    });

    try {
      await emailService.envoyerEmailStatutAcademique({
        userId: inscription.candidat.id,
        candidatId: inscription.candidat.id,
        candidatEmail: inscription.candidat.email,
        candidatNom: inscription.candidat.nom,
        candidatPrenom: inscription.candidat.prenom,
        filiereNom: inscription.filiere.nom,
        anneeAcademique: inscription.anneeAcademique,
        niveau: inscription.niveau,
        statut: inscription.statut,
      });
    } catch (emailError) {
      console.error('Erreur envoi email statut academique:', emailError);
    }

    return res.json({
      message: 'Statut mis a jour avec succes',
      inscription,
    });
  } catch (error) {
    console.error('Erreur updateStatut:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.telechargerFicheInscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const inscription = await prisma.inscriptionAcademique.findUnique({
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
            dossier: { select: { photo: true } },
          },
        },
        etablissement: { select: { id: true, nom: true } },
        filiere: { select: { id: true, nom: true } },
        preinscriptionSource: {
          select: { id: true, numeroPreinscription: true },
        },
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription academique non trouvee' });
    }

    const isOwner = inscription.candidatId === userId;
    const isEtablissement = canAccessEtablissementResource(req, inscription.etablissementId);
    if (!isOwner && !isEtablissement) {
      return res.status(403).json({ error: 'Acces refuse' });
    }

    const numero =
      inscription.preinscriptionSource?.numeroPreinscription
      || `IA-${inscription.anneeAcademique?.slice(0, 4) || new Date().getFullYear()}`;

    const pdfResult = await pdfService.genererFicheInscriptionEtablissement({
      candidat: {
        id: inscription.candidat.id,
        nom: inscription.candidat.nom,
        prenom: inscription.candidat.prenom,
        matricule: inscription.candidat.matricule,
        email: inscription.candidat.email,
        telephone: inscription.candidat.telephone,
        dossier: inscription.candidat.dossier || undefined,
      },
      candidatId: inscription.candidatId,
      preinscriptionId: inscription.preinscriptionSource?.id,
      photo: inscription.candidat?.dossier?.photo || null,
      inscription: {
        numeroInscription: numero,
        numeroPreinscription: inscription.preinscriptionSource?.numeroPreinscription,
        etablissementNom: inscription.etablissement.nom,
        filiereNom: inscription.filiere.nom,
        anneeAcademique: inscription.anneeAcademique,
        niveau: inscription.niveau,
        statut: inscription.statut,
        preinscriptionId: inscription.preinscriptionSource?.id,
      },
    });

    try {
      const fileBuffer = fs.readFileSync(pdfResult.filePath);
      const fichePath = `inscriptions-academiques/${id}/fiche-inscription-${numero}.pdf`;
      const ficheUrl = await localFileStorage.saveBuffer(fileBuffer, fichePath);
      await prisma.inscriptionAcademique.update({
        where: { id },
        data: { ficheInscriptionUrl: ficheUrl },
      });
    } catch (persistErr) {
      console.error('Erreur persistance fiche inscription:', persistErr);
    }

    const filename = `fiche_inscription_${numero}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const stream = fs.createReadStream(pdfResult.filePath);
    stream.pipe(res);
    stream.on('close', () => {
      pdfService.nettoyerPDF(pdfResult.filePath);
    });
  } catch (error) {
    console.error('Erreur telechargerFicheInscription:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

