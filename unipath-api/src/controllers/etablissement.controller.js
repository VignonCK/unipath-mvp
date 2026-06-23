const prisma = require('../prisma');
const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../supabase');

const LOGO_DIR = path.join(__dirname, '../../uploads/etablissements');

const ensureLogoDir = () => {
  if (!fs.existsSync(LOGO_DIR)) {
    fs.mkdirSync(LOGO_DIR, { recursive: true });
  }
};

const findEtablissementLogo = (etablissementId) => {
  ensureLogoDir();
  const files = fs.readdirSync(LOGO_DIR);
  const logo = files.find((name) => name.startsWith(`logo-${etablissementId}.`));
  if (!logo) return null;
  return `/uploads/etablissements/${logo}`;
};

const normalizeChoixFilieres = (body = {}) => {
  const choix = [body.choix1, body.choix2, body.choix3]
    .map((c) => (typeof c === 'string' ? c.trim() : ''))
    .filter(Boolean);

  if (choix.length !== 3) {
    return { error: 'Les trois choix de filière sont requis.' };
  }

  const normalized = choix.map((c) => c.toLowerCase());
  if (new Set(normalized).size !== 3) {
    return { error: 'Les trois choix de filière doivent être différents.' };
  }

  return { choix };
};

exports.rechercherParFilieres = async (req, res) => {
  try {
    const parsed = normalizeChoixFilieres(req.body);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const { choix } = parsed;
    const filiereFilter = {
      OR: choix.map((nom) => ({
        nom: { equals: nom, mode: 'insensitive' },
      })),
    };

    const etablissements = await prisma.etablissement.findMany({
      where: {
        type: 'PRIVE',
        filieres: { some: filiereFilter },
      },
      include: {
        filieres: {
          where: filiereFilter,
          orderBy: { nom: 'asc' },
        },
      },
      orderBy: { nom: 'asc' },
    });

    return res.json({
      message: `${etablissements.length} établissement(s) privé(s) trouvé(s)`,
      choix: {
        choix1: req.body.choix1,
        choix2: req.body.choix2,
        choix3: req.body.choix3,
      },
      etablissements,
    });
  } catch (error) {
    console.error('Erreur rechercherParFilieres:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de la recherche' });
  }
};

