/**
 * Génère comptes_connexion_unipath.txt à partir de import_unipath_mysql.sql
 * Usage: node scripts/generate-comptes-connexion.js
 */
const fs = require('fs');
const path = require('path');

const SQL_FILE = path.resolve(__dirname, '../../import_unipath_mysql.sql');
const OUTPUT = path.resolve(__dirname, '../../comptes_connexion_unipath.txt');
const DEFAULT_PASSWORD = 'UniPath2026!';

const MANUAL_ADMINS = [
  {
    categorie: 'ADMINISTRATEURS SYSTÈME (créés manuellement)',
    nom: 'Commission',
    prenom: 'EPAC',
    email: 'commission@epac.bj',
    password: 'Commission2026!',
    telephone: '+22997000001',
    note: 'Compte créé via npm run create-admins (peut ne pas être en base si import SQL effectué)',
  },
  {
    categorie: 'ADMINISTRATEURS SYSTÈME (créés manuellement)',
    nom: 'DGES',
    prenom: 'MESRS',
    email: 'dges@mesrs.bj',
    password: 'DGES2026!',
    telephone: '+22997000002',
    note: 'Module 2 (établissements privés) — créé via npm run create-admins',
  },
  {
    categorie: 'ADMINISTRATEURS SYSTÈME (créés manuellement)',
    nom: 'DEC',
    prenom: 'MESRS',
    email: 'dec@mesrs.bj',
    password: 'DEC2026!',
    telephone: '+22997000008',
    note: 'Module 1 (concours / établissements publics) — créé via npm run create-admins',
  },
];

