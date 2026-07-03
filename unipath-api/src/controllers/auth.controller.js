// src/controllers/auth.controller.js
const crypto = require('crypto');
const { supabase, supabaseAdmin } = require('../supabase');
const prisma = require('../prisma');
const emailService = require('../services/email.service');
const { getFrontendUrl, buildFrontendUrl } = require('../utils/url.helper');
const { genererMatriculeUnique } = require('../utils/matricule.helper');
const { SERIES_VALIDES } = require('../constants/pieces.constants');
const { alignCandidatIdToAuth } = require('../utils/candidat-alignment.helper');
const {
  isTempPasswordExpired,
  mustChangeAdminPassword,
  mustChangeTempPassword,
} = require('../utils/admin-password.helper');

const EMAIL_CONFIRM_TTL_MS = 24 * 60 * 60 * 1000;

function generateEmailConfirmCredentials() {
  return {
    emailConfirmToken: crypto.randomBytes(32).toString('hex'),
    emailConfirmExpires: new Date(Date.now() + EMAIL_CONFIRM_TTL_MS),
  };
}

exports.register = async (req, res) => {
  try {
    const { 
      email, password, nom, prenom, anip, serie,
      sexe, nationalite, telephone, dateNaiss, lieuNaiss 
    } = req.body;

    // Validation ANIP (obligatoire - Numéro Personnel d'Identification à 12 chiffres)
    if (!anip) {
      return res.status(400).json({ 
        error: 'L\'identifiant ANIP est obligatoire pour l\'inscription' 
      });
    }
    
    // Format ANIP : exactement 12 chiffres
    if (!/^\d{12}$/.test(anip)) {
      return res.status(400).json({ 
        error: 'Format ANIP invalide. L\'ANIP doit contenir exactement 12 chiffres' 
      });
    }

    // Vérifier si l'ANIP est déjà utilisé
    const anipExistant = await prisma.candidat.findFirst({
      where: { anip }
    });
    
    if (anipExistant) {
      return res.status(400).json({ 
        error: 'Cet identifiant ANIP est déjà enregistré dans le système' 
      });
    }

    // Validation série
    if (serie && !SERIES_VALIDES.includes(serie)) {
      return res.status(400).json({ 
        error: 'Série invalide. Séries acceptées : A, B, C, D, E, F1, F2, F3, F4, G1, G2, G3' 
      });
    }

    // Compte Supabase sans confirmation email Supabase (voir APP_URL + dashboard Supabase)
    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nom,
            prenom,
            anip,
          },
        },
      });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Générer un matricule unique
    const matricule = await genererMatriculeUnique();
    console.log(`📋 Matricule généré pour ${prenom} ${nom}: ${matricule}`);

    const { emailConfirmToken, emailConfirmExpires } = generateEmailConfirmCredentials();

    // Créer le candidat dans la base de données
    const candidat = await prisma.candidat.create({
      data: {
        id: authData.user.id,
        email,
        nom,
        prenom,
        anip,
        serie: serie || null,
        sexe: sexe || null,
        nationalite: nationalite || null,
        telephone,
        dateNaiss: dateNaiss ? new Date(dateNaiss) : null,
        lieuNaiss: lieuNaiss || null,
        matricule, // ✅ Matricule au format UAC-2026-00001
        emailConfirme: false,
        emailConfirmToken,
        emailConfirmExpires,
        role: 'ETUDIANT',
      },
    });

    // Créer une notification de bienvenue
    await prisma.notification.create({
      data: {
        userId: candidat.id,
        type: 'SYSTEME',
        title: 'Bienvenue sur UniPath',
        message: `Bonjour ${candidat.prenom} ${candidat.nom}, votre compte a été créé avec succès. Veuillez confirmer votre email pour accéder à toutes les fonctionnalités.`,
        priority: 'HIGH',
        data: {
          matricule: candidat.matricule,
          emailConfirmationRequired: true
        }
      }
    });

    // Envoyer l'email de confirmation avec gestion d'erreur améliorée
    try {
      console.log(`📧 Envoi email de confirmation à ${candidat.email}`);

      const emailResult = await emailService.envoyerEmailConfirmation({
        email: candidat.email,
        nom: candidat.nom,
        prenom: candidat.prenom,
        confirmationToken: emailConfirmToken,
      });

      // Enregistrer la tentative d'envoi
      await prisma.emailDelivery.create({
        data: {
          userId: candidat.id,
          recipient: candidat.email,
          subject: '[UniPath] Confirmez votre adresse email',
          status: emailResult.success ? 'SENT' : 'FAILED',
          attempts: 1,
          lastAttemptAt: new Date(),
          sentAt: emailResult.success ? new Date() : null,
          errorMessage: emailResult.error || null
        }
      });
    } catch (emailError) {
      console.error('❌ Erreur envoi email de confirmation:', emailError);
      
      // Enregistrer l'échec
      await prisma.emailDelivery.create({
        data: {
          userId: candidat.id,
          recipient: candidat.email,
          subject: '[UniPath] Confirmez votre adresse email',
          status: 'FAILED',
          attempts: 1,
          lastAttemptAt: new Date(),
          errorMessage: emailError.message
        }
      });
    }

    res.status(201).json({
      message: 'Compte créé avec succès. Un email de confirmation a été envoyé à votre adresse.',
      matricule: candidat.matricule,
      emailConfirmationRequired: true,
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du compte' });
  }
};

