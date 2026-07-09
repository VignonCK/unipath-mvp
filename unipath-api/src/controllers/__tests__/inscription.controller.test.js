// Tests inscription controller

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
  genererNumeroInscriptionPourConcours: jest.fn().mockResolvedValue('ENAM-2026-0001'),
}));

jest.mock('../../utils/inscription-email.helper', () => ({
  envoyerPreInscriptionApresCreation: jest.fn().mockResolvedValue(undefined),
}));

const prisma = require('../../prisma');
const { creerInscription, soumettreDossier } = require('../inscription.controller');

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

describe('creerInscription — déprécié', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renvoie 410 et ne crée pas d\'inscription', async () => {
    const req = makeReq();
    const res = makeRes();
    await creerInscription(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringMatching(/plus disponible/i),
        useInstead: 'POST /api/inscriptions/soumettre',
      })
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.concours.findUnique).not.toHaveBeenCalled();
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
