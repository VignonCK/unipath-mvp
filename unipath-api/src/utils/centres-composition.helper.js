/**
 * Helpers centres de composition (catalogue relationnel + choix candidat).
 */

const STATUTS_CHOIX_CENTRE_MODIFIABLE = ['EN_ATTENTE'];

function normalizeCentresComposition(raw) {
  if (raw == null) return null;
  if (typeof raw !== 'object') {
    return { valid: false, error: 'Format des centres de composition invalide' };
  }

  const centres = Array.isArray(raw.centres) ? raw.centres : [];
  const normalized = {
    centres: centres.map((centre) => ({
      ville: String(centre?.ville || '').trim(),
      lieux: (Array.isArray(centre?.lieux) ? centre.lieux : []).map((lieu) => ({
        nom: String(lieu?.nom || '').trim(),
        adresse: String(lieu?.adresse || '').trim(),
      })).filter((lieu) => lieu.nom),
    })).filter((centre) => centre.ville && centre.lieux.length > 0),
  };

  if (raw.publieLe) {
    const publieLe = new Date(raw.publieLe);
    if (!Number.isNaN(publieLe.getTime())) {
      normalized.publieLe = publieLe.toISOString();
    }
  }
  if (raw.note && String(raw.note).trim()) {
    normalized.note = String(raw.note).trim();
  }

  return { valid: true, data: normalized.centres.length > 0 ? normalized : null };
}

function concoursHasCentresJson(centresComposition) {
  return Array.isArray(centresComposition?.centres) && centresComposition.centres.length > 0;
}

/** Choix / modification autorisés tant que le dossier est EN_ATTENTE. */
function peutChoisirCentre(statut) {
  return STATUTS_CHOIX_CENTRE_MODIFIABLE.includes(statut);
}

const DOSSIER_CENTRE_INCLUDE = {
  centreChoisi: {
    include: { centre: true },
  },
};

function dossierCentreDejaChoisi(dossierInscription) {
  if (!dossierInscription) return false;
  return Boolean(dossierInscription.concoursCentreId);
}

function flattenCentreChoisi(dossierInscription) {
  if (!dossierInscription) return null;

  const cc = dossierInscription.centreChoisi;
  if (cc?.centre) {
    return {
      id: cc.id,
      concoursCentreId: cc.id,
      nom: cc.centre.nom,
      ville: cc.centre.ville,
      adresse: cc.centre.adresse || null,
      anneeAcademique: cc.anneeAcademique,
      capacite: cc.capacite,
    };
  }

  return null;
}

function resolveCentreCompositionChoisiForPdf(dossierInscription) {
  const flat = flattenCentreChoisi(dossierInscription);
  if (!flat?.nom) return null;
  return {
    nom: flat.nom,
    ville: flat.ville,
    adresse: flat.adresse || '',
  };
}

function enrichDossierInscriptionForPdf(dossierInscription) {
  if (!dossierInscription) return null;
  return {
    ...dossierInscription,
    centreCompositionChoisi: resolveCentreCompositionChoisiForPdf(dossierInscription),
  };
}

function centreCompositionEstChoisi(dossierInscription) {
  return Boolean(flattenCentreChoisi(dossierInscription)?.nom || dossierInscription?.concoursCentreId);
}

async function concoursHasCentresActifs(concoursId, concours, prismaClient) {
  if (concoursHasCentresJson(concours?.centresComposition)) {
    return true;
  }
  if (!concoursId || !prismaClient) {
    return false;
  }
  const count = await prismaClient.concoursCentreComposition.count({
    where: { concoursId, estActif: true },
  });
  return count > 0;
}

async function peutEnvoyerConvocationPdf({ concoursId, concours, dossierInscription }, prismaClient) {
  const hasCentres = await concoursHasCentresActifs(concoursId, concours, prismaClient);
  if (!hasCentres) {
    return { ok: true, hasCentres: false };
  }
  if (centreCompositionEstChoisi(dossierInscription)) {
    return { ok: true, hasCentres: true };
  }
  return { ok: false, hasCentres: true, reason: 'CENTRE_NON_CHOISI' };
}

function defaultAnneeFromLibelle(libelle) {
  const match = String(libelle || '').match(/20\d{2}/);
  if (match) {
    const y = parseInt(match[0], 10);
    return `${y - 1}-${y}`;
  }
  return '2025-2026';
}

module.exports = {
  STATUTS_CHOIX_CENTRE_MODIFIABLE,
  normalizeCentresComposition,
  concoursHasCentres: concoursHasCentresJson,
  concoursHasCentresActifs,
  centreCompositionEstChoisi,
  peutEnvoyerConvocationPdf,
  peutChoisirCentre,
  DOSSIER_CENTRE_INCLUDE,
  dossierCentreDejaChoisi,
  flattenCentreChoisi,
  resolveCentreCompositionChoisiForPdf,
  enrichDossierInscriptionForPdf,
  defaultAnneeFromLibelle,
};
