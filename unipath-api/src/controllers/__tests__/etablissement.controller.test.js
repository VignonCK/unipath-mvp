const { rechercherParFilieres } = require('../etablissement.controller');

jest.mock('../../prisma', () => ({
  etablissement: {
    findMany: jest.fn(),
  },
}));

const prisma = require('../../prisma');

describe('etablissement.controller rechercherParFilieres', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    prisma.etablissement.findMany.mockReset();
  });

  it('rejette si les trois choix ne sont pas fournis', async () => {
    req.body = { choix1: 'Informatique', choix2: 'Gestion' };
    await rechercherParFilieres(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('trois choix') })
    );
  });

  it('rejette si les choix ne sont pas distincts', async () => {
    req.body = { choix1: 'Droit', choix2: 'Droit', choix3: 'Gestion' };
    await rechercherParFilieres(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('différents') })
    );
  });

  it('retourne les établissements privés correspondants', async () => {
    req.body = { choix1: 'Informatique', choix2: 'Gestion', choix3: 'Droit' };
    prisma.etablissement.findMany.mockResolvedValue([
      { id: 'e1', nom: 'ISMA', type: 'PRIVE', filieres: [{ nom: 'Informatique' }] },
    ]);

    await rechercherParFilieres(req, res);

    expect(prisma.etablissement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'PRIVE' }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        etablissements: expect.any(Array),
        choix: req.body,
      })
    );
  });
});
