const STATUTS_CHOIX_CENTRE = ['VALIDE_PAR_COMMISSION', 'VALIDE'];

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

function validateCentresComposition(raw) {
  if (raw == null || raw === '') {
    return { valid: true, data: null };
  }

  const normalized = normalizeCentresComposition(raw);
  if (!normalized.valid) return normalized;

  const hasInput = Array.isArray(raw.centres) && raw.centres.some((c) =>
    String(c?.ville || '').trim()
    || (Array.isArray(c?.lieux) && c.lieux.some((l) => String(l?.nom || '').trim()))
  );

  if (!normalized.data && hasInput) {
    return { valid: false, error: 'Chaque centre doit avoir une ville et au moins un lieu avec un nom' };
  }

  return { valid: true, data: normalized.data };
}

function concoursHasCentres(centresComposition) {
  return Array.isArray(centresComposition?.centres) && centresComposition.centres.length > 0;
}

function resolveChoixCentre(centresComposition, { ville, nom }) {
  const villeNorm = String(ville || '').trim().toLowerCase();
  const nomNorm = String(nom || '').trim().toLowerCase();
  if (!villeNorm || !nomNorm) {
    return { valid: false, error: 'Ville et lieu de composition requis' };
  }

  const centres = centresComposition?.centres;
  if (!Array.isArray(centres)) {
    return { valid: false, error: 'Aucun centre de composition configuré pour ce concours' };
  }

  for (const centre of centres) {
    if (String(centre.ville || '').trim().toLowerCase() !== villeNorm) continue;
    for (const lieu of centre.lieux || []) {
      if (String(lieu.nom || '').trim().toLowerCase() === nomNorm) {
        return {
          valid: true,
          data: {
            ville: centre.ville.trim(),
            nom: lieu.nom.trim(),
            adresse: (lieu.adresse || '').trim(),
          },
        };
      }
    }
  }

  return { valid: false, error: 'Centre de composition invalide pour ce concours' };
}

function formatCentreAffiche(centreChoisi) {
  if (!centreChoisi?.ville || !centreChoisi?.nom) return null;
  const parts = [centreChoisi.nom, centreChoisi.ville];
  if (centreChoisi.adresse) parts.push(centreChoisi.adresse);
  return parts.join(' — ');
}

function peutChoisirCentre(statut, centreDejaChoisi = false) {
  if (statut === 'VALIDE_PAR_COMMISSION') {
    return true;
  }
  if (statut === 'VALIDE') {
    return !centreDejaChoisi;
  }
  return false;
}

const DOSSIER_CENTRE_INCLUDE = {
  centreChoisi: {
    include: { centre: true },
  },
};

function dossierCentreDejaChoisi(dossierInscription) {
  if (!dossierInscription) return false;
  return Boolean(
    dossierInscription.concoursCentreId
    || dossierInscription.centreCompositionChoisi?.nom,
  );
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

  const json = dossierInscription.centreCompositionChoisi;
  if (json?.nom) {
    return {
      nom: json.nom,
      ville: json.ville || null,
      adresse: json.adresse || null,
    };
  }

  return null;
}

function resolveCentreCompositionChoisiForPdf(dossierInscription) {
  const flat = flattenCentreChoisi(dossierInscription);
  if (!flat?.nom) return dossierInscription?.centreCompositionChoisi || null;
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
  const enriched = enrichDossierInscriptionForPdf(dossierInscription);
  return Boolean(enriched?.centreCompositionChoisi?.nom);
}

async function concoursHasCentresActifs(concoursId, concours, prismaClient) {
  if (concoursHasCentres(concours?.centresComposition)) {
    return true;
  }
  if (!concoursId || !prismaClient) {
    return false;
  }
  const count = await prismaClient.concourscentreComposition.count({
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

module.exports = {
  STATUTS_CHOIX_CENTRE,
  normalizeCentresComposition,
  validateCentresComposition,
  concoursHasCentres,
  concoursHasCentresActifs,
  centreCompositionEstChoisi,
  peutEnvoyerConvocationPdf,
  resolveChoixCentre,
  formatCentreAffiche,
  peutChoisirCentre,
  DOSSIER_CENTRE_INCLUDE,
  dossierCentreDejaChoisi,
  flattenCentreChoisi,
  resolveCentreCompositionChoisiForPdf,
  enrichDossierInscriptionForPdf,
};
