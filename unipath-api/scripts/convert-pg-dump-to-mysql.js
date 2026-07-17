/**
 * Convertit backup_unipath_complet.sql (PostgreSQL) en import MySQL pour phpMyAdmin.
 * Usage: node scripts/convert-pg-dump-to-mysql.js
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const INPUT = path.resolve(__dirname, '../../backup_unipath_complet.sql');
const OUTPUT = path.resolve(__dirname, '../../import_unipath_mysql.sql');
const DEFAULT_PASSWORD = 'UniPath2026!';
const PASSWORD_HASH = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

/** Tables à ignorer (absentes du schéma MySQL actuel) */
const SKIP_TABLES = new Set([
  'CentreComposition',
  'ConcourscentreComposition',
  '_prisma_migrations',
]);

/** Ordre d'import (respect des clés étrangères) */
const TABLE_ORDER = [
  'Etablissement',
  'Filiere',
  'Concours',
  'Candidat',
  'MembreCommission',
  'AdministrateurDGES',
  'Controleur',
  'AdminEtablissement',
  'Dossier',
  'Inscription',
  'DossierInscription',
  'InscriptionAcademique',
  'Note',
  'Diplome',
  'CampagneInscription',
  'CampagneFiliere',
  'SchoolRequirement',
  'PreinscriptionEtablissement',
  'Application',
  'ApplicationDocument',
  'Payment',
  'Receipt',
  'Notification',
  'NotificationTemplate',
  'EmailDelivery',
  'ActionHistory',
  'NotificationAuditLog',
  'SystemAlert',
  'UserPreferences',
];

