const {
  listerCampagnesPubliees,
  publierCampagne,
} = require('../campagne.controller');

jest.mock('../../prisma', () => ({
  adminEtablissement: { findUnique: jest.fn() },
  campagneInscription: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
}));

const prisma = require('../../prisma');

describe('campagne.controller', () => {
  let res;

  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('listerCampagnesPubliees', () => {
    it('retourne les campagnes publiées avec filtres', async () => {
      const req = { query: { ville: 'Cotonou', anneeAcademique: '2025-2026' } };
      prisma.campagneInscription.findMany.mockResolvedValue([{ id: 'c1', titre: 'Campagne test' }]);

      await listerCampagnesPubliees(req, res);

      expect(prisma.campagneInscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            statut: 'PUBLIEE',
            anneeAcademique: '2025-2026',
          }),
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ campagnes: expect.any(Array) })
      );
    });
  });

  describe('publierCampagne', () => {
    it('refuse si la campagne n\'a pas de filières', async () => {
      const req = { user: { id: 'admin-1' }, params: { id: 'camp-1' } };
      prisma.adminEtablissement.findUnique.mockResolvedValue({ id: 'admin-1', etablissementId: 'etab-1' });
      prisma.campagneInscription.findFirst.mockResolvedValue({
        id: 'camp-1',
        statut: 'BROUILLON',
        filieres: [],
      });

      await publierCampagne(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('filière') })
      );
    });
  });
});
