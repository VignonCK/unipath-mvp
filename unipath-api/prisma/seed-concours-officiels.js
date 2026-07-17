const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SOURCE_TAG = '[MESRS-CONCOURS-2026]';
const SERIES_VALIDES = ['A', 'B', 'C', 'D', 'E', 'F1', 'F2', 'F3', 'F4', 'G1', 'G2', 'G3', 'G'];

// Mapping adapte de votre logique metier partagee en chat.
const SERIES_BY_SIGLE = {
  INMeS: ['C', 'D'],
  IFSIO: ['C', 'D'],
  ENEAM: ['A', 'B', 'C', 'D', 'G1', 'G2', 'G3'],
  ENSPD: ['C', 'D', 'G2'],
  ENSTIC: ['C', 'D', 'F3'],
  INSPEI: ['C', 'D'],
  INEPS: ['A', 'B', 'C', 'D', 'F1', 'F2', 'F3', 'G1', 'G2', 'G3'],
  'ENS Porto-Novo': ['A', 'B', 'C', 'D'],
  'ENS Natitingou': ['A', 'B', 'C', 'D'],
  ENSET: ['C', 'D', 'F1', 'F2', 'F3'],
  'IUEP-MA': ['C', 'D'],
  EPAC: ['C', 'D'],
  FSA: ['C', 'D'],
  FMSS: ['C', 'D'],
  ENAM: ['A', 'B', 'C', 'D', 'G1', 'G2', 'G3'],
  ESMA: ['C', 'D'],
  IFRI: ['C', 'D'],
  ENSGTI: ['C', 'D', 'F1', 'F2', 'F3'],
  'IUT-Lokossa': ['C', 'D', 'F1', 'F2', 'F3'],
  IPEN: ['C', 'D'],
};

/** Pièces communes à tous les concours officiels (ids stables pour le frontend). */
const PIECES_COMMUNES = [
  {
    id: 'acte_naissance',
    nom: 'Acte de naissance',
    formats: ['PDF'],
    obligatoire: true,
    sourceDossier: 'acteNaissance',
  },
  {
    id: 'carte_identite',
    nom: "Carte nationale d'identité",
    formats: ['PDF'],
    obligatoire: true,
    sourceDossier: 'carteIdentite',
  },
  {
    id: 'photo_identite',
    nom: "Photo d'identité (4 exemplaires)",
    formats: ['PDF', 'JPG', 'PNG'],
    obligatoire: true,
    sourceDossier: 'photo',
  },
  {
    id: 'releve_bac',
    nom: 'Relevé de notes du Bac',
    formats: ['PDF'],
    obligatoire: true,
    sourceDossier: 'releve',
  },
  {
    id: 'diplome_bac',
    nom: 'Diplôme du Bac ou attestation',
    formats: ['PDF'],
    obligatoire: true,
    sourceDossier: null,
  },
  {
    id: 'casier_judiciaire',
    nom: 'Casier judiciaire (bulletin n°3)',
    formats: ['PDF'],
    obligatoire: true,
    sourceDossier: null,
  },
  {
    id: 'certificat_medical',
    nom: 'Certificat médical de bonne santé',
    formats: ['PDF'],
    obligatoire: true,
    sourceDossier: null,
  },
  {
    id: 'quittance',
    nom: 'Quittance de paiement des frais',
    formats: ['PDF'],
    obligatoire: true,
    sourceDossier: null,
  },
];

const PIECE_CERTIFICAT_MEDICAL_SPECIALISE = {
  id: 'certificat_medical_specialise',
  nom: 'Certificat médical spécialisé (visite médicale approfondie)',
  formats: ['PDF'],
  obligatoire: true,
  sourceDossier: null,
};

const PIECE_CERTIFICAT_MEDICAL_SPORTIF = {
  id: 'certificat_medical_sportif',
  nom: 'Certificat médical sportif délivré par un médecin agréé',
  formats: ['PDF'],
  obligatoire: true,
  sourceDossier: null,
};

