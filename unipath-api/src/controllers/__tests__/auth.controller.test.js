jest.mock('../../prisma', () => ({
  candidat: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  notification: { create: jest.fn() },
  emailDelivery: { create: jest.fn() },
  membreCommission: { findUnique: jest.fn() },
  administrateurDGES: { findUnique: jest.fn() },
  controleur: { findUnique: jest.fn() },
  etablissement: { findUnique: jest.fn() },
}));

jest.mock('../../supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

jest.mock('../../services/email.service', () => ({
  envoyerEmailBienvenue: jest.fn().mockResolvedValue({ success: true }),
}));

const prisma = require('../../prisma');
const { supabase } = require('../../supabase');
const { login, confirmEmail } = require('../auth.controller');

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('auth.controller — login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('bloque la connexion si email non confirmé', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'test@example.com' },
        session: { access_token: 'token-abc' },
      },
      error: null,
    });
    prisma.candidat.findUnique.mockResolvedValue({
      role: 'CANDIDAT',
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'test@example.com',
      emailConfirme: false,
    });

    const req = { body: { email: 'test@example.com', password: 'secret' } };
    const res = makeRes();
    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ emailConfirmationRequired: true })
    );
  });

  it('connecte un candidat avec email confirmé', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'test@example.com' },
        session: { access_token: 'token-abc' },
      },
      error: null,
    });
    prisma.candidat.findUnique.mockResolvedValue({
      role: 'CANDIDAT',
      nom: 'Dupont',
      prenom: 'Jean',
      matricule: 'UnP-2026-000001',
      email: 'test@example.com',
      emailConfirme: true,
    });
    prisma.membreCommission.findUnique.mockResolvedValue(null);
    prisma.administrateurDGES.findUnique.mockResolvedValue(null);
    prisma.controleur.findUnique.mockResolvedValue(null);
    prisma.etablissement.findUnique.mockResolvedValue(null);

    const req = { body: { email: 'test@example.com', password: 'secret' } };
    const res = makeRes();
    await login(req, res);

    expect(res.json).toHaveBeenCalledWith({
      token: 'token-abc',
      user: expect.objectContaining({
        id: 'user-1',
        role: 'CANDIDAT',
        email: 'test@example.com',
      }),
    });
  });
});

describe('auth.controller — confirmEmail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retourne succès si email déjà confirmé', async () => {
    prisma.candidat.findUnique.mockResolvedValue({
      id: 'user-1',
      emailConfirme: true,
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'test@example.com',
      matricule: 'UnP-2026-000001',
    });

    const req = { query: { token: 'user-1' } };
    const res = makeRes();
    await confirmEmail(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, alreadyConfirmed: true })
    );
    expect(prisma.candidat.update).not.toHaveBeenCalled();
  });
});