/** Colonnes MySQL par table (intersection avec le dump PG) */
const MYSQL_COLUMNS = {
  Etablissement: ['id', 'nom', 'type', 'ville', 'createdAt', 'adresse', 'email'],
  Filiere: ['id', 'nom', 'etablissementId', 'dureeAnnees', 'createdAt', 'code', 'niveau'],
  Concours: [
    'id', 'libelle', 'etablissement', 'dateDebut', 'dateFin', 'dateComposition', 'description',
    'fraisParticipation', 'seriesAcceptees', 'matieres', 'piecesRequises', 'dateDebutDepot',
    'dateFinDepot', 'dateDebutComposition', 'dateFinComposition', 'createdAt', 'criteresEligibilite',
    'centresComposition',
  ],
  Candidat: [
    'id', 'matricule', 'nom', 'prenom', 'anip', 'serie', 'sexe', 'nationalite', 'email',
    'emailConfirme', 'telephone', 'dateNaiss', 'lieuNaiss', 'role', 'createdAt', 'updatedAt',
  ],
  MembreCommission: [
    'id', 'nom', 'prenom', 'email', 'telephone', 'role', 'createdAt', 'updatedAt', 'sousRole',
  ],
  AdministrateurDGES: ['id', 'nom', 'prenom', 'email', 'telephone', 'role', 'createdAt', 'updatedAt'],
  Controleur: ['id', 'nom', 'prenom', 'email', 'telephone', 'role', 'createdAt', 'updatedAt'],
  AdminEtablissement: [
    'id', 'nom', 'prenom', 'email', 'telephone', 'role', 'etablissementId', 'createdAt', 'updatedAt',
  ],
  Dossier: ['id', 'candidatId', 'acteNaissance', 'carteIdentite', 'photo', 'releve', 'createdAt', 'updatedAt'],
  Inscription: ['id', 'numeroInscription', 'candidatId', 'concoursId', 'note', 'createdAt'],
  DossierInscription: [
    'id', 'inscriptionId', 'quittanceUrl', 'piecesExtras', 'statut', 'verdict1Par', 'verdict1',
    'verdict1Motif', 'verdict1Date', 'verdict1ModifieCount', 'verdict2Par', 'verdict2', 'verdict2Motif',
    'verdict2Date', 'verdict2ModifieCount', 'decisionControleur', 'decisionControleurMotif',
    'decisionControleurDate', 'decisionControleurPar', 'commentaireRejet', 'commentaireSousReserve',
    'decisionCommissionPar', 'decisionCommissionDate', 'commentaireControleur', 'createdAt', 'updatedAt',
  ],
  InscriptionAcademique: [
    'id', 'candidatId', 'etablissementId', 'filiereId', 'anneeAcademique', 'createdAt', 'niveau', 'statut',
  ],
  Note: [
    'id', 'inscriptionAcadId', 'matiere', 'noteCC', 'noteExamen', 'noteMoyenne', 'credits', 'semestre',
    'createdAt', 'updatedAt',
  ],
  Diplome: ['id', 'candidatId', 'type', 'filiere', 'filiereId', 'etablissement', 'annee', 'mention', 'createdAt'],
  CampagneInscription: [
    'id', 'etablissementId', 'titre', 'anneeAcademique', 'dateOuverture', 'dateCloture', 'description',
    'statut', 'createdBy', 'createdAt', 'updatedAt',
  ],
  CampagneFiliere: [
    'id', 'campagneId', 'filiereId', 'fraisDossier', 'placesDisponibles', 'criteresSelection',
    'seriesAcceptees', 'niveauMinBac', 'autresCriteres', 'createdAt', 'updatedAt',
  ],
  SchoolRequirement: [
    'id', 'etablissementId', 'code', 'label', 'requirementType', 'profileFieldKey', 'isRequired',
    'createdAt', 'updatedAt',
  ],
  PreinscriptionEtablissement: [
    'id', 'numeroPreinscription', 'candidatId', 'filiereId', 'etablissementId', 'anneeAcademique', 'niveau',
    'statut', 'motifDecision', 'decidedAt', 'decidedBy', 'inscriptionAcadId', 'createdAt', 'updatedAt',
  ],
  Application: [
    'id', 'numeroApplication', 'candidatId', 'etablissementId', 'filiereId', 'anneeAcademique', 'niveau',
    'status', 'preinscriptionId', 'createdAt', 'updatedAt',
  ],
  ApplicationDocument: [
    'id', 'applicationId', 'schoolRequirementId', 'code', 'label', 'source', 'documentUrl', 'status',
    'metadata', 'createdAt', 'updatedAt',
  ],
  Payment: [
    'id', 'applicationId', 'paymentType', 'amount', 'currency', 'paymentProvider', 'paymentMethod',
    'status', 'externalRef', 'providerPayload', 'createdAt', 'updatedAt',
  ],
  Receipt: [
    'id', 'paymentId', 'applicationId', 'receiptNumber', 'receiptType', 'receiptUrl', 'issuedAt',
    'metadata', 'createdAt', 'updatedAt',
  ],
  Notification: [
    'id', 'userId', 'type', 'title', 'message', 'data', 'read', 'readAt', 'priority', 'createdAt',
    'updatedAt', 'expiresAt',
  ],
  NotificationTemplate: [
    'id', 'name', 'type', 'subject', 'htmlBody', 'textBody', 'variables', 'isActive', 'isDefault',
    'createdBy', 'createdAt', 'updatedAt',
  ],
  EmailDelivery: [
    'id', 'notificationId', 'userId', 'recipient', 'subject', 'status', 'messageId', 'attempts',
    'lastAttemptAt', 'sentAt', 'deliveredAt', 'bouncedAt', 'errorMessage', 'smtpCode', 'createdAt',
    'updatedAt', 'htmlBody', 'textBody', 'attachments', 'nextRetryAt',
  ],
  ActionHistory: [
    'id', 'utilisateurId', 'typeAction', 'details', 'timestamp', 'ipAddress', 'userAgent', 'createdAt',
    'updatedAt', 'dossierInscriptionId',
  ],
  NotificationAuditLog: [
    'id', 'eventType', 'userId', 'actorId', 'resourceId', 'resourceType', 'details', 'ipAddress',
    'userAgent', 'timestamp',
  ],
  SystemAlert: [
    'id', 'type', 'severity', 'title', 'message', 'data', 'resolved', 'resolvedAt', 'resolvedBy',
    'createdAt', 'updatedAt',
  ],
  UserPreferences: ['id', 'userId', 'preferences', 'createdAt', 'updatedAt'],
};

