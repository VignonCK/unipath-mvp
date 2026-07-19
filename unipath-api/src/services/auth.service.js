const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'unipath-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_HOURS = 1;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function findCompteByEmail(email) {
  return prisma.compte.findUnique({ where: { email: normalizeEmail(email) } });
}

async function createCompte({
  email,
  password,
  profilType,
  profilId,
  emailConfirme = false,
  mustChangePassword = false,
}) {
  const passwordHash = await hashPassword(password);
  return prisma.compte.create({
    data: {
      id: profilId,
      email: normalizeEmail(email),
      passwordHash,
      profilType,
      profilId,
      emailConfirme,
      mustChangePassword,
    },
  });
}

async function deleteCompte(profilId) {
  try {
    await prisma.compte.delete({ where: { profilId } });
  } catch (_) {
    // Compte déjà absent
  }
}

async function resolveProfileById(userId) {
  const candidat = await prisma.candidat.findUnique({
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
  if (candidat) {
    return { role: candidat.role, sousRole: null, userData: candidat, profilType: 'CANDIDAT' };
  }

  const commission = await prisma.membreCommission.findUnique({
    where: { id: userId },
    select: { role: true, sousRole: true, nom: true, prenom: true, email: true },
  });
  if (commission) {
    return {
      role: commission.role,
      sousRole: commission.sousRole,
      userData: commission,
      profilType: 'COMMISSION',
    };
  }

  const dges = await prisma.administrateurDGES.findUnique({
    where: { id: userId },
    select: { role: true, nom: true, prenom: true, email: true },
  });
  if (dges) {
    return { role: dges.role, sousRole: null, userData: dges, profilType: 'DGES' };
  }

  const dec = await prisma.administrateurDEC.findUnique({
    where: { id: userId },
    select: { role: true, nom: true, prenom: true, email: true },
  });
  if (dec) {
    return { role: dec.role, sousRole: null, userData: dec, profilType: 'DEC' };
  }

  const controleur = await prisma.controleur.findUnique({
    where: { id: userId },
    select: { role: true, nom: true, prenom: true, email: true },
  });
  if (controleur) {
    return { role: controleur.role, sousRole: null, userData: controleur, profilType: 'CONTROLEUR' };
  }

  if (prisma.adminEtablissement) {
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
      return {
        role: adminEtablissement.role,
        sousRole: null,
        userData: adminEtablissement,
        profilType: 'ADMIN_ETABLISSEMENT',
        etablissementId: adminEtablissement.etablissementId,
      };
    }
  }

  const etablissement = await prisma.etablissement.findUnique({
    where: { id: userId },
    select: { nom: true, type: true, ville: true, adresse: true, email: true },
  });
  if (etablissement) {
    return {
      role: 'ETABLISSEMENT',
      sousRole: null,
      userData: etablissement,
      profilType: 'ETABLISSEMENT',
    };
  }

  return null;
}

async function authenticate(email, password) {
  const compte = await findCompteByEmail(email);
  if (!compte) {
    return { error: 'Email ou mot de passe incorrect' };
  }

  const valid = await verifyPassword(password, compte.passwordHash);
  if (!valid) {
    return { error: 'Email ou mot de passe incorrect' };
  }

  const profile = await resolveProfileById(compte.profilId);
  if (!profile) {
    return { error: 'Profil UniPath introuvable pour ce compte.', profileIncomplete: true };
  }

  if (compte.profilType === 'CANDIDAT' && !compte.emailConfirme) {
    return {
      error: 'Veuillez confirmer votre email avant de vous connecter',
      emailConfirmationRequired: true,
      userId: compte.profilId,
      email: compte.email,
    };
  }

  const { emailConfirme, ...safeUserData } = profile.userData || {};
  const token = signToken({
    sub: compte.profilId,
    email: compte.email,
    role: profile.role,
    ...(profile.sousRole && { sousRole: profile.sousRole }),
    ...(profile.etablissementId && { etablissementId: profile.etablissementId }),
  });

  return {
    token,
    user: {
      id: compte.profilId,
      email: compte.email,
      ...safeUserData,
      role: profile.role,
      mustChangePassword: !!compte.mustChangePassword,
      ...(profile.sousRole && { sousRole: profile.sousRole }),
      ...(profile.etablissementId && { etablissementId: profile.etablissementId }),
    },
  };
}

async function createPasswordResetToken(email) {
  const compte = await findCompteByEmail(email);
  if (!compte) return null;

  const resetToken = crypto.randomUUID();
  const resetExpires = new Date(Date.now() + RESET_TOKEN_HOURS * 60 * 60 * 1000);

  await prisma.compte.update({
    where: { id: compte.id },
    data: { resetToken, resetExpires },
  });

  return { compte, resetToken };
}

async function resetPasswordWithToken(token, newPassword) {
  const compte = await prisma.compte.findFirst({
    where: {
      resetToken: token,
      resetExpires: { gt: new Date() },
    },
  });

  if (!compte) {
    throw new Error('Lien invalide ou expiré');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.compte.update({
    where: { id: compte.id },
    data: {
      passwordHash,
      resetToken: null,
      resetExpires: null,
    },
  });

  return compte;
}

async function changePassword(profilId, currentPassword, newPassword) {
  const compte = await prisma.compte.findUnique({ where: { profilId } });
  if (!compte) throw new Error('Compte introuvable');

  const valid = await verifyPassword(currentPassword, compte.passwordHash);
  if (!valid) throw new Error('Mot de passe actuel incorrect');

  const passwordHash = await hashPassword(newPassword);
  await prisma.compte.update({
    where: { id: compte.id },
    data: { passwordHash, mustChangePassword: false },
  });

  if (compte.profilType === 'COMMISSION') {
    await prisma.membreCommission.updateMany({
      where: { id: profilId },
      data: { motDePasseTemporaire: null },
    });
  }

  if (compte.profilType === 'ADMIN_ETABLISSEMENT') {
    await prisma.adminEtablissement.updateMany({
      where: { id: profilId },
      data: { motDePasseTemporaire: null },
    });
  }
}

module.exports = {
  normalizeEmail,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  findCompteByEmail,
  createCompte,
  deleteCompte,
  resolveProfileById,
  authenticate,
  createPasswordResetToken,
  resetPasswordWithToken,
  changePassword,
};
