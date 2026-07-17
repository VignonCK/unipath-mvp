const crypto = require('crypto');
const prisma = require('../prisma');
const authService = require('../services/auth.service');
const emailService = require('../services/email.service');
const logger = require('../config/logger');
const { buildFrontendUrl } = require('../utils/url.helper');

function genererMotDePasseTemporaire() {
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}

function validerDonneesAdmin(body) {
  const { nom, prenom, email } = body;
  if (!nom?.trim() || !prenom?.trim() || !email?.trim()) {
    return 'nom, prenom et email sont obligatoires';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Adresse email invalide';
  }
  return null;
}

exports.creerAdmin = async (req, res) => {
  try {
    const { etablissementId } = req.params;
    const erreur = validerDonneesAdmin(req.body);
    if (erreur) {
      return res.status(400).json({ error: erreur });
    }

    const { nom, prenom, email, telephone } = req.body;
    const emailNormalise = email.trim().toLowerCase();

    const etablissement = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      select: { id: true, nom: true, type: true },
    });
    if (!etablissement) {
      return res.status(404).json({ error: 'Établissement non trouvé' });
    }

    if (etablissement.type !== 'PRIVE') {
      return res.status(400).json({
        error: "Un administrateur d'établissement ne peut être attaché qu'à un établissement privé.",
      });
    }

    const emailExistant = await prisma.adminEtablissement.findUnique({
      where: { email: emailNormalise },
    });
    if (emailExistant) {
      return res.status(400).json({ error: 'Un administrateur avec cet email existe déjà' });
    }

    const motDePasseTemporaire = genererMotDePasseTemporaire();
    const adminId = crypto.randomUUID();

    const admin = await prisma.adminEtablissement.create({
      data: {
        id: adminId,
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: emailNormalise,
        telephone: telephone?.trim() || null,
        role: 'ADMIN_ETABLISSEMENT',
        etablissementId,
      },
      include: {
        etablissement: { select: { id: true, nom: true, ville: true } },
      },
    });

    await authService.createCompte({
      email: emailNormalise,
      password: motDePasseTemporaire,
      profilType: 'ADMIN_ETABLISSEMENT',
      profilId: adminId,
      emailConfirme: true,
    });

    const loginUrl = buildFrontendUrl('/login');
    try {
      await emailService.createEmail({
        userId: admin.id,
        recipient: emailNormalise,
        subject: `UniPath — Accès administrateur ${etablissement.nom}`,
        emailType: 'ADMIN_ETABLISSEMENT_CREDENTIALS',
        htmlBody: `
          <h2>Bienvenue sur UniPath</h2>
          <p>Bonjour ${admin.prenom} ${admin.nom},</p>
          <p>Un compte administrateur a été créé pour l'établissement <strong>${etablissement.nom}</strong>.</p>
          <p><strong>Email :</strong> ${emailNormalise}</p>
          <p><strong>Mot de passe temporaire :</strong> ${motDePasseTemporaire}</p>
          <p>Connectez-vous sur <a href="${loginUrl}">${loginUrl}</a> et changez votre mot de passe dès la première connexion.</p>
        `,
        textBody: `Bonjour ${admin.prenom} ${admin.nom}, votre compte admin UniPath pour ${etablissement.nom} : email ${emailNormalise}, mot de passe temporaire ${motDePasseTemporaire}. Connexion : ${loginUrl}`,
      });
    } catch (emailErr) {
      logger.error('[AdminEtablissement] Email credentials non envoyé', {
        adminId: admin.id,
        error: emailErr.message,
      });
    }

    logger.info('[AdminEtablissement] Admin créé', {
      adminId: admin.id,
      etablissementId,
      event: 'ADMIN_ETABLISSEMENT_CREATED',
    });

    return res.status(201).json({
      message: 'Administrateur créé avec succès. Un email avec les identifiants a été envoyé.',
      admin: {
        id: admin.id,
        nom: admin.nom,
        prenom: admin.prenom,
        email: admin.email,
        telephone: admin.telephone,
        etablissement: admin.etablissement,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    logger.error('[AdminEtablissement] Erreur creerAdmin', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur lors de la création de l\'administrateur' });
  }
};

exports.listerAdmins = async (req, res) => {
  try {
    const { etablissementId } = req.params;

    const etablissement = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      select: { id: true },
    });
    if (!etablissement) {
      return res.status(404).json({ error: 'Établissement non trouvé' });
    }

    const admins = await prisma.adminEtablissement.findMany({
      where: { etablissementId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      message: 'Administrateurs récupérés avec succès',
      etablissementId,
      admins,
    });
  } catch (error) {
    logger.error('[AdminEtablissement] Erreur listerAdmins', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.supprimerAdmin = async (req, res) => {
  try {
    const { etablissementId, adminId } = req.params;

    const admin = await prisma.adminEtablissement.findFirst({
      where: { id: adminId, etablissementId },
    });
    if (!admin) {
      return res.status(404).json({ error: 'Administrateur non trouvé pour cet établissement' });
    }

    await prisma.adminEtablissement.delete({ where: { id: adminId } });
    await authService.deleteCompte(adminId);

    logger.info('[AdminEtablissement] Admin supprimé', {
      adminId,
      etablissementId,
      event: 'ADMIN_ETABLISSEMENT_DELETED',
    });

    return res.json({ message: 'Administrateur supprimé avec succès' });
  } catch (error) {
    logger.error('[AdminEtablissement] Erreur supprimerAdmin', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
