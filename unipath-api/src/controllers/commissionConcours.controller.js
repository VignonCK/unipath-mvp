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

function validerIdentiteCompte(body) {
  const { nom, prenom, email } = body;
  if (!nom?.trim() || !prenom?.trim() || !email?.trim()) {
    return 'nom, prenom et email sont obligatoires';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Adresse email invalide';
  }
  return null;
}

function validerSousRoleAssignation(sousRole) {
  const upper = String(sousRole || '').toUpperCase();
  if (!['EXAMINATEUR', 'CONTROLEUR'].includes(upper)) {
    return { error: 'Le sous-rôle doit être EXAMINATEUR ou CONTROLEUR' };
  }
  return { sousRole: upper };
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

async function syncAuthMetadata(membreId, { concoursId, etablissementId, sousRole }) {
  try {
    await supabaseAdmin.auth.admin.updateUserById(membreId, {
      user_metadata: buildMembreCommissionMetadata({
        concoursId: concoursId || null,
        etablissementId: etablissementId || null,
        sousRole,
      }),
    });
  } catch (err) {
    logger.error('[CommissionConcours] Sync metadata Auth échouée', {
      membreId,
      error: err.message,
    });
  }
}

exports.getCommission = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const {
      getCommissionStaffStatus,
      hasEtudeDejaOuverte,
    } = require('../utils/commission-etude.helper');

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
    const staff = await getCommissionStaffStatus(prisma, concoursId);

    const concoursRow = await prisma.concours.findUnique({
      where: { id: concoursId },
      select: { id: true, createdAt: true, etudeCloturee: true, etudeClotureeAt: true },
    });
    const etudeDejaOuverte = await hasEtudeDejaOuverte(prisma, concoursRow);

    return res.json({
      message: 'Commission récupérée avec succès',
      concours: {
        ...result.concours,
        etudeDejaOuverte,
      },
      membres,
      examinateurs,
      controleurs,
      peutOuvrirEtude: staff.peutOuvrirEtude,
      manquants: staff.manquants,
      nbExaminateurs: staff.nbExaminateurs,
      nbControleurs: staff.nbControleurs,
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

/**
 * POST /api/dges/commission/comptes
 * Crée un compte commission non assigné (concoursId=null, sousRole=MEMBRE).
 */
exports.creerCompte = async (req, res) => {
  try {
    const erreur = validerIdentiteCompte(req.body);
    if (erreur) {
      return res.status(400).json({ error: erreur });
    }

    const { nom, prenom, email, telephone } = req.body;
    const emailNormalise = email.trim().toLowerCase();

    const emailExistant = await prisma.membreCommission.findUnique({
      where: { email: emailNormalise },
    });
    if (emailExistant) {
      return res.status(409).json({
        error: 'Un compte commission avec cet email existe déjà',
        code: 'EMAIL_EXISTS',
      });
    }

    const motDePasseTemporaire = genererMotDePasseTemporaire();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailNormalise,
      password: motDePasseTemporaire,
      email_confirm: true,
      user_metadata: buildMembreCommissionMetadata({
        concoursId: null,
        etablissementId: null,
        sousRole: 'MEMBRE',
      }),
    });

    if (authError) {
      logger.error('[CommissionConcours] Erreur Supabase creerCompte', {
        error: authError.message,
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
        sousRole: 'MEMBRE',
        concoursId: null,
        etablissementId: null,
      },
      select: membreSelect,
    });

    const loginUrl = buildFrontendUrl('/login');
    try {
      await emailService.createEmail({
        userId: membre.id,
        recipient: emailNormalise,
        subject: 'UniPath — Compte commission créé',
        emailType: 'COMMISSION_CONCOURS_CREDENTIALS',
        htmlBody: `
          <h2>Bienvenue sur UniPath</h2>
          <p>Bonjour ${membre.prenom} ${membre.nom},</p>
          <p>Un compte <strong>commission</strong> a été créé. Vous serez affecté(e) à un concours par la DEC.</p>
          <p><strong>Email :</strong> ${emailNormalise}</p>
          <p><strong>Mot de passe temporaire :</strong> ${motDePasseTemporaire}</p>
          <p><strong>Validité :</strong> ${TEMP_PASSWORD_VALIDITY_HOURS} heures.</p>
          <p>Connectez-vous sur <a href="${loginUrl}">${loginUrl}</a> puis définissez votre mot de passe personnel.</p>
        `,
        textBody: `Bonjour ${membre.prenom} ${membre.nom}, compte commission UniPath : ${emailNormalise} / ${motDePasseTemporaire} (valable ${TEMP_PASSWORD_VALIDITY_HOURS}h). Connexion : ${loginUrl}`,
      });
    } catch (emailErr) {
      logger.error('[CommissionConcours] Email compte non envoyé', {
        membreId: membre.id,
        error: emailErr.message,
      });
    }

    return res.status(201).json({
      message: 'Compte commission créé (non assigné). Un email avec les identifiants a été envoyé.',
      membre,
    });
  } catch (error) {
    logger.error('[CommissionConcours] Erreur creerCompte', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur lors de la création du compte' });
  }
};

/**
 * GET /api/dges/commission/comptes?nonAssignes=1
 * Liste le pool de comptes sans concours.
 */
exports.listerComptes = async (req, res) => {
  try {
    const nonAssignes = String(req.query.nonAssignes || '') === '1'
      || String(req.query.nonAssignes || '').toLowerCase() === 'true';

    if (!nonAssignes) {
      return res.status(400).json({
        error: 'Paramètre nonAssignes=1 requis (liste du pool de comptes non assignés)',
        code: 'QUERY_REQUIRED',
      });
    }

    const comptes = await withPrismaRetry(() =>
      prisma.membreCommission.findMany({
        where: { concoursId: null },
        select: membreSelect,
        orderBy: [{ createdAt: 'desc' }],
      })
    );

    return res.json({
      message: 'Comptes non assignés récupérés',
      comptes,
      total: comptes.length,
    });
  } catch (error) {
    logger.error('[CommissionConcours] Erreur listerComptes', { error: error.message });
    if (isPrismaConnectionError(error)) {
      return res.status(503).json({
        error: 'Base de données temporairement indisponible.',
        code: 'DB_UNAVAILABLE',
      });
    }
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * POST /api/dges/concours/:concoursId/commission/assigner
 * Body: { membreId, sousRole }
 */
exports.assignerMembre = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const { membreId } = req.body || {};
    if (!membreId) {
      return res.status(400).json({ error: 'membreId est obligatoire' });
    }

    const roleCheck = validerSousRoleAssignation(req.body?.sousRole);
    if (roleCheck.error) {
      return res.status(400).json({ error: roleCheck.error });
    }
    const { sousRole } = roleCheck;

    const result = await getConcoursPublic(concoursId);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    const { concours } = result;
    const etablissementId = concours.etablissementId || null;

    const membre = await prisma.membreCommission.findUnique({
      where: { id: membreId },
      select: membreSelect,
    });
    if (!membre) {
      return res.status(404).json({ error: 'Compte commission introuvable', code: 'MEMBRE_NOT_FOUND' });
    }

    if (membre.concoursId) {
      if (membre.concoursId === concoursId) {
        return res.status(409).json({
          error: 'Ce compte est déjà assigné à ce concours',
          code: 'DEJA_ASSIGNE_ICI',
          concoursId: membre.concoursId,
        });
      }
      return res.status(409).json({
        error: 'Ce compte est déjà assigné à un autre concours (une personne = un seul concours)',
        code: 'DEJA_ASSIGNE',
        concoursId: membre.concoursId,
      });
    }

    const updated = await prisma.membreCommission.update({
      where: { id: membreId },
      data: {
        concoursId,
        etablissementId,
        sousRole,
      },
      select: membreSelect,
    });

    await syncAuthMetadata(membreId, { concoursId, etablissementId, sousRole });

    return res.status(200).json({
      message: 'Compte assigné à la commission du concours',
      membre: updated,
    });
  } catch (error) {
    logger.error('[CommissionConcours] Erreur assignerMembre', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur lors de l\'assignation' });
  }
};

/**
 * DELETE /api/dges/concours/:concoursId/commission/:membreId
 * Désassigne (concoursId=null, sousRole=MEMBRE) — ne supprime pas le compte Auth.
 */
exports.desassignerMembre = async (req, res) => {
  try {
    const { concoursId, membreId } = req.params;

    const membre = await prisma.membreCommission.findFirst({
      where: { id: membreId, concoursId },
      select: membreSelect,
    });

    if (!membre) {
      return res.status(404).json({ error: 'Membre non trouvé pour ce concours' });
    }

    const updated = await prisma.membreCommission.update({
      where: { id: membreId },
      data: {
        concoursId: null,
        etablissementId: null,
        sousRole: 'MEMBRE',
      },
      select: membreSelect,
    });

    await syncAuthMetadata(membreId, {
      concoursId: null,
      etablissementId: null,
      sousRole: 'MEMBRE',
    });

    return res.json({
      message: 'Membre désassigné — le compte reste disponible dans le pool',
      membre: updated,
    });
  } catch (error) {
    logger.error('[CommissionConcours] Erreur desassignerMembre', { error: error.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Ancien POST /api/dges/concours/:concoursId/commission — retiré (Phase 2).
 */
exports.creerMembreObsolete = async (_req, res) => {
  return res.status(410).json({
    error: 'Endpoint retiré. Utilisez POST /api/dges/commission/comptes puis POST /api/dges/concours/:concoursId/commission/assigner.',
    code: 'ENDPOINT_REMOVED',
  });
};

module.exports = exports;
