const prisma = require('../prisma');

const DEFAULT_FORMAT = '{SIGLE_ECOLE}-{SIGLE_FILIERE}-{ANNEE}-{SEQ4}';

const SITE_CODES = {
  DEFAULT: 'UnP',
};

function getSiteCode() {
  return process.env.SITE_CODE || SITE_CODES.DEFAULT;
}

function getAnneeAcademique() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 9 ? year + 1 : year;
}

async function genererNumeroSequentiel(siteCode, annee) {
  const prefix = `${siteCode}-${annee}-`;
  const count = await prisma.candidat.count({
    where: { matricule: { startsWith: prefix } },
  });
  return String(count + 1).padStart(6, '0');
}

async function genererMatricule() {
  const siteCode = getSiteCode();
  const annee = getAnneeAcademique();
  const numero = await genererNumeroSequentiel(siteCode, annee);
  return `${siteCode}-${annee}-${numero}`;
}

async function matriculeExiste(matricule) {
  const count = await prisma.candidat.count({ where: { matricule } });
  return count > 0;
}

async function genererMatriculeUnique() {
  let matricule;
  let tentatives = 0;
  const maxTentatives = 10;

  do {
    matricule = await genererMatricule();
    tentatives += 1;

    if (tentatives >= maxTentatives) {
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      matricule = `${matricule}-${random}`;
      break;
    }
  } while (await matriculeExiste(matricule));

  return matricule;
}

function parseMatricule(matricule) {
  const parts = String(matricule).split('-');
  if (parts.length >= 3) {
    return {
      siteCode: parts[0],
      annee: parseInt(parts[1], 10),
      numero: parseInt(parts[2], 10),
      isValid: true,
    };
  }
  return { siteCode: null, annee: null, numero: null, isValid: false };
}

function validerFormatMatricule(matricule) {
  return /^[A-Za-z]{2,4}-\d{4}-\d{6}(-[A-Z0-9]{4})?$/.test(matricule);
}

function extractAnnee(anneeAcademique) {
  if (!anneeAcademique) return String(new Date().getFullYear());
  const match = String(anneeAcademique).match(/\d{4}/);
  return match ? match[0] : String(anneeAcademique);
}

function deriveSigleEcole(etablissement, filiere) {
  if (filiere?.code) {
    const prefix = String(filiere.code).split('-')[0];
    if (prefix) return prefix.toUpperCase();
  }
  if (!etablissement?.nom) return 'ETAB';
  return etablissement.nom
    .split(/\s+/)
    .filter((w) => w.length > 2 && !/^(de|du|des|la|le|les|et|d)$/i.test(w))
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 8) || 'ETAB';
}

function deriveSigleFiliere(filiere) {
  if (filiere?.sigle) return String(filiere.sigle).toUpperCase();
  if (filiere?.code) {
    const parts = String(filiere.code).split('-');
    if (parts.length >= 2) return parts[1].toUpperCase();
  }
  if (filiere?.nom) {
    return filiere.nom
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 6);
  }
  return 'FIL';
}

function formatMatricule(template, { sigleEcole, sigleFiliere, anneeAcademique, seq }) {
  const format = template || DEFAULT_FORMAT;
  const annee = extractAnnee(anneeAcademique);
  const seqNum = Number(seq) || 0;

  return format
    .replace(/\{SIGLE_ECOLE\}/g, sigleEcole)
    .replace(/\{SIGLE_FILIERE\}/g, sigleFiliere)
    .replace(/\{ANNEE\}/g, annee)
    .replace(/\{SEQ4\}/g, String(seqNum).padStart(4, '0'))
    .replace(/\{SEQ3\}/g, String(seqNum).padStart(3, '0'))
    .replace(/\{SEQ\}/g, String(seqNum));
}

module.exports = {
  DEFAULT_FORMAT,
  SITE_CODES,
  getSiteCode,
  getAnneeAcademique,
  genererMatricule,
  genererMatriculeUnique,
  matriculeExiste,
  parseMatricule,
  validerFormatMatricule,
  extractAnnee,
  deriveSigleEcole,
  deriveSigleFiliere,
  formatMatricule,
};