exports.registerEtablissement = async (req, res) => {
  return res.status(410).json({
    error: 'L\'inscription établissement n\'est plus disponible. Contactez la DGES pour obtenir un compte administrateur.',
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Récupérer le rôle de l'utilisateur
    const userId = data.user.id;
    let role = null;
    let userData = null;

    // Chercher dans Candidat
    let candidat = await prisma.candidat.findUnique({
      where: { id: userId },
      select: { 
        role: true, 
        nom: true, 
        prenom: true, 
        matricule: true,
        email: true,
        emailConfirme: true
      },
    });

    if (!candidat && data.user.email) {
      await alignCandidatIdToAuth(userId, data.user.email);
      candidat = await prisma.candidat.findUnique({
        where: { id: userId },
        select: {
          role: true,
          nom: true,
          prenom: true,
          matricule: true,
          email: true,
          emailConfirme: true,
        },
      });
    }

    if (candidat) {
      role = candidat.role;
      
      // Vérifier si l'email est confirmé
      if (!candidat.emailConfirme) {
        return res.status(403).json({ 
          error: 'Veuillez confirmer votre email avant de vous connecter',
          emailConfirmationRequired: true,
          userId: candidat.id,
          email: candidat.email
        });
      }
      
      // Ne pas exposer emailConfirme dans la réponse
      const { emailConfirme, ...candidatData } = candidat;
      userData = candidatData;
    }

    // Chercher dans MembreCommission
    let sousRole = null;
    if (!role) {
      const commission = await prisma.membreCommission.findUnique({
        where: { id: userId },
        select: { role: true, sousRole: true, nom: true, prenom: true },
      });

      if (commission) {
        role = commission.role;
        sousRole = commission.sousRole;
        userData = commission;
      }
    }

    // Chercher dans AdministrateurDGES
    if (!role) {
      const dges = await prisma.administrateurDGES.findUnique({
        where: { id: userId },
        select: { role: true, nom: true, prenom: true },
      });

      if (dges) {
        role = dges.role;
        userData = dges;
      }
    }

    // Chercher dans Controleur
    if (!role) {
      const controleur = await prisma.controleur.findUnique({
        where: { id: userId },
        select: { role: true, nom: true, prenom: true },
      });

      if (controleur) {
        role = controleur.role;
        userData = controleur;
      }
    }

    if (!role && prisma.adminEtablissement) {
      const adminEtablissement = await prisma.adminEtablissement.findUnique({
        where: { id: userId },
        select: {
          role: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          etablissementId: true,
        },
      });

      if (adminEtablissement) {
        role = adminEtablissement.role;
        userData = adminEtablissement;
      }
    }

    // Compte Supabase sans profil DB (inscription interrompue) — tentative de réparation
    if (!role) {
      const meta = data.user.user_metadata || {};
      const nom = meta.nom;
      const prenom = meta.prenom;
      const anip = meta.anip || null;

      if (nom && prenom && data.user.email) {
        try {
          const matricule = await genererMatriculeUnique();
          const repaired = await prisma.candidat.create({
            data: {
              id: userId,
              email: data.user.email,
              nom,
              prenom,
              anip,
              matricule,
              emailConfirme: !!data.user.email_confirmed_at,
              role: 'ETUDIANT',
            },
            select: {
              role: true,
              nom: true,
              prenom: true,
              matricule: true,
              email: true,
            },
          });
          role = repaired.role;
          userData = repaired;
          console.log(`🔧 Profil Candidat réparé à la connexion pour ${data.user.email}`);
        } catch (repairError) {
          console.error('❌ Échec réparation profil à la connexion:', repairError.message);
        }
      }
    }

    if (!role) {
      return res.status(403).json({
        error:
          'Votre compte existe mais votre profil UniPath est incomplet. Réinscrivez-vous ou contactez le support.',
        profileIncomplete: true,
      });
    }

    const userMetadata = data.user.user_metadata || {};
    let requiresPasswordChange = false;

    if ((role === 'ADMIN_ETABLISSEMENT' || role === 'COMMISSION') && mustChangeTempPassword(userMetadata)) {
      if (isTempPasswordExpired(userMetadata)) {
        return res.status(403).json({
          error:
            role === 'COMMISSION'
              ? 'Votre mot de passe temporaire a expiré. Contactez la DGES pour qu\'un nouvel accès vous soit envoyé.'
              : 'Votre mot de passe temporaire a expiré. Contactez la DGES pour qu\'un nouvel accès vous soit envoyé.',
          tempPasswordExpired: true,
        });
      }
      requiresPasswordChange = true;
    }

    res.json({
      token: data.session.access_token,
      mustChangePassword: requiresPasswordChange,
      user: {
        id: userId,
        email: data.user.email,
        ...userData,
        role,
        ...(sousRole && { sousRole }),
        mustChangePassword: requiresPasswordChange,
      },
    });
  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.changeInitialPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent du mot de passe temporaire' });
    }

    if (!['ADMIN_ETABLISSEMENT', 'COMMISSION'].includes(req.userRole)) {
      return res.status(403).json({ error: 'Cette action est réservée aux comptes avec mot de passe temporaire DGES' });
    }

    let profile = null;

    if (req.userRole === 'ADMIN_ETABLISSEMENT') {
      profile = await prisma.adminEtablissement.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          etablissementId: true,
          role: true,
        },
      });
      if (!profile) {
        return res.status(404).json({ error: 'Profil administrateur introuvable' });
      }
    } else {
      profile = await prisma.membreCommission.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          etablissementId: true,
          role: true,
          sousRole: true,
        },
      });
      if (!profile) {
        return res.status(404).json({ error: 'Profil commission introuvable' });
      }
    }

    const { data: authUserData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getUserError || !authUserData?.user) {
      return res.status(500).json({ error: 'Impossible de vérifier le compte utilisateur' });
    }

    const metadata = authUserData.user.user_metadata || {};
    if (!mustChangeTempPassword(metadata)) {
      return res.status(400).json({ error: 'Aucun changement de mot de passe initial requis pour ce compte' });
    }

    if (isTempPasswordExpired(metadata)) {
      return res.status(403).json({
        error: 'Votre mot de passe temporaire a expiré. Contactez la DGES pour un nouvel accès.',
        tempPasswordExpired: true,
      });
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (verifyError) {
      return res.status(401).json({ error: 'Mot de passe temporaire incorrect' });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
      user_metadata: {
        ...metadata,
        mustChangePassword: false,
        tempPasswordExpiresAt: null,
      },
    });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password: newPassword,
    });

    if (sessionError || !sessionData?.session) {
      return res.status(500).json({ error: 'Mot de passe mis à jour mais reconnexion impossible. Reconnectez-vous.' });
    }

    return res.json({
      message: 'Mot de passe personnel enregistré avec succès',
      token: sessionData.session.access_token,
      mustChangePassword: false,
      user: {
        ...profile,
        email,
        role: profile.role,
        ...(profile.sousRole && { sousRole: profile.sousRole }),
        mustChangePassword: false,
      },
    });
  } catch (error) {
    console.error('❌ Erreur changeInitialPassword:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l\'actuel' });
    }

    if (req.userRole !== 'ADMIN_ETABLISSEMENT') {
      return res.status(403).json({ error: 'Cette action est réservée aux administrateurs d\'établissement' });
    }

    const admin = await prisma.adminEtablissement.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        etablissementId: true,
        role: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Profil administrateur introuvable' });
    }

    const { data: authUserData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getUserError || !authUserData?.user) {
      return res.status(500).json({ error: 'Impossible de vérifier le compte utilisateur' });
    }

    const metadata = authUserData.user.user_metadata || {};
    if (mustChangeAdminPassword(metadata)) {
      return res.status(400).json({
        error: 'Vous devez d\'abord définir votre mot de passe personnel via l\'écran de première connexion.',
        mustChangePassword: true,
      });
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (verifyError) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password: newPassword,
    });

    if (sessionError || !sessionData?.session) {
      return res.status(500).json({ error: 'Mot de passe mis à jour mais reconnexion impossible. Reconnectez-vous.' });
    }

    return res.json({
      message: 'Mot de passe mis à jour avec succès',
      token: sessionData.session.access_token,
      user: {
        ...admin,
        email,
        role: 'ADMIN_ETABLISSEMENT',
        mustChangePassword: false,
      },
    });
  } catch (error) {
    console.error('❌ Erreur changePassword:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.finalizePasswordReset = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: authUserData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getUserError || !authUserData?.user) {
      return res.status(500).json({ error: 'Impossible de finaliser la réinitialisation' });
    }

    const metadata = authUserData.user.user_metadata || {};
    if (metadata.mustChangePassword || metadata.tempPasswordExpiresAt) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...metadata,
          mustChangePassword: false,
          tempPasswordExpiresAt: null,
        },
      });

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }
    }

    return res.json({ message: 'Réinitialisation finalisée' });
  } catch (error) {
    console.error('❌ Erreur finalizePasswordReset:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

async function resolveAccountByEmail(email) {
  const normalized = email.trim().toLowerCase();

  const candidat = await prisma.candidat.findUnique({
    where: { email: normalized },
    select: { id: true },
  });
  if (candidat) return candidat;

  if (prisma.adminEtablissement) {
    const admin = await prisma.adminEtablissement.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    if (admin) return admin;
  }

  const commission = await prisma.membreCommission.findUnique({
    where: { email: normalized },
    select: { id: true },
  });
  if (commission) return commission;

  const dges = await prisma.administrateurDGES.findUnique({
    where: { email: normalized },
    select: { id: true },
  });
  if (dges) return dges;

  const controleur = await prisma.controleur.findUnique({
    where: { email: normalized },
    select: { id: true },
  });
  if (controleur) return controleur;

  return null;
}

exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const account = await resolveAccountByEmail(email);

    if (!account) {
      return res.json({
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
      });
    }

    const resetUrl = buildFrontendUrl('/reset-password');
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: resetUrl,
    });

    if (error) {
      console.error('❌ Erreur réinitialisation mot de passe:', error);
      return res.status(400).json({ error: error.message });
    }

    try {
      await prisma.emailDelivery.create({
        data: {
          userId: account.id,
          recipient: normalizedEmail,
          subject: '[UniPath] Réinitialisation de votre mot de passe',
          status: 'SENT',
          attempts: 1,
          lastAttemptAt: new Date(),
          sentAt: new Date(),
        },
      });
    } catch (logErr) {
      console.warn('Journal emailDelivery reset-password:', logErr.message);
    }

    try {
      await prisma.notification.create({
        data: {
          userId: account.id,
          type: 'SYSTEME',
          title: 'Demande de réinitialisation de mot de passe',
          message: 'Un email de réinitialisation de mot de passe a été envoyé à votre adresse.',
          priority: 'NORMAL',
        },
      });
    } catch (notifErr) {
      console.warn('Notification reset-password:', notifErr.message);
    }

    res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Nouvelle route pour confirmer l'email
