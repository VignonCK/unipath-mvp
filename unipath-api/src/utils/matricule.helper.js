const DEFAULT_FORMAT = '{SIGLE_ECOLE}-{SIGLE_FILIERE}-{ANNEE}-{SEQ4}';

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
  extractAnnee,
  deriveSigleEcole,
  deriveSigleFiliere,
  formatMatricule,
};
