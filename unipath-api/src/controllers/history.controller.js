// src/controllers/history.controller.js
const prisma = require('../prisma');
const { isEtudiantRole } = require('../constants/roles.constants');
const { adminOwnsEtablissement } = require('../utils/admin-etablissement.helper');

const COMMISSION_SOUS_ROLES_ECRITURE = ['EXAMINATEUR', 'CONTROLEUR'];

const ACTIONS_AUTORISEES = {
  COMMISSION: ['DOSSIER_VALIDE', 'DOSSIER_REJETE', 'DOSSIER_MODIFIE', 'DECISION_COMMISSION'],
  DEC: ['DOSSIER_VALIDE', 'DOSSIER_REJETE', 'DOSSIER_MODIFIE', 'DECISION_COMMISSION', 'DECISION_CONTROLEUR'],
  DGES: ['DOSSIER_VALIDE', 'DOSSIER_REJETE', 'DOSSIER_MODIFIE', 'DECISION_COMMISSION', 'DECISION_CONTROLEUR'],
  CONTROLEUR: ['DOSSIER_VALIDE', 'DOSSIER_REJETE', 'DOSSIER_MODIFIE', 'DECISION_CONTROLEUR'],
  ADMIN_ETABLISSEMENT: ['DOSSIER_VALIDE', 'DOSSIER_REJETE', 'DOSSIER_MODIFIE', 'DECISION_COMMISSION'],
};

function getRequestRole(req) {
  return req.userRole || req.user?.role;
}

function buildMandatoryActionDetails(req, clientDetails) {
  const auteurId = req.user?.id;
  const auteurRole = getRequestRole(req);

  if (!auteurId || !auteurRole) {
    return null;
  }

  const base = clientDetails && typeof clientDetails === 'object' && !Array.isArray(clientDetails)
    ? { ...clientDetails }
    : {};

  delete base.auteurId;
  delete base.auteurRole;

  return {
    ...base,
    auteurId,
    auteurRole,
  };
}

function canWriteHistory(req) {
  const role = getRequestRole(req);
  const sousRole = req.user?.sousRole;

  if (role === 'DEC' || role === 'DGES' || role === 'CONTROLEUR' || role === 'ADMIN_ETABLISSEMENT') {
    return true;
  }

  if (role === 'COMMISSION' && COMMISSION_SOUS_ROLES_ECRITURE.includes(sousRole)) {
    return true;
  }

  return false;
}

function assertHistoriqueReadAccess(req, dossierInscription) {
  const userRole = getRequestRole(req);

  if (isEtudiantRole(userRole) && dossierInscription.inscription.candidatId !== req.user.id) {
    return false;
  }

  return true;
}

async function assertAdminEtablissementHistoryWriteAccess(req, {
  dossierInscriptionId,
  applicationId,
  inscriptionId,
}) {
  const etablissementId = req.etablissementId || req.user?.etablissementId;
  if (!etablissementId) {
    return false;
  }

  if (applicationId) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { etablissementId: true },
    });
    if (!application || !adminOwnsEtablissement(req, application.etablissementId)) {
      return false;
    }
  }

  if (inscriptionId) {
    const inscriptionAcad = await prisma.inscriptionAcademique.findUnique({
      where: { id: inscriptionId },
      select: { etablissementId: true },
    });
    if (!inscriptionAcad || !adminOwnsEtablissement(req, inscriptionAcad.etablissementId)) {
      return false;
    }
  }

  const dossierInscription = await prisma.dossierInscription.findUnique({
    where: { id: dossierInscriptionId },
    include: {
      inscription: { select: { candidatId: true } },
    },
  });

  if (!dossierInscription) {
    return false;
  }

  const [application, inscriptionAcad] = await Promise.all([
    prisma.application.findFirst({
      where: {
        candidatId: dossierInscription.inscription.candidatId,
        etablissementId,
      },
      select: { id: true },
    }),
    prisma.inscriptionAcademique.findFirst({
      where: {
        candidatId: dossierInscription.inscription.candidatId,
        etablissementId,
      },
      select: { id: true },
    }),
  ]);

  return Boolean(application || inscriptionAcad);
}

