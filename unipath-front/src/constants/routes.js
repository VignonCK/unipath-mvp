export const MODULES = {
  CONCOURS: 'concours',
  PARCOURS: 'parcours',
  HUB: 'hub',
};

export const ROUTES = {
  hub: '/dashboard',
  monCompte: '/mon-compte',
  maCarte: '/ma-carte',
  concours: {
    home: '/concours',
    ouverts: '/concours/ouverts',
    detail: (id) => `/concours/ouverts/${id}`,
    classement: (id) => `/concours/ouverts/${id}/classement`,
    inscription: (id) => `/concours/inscription/${id}`,
  },
  parcours: {
    home: '/parcours',
    etablissements: '/parcours/etablissements',
    etablissement: (id) => `/parcours/etablissements/${id}`,
    dossiers: '/parcours/dossiers',
    mesInscriptions: '/parcours/mes-inscriptions',
    campagnes: '/parcours/campagnes',
    campagne: (id) => `/parcours/campagnes/${id}`,
    releve: '/parcours/releve',
  },
};

export function detectModuleFromPath(pathname) {
  if (pathname.startsWith('/concours')) return MODULES.CONCOURS;
  if (pathname.startsWith('/parcours')) return MODULES.PARCOURS;
  return MODULES.HUB;
}
