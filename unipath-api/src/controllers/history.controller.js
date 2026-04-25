// src/controllers/history.controller.js
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Exécute un script PHP et retourne le résultat
 */
const executePHPScript = (scriptPath, args = []) => {
  return new Promise((resolve, reject) => {
    const argsString = args.map(arg => `"${arg}"`).join(' ');
    const command = `php "${scriptPath}" ${argsString}`;
    
    exec(command, { cwd: path.join(__dirname, '../../') }, (error, stdout, stderr) => {
      if (error) {
        console.error('Erreur exécution PHP:', error);
        reject(new Error(`Erreur PHP: ${error.message}`));
        return;
      }
      
      if (stderr) {
        console.warn('Avertissement PHP:', stderr);
      }
      
      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (parseError) {
        console.error('Erreur parsing JSON:', parseError);
        console.error('Sortie PHP:', stdout);
        reject(new Error('Erreur de format de réponse PHP'));
      }
    });
  });
};

/**
 * GET /api/history/:dossierId
 * Obtient l'historique des actions pour un dossier
 */
exports.getHistorique = async (req, res) => {
  try {
    const { dossierId } = req.params;
    const { 
      dateDebut, 
      dateFin, 
      utilisateur, 
      typeAction, 
      limite = 50, 
      offset = 0 
    } = req.query;
    
    // Vérifier que le dossier existe
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: {
        candidat: {
          select: { nom: true, prenom: true, email: true }
        }
      }
    });
    
    if (!dossier) {
      return res.status(404).json({
        error: 'Dossier non trouvé',
      });
    }
    
    // Construire les filtres
    const filtres = {};
    if (dateDebut && dateFin) {
      filtres.dateDebut = dateDebut;
      filtres.dateFin = dateFin;
    }
    if (utilisateur) {
      filtres.utilisateur = utilisateur;
    }
    if (typeAction) {
      filtres.typeAction = typeAction;
    }
    
    // Appeler le module PHP
    try {
      const scriptPath = path.join(__dirname, '../../php-scripts/history-wrapper.php');
      const args = [
        'obtenirHistorique',
        dossierId,
        JSON.stringify(filtres),
        limite.toString(),
        offset.toString()
      ];
      
      const result = await executePHPScript(scriptPath, args);
      
      // Enrichir avec les informations du dossier
      const response = {
        ...result,
        dossier: {
          id: dossier.id,
          candidat: dossier.candidat
        }
      };
      
      res.json(response);
      
    } catch (phpError) {
      console.error('Erreur module PHP:', phpError);
      
      // Fallback avec Prisma
      const whereClause = { dossierId };
      
      if (dateDebut && dateFin) {
        whereClause.timestamp = {
          gte: new Date(dateDebut),
          lte: new Date(dateFin)
        };
      }
      if (utilisateur) {
        whereClause.utilisateurId = utilisateur;
      }
      if (typeAction) {
        whereClause.typeAction = typeAction;
      }
      
      const [actions, total] = await Promise.all([
        prisma.actionHistory.findMany({
          where: whereClause,
          orderBy: { timestamp: 'desc' },
          take: parseInt(limite),
          skip: parseInt(offset)
        }),
        prisma.actionHistory.count({ where: whereClause })
      ]);
      
      const fallbackResult = {
        dossierId,
        actions,
        pagination: {
          total,
          limite: parseInt(limite),
          offset: parseInt(offset),
          pages: Math.ceil(total / parseInt(limite))
        },
        filtres,
        timestamp: new Date().toISOString(),
        dossier: {
          id: dossier.id,
          candidat: dossier.candidat
        },
        source: 'fallback'
      };
      
      res.json(fallbackResult);
    }
    
  } catch (error) {
    console.error('Erreur getHistorique:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la récupération de l\'historique',
    });
  }
};

/**
 * POST /api/history/action
 * Enregistre une nouvelle action dans l'historique
 */