exports.getAllEtablissements = async (req, res) => {
  try {
    const etablissements = await prisma.etablissement.findMany({
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { filieres: true, inscriptions: true } },
      },
    });

    return res.json({
      message: 'Etablissements recuperes avec succes',
      etablissements,
    });
  } catch (error) {
    console.error('Erreur getAllEtablissements:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getEtablissementsPrives = async (req, res) => {
  try {
    const now = new Date();

    const etablissements = await prisma.etablissement.findMany({
      where: { type: 'PRIVE' },
      include: {
        filieres: { orderBy: { nom: 'asc' } },
        campagnes: {
          where: {
            statut: 'PUBLIEE',
            dateOuverture: { lte: now },
            dateCloture: { gte: now },
          },
          include: {
            filieres: {
              include: {
                filiere: {
                  select: { id: true, nom: true, code: true, niveau: true, dureeAnnees: true },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { dateCloture: 'asc' },
        },
      },
      orderBy: { nom: 'asc' },
    });

    return res.json({
      message: 'Etablissements prives recuperes avec succes',
      etablissements,
    });
  } catch (error) {
    console.error('Erreur getEtablissementsPrives:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getEtablissementById = async (req, res) => {
  try {
    const { id } = req.params;

    const etablissement = await prisma.etablissement.findUnique({
      where: { id },
      include: {
        filieres: {
          orderBy: { nom: 'asc' },
        },
      },
    });

    if (!etablissement) {
      return res.status(404).json({ error: 'Etablissement non trouve' });
    }

    return res.json({
      message: 'Etablissement recupere avec succes',
      etablissement,
    });
  } catch (error) {
    console.error('Erreur getEtablissementById:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getEtudiantsEtablissement = async (req, res) => {
  try {
    const { id } = req.params;
    const { filiere, annee } = req.query;

    const etablissement = await prisma.etablissement.findUnique({
      where: { id },
      select: { id: true, nom: true },
    });

    if (!etablissement) {
      return res.status(404).json({ error: 'Etablissement non trouve' });
    }

    const where = {
      etablissementId: id,
      ...(filiere ? { filiereId: filiere } : {}),
      ...(annee ? { anneeAcademique: annee } : {}),
    };

    const inscriptions = await prisma.inscriptionAcademique.findMany({
      where,
      include: {
        candidat: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        filiere: {
          select: {
            id: true,
            nom: true,
            code: true,
            niveau: true,
          },
        },
      },
      orderBy: [{ anneeAcademique: 'asc' }, { niveau: 'asc' }],
    });

    return res.json({
      message: 'Etudiants recuperes avec succes',
      etudiants: inscriptions,
    });
  } catch (error) {
    console.error('Erreur getEtudiantsEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getStatistiquesEtablissement = async (req, res) => {
  try {
    const { id } = req.params;

    const etablissement = await prisma.etablissement.findUnique({
      where: { id },
      select: { nom: true },
    });

    if (!etablissement) {
      return res.status(404).json({ error: 'Etablissement non trouve' });
    }

    const stats = await prisma.$queryRaw`
      SELECT *
      FROM v_statistiques_module2
      WHERE etablissement = ${etablissement.nom}
      ORDER BY annee ASC, filiere ASC
    `;

    return res.json({
      message: 'Statistiques recuperees avec succes',
      statistiques: stats,
    });
  } catch (error) {
    console.error('Erreur getStatistiquesEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getMonProfilEtablissement = async (req, res) => {
  try {
    const etablissementId = req.user?.id;
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const etablissement = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      include: {
        filieres: {
          select: { id: true, nom: true, code: true, niveau: true, dureeAnnees: true },
          orderBy: { nom: 'asc' },
        },
      },
    });

    if (!etablissement) {
      return res.status(404).json({ error: 'Etablissement non trouve' });
    }

    return res.json({
      message: 'Profil etablissement recupere avec succes',
      etablissement: {
        ...etablissement,
        logoUrl: findEtablissementLogo(etablissementId),
      },
    });
  } catch (error) {
    console.error('Erreur getMonProfilEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateMonProfilEtablissement = async (req, res) => {
  try {
    const etablissementId = req.user?.id;
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    const { nom, type, ville, adresse, email } = req.body;
    const data = {};
    if (nom !== undefined) data.nom = nom;
    if (ville !== undefined) data.ville = ville;
    if (adresse !== undefined) data.adresse = adresse;
    if (email !== undefined) data.email = email;
    if (type !== undefined) {
      const typeUpper = String(type).toUpperCase();
      if (!['PUBLIC', 'PRIVE'].includes(typeUpper)) {
        return res.status(400).json({ error: 'Le type doit etre PUBLIC ou PRIVE' });
      }
      data.type = typeUpper;
    }

    const etablissement = await prisma.etablissement.update({
      where: { id: etablissementId },
      data,
    });

    return res.json({
      message: 'Profil etablissement mis a jour avec succes',
      etablissement: {
        ...etablissement,
        logoUrl: findEtablissementLogo(etablissementId),
      },
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Cet email est deja utilise' });
    }
    console.error('Erreur updateMonProfilEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.uploadMonLogoEtablissement = async (req, res) => {
  try {
    const etablissementId = req.user?.id;
    if (!etablissementId) {
      return res.status(401).json({ error: 'Utilisateur non authentifie' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier recu' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Le logo doit etre une image (JPG, PNG, WEBP)' });
    }

    ensureLogoDir();
    const uploadedPath = req.file.path;
    const ext = path.extname(req.file.originalname) || path.extname(req.file.filename) || '.png';
    const targetFilename = `logo-${etablissementId}${ext.toLowerCase()}`;
    const targetPath = path.join(LOGO_DIR, targetFilename);

    const existing = fs.readdirSync(LOGO_DIR).filter((name) => name.startsWith(`logo-${etablissementId}.`));
    existing.forEach((name) => {
      const previousPath = path.join(LOGO_DIR, name);
      if (previousPath !== targetPath && fs.existsSync(previousPath)) {
        fs.unlinkSync(previousPath);
      }
    });

    fs.renameSync(uploadedPath, targetPath);

    return res.json({
      message: 'Logo telecharge avec succes',
      logoUrl: `/uploads/etablissements/${targetFilename}`,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Erreur uploadMonLogoEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur lors du telechargement du logo' });
  }
};

exports.createEtablissementDges = async (req, res) => {
  try {
    const { nom, type, ville, adresse, email } = req.body;

    if (!nom?.trim() || !type || !ville?.trim()) {
      return res.status(400).json({ error: 'nom, type et ville sont obligatoires' });
    }

    const typeUpper = String(type).toUpperCase();
    if (!['PUBLIC', 'PRIVE'].includes(typeUpper)) {
      return res.status(400).json({ error: 'Le type doit etre PUBLIC ou PRIVE' });
    }

    const emailNormalise = email?.trim() ? email.trim().toLowerCase() : null;
    if (emailNormalise) {
      const existant = await prisma.etablissement.findUnique({ where: { email: emailNormalise } });
      if (existant) {
        return res.status(409).json({ error: 'Un etablissement avec cet email existe deja' });
      }
    }

    const etablissement = await prisma.etablissement.create({
      data: {
        nom: nom.trim(),
        type: typeUpper,
        ville: ville.trim(),
        adresse: adresse?.trim() || null,
        email: emailNormalise,
      },
    });

    return res.status(201).json({
      message: 'Etablissement cree avec succes',
      etablissement,
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Cet email est deja utilise' });
    }
    console.error('Erreur createEtablissementDges:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de la creation' });
  }
};

exports.deleteEtablissementDges = async (req, res) => {
  try {
    const { etablissementId } = req.params;

    const etablissement = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      include: {
        admins: { select: { id: true } },
      },
    });

    if (!etablissement) {
      return res.status(404).json({ error: 'Etablissement non trouve' });
    }

    for (const admin of etablissement.admins) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(admin.id);
      } catch (err) {
        console.error('Suppression compte admin Supabase:', admin.id, err.message);
      }
    }

    if (etablissement.email) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(etablissementId);
      } catch {
        // L'id peut ne pas correspondre a un compte Supabase
      }
    }

    ensureLogoDir();
    const logos = fs.readdirSync(LOGO_DIR).filter((name) => name.startsWith(`logo-${etablissementId}.`));
    logos.forEach((name) => {
      const logoPath = path.join(LOGO_DIR, name);
      if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
    });

    await prisma.etablissement.delete({ where: { id: etablissementId } });

    return res.json({ message: 'Etablissement supprime avec succes' });
  } catch (error) {
    console.error('Erreur deleteEtablissementDges:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
};

