// src/controllers/auth.controller.js
const { supabase } = require('../supabase');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.register = async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone, dateNaiss, lieuNaiss } = req.body;

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
        dateNaiss: dateNaiss ? new Date(dateNaiss) : null,
        lieuNaiss: lieuNaiss || null,
        matricule: 'TEMP',
      },
    });

    res.status(201).json({
      message: 'Compte créé avec succès',
      matricule: candidat.matricule,
      // Si session est null, Supabase attend une confirmation email
      emailConfirmationRequired: !authData.session,
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

    // Récupérer le rôle de l'utilisateur
    const userId = data.user.id;
    let role = null;
    let userData = null;

    // Chercher dans Candidat
    const candidat = await prisma.candidat.findUnique({
      where: { id: userId },
      select: { role: true, nom: true, prenom: true, matricule: true },
    });

    if (candidat) {
      role = candidat.role;
      userData = candidat;
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

    res.json({
      token: data.session.access_token,
      user: {
        email: data.user.email,
        role: role || 'CANDIDAT',
        ...userData,
      },
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Email de réinitialisation envoyé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};