// src/controllers/auth.controller.js
const { supabase, supabaseAdmin } = require('../supabase');
const prisma = require('../prisma');
const emailService = require('../services/email.service');
const { getFrontendUrl, buildFrontendUrl } = require('../utils/url.helper');
const { genererMatriculeUnique } = require('../utils/matricule.helper');
const { SERIES_VALIDES } = require('../constants/pieces.constants');
const { alignCandidatIdToAuth } = require('../utils/candidat-alignment.helper');

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
      const confirmationToken = authData.user.id;

      console.log(`📧 Envoi email de confirmation à ${candidat.email}`);
      console.log(`🔗 Token de confirmation: ${confirmationToken}`);

      const emailResult = await emailService.envoyerEmailConfirmation({
        email: candidat.email,
        nom: candidat.nom,
        prenom: candidat.prenom,
        confirmationToken
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

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: buildFrontendUrl('/auth/callback'),
        data: {
          nomEtablissement: nom,
          role: 'ETABLISSEMENT',
        },
      },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const etablissement = await prisma.etablissement.create({
      data: {
        id: authData.user.id,
        nom,
        type: typeUpper,
        ville,
        adresse: adresse || null,
        email,
      },
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

    if (!role) {
      const etablissement = await prisma.etablissement.findUnique({
        where: { id: userId },
        select: { nom: true, type: true, ville: true, adresse: true, email: true },
      });

      if (etablissement) {
        role = 'ETABLISSEMENT';
        userData = etablissement;
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

    res.json({
      token: data.session.access_token,
      user: {
        id: userId,
        email: data.user.email,
        ...userData,
        role,
        ...(sousRole && { sousRole }),
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

    console.log('🔍 Tentative de confirmation email avec token:', token);

    if (!token) {
      return res.status(400).json({ error: 'Token manquant' });
    }

    // Vérifier si le candidat existe dans la base de données
    const candidatExistant = await prisma.candidat.findUnique({
      where: { id: token }
    });

    console.log('🔍 Candidat trouvé:', candidatExistant ? `${candidatExistant.prenom} ${candidatExistant.nom}` : 'NULL');

    if (!candidatExistant) {
      console.log('❌ Aucun candidat trouvé avec l\'ID:', token);
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }

    // Déjà confirmé : succès (le candidat peut se connecter)
    if (candidatExistant.emailConfirme) {
      console.log('⚠️ Email déjà confirmé pour:', candidatExistant.email);
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

    console.log('✅ Confirmation de l\'email pour:', candidatExistant.email);

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

    // Renvoyer l'email de confirmation
    try {
      const confirmationToken = candidat.id;

      console.log(`📧 Renvoi email de confirmation à ${candidat.email}`);
      console.log(`🔗 Token de confirmation: ${confirmationToken}`);

      await emailService.envoyerEmailConfirmation({
        email: candidat.email,
        nom: candidat.nom,
        prenom: candidat.prenom,
        confirmationToken
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