exports.confirmEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token manquant' });
    }

    const candidatExistant = await prisma.candidat.findUnique({
      where: { emailConfirmToken: token },
    });

    if (!candidatExistant) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }

    if (candidatExistant.emailConfirme) {
      return res.json({
        success: true,
        alreadyConfirmed: true,
        message: 'Votre email était déjà confirmé. Vous pouvez vous connecter.',
        candidat: {
          nom: candidatExistant.nom,
          prenom: candidatExistant.prenom,
          email: candidatExistant.email,
          matricule: candidatExistant.matricule,
        },
      });
    }

    if (
      !candidatExistant.emailConfirmExpires
      || candidatExistant.emailConfirmExpires <= new Date()
    ) {
      return res.status(400).json({ error: 'Lien expiré, demandez un nouveau' });
    }

    const candidat = await prisma.candidat.update({
      where: { id: candidatExistant.id },
      data: {
        emailConfirme: true,
        emailConfirmToken: null,
        emailConfirmExpires: null,
      },
    });

    try {
      await supabaseAdmin.auth.admin.updateUserById(candidat.id, { email_confirm: true });
    } catch (supabaseConfirmErr) {
      console.error('Erreur confirmation email Supabase:', supabaseConfirmErr);
    }

    // Créer une notification de confirmation
    await prisma.notification.create({
      data: {
        userId: candidat.id,
        type: 'SYSTEME',
        title: 'Email confirmé avec succès',
        message: `Félicitations ${candidat.prenom} ! Votre email a été confirmé. Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.`,
        priority: 'NORMAL'
      }
    });

    // Envoyer l'email de bienvenue après confirmation
    try {
      await emailService.envoyerEmailBienvenue({
        email: candidat.email,
        nom: candidat.nom,
        prenom: candidat.prenom,
        matricule: candidat.matricule,
        userId: candidat.id
      });

      await prisma.emailDelivery.create({
        data: {
          userId: candidat.id,
          recipient: candidat.email,
          subject: '[UniPath] Bienvenue sur la plateforme',
          status: 'SENT',
          attempts: 1,
          lastAttemptAt: new Date(),
          sentAt: new Date()
        }
      });
    } catch (emailError) {
      console.error('❌ Erreur envoi email de bienvenue:', emailError);
    }

    res.json({ 
      success: true,
      message: 'Email confirmé avec succès',
      candidat: {
        nom: candidat.nom,
        prenom: candidat.prenom,
        email: candidat.email,
        matricule: candidat.matricule
      }
    });
  } catch (error) {
    console.error('❌ Erreur confirmation email:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation de l\'email' });
  }
};

