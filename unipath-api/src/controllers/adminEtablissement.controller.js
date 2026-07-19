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

    const existingCompte = await authService.findCompteByEmail(emailNormalise);
    if (existingCompte) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
    }

    const emailExistant = await prisma.adminEtablissement.findUnique({
      where: { email: emailNormalise },
      select: { id: true },
    });
    if (emailExistant) {
      return res.status(409).json({ error: 'Un administrateur avec cet email existe déjà.' });
    }

    const motDePasseTemporaire = genererMotDePasseTemporaire();
    const adminId = crypto.randomUUID();

    let admin;
    try {
      admin = await prisma.adminEtablissement.create({
        data: {
          id: adminId,
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: emailNormalise,
          telephone: telephone?.trim() || null,
          role: 'ADMIN_ETABLISSEMENT',
          etablissementId,
          motDePasseTemporaire,
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
        mustChangePassword: true,
      });
    } catch (createError) {
      await prisma.adminEtablissement.delete({ where: { id: adminId } }).catch(() => {});
      await authService.deleteCompte(adminId);
      throw createError;
    }

    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'SYSTEME',
        title: 'Bienvenue — Administrateur établissement',
        message:
          `Bonjour ${admin.prenom} ${admin.nom}, votre compte administrateur pour `
          + `« ${etablissement.nom} » a été créé. Changez votre mot de passe à la première connexion.`,
        priority: 'NORMAL',
      },
    }).catch((err) => logger.error('[AdminEtablissement] Notification bienvenue', { error: err.message }));

    const loginUrl = buildFrontendUrl('/login');
    let emailEnvoye = true;
    try {
      await emailService.envoyerEmailIdentifiantsAdminEtablissement({
        email: admin.email,
        nom: admin.nom,
        prenom: admin.prenom,
        motDePasse: motDePasseTemporaire,
        loginUrl,
        etablissementNom: etablissement.nom,
        userId: admin.id,
      });
    } catch (emailErr) {
      emailEnvoye = false;
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
      message: emailEnvoye
        ? `Administrateur créé avec succès. Un email avec les identifiants a été envoyé à ${admin.email}.`
        : `Administrateur créé. Mot de passe temporaire : ${motDePasseTemporaire}. L'email n'a pas pu être envoyé — communiquez-le à l'administrateur.`,
      emailEnvoye,
      admin: {
        id: admin.id,
        nom: admin.nom,
        prenom: admin.prenom,
        email: admin.email,
        telephone: admin.telephone,
        motDePasseTemporaire,
        demandeResetMotDePasse: false,
        demandeResetMotDePasseAt: null,
        etablissement: admin.etablissement,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    logger.error('[AdminEtablissement] Erreur creerAdmin', { error: error.message });
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }
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
        motDePasseTemporaire: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const comptes = await prisma.compte.findMany({
      where: {
        profilType: 'ADMIN_ETABLISSEMENT',
        profilId: { in: admins.map((a) => a.id) },
      },
      select: {
        profilId: true,
        demandeResetMotDePasseAt: true,
      },
    });
    const demandeByProfil = Object.fromEntries(
      comptes.map((c) => [c.profilId, c.demandeResetMotDePasseAt])
    );

    const mapped = admins.map((a) => ({
      ...a,
      motDePasseTemporaire: a.motDePasseTemporaire || null,
      demandeResetMotDePasse: !!demandeByProfil[a.id],
      demandeResetMotDePasseAt: demandeByProfil[a.id] || null,
    }));

    mapped.sort((a, b) => {
      if (a.demandeResetMotDePasse === b.demandeResetMotDePasse) {
        return 0;
      }
      return a.demandeResetMotDePasse ? -1 : 1;
    });

    return res.json({
      message: 'Administrateurs récupérés avec succès',
      etablissementId,
      admins: mapped,
    });
  } catch (error) {
    logger.error('[AdminEtablissement] Erreur listerAdmins', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Réinitialise le mot de passe d'un admin (mot de passe temporaire stable).
 * POST /dges/etablissements/:etablissementId/admins/:adminId/reinitialiser-mot-de-passe
 */
exports.reinitialiserMotDePasseAdmin = async (req, res) => {
  try {
    const { etablissementId, adminId } = req.params;

    const admin = await prisma.adminEtablissement.findFirst({
      where: { id: adminId, etablissementId },
      include: {
        etablissement: { select: { id: true, nom: true } },
      },
    });
    if (!admin) {
      return res.status(404).json({ error: 'Administrateur non trouvé pour cet établissement' });
    }

    const compte = await prisma.compte.findUnique({
      where: { profilId: adminId },
    });
    if (!compte) {
      return res.status(404).json({ error: 'Compte de connexion introuvable pour cet administrateur.' });
    }

    const motDePasse = admin.motDePasseTemporaire || genererMotDePasseTemporaire();
    const passwordHash = await authService.hashPassword(motDePasse);

    await prisma.$transaction([
      prisma.compte.update({
        where: { id: compte.id },
        data: {
          passwordHash,
          mustChangePassword: true,
          demandeResetMotDePasseAt: null,
          resetToken: null,
          resetExpires: null,
        },
      }),
      prisma.adminEtablissement.update({
        where: { id: adminId },
        data: { motDePasseTemporaire: motDePasse },
      }),
    ]);

    const loginUrl = buildFrontendUrl('/login');

    try {
      await emailService.envoyerEmailMotDePasseTemporaireAdminEtablissement({
        email: admin.email,
        nom: admin.nom,
        prenom: admin.prenom,
        motDePasse,
        loginUrl,
        etablissementNom: admin.etablissement?.nom,
        userId: admin.id,
      });
    } catch (emailErr) {
      logger.error('[AdminEtablissement] Email mot de passe temporaire non envoyé', {
        adminId,
        error: emailErr.message,
      });
      return res.json({
        message:
          `Mot de passe réinitialisé (${motDePasse}). `
          + `L'email n'a pas pu être envoyé (${emailErr.code || emailErr.message}). `
          + 'Communiquez ce mot de passe à l\'administrateur ou réessayez l\'envoi.',
        emailEnvoye: false,
        admin: {
          id: admin.id,
          email: admin.email,
          motDePasseTemporaire: motDePasse,
          demandeResetMotDePasse: false,
        },
      });
    }

    return res.json({
      message: `Mot de passe réinitialisé (${motDePasse}). Un email a été envoyé à ${admin.email}.`,
      emailEnvoye: true,
      admin: {
        id: admin.id,
        email: admin.email,
        motDePasseTemporaire: motDePasse,
        demandeResetMotDePasse: false,
      },
    });
  } catch (error) {
    logger.error('[AdminEtablissement] Erreur reinitialiserMotDePasseAdmin', { error: error.message });
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
