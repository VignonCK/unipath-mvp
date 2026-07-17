/**
 * Référentiel des 77 communes du Bénin — codes 01 à 77.
 * Cotonou = 01 (conforme au format de numéro de table DEC).
 * Les autres communes sont classées alphabétiquement.
 */
const COMMUNES_BENIN = [
  { code: '01', nom: 'Cotonou', departement: 'Littoral', aliases: ['Cotonou'] },
  { code: '02', nom: 'Abomey', departement: 'Zou', aliases: ['Abomey'] },
  { code: '03', nom: 'Abomey-Calavi', departement: 'Atlantique', aliases: ['Abomey-Calavi', 'Abomey Calavi', 'Calavi'] },
  { code: '04', nom: 'Adja-Ouèrè', departement: 'Plateau', aliases: ['Adja-Ouèrè', 'Adja-Ouere', 'Adja Ouere'] },
  { code: '05', nom: 'Adjarra', departement: 'Ouémé', aliases: ['Adjarra'] },
  { code: '06', nom: 'Adjohoun', departement: 'Ouémé', aliases: ['Adjohoun'] },
  { code: '07', nom: 'Aguégués', departement: 'Ouémé', aliases: ['Aguégués', 'Aguegues'] },
  { code: '08', nom: 'Akpro-Missérété', departement: 'Ouémé', aliases: ['Akpro-Missérété', 'Akpro-Misserete', 'Akpro Misserete'] },
  { code: '09', nom: 'Allada', departement: 'Atlantique', aliases: ['Allada'] },
  { code: '10', nom: 'Aplahoué', departement: 'Couffo', aliases: ['Aplahoué', 'Aplahoue'] },
  { code: '11', nom: 'Athiémé', departement: 'Mono', aliases: ['Athiémé', 'Athieme'] },
  { code: '12', nom: 'Avrankou', departement: 'Ouémé', aliases: ['Avrankou'] },
  { code: '13', nom: 'Banikoara', departement: 'Alibori', aliases: ['Banikoara'] },
  { code: '14', nom: 'Bantè', departement: 'Collines', aliases: ['Bantè', 'Bante'] },
  { code: '15', nom: 'Bassila', departement: 'Donga', aliases: ['Bassila'] },
  { code: '16', nom: 'Bembèrèkè', departement: 'Borgou', aliases: ['Bembèrèkè', 'Bembereke'] },
  { code: '17', nom: 'Bohicon', departement: 'Zou', aliases: ['Bohicon'] },
  { code: '18', nom: 'Bonou', departement: 'Ouémé', aliases: ['Bonou'] },
  { code: '19', nom: 'Bopa', departement: 'Mono', aliases: ['Bopa'] },
  { code: '20', nom: 'Boukoumbé', departement: 'Atacora', aliases: ['Boukoumbé', 'Boukoumbe'] },
  { code: '21', nom: 'Cobly', departement: 'Atacora', aliases: ['Cobly', 'Cobli'] },
  { code: '22', nom: 'Comè', departement: 'Mono', aliases: ['Comè', 'Come'] },
  { code: '23', nom: 'Copargo', departement: 'Donga', aliases: ['Copargo'] },
  { code: '24', nom: 'Covè', departement: 'Zou', aliases: ['Covè', 'Cove'] },
  { code: '25', nom: 'Dangbo', departement: 'Ouémé', aliases: ['Dangbo'] },
  { code: '26', nom: 'Dassa-Zoumé', departement: 'Collines', aliases: ['Dassa-Zoumé', 'Dassa-Zoume', 'Dassa'] },
  { code: '27', nom: 'Djakotomey', departement: 'Couffo', aliases: ['Djakotomey'] },
  { code: '28', nom: 'Djidja', departement: 'Zou', aliases: ['Djidja'] },
  { code: '29', nom: 'Djougou', departement: 'Donga', aliases: ['Djougou'] },
  { code: '30', nom: 'Dogbo', departement: 'Couffo', aliases: ['Dogbo'] },
  { code: '31', nom: 'Glazoué', departement: 'Collines', aliases: ['Glazoué', 'Glazoue'] },
  { code: '32', nom: 'Gogounou', departement: 'Alibori', aliases: ['Gogounou'] },
  { code: '33', nom: 'Grand-Popo', departement: 'Mono', aliases: ['Grand-Popo', 'Grand Popo'] },
  { code: '34', nom: 'Houéyogbé', departement: 'Mono', aliases: ['Houéyogbé', 'Houeyogbe'] },
  { code: '35', nom: 'Ifangni', departement: 'Plateau', aliases: ['Ifangni'] },
  { code: '36', nom: 'Kalalé', departement: 'Borgou', aliases: ['Kalalé', 'Kalale'] },
  { code: '37', nom: 'Kandi', departement: 'Alibori', aliases: ['Kandi'] },
  { code: '38', nom: 'Karimama', departement: 'Alibori', aliases: ['Karimama'] },
  { code: '39', nom: 'Kérou', departement: 'Atacora', aliases: ['Kérou', 'Kerou'] },
  { code: '40', nom: 'Kétou', departement: 'Plateau', aliases: ['Kétou', 'Ketou'] },
  { code: '41', nom: 'Klouékanmè', departement: 'Couffo', aliases: ['Klouékanmè', 'Klouekanme', 'Klouekanmey'] },
  { code: '42', nom: 'Kouandé', departement: 'Atacora', aliases: ['Kouandé', 'Kouande'] },
  { code: '43', nom: 'Kpomassè', departement: 'Atlantique', aliases: ['Kpomassè', 'Kpomasse'] },
  { code: '44', nom: 'Lalo', departement: 'Couffo', aliases: ['Lalo'] },
  { code: '45', nom: 'Lokossa', departement: 'Mono', aliases: ['Lokossa'] },
  { code: '46', nom: 'Malanville', departement: 'Alibori', aliases: ['Malanville'] },
  { code: '47', nom: 'Matéri', departement: 'Atacora', aliases: ['Matéri', 'Materi'] },
  { code: '48', nom: 'N\'Dali', departement: 'Borgou', aliases: ['N\'Dali', 'Ndali', 'NDali'] },
  { code: '49', nom: 'Natitingou', departement: 'Atacora', aliases: ['Natitingou'] },
  { code: '50', nom: 'Nikki', departement: 'Borgou', aliases: ['Nikki'] },
  { code: '51', nom: 'Ouaké', departement: 'Donga', aliases: ['Ouaké', 'Ouake'] },
  { code: '52', nom: 'Ouassa-Péhunco', departement: 'Atacora', aliases: ['Ouassa-Péhunco', 'Ouassa-Pehunco', 'Péhunco', 'Pehunco'] },
  { code: '53', nom: 'Ouèssè', departement: 'Collines', aliases: ['Ouèssè', 'Ouesse'] },
  { code: '54', nom: 'Ouidah', departement: 'Atlantique', aliases: ['Ouidah'] },
  { code: '55', nom: 'Ouinhi', departement: 'Zou', aliases: ['Ouinhi'] },
  { code: '56', nom: 'Parakou', departement: 'Borgou', aliases: ['Parakou'] },
  { code: '57', nom: 'Pèrèrè', departement: 'Borgou', aliases: ['Pèrèrè', 'Perere'] },
  { code: '58', nom: 'Pobè', departement: 'Plateau', aliases: ['Pobè', 'Pobe'] },
  { code: '59', nom: 'Porto-Novo', departement: 'Ouémé', aliases: ['Porto-Novo', 'Porto Novo'] },
  { code: '60', nom: 'Sakété', departement: 'Plateau', aliases: ['Sakété', 'Sakete'] },
  { code: '61', nom: 'Savalou', departement: 'Collines', aliases: ['Savalou'] },
  { code: '62', nom: 'Savè', departement: 'Collines', aliases: ['Savè', 'Save'] },
  { code: '63', nom: 'Sègbana', departement: 'Alibori', aliases: ['Sègbana', 'Segbana'] },
  { code: '64', nom: 'Sèmè-Podji', departement: 'Ouémé', aliases: ['Sèmè-Podji', 'Seme-Podji', 'Sèmè Podji'] },
  { code: '65', nom: 'Sinendé', departement: 'Borgou', aliases: ['Sinendé', 'Sinende'] },
  { code: '66', nom: 'Sô-Ava', departement: 'Atlantique', aliases: ['Sô-Ava', 'So-Ava', 'So Ava'] },
  { code: '67', nom: 'Tanguiéta', departement: 'Atacora', aliases: ['Tanguiéta', 'Tanguieta'] },
  { code: '68', nom: 'Tchaourou', departement: 'Borgou', aliases: ['Tchaourou'] },
  { code: '69', nom: 'Toffo', departement: 'Atlantique', aliases: ['Toffo'] },
  { code: '70', nom: 'Tori-Bossito', departement: 'Atlantique', aliases: ['Tori-Bossito', 'Tori Bossito', 'Tori'] },
  { code: '71', nom: 'Toucountouna', departement: 'Atacora', aliases: ['Toucountouna', 'Tountouna'] },
  { code: '72', nom: 'Toviklin', departement: 'Couffo', aliases: ['Toviklin'] },
  { code: '73', nom: 'Za-Kpota', departement: 'Zou', aliases: ['Za-Kpota', 'Za Kpota', 'Zakpota'] },
  { code: '74', nom: 'Zagnanado', departement: 'Zou', aliases: ['Zagnanado'] },
  { code: '75', nom: 'Zè', departement: 'Atlantique', aliases: ['Zè', 'Ze'] },
  { code: '76', nom: 'Zogbodomey', departement: 'Zou', aliases: ['Zogbodomey', 'Zogbodomé'] },
  { code: '77', nom: 'Agbangnizoun', departement: 'Zou', aliases: ['Agbangnizoun'] },
];

function normalizeVille(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Map clé normalisée → code commune */
function buildVilleIndex(communes = COMMUNES_BENIN) {
  const index = new Map();
  for (const c of communes) {
    const keys = [c.nom, ...(Array.isArray(c.aliases) ? c.aliases : [])];
    for (const key of keys) {
      const n = normalizeVille(key);
      if (n) index.set(n, c.code);
    }
  }
  return index;
}

const VILLE_TO_CODE = buildVilleIndex();

/**
 * Résout le code commune (01–77) à partir d'un libellé de ville.
 * @returns {string|null}
 */
function resolveCommuneCode(ville) {
  const n = normalizeVille(ville);
  if (!n) return null;
  if (VILLE_TO_CODE.has(n)) return VILLE_TO_CODE.get(n);

  // Correspondance partielle (ex. "Godomey, Abomey-Calavi")
  for (const [key, code] of VILLE_TO_CODE.entries()) {
    if (n.includes(key) || key.includes(n)) return code;
  }
  return null;
}

module.exports = {
  COMMUNES_BENIN,
  normalizeVille,
  resolveCommuneCode,
  buildVilleIndex,
};