const PIECE_CASIER_JUDICIAIRE_RECENT = {
  id: 'casier_judiciaire_recent',
  nom: 'Extrait de casier judiciaire n°3 daté de moins de 3 mois',
  formats: ['PDF'],
  obligatoire: true,
  sourceDossier: null,
};

const PIECE_CERTIFICAT_RESIDENCE = {
  id: 'certificat_residence',
  nom: 'Certificat de résidence',
  formats: ['PDF'],
  obligatoire: true,
  sourceDossier: null,
};

const PIECE_RELEVE_DEUX_ANNEES = {
  id: 'releve_deux_annees',
  nom: 'Relevé de notes des deux dernières années (si disponible)',
  formats: ['PDF'],
  obligatoire: false,
  sourceDossier: null,
};

const PIECE_EXTRAIT_NAISSANCE_LEGALISE = {
  id: 'extrait_naissance_legalise',
  nom: 'Extrait de naissance légalisé',
  formats: ['PDF'],
  obligatoire: true,
  sourceDossier: null,
};

const PIECE_LETTRE_MOTIVATION = {
  id: 'lettre_motivation',
  nom: 'Lettre de motivation manuscrite',
  formats: ['PDF'],
  obligatoire: true,
  sourceDossier: null,
};

const PIECE_CERTIFICAT_BONNE_VIE_MOEURS = {
  id: 'certificat_bonne_vie_moeurs',
  nom: 'Certificat de bonne vie et mœurs',
  formats: ['PDF'],
  obligatoire: true,
  sourceDossier: null,
};

const PIECES_BY_SIGLE = {
  INMeS: [PIECE_CERTIFICAT_MEDICAL_SPECIALISE],
  FMSS: [PIECE_CERTIFICAT_MEDICAL_SPECIALISE],
  INEPS: [PIECE_CERTIFICAT_MEDICAL_SPORTIF],
  ENAM: [PIECE_CASIER_JUDICIAIRE_RECENT, PIECE_CERTIFICAT_RESIDENCE],
  ENEAM: [PIECE_CERTIFICAT_RESIDENCE],
  ENSPD: [PIECE_RELEVE_DEUX_ANNEES],
  ENSTIC: [PIECE_RELEVE_DEUX_ANNEES],
  ENSGTI: [PIECE_RELEVE_DEUX_ANNEES],
  ENSET: [PIECE_RELEVE_DEUX_ANNEES],
  'IUT-Lokossa': [PIECE_RELEVE_DEUX_ANNEES],
  IFSIO: [PIECE_CERTIFICAT_MEDICAL_SPECIALISE, PIECE_EXTRAIT_NAISSANCE_LEGALISE],
  IFRI: [PIECE_LETTRE_MOTIVATION],
  ESMA: [PIECE_CERTIFICAT_BONNE_VIE_MOEURS],
};

