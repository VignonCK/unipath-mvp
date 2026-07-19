// src/controllers/annee-academique.controller.js
const prisma = require('../prisma');
const {
  validateLibelleAnnee,
  getAnneeEnCoursDec,
  getAnneeEnCoursDges,
  enCoursFlag,
  SCOPE_DEC,
  SCOPE_DGES,
} = require('../utils/annee-academique.helper');

function resolveScope(req) {
  if (req.anneeScope === SCOPE_DGES) return SCOPE_DGES;
  if (String(req.baseUrl || '').includes('/dges')) return SCOPE_DGES;
  return SCOPE_DEC;
}

function mapAnneeForClient(annee, scope) {
  if (!annee) return null;
  const flag = enCoursFlag(scope);
  return {
    ...annee,
    // Compat UI : « enCours » = flag du module courant
    enCours: !!annee[flag],
    enCoursDec: !!annee.enCoursDec,
    enCoursDges: !!annee.enCoursDges,
  };
}

exports.lister = async (req, res) => {
  try {
    const scope = resolveScope(req);
    const flag = enCoursFlag(scope);
    const annees = await prisma.anneeAcademique.findMany({
      orderBy: { libelle: 'desc' },
      include: {
        _count: { select: { concours: true } },
      },
    });
    const mapped = annees.map((a) => mapAnneeForClient(a, scope));
    return res.json({
      message: 'Années académiques récupérées',
      scope,
      annees: mapped,
      anneeEnCours: mapped.find((a) => a[flag]) || null,
    });
  } catch (error) {
    console.error('Erreur lister années académiques:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getEnCours = async (req, res) => {
  try {
    const scope = resolveScope(req);
    const annee = scope === SCOPE_DGES
      ? await getAnneeEnCoursDges()
      : await getAnneeEnCoursDec();
    return res.json({
      message: scope === SCOPE_DGES
        ? 'Année académique en cours (Module 2 — DGES)'
        : 'Année académique en cours (Module 1 — DEC)',
      scope,
      annee: mapAnneeForClient(annee, scope),
    });
  } catch (error) {
    console.error('Erreur getEnCours:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.creer = async (req, res) => {
  try {
    const scope = resolveScope(req);
    const flag = enCoursFlag(scope);
    const validation = validateLibelleAnnee(req.body?.libelle);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const existing = await prisma.anneeAcademique.findUnique({
      where: { libelle: validation.libelle },
    });
    if (existing) {
      return res.status(409).json({ error: 'Cette année académique existe déjà.' });
    }

    const definirEnCours = req.body?.definirEnCours === true;
    const annee = await prisma.$transaction(async (tx) => {
      if (definirEnCours) {
        await tx.anneeAcademique.updateMany({
          where: { [flag]: true },
          data: { [flag]: false },
        });
      }
      return tx.anneeAcademique.create({
        data: {
          libelle: validation.libelle,
          enCoursDec: scope === SCOPE_DEC ? definirEnCours : false,
          enCoursDges: scope === SCOPE_DGES ? definirEnCours : false,
        },
        include: { _count: { select: { concours: true } } },
      });
    });

    const mapped = mapAnneeForClient(annee, scope);
    const actor = scope === SCOPE_DGES ? 'DGES (Module 2)' : 'DEC (Module 1)';
    return res.status(201).json({
      message: definirEnCours
        ? `Année ${annee.libelle} créée et définie comme année en cours ${actor}`
        : `Année ${annee.libelle} créée`,
      scope,
      annee: mapped,
    });
  } catch (error) {
    console.error('Erreur creer année académique:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.definirEnCours = async (req, res) => {
  try {
    const scope = resolveScope(req);
    const flag = enCoursFlag(scope);
    const { id } = req.params;
    const annee = await prisma.anneeAcademique.findUnique({ where: { id } });
    if (!annee) {
      return res.status(404).json({ error: 'Année académique introuvable' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.anneeAcademique.updateMany({
        where: { [flag]: true },
        data: { [flag]: false },
      });
      return tx.anneeAcademique.update({
        where: { id },
        data: { [flag]: true },
        include: { _count: { select: { concours: true } } },
      });
    });

    const actor = scope === SCOPE_DGES ? 'Module 2 (DGES)' : 'Module 1 (DEC)';
    return res.json({
      message: `Année ${updated.libelle} définie comme année académique en cours — ${actor}`,
      scope,
      annee: mapAnneeForClient(updated, scope),
    });
  } catch (error) {
    console.error('Erreur definirEnCours:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
