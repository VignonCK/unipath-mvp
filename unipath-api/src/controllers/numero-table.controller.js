const { COMMUNES_BENIN } = require('../constants/communes-benin.constants');
const {
  genererNumerosTableConcours,
  listerNumerosTableConcours,
} = require('../utils/numero-table.helper');
const prisma = require('../prisma');

exports.listerCommunes = async (_req, res) => {
  try {
    const db = await prisma.commune.findMany({
      orderBy: { code: 'asc' },
    });
    if (db.length > 0) {
      return res.json(db);
    }
    return res.json(COMMUNES_BENIN);
  } catch (error) {
    console.error('listerCommunes:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.genererNumerosTable = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const regenerer = req.body?.regenerer !== false;
    const result = await genererNumerosTableConcours(concoursId, { regenerer });
    if (!result.ok) {
      return res.status(result.status || 400).json({
        error: result.error,
        details: result.details,
      });
    }
    return res.json(result);
  } catch (error) {
    console.error('genererNumerosTable:', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
};

exports.listerNumerosTable = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const result = await listerNumerosTableConcours(concoursId);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    return res.json(result);
  } catch (error) {
    console.error('listerNumerosTable:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
