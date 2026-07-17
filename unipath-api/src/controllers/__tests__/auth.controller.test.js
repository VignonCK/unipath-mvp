jest.mock('../../prisma', () => ({
  candidat: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  compte: { updateMany: jest.fn() },
  notification: { create: jest.fn() },
  emailDelivery: { create: jest.fn() },
}));

jest.mock('../../services/auth.service', () => ({
  authenticate: jest.fn(),
}));

const prisma = require('../../prisma');
const authService = require('../../services/auth.service');
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
    authService.authenticate.mockResolvedValue({
      error: 'Veuillez confirmer votre email avant de vous connecter',
      emailConfirmationRequired: true,
      userId: 'user-1',
      email: 'test@example.com',
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
    authService.authenticate.mockResolvedValue({
      token: 'jwt-token',
      user: {
        id: 'user-1',
        role: 'CANDIDAT',
        email: 'test@example.com',
        nom: 'Dupont',
        prenom: 'Jean',
      },
    });

    const req = { body: { email: 'test@example.com', password: 'secret' } };
    const res = makeRes();
    await login(req, res);

    expect(res.json).toHaveBeenCalledWith({
      token: 'jwt-token',
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
