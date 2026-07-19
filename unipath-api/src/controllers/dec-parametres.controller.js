const {
  getEnTetePdfStatus,
  setCustomEnTetePdf,
  restoreDefaultEnTetePdf,
  resolvePdfHeaderSync,
  getDefaultHeaderPath,
} = require('../utils/pdf-header-config.helper');
const fs = require('fs');

/**
 * GET /dec/parametres/en-tete-pdf
 */
exports.getEnTetePdf = async (req, res) => {
  try {
    const status = await getEnTetePdfStatus();
    return res.json(status);
  } catch (error) {
    console.error('getEnTetePdf:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement de l\'en-tête PDF' });
  }
};

/**
 * GET /dec/parametres/en-tete-pdf/image — image active (custom ou défaut)
 */
exports.getEnTetePdfImage = async (req, res) => {
  try {
    const resolved = resolvePdfHeaderSync();
    const filePath = resolved.path || getDefaultHeaderPath();
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Aucune image d\'en-tête disponible' });
    }
    const mime = resolved.mimeType
      || (filePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(filePath);
  } catch (error) {
    console.error('getEnTetePdfImage:', error);
    return res.status(500).json({ error: 'Erreur lors du chargement de l\'image' });
  }
};

/**
 * POST /dec/parametres/en-tete-pdf — multipart field "fichier"
 */
exports.uploadEnTetePdf = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'Aucun fichier reçu (champ « fichier »)' });
    }
    const result = await setCustomEnTetePdf({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      userId: req.user?.id,
    });
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    return res.json({
      message: 'En-tête PDF mis à jour. Il s\'appliquera à tous les prochains PDF générés.',
      ...result.status,
    });
  } catch (error) {
    console.error('uploadEnTetePdf:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'upload de l\'en-tête' });
  }
};

/**
 * DELETE /dec/parametres/en-tete-pdf — restaurer le bandeau MESRS par défaut
 */
exports.restoreEnTetePdf = async (req, res) => {
  try {
    const result = await restoreDefaultEnTetePdf({ userId: req.user?.id });
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    return res.json({
      message: 'En-tête par défaut (MESRS) restauré.',
      ...result.status,
    });
  } catch (error) {
    console.error('restoreEnTetePdf:', error);
    return res.status(500).json({ error: 'Erreur lors de la restauration' });
  }
};