exports.getHistorique = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;
    const { dateDebut, dateFin, utilisateur, typeAction, limite = 50, offset = 0 } = req.query;

    const dossierInscription = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
      include: {
        inscription: {
          include: {
            candidat: { select: { nom: true, prenom: true, email: true } },
            concours: { select: { libelle: true } },
          },
        },
      },
    });

    if (!dossierInscription) {
      return res.status(404).json({ error: 'Dossier d\'inscription non trouvé' });
    }

    if (!assertHistoriqueReadAccess(req, dossierInscription)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const whereClause = { dossierInscriptionId };
    if (dateDebut && dateFin) {
      whereClause.timestamp = { gte: new Date(dateDebut), lte: new Date(dateFin) };
    }
    if (utilisateur) whereClause.utilisateurId = utilisateur;
    if (typeAction) whereClause.typeAction = typeAction;

    const [actions, total] = await Promise.all([
      prisma.actionHistory.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limite, 10),
        skip: parseInt(offset, 10),
      }),
      prisma.actionHistory.count({ where: whereClause }),
    ]);

    res.json({
      dossierInscriptionId,
      inscription: {
        id: dossierInscription.inscription.id,
        numeroInscription: dossierInscription.inscription.numeroInscription,
        candidat: dossierInscription.inscription.candidat,
        concours: dossierInscription.inscription.concours,
      },
      actions,
      pagination: {
        total,
        limite: parseInt(limite, 10),
        offset: parseInt(offset, 10),
        pages: Math.ceil(total / parseInt(limite, 10)),
      },
    });
  } catch (error) {
    console.error('Erreur getHistorique:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de l\'historique' });
  }
};

exports.enregistrerAction = async (req, res) => {
  try {
    const { dossierInscriptionId, typeAction, details, applicationId, inscriptionId } = req.body;
    const userRole = getRequestRole(req);

    if (!canWriteHistory(req)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (!dossierInscriptionId || !typeAction) {
      return res.status(400).json({ error: 'dossierInscriptionId et typeAction sont obligatoires' });
    }

    const actionDetails = buildMandatoryActionDetails(req, details);
    if (!actionDetails) {
      return res.status(403).json({ error: 'Contexte auteur invalide' });
    }

    const auteurId = actionDetails.auteurId;
    const auteurRole = actionDetails.auteurRole;

    const dossierInscription = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
    });

    if (!dossierInscription) {
      return res.status(404).json({ error: 'Dossier d\'inscription non trouvé' });
    }

    if (userRole === 'ADMIN_ETABLISSEMENT') {
      const allowed = await assertAdminEtablissementHistoryWriteAccess(req, {
        dossierInscriptionId,
        applicationId,
        inscriptionId,
      });
      if (!allowed) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }

    const roleKey = userRole === 'COMMISSION' ? 'COMMISSION' : userRole;
    if (!ACTIONS_AUTORISEES[roleKey]?.includes(typeAction)) {
      return res.status(403).json({ error: `Action ${typeAction} non autorisée pour le rôle ${userRole}` });
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const action = await prisma.actionHistory.create({
      data: {
        utilisateurId: auteurId,
        dossierInscriptionId,
        typeAction,
        details: actionDetails,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      },
    });

    res.status(201).json({
      message: 'Action enregistrée avec succès',
      actionId: action.id,
      timestamp: action.timestamp,
      auteurId,
      auteurRole,
    });
  } catch (error) {
    console.error('Erreur enregistrerAction:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement de l\'action' });
  }
};

exports.genererRapportAudit = async (req, res) => {
  try {
    const userRole = getRequestRole(req);

    if (!['DEC', 'DGES', 'CONTROLEUR'].includes(userRole)) {
      return res.status(403).json({
        error: 'Accès refusé. Seuls les administrateurs DEC/DGES et contrôleurs peuvent générer des rapports d\'audit.',
      });
    }

    const { dateDebut, dateFin, utilisateurs, typesActions } = req.query;

    const whereClause = {};
    if (dateDebut && dateFin) {
      whereClause.timestamp = { gte: new Date(dateDebut), lte: new Date(dateFin) };
    }
    if (utilisateurs) {
      whereClause.utilisateurId = { in: Array.isArray(utilisateurs) ? utilisateurs : [utilisateurs] };
    }
    if (typesActions) {
      whereClause.typeAction = { in: Array.isArray(typesActions) ? typesActions : [typesActions] };
    }

    const actions = await prisma.actionHistory.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
    });

    const parType = {};
    const parUtilisateur = {};
    actions.forEach((a) => {
      parType[a.typeAction] = (parType[a.typeAction] || 0) + 1;
      parUtilisateur[a.utilisateurId] = (parUtilisateur[a.utilisateurId] || 0) + 1;
    });

    res.json({
      criteres: { dateDebut, dateFin, utilisateurs, typesActions },
      statistiques: { totalActions: actions.length, parType, parUtilisateur },
      actions,
      totalActions: actions.length,
      dateGeneration: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur genererRapportAudit:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la génération du rapport d\'audit' });
  }
};

