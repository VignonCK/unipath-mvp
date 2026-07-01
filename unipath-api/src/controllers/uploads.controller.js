const fs = require('fs');
const {
  resolveAbsoluteUploadPath,
  isPublicUploadPath,
  userCanAccessPrivateUpload,
} = require('../utils/uploads.helper');

function sendUploadFile(res, absolutePath) {
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: 'Fichier introuvable' });
  }

  return res.sendFile(absolutePath, (err) => {
    if (err && !res.headersSent) {
      console.error('Erreur envoi fichier upload:', err);
      res.status(500).json({ error: 'Impossible de servir le fichier' });
    }
  });
}

exports.servePublicUpload = (req, res) => {
  try {
    const relativePath = req.params.folder
      ? `${req.params.folder}/${req.params.filename}`
      : req.params.filename;

    const resolved = resolveAbsoluteUploadPath(relativePath);
    if (!resolved) {
      return res.status(400).json({ error: 'Chemin invalide' });
    }

    if (!isPublicUploadPath(resolved.safePath)) {
      return res.status(403).json({ error: 'Accès non autorisé à ce fichier' });
    }

    return sendUploadFile(res, resolved.absolutePath);
  } catch (error) {
    console.error('servePublicUpload error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.servePrivateUpload = (req, res) => {
  try {
    const relativePath = req.params.folder
      ? `${req.params.folder}/${req.params.filename}`
      : req.params.filename;

    const resolved = resolveAbsoluteUploadPath(relativePath);
    if (!resolved) {
      return res.status(400).json({ error: 'Chemin invalide' });
    }

    if (isPublicUploadPath(resolved.safePath)) {
      return res.status(403).json({
        error: 'Ce fichier est accessible via la route publique dédiée',
      });
    }

    if (!userCanAccessPrivateUpload(req, resolved.safePath)) {
      return res.status(403).json({ error: 'Accès non autorisé à ce fichier' });
    }

    return sendUploadFile(res, resolved.absolutePath);
  } catch (error) {
    console.error('servePrivateUpload error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
