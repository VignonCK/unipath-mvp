const prisma = require('../prisma');

const NIVEAUX = ['LICENCE', 'MASTER'];

exports.lister = async (req, res) => {
  try {
    const role = req.userRole || req.user?.role;
    const actifsSeulement = role !== 'DGES' || req.query?.actifs === '1' || req.query?.actifs === 'true';
    const where = actifsSeulement ? { actif: true } : {};

    const references = await prisma.filiereReference.findMany({
      where,
      orderBy: { nom: 'asc' },
    });

    return res.json({
      message: 'Catalogue de filières récupéré',
      references,
    });
  } catch (error) {
    console.error('Erreur lister FiliereReference:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.creer = async (req, res) => {
  try {
    const nom = String(req.body?.nom || '').trim();
    const niveauRaw = req.body?.niveau ? String(req.body.niveau).toUpperCase() : null;
    const niveau = niveauRaw && NIVEAUX.includes(niveauRaw) ? niveauRaw : null;

    if (!nom) {
      return res.status(400).json({ error: 'Le nom de la filière est obligatoire' });
    }

    const existing = await prisma.filiereReference.findUnique({ where: { nom } });
    if (existing) {
      return res.status(409).json({ error: 'Cette filière existe déjà dans le catalogue DGES.' });
    }

    const reference = await prisma.filiereReference.create({
      data: { nom, niveau, actif: true },
    });

    return res.status(201).json({
      message: `Filière « ${nom} » ajoutée au catalogue`,
      reference,
    });
  } catch (error) {
    console.error('Erreur creer FiliereReference:', error);
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Cette filière existe déjà dans le catalogue DGES.' });
    }
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.modifier = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.filiereReference.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Filière de référence introuvable' });
    }

    const data = {};
    if (req.body?.nom !== undefined) {
      const nom = String(req.body.nom).trim();
      if (!nom) return res.status(400).json({ error: 'Le nom ne peut pas être vide' });
      data.nom = nom;
    }
    if (req.body?.niveau !== undefined) {
      const niveauRaw = req.body.niveau ? String(req.body.niveau).toUpperCase() : null;
      if (niveauRaw && !NIVEAUX.includes(niveauRaw)) {
        return res.status(400).json({ error: 'Niveau invalide' });
      }
      data.niveau = niveauRaw;
    }
    if (req.body?.actif !== undefined) {
      data.actif = Boolean(req.body.actif);
    }

    const reference = await prisma.filiereReference.update({
      where: { id },
      data,
    });

    return res.json({ message: 'Catalogue mis à jour', reference });
  } catch (error) {
    console.error('Erreur modifier FiliereReference:', error);
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Ce nom existe déjà dans le catalogue.' });
    }
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.desactiver = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.filiereReference.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Filière de référence introuvable' });
    }

    const reference = await prisma.filiereReference.update({
      where: { id },
      data: { actif: false },
    });

    return res.json({ message: `« ${reference.nom} » retirée du catalogue actif`, reference });
  } catch (error) {
    console.error('Erreur desactiver FiliereReference:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
