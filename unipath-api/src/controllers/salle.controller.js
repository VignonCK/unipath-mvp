const prisma = require('../prisma');

function parseCapacite(value) {
  if (value === undefined || value === null || value === '') {
    return { skip: false, value: null };
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    return { error: 'capacite doit être un entier >= 0' };
  }
  return { skip: false, value: n };
}

exports.creerSalle = async (req, res) => {
  try {
    const { centreId } = req.params;
    const { nom, capacite, actif } = req.body;

    if (!nom?.trim()) {
      return res.status(400).json({ error: 'nom requis' });
    }

    const centre = await prisma.centreComposition.findUnique({
      where: { id: centreId },
      select: { id: true },
    });
    if (!centre) {
      return res.status(404).json({ error: 'Centre de composition introuvable' });
    }

    const cap = parseCapacite(capacite);
    if (cap.error) {
      return res.status(400).json({ error: cap.error });
    }

    const salle = await prisma.salle.create({
      data: {
        nom: nom.trim(),
        capacite: cap.value,
        actif: actif === undefined ? true : Boolean(actif),
        centreCompositionId: centreId,
      },
    });

    return res.status(201).json(salle);
  } catch (error) {
    console.error('creerSalle error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.listerSalles = async (req, res) => {
  try {
    const { centreId } = req.params;
    const { actif } = req.query;

    const centre = await prisma.centreComposition.findUnique({
      where: { id: centreId },
      select: { id: true },
    });
    if (!centre) {
      return res.status(404).json({ error: 'Centre de composition introuvable' });
    }

    const where = { centreCompositionId: centreId };
    if (actif === 'true') where.actif = true;
    if (actif === 'false') where.actif = false;

    const salles = await prisma.salle.findMany({
      where,
      orderBy: [{ nom: 'asc' }],
    });

    return res.json({ salles });
  } catch (error) {
    console.error('listerSalles error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.modifierSalle = async (req, res) => {
  try {
    const { salleId } = req.params;
    const { nom, capacite, actif } = req.body;

    const existing = await prisma.salle.findUnique({ where: { id: salleId } });
    if (!existing) {
      return res.status(404).json({ error: 'Salle introuvable' });
    }

    const data = {};
    if (nom !== undefined) {
      if (!String(nom).trim()) {
        return res.status(400).json({ error: 'nom ne peut pas être vide' });
      }
      data.nom = String(nom).trim();
    }
    if (capacite !== undefined) {
      const cap = parseCapacite(capacite);
      if (cap.error) {
        return res.status(400).json({ error: cap.error });
      }
      data.capacite = cap.value;
    }
    if (actif !== undefined) {
      data.actif = Boolean(actif);
    }

    const salle = await prisma.salle.update({
      where: { id: salleId },
      data,
    });

    return res.json(salle);
  } catch (error) {
    console.error('modifierSalle error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.supprimerSalle = async (req, res) => {
  try {
    const { salleId } = req.params;

    const existing = await prisma.salle.findUnique({ where: { id: salleId } });
    if (!existing) {
      return res.status(404).json({ error: 'Salle introuvable' });
    }

    await prisma.salle.delete({ where: { id: salleId } });
    return res.json({ message: 'Salle supprimée', id: salleId });
  } catch (error) {
    console.error('supprimerSalle error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
