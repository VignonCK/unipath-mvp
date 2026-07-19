const { compareCandidatsAlpha } = require('./numero-inscription.helper');

/**
 * Vérifie que la salle appartient au même centre physique
 * que le ConcoursCentreComposition du dossier.
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

/**
 * Plan de répartition pur (sans I/O) : inscriptions déjà triées alpha,
 * salles déjà triées par nom.
 */
function planifierRepartitionSalles(inscriptionsTriees, sallesTriees) {
  const avertissements = [];
  if (!sallesTriees.length) {
    avertissements.push('Aucune salle active.');
  }
  for (const salle of sallesTriees) {
    if (salle.capacite == null) {
      avertissements.push(
        `Salle « ${salle.nom} » sans capacité : traitée comme illimitée.`,
      );
    }
  }

  const assignations = [];
  const nonAssignes = [];
  let cursor = 0;

  for (const salle of sallesTriees) {
    const limit = salle.capacite == null ? Number.POSITIVE_INFINITY : salle.capacite;
    let filled = 0;
    while (cursor < inscriptionsTriees.length && filled < limit) {
      const ins = inscriptionsTriees[cursor];
      assignations.push({
        inscriptionId: ins.id,
        salleId: salle.id,
        salleNom: salle.nom,
      });
      filled += 1;
      cursor += 1;
    }
  }

  while (cursor < inscriptionsTriees.length) {
    nonAssignes.push({
      inscriptionId: inscriptionsTriees[cursor].id,
      motif: sallesTriees.length === 0
        ? 'Aucune salle active disponible'
        : 'Capacité totale des salles insuffisante',
    });
    cursor += 1;
  }

  return { assignations, nonAssignes, avertissements };
}

/**
 * Répartit les dossiers VALIDE d'un centre (concours donné) dans les salles actives.
 * Tri alphabétique identique à attribuerNumerosTableParConcours.
 */
async function repartirCandidatsSallesParCentre(tx, concoursId, centreId) {
  const centre = await tx.centreComposition.findUnique({
    where: { id: centreId },
    select: { id: true, nom: true, ville: true },
  });
  if (!centre) {
    throw new Error('Centre de composition introuvable');
  }

  const concours = await tx.concours.findUnique({
    where: { id: concoursId },
    select: { id: true, libelle: true },
  });
  if (!concours) {
    throw new Error('Concours introuvable');
  }

  const lien = await tx.concourscentreComposition.findFirst({
    where: { concoursId, centreId },
    select: { id: true, centreId: true },
  });
  if (!lien) {
    throw new Error(
      `Le centre « ${centre.nom} » n'est pas associé à ce concours.`,
    );
  }

  const inscriptions = await tx.inscription.findMany({
    where: {
      concoursId,
      dossierInscription: {
        statut: 'VALIDE',
        concoursCentreId: lien.id,
      },
    },
    include: {
      candidat: { select: { id: true, nom: true, prenom: true } },
      dossierInscription: {
        select: {
          id: true,
          concoursCentreId: true,
          salleId: true,
        },
      },
    },
  });

  inscriptions.sort(compareCandidatsAlpha);

  const salles = await tx.salle.findMany({
    where: { centreCompositionId: centreId, actif: true },
    orderBy: { nom: 'asc' },
  });

  const plan = planifierRepartitionSalles(
    inscriptions.map((i) => ({
      id: i.id,
      nom: i.candidat.nom,
      prenom: i.candidat.prenom,
    })),
    salles.map((s) => ({ id: s.id, nom: s.nom, capacite: s.capacite })),
  );

  const assignes = [];
  const nonAssignes = [];
  const byInscription = new Map(inscriptions.map((i) => [i.id, i]));

  for (const row of plan.assignations) {
    const inscription = byInscription.get(row.inscriptionId);
    const dossier = inscription.dossierInscription;
    const base = {
      inscriptionId: inscription.id,
      dossierInscriptionId: dossier.id,
      candidatId: inscription.candidat.id,
      nom: inscription.candidat.nom,
      prenom: inscription.candidat.prenom,
    };

    const check = await assertSalleCompatibleAvecDossier(tx, {
      salleId: row.salleId,
      concoursCentreId: dossier.concoursCentreId,
    });

    if (!check.ok) {
      nonAssignes.push({ ...base, motif: check.error });
      continue;
    }

    await tx.dossierInscription.update({
      where: { id: dossier.id },
      data: { salleId: row.salleId },
    });

    assignes.push({
      ...base,
      salleId: row.salleId,
      salleNom: row.salleNom,
      centreId: centre.id,
      centreNom: centre.nom,
    });
  }

  for (const row of plan.nonAssignes) {
    const inscription = byInscription.get(row.inscriptionId);
    const dossier = inscription.dossierInscription;
    if (dossier.salleId) {
      await tx.dossierInscription.update({
        where: { id: dossier.id },
        data: { salleId: null },
      });
    }
    nonAssignes.push({
      inscriptionId: inscription.id,
      dossierInscriptionId: dossier.id,
      candidatId: inscription.candidat.id,
      nom: inscription.candidat.nom,
      prenom: inscription.candidat.prenom,
      motif: row.motif,
    });
  }

  let capaciteTotale = 0;
  let hasUnlimited = false;
  for (const salle of salles) {
    if (salle.capacite == null) hasUnlimited = true;
    else capaciteTotale += salle.capacite;
  }

  const sallesUtilisees = new Set(assignes.map((a) => a.salleId)).size;

  return {
    assignes,
    nonAssignes,
    avertissements: plan.avertissements.map((a) => (
      a === 'Aucune salle active.'
        ? `Aucune salle active pour le centre « ${centre.nom} ».`
        : a
    )),
    resume: {
      concoursId,
      centreId: centre.id,
      centreNom: centre.nom,
      totalCandidats: inscriptions.length,
      capaciteTotale: hasUnlimited ? null : capaciteTotale,
      sallesActives: salles.length,
      sallesUtilisees,
      nbAssignes: assignes.length,
      nbNonAssignes: nonAssignes.length,
    },
  };
}

module.exports = {
  assertSalleCompatibleAvecDossier,
  planifierRepartitionSalles,
  repartirCandidatsSallesParCentre,
};
