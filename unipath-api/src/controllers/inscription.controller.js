const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { envoyerEmailPreInscription } = require('../services/email.service');

// Fonction pour générer un numéro d'inscription unique
function genererNumeroInscription(concours, candidat) {
  const annee = new Date().getFullYear();
  const codeEtablissement = 'UAC'; // Université d'Abomey-Calavi
  
  // Extraire les 3 premières lettres du concours (ex: MED pour Médecine)
  const codeConcours = concours.libelle
    .split(' ')[0]
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, ''); // Supprimer les caractères non alphabétiques
  
  // Générer un numéro séquentiel (timestamp + random pour unicité)
  const timestamp = Date.now().toString().slice(-5);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const sequence = timestamp + random;
  
  // Format: UAC-2026-MED-12345
  return `${codeEtablissement}-${annee}-${codeConcours}-${sequence}`;
}

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

    const phpScript = path.join(__dirname, '../../php/fiche-preinscription.php');
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

    const candidat = await prisma.candidat.findUnique({
      where: { id: candidatId },
    });

    // Vérifier la compatibilité de la série si le concours a des restrictions
    if (concours.seriesAcceptees && concours.seriesAcceptees.length > 0) {
      if (!candidat.serie) {
        return res.status(400).json({
          error: 'Série non renseignée',
          message: 'Vous devez renseigner votre série dans votre profil pour vous inscrire à ce concours.',
        });
      }
      
      if (!concours.seriesAcceptees.includes(candidat.serie)) {
        return res.status(400).json({
          error: 'Série non compatible',
          message: `Ce concours est réservé aux séries : ${concours.seriesAcceptees.join(', ')}. Votre série (${candidat.serie}) n'est pas acceptée.`,
        });
      }
    }

    // Générer le numéro d'inscription unique
    const numeroInscription = genererNumeroInscription(concours, candidat);

    const inscription = await prisma.inscription.create({
      data: {
        candidatId,
        concoursId,
        numeroInscription,
        statut: 'EN_ATTENTE',
      },
      include: { concours: true },
    });

    // Générer la fiche de pré-inscription en PHP et envoyer par email
    genererFichePreInscription(candidat, concours, inscription)
      .then(async (pdfPath) => {
        await envoyerEmailPreInscription({
          candidatEmail: candidat.email,
          candidatNom: candidat.nom,
          candidatPrenom: candidat.prenom,
          concours: concours.libelle,
          numeroDossier: inscription.numeroInscription,
        }, pdfPath);  // Passer le chemin en 2ème paramètre
        // Supprimer le PDF temporaire après envoi
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      })
      .catch(err => console.error('Erreur generation fiche:', err));

    res.status(201).json({
      message: 'Inscription creee avec succes. Une fiche de pre-inscription vous a ete envoyee par email.',
      inscription,
      numeroInscription: inscription.numeroInscription,
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
    console.error('Erreur creerInscription:', error);
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


// Upload de la quittance pour une inscription spécifique
exports.uploadQuittanceInscription = async (req, res) => {
  try {
    const { inscriptionId } = req.params;
    const candidatId = req.user.id;

    // Vérifier que l'inscription appartient bien au candidat
    const inscription = await prisma.inscription.findFirst({
      where: {
        id: inscriptionId,
        candidatId: candidatId,
      },
    });

    if (!inscription) {
      return res.status(404).json({ error: 'Inscription non trouvée ou non autorisée' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // L'URL du fichier est déjà dans req.file.path (géré par Multer + Supabase Storage)
    const quittanceUrl = req.file.path;

    // Mettre à jour l'inscription avec l'URL de la quittance
    const updated = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: { quittanceUrl },
    });

    res.json({
      message: 'Quittance uploadée avec succès',
      quittanceUrl,
      inscription: updated,
    });
  } catch (error) {
    console.error('Erreur upload quittance inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
