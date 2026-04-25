// src/controllers/completion.controller.js
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Exécute un script PHP et retourne le résultat
 * @param {string} scriptPath Chemin vers le script PHP
 * @param {Array} args Arguments à passer au script
 * @returns {Promise<Object>} Résultat du script PHP
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
 * GET /api/completion/:candidatId
 * Obtient le pourcentage de complétude d'un dossier candidat
 */
exports.getCompletion = async (req, res) => {
  try {
    const { candidatId } = req.params;
    const userId = req.user.id;
    const userRole = req.userRole;
    
    // Vérifier les permissions
    // Un candidat ne peut voir que son propre dossier
    if (userRole === 'CANDIDAT' && userId !== candidatId) {
      return res.status(403).json({
        error: 'Accès refusé. Vous ne pouvez consulter que votre propre dossier.',
      });
    }
    
    // Vérifier que le candidat existe
    const candidat = await prisma.candidat.findUnique({
      where: { id: candidatId },
      select: { id: true, nom: true, prenom: true, email: true }
    });
    
    if (!candidat) {
      return res.status(404).json({
        error: 'Candidat non trouvé',
      });
    }
    
    // Appeler le module PHP SystemeCompletion
    try {
      const scriptPath = path.join(__dirname, '../../php-scripts/completion-wrapper.php');
      const result = await executePHPScript(scriptPath, ['calculerPourcentage', candidatId]);
      
      // Enrichir avec les informations candidat
      const response = {
        ...result,
        candidat: {
          id: candidat.id,
          nom: candidat.nom,
          prenom: candidat.prenom,
          email: candidat.email
        },
        permissions: {
          peutModifier: userRole === 'CANDIDAT' && userId === candidatId,
          peutVoirDetails: ['COMMISSION', 'DGES'].includes(userRole)
        }
      };
      
      res.json(response);
      
    } catch (phpError) {
      console.error('Erreur module PHP:', phpError);
      
      // Fallback: calcul basique avec Prisma
      const dossier = await prisma.dossier.findUnique({
        where: { candidatId },
        select: {
          acteNaissance: true,
          carteIdentite: true,
          photo: true,
          releve: true,
          quittance: true,
          updatedAt: true
        }
      });
      
      const piecesRequises = ['acteNaissance', 'carteIdentite', 'photo', 'releve', 'quittance'];
      const piecesPresentes = dossier ? piecesRequises.filter(piece => dossier[piece]).length : 0;
      const pourcentage = Math.round((piecesPresentes / piecesRequises.length) * 100);
      
      const fallbackResult = {
        candidatId,
        pourcentage,
        piecesPresentes,
        piecesRequises: piecesRequises.length,
        piecesManquantes: dossier ? piecesRequises.filter(piece => !dossier[piece]) : piecesRequises,
        estComplet: pourcentage === 100,
        timestamp: new Date().toISOString(),
        candidat: {
          id: candidat.id,
          nom: candidat.nom,
          prenom: candidat.prenom,
          email: candidat.email
        },
        permissions: {
          peutModifier: userRole === 'CANDIDAT' && userId === candidatId,
          peutVoirDetails: ['COMMISSION', 'DGES'].includes(userRole)
        },
        source: 'fallback'
      };
      
      res.json(fallbackResult);
    }
    
  } catch (error) {
    console.error('Erreur getCompletion:', error);
    res.status(500).json({
      error: 'Erreur serveur lors du calcul de complétude',
    });
  }
};

/**
 * GET /api/completion/:candidatId/pieces
 * Obtient la liste des pièces manquantes pour un candidat
 */
