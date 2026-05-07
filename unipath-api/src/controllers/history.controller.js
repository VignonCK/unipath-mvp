// src/controllers/history.controller.js
const prisma = require('../prisma');

exports.getHistorique = async (req, res) => {
  try {
    const { dossierId } = req.params;
    const { dateDebut, dateFin, utilisateur, typeAction, limite = 50, offset = 0 } = req.query;

    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: { candidat: { select: { nom: true, prenom: true, email: true } } }
    });

    if (!dossier) return res.status(404).json({ error: 'Dossier non trouvé' });

    const whereClause = { dossierId };
    if (dateDebut && dateFin) {
      whereClause.timestamp = { gte: new Date(dateDebut), lte: new Date(dateFin) };
    }
    if (utilisateur) whereClause.utilisateurId = utilisateur;
    if (typeAction) whereClause.typeAction = typeAction;

    const [actions, total] = await Promise.all([
      prisma.actionHistory.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limite),
        skip: parseInt(offset)
      }),
      prisma.actionHistory.count({ where: whereClause })
    ]);

    res.json({
      dossierId,
      actions,
      pagination: {
        total,
        limite: parseInt(limite),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limite))
      },
      dossier: { id: dossier.id, candidat: dossier.candidat }
    });

  } catch (error) {
    console.error('Erreur getHistorique:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de l\'historique' });
  }
};

exports.enregistrerAction = async (req, res) => {
  try {
    const { dossierId, typeAction, details } = req.body;
    const utilisateurId = req.user.id;
    const userRole = req.user.role; // ✅ fix

    if (!dossierId || !typeAction) {
      return res.status(400).json({ error: 'dossierId et typeAction sont obligatoires' });
    }

    const actionsAutorisees = {
      'CANDIDAT':   ['DOSSIER_CREE', 'PIECE_AJOUTEE', 'PIECE_SUPPRIMEE', 'DOSSIER_SOUMIS', 'DOSSIER_MODIFIE'],
      'COMMISSION': ['DOSSIER_VALIDE', 'DOSSIER_REJETE', 'DOSSIER_MODIFIE'],
      'DGES':       ['DOSSIER_VALIDE', 'DOSSIER_REJETE', 'DOSSIER_MODIFIE'],
      'CONTROLEUR': ['DOSSIER_VALIDE', 'DOSSIER_REJETE', 'DOSSIER_MODIFIE'], // ✅ ajouté
    };

    if (!actionsAutorisees[userRole]?.includes(typeAction)) {
      return res.status(403).json({ error: `Action ${typeAction} non autorisée pour le rôle ${userRole}` });
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const action = await prisma.actionHistory.create({
      data: { utilisateurId, dossierId, typeAction, details: details || null, ipAddress, userAgent, timestamp: new Date() }
    });

    res.status(201).json({ message: 'Action enregistrée avec succès', actionId: action.id, timestamp: action.timestamp });

  } catch (error) {
    console.error('Erreur enregistrerAction:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement de l\'action' });
  }
};

exports.genererRapportAudit = async (req, res) => {
  try {
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
    const { dossierId } = req.params;
    const { dateDebut, dateFin, utilisateur, typeAction } = req.query;

    const whereClause = {};
    if (dossierId) whereClause.dossierId = dossierId;
    if (dateDebut && dateFin) {
      whereClause.timestamp = { gte: new Date(dateDebut), lte: new Date(dateFin) };
    }
    if (utilisateur) whereClause.utilisateurId = utilisateur;
    if (typeAction) whereClause.typeAction = typeAction;

    const actions = await prisma.actionHistory.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' }
    });

    const headers = ['ID', 'Date/Heure', 'Utilisateur', 'Dossier', 'Action', 'Détails', 'IP'];
    const csvLines = [headers.join(',')];

    actions.forEach(action => {
      const line = [
        action.id,
        action.timestamp.toISOString(),
        action.utilisateurId,
        action.dossierId,
        action.typeAction,
        action.details ? JSON.stringify(action.details).replace(/"/g, '""') : '',
        action.ipAddress || ''
      ];
      csvLines.push(line.map(f => `"${f}"`).join(','));
    });

    const csvContent = csvLines.join('\n');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = dossierId
      ? `historique_dossier_${dossierId}_${timestamp}.csv`
      : `historique_global_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Erreur exporterCSV:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'export CSV' });
  }
};