// Nouvelle route pour renvoyer l'email de confirmation
exports.resendConfirmationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const candidat = await prisma.candidat.findUnique({
      where: { email }
    });

    if (!candidat) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (candidat.emailConfirme) {
      return res.status(400).json({ error: 'Email déjà confirmé' });
    }

    const { emailConfirmToken, emailConfirmExpires } = generateEmailConfirmCredentials();

    await prisma.candidat.update({
      where: { id: candidat.id },
      data: { emailConfirmToken, emailConfirmExpires },
    });

    try {
      console.log(`📧 Renvoi email de confirmation à ${candidat.email}`);

      await emailService.envoyerEmailConfirmation({
        email: candidat.email,
        nom: candidat.nom,
        prenom: candidat.prenom,
        confirmationToken: emailConfirmToken,
      });

      await prisma.emailDelivery.create({
        data: {
          userId: candidat.id,
          recipient: candidat.email,
          subject: '[UniPath] Confirmez votre adresse email',
          status: 'SENT',
          attempts: 1,
          lastAttemptAt: new Date(),
          sentAt: new Date()
        }
      });

      res.json({ 
        success: true,
        message: 'Email de confirmation renvoyé avec succès' 
      });
    } catch (emailError) {
      console.error('❌ Erreur renvoi email:', emailError);
      
      await prisma.emailDelivery.create({
        data: {
          userId: candidat.id,
          recipient: candidat.email,
          subject: '[UniPath] Confirmez votre adresse email',
          status: 'FAILED',
          attempts: 1,
          lastAttemptAt: new Date(),
          errorMessage: emailError.message
        }
      });

      res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
    }
  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;