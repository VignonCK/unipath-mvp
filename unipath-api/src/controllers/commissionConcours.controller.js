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
const { getConcoursPublic } = require('../utils/commission-etablissement.helper');
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
  concoursId: true,
  createdAt: true,
  updatedAt: true,
};

exports.getCommission = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const result = await withPrismaRetry(() => getConcoursPublic(concoursId));
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    const membres = await withPrismaRetry(() =>
      prisma.membreCommission.findMany({
        where: { concoursId },
        select: membreSelect,
        orderBy: [{ sousRole: 'asc' }, { createdAt: 'desc' }],
      })
    );

    const examinateurs = membres.filter((m) => m.sousRole === 'EXAMINATEUR');
    const controleurs = membres.filter((m) => m.sousRole === 'CONTROLEUR');

    return res.json({
      message: 'Commission récupérée avec succès',
      concours: result.concours,
      membres,
      examinateurs,
      controleurs,
    });
  } catch (error) {
    logger.error('[CommissionConcours] Erreur getCommission', { error: error.message });
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
    const { concoursId } = req.params;
    const erreur = validerDonneesMembre(req.body);
    if (erreur) {
      return res.status(400).json({ error: erreur });
    }

    const result = await getConcoursPublic(concoursId);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    const { nom, prenom, email, telephone, sousRole } = req.body;
    const sousRoleUpper = String(sousRole).toUpperCase();
    const emailNormalise = email.trim().toLowerCase();
    const { concours } = result;
    const etablissementId = concours.etablissementId || null;

    const emailExistant = await prisma.membreCommission.findUnique({
      where: { email: emailNormalise },
    });
    if (emailExistant) {
      return res.status(409).json({
        error: 'Un membre de commission avec cet email existe déjà (une personne = un seul concours)',
      });
    }

    const motDePasseTemporaire = genererMotDePasseTemporaire();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailNormalise,
      password: motDePasseTemporaire,
      email_confirm: true,
      user_metadata: buildMembreCommissionMetadata({
        concoursId,
        etablissementId,
        sousRole: sousRoleUpper,
      }),
    });

    if (authError) {
      logger.error('[CommissionConcours] Erreur Supabase', {
        error: authError.message,
        concoursId,
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
        concoursId,
        etablissementId,
      },
      select: membreSelect,
    });

    const loginUrl = buildFrontendUrl('/login');
    const roleLabel = sousRoleUpper === 'EXAMINATEUR' ? 'examinateur' : 'contrôleur';
    const concoursLabel = concours.libelle || concours.sigle || concoursId;

    try {
      await emailService.createEmail({
        userId: membre.id,
        recipient: emailNormalise,
        subject: `UniPath — Accès ${roleLabel} ${concoursLabel}`,
        emailType: 'COMMISSION_CONCOURS_CREDENTIALS',
        htmlBody: `
          <h2>Bienvenue sur UniPath</h2>
          <p>Bonjour ${membre.prenom} ${membre.nom},</p>
          <p>Un compte <strong>${roleLabel}</strong> a été créé pour la commission du concours <strong>${concoursLabel}</strong>.</p>
          <p><strong>Email :</strong> ${emailNormalise}</p>
          <p><strong>Mot de passe temporaire :</strong> ${motDePasseTemporaire}</p>
          <p><strong>Validité :</strong> ${TEMP_PASSWORD_VALIDITY_HOURS} heures.</p>
          <p>Connectez-vous sur <a href="${loginUrl}">${loginUrl}</a> puis définissez votre mot de passe personnel.</p>
        `,
        textBody: `Bonjour ${membre.prenom} ${membre.nom}, compte ${roleLabel} UniPath pour ${concoursLabel} : ${emailNormalise} / ${motDePasseTemporaire} (valable ${TEMP_PASSWORD_VALIDITY_HOURS}h). Connexion : ${loginUrl}`,
      });
    } catch (emailErr) {
      logger.error('[CommissionConcours] Email non envoyé', {
        membreId: membre.id,
        error: emailErr.message,
      });
    }

    return res.status(201).json({
      message: 'Membre de commission créé. Un email avec les identifiants a été envoyé.',
      membre,
    });
  } catch (error) {
    logger.error('[CommissionConcours] Erreur creerMembre', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur lors de la création du membre' });
  }
};

exports.supprimerMembre = async (req, res) => {
  try {
    const { concoursId, membreId } = req.params;

    const membre = await prisma.membreCommission.findFirst({
      where: { id: membreId, concoursId },
    });

    if (!membre) {
      return res.status(404).json({ error: 'Membre de commission non trouvé pour ce concours' });
    }

    await prisma.membreCommission.delete({ where: { id: membreId } });

    try {
      await supabaseAdmin.auth.admin.deleteUser(membreId);
    } catch (supabaseErr) {
      logger.error('[CommissionConcours] Suppression Supabase échouée', {
        membreId,
        error: supabaseErr.message,
      });
    }

    return res.json({ message: 'Membre de commission supprimé avec succès' });
  } catch (error) {
    logger.error('[CommissionConcours] Erreur supprimerMembre', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
