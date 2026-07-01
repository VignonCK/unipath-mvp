/**
 * Configuration MVP concours : pièces essentielles + matières de composition (niveau Bac).
 */

const SOURCE_TAG_OFFICIEL = '[MESRS-CONCOURS-2026]';

const PIECES_MVP = [
  {
    id: 'quittance',
    nom: 'Quittance de paiement',
    formats: ['PDF'],
    obligatoire: true,
    sourceDossier: null,
  },
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
    formats: ['PDF', 'JPEG', 'PNG'],
    obligatoire: true,
    sourceDossier: 'carteIdentite',
  },
  {
    id: 'photo_identite',
    nom: "Photo d'identité",
    formats: ['JPEG', 'PNG', 'PDF'],
    obligatoire: true,
    sourceDossier: 'photo',
    description: '1 fichier image (JPEG ou PNG)',
  },
  {
    id: 'releve_bac',
    nom: 'Relevé de notes du Bac',
    formats: ['PDF'],
    obligatoire: true,
    sourceDossier: 'releve',
  },
];

const MATIERES_BY_DOMAINE = {
  Sante: ['Mathématiques', 'SVT', 'Physique-Chimie', 'Culture générale'],
  'Sante & Nutrition': ['Mathématiques', 'SVT', 'Physique-Chimie', 'Culture générale'],
  'Sciences medicales': ['Mathématiques', 'SVT', 'Physique-Chimie', 'Culture générale'],
  'Economie & Gestion': ['Mathématiques', 'Français', 'Anglais', 'Culture générale'],
  'Statistique & Planification': ['Mathématiques', 'Français', 'Culture générale'],
  'Informatique & Telecoms': ['Mathématiques', 'Physique-Chimie', 'Anglais', 'Culture générale'],
  Informatique: ['Mathématiques', 'Physique-Chimie', 'Anglais', 'Culture générale'],
  'Classes Preparatoires': ['Mathématiques', 'Physique-Chimie', 'SVT', 'Culture générale'],
  'Sport & EPS': ['Mathématiques', 'SVT', 'Français', 'Culture générale'],
  'Formation des enseignants': [
    'Mathématiques',
    'Français',
    'Histoire-Géographie',
    'Anglais',
    'Culture générale',
  ],
  'Enseignement technique': ['Mathématiques', 'Physique-Chimie', 'SVT', 'Culture générale'],
  Agriculture: ['Mathématiques', 'SVT', 'Physique-Chimie', 'Culture générale'],
  'Agronomie & Environnement': ['Mathématiques', 'SVT', 'Physique-Chimie', 'Culture générale'],
  'Agriculture & Developpement rural': ['Mathématiques', 'SVT', 'Physique-Chimie', 'Culture générale'],
  'Ingenierie & Polytechnique': ['Mathématiques', 'Physique-Chimie', 'SVT', 'Culture générale'],
  'Genie industriel & Energie': ['Mathématiques', 'Physique-Chimie', 'SVT', 'Culture générale'],
  'Technologies appliquees': ['Mathématiques', 'Physique-Chimie', 'SVT', 'Culture générale'],
  'Administration & Droit': ['Français', 'Culture générale', 'Anglais', 'Mathématiques'],
};

const MATIERES_DEFAULT = ['Mathématiques', 'Français', 'Culture générale'];

const MATIERES_SIGLE_OVERRIDES = {
  INSPEI: ['Mathématiques', 'Physique-Chimie', 'SVT', 'Culture générale'],
};

const FILIERE_KEYWORDS = /genie|gestion|soins|administration|commerce|agri|informatique de|statistique|planification|demographie|medecine|nutrition|obstetrique|kinesi|mpsi|pcsi|tsi|developpement rural|maintenance|robotique|cyber|telecom|magistrature|diplomatie|agroalimentaire|productique|embbed|embarqu/i;

function extractDomaineFromDescription(description = '') {
  const match = String(description).match(/Domaine:\s*(.+)/);
  return match ? match[1].trim() : null;
}

function resolveMatieresComposees(domaine, sigle) {
  if (sigle && MATIERES_SIGLE_OVERRIDES[sigle]) {
    return [...MATIERES_SIGLE_OVERRIDES[sigle]];
  }
  if (domaine && MATIERES_BY_DOMAINE[domaine]) {
    return [...MATIERES_BY_DOMAINE[domaine]];
  }
  return [...MATIERES_DEFAULT];
}

function matieresLookLikeFilieres(matieres = []) {
  if (!Array.isArray(matieres) || matieres.length === 0) return true;
  return matieres.some((m) => FILIERE_KEYWORDS.test(String(m)));
}

function buildPiecesRequisesMvp() {
  return {
    pieces: PIECES_MVP.map((p) => ({ ...p, formats: [...p.formats] })),
  };
}

module.exports = {
  SOURCE_TAG_OFFICIEL,
  PIECES_MVP,
  MATIERES_BY_DOMAINE,
  MATIERES_DEFAULT,
  extractDomaineFromDescription,
  resolveMatieresComposees,
  matieresLookLikeFilieres,
  buildPiecesRequisesMvp,
};
