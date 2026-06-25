const prisma = require('../prisma');
const { getAdminEtablissementId } = require('../utils/admin-etablissement.helper');

function slugifyCode(nom) {
  const base = String(nom || 'FIL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
    .slice(0, 12);
  return `${base || 'FIL'}-${Date.now().toString(36).toUpperCase()}`;
}

exports.getAllFilieres = async (req, res) => {
  try {
    const { etablissementId } = req.query;

    const filieres = await prisma.filiere.findMany({
      where: {
        ...(etablissementId ? { etablissementId } : {}),
      },
      include: {
        etablissement: {
          select: { id: true, nom: true, type: true, ville: true },
        },
      },
      orderBy: [{ niveau: 'asc' }, { nom: 'asc' }],
    });

    return res.json({
      message: 'Filieres recuperees avec succes',
      filieres,
    });
  } catch (error) {
    console.error('Erreur getAllFilieres:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.creerFiliereAdmin = async (req, res) => {
  try {
    const etablissementId = getAdminEtablissementId(req);
    if (!etablissementId) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }

    const { nom, code, niveau, dureeAnnees } = req.body;
    if (!nom?.trim() || !niveau || dureeAnnees === undefined || dureeAnnees === null) {
      return res.status(400).json({ error: 'nom, niveau et dureeAnnees sont obligatoires' });
    }

    const niveauUpper = String(niveau).toUpperCase();
    if (!['LICENCE', 'MASTER'].includes(niveauUpper)) {
      return res.status(400).json({ error: 'niveau doit être LICENCE ou MASTER' });
    }

    const duree = Number(dureeAnnees);
    if (!Number.isInteger(duree) || duree < 1 || duree > 10) {
      return res.status(400).json({ error: 'dureeAnnees doit être un entier entre 1 et 10' });
    }

    const codeFinal = (code?.trim() || slugifyCode(nom)).toUpperCase();

    const filiere = await prisma.filiere.create({
      data: {
        nom: nom.trim(),
        code: codeFinal,
        niveau: niveauUpper,
        dureeAnnees: duree,
        etablissementId,
      },
    });

    return res.status(201).json({
      message: 'Filière créée avec succès',
      filiere,
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Ce code de filière existe déjà' });
    }
    console.error('Erreur creerFiliereAdmin:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.modifierFiliereAdmin = async (req, res) => {
  try {
    const etablissementId = getAdminEtablissementId(req);
    if (!etablissementId) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }

    const { id } = req.params;
    const existing = await prisma.filiere.findUnique({ where: { id } });
    if (!existing || existing.etablissementId !== etablissementId) {
      return res.status(404).json({ error: 'Filière non trouvée' });
    }

    const { nom, niveau, dureeAnnees } = req.body;
    const data = {};
    if (nom?.trim()) data.nom = nom.trim();
    if (niveau) {
      const niveauUpper = String(niveau).toUpperCase();
      if (!['LICENCE', 'MASTER'].includes(niveauUpper)) {
        return res.status(400).json({ error: 'niveau doit être LICENCE ou MASTER' });
      }
      data.niveau = niveauUpper;
    }
    if (dureeAnnees !== undefined && dureeAnnees !== null) {
      const duree = Number(dureeAnnees);
      if (!Number.isInteger(duree) || duree < 1 || duree > 10) {
        return res.status(400).json({ error: 'dureeAnnees doit être un entier entre 1 et 10' });
      }
      data.dureeAnnees = duree;
    }

    const filiere = await prisma.filiere.update({
      where: { id },
      data,
    });

    return res.json({ message: 'Filière mise à jour', filiere });
  } catch (error) {
    console.error('Erreur modifierFiliereAdmin:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.supprimerFiliereAdmin = async (req, res) => {
  try {
    const etablissementId = getAdminEtablissementId(req);
    if (!etablissementId) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }

    const { id } = req.params;
    const existing = await prisma.filiere.findUnique({ where: { id } });
    if (!existing || existing.etablissementId !== etablissementId) {
      return res.status(404).json({ error: 'Filière non trouvée' });
    }

    const [apps, campagnes] = await Promise.all([
      prisma.application.count({ where: { filiereId: id } }),
      prisma.campagneFiliere.count({ where: { filiereId: id } }),
    ]);

    if (apps > 0 || campagnes > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer une filière utilisée dans une candidature ou une campagne',
      });
    }

    await prisma.filiere.delete({ where: { id } });
    return res.json({ message: 'Filière supprimée' });
  } catch (error) {
    console.error('Erreur supprimerFiliereAdmin:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

