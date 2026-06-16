// Tests du garde-fou série/date à la création d'inscription
// Prisma et services externes sont mockés : aucun accès base/réseau requis.

jest.mock('../../prisma', () => ({
  concours: { findUnique: jest.fn() },
  candidat: { findUnique: jest.fn() },
  inscription: { findFirst: jest.fn(), findUnique: jest.fn() },
  dossier: { findUnique: jest.fn(), create: jest.fn() },
  actionHistory: { findFirst: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(),
}));

jest.mock('../../supabase', () => ({ supabaseAdmin: {} }));

jest.mock('../../utils/numero-inscription.helper', () => ({
  genererNumeroInscriptionUnique: jest.fn().mockResolvedValue('2026-0001'),
}));

jest.mock('../../utils/inscription-email.helper', () => ({
  envoyerPreInscriptionApresCreation: jest.fn().mockResolvedValue(undefined),
}));

const prisma = require('../../prisma');
const { creerInscription, soumettreDossier } = require('../inscription.controller');

const FUTUR = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 jours
const PASSE = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // -30 jours

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function makeReq(concoursId = 'concours-1', candidatId = 'cand-1') {
  return {
    body: { concoursId },
    user: { id: candidatId },
    headers: {},
    connection: {},
  };
}

describe('creerInscription — garde-fou série / date de dépôt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refuse (403) un candidat dont la série n\'est pas acceptée', async () => {
    prisma.concours.findUnique.mockResolvedValue({
      id: 'concours-1',
      seriesAcceptees: ['G1', 'G2'],
      dateFin: FUTUR,
      dateFinDepot: null,
    });
    prisma.candidat.findUnique.mockResolvedValue({ serie: 'C' });

    const req = makeReq();
    const res = makeRes();
    await creerInscription(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/série/i) })
    );
    // L'inscription ne doit pas avoir été tentée
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuse (400) si la période de dépôt est terminée', async () => {
    prisma.concours.findUnique.mockResolvedValue({
      id: 'concours-1',
      seriesAcceptees: ['C'],
      dateFin: PASSE,
      dateFinDepot: null,
    });

    const req = makeReq();
    const res = makeRes();
    await creerInscription(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/dépôt/i) })
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('accepte une série compatible via alias (candidat G2, concours G)', async () => {
    prisma.concours.findUnique.mockResolvedValue({
      id: 'concours-1',
      seriesAcceptees: ['G'],
      dateFin: FUTUR,
      dateFinDepot: null,
      piecesRequises: { pieces: [{ id: 'quittance', nom: 'Quittance' }] },
    });
    prisma.candidat.findUnique.mockResolvedValue({ serie: 'G2' });
    prisma.inscription.findFirst.mockResolvedValue(null);
    prisma.dossier.findUnique.mockResolvedValue({
      id: 'dossier-1',
      acteNaissance: 'url',
      carteIdentite: 'url',
      photo: 'url',
      releve: 'url',
    });
    prisma.$transaction.mockImplementation(async (cb) =>
      cb({
        inscription: { create: jest.fn().mockResolvedValue({ id: 'ins-1' }) },
        dossierInscription: { create: jest.fn().mockResolvedValue({ id: 'di-1' }) },
        actionHistory: { create: jest.fn().mockResolvedValue({}) },
      })
    );
    prisma.inscription.findUnique.mockResolvedValue({
      id: 'ins-1',
      candidat: { id: 'cand-1', email: 'a@b.c' },
      concours: { id: 'concours-1', libelle: 'Test' },
      dossierInscription: { id: 'di-1' },
    });

    const req = makeReq();
    const res = makeRes();
    await creerInscription(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('renvoie 404 si le concours est introuvable', async () => {
    prisma.concours.findUnique.mockResolvedValue(null);

    const req = makeReq();
    const res = makeRes();
    await creerInscription(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('soumettreDossier', () => {
  const inscriptionComplete = {
    id: 'ins-1',
    concoursId: 'concours-1',
    candidatId: 'cand-1',
    candidat: {
      id: 'cand-1',
      telephone: '90000000',
      dateNaiss: new Date('2000-01-01'),
      lieuNaiss: 'Cotonou',
      dossier: {
        acteNaissance: 'u1',
        carteIdentite: 'u2',
        photo: 'u3',
        releve: 'u4',
      },
    },
    concours: {
      piecesRequises: { pieces: [{ id: 'quittance', nom: 'Quittance' }] },
    },
    dossierInscription: {
      id: 'di-1',
      statut: 'EN_ATTENTE',
      quittanceUrl: 'url-q',
      piecesExtras: {},
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('refuse un dossier incomplet', async () => {
    prisma.inscription.findFirst.mockResolvedValue({
      ...inscriptionComplete,
      dossierInscription: {
        ...inscriptionComplete.dossierInscription,
        quittanceUrl: null,
      },
    });

    const req = { params: { inscriptionId: 'ins-1' }, user: { id: 'cand-1' }, headers: {} };
    const res = makeRes();
    await soumettreDossier(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/incomplet/i) })
    );
  });

  it('soumet un dossier complet et trace DOSSIER_SOUMIS', async () => {
    prisma.inscription.findFirst.mockResolvedValue(inscriptionComplete);
    prisma.actionHistory.findFirst.mockResolvedValue(null);
    prisma.actionHistory.create.mockResolvedValue({
      id: 'act-1',
      timestamp: new Date('2026-05-29'),
    });

    const req = { params: { inscriptionId: 'ins-1' }, user: { id: 'cand-1' }, headers: {} };
    const res = makeRes();
    await soumettreDossier(req, res);

    expect(prisma.actionHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ typeAction: 'DOSSIER_SOUMIS' }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/soumis/i) })
    );
  });

  it('refuse une double soumission', async () => {
    prisma.inscription.findFirst.mockResolvedValue(inscriptionComplete);
    prisma.actionHistory.findFirst.mockResolvedValue({ timestamp: new Date() });

    const req = { params: { inscriptionId: 'ins-1' }, user: { id: 'cand-1' }, headers: {} };
    const res = makeRes();
    await soumettreDossier(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/déjà été soumis/i) })
    );
  });
});