const JSON_COLUMNS = new Set([
  'piecesRequises', 'criteresEligibilite', 'centresComposition', 'seriesAcceptees', 'matieres',
  'piecesExtras', 'data', 'variables', 'attachments', 'details', 'metadata', 'providerPayload',
  'preferences', 'autresCriteres', 'htmlBody', 'textBody',
]);

const ARRAY_COLUMNS = new Set(['seriesAcceptees', 'matieres']);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidRow(table, line, pgCols) {
  if (!line || line.startsWith('--') || line.startsWith('COPY ')) return false;
  const firstCol = pgCols[0];
  if (firstCol !== 'id') return true;
  const id = line.split('\t')[0];
  return UUID_RE.test(id);
}

function parseCopyBlocks(sql) {
  const blocks = {};
  const lines = sql.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const header = lines[i].match(/^COPY public\."([^"]+)" \(([^)]+)\) FROM stdin;$/);
    if (!header) continue;

    const table = header[1];
    const pgCols = header[2].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const dataLines = [];

    i++;
    while (i < lines.length && lines[i] !== '\\.') {
      const line = lines[i];
      if (line.length > 0 && !line.startsWith('--')) {
        dataLines.push(line);
      }
      i++;
    }

    blocks[table] = { pgCols, lines: dataLines };
  }

  return blocks;
}

