// src/controllers/completion.controller.js
const prisma = require('../prisma');

const PIECES_DOSSIER = ['acteNaissance', 'carteIdentite', 'photo', 'releve']; // ✅ sans quittance

exports.getCompletion = async (req, res) => {
  try {
    const { candidatId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role; // ✅ fix

    if (userRole === 'CANDIDAT' && userId !== candidatId) {
      return res.status(403).json({ error: 'Accès refusé. Vous ne pouvez consulter que votre propre dossier.' });
    }

    const candidat = await prisma.candidat.findUnique({
      where: { id: candidatId },
      select: { id: true, nom: true, prenom: true, email: true }
    });

    if (!candidat) return res.status(404).json({ error: 'Candidat non trouvé' });

    const dossier = await prisma.dossier.findUnique({
      where: { candidatId },
      select: { acteNaissance: true, carteIdentite: true, photo: true, releve: true, updatedAt: true }
    });

    const piecesPresentes = dossier ? PIECES_DOSSIER.filter(p => dossier[p]).length : 0;
    const pourcentage = Math.round((piecesPresentes / PIECES_DOSSIER.length) * 100);

    res.json({
      candidatId,
      pourcentage,
      piecesPresentes,
      piecesRequises: PIECES_DOSSIER.length,
      piecesManquantes: dossier ? PIECES_DOSSIER.filter(p => !dossier[p]) : PIECES_DOSSIER,
      estComplet: pourcentage === 100,
      timestamp: new Date().toISOString(),
      candidat: { id: candidat.id, nom: candidat.nom, prenom: candidat.prenom, email: candidat.email },
      permissions: {
        peutModifier: userRole === 'CANDIDAT' && userId === candidatId,
        peutVoirDetails: ['COMMISSION', 'DGES'].includes(userRole)
      }
    });

  } catch (error) {
    console.error('Erreur getCompletion:', error);
    res.status(500).json({ error: 'Erreur serveur lors du calcul de complétude' });
  }
};

exports.getPiecesManquantes = async (req, res) => {
  try {
    const { candidatId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role; // ✅ fix

    if (userRole === 'CANDIDAT' && userId !== candidatId) {
      return res.status(403).json({ error: 'Accès refusé. Vous ne pouvez consulter que votre propre dossier.' });
    }

    const candidat = await prisma.candidat.findUnique({
      where: { id: candidatId },
      select: { id: true, nom: true, prenom: true }
    });

    if (!candidat) return res.status(404).json({ error: 'Candidat non trouvé' });

    const dossier = await prisma.dossier.findUnique({
      where: { candidatId },
      select: { acteNaissance: true, carteIdentite: true, photo: true, releve: true }
    });

    const piecesManquantes = dossier ? PIECES_DOSSIER.filter(p => !dossier[p]) : PIECES_DOSSIER;

    res.json({
      candidatId,
      candidat: { nom: candidat.nom, prenom: candidat.prenom },
      piecesManquantes,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur getPiecesManquantes:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des pièces manquantes' });
  }
};

exports.getStatistiquesGlobales = async (req, res) => {
  try {
    const { concours } = req.query;

    let candidatIds = null;
    if (concours) {
      const inscriptions = await prisma.inscription.findMany({
        where: { concoursId: concours },
        select: { candidatId: true }
      });
      candidatIds = inscriptions.map(i => i.candidatId);
    }

    const whereClause = candidatIds ? { candidatId: { in: candidatIds } } : {};

    const dossiers = await prisma.dossier.findMany({
      where: whereClause,
      select: { acteNaissance: true, carteIdentite: true, photo: true, releve: true }
    });

    const totalCandidats = await prisma.candidat.count();

    let complets = 0, partiels = 0, vides = 0;
    dossiers.forEach(d => {
      const nb = PIECES_DOSSIER.filter(p => d[p]).length;
      if (nb === PIECES_DOSSIER.length) complets++;
      else if (nb > 0) partiels++;
      else vides++;
    });

    res.json({
      totalCandidats,
      dossiersComplets: complets,
      dossiersPartiels: partiels,
      dossiersVides: totalCandidats - dossiers.length,
      pourcentageMoyen: dossiers.length > 0
        ? Math.round(dossiers.reduce((acc, d) => acc + PIECES_DOSSIER.filter(p => d[p]).length, 0) / (dossiers.length * PIECES_DOSSIER.length) * 100)
        : 0,
      filtres: { concours },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur getStatistiquesGlobales:', error);
    res.status(500).json({ error: 'Erreur serveur lors du calcul des statistiques' });
  }
};