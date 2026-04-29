// Schémas de validation pour l'authentification
const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const registerSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  dateNaiss: z.string().datetime().optional(),
  lieuNaiss: z.string().optional(),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

module.exports = {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
};