exports.exporterCSV = async (req, res) => {
  try {
    const userRole = getRequestRole(req);

    if (!['DEC', 'DGES', 'CONTROLEUR'].includes(userRole)) {
      return res.status(403).json({
        error: 'Accès refusé. Seuls les administrateurs DEC/DGES et contrôleurs peuvent exporter des données d\'audit.',
      });
    }

    const { dossierInscriptionId } = req.params;
    const { dateDebut, dateFin, utilisateur, typeAction } = req.query;

    const whereClause = {};
    if (dossierInscriptionId) whereClause.dossierInscriptionId = dossierInscriptionId;
    if (dateDebut && dateFin) {
      whereClause.timestamp = { gte: new Date(dateDebut), lte: new Date(dateFin) };
    }
    if (utilisateur) whereClause.utilisateurId = utilisateur;
    if (typeAction) whereClause.typeAction = typeAction;

    const actions = await prisma.actionHistory.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
    });

    const headers = ['ID', 'Date/Heure', 'Utilisateur', 'DossierInscription', 'Action', 'Détails', 'IP'];
    const csvLines = [headers.join(',')];

    actions.forEach((action) => {
      const line = [
        action.id,
        action.timestamp.toISOString(),
        action.utilisateurId,
        action.dossierInscriptionId,
        action.typeAction,
        action.details ? JSON.stringify(action.details).replace(/"/g, '""') : '',
        action.ipAddress || '',
      ];
      csvLines.push(line.map((f) => `"${f}"`).join(','));
    });

    const csvContent = csvLines.join('\n');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = dossierInscriptionId
      ? `historique_dossier_inscription_${dossierInscriptionId}_${timestamp}.csv`
      : `historique_global_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Erreur exporterCSV:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'export CSV' });
  }
};

exports.getHistoriqueVerdicts = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;
    const userRole = getRequestRole(req);

    if (!['COMMISSION', 'CONTROLEUR', 'DEC', 'DGES'].includes(userRole)) {
      return res.status(403).json({
        error: 'Accès refusé. Seuls les membres de la commission, contrôleurs, DEC et DGES peuvent consulter l\'historique.',
      });
    }

    const dossierInscription = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
      include: {
        inscription: {
          include: {
            candidat: { select: { nom: true, prenom: true, email: true } },
            concours: { select: { libelle: true, etablissement: true } },
          },
        },
      },
    });

    if (!dossierInscription) {
      return res.status(404).json({ error: 'Dossier d\'inscription non trouvé' });
    }

    const actions = await prisma.actionHistory.findMany({
      where: {
        dossierInscriptionId,
        typeAction: {
          in: [
            'VERDICT_EXAMINATEUR_RENDU',
            'VERDICT_EXAMINATEUR_MODIFIE',
            'DECISION_CONTROLEUR_RENDUE',
            'DECISION_CONTROLEUR_MODIFIEE',
          ],
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    const utilisateurIds = [...new Set(actions.map((a) => a.utilisateurId))];
    const utilisateurs = await prisma.membreCommission.findMany({
      where: { id: { in: utilisateurIds } },
      select: { id: true, nom: true, prenom: true, sousRole: true },
    });
    const utilisateursMap = Object.fromEntries(
      utilisateurs.map((u) => [u.id, { nom: u.nom, prenom: u.prenom, sousRole: u.sousRole }]),
    );

    const actionsEnrichies = actions.map((action) => ({
      ...action,
      utilisateur: utilisateursMap[action.utilisateurId] || null,
    }));

    res.json({
      dossierInscriptionId,
      inscription: {
        numeroInscription: dossierInscription.inscription.numeroInscription,
        candidat: dossierInscription.inscription.candidat,
        concours: dossierInscription.inscription.concours,
      },
      actions: actionsEnrichies,
      total: actionsEnrichies.length,
    });
  } catch (error) {
    console.error('Erreur getHistoriqueVerdicts:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de l\'historique des verdicts' });
  }
};

module.exports = exports;
