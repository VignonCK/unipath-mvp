// src/controllers/auth.controller.js
const crypto = require('crypto');
const prisma = require('../prisma');
const emailService = require('../services/email.service');
const authService = require('../services/auth.service');
const { buildFrontendUrl } = require('../utils/url.helper');
const { genererMatriculeUnique } = require('../utils/matricule.helper');
const { SERIES_VALIDES } = require('../constants/pieces.constants');

exports.register = async (req, res) => {
  try {
    const {
      email, password, nom, prenom, anip, serie,
      sexe, nationalite, telephone, dateNaiss, lieuNaiss,
    } = req.body;

    if (!anip) {
      return res.status(400).json({ error: "L'identifiant ANIP est obligatoire pour l'inscription" });
    }
    if (!/^\d{12}$/.test(anip)) {
      return res.status(400).json({ error: "Format ANIP invalide. L'ANIP doit contenir exactement 12 chiffres" });
    }

    const anipExistant = await prisma.candidat.findFirst({ where: { anip } });
    if (anipExistant) {
      return res.status(400).json({ error: 'Cet identifiant ANIP est déjà enregistré dans le système' });
    }

    if (serie && !SERIES_VALIDES.includes(serie)) {
      return res.status(400).json({
        error: 'Série invalide. Séries acceptées : A, B, C, D, E, F1, F2, F3, F4, G1, G2, G3',
      });
    }

    const existingCompte = await authService.findCompteByEmail(email);
    if (existingCompte) {
      return res.status(400).json({ error: 'Un compte existe déjà avec cet email' });
    }

    const candidatId = crypto.randomUUID();
    const matricule = await genererMatriculeUnique();

    const candidat = await prisma.candidat.create({
      data: {
        id: candidatId,
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
        matricule,
        emailConfirme: false,
        role: 'ETUDIANT',
      },
    });

    await authService.createCompte({
      email,
      password,
      profilType: 'CANDIDAT',
      profilId: candidatId,
      emailConfirme: false,
    });

    await prisma.notification.create({
      data: {
        userId: candidat.id,
        type: 'SYSTEME',
        title: 'Bienvenue sur UniPath',
        message: `Bonjour ${candidat.prenom} ${candidat.nom}, votre compte a été créé avec succès. Veuillez confirmer votre email pour accéder à toutes les fonctionnalités.`,
        priority: 'HIGH',
        data: { matricule: candidat.matricule, emailConfirmationRequired: true },
      },
    });

    try {
      await emailService.envoyerEmailConfirmation({
        email: candidat.email,
        nom: candidat.nom,
        prenom: candidat.prenom,
        confirmationToken: candidat.id,
      });
      await prisma.emailDelivery.create({
        data: {
          userId: candidat.id,
          recipient: candidat.email,
          subject: '[UniPath] Confirmez votre adresse email',
          status: 'SENT',
          attempts: 1,
          lastAttemptAt: new Date(),
          sentAt: new Date(),
        },
      });
    } catch (emailError) {
      console.error('❌ Erreur envoi email de confirmation:', emailError);
      await prisma.emailDelivery.create({
        data: {
          userId: candidat.id,
          recipient: candidat.email,
          subject: '[UniPath] Confirmez votre adresse email',
          status: 'FAILED',
          attempts: 1,
          lastAttemptAt: new Date(),
          errorMessage: emailError.message,
        },
      });
    }

    res.status(201).json({
      message: 'Compte créé avec succès. Un email de confirmation a été envoyé à votre adresse.',
      matricule: candidat.matricule,
      emailConfirmationRequired: true,
      userId: candidat.id,
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du compte' });
  }
};

exports.registerEtablissement = async (req, res) => {
  try {
    const { email, password, nom, type, ville, adresse } = req.body;

    if (!email || !password || !nom || !type || !ville) {
      return res.status(400).json({ error: 'email, password, nom, type et ville sont obligatoires' });
    }

    const typeUpper = String(type).toUpperCase();
    if (!['PUBLIC', 'PRIVE'].includes(typeUpper)) {
      return res.status(400).json({ error: 'Le type doit etre PUBLIC ou PRIVE' });
    }

    const etabExistant = await prisma.etablissement.findUnique({ where: { email } });
    if (etabExistant) {
      return res.status(400).json({ error: 'Un etablissement avec cet email existe deja' });
    }

    const existingCompte = await authService.findCompteByEmail(email);
    if (existingCompte) {
      return res.status(400).json({ error: 'Un compte existe déjà avec cet email' });
    }

    const etablissementId = crypto.randomUUID();

    const etablissement = await prisma.etablissement.create({
      data: {
        id: etablissementId,
        nom,
        type: typeUpper,
        ville,
        adresse: adresse || null,
        email,
      },
    });

    await authService.createCompte({
      email,
      password,
      profilType: 'ETABLISSEMENT',
      profilId: etablissementId,
      emailConfirme: true,
    });

    return res.status(201).json({
      message: 'Compte etablissement cree avec succes',
      etablissement,
    });
  } catch (error) {
    console.error('Erreur registerEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de la creation du compte etablissement' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.authenticate(email, password);

    if (result.error) {
      const status = result.emailConfirmationRequired ? 403 : result.profileIncomplete ? 403 : 401;
      return res.status(status).json(result);
    }

    res.json({ token: result.token, user: result.user });
  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const compte = await authService.findCompteByEmail(email);

    // Réponse générique pour ne pas divulguer l'existence du compte
    const messageGenerique = 'Si cet email existe, un lien de réinitialisation a été envoyé.';

    if (!compte) {
      return res.json({ message: messageGenerique });
    }

    // Commission / admins établissements privés : pas de lien email — signalement DEC / DGES
    if (compte.profilType === 'COMMISSION' || compte.profilType === 'ADMIN_ETABLISSEMENT') {
      await prisma.compte.update({
        where: { id: compte.id },
        data: {
          demandeResetMotDePasseAt: new Date(),
          resetToken: null,
          resetExpires: null,
        },
      });

      if (compte.profilType === 'COMMISSION') {
        return res.json({
          message:
            'Votre demande a été transmise à la Direction des Examens et Concours (DEC). '
            + 'Elle réinitialisera votre mot de passe et vous l\'enverra par email.',
          demandeTransmiseADec: true,
        });
      }

      return res.json({
        message:
          'Votre demande a été transmise à la Direction Générale de l\'Enseignement Supérieur (DGES). '
          + 'Elle réinitialisera votre mot de passe et vous l\'enverra par email.',
        demandeTransmiseADges: true,
      });
    }

    const resetData = await authService.createPasswordResetToken(email);
    if (!resetData) {
      return res.json({ message: messageGenerique });
    }

    const resetUrl = `${buildFrontendUrl('/reset-password')}?token=${resetData.resetToken}`;

    try {
      await emailService.envoyerEmailReinitialisation({
        email: resetData.compte.email,
        resetUrl,
      });
    } catch (emailErr) {
      console.warn('Email reset non envoyé:', emailErr.message);
      console.log(`🔑 Lien de réinitialisation (dev): ${resetUrl}`);
    }

    await prisma.emailDelivery.create({
      data: {
        userId: resetData.compte.profilId,
        recipient: resetData.compte.email,
        subject: '[UniPath] Réinitialisation de votre mot de passe',
        status: 'SENT',
        attempts: 1,
        lastAttemptAt: new Date(),
        sentAt: new Date(),
      },
    });

    res.json({ message: messageGenerique });
  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.confirmResetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token et mot de passe requis' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    await authService.resetPasswordWithToken(token, password);
    res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Lien invalide ou expiré' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mots de passe requis' });
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);
    const result = await authService.authenticate(req.user.email, newPassword);
    res.json({ message: 'Mot de passe modifié', token: result.token, user: result.user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.changeInitialPassword = exports.changePassword;

exports.finalizePasswordReset = async (req, res) => {
  res.json({ success: true, message: 'Réinitialisation finalisée' });
};

exports.confirmEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Token manquant' });
    }

    const candidatExistant = await prisma.candidat.findUnique({ where: { id: token } });
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

    const candidat = await prisma.candidat.update({
      where: { id: token },
      data: { emailConfirme: true },
    });

    await prisma.compte.updateMany({
      where: { profilId: token },
      data: { emailConfirme: true },
    });

    await prisma.notification.create({
      data: {
        userId: candidat.id,
        type: 'SYSTEME',
        title: 'Email confirmé avec succès',
        message: `Félicitations ${candidat.prenom} ! Votre email a été confirmé.`,
        priority: 'NORMAL',
      },
    });

    try {
      await emailService.envoyerEmailBienvenue({
        email: candidat.email,
        nom: candidat.nom,
        prenom: candidat.prenom,
        matricule: candidat.matricule,
        userId: candidat.id,
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
        matricule: candidat.matricule,
      },
    });
  } catch (error) {
    console.error('❌ Erreur confirmation email:', error);
    res.status(500).json({ error: "Erreur lors de la confirmation de l'email" });
  }
};

exports.resendConfirmationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const candidat = await prisma.candidat.findUnique({ where: { email } });
    if (!candidat) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    if (candidat.emailConfirme) {
      return res.status(400).json({ error: 'Email déjà confirmé' });
    }

    await emailService.envoyerEmailConfirmation({
      email: candidat.email,
      nom: candidat.nom,
      prenom: candidat.prenom,
      confirmationToken: candidat.id,
    });

    res.json({ success: true, message: 'Email de confirmation renvoyé avec succès' });
  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