exports.getPiecesManquantes = async (req, res) => {
  try {
    const { candidatId } = req.params;
    const userId = req.user.id;
    const userRole = req.userRole;
    
    // Vérifier les permissions
    if (userRole === 'CANDIDAT' && userId !== candidatId) {
      return res.status(403).json({
        error: 'Accès refusé. Vous ne pouvez consulter que votre propre dossier.',
      });
    }
    
    // Vérifier que le candidat existe
    const candidat = await prisma.candidat.findUnique({
      where: { id: candidatId },
      select: { id: true, nom: true, prenom: true }
    });
    
    if (!candidat) {
      return res.status(404).json({
        error: 'Candidat non trouvé',
      });
    }
    
    // Appeler le module PHP
    try {
      const scriptPath = path.join(__dirname, '../../php-scripts/completion-wrapper.php');
      const result = await executePHPScript(scriptPath, ['obtenirPiecesManquantes', candidatId]);
      
      res.json({
        candidatId,
        candidat: {
          nom: candidat.nom,
          prenom: candidat.prenom
        },
        piecesManquantes: result,
        timestamp: new Date().toISOString()
      });
      
    } catch (phpError) {
      console.error('Erreur module PHP:', phpError);
      
      // Fallback avec Prisma
      const dossier = await prisma.dossier.findUnique({
        where: { candidatId },
        select: {
          acteNaissance: true,
          carteIdentite: true,
          photo: true,
          releve: true,
          quittance: true
        }
      });
      
      const piecesRequises = ['acteNaissance', 'carteIdentite', 'photo', 'releve', 'quittance'];
      const piecesManquantes = dossier ? piecesRequises.filter(piece => !dossier[piece]) : piecesRequises;
      
      res.json({
        candidatId,
        candidat: {
          nom: candidat.nom,
          prenom: candidat.prenom
        },
        piecesManquantes,
        timestamp: new Date().toISOString(),
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('Erreur getPiecesManquantes:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la récupération des pièces manquantes',
    });
  }
};

/**
 * GET /api/completion/stats/global
 * Obtient les statistiques globales de complétude (COMMISSION/DGES uniquement)
 */
exports.getStatistiquesGlobales = async (req, res) => {
  try {
    const { concours, periode } = req.query;
    
    // Construire les critères de filtrage
    let candidatIds = [];
    
    if (concours) {
      // Filtrer par concours
      const inscriptions = await prisma.inscription.findMany({
        where: { concoursId: concours },
        select: { candidatId: true }
      });
      candidatIds = inscriptions.map(i => i.candidatId);
    }
    
    if (periode) {
      // Filtrer par période (à implémenter selon les besoins)
      // Pour l'instant, on prend tous les candidats
    }
    
    // Appeler le module PHP
    try {
      const scriptPath = path.join(__dirname, '../../php-scripts/completion-wrapper.php');
      const args = candidatIds.length > 0 ? ['obtenirStatistiques', JSON.stringify(candidatIds)] : ['obtenirStatistiques'];
      const result = await executePHPScript(scriptPath, args);
      
      res.json({
        ...result,
        filtres: {
          concours,
          periode
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (phpError) {
      console.error('Erreur module PHP:', phpError);
      
      // Fallback basique
      const totalCandidats = await prisma.candidat.count();
      const dossiersAvecPieces = await prisma.dossier.count({
        where: {
          OR: [
            { acteNaissance: { not: null } },
            { carteIdentite: { not: null } },
            { photo: { not: null } },
            { releve: { not: null } },
            { quittance: { not: null } }
          ]
        }
      });
      
      const fallbackStats = {
        totalCandidats,
        dossiersComplets: 0, // Nécessiterait un calcul plus complexe
        dossiersPartiels: dossiersAvecPieces,
        dossiersVides: totalCandidats - dossiersAvecPieces,
        pourcentageMoyen: 0,
        repartition: {
          '0%': totalCandidats - dossiersAvecPieces,
          '1-25%': 0,
          '26-50%': 0,
          '51-75%': 0,
          '76-99%': 0,
          '100%': 0
        },
        source: 'fallback'
      };
      
      res.json(fallbackStats);
    }
    
  } catch (error) {
    console.error('Erreur getStatistiquesGlobales:', error);
    res.status(500).json({
      error: 'Erreur serveur lors du calcul des statistiques',
    });
  }
};