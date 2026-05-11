// src/controllers/history.controller.js
const prisma = require('../prisma');

exports.getHistorique = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;
    const { dateDebut, dateFin, utilisateur, typeAction, limite = 50, offset = 0 } = req.query;
    const userRole = req.user?.role;

    // Check permissions: COMMISSION, CONTROLEUR, DGES only
    if (!['COMMISSION', 'CONTROLEUR', 'DGES'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Accès refusé. Seuls les membres de la commission, contrôleurs et DGES peuvent consulter l\'historique.' 
      });
    }

    // Retrieve DossierInscription with inscription details
    const dossierInscription = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
      include: { 
        inscription: { 
          include: { 
            candidat: { select: { nom: true, prenom: true, email: true } },
            concours: { select: { nom: true, annee: true } }
          } 
        } 
      }
    });

    if (!dossierInscription) {
      return res.status(404).json({ error: 'Dossier d\'inscription non trouvé' });
    }

    // Build WHERE clause with dossierInscriptionId and optional filters
    const whereClause = { dossierInscriptionId };
    if (dateDebut && dateFin) {
      whereClause.timestamp = { gte: new Date(dateDebut), lte: new Date(dateFin) };
    }
    if (utilisateur) whereClause.utilisateurId = utilisateur;
    if (typeAction) whereClause.typeAction = typeAction;

    // Retrieve actions with pagination
    const [actions, total] = await Promise.all([
      prisma.actionHistory.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limite),
        skip: parseInt(offset)
      }),
      prisma.actionHistory.count({ where: whereClause })
    ]);

    // Return actions with inscription details
    res.json({
      dossierInscriptionId,
      inscription: {
        id: dossierInscription.inscription.id,
        numeroInscription: dossierInscription.inscription.numeroInscription,
        candidat: dossierInscription.inscription.candidat,
        concours: dossierInscription.inscription.concours
      },
      actions,
      pagination: {
        total,
        limite: parseInt(limite),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limite))
      }
    });

  } catch (error) {
    console.error('Erreur getHistorique:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de l\'historique' });
  }
};

exports.enregistrerAction = async (req, res) => {
  try {
    const { dossierInscriptionId, typeAction, details } = req.body;
    const utilisateurId = req.user.id;
    const userRole = req.user.role;

    if (!dossierInscriptionId || !typeAction) {
      return res.status(400).json({ error: 'dossierInscriptionId et typeAction sont obligatoires' });
    }

    // Verify DossierInscription exists
    const dossierInscription = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId }
    });

    if (!dossierInscription) {
      return res.status(404).json({ error: 'Dossier d\'inscription non trouvé' });
    }

    // Check role-based permissions for typeAction
    const actionsAutorisees = {
      'CANDIDAT':   ['DOSSIER_CONCOURS_CREE', 'PIECE_AJOUTEE', 'PIECE_SUPPRIMEE', 'DOSSIER_SOUMIS', 'DOSSIER_MODIFIE', 'PIECE_BASE_MISE_A_JOUR'],
      'COMMISSION': ['DOSSIER_VALIDE', 'DOSSIER_REJETE', 'DOSSIER_MODIFIE', 'DECISION_COMMISSION'],
      'DGES':       ['DOSSIER_VALIDE', 'DOSSIER_REJETE', 'DOSSIER_MODIFIE', 'DECISION_COMMISSION', 'DECISION_CONTROLEUR'],
      'CONTROLEUR': ['DOSSIER_VALIDE', 'DOSSIER_REJETE', 'DOSSIER_MODIFIE', 'DECISION_CONTROLEUR'],
    };

    if (!actionsAutorisees[userRole]?.includes(typeAction)) {
      return res.status(403).json({ error: `Action ${typeAction} non autorisée pour le rôle ${userRole}` });
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Create ActionHistory with dossierInscriptionId
    const action = await prisma.actionHistory.create({
      data: { 
        utilisateurId, 
        dossierInscriptionId, 
        typeAction, 
        details: details || null, 
        ipAddress, 
        userAgent, 
        timestamp: new Date() 
      }
    });

    res.status(201).json({ 
      message: 'Action enregistrée avec succès', 
      actionId: action.id, 
      timestamp: action.timestamp 
    });

  } catch (error) {
    console.error('Erreur enregistrerAction:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement de l\'action' });
  }
};

exports.genererRapportAudit = async (req, res) => {
  try {
    const userRole = req.user?.role;

    // Seuls DGES et CONTROLEUR peuvent générer des rapports d'audit globaux
    if (!['DGES', 'CONTROLEUR'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Accès refusé. Seuls les administrateurs DGES et contrôleurs peuvent générer des rapports d\'audit.' 
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
      orderBy: { timestamp: 'desc' }
    });

    const parType = {};
    const parUtilisateur = {};
    actions.forEach(a => {
      parType[a.typeAction] = (parType[a.typeAction] || 0) + 1;
      parUtilisateur[a.utilisateurId] = (parUtilisateur[a.utilisateurId] || 0) + 1;
    });

    res.json({
      criteres: { dateDebut, dateFin, utilisateurs, typesActions },
      statistiques: { totalActions: actions.length, parType, parUtilisateur },
      actions,
      totalActions: actions.length,
      dateGeneration: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur genererRapportAudit:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la génération du rapport d\'audit' });
  }
};

exports.exporterCSV = async (req, res) => {
  try {
    const userRole = req.user?.role;

    // Seuls DGES et CONTROLEUR peuvent exporter des données d'audit
    if (!['DGES', 'CONTROLEUR'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Accès refusé. Seuls les administrateurs DGES et contrôleurs peuvent exporter des données d\'audit.' 
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
      orderBy: { timestamp: 'desc' }
    });

    const headers = ['ID', 'Date/Heure', 'Utilisateur', 'DossierInscription', 'Action', 'Détails', 'IP'];
    const csvLines = [headers.join(',')];

    actions.forEach(action => {
      const line = [
        action.id,
        action.timestamp.toISOString(),
        action.utilisateurId,
        action.dossierInscriptionId,
        action.typeAction,
        action.details ? JSON.stringify(action.details).replace(/"/g, '""') : '',
        action.ipAddress || ''
      ];
      csvLines.push(line.map(f => `"${f}"`).join(','));
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