exports.enregistrerAction = async (req, res) => {
  try {
    const { dossierId, typeAction, details } = req.body;
    const utilisateurId = req.user.id;
    const userRole = req.userRole;
    
    // Validation des données
    if (!dossierId || !typeAction) {
      return res.status(400).json({
        error: 'dossierId et typeAction sont obligatoires',
      });
    }
    
    // Types d'actions autorisées selon le rôle
    const actionsAutorisees = {
      'CANDIDAT': ['DOSSIER_CREE', 'PIECE_AJOUTEE', 'PIECE_SUPPRIMEE', 'DOSSIER_SOUMIS', 'DOSSIER_MODIFIE'],
      'COMMISSION': ['DOSSIER_VALIDE', 'DOSSIER_REJETE', 'DOSSIER_MODIFIE'],
      'DGES': ['DOSSIER_VALIDE', 'DOSSIER_REJETE', 'DOSSIER_MODIFIE']
    };
    
    if (!actionsAutorisees[userRole]?.includes(typeAction)) {
      return res.status(403).json({
        error: `Action ${typeAction} non autorisée pour le rôle ${userRole}`,
      });
    }
    
    // Obtenir l'adresse IP et User Agent
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Appeler le module PHP
    try {
      const scriptPath = path.join(__dirname, '../../php-scripts/history-wrapper.php');
      const args = [
        'enregistrerAction',
        utilisateurId,
        dossierId,
        typeAction,
        JSON.stringify(details || {}),
        ipAddress,
        userAgent
      ];
      
      const result = await executePHPScript(scriptPath, args);
      
      if (result.success) {
        res.status(201).json({
          message: 'Action enregistrée avec succès',
          actionId: result.actionId,
          timestamp: result.timestamp
        });
      } else {
        res.status(500).json({
          error: 'Échec de l\'enregistrement de l\'action',
          details: result.error
        });
      }
      
    } catch (phpError) {
      console.error('Erreur module PHP:', phpError);
      
      // Fallback avec Prisma
      const action = await prisma.actionHistory.create({
        data: {
          utilisateurId,
          dossierId,
          typeAction,
          details: details ? JSON.stringify(details) : null,
          ipAddress,
          userAgent,
          timestamp: new Date()
        }
      });
      
      res.status(201).json({
        message: 'Action enregistrée avec succès (fallback)',
        actionId: action.id,
        timestamp: action.timestamp,
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('Erreur enregistrerAction:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de l\'enregistrement de l\'action',
    });
  }
};

/**
 * GET /api/history/audit/rapport
 * Génère un rapport d'audit des actions
 */
exports.genererRapportAudit = async (req, res) => {
  try {
    const { 
      dateDebut, 
      dateFin, 
      utilisateurs, 
      typesActions 
    } = req.query;
    
    // Construire les critères
    const criteres = {};
    if (dateDebut && dateFin) {
      criteres.dateDebut = dateDebut;
      criteres.dateFin = dateFin;
    }
    if (utilisateurs) {
      criteres.utilisateurs = Array.isArray(utilisateurs) ? utilisateurs : [utilisateurs];
    }
    if (typesActions) {
      criteres.typesActions = Array.isArray(typesActions) ? typesActions : [typesActions];
    }
    
    // Appeler le module PHP
    try {
      const scriptPath = path.join(__dirname, '../../php-scripts/history-wrapper.php');
      const args = ['genererRapportAudit', JSON.stringify(criteres)];
      
      const result = await executePHPScript(scriptPath, args);
      
      res.json(result);
      
    } catch (phpError) {
      console.error('Erreur module PHP:', phpError);
      
      // Fallback basique
      const whereClause = {};
      
      if (dateDebut && dateFin) {
        whereClause.timestamp = {
          gte: new Date(dateDebut),
          lte: new Date(dateFin)
        };
      }
      
      const actions = await prisma.actionHistory.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' }
      });
      
      const fallbackRapport = {
        criteres,
        statistiques: {
          totalActions: actions.length,
          parType: {},
          parUtilisateur: {},
          tentativesNonAutorisees: 0
        },
        actions,
        totalActions: actions.length,
        dateGeneration: new Date().toISOString(),
        source: 'fallback'
      };
      
      res.json(fallbackRapport);
    }
    
  } catch (error) {
    console.error('Erreur genererRapportAudit:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la génération du rapport d\'audit',
    });
  }
};

/**
 * GET /api/history/export/csv/:dossierId?
 * Exporte l'historique au format CSV
 */
exports.exporterCSV = async (req, res) => {
  try {
    const { dossierId } = req.params;
    const { 
      dateDebut, 
      dateFin, 
      utilisateur, 
      typeAction 
    } = req.query;
    
    // Construire les filtres
    const filtres = {};
    if (dateDebut && dateFin) {
      filtres.dateDebut = dateDebut;
      filtres.dateFin = dateFin;
    }
    if (utilisateur) {
      filtres.utilisateur = utilisateur;
    }
    if (typeAction) {
      filtres.typeAction = typeAction;
    }
    
    // Appeler le module PHP
    try {
      const scriptPath = path.join(__dirname, '../../php-scripts/history-wrapper.php');
      const args = dossierId 
        ? ['exporterCSV', dossierId, JSON.stringify(filtres)]
        : ['exporterCSV', 'null', JSON.stringify(filtres)];
      
      const result = await executePHPScript(scriptPath, args);
      
      // Configurer les headers pour le téléchargement CSV
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = dossierId 
        ? `historique_dossier_${dossierId}_${timestamp}.csv`
        : `historique_global_${timestamp}.csv`;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(result.contenu, 'utf8'));
      
      res.send(result.contenu);
      
    } catch (phpError) {
      console.error('Erreur module PHP:', phpError);
      
      // Fallback: export basique
      const whereClause = {};
      if (dossierId) {
        whereClause.dossierId = dossierId;
      }
      
      const actions = await prisma.actionHistory.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' }
      });
      
      // Générer CSV basique
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
        csvLines.push(line.map(field => `"${field}"`).join(','));
      });
      
      const csvContent = csvLines.join('\n');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `historique_fallback_${timestamp}.csv`;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    }
    
  } catch (error) {
    console.error('Erreur exporterCSV:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de l\'export CSV',
    });
  }
};