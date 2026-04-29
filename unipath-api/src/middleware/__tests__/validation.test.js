// Tests pour le middleware de validation
const { z } = require('zod');
const { validate } = require('../validation.middleware');

describe('Validation Middleware', () => {
  const mockSchema = z.object({
    email: z.string().email(),
    age: z.number().min(18),
  });

  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('devrait valider des données correctes', () => {
    req.body = { email: 'test@example.com', age: 25 };
    
    const middleware = validate(mockSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('devrait rejeter des données invalides', () => {
    req.body = { email: 'invalid-email', age: 15 };
    
    const middleware = validate(mockSchema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation échouée',
        details: expect.any(Array),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('devrait valider les query params', () => {
    req.query = { email: 'test@example.com', age: 25 };
    
    const middleware = validate(mockSchema, 'query');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
