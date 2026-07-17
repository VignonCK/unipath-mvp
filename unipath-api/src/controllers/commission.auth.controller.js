// src/controllers/commission.auth.controller.js
const crypto = require('crypto');
const prisma = require('../prisma');
const authService = require('../services/auth.service');
const emailService = require('../services/email.service');

async function registerProfile({ email, password, nom, prenom, telephone, profilType, createProfile }) {
  const existingCompte = await authService.findCompteByEmail(email);
  if (existingCompte) {
    return { error: 'Un compte existe déjà avec cet email' };
  }

  const profileId = crypto.randomUUID();
  const profile = await createProfile(profileId);

  await authService.createCompte({
    email,
    password,
    profilType,
    profilId: profileId,
    emailConfirme: true,
  });

  return { profile };
}

exports.registerCommission = async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone, sousRole } = req.body;
    const sousRoleValide = sousRole === 'CONTROLEUR' ? 'CONTROLEUR' : 'EXAMINATEUR';

    const result = await registerProfile({
      email,
      password,
      nom,
      prenom,
      telephone,
      profilType: 'COMMISSION',
      createProfile: (profileId) =>
        prisma.membreCommission.create({
          data: {
            id: profileId,
            email,
            nom,
            prenom,
            telephone,
            sousRole: sousRoleValide,
          },
        }),
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const membre = result.profile;

    await prisma.notification.create({
      data: {
        userId: membre.id,
        type: 'SYSTEME',
        title: 'Bienvenue - Membre de Commission',
        message: `Bonjour ${membre.prenom} ${membre.nom}, votre compte membre de commission a été créé avec succès.`,
        priority: 'NORMAL',
      },
    });

    try {
      await emailService.envoyerEmailBienvenue({
        email: membre.email,
        nom: membre.nom,
        prenom: membre.prenom,
        matricule: 'COMMISSION',
      });
    } catch (emailError) {
      console.error('❌ Erreur envoi email de bienvenue:', emailError);
    }

    res.status(201).json({
      message: 'Compte commission créé avec succès',
      membre: {
        id: membre.id,
        nom: membre.nom,
        prenom: membre.prenom,
        email: membre.email,
        role: membre.role,
        sousRole: membre.sousRole,
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

    const result = await registerProfile({
      email,
      password,
      nom,
      prenom,
      telephone,
      profilType: 'DGES',
      createProfile: (profileId) =>
        prisma.administrateurDGES.create({
          data: {
            id: profileId,
            email,
            nom,
            prenom,
            telephone,
            role: 'DGES',
          },
        }),
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const admin = result.profile;

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

module.exports = exports;
