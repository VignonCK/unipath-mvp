const { Prisma } = require('@prisma/client');
const prisma = require('../prisma');
const emailService = require('../services/email.service');
const { getAdminEtablissementId } = require('../utils/admin-etablissement.helper');
const { uploadBufferToSupabase } = require('../utils/file-upload.helper');
const {
  deriveSigleEcole,
  deriveSigleFiliere,
  formatMatricule,
} = require('../utils/matricule.helper');

const STATUTS = ['EN_COURS', 'VALIDE', 'REDOUBLANT', 'ABANDONNE'];

const INSCRIPTION_INCLUDE = {
  candidat: {
    select: { id: true, nom: true, prenom: true, email: true, matricule: true },
  },
  filiere: true,
  etablissement: true,
};

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

    const etablissement = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      select: { id: true, type: true },
    });
    if (!etablissement) {
      return res.status(404).json({ error: 'Etablissement non trouve' });
    }
    if (etablissement.type !== 'PRIVE') {
      return res.status(400).json({ error: 'L\'inscription academique est reservee aux etablissements prives' });
    }

    const filiere = await prisma.filiere.findUnique({
      where: { id: filiereId },
      select: { id: true, etablissementId: true },
    });
    if (!filiere || filiere.etablissementId !== etablissementId) {
      return res.status(404).json({ error: 'Filiere non trouvee pour cet etablissement' });
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
      },
      orderBy: [{ anneeAcademique: 'asc' }, { niveau: 'asc' }],
    });

    return res.json({ inscriptions });
  } catch (error) {
    console.error('Erreur getMesInscriptions:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.soumettreQuittance = async (req, res) => {
  try {
    const candidatId = req.user?.id;
    const { id } = req.params;

    if (!candidatId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const existing = await prisma.inscriptionAcademique.findUnique({
      where: { id },
      include: INSCRIPTION_INCLUDE,
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inscription academique non trouvee' });
    }
    if (existing.candidatId !== candidatId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    if (!['EN_COURS', 'EN_ATTENTE_QUITTANCE'].includes(existing.statut)) {
      return res.status(400).json({ error: 'La quittance ne peut etre soumise que pour une inscription en cours ou en attente de quittance' });
    }

    const ext = req.file.originalname.split('.').pop();
    const storagePath = `${candidatId}/inscriptions-acad/${id}/quittance-${Date.now()}.${ext}`;
    const quittanceBancaire = await uploadBufferToSupabase(req.file.buffer, storagePath, req.file.mimetype);

    const inscription = await prisma.inscriptionAcademique.update({
      where: { id },
      data: {
        quittanceBancaire,
        quittanceSoumiseLe: new Date(),
        statut: 'QUITTANCE_SOUMISE',
      },
      include: INSCRIPTION_INCLUDE,
    });

    await notifierAdminsEtablissement(
      inscription.etablissementId,
      inscription.etablissement.email,
      (admin) => emailService.envoyerEmailAdminQuittanceSoumise({
        adminId: admin.id,
        adminEmail: admin.email,
        candidatNom: inscription.candidat.nom,
        candidatPrenom: inscription.candidat.prenom,
        etablissementNom: inscription.etablissement.nom,
        filiereNom: inscription.filiere.nom,
      }),
    );

    return res.json({
      message: 'Quittance soumise avec succes',
      inscription,
    });
  } catch (error) {
    console.error('Erreur soumettreQuittance:', error);
    if (error.message?.includes('Type de fichier')) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.validerQuittance = async (req, res) => {
  try {
    const etablissementId = getAdminEtablissementId(req);
    const { id } = req.params;

    if (!etablissementId) {
      return res.status(403).json({ error: 'Acces reserve aux administrateurs d\'etablissement' });
    }

    const inscription = await prisma.$transaction(async (tx) => {
      const existing = await tx.inscriptionAcademique.findUnique({
        where: { id },
        include: {
          candidat: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
          filiere: {
            select: { id: true, sigle: true, code: true, nom: true, matriculeCompteur: true },
          },
          etablissement: {
            select: { id: true, nom: true, matriculeFormat: true },
          },
        },
      });

      if (!existing) {
        const err = new Error('NOT_FOUND');
        err.code = 'NOT_FOUND';
        throw err;
      }
      if (existing.etablissementId !== etablissementId) {
        const err = new Error('FORBIDDEN');
        err.code = 'FORBIDDEN';
        throw err;
      }
      if (existing.statut !== 'QUITTANCE_SOUMISE') {
        const err = new Error('INVALID_STATUS');
        err.code = 'INVALID_STATUS';
        throw err;
      }

      const filiereMaj = await tx.filiere.update({
        where: { id: existing.filiereId },
        data: { matriculeCompteur: { increment: 1 } },
        select: { sigle: true, code: true, nom: true, matriculeCompteur: true },
      });

      const sigleEcole = deriveSigleEcole(existing.etablissement, filiereMaj);
      const sigleFiliere = deriveSigleFiliere(filiereMaj);
      const matricule = formatMatricule(existing.etablissement.matriculeFormat, {
        sigleEcole,
        sigleFiliere,
        anneeAcademique: existing.anneeAcademique,
        seq: filiereMaj.matriculeCompteur,
      });

      return tx.inscriptionAcademique.update({
        where: { id },
        data: {
          matricule,
          quittanceValideeLe: new Date(),
          statut: 'VALIDE',
        },
        include: INSCRIPTION_INCLUDE,
      });
    });

    try {
      await emailService.envoyerEmailMatriculeEtudiantValide({
        userId: inscription.candidat.id,
        candidatId: inscription.candidat.id,
        candidatEmail: inscription.candidat.email,
        candidatNom: inscription.candidat.nom,
        candidatPrenom: inscription.candidat.prenom,
        matricule: inscription.matricule,
        etablissementNom: inscription.etablissement.nom,
        filiereNom: inscription.filiere.nom,
      });
    } catch (emailErr) {
      console.error('Erreur envoi email matricule:', emailErr);
    }

    return res.json({
      message: 'Inscription validee',
      inscription,
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Inscription academique non trouvee' });
    }
    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    if (error.code === 'INVALID_STATUS') {
      return res.status(400).json({ error: 'Seule une quittance soumise peut etre validee' });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Conflit de matricule, veuillez reessayer' });
    }
    console.error('Erreur validerQuittance:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.rejeterQuittance = async (req, res) => {
  try {
    const etablissementId = getAdminEtablissementId(req);
    const { id } = req.params;
    const { motif } = req.body;

    if (!etablissementId) {
      return res.status(403).json({ error: 'Acces reserve aux administrateurs d\'etablissement' });
    }
    if (!motif || !String(motif).trim()) {
      return res.status(400).json({ error: 'Le motif de rejet est obligatoire' });
    }

    const existing = await prisma.inscriptionAcademique.findUnique({
      where: { id },
      include: {
        candidat: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        filiere: { select: { nom: true } },
        etablissement: { select: { nom: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inscription academique non trouvee' });
    }
    if (existing.etablissementId !== etablissementId) {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    if (existing.statut !== 'QUITTANCE_SOUMISE') {
      return res.status(400).json({ error: 'Seule une quittance soumise peut etre rejetee' });
    }

    const inscription = await prisma.inscriptionAcademique.update({
      where: { id },
      data: { statut: 'EN_ATTENTE_QUITTANCE' },
      include: INSCRIPTION_INCLUDE,
    });

    try {
      await emailService.envoyerEmailQuittanceRejetee({
        userId: inscription.candidat.id,
        candidatId: inscription.candidat.id,
        candidatEmail: inscription.candidat.email,
        candidatNom: inscription.candidat.nom,
        candidatPrenom: inscription.candidat.prenom,
        motif: String(motif).trim(),
      });
    } catch (emailErr) {
      console.error('Erreur envoi email quittance rejetee:', emailErr);
    }

    return res.json({
      message: 'Quittance rejetee',
      inscription,
    });
  } catch (error) {
    console.error('Erreur rejeterQuittance:', error);
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
      select: { id: true, etablissementId: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inscription academique non trouvee' });
    }

    const adminEtabId = getAdminEtablissementId(req);
    if (!adminEtabId || adminEtabId !== existing.etablissementId) {
      return res.status(403).json({ error: 'Accès non autorisé à cette inscription' });
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

