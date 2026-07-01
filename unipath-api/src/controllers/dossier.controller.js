const { supabaseAdmin } = require('../supabase');
const prisma = require('../prisma');
const { isEtudiantRole } = require('../constants/roles.constants');
const {
  BUCKET_DOSSIERS_CANDIDATS,
  sanitizeStorageRelativePath,
  createDossiersCandidatsSignedUrl,
  SIGNED_URL_DEFAULT_EXPIRES_IN,
} = require('../utils/storage.helper');

const uploadToSupabase = async (file, candidatId, typePiece) => {
  const ext = file.originalname.split('.').pop();
  const fileName = candidatId + '/' + typePiece + '-' + Date.now() + '.' + ext;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_DOSSIERS_CANDIDATS)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) throw new Error(error.message);

  return fileName;
};

// Pièces de base du dossier candidat
const PIECES_DOSSIER_BASE = ['acteNaissance', 'carteIdentite', 'photo', 'releve'];

exports.uploadPiece = async (req, res) => {
    try {
      const inscriptionId = req.params.inscriptionId || req.body.inscriptionId;
      const typePiece = req.body.typePiece
        || (String(req.originalUrl || '').includes('/quittance') ? 'quittance' : null);
      const candidatId = req.user.id;

      if (!typePiece) {
        return res.status(400).json({ error: 'Type de piece manquant' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier recu' });
      }

      // Upload vers Supabase (chemin objet stocké en base, pas d'URL publique)
      const storagePath = await uploadToSupabase(req.file, candidatId, typePiece);
      let signedUrl;
      try {
        signedUrl = await createDossiersCandidatsSignedUrl(storagePath);
      } catch (signErr) {
        console.error('Erreur URL signée après upload:', signErr);
        return res.status(500).json({ error: 'Fichier enregistré mais accès temporaire indisponible.' });
      }

      // ROUTAGE INTELLIGENT
      // Cas 1 : Pièce de base → Dossier Personnel
      if (PIECES_DOSSIER_BASE.includes(typePiece)) {
        const dossier = await prisma.dossier.upsert({
          where: { candidatId },
          update: { [typePiece]: storagePath },
          create: {
            candidatId,
            [typePiece]: storagePath,
          },
        });

        // Récupérer toutes les inscriptions du candidat pour impact multi-concours
        const inscriptions = await prisma.inscription.findMany({
          where: { candidatId },
          include: { 
            concours: { select: { libelle: true } },
            dossierInscription: { select: { id: true } }
          }
        });

        // Enregistrer l'action pour chaque dossier d'inscription
        for (const inscription of inscriptions) {
          if (inscription.dossierInscription) {
            await prisma.actionHistory.create({
              data: {
                utilisateurId: candidatId,
                dossierInscriptionId: inscription.dossierInscription.id,
                typeAction: 'PIECE_BASE_MISE_A_JOUR',
                details: { typePiece, url: storagePath },
                ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
              }
            });
          }
        }

        return res.json({
          message: `${typePiece} uploadee avec succes dans votre dossier personnel`,
          url: storagePath,
          signedUrl,
          dossier,
          impactInscriptions: inscriptions.length,
          inscriptionsAffectees: inscriptions.map(i => ({
            id: i.id,
            concours: i.concours.libelle
          }))
        });
      }

      // Cas 2 : Quittance → Dossier Concours
      if (typePiece === 'quittance') {
        if (!inscriptionId) {
          return res.status(400).json({ 
            error: 'inscriptionId requis pour uploader une quittance' 
          });
        }

        // Vérifier que l'inscription appartient au candidat
        const inscription = await prisma.inscription.findFirst({
          where: { id: inscriptionId, candidatId },
          include: { dossierInscription: true }
        });

        if (!inscription) {
          return res.status(404).json({ 
            error: 'Inscription non trouvee ou non autorisee' 
          });
        }

        // Mettre à jour le dossier d'inscription
        const dossierInscription = await prisma.dossierInscription.update({
          where: { inscriptionId },
          data: { quittanceUrl: storagePath }
        });

        // Enregistrer l'action
        await prisma.actionHistory.create({
          data: {
            utilisateurId: candidatId,
            dossierInscriptionId: dossierInscription.id,
            typeAction: 'QUITTANCE_AJOUTEE',
            details: { url: storagePath },
            ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        });

        return res.json({
          message: 'Quittance uploadee avec succes',
          url: storagePath,
          signedUrl,
          dossierInscription
        });
      }

      // Cas 3 : Pièce extra → Dossier Concours
      if (!inscriptionId) {
        return res.status(400).json({ 
          error: 'inscriptionId requis pour uploader une piece extra' 
        });
      }

      const inscription = await prisma.inscription.findFirst({
        where: { id: inscriptionId, candidatId },
        include: { dossierInscription: true }
      });

      if (!inscription) {
        return res.status(404).json({ 
          error: 'Inscription non trouvee ou non autorisee' 
        });
      }

      // Mettre à jour piecesExtras
      const piecesExtras = inscription.dossierInscription.piecesExtras || {};
      piecesExtras[typePiece] = storagePath;

      const dossierInscription = await prisma.dossierInscription.update({
        where: { inscriptionId },
        data: { piecesExtras }
      });

      // Enregistrer l'action
      await prisma.actionHistory.create({
        data: {
          utilisateurId: candidatId,
          dossierInscriptionId: dossierInscription.id,
          typeAction: 'PIECE_EXTRA_AJOUTEE',
          details: { typePiece, url: storagePath },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        }
      });

      return res.json({
        message: `${typePiece} uploadee avec succes`,
        url: storagePath,
        signedUrl,
        dossierInscription
      });

    } catch (error) {
      console.error('Erreur uploadPiece:', error);
      res.status(500).json({ error: error.message || 'Erreur lors de l\'upload' });
    }
};

exports.getDossier = async (req, res) => {
  try {
    const dossier = await prisma.dossier.findUnique({
      where: { candidatId: req.user.id },
    });
    res.json(dossier || { message: 'Aucun dossier trouve' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer le dossier personnel du candidat
 */
exports.getDossierPersonnel = async (req, res) => {
  try {
    const { candidatId } = req.params;
    const userId = req.user.id;
    const userRole = req.userRole || req.user?.role;

    // Vérification des permissions
    if (isEtudiantRole(userRole) && userId !== candidatId) {
      return res.status(403).json({ 
        error: 'Vous ne pouvez acceder qu\'a votre propre dossier' 
      });
    }

    // Récupérer le dossier avec le candidat
    const dossier = await prisma.dossier.findUnique({
      where: { candidatId },
      include: { candidat: { select: { nom: true, prenom: true, email: true } } }
    });

    // Compter les inscriptions utilisant ce dossier
    const inscriptionsCount = await prisma.inscription.count({
      where: { candidatId }
    });

    // Si le dossier n'existe pas, retourner une structure vide
    if (!dossier) {
      return res.json({
        id: null,
        candidatId,
        piecesBase: {
          acteNaissance: { url: null, uploadedAt: null, statut: 'manquante' },
          carteIdentite: { url: null, uploadedAt: null, statut: 'manquante' },
          photo: { url: null, uploadedAt: null, statut: 'manquante' },
          releve: { url: null, uploadedAt: null, statut: 'manquante' }
        },
        completude: {
          pourcentage: 0,
          piecesPresentes: 0,
          piecesRequises: 4
        },
        impactInscriptions: inscriptionsCount,
        createdAt: null,
        updatedAt: null
      });
    }

    // Calculer la complétude
    const piecesBase = ['acteNaissance', 'carteIdentite', 'photo', 'releve'];
    const piecesPresentes = piecesBase.filter(p => dossier[p]).length;
    const pourcentage = Math.round((piecesPresentes / 4) * 100);

    // Structurer la réponse
    const response = {
      id: dossier.id,
      candidatId: dossier.candidatId,
      candidat: dossier.candidat,
      piecesBase: {
        acteNaissance: {
          url: dossier.acteNaissance,
          uploadedAt: dossier.acteNaissance ? dossier.updatedAt : null,
          statut: dossier.acteNaissance ? 'fournie' : 'manquante'
        },
        carteIdentite: {
          url: dossier.carteIdentite,
          uploadedAt: dossier.carteIdentite ? dossier.updatedAt : null,
          statut: dossier.carteIdentite ? 'fournie' : 'manquante'
        },
        photo: {
          url: dossier.photo,
          uploadedAt: dossier.photo ? dossier.updatedAt : null,
          statut: dossier.photo ? 'fournie' : 'manquante'
        },
        releve: {
          url: dossier.releve,
          uploadedAt: dossier.releve ? dossier.updatedAt : null,
          statut: dossier.releve ? 'fournie' : 'manquante'
        }
      },
      completude: {
        pourcentage,
        piecesPresentes,
        piecesRequises: 4
      },
      impactInscriptions: inscriptionsCount,
      createdAt: dossier.createdAt,
      updatedAt: dossier.updatedAt
    };

    res.json(response);
  } catch (error) {
    console.error('Erreur getDossierPersonnel:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getSignedUrl = async (req, res) => {
  try {
    const { path: requestedPath } = req.query;

    if (!requestedPath) {
      return res.status(400).json({ error: 'Paramètre path requis' });
    }

    const sanitized = sanitizeStorageRelativePath(requestedPath);
    if (!sanitized.ok) {
      return res.status(400).json({ error: sanitized.error });
    }

    const { safePath } = sanitized;
    const userRole = req.userRole || req.user?.role;

    if (isEtudiantRole(userRole)) {
      const ownerPrefix = `${req.user.id}/`;
      if (!safePath.startsWith(ownerPrefix)) {
        return res.status(403).json({ error: 'Accès non autorisé à ce fichier' });
      }
    }

    if (userRole === 'ADMIN_ETABLISSEMENT') {
      const etablissementId = req.etablissementId || req.user?.etablissementId;
      const candidatId = safePath.split('/')[0];

      if (!etablissementId || !candidatId) {
        return res.status(403).json({ error: 'Accès non autorisé à ce fichier' });
      }

      const [application, inscriptionAcad] = await Promise.all([
        prisma.application.findFirst({
          where: { candidatId, etablissementId },
          select: { id: true },
        }),
        prisma.inscriptionAcademique.findFirst({
          where: { candidatId, etablissementId },
          select: { id: true },
        }),
      ]);

      if (!application && !inscriptionAcad) {
        return res.status(403).json({ error: 'Accès non autorisé à ce fichier' });
      }
    }

    let signedUrl;
    try {
      signedUrl = await createDossiersCandidatsSignedUrl(
        safePath,
        SIGNED_URL_DEFAULT_EXPIRES_IN,
      );
    } catch (signErr) {
      console.error('Erreur génération URL signée:', signErr);
      return res.status(500).json({ error: 'Impossible de générer l\'URL d\'accès.' });
    }

    res.json({ signedUrl, expiresIn: SIGNED_URL_DEFAULT_EXPIRES_IN });
  } catch (error) {
    console.error('getSignedUrl error:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

module.exports = exports;