function splitRow(line, pgCols) {
  const fields = [];
  let i = 0;
  for (let c = 0; c < pgCols.length; c++) {
    const col = pgCols[c];
    const isStructured =
      JSON_COLUMNS.has(col) ||
      ARRAY_COLUMNS.has(col) ||
      col === 'piecesRequises' ||
      col === 'centresComposition' ||
      col === 'criteresEligibilite';

    if (isStructured && i < line.length && (line[i] === '{' || line[i] === '[')) {
      const open = line[i];
      const close = open === '{' ? '}' : ']';
      let depth = 0;
      const start = i;
      for (; i < line.length; i++) {
        if (line[i] === open) depth++;
        else if (line[i] === close) {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
      }
      fields.push(line.slice(start, i));
      if (line[i] === '\t') i++;
    } else if (c === pgCols.length - 1) {
      fields.push(line.slice(i));
      break;
    } else {
      const nextTab = line.indexOf('\t', i);
      if (nextTab === -1) {
        fields.push(line.slice(i));
        while (fields.length < pgCols.length) fields.push('');
        break;
      }
      fields.push(line.slice(i, nextTab));
      i = nextTab + 1;
    }
  }
  while (fields.length < pgCols.length) fields.push('');
  return fields;
}

function pgArrayToJson(val) {
  if (!val || val === '\\N') return 'NULL';
  const inner = val.replace(/^\{|\}$/g, '');
  if (!inner) return "'[]'";
  const items = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (ch === ',' && !inQuote) {
      items.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur) items.push(cur.trim());
  const json = JSON.stringify(items);
  return sqlString(json);
}

function sqlString(val) {
  if (val === null || val === undefined || val === '\\N' || val === '') return 'NULL';
  return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function convertValue(col, raw) {
  if (raw === '\\N' || raw === undefined || raw === '') return 'NULL';

  if (ARRAY_COLUMNS.has(col)) {
    return pgArrayToJson(raw);
  }

  if (JSON_COLUMNS.has(col)) {
    if (raw.startsWith('{') && !raw.startsWith('{"') && !raw.startsWith('{\\"')) {
      return pgArrayToJson(raw);
    }
    return sqlString(raw);
  }

  if (raw === 't') return '1';
  if (raw === 'f') return '0';

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return sqlString(raw.replace(' ', ' ').slice(0, 19));
  }

  if (/^-?\d+(\.\d+)?$/.test(raw)) return raw;

  return sqlString(raw);
}

function buildInserts(table, block) {
  const mysqlCols = MYSQL_COLUMNS[table];
  if (!mysqlCols) return [];

  const colIndex = {};
  block.pgCols.forEach((c, i) => {
    colIndex[c] = i;
  });

  const stmts = [];
  for (const line of block.lines) {
    if (!isValidRow(table, line, block.pgCols)) continue;
    const values = splitRow(line, block.pgCols);
    const rowVals = mysqlCols.map((col) => {
      const idx = colIndex[col];
      if (idx === undefined) return 'NULL';
      return convertValue(col, values[idx]);
    });
    const colsSql = mysqlCols.map((c) => `\`${c}\``).join(', ');
    stmts.push(`INSERT INTO \`${table}\` (${colsSql}) VALUES (${rowVals.join(', ')});`);
  }
  return stmts;
}

function buildCompteInserts(blocks) {
  const stmts = [];
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const add = (rows, profilType, emailCol = 'email', emailConfirmeCol = null) => {
    if (!rows) return;
    for (const line of rows.lines) {
      const values = splitRow(line, rows.pgCols);
      const idx = {};
      rows.pgCols.forEach((c, i) => {
        idx[c] = i;
      });
      const id = values[idx.id];
      const email = values[idx[emailCol]];
      if (!id || !email || email === '\\N') continue;
      let emailConfirme = '1';
      if (emailConfirmeCol !== null && idx[emailConfirmeCol] !== undefined) {
        emailConfirme = values[idx[emailConfirmeCol]] === 't' ? '1' : '0';
      }
      stmts.push(
        `INSERT INTO \`Compte\` (\`id\`, \`email\`, \`passwordHash\`, \`profilType\`, \`profilId\`, \`emailConfirme\`, \`createdAt\`, \`updatedAt\`) VALUES (` +
          `${sqlString(id)}, ${sqlString(email)}, ${sqlString(PASSWORD_HASH)}, ${sqlString(profilType)}, ${sqlString(id)}, ${emailConfirme}, ${sqlString(now)}, ${sqlString(now)});`
      );
    }
  };

  add(blocks.Candidat, 'CANDIDAT', 'email', 'emailConfirme');
  add(blocks.MembreCommission, 'COMMISSION');
  add(blocks.AdministrateurDGES, 'DGES');
  add(blocks.Controleur, 'CONTROLEUR');
  add(blocks.AdminEtablissement, 'ADMIN_ETABLISSEMENT');
  add(blocks.Etablissement, 'ETABLISSEMENT');

  return stmts;
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`Fichier introuvable: ${INPUT}`);
    process.exit(1);
  }

  console.log('Lecture du dump PostgreSQL...');
  const sql = fs.readFileSync(INPUT, 'utf8');
  const blocks = parseCopyBlocks(sql);

  const out = [];
  out.push('-- UniPath — Import MySQL généré depuis backup_unipath_complet.sql');
  out.push(`-- Mot de passe par défaut pour tous les comptes: ${DEFAULT_PASSWORD}`);
  out.push('-- Date: ' + new Date().toISOString());
  out.push('');
  out.push('SET NAMES utf8mb4;');
  out.push('SET FOREIGN_KEY_CHECKS = 0;');
  out.push('');
  out.push('-- Vider les tables existantes');
  for (const table of [...TABLE_ORDER].reverse()) {
    out.push(`TRUNCATE TABLE \`${table}\`;`);
  }
  out.push('TRUNCATE TABLE `Compte`;');
  out.push('');

  let totalRows = 0;
  for (const table of TABLE_ORDER) {
    if (SKIP_TABLES.has(table) || !blocks[table]) continue;
    const inserts = buildInserts(table, blocks[table]);
    if (inserts.length === 0) continue;
    out.push(`-- Table: ${table} (${inserts.length} lignes)`);
    out.push(...inserts);
    out.push('');
    totalRows += inserts.length;
    console.log(`  ${table}: ${inserts.length} lignes`);
  }

  const compteInserts = buildCompteInserts(blocks);
  out.push(`-- Table: Compte (${compteInserts.length} comptes auth locaux)`);
  out.push(...compteInserts);
  out.push('');
  totalRows += compteInserts.length;
  console.log(`  Compte: ${compteInserts.length} lignes`);

  out.push('SET FOREIGN_KEY_CHECKS = 1;');
  out.push('-- Import terminé');

  fs.writeFileSync(OUTPUT, out.join('\n'), 'utf8');
  console.log(`\nFichier généré: ${OUTPUT}`);
  console.log(`Total: ${totalRows} INSERT`);
  console.log(`\nMot de passe pour tous les utilisateurs importés: ${DEFAULT_PASSWORD}`);
}

main();
