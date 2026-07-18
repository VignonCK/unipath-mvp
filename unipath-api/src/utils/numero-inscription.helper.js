/**
 * N° de table concours : YY + codeVille(2) + codeFiliere(2) + seq(3)
 * Exemple : 260140601
 *
 * Attribution alphabétique PAR CENTRE (pas globale au concours).
 * APPEND : max(seq) pour le préfixe du centre + 1.
 */
const { getAnneeAcademique } = require('./matricule.helper');

const REJET_STATUTS = ['REJETE', 'REJETE_PAR_COMMISSION'];
const NUMERO_TABLE_REGEX = /^\d{9}$/;

function deriveSigleFromLibelleConcours(libelle = '') {
  const text = String(libelle).trim();
  if (!text) return 'CONV';

  const matchConcours = text.match(/Concours\s+(.+?)\s+20\d{2}/i);
  if (matchConcours?.[1]) {
    return normalizeCodeConcours(matchConcours[1]);
  }

  const firstWord = text.replace(/^concours\s*/i, '').split(/\s+/)[0] || 'CONV';
  return normalizeCodeConcours(firstWord);
}

function normalizeCodeConcours(value) {
  const code = String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
  return code || 'CONV';
}

function resolveCodeConcours(concours) {
  if (concours?.sigle) {
    return normalizeCodeConcours(concours.sigle);
  }
  return deriveSigleFromLibelleConcours(concours?.libelle);
}

/** @deprecated Ancien format CODE-ANNEE-SEQ4 — ne plus utiliser pour les n° de table. */
function formatNumeroInscription(code, annee, sequence) {
  return `${code}-${annee}-${String(sequence).padStart(4, '0')}`;
}

function resolveAnneeYY(concours) {
  const date =
    concours?.dateDebutComposition
    || concours?.dateComposition
    || concours?.dateDebutDepot
    || null;
  let year = date ? new Date(date).getFullYear() : getAnneeAcademique();
  if (!Number.isFinite(year)) {
    year = getAnneeAcademique();
  }
  return String(year).slice(-2);
}

function buildPrefix(yy, codeVille, codeFiliere) {
  return `${yy}${codeVille}${codeFiliere}`;
}

function formatNumeroTable(yy, codeVille, codeFiliere, seq) {
  return `${buildPrefix(yy, codeVille, codeFiliere)}${String(seq).padStart(3, '0')}`;
}

function parseSeqFromNumero(numero, prefix) {
  const n = String(numero || '');
  if (!n.startsWith(prefix) || n.length !== 9 || !NUMERO_TABLE_REGEX.test(n)) {
    return null;
  }
  const seq = Number(n.slice(6, 9));
  return Number.isFinite(seq) ? seq : null;
}

function compareCandidatsAlpha(a, b) {
  const nomA = String(a.candidat?.nom || '').localeCompare(String(b.candidat?.nom || ''), 'fr', {
    sensitivity: 'base',
  });
  if (nomA !== 0) return nomA;
  return String(a.candidat?.prenom || '').localeCompare(String(b.candidat?.prenom || ''), 'fr', {
    sensitivity: 'base',
  });
}

/**
 * @deprecated Compteur global concours — remplacé par séquence par centre (format 9 chiffres).
 * Conservé pour compat tests/legacy ; ne plus appeler depuis le flux DEC.
 */
async function genererNumeroInscriptionPourConcours() {
  throw new Error(
    'genererNumeroInscriptionPourConcours est obsolète. Utiliser attribuerNumerosTableParConcours (format YY+ville+filière+seq par centre).',
  );
}

async function maxSeqPourPrefix(tx, concoursId, prefix) {
  const existants = await tx.inscription.findMany({
    where: {
      concoursId,
      numeroInscription: { startsWith: prefix },
    },
    select: { numeroInscription: true },
  });

  let max = 0;
  for (const row of existants) {
    const seq = parseSeqFromNumero(row.numeroInscription, prefix);
    if (seq != null && seq > max) max = seq;
  }
  return max;
}

/**
 * Attribue les n° de table (format 9 chiffres) aux dossiers VALIDE sans numéro,
 * alphabétiquement PAR CENTRE.
 *
 * @returns {Promise<{
 *   attribues: Array<object>,
 *   exclus: Array<{ inscriptionId: string, candidatId: string, nom: string, prenom: string, motif: string }>,
 * }>}
 */
