const prisma = require('../prisma');
const fs = require('fs');
const path = require('path');
const { getAdminEtablissementId, adminOwnsEtablissement } = require('../utils/admin-etablissement.helper');
const { supabaseAdmin } = require('../supabase');
const { FILIERE_PUBLIC_SELECT } = require('./filiere.controller');
const { toPublicLogoUrl, resolveStoredLogoUrl } = require('../utils/uploads.helper');

const LOGO_DIR = path.join(__dirname, '../../uploads/etablissements');

const ensureLogoDir = () => {
  if (!fs.existsSync(LOGO_DIR)) {
    fs.mkdirSync(LOGO_DIR, { recursive: true });
  }
};

const resolveLogoUrl = (etablissement) =>
  resolveStoredLogoUrl(etablissement?.logoUrl, etablissement?.id);

const enrichEtablissementPublic = (etablissement) => ({
  ...etablissement,
  logoUrl: resolveLogoUrl(etablissement),
});

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
          select: FILIERE_PUBLIC_SELECT,
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
    const { type } = req.query;
    const where = {};

    if (type) {
      const typeUpper = String(type).toUpperCase();
      if (['PUBLIC', 'PRIVE'].includes(typeUpper)) {
        where.type = typeUpper;
      }
    }

    const etablissements = await prisma.etablissement.findMany({
      where,
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { filieres: true, inscriptions: true } },
      },
    });

    return res.json({
      message: 'Etablissements recuperes avec succes',
      etablissements: etablissements.map(enrichEtablissementPublic),
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
        filieres: { select: FILIERE_PUBLIC_SELECT, orderBy: { nom: 'asc' } },
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
                  select: FILIERE_PUBLIC_SELECT,
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
      etablissements: etablissements.map(enrichEtablissementPublic),
    });
  } catch (error) {
    console.error('Erreur getEtablissementsPrives:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getEtablissementsPublics = async (req, res) => {
  try {
    const etablissements = await prisma.etablissement.findMany({
      where: { type: 'PUBLIC' },
      select: { id: true, nom: true, ville: true },
      orderBy: { nom: 'asc' },
    });

    return res.json({
      message: 'Etablissements publics recuperes avec succes',
      etablissements,
    });
  } catch (error) {
    console.error('Erreur getEtablissementsPublics:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getEtablissementById = async (req, res) => {
  try {
    const { id } = req.params;

    const now = new Date();

    const etablissement = await prisma.etablissement.findUnique({
      where: { id },
      include: {
        filieres: {
          select: FILIERE_PUBLIC_SELECT,
          orderBy: { nom: 'asc' },
        },
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
                  select: FILIERE_PUBLIC_SELECT,
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { dateCloture: 'asc' },
        },
      },
    });

    if (!etablissement) {
      return res.status(404).json({ error: 'Etablissement non trouve' });
    }

    return res.json({
      message: 'Etablissement recupere avec succes',
      etablissement: enrichEtablissementPublic(etablissement),
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

    if (req.userRole === 'ADMIN_ETABLISSEMENT' && !adminOwnsEtablissement(req, id)) {
      return res.status(403).json({ error: 'Accès réservé à votre établissement' });
    }

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
    const { hasSousRoleEtablissement, STAFF_STATS_ROLES } = require('../utils/admin-etablissement.helper');

    if (!hasSousRoleEtablissement(req, STAFF_STATS_ROLES)) {
      return res.status(403).json({ error: 'Accès aux statistiques réservé aux administrateurs et superviseurs' });
    }

    if (!adminOwnsEtablissement(req, id)) {
      return res.status(403).json({ error: 'Vous n\'avez pas accès aux statistiques de cet établissement' });
    }

    const etablissement = await prisma.etablissement.findUnique({
      where: { id },
      select: { id: true, nom: true, type: true },
    });

    if (!etablissement) {
      return res.status(404).json({ error: 'Etablissement non trouve' });
    }

    // Agrégation Prisma (évite la dépendance à v_statistiques_module2)
    const rows = await prisma.inscriptionAcademique.groupBy({
      by: ['filiereId', 'anneeAcademique', 'statut'],
      where: { etablissementId: id },
      _count: { _all: true },
    });

    const filiereIds = [...new Set(rows.map((r) => r.filiereId))];
    const filieres = filiereIds.length
      ? await prisma.filiere.findMany({
          where: { id: { in: filiereIds } },
          select: { id: true, nom: true, niveau: true },
        })
      : [];
    const filiereById = new Map(filieres.map((f) => [f.id, f]));

    const grouped = new Map();
    for (const row of rows) {
      const filiere = filiereById.get(row.filiereId);
      const key = `${row.filiereId}|${row.anneeAcademique || ''}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          etablissement: etablissement.nom,
          type: etablissement.type,
          filiere: filiere?.nom || 'Filière inconnue',
          niveau: filiere?.niveau || null,
          annee: row.anneeAcademique,
          total_inscrits: 0,
          valides: 0,
          redoublants: 0,
          taux_reussite: 0,
        });
      }
      const bucket = grouped.get(key);
      const count = row._count._all;
      bucket.total_inscrits += count;
      if (row.statut === 'VALIDE') bucket.valides += count;
      if (row.statut === 'REDOUBLANT') bucket.redoublants += count;
    }

    const statistiques = [...grouped.values()]
      .map((row) => ({
        ...row,
        taux_reussite: row.total_inscrits > 0
          ? Math.round((row.valides / row.total_inscrits) * 10000) / 100
          : 0,
      }))
      .sort((a, b) => {
        const anneeCmp = String(a.annee || '').localeCompare(String(b.annee || ''), 'fr');
        if (anneeCmp !== 0) return anneeCmp;
        return String(a.filiere || '').localeCompare(String(b.filiere || ''), 'fr');
      });

    // Inclure aussi les filières sans inscription (total 0) pour un tableau exploitable
    const filieresSansInscription = await prisma.filiere.findMany({
      where: {
        etablissementId: id,
        ...(filiereIds.length ? { id: { notIn: filiereIds } } : {}),
      },
      select: { nom: true, niveau: true },
      orderBy: { nom: 'asc' },
    });
    for (const f of filieresSansInscription) {
      statistiques.push({
        etablissement: etablissement.nom,
        type: etablissement.type,
        filiere: f.nom,
        niveau: f.niveau,
        annee: null,
        total_inscrits: 0,
        valides: 0,
        redoublants: 0,
        taux_reussite: 0,
      });
    }

    return res.json({
      message: 'Statistiques recuperees avec succes',
      statistiques,
    });
  } catch (error) {
    console.error('Erreur getStatistiquesEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getMonProfilEtablissement = async (req, res) => {
  try {
    const etablissementId = getAdminEtablissementId(req);
    if (!etablissementId) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }

    const etablissement = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      include: {
        filieres: {
          select: FILIERE_PUBLIC_SELECT,
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
        logoUrl: resolveLogoUrl(etablissement),
      },
    });
  } catch (error) {
    console.error('Erreur getMonProfilEtablissement:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateMonProfilEtablissement = async (req, res) => {
  try {
    const etablissementId = getAdminEtablissementId(req);
    if (!etablissementId) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
    }

    const {
      nom,
      type,
      ville,
      adresse,
      email,
      telephone,
      siteWeb,
      description,
      agrementMESRS,
      anneeCreation,
      facebook,
      instagram,
      linkedin,
    } = req.body;
    const data = {};
    if (nom !== undefined) data.nom = nom;
    if (ville !== undefined) data.ville = ville;
    if (adresse !== undefined) data.adresse = adresse;
    if (email !== undefined) data.email = email;
    if (telephone !== undefined) data.telephone = telephone?.trim() || null;
    if (siteWeb !== undefined) data.siteWeb = siteWeb?.trim() || null;
    if (description !== undefined) data.description = description?.trim() || null;
    if (agrementMESRS !== undefined) data.agrementMESRS = agrementMESRS?.trim() || null;
    if (facebook !== undefined) data.facebook = facebook?.trim() || null;
    if (instagram !== undefined) data.instagram = instagram?.trim() || null;
    if (linkedin !== undefined) data.linkedin = linkedin?.trim() || null;
    if (anneeCreation !== undefined) {
      if (anneeCreation === null || anneeCreation === '') {
        data.anneeCreation = null;
      } else {
        const year = Number(anneeCreation);
        if (!Number.isInteger(year) || year < 1800 || year > new Date().getFullYear()) {
          return res.status(400).json({ error: 'anneeCreation doit etre une annee valide' });
        }
        data.anneeCreation = year;
      }
    }
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
        logoUrl: resolveLogoUrl(etablissement),
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
    const etablissementId = getAdminEtablissementId(req);
    if (!etablissementId) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'établissement' });
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

    const logoUrl = toPublicLogoUrl(targetFilename);
    await prisma.etablissement.update({
      where: { id: etablissementId },
      data: { logoUrl },
    });

    return res.json({
      message: 'Logo telecharge avec succes',
      logoUrl,
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