function parseInserts(sql, table) {
  const re = new RegExp(
    `INSERT INTO \\\`${table}\\\` \\(([^)]+)\\) VALUES \\((.+?)\\);`,
    'g'
  );
  const rows = [];
  let m;
  while ((m = re.exec(sql)) !== null) {
    const cols = m[1].split(',').map((c) => c.trim().replace(/`/g, ''));
    const vals = splitSqlValues(m[2]);
    const row = {};
    cols.forEach((col, i) => {
      row[col] = vals[i] ?? null;
    });
    rows.push(row);
  }
  return rows;
}

function splitSqlValues(str) {
  const vals = [];
  let cur = '';
  let inStr = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inStr) {
      if (ch === "'" && str[i + 1] === "'") {
        cur += "'";
        i++;
      } else if (ch === "'") {
        inStr = false;
      } else {
        cur += ch;
      }
    } else if (ch === "'") {
      inStr = true;
    } else if (ch === ',') {
      vals.push(normalizeVal(cur.trim()));
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.length) vals.push(normalizeVal(cur.trim()));
  return vals;
}

function normalizeVal(v) {
  if (v === 'NULL' || v === '') return null;
  return v;
}

function line(label, value) {
  return `  ${label.padEnd(14)}: ${value ?? '—'}`;
}

function formatAccount(acc, index) {
  const lines = [`\n  [${index}]`];
  if (acc.nom || acc.prenom) lines.push(line('Nom', `${acc.prenom || ''} ${acc.nom || ''}`.trim()));
  if (acc.matricule) lines.push(line('Matricule', acc.matricule));
  lines.push(line('Email', acc.email));
  lines.push(line('Mot de passe', acc.password));
  if (acc.telephone) lines.push(line('Téléphone', acc.telephone));
  if (acc.sousRole) lines.push(line('Sous-rôle', acc.sousRole));
  if (acc.etablissement) lines.push(line('Établissement', acc.etablissement));
  if (acc.emailConfirme !== undefined) {
    lines.push(line('Email confirmé', acc.emailConfirme === 1 || acc.emailConfirme === '1' || acc.emailConfirme === true ? 'Oui' : 'Non'));
  }
  if (acc.note) lines.push(line('Note', acc.note));
  return lines.join('\n');
}

function section(title) {
  return `\n${'='.repeat(70)}\n  ${title}\n${'='.repeat(70)}`;
}

function main() {
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`Fichier introuvable: ${SQL_FILE}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  const candidats = parseInserts(sql, 'Candidat');
  const commission = parseInserts(sql, 'MembreCommission');
  const dges = parseInserts(sql, 'AdministrateurDGES');
  const adminEtab = parseInserts(sql, 'AdminEtablissement');
  const etablissements = parseInserts(sql, 'Etablissement');
  const comptes = parseInserts(sql, 'Compte');

  const etabById = Object.fromEntries(etablissements.map((e) => [e.id, e.nom]));
  const compteByProfilId = Object.fromEntries(comptes.map((c) => [c.profilId, c]));

  const out = [];
  out.push('UNIPATH — INFORMATIONS DE CONNEXION');
  out.push(`Généré le : ${new Date().toLocaleString('fr-FR')}`);
  out.push(`Source    : import_unipath_mysql.sql`);
  out.push('');
  out.push('IMPORTANT :');
  out.push(`  - Mot de passe par défaut (comptes importés) : ${DEFAULT_PASSWORD}`);
  out.push('  - Les mots de passe Supabase originaux ne sont pas récupérables.');
  out.push('  - Ne partagez pas ce fichier en production.');

  // Admins manuels
  out.push(section('ADMINISTRATEURS SYSTÈME (créés manuellement)'));
  MANUAL_ADMINS.forEach((a, i) => out.push(formatAccount(a, i + 1)));

  // DGES
  out.push(section('DGES (Direction Générale de l\'Enseignement Supérieur)'));
  dges.forEach((p, i) => {
    out.push(formatAccount({
      nom: p.nom,
      prenom: p.prenom,
      email: p.email,
      password: DEFAULT_PASSWORD,
      telephone: p.telephone,
    }, i + 1));
  });

  // Commission par sous-rôle
  const sousRoles = {
    MEMBRE: 'COMMISSION — Membres',
    EXAMINATEUR: 'COMMISSION — Examinateurs',
    CONTROLEUR: 'COMMISSION — Contrôleurs',
  };
  for (const [role, title] of Object.entries(sousRoles)) {
    const members = commission.filter((m) => m.sousRole === role);
    if (members.length === 0) continue;
    out.push(section(title));
    members.forEach((p, i) => {
      const etab = p.etablissementId && p.etablissementId !== 'NULL' ? etabById[p.etablissementId] : null;
      out.push(formatAccount({
        nom: p.nom,
        prenom: p.prenom,
        email: p.email,
        password: DEFAULT_PASSWORD,
        telephone: p.telephone,
        sousRole: p.sousRole,
        etablissement: etab,
      }, i + 1));
    });
  }

  // Admin établissement
  out.push(section('ADMINISTRATEURS ÉTABLISSEMENT'));
  adminEtab.forEach((p, i) => {
    out.push(formatAccount({
      nom: p.nom,
      prenom: p.prenom,
      email: p.email,
      password: DEFAULT_PASSWORD,
      telephone: p.telephone,
      etablissement: etabById[p.etablissementId] || p.etablissementId,
    }, i + 1));
  });

  // Établissements avec email
  const etabsAvecEmail = etablissements.filter((e) => e.email);
  out.push(section(`ÉTABLISSEMENTS (${etabsAvecEmail.length} comptes avec email)`));
  etabsAvecEmail.forEach((e, i) => {
    out.push(formatAccount({
      nom: e.nom,
      email: e.email,
      password: DEFAULT_PASSWORD,
      etablissement: `${e.nom} (${e.ville}, ${e.type})`,
    }, i + 1));
  });

  // Candidats
  out.push(section(`CANDIDATS / ÉTUDIANTS (${candidats.length} comptes)`));
  candidats.forEach((c, i) => {
    const compte = compteByProfilId[c.id];
    out.push(formatAccount({
      nom: c.nom,
      prenom: c.prenom,
      matricule: c.matricule,
      email: c.email,
      password: DEFAULT_PASSWORD,
      telephone: c.telephone,
      emailConfirme: c.emailConfirme,
    }, i + 1));
  });

  // Récapitulatif
  out.push(section('RÉCAPITULATIF'));
  out.push(`  Administrateurs système (manuels) : ${MANUAL_ADMINS.length}`);
  out.push(`  DGES                            : ${dges.length}`);
  out.push(`  Membres commission              : ${commission.length}`);
  out.push(`  Administrateurs établissement   : ${adminEtab.length}`);
  out.push(`  Établissements (avec email)     : ${etabsAvecEmail.length}`);
  out.push(`  Candidats / étudiants           : ${candidats.length}`);
  out.push(`  Total comptes (table Compte)    : ${comptes.length}`);
  out.push('');

  fs.writeFileSync(OUTPUT, out.join('\n'), 'utf8');
  console.log(`Fichier généré : ${OUTPUT}`);
}

main();
