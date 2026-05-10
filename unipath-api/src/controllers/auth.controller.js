// src/controllers/auth.controller.js
const { supabase, supabaseAdmin } = require('../supabase');
const prisma = require('../prisma');
const emailService = require('../services/email.service');
const { getFrontendUrl, buildFrontendUrl } = require('../utils/url.helper');
const { genererMatriculeUnique } = require('../utils/matricule.helper');

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
    const seriesValides = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    if (serie && !seriesValides.includes(serie)) {
      return res.status(400).json({ 
        error: 'Série invalide. Séries acceptées : A, B, C, D, E, F, G' 
      });
    }

    // Créer l'utilisateur avec Supabase (email confirmation désactivée côté Supabase)
    const { data: authData, error: authError } =
      await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: buildFrontendUrl('/auth/callback'),
          data: {
            nom,
            prenom,
            anip
          }
        }
      });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Générer un matricule unique
    const matricule = await genererMatriculeUnique();
    console.log(`📋 Matricule généré pour ${prenom} ${nom}: ${matricule}`);

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
      const confirmationUrl = buildFrontendUrl('/auth/confirm', {
        token: authData.user.id,
        type: 'signup'
      });

      console.log(`📧 Envoi email de confirmation à ${candidat.email}`);
      console.log(`🔗 URL de confirmation: ${confirmationUrl}`);

      const emailResult = await emailService.envoyerEmailConfirmation({
        email: candidat.email,
        nom: candidat.nom,
        prenom: candidat.prenom,
        confirmationUrl
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
      userId: candidat.id
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du compte' });
  }
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
    const candidat = await prisma.candidat.findUnique({
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
    if (!role) {
      const commission = await prisma.membreCommission.findUnique({
        where: { id: userId },
        select: { role: true, nom: true, prenom: true },
      });

      if (commission) {
        role = commission.role;
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

    res.json({
      token: data.session.access_token,
      user: {
        email: data.user.email,
        role: role || 'CANDIDAT',
        ...userData,
      },
    });
  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Vérifier si l'utilisateur existe
    const candidat = await prisma.candidat.findUnique({
      where: { email }
    });

    if (!candidat) {
      // Ne pas révéler si l'email existe ou non (sécurité)
      return res.json({ 
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' 
      });
    }

    const resetUrl = buildFrontendUrl('/reset-password');
    console.log(`🔑 URL de réinitialisation: ${resetUrl}`);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl
    });

    if (error) {
      console.error('❌ Erreur réinitialisation mot de passe:', error);
      return res.status(400).json({ error: error.message });
    }

    // Enregistrer la tentative d'envoi
    await prisma.emailDelivery.create({
      data: {
        userId: candidat.id,
        recipient: email,
        subject: '[UniPath] Réinitialisation de votre mot de passe',
        status: 'SENT',
        attempts: 1,
        lastAttemptAt: new Date(),
        sentAt: new Date()
      }
    });

    // Créer une notification
    await prisma.notification.create({
      data: {
        userId: candidat.id,
        type: 'SYSTEME',
        title: 'Demande de réinitialisation de mot de passe',
        message: 'Un email de réinitialisation de mot de passe a été envoyé à votre adresse.',
        priority: 'NORMAL'
      }
    });

    res.json({ message: 'Email de réinitialisation envoyé avec succès' });
  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Nouvelle route pour confirmer l'email
exports.confirmEmail = async (req, res) => {
  try {
    const { token, type } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token manquant' });
    }

    // Vérifier le token avec Supabase Admin
    const { data: userData, error: verifyError } = await supabaseAdmin.auth.admin.getUserById(token);

    if (verifyError || !userData) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }

    // Mettre à jour le statut de confirmation dans la base de données
    const candidat = await prisma.candidat.update({
      where: { id: token },
      data: { emailConfirme: true }
    });

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
        matricule: candidat.matricule
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

    // Renvoyer l'email de confirmation
    try {
      const confirmationUrl = buildFrontendUrl('/auth/confirm', {
        token: candidat.id,
        type: 'signup'
      });

      console.log(`📧 Renvoi email de confirmation à ${candidat.email}`);
      console.log(`🔗 URL de confirmation: ${confirmationUrl}`);

      await emailService.envoyerEmailConfirmation({
        email: candidat.email,
        nom: candidat.nom,
        prenom: candidat.prenom,
        confirmationUrl
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