async function attribuerNumerosTableParConcours(tx, concoursId) {
  const concours = await tx.concours.findUnique({
    where: { id: concoursId },
    select: {
      id: true,
      libelle: true,
      codeFiliere: true,
      dateDebutComposition: true,
      dateComposition: true,
      dateDebutDepot: true,
    },
  });
  if (!concours) {
    throw new Error('Concours introuvable');
  }

  const yy = resolveAnneeYY(concours);
  const codeFiliere = concours.codeFiliere ? String(concours.codeFiliere).trim() : '';
  const codeFiliereOk = /^\d{2}$/.test(codeFiliere);

  const candidats = await tx.inscription.findMany({
    where: {
      concoursId,
      numeroInscription: null,
      dossierInscription: { statut: 'VALIDE' },
    },
    include: {
      candidat: { select: { id: true, nom: true, prenom: true } },
      dossierInscription: {
        select: {
          id: true,
          concoursCentreId: true,
          centreChoisi: {
            select: {
              id: true,
              centre: {
                select: { id: true, nom: true, ville: true, codeVille: true },
              },
            },
          },
        },
      },
    },
  });

  const attribues = [];
  const exclus = [];
  /** @type {Map<string, typeof candidats>} */
  const parCentre = new Map();

  for (const inscription of candidats) {
    const base = {
      inscriptionId: inscription.id,
      candidatId: inscription.candidat.id,
      nom: inscription.candidat.nom,
      prenom: inscription.candidat.prenom,
    };

    if (!codeFiliereOk) {
      exclus.push({
        ...base,
        motif: `Concours « ${concours.libelle} » sans codeFiliere configuré (2 chiffres requis)`,
      });
      continue;
    }

    const centre = inscription.dossierInscription?.centreChoisi?.centre;
    const concoursCentreId = inscription.dossierInscription?.concoursCentreId;

    if (!concoursCentreId || !centre) {
      exclus.push({
        ...base,
        motif: 'Aucun centre de composition choisi',
      });
      continue;
    }

    const codeVille = centre.codeVille ? String(centre.codeVille).trim() : '';
    if (!/^\d{2}$/.test(codeVille)) {
      exclus.push({
        ...base,
        motif: `Centre « ${centre.nom} — ${centre.ville} » sans codeVille configuré (2 chiffres requis)`,
      });
      continue;
    }

    if (!parCentre.has(concoursCentreId)) {
      parCentre.set(concoursCentreId, {
        centre,
        codeVille,
        inscriptions: [],
      });
    }
    parCentre.get(concoursCentreId).inscriptions.push(inscription);
  }

  for (const [, group] of parCentre) {
    const { centre, codeVille, inscriptions } = group;
    const prefix = buildPrefix(yy, codeVille, codeFiliere);
    let nextSeq = (await maxSeqPourPrefix(tx, concoursId, prefix)) + 1;

    inscriptions.sort(compareCandidatsAlpha);

    for (const inscription of inscriptions) {
      if (nextSeq > 999) {
        exclus.push({
          inscriptionId: inscription.id,
          candidatId: inscription.candidat.id,
          nom: inscription.candidat.nom,
          prenom: inscription.candidat.prenom,
          motif: `Séquence épuisée (>999) pour le préfixe ${prefix} (centre ${centre.nom})`,
        });
        continue;
      }

      const numeroInscription = formatNumeroTable(yy, codeVille, codeFiliere, nextSeq);
      await tx.inscription.update({
        where: { id: inscription.id },
        data: { numeroInscription },
      });
      attribues.push({
        inscriptionId: inscription.id,
        candidatId: inscription.candidat.id,
        nom: inscription.candidat.nom,
        prenom: inscription.candidat.prenom,
        numeroInscription,
        centreId: centre.id,
        centreNom: centre.nom,
        codeVille,
        codeFiliere,
      });
      nextSeq += 1;
    }
  }

  return { attribues, exclus };
}

function isInscriptionActive(statut) {
  return statut && !REJET_STATUTS.includes(statut);
}

function pickNumeroInscriptionRecent(inscriptions = []) {
  const actives = inscriptions
    .filter((ins) => ins?.numeroInscription && isInscriptionActive(ins.statut))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return actives[0]?.numeroInscription || null;
}

/** @deprecated Legacy — ne pas utiliser pour les nouvelles inscriptions */
async function genererNumeroInscriptionUnique() {
  throw new Error(
    'genererNumeroInscriptionUnique est obsolète. Utiliser attribuerNumerosTableParConcours(tx, concoursId).',
  );
}

module.exports = {
  deriveSigleFromLibelleConcours,
  normalizeCodeConcours,
  resolveCodeConcours,
  formatNumeroInscription,
  formatNumeroTable,
  buildPrefix,
  resolveAnneeYY,
  parseSeqFromNumero,
  genererNumeroInscriptionPourConcours,
  attribuerNumerosTableParConcours,
  pickNumeroInscriptionRecent,
  isInscriptionActive,
  genererNumeroInscriptionUnique,
  compareCandidatsAlpha,
  NUMERO_TABLE_REGEX,
};
