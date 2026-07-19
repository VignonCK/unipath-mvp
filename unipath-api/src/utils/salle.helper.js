/**
 * Vérifie que la salle appartient au même centre physique
 * que le ConcoursCentreComposition du dossier.
 * À utiliser lors de l'affectation (Phase 2+).
 *
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
async function assertSalleCompatibleAvecDossier(prismaClient, { salleId, concoursCentreId }) {
  if (!salleId) {
    return { ok: true };
  }
  if (!concoursCentreId) {
    return {
      ok: false,
      error: 'Un centre de composition doit être choisi avant d\'affecter une salle.',
    };
  }

  const [salle, lien] = await Promise.all([
    prismaClient.salle.findUnique({
      where: { id: salleId },
      select: { id: true, centreCompositionId: true, actif: true },
    }),
    prismaClient.concourscentreComposition.findUnique({
      where: { id: concoursCentreId },
      select: { id: true, centreId: true },
    }),
  ]);

  if (!salle) {
    return { ok: false, error: 'Salle introuvable' };
  }
  if (!lien) {
    return { ok: false, error: 'Lien concours–centre introuvable' };
  }
  if (salle.centreCompositionId !== lien.centreId) {
    return {
      ok: false,
      error: 'La salle doit appartenir au même centre de composition que le dossier.',
    };
  }

  return { ok: true };
}

module.exports = {
  assertSalleCompatibleAvecDossier,
};
