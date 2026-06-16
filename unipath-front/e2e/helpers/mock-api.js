/** Données de test partagées entre les scénarios E2E */
export const TEST_USER = {
  id: 'e2e-user-001',
  email: 'etudiant.e2e@unipath.test',
  role: 'ETUDIANT',
};

export const TEST_PROFIL_BASE = {
  id: TEST_USER.id,
  nom: 'KOUASSI',
  prenom: 'Awa',
  matricule: 'UAC-2026-E2E01',
  serie: 'D',
  serieBac: 'D',
  email: TEST_USER.email,
  role: 'ETUDIANT',
  inscriptions: [],
  dossier: {},
};

export const MOCK_ETABLISSEMENTS = [
  {
    id: 'etab-1',
    nom: 'ISMA Benin',
    type: 'PRIVE',
    ville: 'Cotonou',
    adresse: 'Cadjehoun',
    filieres: [
      { id: 'f1', nom: 'Informatique', niveau: 'LICENCE', etablissementId: 'etab-1' },
      { id: 'f2', nom: 'Gestion', niveau: 'LICENCE', etablissementId: 'etab-1' },
    ],
  },
  {
    id: 'etab-2',
    nom: 'ESGIS',
    type: 'PRIVE',
    ville: 'Cotonou',
    filieres: [
      { id: 'f3', nom: 'Droit', niveau: 'LICENCE', etablissementId: 'etab-2' },
    ],
  },
];

export const MOCK_FILIERES = MOCK_ETABLISSEMENTS.flatMap((e) =>
  e.filieres.map((f) => ({ ...f, etablissementId: e.id, etablissement: { id: e.id, nom: e.nom, type: 'PRIVE', ville: e.ville } }))
);

export const MOCK_CONCOURS = [
  {
    id: 'concours-1',
    libelle: 'Concours UAC 2026 — Série D',
    dateDebut: '2026-01-01',
    dateFin: '2026-12-31',
    seriesAcceptees: ['D'],
    actif: true,
  },
  {
    id: 'concours-2',
    libelle: 'Concours UAC 2026 — Série C',
    dateDebut: '2026-01-01',
    dateFin: '2026-12-31',
    seriesAcceptees: ['C'],
    actif: true,
  },
];

function json(route, status, body) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/**
 * Intercepte les appels API pour exécuter les E2E sans backend réel.
 */
export async function setupMockApi(page, options = {}) {
  const {
    dossierComplet = false,
    avecInscriptions = false,
    serie = 'D',
  } = options;

  const profil = {
    ...TEST_PROFIL_BASE,
    serie,
    serieBac: serie,
    dossier: dossierComplet
      ? { acteNaissance: 'ok', carteIdentite: 'ok', photo: 'ok', releve: 'ok' }
      : {},
    inscriptions: avecInscriptions
      ? [
          {
            id: 'ins-1',
            concoursId: 'concours-1',
            statut: 'EN_ATTENTE',
            estCandidatConcours: true,
            concours: MOCK_CONCOURS[0],
          },
        ]
      : [],
  };

  const completionPct = dossierComplet ? 100 : 25;

  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/auth/login') && method === 'POST') {
      return json(route, 200, {
        token: 'e2e-fake-jwt-token',
        user: { id: TEST_USER.id, role: 'ETUDIANT', email: TEST_USER.email },
      });
    }

    if (url.includes('/candidats/profil') && method === 'GET') {
      return json(route, 200, profil);
    }

    if (url.includes('/completion/') && method === 'GET') {
      return json(route, 200, {
        candidatId: TEST_USER.id,
        pourcentage: completionPct,
        estComplet: dossierComplet,
        piecesPresentes: dossierComplet ? 4 : 1,
        piecesRequises: 4,
      });
    }

    const concoursDetailMatch = url.match(/\/concours\/([^/?]+)$/);
    if (concoursDetailMatch && method === 'GET' && !url.includes('/commission') && !url.includes('classement')) {
      const id = concoursDetailMatch[1];
      const concours = MOCK_CONCOURS.find((c) => c.id === id) || MOCK_CONCOURS[0];
      return json(route, 200, {
        ...concours,
        description: 'Concours de test E2E',
        piecesRequises: { pieces: [] },
        dateFinDepot: '2026-12-31',
      });
    }

    if (url.includes('/concours') && method === 'GET' && !url.includes('/commission')) {
      const filtered = MOCK_CONCOURS.filter((c) =>
        c.seriesAcceptees.some((s) => s === serie || s === serie.charAt(0))
      );
      return json(route, 200, filtered.length ? filtered : [MOCK_CONCOURS[0]]);
    }

    if (url.includes('/etablissements/recherche-filieres') && method === 'POST') {
      const body = route.request().postDataJSON();
      const choix = [body.choix1, body.choix2, body.choix3].map((c) => (c || '').toLowerCase());
      const resultats = MOCK_ETABLISSEMENTS.filter((e) =>
        e.filieres.some((f) => choix.includes(f.nom.toLowerCase()))
      );
      return json(route, 200, {
        message: `${resultats.length} établissement(s) privé(s) trouvé(s)`,
        choix: body,
        etablissements: resultats,
      });
    }

    if (url.includes('/etablissements') && method === 'GET' && !url.includes('/mon/')) {
      return json(route, 200, {
        message: 'ok',
        etablissements: MOCK_ETABLISSEMENTS,
      });
    }

    if (url.includes('/filieres') && method === 'GET') {
      return json(route, 200, { message: 'ok', filieres: MOCK_FILIERES });
    }

    if (url.includes('/notifications/unread-count')) {
      return json(route, 200, { count: 0 });
    }

    if (url.includes('/notifications')) {
      return json(route, 200, { notifications: [] });
    }

    return json(route, 200, {});
  });

  return { profil };
}
