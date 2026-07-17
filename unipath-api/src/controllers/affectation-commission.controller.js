const prisma = require('../prisma');

async function loadAffectationsPayload(concoursId) {
  const concours = await prisma.concours.findUnique({
    where: { id: concoursId },
    select: { id: true, libelle: true, code: true },
  });
  if (!concours) return null;

  const affectations = await prisma.affectationCommissionConcours.findMany({
    where: { concoursId },
    include: {
      membre: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          sousRole: true,
        },
      },
    },
    orderBy: [{ roleAffectation: 'asc' }, { createdAt: 'asc' }],
  });

  return {
    concours,
    examinateurs: affectations
      .filter((a) => a.roleAffectation === 'EXAMINATEUR')
      .map((a) => ({ affectationId: a.id, ...a.membre })),
    controleurs: affectations
      .filter((a) => a.roleAffectation === 'CONTROLEUR')
      .map((a) => ({ affectationId: a.id, ...a.membre })),
  };
}

exports.listerMembresCommission = async (_req, res) => {
  try {
    const membres = await prisma.membreCommission.findMany({
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        sousRole: true,
      },
    });
    return res.json(membres);
  } catch (error) {
    console.error('listerMembresCommission:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getAffectationsConcours = async (req, res) => {
  try {
    const payload = await loadAffectationsPayload(req.params.concoursId);
    if (!payload) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }
    return res.json(payload);
  } catch (error) {
    console.error('getAffectationsConcours:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Body: { examinateurs: string[], controleurs: string[] }
 * Remplace l'ensemble des affectations du concours.
 */
exports.setAffectationsConcours = async (req, res) => {
  try {
    const { concoursId } = req.params;
    const examinateurs = Array.isArray(req.body?.examinateurs)
      ? [...new Set(req.body.examinateurs.filter(Boolean))]
      : [];
    const controleurs = Array.isArray(req.body?.controleurs)
      ? [...new Set(req.body.controleurs.filter(Boolean))]
      : [];

    const doublons = examinateurs.filter((id) => controleurs.includes(id));
    if (doublons.length > 0) {
      return res.status(400).json({
        error:
          'Un membre ne peut pas être à la fois examinateur et contrôleur sur le même concours.',
        membresEnDoublon: doublons,
      });
    }

    const concours = await prisma.concours.findUnique({ where: { id: concoursId } });
    if (!concours) {
      return res.status(404).json({ error: 'Concours non trouvé' });
    }

    const allIds = [...new Set([...examinateurs, ...controleurs])];
    if (allIds.length > 0) {
      const found = await prisma.membreCommission.count({
        where: { id: { in: allIds } },
      });
      if (found !== allIds.length) {
        return res.status(400).json({ error: 'Un ou plusieurs membres sont invalides' });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.affectationCommissionConcours.deleteMany({ where: { concoursId } });
      const rows = [
        ...examinateurs.map((membreCommissionId) => ({
          concoursId,
          membreCommissionId,
          roleAffectation: 'EXAMINATEUR',
        })),
        ...controleurs.map((membreCommissionId) => ({
          concoursId,
          membreCommissionId,
          roleAffectation: 'CONTROLEUR',
        })),
      ];
      if (rows.length > 0) {
        await tx.affectationCommissionConcours.createMany({ data: rows });
      }
    });

    // Le rôle est désormais résolu par concours via AffectationCommissionConcours.
    // On ne modifie plus le sousRole global du compte (source de vérité = affectations).

    const payload = await loadAffectationsPayload(concoursId);
    return res.json({ message: 'Affectations enregistrées', ...payload });
  } catch (error) {
    console.error('setAffectationsConcours:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
