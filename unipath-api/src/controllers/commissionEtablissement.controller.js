const crypto = require('crypto');
const prisma = require('../prisma');
const { supabaseAdmin } = require('../supabase');
const emailService = require('../services/email.service');
const logger = require('../config/logger');
const { buildFrontendUrl } = require('../utils/url.helper');
const {
  buildMembreCommissionMetadata,
  TEMP_PASSWORD_VALIDITY_HOURS,
} = require('../utils/admin-password.helper');
const {
  LIMITES_SOUS_ROLE,
  getEtablissementPublic,
} = require('../utils/commission-etablissement.helper');
const { withPrismaRetry, isPrismaConnectionError } = require('../utils/prisma-retry.helper');

function genererMotDePasseTemporaire() {
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}

function validerDonneesMembre(body) {
  const { nom, prenom, email, sousRole } = body;
  if (!nom?.trim() || !prenom?.trim() || !email?.trim()) {
    return 'nom, prenom et email sont obligatoires';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Adresse email invalide';
  }
  if (!['EXAMINATEUR', 'CONTROLEUR'].includes(String(sousRole || '').toUpperCase())) {
    return 'Le sous-rôle doit être EXAMINATEUR ou CONTROLEUR';
  }
  return null;
}

const membreSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  telephone: true,
  role: true,
  sousRole: true,
  etablissementId: true,
  createdAt: true,
  updatedAt: true,
};

exports.getCommission = async (req, res) => {
  try {
    const { etablissementId } = req.params;
    const result = await withPrismaRetry(() => getEtablissementPublic(etablissementId));
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    const [membres, nbConcours] = await withPrismaRetry(() => Promise.all([
      prisma.membreCommission.findMany({
        where: { etablissementId },
        select: membreSelect,
        orderBy: [{ sousRole: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.concours.count({ where: { etablissementId } }),
    ]));

    const examinateurs = membres.filter((m) => m.sousRole === 'EXAMINATEUR');
    const controleurs = membres.filter((m) => m.sousRole === 'CONTROLEUR');

    return res.json({
      message: 'Commission récupérée avec succès',
      etablissement: result.etablissement,
      nbConcours,
      limites: LIMITES_SOUS_ROLE,
      membres,
      examinateurs,
      controleurs,
    });
  } catch (error) {
    logger.error('[CommissionEtablissement] Erreur getCommission', { error: error.message });
    if (isPrismaConnectionError(error)) {
      return res.status(503).json({
        error: 'Base de données temporairement indisponible. Vérifiez que votre projet Supabase est actif, puis réessayez.',
        code: 'DB_UNAVAILABLE',
      });
    }
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.creerMembre = async (req, res) => {
  try {
    const { etablissementId } = req.params;
    const erreur = validerDonneesMembre(req.body);
    if (erreur) {
      return res.status(400).json({ error: erreur });
    }

    const result = await getEtablissementPublic(etablissementId);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    const { nom, prenom, email, telephone, sousRole } = req.body;
    const sousRoleUpper = String(sousRole).toUpperCase();
    const emailNormalise = email.trim().toLowerCase();
    const limite = LIMITES_SOUS_ROLE[sousRoleUpper];

    const countExistant = await prisma.membreCommission.count({
      where: { etablissementId, sousRole: sousRoleUpper },
    });

    if (countExistant >= limite) {
      return res.status(400).json({
        error: `Limite atteinte : ${limite} ${sousRoleUpper === 'EXAMINATEUR' ? 'examinateur(s)' : 'contrôleur'} maximum par établissement.`,
      });
    }

    const emailExistant = await prisma.membreCommission.findUnique({
      where: { email: emailNormalise },
    });
    if (emailExistant) {
      return res.status(409).json({ error: 'Un membre de commission avec cet email existe déjà' });
    }

    const motDePasseTemporaire = genererMotDePasseTemporaire();
    const { etablissement } = result;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailNormalise,
      password: motDePasseTemporaire,
      email_confirm: true,
      user_metadata: buildMembreCommissionMetadata(etablissementId, sousRoleUpper),
    });

    if (authError) {
      logger.error('[CommissionEtablissement] Erreur Supabase', {
        error: authError.message,
        etablissementId,
      });
      return res.status(400).json({ error: authError.message });
    }

    const membre = await prisma.membreCommission.create({
      data: {
        id: authData.user.id,
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: emailNormalise,
        telephone: telephone?.trim() || null,
        role: 'COMMISSION',
        sousRole: sousRoleUpper,
        etablissementId,
      },
      select: membreSelect,
    });

    const loginUrl = buildFrontendUrl('/login');
    const roleLabel = sousRoleUpper === 'EXAMINATEUR' ? 'examinateur' : 'contrôleur';

    try {
      await emailService.createEmail({
        userId: membre.id,
        recipient: emailNormalise,
        subject: `UniPath — Accès ${roleLabel} ${etablissement.nom}`,
        emailType: 'COMMISSION_ETABLISSEMENT_CREDENTIALS',
        htmlBody: `
          <h2>Bienvenue sur UniPath</h2>
          <p>Bonjour ${membre.prenom} ${membre.nom},</p>
          <p>Un compte <strong>${roleLabel}</strong> a été créé pour la commission de l'établissement <strong>${etablissement.nom}</strong>.</p>
          <p><strong>Email :</strong> ${emailNormalise}</p>
          <p><strong>Mot de passe temporaire :</strong> ${motDePasseTemporaire}</p>
          <p><strong>Validité :</strong> ${TEMP_PASSWORD_VALIDITY_HOURS} heures.</p>
          <p>Connectez-vous sur <a href="${loginUrl}">${loginUrl}</a> puis définissez votre mot de passe personnel.</p>
        `,
        textBody: `Bonjour ${membre.prenom} ${membre.nom}, compte ${roleLabel} UniPath pour ${etablissement.nom} : ${emailNormalise} / ${motDePasseTemporaire} (valable ${TEMP_PASSWORD_VALIDITY_HOURS}h). Connexion : ${loginUrl}`,
      });
    } catch (emailErr) {
      logger.error('[CommissionEtablissement] Email non envoyé', {
        membreId: membre.id,
        error: emailErr.message,
      });
    }

    return res.status(201).json({
      message: 'Membre de commission créé. Un email avec les identifiants a été envoyé.',
      membre,
    });
  } catch (error) {
    logger.error('[CommissionEtablissement] Erreur creerMembre', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur lors de la création du membre' });
  }
};

exports.supprimerMembre = async (req, res) => {
  try {
    const { etablissementId, membreId } = req.params;

    const membre = await prisma.membreCommission.findFirst({
      where: { id: membreId, etablissementId },
    });

    if (!membre) {
      return res.status(404).json({ error: 'Membre de commission non trouvé pour cet établissement' });
    }

    await prisma.membreCommission.delete({ where: { id: membreId } });

    try {
      await supabaseAdmin.auth.admin.deleteUser(membreId);
    } catch (supabaseErr) {
      logger.error('[CommissionEtablissement] Suppression Supabase échouée', {
        membreId,
        error: supabaseErr.message,
      });
    }

    return res.json({ message: 'Membre de commission supprimé avec succès' });
  } catch (error) {
    logger.error('[CommissionEtablissement] Erreur supprimerMembre', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
