const crypto = require('crypto');
const prisma = require('../prisma');
const { supabaseAdmin } = require('../supabase');
const emailService = require('../services/email.service');
const logger = require('../config/logger');
const { buildFrontendUrl } = require('../utils/url.helper');
const {
  buildAdminEtablissementMetadata,
  TEMP_PASSWORD_VALIDITY_HOURS,
} = require('../utils/admin-password.helper');
const {
  SOUS_ROLES_ETABLISSEMENT,
  assertStaffScope,
  getStaffSousRole,
  canCreateStaffSousRole,
  canDeleteStaffMember,
} = require('../utils/admin-etablissement.helper');

function genererMotDePasseTemporaire() {
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}

function validerDonneesStaff(body) {
  const { nom, prenom, email, sousRole } = body;
  if (!nom?.trim() || !prenom?.trim() || !email?.trim() || !sousRole) {
    return 'nom, prenom, email et sousRole sont obligatoires';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Adresse email invalide';
  }
  if (![SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR, SOUS_ROLES_ETABLISSEMENT.CONTROLEUR].includes(sousRole)) {
    return 'sousRole doit être SUPERVISEUR ou CONTROLEUR';
  }
  return null;
}

function labelSousRole(sousRole) {
  if (sousRole === SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR) return 'Superviseur';
  if (sousRole === SOUS_ROLES_ETABLISSEMENT.CONTROLEUR) return 'Contrôleur';
  return 'Administrateur';
}

