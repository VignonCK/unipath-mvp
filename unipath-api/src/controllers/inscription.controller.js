const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { envoyerEmailPreInscription } = require('../services/email.service');

// Fonction pour vérifier si le dossier est complet
const verifierDossierComplet = async (candidatId) => {
  const dossier = await prisma.dossier.findUnique({
    where: { candidatId },
  });

  if (!dossier) {
    return {
      complet: false,
      piecesManquantes: ['acteNaissance', 'carteIdentite', 'photo', 'releve', 'quittance'],
      message: 'Aucun dossier trouvé. Veuillez créer votre dossier et télécharger toutes les pièces requises.',
    };
  }

  const piecesRequises = ['acteNaissance', 'carteIdentite', 'photo', 'releve', 'quittance'];
  const piecesManquantes = piecesRequises.filter(piece => !dossier[piece]);

  return {
    complet: piecesManquantes.length === 0,
    piecesManquantes,
    message: piecesManquantes.length > 0
      ? `Votre dossier est incomplet. Pièces manquantes : ${piecesManquantes.join(', ')}`
      : 'Votre dossier est complet',
  };
};

const genererFichePreInscription = (candidat, concours, inscription) => {
  return new Promise((resolve, reject) => {
    const tmpInput = path.join(os.tmpdir(), `preinscription_input_${Date.now()}.json`);
    const tmpOutput = path.join(os.tmpdir(), `preinscription_output_${Date.now()}.pdf`);

    const data = JSON.stringify({ candidat, concours, inscription });
    fs.writeFileSync(tmpInput, data);

    const phpScript = path.join(__dirname, '../../php/preinscription.php');
    const cmd = `php "${phpScript}" "${tmpInput}" "${tmpOutput}"`;

    exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
      fs.unlinkSync(tmpInput);
      if (error) {
        console.error('Erreur PHP preinscription:', stderr);
        return reject(error);
      }
      resolve(tmpOutput);
    });
  });
};

exports.creerInscription = async (req, res) => {
  try {
    const { concoursId } = req.body;
    const candidatId = req.user.id;

    // Vérifier si le dossier est complet avant de permettre l'inscription
    const verificationDossier = await verifierDossierComplet(candidatId);
    
    if (!verificationDossier.complet) {
      return res.status(400).json({
        error: 'Dossier incomplet',
        message: verificationDossier.message,
        piecesManquantes: verificationDossier.piecesManquantes,
        dossierComplet: false,
      });
    }

    const concours = await prisma.concours.findUnique({
      where: { id: concoursId },
    });

    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouve' });
    }

    const inscription = await prisma.inscription.create({
      data: {
        candidatId,
        concoursId,
        statut: 'EN_ATTENTE',
      },
      include: { concours: true },
    });

    const candidat = await prisma.candidat.findUnique({
      where: { id: candidatId },
    });

    // Générer la fiche de pré-inscription en PHP et envoyer par email
    genererFichePreInscription(candidat, concours, inscription)
      .then(async (pdfPath) => {
        await envoyerEmailPreInscription({
          candidatEmail: candidat.email,
          candidatNom: candidat.nom,
          candidatPrenom: candidat.prenom,
          concours: concours.libelle,
          numeroDossier: inscription.id.substring(0, 8).toUpperCase(),
          pdfPath,
        });
        // Supprimer le PDF temporaire après envoi
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      })
      .catch(err => console.error('Erreur generation fiche:', err));

    res.status(201).json({
      message: 'Inscription creee avec succes. Une fiche de pre-inscription vous a ete envoyee par email.',
      inscription,
      dossierComplet: true,
    });
  } catch (error) {
    if (error.code === 'P2010' || error.message?.includes('Conflit de dates')) {
      return res.status(409).json({
        error: 'Conflit de dates : vous etes deja inscrit a un concours pendant cette periode.',
      });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Vous etes deja inscrit a ce concours.',
      });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getMesInscriptions = async (req, res) => {
  try {
    const inscriptions = await prisma.inscription.findMany({
      where: { candidatId: req.user.id },
      include: { concours: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(inscriptions);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Nouvelle route pour vérifier l'état du dossier
exports.verifierDossier = async (req, res) => {
  try {
    const candidatId = req.user.id;
    const verification = await verifierDossierComplet(candidatId);
    
    res.json({
      dossierComplet: verification.complet,
      message: verification.message,
      piecesManquantes: verification.piecesManquantes,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};