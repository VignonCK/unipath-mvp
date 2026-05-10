// src/controllers/commission.auth.controller.js
const { supabase } = require('../supabase');
const prisma = require('../prisma');
const emailService = require('../services/email.service');

exports.registerCommission = async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone } = req.body;

    const { data: authData, error: authError } =
      await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${process.env.APP_URL || 'http://localhost:5173'}/auth/callback`
        }
      });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const membre = await prisma.membreCommission.create({
      data: {
        id: authData.user.id,
        email,
        nom,
        prenom,
        telephone,
      },
    });

    // Créer une notification de bienvenue
    await prisma.notification.create({
      data: {
        userId: membre.id,
        type: 'SYSTEME',
        title: 'Bienvenue - Membre de Commission',
        message: `Bonjour ${membre.prenom} ${membre.nom}, votre compte membre de commission a été créé avec succès.`,
        priority: 'NORMAL'
      }
    });

    // Envoyer l'email de bienvenue
    try {
      await emailService.envoyerEmailBienvenue({
        email: membre.email,
        nom: membre.nom,
        prenom: membre.prenom,
        matricule: 'COMMISSION'
      });

      await prisma.emailDelivery.create({
        data: {
          userId: membre.id,
          recipient: membre.email,
          subject: '[UniPath] Bienvenue sur la plateforme',
          status: 'SENT',
          attempts: 1,
          lastAttemptAt: new Date(),
          sentAt: new Date()
        }
      });
    } catch (emailError) {
      console.error('❌ Erreur envoi email de bienvenue:', emailError);
      
      await prisma.emailDelivery.create({
        data: {
          userId: membre.id,
          recipient: membre.email,
          subject: '[UniPath] Bienvenue sur la plateforme',
          status: 'FAILED',
          attempts: 1,
          lastAttemptAt: new Date(),
          errorMessage: emailError.message
        }
      });
    }

    res.status(201).json({
      message: 'Compte commission créé avec succès',
      membre: {
        id: membre.id,
        nom: membre.nom,
        prenom: membre.prenom,
        email: membre.email,
        role: membre.role,
      },
    });
  } catch (error) {
    console.error('❌ Erreur registerCommission:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.registerDGES = async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone } = req.body;

    const { data: authData, error: authError } =
      await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${process.env.APP_URL || 'http://localhost:5173'}/auth/callback`
        }
      });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const admin = await prisma.administrateurDGES.create({
      data: {
        id: authData.user.id,
        email,
        nom,
        prenom,
        telephone,
      },
    });

    // Créer une notification de bienvenue
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'SYSTEME',
        title: 'Bienvenue - Administrateur DGES',
        message: `Bonjour ${admin.prenom} ${admin.nom}, votre compte administrateur DGES a été créé avec succès.`,
        priority: 'HIGH'
      }
    });

    // Envoyer l'email de bienvenue
    try {
      await emailService.envoyerEmailBienvenue({
        email: admin.email,
        nom: admin.nom,
        prenom: admin.prenom,
        matricule: 'DGES'
      });

      await prisma.emailDelivery.create({
        data: {
          userId: admin.id,
          recipient: admin.email,
          subject: '[UniPath] Bienvenue sur la plateforme',
          status: 'SENT',
          attempts: 1,
          lastAttemptAt: new Date(),
          sentAt: new Date()
        }
      });
    } catch (emailError) {
      console.error('❌ Erreur envoi email de bienvenue:', emailError);
      
      await prisma.emailDelivery.create({
        data: {
          userId: admin.id,
          recipient: admin.email,
          subject: '[UniPath] Bienvenue sur la plateforme',
          status: 'FAILED',
          attempts: 1,
          lastAttemptAt: new Date(),
          errorMessage: emailError.message
        }
      });
    }

    res.status(201).json({
      message: 'Compte DGES créé avec succès',
      admin: {
        id: admin.id,
        nom: admin.nom,
        prenom: admin.prenom,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('❌ Erreur registerDGES:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
