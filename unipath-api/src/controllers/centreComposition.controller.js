const prisma = require('../prisma');
const { resolveCommuneCode } = require('../constants/communes-benin.constants');
const { allocuerCodeCentre } = require('../utils/numero-table.helper');

function mapConcoursCentreRow(row) {
  const inscritsCount = row._count?.dossiers ?? 0;
  return {
    id: row.id,
    concoursId: row.concoursId,
    centreId: row.centreId,
    anneeAcademique: row.anneeAcademique,
    capacite: row.capacite,
    estActif: row.estActif,
    createdAt: row.createdAt,
    centre: row.centre,
    inscritsCount,
    placesRestantes: row.capacite != null
      ? Math.max(0, row.capacite - inscritsCount)
      : null,
  };
}

exports.creerCentre = async (req, res) => {
  try {
    const { nom, ville, adresse, telephone } = req.body;
    if (!nom?.trim() || !ville?.trim()) {
      return res.status(400).json({ error: 'Nom et ville requis' });
    }

    const villeTrim = ville.trim();
    let centreCode;
    try {
      centreCode = await allocuerCodeCentre();
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Impossible d\'attribuer un code centre' });
    }

    const centre = await prisma.centreComposition.create({
      data: {
        nom: nom.trim(),
        ville: villeTrim,
        communeCode: resolveCommuneCode(villeTrim),
        code: centreCode,
        adresse: adresse?.trim() || null,
        telephone: telephone?.trim() || null,
      },
    });

    return res.status(201).json(centre);
  } catch (error) {
    console.error('creerCentre error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.listerCentres = async (req, res) => {
  try {
    const { ville, actif } = req.query;
    const where = {};

    if (ville?.trim()) {
      where.ville = { contains: ville.trim() };
    }
    if (actif === 'true') where.actif = true;
    if (actif === 'false') where.actif = false;

    const centres = await prisma.centreComposition.findMany({
      where,
      orderBy: [{ ville: 'asc' }, { nom: 'asc' }],
    });

    return res.json(centres);
  } catch (error) {
    console.error('listerCentres error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.modifierCentre = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, ville, adresse, telephone } = req.body;

    const existing = await prisma.centreComposition.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Centre non trouvé' });
    }

    const nextVille = ville != null ? String(ville).trim() : existing.ville;
    const centre = await prisma.centreComposition.update({
      where: { id },
      data: {
        ...(nom != null && { nom: String(nom).trim() }),
        ...(ville != null && {
          ville: nextVille,
          communeCode: resolveCommuneCode(nextVille),
        }),
        ...(adresse !== undefined && { adresse: adresse?.trim() || null }),
        ...(telephone !== undefined && { telephone: telephone?.trim() || null }),
      },
    });

    return res.json(centre);
  } catch (error) {
    console.error('modifierCentre error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.toggleActifCentre = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.centreComposition.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Centre non trouvé' });
    }

    const centre = await prisma.centreComposition.update({
      where: { id },
      data: { actif: !existing.actif },
    });

    return res.json(centre);
  } catch (error) {
    console.error('toggleActifCentre error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.ajouterCentreAuConcours = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const { centreId, anneeAcademique, capacite } = req.body;

    if (!centreId) {
      return res.status(400).json({ error: 'centreId requis' });
    }

    const concours = await prisma.concours.findUnique({ where: { id: concoursId } });
    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    const centre = await prisma.centreComposition.findUnique({ where: { id: centreId } });
    if (!centre) {
      return res.status(404).json({ error: 'Centre non trouvé' });
    }

    const { defaultAnneeFromLibelle } = require('../utils/centres-composition.helper');
    const annee = (anneeAcademique && String(anneeAcademique).trim())
      || defaultAnneeFromLibelle(concours.libelle);

    const link = await prisma.concoursCentreComposition.create({
      data: {
        concoursId,
        centreId,
        anneeAcademique: annee,
        capacite: capacite != null && capacite !== '' ? Number(capacite) : null,
      },
      include: { centre: true },
    });

    return res.status(201).json(mapConcoursCentreRow({ ...link, _count: { dossiers: 0 } }));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ce centre est déjà associé à ce concours pour cette année' });
    }
    console.error('ajouterCentreAuConcours error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.retirerCentreDuConcours = async (req, res) => {
  try {
    const { concoursId, concourscentreId } = req.params;

    const link = await prisma.concoursCentreComposition.findFirst({
      where: { id: concourscentreId, concoursId },
    });
    if (!link) {
      return res.status(404).json({ error: 'Association concours-centre non trouvée' });
    }

    const dossiersLies = await prisma.dossierInscription.count({
      where: { concoursCentreId: concourscentreId },
    });
    if (dossiersLies > 0) {
      return res.status(400).json({
        error: 'Impossible de retirer ce centre : des candidats l\'ont déjà choisi. Désactivez-le plutôt.',
      });
    }

    await prisma.concoursCentreComposition.delete({ where: { id: concourscentreId } });

    return res.json({ message: 'Centre retiré du concours' });
  } catch (error) {
    console.error('retirerCentreDuConcours error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.modifierConcoursCentre = async (req, res) => {
  try {
    const { concoursId, concourscentreId } = req.params;
    const { capacite, estActif } = req.body;

    const link = await prisma.concoursCentreComposition.findFirst({
      where: { id: concourscentreId, concoursId },
      include: {
        centre: true,
        _count: { select: { dossiers: true } },
      },
    });
    if (!link) {
      return res.status(404).json({ error: 'Association concours-centre non trouvée' });
    }

    const updated = await prisma.concoursCentreComposition.update({
      where: { id: concourscentreId },
      data: {
        ...(capacite !== undefined && {
          capacite: capacite === null || capacite === '' ? null : Number(capacite),
        }),
        ...(estActif !== undefined && { estActif: Boolean(estActif) }),
      },
      include: {
        centre: true,
        _count: { select: { dossiers: true } },
      },
    });

    return res.json(mapConcoursCentreRow(updated));
  } catch (error) {
    console.error('modifierConcoursCentre error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getCentresDuConcours = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const { tous } = req.query;
    const isDges = req.user?.role === 'DGES' || req.userRole === 'DGES';

    const concours = await prisma.concours.findUnique({ where: { id: concoursId } });
    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    const where = { concoursId };
    if (!(isDges && tous === '1')) {
      where.estActif = true;
    }

    const rows = await prisma.concoursCentreComposition.findMany({
      where,
      include: {
        centre: true,
        _count: { select: { dossiers: true } },
      },
      orderBy: [{ centre: { ville: 'asc' } }, { centre: { nom: 'asc' } }],
    });

    return res.json(rows.map(mapConcoursCentreRow));
  } catch (error) {
    console.error('getCentresDuConcours error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Remplace la sélection de centres d'un concours (création / édition DGES).
 * Body: { centreIds: string[], anneeAcademique?: string }
 */
exports.setCentresDuConcours = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const { centreIds, anneeAcademique } = req.body;

    if (!Array.isArray(centreIds)) {
      return res.status(400).json({ error: 'centreIds (tableau) requis' });
    }

    const concours = await prisma.concours.findUnique({ where: { id: concoursId } });
    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    const { defaultAnneeFromLibelle } = require('../utils/centres-composition.helper');
    const annee = (anneeAcademique && String(anneeAcademique).trim())
      || defaultAnneeFromLibelle(concours.libelle);

    const uniqueIds = [...new Set(centreIds.filter(Boolean))];

    if (uniqueIds.length > 0) {
      const found = await prisma.centreComposition.count({
        where: { id: { in: uniqueIds }, actif: true },
      });
      if (found !== uniqueIds.length) {
        return res.status(400).json({ error: 'Un ou plusieurs centres sont invalides ou inactifs' });
      }
    }

    await prisma.$transaction(async (tx) => {
      const existants = await tx.concoursCentreComposition.findMany({
        where: { concoursId },
        include: { _count: { select: { dossiers: true } } },
      });

      const toKeep = new Set();
      for (const link of existants) {
        if (uniqueIds.includes(link.centreId)) {
          toKeep.add(link.centreId);
          if (!link.estActif) {
            await tx.concoursCentreComposition.update({
              where: { id: link.id },
              data: { estActif: true },
            });
          }
        } else if (link._count.dossiers > 0) {
          await tx.concoursCentreComposition.update({
            where: { id: link.id },
            data: { estActif: false },
          });
        } else {
          await tx.concoursCentreComposition.delete({ where: { id: link.id } });
        }
      }

      for (const centreId of uniqueIds) {
        if (toKeep.has(centreId)) continue;
        const already = existants.find((l) => l.centreId === centreId);
        if (already) continue;
        await tx.concoursCentreComposition.create({
          data: {
            concoursId,
            centreId,
            anneeAcademique: annee,
          },
        });
      }
    });

    const rows = await prisma.concoursCentreComposition.findMany({
      where: { concoursId },
      include: {
        centre: true,
        _count: { select: { dossiers: true } },
      },
      orderBy: [{ centre: { ville: 'asc' } }, { centre: { nom: 'asc' } }],
    });

    return res.json(rows.map(mapConcoursCentreRow));
  } catch (error) {
    console.error('setCentresDuConcours error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
