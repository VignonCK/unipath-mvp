// src/controllers/auth.controller.js
const { supabase } = require('../supabase');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.register = async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone } = req.body;

    const { data: authData, error: authError } =
      await supabase.auth.signUp({ email, password });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const candidat = await prisma.candidat.create({
      data: {
        id: authData.user.id,
        email,
        nom,
        prenom,
        telephone,
        matricule: 'TEMP',
      },
    });

    res.status(201).json({
      message: 'Compte créé avec succès',
      matricule: candidat.matricule,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
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

    res.json({
      token: data.session.access_token,
      user: { email: data.user.email },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};