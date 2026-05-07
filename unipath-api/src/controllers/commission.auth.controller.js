// src/controllers/commission.auth.controller.js
const { supabase } = require('../supabase');
const prisma = require('../prisma');

exports.registerCommission = async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone } = req.body;

    const { data: authData, error: authError } =
      await supabase.auth.signUp({ email, password });

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
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.registerDGES = async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone } = req.body;

    const { data: authData, error: authError } =
      await supabase.auth.signUp({ email, password });

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
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
