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
        peutVoirDetails: ['COMMISSION', 'CONTROLEUR', 'DGES'].includes(userRole)
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

/**
 * Calculer la complétude d'une inscription avec référence implicite
 */
exports.getCompletionInscription = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Récupérer l'inscription avec référence implicite
    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: {
        candidat: {
          include: { dossier: true }
        },
        concours: {
          select: {
            id: true,
            libelle: true,
            piecesRequises: true
          }
        },
        dossierInscription: true
      }
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    // Vérification des permissions
    if (userRole === 'CANDIDAT' && userId !== inscription.candidatId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Extraire les 4 pièces de base (référence implicite)
    const dossier = inscription.candidat.dossier;
    const piecesBase = ['acteNaissance', 'carteIdentite', 'photo', 'releve'];
    const piecesBasesPresentes = dossier 
      ? piecesBase.filter(p => dossier[p]).length 
      : 0;

    // Extraire la quittance
    const quittancePresente = inscription.dossierInscription?.quittanceUrl ? 1 : 0;

    // Extraire les pièces extras
    const piecesExtrasConfig = inscription.concours.piecesRequises?.extras || [];
    const piecesExtrasPresentes = piecesExtrasConfig.filter(
      p => inscription.dossierInscription?.piecesExtras?.[p.nom]
    ).length;

    // Calculer le pourcentage global
    const total = 4 + 1 + piecesExtrasConfig.length;
    const presentes = piecesBasesPresentes + quittancePresente + piecesExtrasPresentes;
    const pourcentage = Math.round((presentes / total) * 100);

    // Structurer la réponse avec indicateurs de source
    const response = {
      inscriptionId: inscription.id,
      candidat: {
        id: inscription.candidat.id,
        nom: inscription.candidat.nom,
        prenom: inscription.candidat.prenom
      },
      concours: {
        id: inscription.concours.id,
        libelle: inscription.concours.libelle
      },
      piecesBase: piecesBase.map(p => ({
        nom: p,
        statut: dossier?.[p] ? 'fournie' : 'manquante',
        source: 'dossier_personnel',
        url: dossier?.[p],
        uploadedAt: dossier?.[p] ? dossier.updatedAt : null
      })),
      piecesSpecifiques: [
        {
          nom: 'quittance',
          statut: quittancePresente ? 'fournie' : 'manquante',
          source: 'dossier_concours',
          url: inscription.dossierInscription?.quittanceUrl,
          uploadedAt: inscription.dossierInscription?.quittanceUrl ? inscription.dossierInscription.updatedAt : null,
          obligatoire: true
        },
        ...piecesExtrasConfig.map(p => ({
          nom: p.nom,
          statut: inscription.dossierInscription?.piecesExtras?.[p.nom] ? 'fournie' : 'manquante',
          source: 'dossier_concours',
          url: inscription.dossierInscription?.piecesExtras?.[p.nom],
          uploadedAt: inscription.dossierInscription?.piecesExtras?.[p.nom] ? inscription.dossierInscription.updatedAt : null,
          obligatoire: p.obligatoire || false
        }))
      ],
      completudeGlobale: {
        pourcentage,
        piecesPresentes: presentes,
        piecesRequises: total,
        estComplet: pourcentage === 100
      },
      dossierInscription: {
        id: inscription.dossierInscription?.id,
        statut: inscription.dossierInscription?.statut,
        createdAt: inscription.dossierInscription?.createdAt,
        updatedAt: inscription.dossierInscription?.updatedAt
      },
      permissions: {
        peutModifier: userRole === 'CANDIDAT' && userId === inscription.candidatId,
        peutVoirDetails: ['COMMISSION', 'CONTROLEUR', 'DGES'].includes(userRole)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Erreur getCompletionInscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer le dossier complet (vue agrégée pour commission)
 */
exports.getDossierComplet = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Vérifier les permissions (COMMISSION, CONTROLEUR, DGES uniquement)
    if (!['COMMISSION', 'CONTROLEUR', 'DGES'].includes(userRole)) {
      return res.status(403).json({ error: 'Accès refusé. Réservé à la commission.' });
    }

    // Récupérer l'inscription avec toutes les relations
    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: {
        candidat: {
          include: { dossier: true },
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            dateNaiss: true,
            lieuNaiss: true,
            dossier: true
          }
        },
        concours: {
          select: {
            id: true,
            libelle: true,
            etablissement: true,
            piecesRequises: true
          }
        },
        dossierInscription: true
      }
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    // Utiliser la même logique que getCompletionInscription
    const dossier = inscription.candidat.dossier;
    const piecesBase = ['acteNaissance', 'carteIdentite', 'photo', 'releve'];
    const piecesBasesPresentes = dossier 
      ? piecesBase.filter(p => dossier[p]).length 
      : 0;

    const quittancePresente = inscription.dossierInscription?.quittanceUrl ? 1 : 0;
    const piecesExtrasConfig = inscription.concours.piecesRequises?.extras || [];
    const piecesExtrasPresentes = piecesExtrasConfig.filter(
      p => inscription.dossierInscription?.piecesExtras?.[p.nom]
    ).length;

    const total = 4 + 1 + piecesExtrasConfig.length;
    const presentes = piecesBasesPresentes + quittancePresente + piecesExtrasPresentes;
    const pourcentage = Math.round((presentes / total) * 100);

    // Structurer la réponse avec informations de décision
    const response = {
      inscription: {
        id: inscription.id,
        numeroInscription: inscription.numeroInscription,
        note: inscription.note,
        createdAt: inscription.createdAt
      },
      candidat: inscription.candidat,
      concours: inscription.concours,
      piecesBase: piecesBase.map(p => ({
        nom: p,
        statut: dossier?.[p] ? 'fournie' : 'manquante',
        source: 'dossier_personnel',
        url: dossier?.[p],
        uploadedAt: dossier?.[p] ? dossier.updatedAt : null
      })),
      piecesSpecifiques: [
        {
          nom: 'quittance',
          statut: quittancePresente ? 'fournie' : 'manquante',
          source: 'dossier_concours',
          url: inscription.dossierInscription?.quittanceUrl,
          uploadedAt: inscription.dossierInscription?.quittanceUrl ? inscription.dossierInscription.updatedAt : null,
          obligatoire: true
        },
        ...piecesExtrasConfig.map(p => ({
          nom: p.nom,
          statut: inscription.dossierInscription?.piecesExtras?.[p.nom] ? 'fournie' : 'manquante',
          source: 'dossier_concours',
          url: inscription.dossierInscription?.piecesExtras?.[p.nom],
          uploadedAt: inscription.dossierInscription?.piecesExtras?.[p.nom] ? inscription.dossierInscription.updatedAt : null,
          obligatoire: p.obligatoire || false
        }))
      ],
      completude: {
        pourcentage,
        piecesPresentes: presentes,
        piecesRequises: total,
        estComplet: pourcentage === 100
      },
      dossierInscription: {
        id: inscription.dossierInscription?.id,
        statut: inscription.dossierInscription?.statut,
        commentaireRejet: inscription.dossierInscription?.commentaireRejet,
        commentaireSousReserve: inscription.dossierInscription?.commentaireSousReserve,
        decisionCommission: {
          par: inscription.dossierInscription?.decisionCommissionPar,
          date: inscription.dossierInscription?.decisionCommissionDate,
          commentaires: {
            rejet: inscription.dossierInscription?.commentaireRejet,
            sousReserve: inscription.dossierInscription?.commentaireSousReserve
          }
        },
        decisionControleur: {
          par: inscription.dossierInscription?.decisionControleurPar,
          date: inscription.dossierInscription?.decisionControleurDate,
          commentaire: inscription.dossierInscription?.commentaireControleur
        },
        createdAt: inscription.dossierInscription?.createdAt,
        updatedAt: inscription.dossierInscription?.updatedAt
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Erreur getDossierComplet:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};