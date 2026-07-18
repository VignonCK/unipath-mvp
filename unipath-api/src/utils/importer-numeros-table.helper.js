/**
 * Import CSV des n° de table (DEC).
 * Colonnes : matricule_plateforme,numero_table
 */
const { NUMERO_TABLE_REGEX } = require('./numero-inscription.helper');

const HEADER_MATRICULE = 'matricule_plateforme';
const HEADER_NUMERO = 'numero_table';

/**
 * Parse un CSV texte en lignes { lineNumber, matricule, numero }.
 * @returns {{ rows: Array, parseErrors: Array<{ line: number, motif: string }> }}
 */
function parseCsvNumerosTable(bufferOrString) {
  const text = Buffer.isBuffer(bufferOrString)
    ? bufferOrString.toString('utf8')
    : String(bufferOrString || '');
  const cleaned = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleaned.split('\n');
  const parseErrors = [];
  const rows = [];

  if (!lines.length || !String(lines[0] || '').trim()) {
    return {
      rows: [],
      parseErrors: [{ line: 1, motif: 'Fichier CSV vide' }],
    };
  }

  const headerCells = splitCsvLine(lines[0]).map((c) => c.trim().toLowerCase());
  const idxMat = headerCells.indexOf(HEADER_MATRICULE);
  const idxNum = headerCells.indexOf(HEADER_NUMERO);

  if (idxMat < 0 || idxNum < 0) {
    return {
      rows: [],
      parseErrors: [{
        line: 1,
        motif: `En-tête invalide — attendu : ${HEADER_MATRICULE},${HEADER_NUMERO}`,
      }],
    };
  }

  for (let i = 1; i < lines.length; i += 1) {
    const raw = lines[i];
    if (!raw || !raw.trim()) continue;
    const lineNumber = i + 1;
    const cells = splitCsvLine(raw);
    const matricule = String(cells[idxMat] ?? '').trim();
    const numero = String(cells[idxNum] ?? '').trim();

    if (!matricule && !numero) continue;

    if (!matricule || !numero) {
      parseErrors.push({
        line: lineNumber,
        motif: 'Colonnes matricule_plateforme et numero_table requises',
      });
      continue;
    }

    rows.push({ lineNumber, matricule, numero });
  }

  return { rows, parseErrors };
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Valide les lignes CSV pour un concours ; optionnellement applique les valides.
 *
 * @param {import('@prisma/client').PrismaClient | import('@prisma/client').Prisma.TransactionClient} db
 * @param {string} concoursId
 * @param {Array<{ lineNumber: number, matricule: string, numero: string }>} rows
 * @param {{ apply?: boolean }} options
 * @returns {Promise<{
 *   dryRun: boolean,
 *   valides: Array<object>,
 *   erreurs: Array<{ line: number, matricule?: string, numero?: string, motif: string }>,
 *   appliques: number,
 * }>}
 */
async function validerEtImporterNumerosTable(db, concoursId, rows, { apply = false } = {}) {
  const erreurs = [];
  const valides = [];
  const seenMatricules = new Map();
  const seenNumeros = new Map();

  const concours = await db.concours.findUnique({
    where: { id: concoursId },
    select: { id: true, libelle: true },
  });
  if (!concours) {
    throw new Error('Concours introuvable');
  }

  for (const row of rows) {
    const { lineNumber, matricule, numero } = row;

    if (!NUMERO_TABLE_REGEX.test(numero)) {
      erreurs.push({
        line: lineNumber,
        matricule,
        numero,
        motif: `Format numero_table invalide (attendu 9 chiffres, reçu « ${numero} »)`,
      });
      continue;
    }

    if (seenMatricules.has(matricule)) {
      erreurs.push({
        line: lineNumber,
        matricule,
        numero,
        motif: `Matricule en doublon dans le CSV (déjà ligne ${seenMatricules.get(matricule)})`,
      });
      continue;
    }
    if (seenNumeros.has(numero)) {
      erreurs.push({
        line: lineNumber,
        matricule,
        numero,
        motif: `Numéro de table en doublon dans le CSV (déjà ligne ${seenNumeros.get(numero)})`,
      });
      continue;
    }

    const candidat = await db.candidat.findUnique({
      where: { matricule },
      select: { id: true, nom: true, prenom: true, matricule: true },
    });
    if (!candidat) {
      erreurs.push({
        line: lineNumber,
        matricule,
        numero,
        motif: `Matricule inconnu : ${matricule}`,
      });
      continue;
    }

    const inscription = await db.inscription.findUnique({
      where: {
        candidatId_concoursId: {
          candidatId: candidat.id,
          concoursId,
        },
      },
      include: {
        dossierInscription: { select: { id: true, statut: true } },
      },
    });

    if (!inscription) {
      erreurs.push({
        line: lineNumber,
        matricule,
        numero,
        motif: `Candidat non inscrit à ce concours`,
      });
      continue;
    }

    const statut = inscription.dossierInscription?.statut;
    if (statut !== 'VALIDE') {
      erreurs.push({
        line: lineNumber,
        matricule,
        numero,
        motif: `Dossier non VALIDE (statut actuel : ${statut || 'absent'})`,
      });
      continue;
    }

    if (inscription.numeroInscription && inscription.numeroInscription !== numero) {
      erreurs.push({
        line: lineNumber,
        matricule,
        numero,
        motif: `Inscription déjà numérotée (${inscription.numeroInscription})`,
      });
      continue;
    }

    const conflict = await db.inscription.findFirst({
      where: {
        numeroInscription: numero,
        NOT: { id: inscription.id },
      },
      select: { id: true },
    });
    if (conflict) {
      erreurs.push({
        line: lineNumber,
        matricule,
        numero,
        motif: `Numéro déjà utilisé ailleurs : ${numero}`,
      });
      continue;
    }

    seenMatricules.set(matricule, lineNumber);
    seenNumeros.set(numero, lineNumber);
    valides.push({
      line: lineNumber,
      matricule,
      numero,
      inscriptionId: inscription.id,
      candidatId: candidat.id,
      nom: candidat.nom,
      prenom: candidat.prenom,
      dejaAttribue: inscription.numeroInscription === numero,
    });
  }

  let appliques = 0;
  if (apply && valides.length > 0) {
    const aEcrire = valides.filter((v) => !v.dejaAttribue);
    for (const v of aEcrire) {
      await db.inscription.update({
        where: { id: v.inscriptionId },
        data: { numeroInscription: v.numero },
      });
      appliques += 1;
    }
  }

  return {
    dryRun: !apply,
    concours: { id: concours.id, libelle: concours.libelle },
    valides,
    erreurs,
    appliques,
    countValides: valides.length,
    countErreurs: erreurs.length,
  };
}

module.exports = {
  parseCsvNumerosTable,
  validerEtImporterNumerosTable,
  HEADER_MATRICULE,
  HEADER_NUMERO,
};
