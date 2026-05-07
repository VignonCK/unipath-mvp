const { supabaseAdmin } = require('../supabase');
const prisma = require('../prisma');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorise.'));
    }
  },
});

const uploadToSupabase = async (file, candidatId, typePiece) => {
  const ext = file.originalname.split('.').pop();
  const fileName = candidatId + '/' + typePiece + '-' + Date.now() + '.' + ext;

  const { error } = await supabaseAdmin.storage
    .from('dossiers-candidats')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabaseAdmin.storage
    .from('dossiers-candidats')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

// Pièces de base du dossier candidat
const PIECES_DOSSIER_BASE = ['acteNaissance', 'carteIdentite', 'photo', 'releve'];

exports.uploadPiece = [
  upload.single('fichier'),
  async (req, res) => {
    try {
      const typePiece = req.body.typePiece;

      if (!typePiece) {
        return res.status(400).json({ error: 'Type de piece manquant' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier recu' });
      }

      const fileUrl = await uploadToSupabase(req.file, req.user.id, typePiece);

      // Si c'est une pièce de base → on met à jour le dossier
      if (PIECES_DOSSIER_BASE.includes(typePiece)) {
        const dossier = await prisma.dossier.upsert({
          where: { candidatId: req.user.id },
          update: { [typePiece]: fileUrl },
          create: {
            candidatId: req.user.id,
            [typePiece]: fileUrl,
          },
        });
        return res.json({
          message: typePiece + ' uploade avec succes',
          url: fileUrl,
          dossier,
        });
      }

      // Si c'est une pièce personnalisée → on retourne juste l'URL
      // Elle sera sauvegardée dans Inscription.piecesExtras via une autre route
      return res.json({
        message: typePiece + ' uploade avec succes',
        url: fileUrl,
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Erreur lors du upload' });
    }
  },
];

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