exports.listerStaff = async (req, res) => {
  try {
    const etablissementId = assertStaffScope(req);
    const actorSousRole = getStaffSousRole(req);

    if (![SOUS_ROLES_ETABLISSEMENT.ADMIN, SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR].includes(actorSousRole)) {
      return res.status(403).json({ error: 'Accès refusé à la liste du personnel' });
    }

    const staff = await prisma.adminEtablissement.findMany({
      where: { etablissementId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        sousRole: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ sousRole: 'asc' }, { createdAt: 'desc' }],
    });

    return res.json({
      message: 'Personnel récupéré avec succès',
      etablissementId,
      staff,
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ error: error.message });
    }
    logger.error('[StaffEtablissement] Erreur listerStaff', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.creerStaff = async (req, res) => {
  let createdAuthUserId = null;
  try {
    // Scope TOUJOURS depuis le token/DB — jamais depuis le body
    const etablissementId = assertStaffScope(req);
    const actorSousRole = getStaffSousRole(req);

    const erreur = validerDonneesStaff(req.body);
    if (erreur) {
      return res.status(400).json({ error: erreur });
    }

    const { nom, prenom, email, telephone, sousRole } = req.body;
    // Ignore tout etablissementId forgé dans le body
    if (req.body.etablissementId && req.body.etablissementId !== etablissementId) {
      return res.status(403).json({
        error: 'Impossible de créer un compte pour un autre établissement',
      });
    }

    if (!canCreateStaffSousRole(actorSousRole, sousRole)) {
      return res.status(403).json({
        error: actorSousRole === SOUS_ROLES_ETABLISSEMENT.SUPERVISEUR
          ? 'Un superviseur ne peut créer que des comptes CONTROLEUR'
          : 'Vous n\'êtes pas autorisé à créer ce type de compte',
      });
    }

    const emailNormalise = email.trim().toLowerCase();
    const etablissement = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      select: { id: true, nom: true, type: true },
    });
    if (!etablissement || etablissement.type !== 'PRIVE') {
      return res.status(400).json({ error: 'Établissement privé introuvable' });
    }

    const emailExistant = await prisma.adminEtablissement.findUnique({
      where: { email: emailNormalise },
    });
    if (emailExistant) {
      return res.status(400).json({ error: 'Un compte avec cet email existe déjà' });
    }

    const motDePasseTemporaire = genererMotDePasseTemporaire();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailNormalise,
      password: motDePasseTemporaire,
      email_confirm: true,
      user_metadata: buildAdminEtablissementMetadata(etablissementId, sousRole),
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }
    createdAuthUserId = authData.user.id;

    const member = await prisma.adminEtablissement.create({
      data: {
        id: authData.user.id,
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: emailNormalise,
        telephone: telephone?.trim() || null,
        role: 'ADMIN_ETABLISSEMENT',
        sousRole,
        etablissementId,
      },
      include: {
        etablissement: { select: { id: true, nom: true, ville: true } },
      },
    });

    const loginUrl = buildFrontendUrl('/login');
    const roleLabel = labelSousRole(sousRole);
    try {
      await emailService.createEmail({
        userId: member.id,
        recipient: emailNormalise,
        subject: `UniPath — Accès ${roleLabel} ${etablissement.nom}`,
        emailType: 'ADMIN_ETABLISSEMENT_CREDENTIALS',
        htmlBody: `
          <h2>Bienvenue sur UniPath</h2>
          <p>Bonjour ${member.prenom} ${member.nom},</p>
          <p>Un compte <strong>${roleLabel}</strong> a été créé pour <strong>${etablissement.nom}</strong>.</p>
          <p><strong>Email :</strong> ${emailNormalise}</p>
          <p><strong>Mot de passe temporaire :</strong> ${motDePasseTemporaire}</p>
          <p><strong>Validité :</strong> ${TEMP_PASSWORD_VALIDITY_HOURS} heures.</p>
          <p>Connexion : <a href="${loginUrl}">${loginUrl}</a></p>
        `,
        textBody: `Compte ${roleLabel} UniPath pour ${etablissement.nom} : ${emailNormalise} / ${motDePasseTemporaire}`,
      });
    } catch (emailErr) {
      logger.error('[StaffEtablissement] Email non envoyé', { error: emailErr.message });
    }

    logger.info('[StaffEtablissement] Staff créé', {
      staffId: member.id,
      sousRole,
      etablissementId,
      createdBy: req.user.id,
      event: 'STAFF_ETABLISSEMENT_CREATED',
    });

    return res.status(201).json({
      message: `${roleLabel} créé avec succès`,
      staff: {
        id: member.id,
        nom: member.nom,
        prenom: member.prenom,
        email: member.email,
        telephone: member.telephone,
        sousRole: member.sousRole,
        etablissement: member.etablissement,
        createdAt: member.createdAt,
      },
      // Exposé uniquement en réponse API pour faciliter les tests locaux
      temporaryPassword: process.env.NODE_ENV === 'production' ? undefined : motDePasseTemporaire,
    });
  } catch (error) {
    if (createdAuthUserId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      } catch (_) { /* ignore */ }
    }
    if (error.status === 403) {
      return res.status(403).json({ error: error.message });
    }
    logger.error('[StaffEtablissement] Erreur creerStaff', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur lors de la création du compte' });
  }
};

exports.supprimerStaff = async (req, res) => {
  try {
    const etablissementId = assertStaffScope(req);
    const actorSousRole = getStaffSousRole(req);
    const { staffId } = req.params;

    const target = await prisma.adminEtablissement.findFirst({
      where: { id: staffId, etablissementId },
    });
    if (!target) {
      return res.status(404).json({ error: 'Compte introuvable pour cet établissement' });
    }
    if (target.id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    if (!canDeleteStaffMember(actorSousRole, target.sousRole)) {
      return res.status(403).json({
        error: 'Vous n\'êtes pas autorisé à supprimer ce compte',
      });
    }

    await prisma.adminEtablissement.delete({ where: { id: staffId } });
    try {
      await supabaseAdmin.auth.admin.deleteUser(staffId);
    } catch (supabaseErr) {
      logger.error('[StaffEtablissement] Suppression Auth échouée', {
        staffId,
        error: supabaseErr.message,
      });
    }

    return res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ error: error.message });
    }
    logger.error('[StaffEtablissement] Erreur supprimerStaff', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