const MONTHS = {
  janvier: 0,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  decembre: 11,
};

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function inferExamDate(dateIndicative, year = 2026) {
  const normalized = normalizeText(dateIndicative);

  const explicit = normalized.match(/^(\d{1,2})\s+([a-z]+)/);
  if (explicit) {
    const day = Number(explicit[1]);
    const month = MONTHS[explicit[2]];
    if (Number.isInteger(day) && month !== undefined) {
      return new Date(Date.UTC(year, month, day, 9, 0, 0));
    }
  }

  const range = normalized.match(/^([a-z]+)\s*-\s*([a-z]+)/);
  if (range) {
    const startMonth = MONTHS[range[1]];
    if (startMonth !== undefined) {
      return new Date(Date.UTC(year, startMonth, 15, 9, 0, 0));
    }
  }

  const firstMonthToken = normalized.split(/\s+/)[0];
  const month = MONTHS[firstMonthToken];
  if (month !== undefined) {
    return new Date(Date.UTC(year, month, 15, 9, 0, 0));
  }

  return new Date(Date.UTC(year, 7, 31, 9, 0, 0));
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function normalizeSeries(series = []) {
  const normalized = series
    .map((s) => String(s).trim().toUpperCase())
    .filter((s) => SERIES_VALIDES.includes(s));

  return [...new Set(normalized)];
}

function toConcoursRecord(item, universites, metadata) {
  const uni = universites.get(item.universite_id);
  const examDate = inferExamDate(item.date_epreuves_indicative, 2026);
  const dateDebutDepot = addDays(examDate, -60);
  const dateFinDepot = addDays(examDate, -15);
  const dateDebutComposition = examDate;
  const dateFinComposition = addDays(examDate, 1);

  const etablissement = [
    item.nom,
    item.sigle ? `(${item.sigle})` : null,
    uni?.nom ? `- ${uni.nom}` : null,
    item.ville ? `- ${item.ville}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const seriesConfigured = normalizeSeries(
    item.series_acceptees || SERIES_BY_SIGLE[item.sigle] || []
  );
  const seriesAcceptees = seriesConfigured.length > 0 ? seriesConfigured : SERIES_VALIDES;

  const criteres = [
    { titre: `Nationalite: ${metadata.conditions_generales.nationalite}` },
    { titre: `Diplome requis: ${item.niveau_acces || metadata.conditions_generales.diplome_requis}` },
    { titre: `Mention minimale: ${item.mention_minimale || metadata.conditions_generales.mention_minimale}` },
    { titre: `Age maximal: ${item.age_max ?? metadata.conditions_generales.age_max_annee_bac} ans` },
    { titre: `Type de concours: ${item.type_concours}` },
    { titre: `Series acceptees: ${seriesAcceptees.join(', ')}` },
  ];

  const descriptionLines = [
    `${SOURCE_TAG} Source: ${metadata._meta.source}`,
    `Domaine: ${item.domaine}`,
    `Filieres: ${item.filieres.join(', ')}`,
    `Debouches: ${item.debouches.join(', ')}`,
    `Duree de formation: ${item.duree_formation}`,
    `Date epreuves indicative: ${item.date_epreuves_indicative}`,
    `Plateforme d'inscription: ${item.site_inscription || metadata._meta.plateforme_inscription}`,
  ];

  return {
    libelle: `Concours ${item.sigle} 2026`,
    etablissement,
    dateDebut: dateDebutDepot,
    dateFin: dateFinDepot,
    dateComposition: dateDebutComposition,
    description: descriptionLines.join('\n'),
    fraisParticipation: item.frais_inscription_fcfa || metadata._meta.frais_dossier_fcfa,
    seriesAcceptees,
    matieres: item.filieres,
    piecesRequises: {
      pieces: [
        ...PIECES_COMMUNES,
        ...(PIECES_BY_SIGLE[item.sigle] || []),
      ],
    },
    criteresEligibilite: { criteres },
    dateDebutDepot,
    dateFinDepot,
    dateDebutComposition,
    dateFinComposition,
  };
}

async function main() {
  const filePath = path.join(__dirname, 'data', 'concours-officiels-2026.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const payload = JSON.parse(raw);

  const universites = new Map(payload.universites.map((u) => [u.id, u]));
  const concoursRecords = payload.concours
    .filter((item) => item.actif)
    .map((item) => toConcoursRecord(item, universites, payload));

  console.log(`Import en cours: ${concoursRecords.length} concours officiels...`);

  await prisma.concours.deleteMany({
    where: {
      description: {
        startsWith: SOURCE_TAG,
      },
    },
  });

  await prisma.concours.createMany({
    data: concoursRecords,
  });

  console.log(`Termine: ${concoursRecords.length} concours officiels importes.`);
}

main()
  .catch((error) => {
    console.error('Erreur seed concours officiels:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
