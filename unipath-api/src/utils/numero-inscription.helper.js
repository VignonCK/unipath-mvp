/**
 * Génération du numéro d'inscription unique (par concours / année)
 * Format: INS-{ANNEE}-{6 chiffres}
 */
const prisma = require('../prisma');
const { getAnneeAcademique } = require('./matricule.helper');

async function genererNumeroInscriptionUnique() {
  const annee = getAnneeAcademique();
  const prefix = `INS-${annee}-`;

  const count = await prisma.inscription.count({
    where: {
      numeroInscription: { startsWith: prefix },
    },
  });

  let numero = `${prefix}${(count + 1).toString().padStart(6, '0')}`;
  let tentatives = 0;

  while (tentatives < 10) {
    const existe = await prisma.inscription.findFirst({
      where: { numeroInscription: numero },
      select: { id: true },
    });
    if (!existe) return numero;
    tentatives += 1;
    numero = `${prefix}${(count + 1 + tentatives).toString().padStart(6, '0')}`;
  }

  return `${prefix}${Date.now().toString().slice(-6)}`;
}

module.exports = { genererNumeroInscriptionUnique };
