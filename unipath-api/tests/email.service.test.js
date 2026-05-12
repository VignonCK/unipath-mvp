/**
 * Tests unitaires pour email.service.js
 * Phase 3 - Testing du système email avec queue
 */

// Declare mock functions first
const mockPrismaCreate = jest.fn();
const mockPrismaFindMany = jest.fn();
const mockPrismaUpdate = jest.fn();

// Mock dependencies BEFORE requiring email service
jest.mock('../src/services/rate-limiter');
jest.mock('../src/config/logger');
jest.mock('../src/config/email.config', () => ({
  smtp: {
    host: 'smtp.test.com',
    port: 587,
    secure: false,
    auth: {
      user: 'test@test.com',
      pass: 'testpass',
    },
    from: {
      email: 'noreply@test.com',
      name: 'Test System',
    },
  },
  app: {
    url: 'http://localhost:3000',
    academicYear: '2024-2025',
  },
  queue: {
    enabled: true,
    workerInterval: 10000,
    batchSize: 5,
  },
  rateLimits: {
    perUser: 10,
    global: 100,
    queueAlertThreshold: 500,
  },
  retry: {
    maxAttempts: 5,
    delays: [60, 300, 900, 3600, 7200],
  },
}));
jest.mock('../src/utils/url.helper', () => ({
  getFrontendUrl: jest.fn(() => 'http://localhost:3000'),
}));

// Mock Prisma at the module level
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      emailDelivery: {
        create: (...args) => mockPrismaCreate(...args),
        findMany: (...args) => mockPrismaFindMany(...args),
        update: (...args) => mockPrismaUpdate(...args),
      },
    })),
  };
});

// NOW require dependencies after mocks are set up
const rateLimiter = require('../src/services/rate-limiter');
const logger = require('../src/config/logger');
const emailService = require('../src/services/email.service');

describe('EmailService - Tests unitaires', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock rate limiter
    rateLimiter.checkRateLimit = jest.fn().mockResolvedValue(true);

    // Mock logger
    logger.emailQueued = jest.fn();
    logger.rateLimitExceeded = jest.fn();
  });

  describe('createEmail() - Création d\'email avec tous les champs', () => {
    test('Devrait créer un email avec tous les champs requis', async () => {
      const emailData = {
        userId: 1,
        recipient: 'test@example.com',
        subject: 'Test Subject',
        htmlBody: '<p>Test HTML Body</p>',
        textBody: 'Test Text Body',
        attachments: [{ filename: 'test.pdf', path: '/path/to/test.pdf' }],
        emailType: 'CONFIRMATION',
      };

      const mockCreatedEmail = {
        id: 123,
        ...emailData,
        status: 'QUEUED',
        attempts: 0,
        createdAt: new Date(),
      };

      mockPrismaCreate.mockResolvedValue(mockCreatedEmail);

      const result = await emailService.createEmail(emailData);

      // Vérifier que Prisma.create a été appelé avec les bons paramètres
      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: {
          userId: 1,
          recipient: 'test@example.com',
          subject: 'Test Subject',
          htmlBody: '<p>Test HTML Body</p>',
          textBody: 'Test Text Body',
          attachments: [{ filename: 'test.pdf', path: '/path/to/test.pdf' }],
          status: 'QUEUED',
          attempts: 0,
          createdAt: expect.any(Date),
        },
      });

      // Vérifier le résultat
      expect(result).toEqual({
        emailId: 123,
        status: 'QUEUED',
      });

      // Vérifier que le rate limiter a été appelé
      expect(rateLimiter.checkRateLimit).toHaveBeenCalledWith(1);

      // Vérifier que le logger a été appelé
      expect(logger.emailQueued).toHaveBeenCalledWith(
        123,
        'test@example.com',
        'Test Subject',
        1
      );
    });

    test('Devrait créer un email sans textBody (génération automatique)', async () => {
      const emailData = {
        userId: 2,
        recipient: 'test2@example.com',
        subject: 'Test Subject 2',
        htmlBody: '<p>Test <strong>HTML</strong> Body</p>',
        emailType: 'BIENVENUE',
      };

      const mockCreatedEmail = {
        id: 124,
        ...emailData,
        textBody: 'Test HTML Body',
        attachments: null,
        status: 'QUEUED',
        attempts: 0,
        createdAt: new Date(),
      };

      mockPrismaCreate.mockResolvedValue(mockCreatedEmail);

      const result = await emailService.createEmail(emailData);

      // Vérifier que textBody a été généré automatiquement
      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          textBody: 'Test HTML Body',
        }),
      });

      expect(result.emailId).toBe(124);
    });

    test('Devrait créer un email sans attachments (tableau vide)', async () => {
      const emailData = {
        userId: 3,
        recipient: 'test3@example.com',
        subject: 'Test Subject 3',
        htmlBody: '<p>Test Body</p>',
        textBody: 'Test Body',
        attachments: [],
        emailType: 'REJET',
      };

      const mockCreatedEmail = {
        id: 125,
        ...emailData,
        attachments: null,
        status: 'QUEUED',
        attempts: 0,
        createdAt: new Date(),
      };

      mockPrismaCreate.mockResolvedValue(mockCreatedEmail);

      await emailService.createEmail(emailData);

      // Vérifier que attachments est null quand le tableau est vide
      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          attachments: null,
        }),
      });
    });

    test('Devrait rejeter un email avec une adresse invalide', async () => {
      const emailData = {
        userId: 4,
        recipient: 'invalid-email',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        emailType: 'CONFIRMATION',
      };

      await expect(emailService.createEmail(emailData)).rejects.toThrow(
        'Invalid email address: invalid-email'
      );

      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    test('Devrait rejeter un email sans subject', async () => {
      const emailData = {
        userId: 5,
        recipient: 'test@example.com',
        htmlBody: '<p>Test</p>',
        emailType: 'CONFIRMATION',
      };

      await expect(emailService.createEmail(emailData)).rejects.toThrow(
        'Subject and htmlBody are required'
      );

      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    test('Devrait rejeter un email sans htmlBody', async () => {
      const emailData = {
        userId: 6,
        recipient: 'test@example.com',
        subject: 'Test',
        emailType: 'CONFIRMATION',
      };

      await expect(emailService.createEmail(emailData)).rejects.toThrow(
        'Subject and htmlBody are required'
      );

      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });
  });

  describe('envoyerEmailConfirmation() - Email avec userId=null', () => {
    test('Devrait créer un email de confirmation avec userId=null', async () => {
      const data = {
        email: 'candidat@example.com',
        nom: 'DEDJI',
        prenom: 'Harry',
        confirmationToken: 'abc123token',
      };

      const mockCreatedEmail = {
        id: 200,
        userId: null,
        recipient: 'candidat@example.com',
        subject: '[UniPath] Confirmez votre adresse email',
        htmlBody: expect.any(String),
        textBody: expect.any(String),
        status: 'QUEUED',
        attempts: 0,
        createdAt: new Date(),
      };

      mockPrismaCreate.mockResolvedValue(mockCreatedEmail);

      const result = await emailService.envoyerEmailConfirmation(data);

      // Vérifier que userId est null
      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
          recipient: 'candidat@example.com',
          subject: '[UniPath] Confirmez votre adresse email',
        }),
      });

      // Vérifier que le rate limiter n'a PAS été appelé (userId=null)
      expect(rateLimiter.checkRateLimit).not.toHaveBeenCalled();

      expect(result.emailId).toBe(200);
      expect(result.status).toBe('QUEUED');
    });

    test('Devrait inclure le lien de confirmation dans le HTML', async () => {
      const data = {
        email: 'test@example.com',
        nom: 'TEST',
        prenom: 'User',
        confirmationToken: 'token123',
      };

      mockPrismaCreate.mockResolvedValue({
        id: 201,
        userId: null,
        recipient: 'test@example.com',
        status: 'QUEUED',
      });

      await emailService.envoyerEmailConfirmation(data);

      const createCall = mockPrismaCreate.mock.calls[0][0];
      const htmlBody = createCall.data.htmlBody;

      // Vérifier que le lien de confirmation est présent
      expect(htmlBody).toContain('http://localhost:3000/confirmer-email?token=token123');
      expect(htmlBody).toContain('User TEST');
    });

    test('Devrait rejeter si confirmationToken manquant', async () => {
      const data = {
        email: 'test@example.com',
        nom: 'TEST',
        prenom: 'User',
      };

      await expect(emailService.envoyerEmailConfirmation(data)).rejects.toThrow(
        'confirmationToken is required'
      );
    });
  });

  describe('envoyerEmailBienvenue() - Email avec userId', () => {
    test('Devrait créer un email de bienvenue avec userId', async () => {
      const data = {
        email: 'candidat@example.com',
        nom: 'DEDJI',
        prenom: 'Harry',
        matricule: 'UAC2024001',
        userId: 42,
      };

      const mockCreatedEmail = {
        id: 300,
        userId: 42,
        recipient: 'candidat@example.com',
        subject: '[UniPath] Bienvenue sur la plateforme',
        htmlBody: expect.any(String),
        textBody: expect.any(String),
        status: 'QUEUED',
        attempts: 0,
        createdAt: new Date(),
      };

      mockPrismaCreate.mockResolvedValue(mockCreatedEmail);

      const result = await emailService.envoyerEmailBienvenue(data);

      // Vérifier que userId est présent
      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 42,
          recipient: 'candidat@example.com',
          subject: '[UniPath] Bienvenue sur la plateforme',
        }),
      });

      // Vérifier que le rate limiter a été appelé avec userId
      expect(rateLimiter.checkRateLimit).toHaveBeenCalledWith(42);

      expect(result.emailId).toBe(300);
      expect(result.status).toBe('QUEUED');
    });

    test('Devrait inclure le matricule dans le HTML', async () => {
      const data = {
        email: 'test@example.com',
        nom: 'TEST',
        prenom: 'User',
        matricule: 'UAC2024999',
        userId: 50,
      };

      mockPrismaCreate.mockResolvedValue({
        id: 301,
        userId: 50,
        status: 'QUEUED',
      });

      await emailService.envoyerEmailBienvenue(data);

      const createCall = mockPrismaCreate.mock.calls[0][0];
      const htmlBody = createCall.data.htmlBody;

      // Vérifier que le matricule est présent
      expect(htmlBody).toContain('UAC2024999');
      expect(htmlBody).toContain('test@example.com');
      expect(htmlBody).toContain('User TEST');
    });

    test('Devrait accepter candidatId comme alias de userId', async () => {
      const data = {
        email: 'test@example.com',
        nom: 'TEST',
        prenom: 'User',
        matricule: 'UAC2024888',
        candidatId: 99,
      };

      mockPrismaCreate.mockResolvedValue({
        id: 302,
        userId: 99,
        status: 'QUEUED',
      });

      await emailService.envoyerEmailBienvenue(data);

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 99,
        }),
      });

      expect(rateLimiter.checkRateLimit).toHaveBeenCalledWith(99);
    });
  });

  describe('Validation des emails', () => {
    test('Devrait rejeter un email invalide (pas de @)', async () => {
      const data = {
        userId: 1,
        recipient: 'invalid-email',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        emailType: 'TEST',
      };

      await expect(emailService.createEmail(data)).rejects.toThrow(
        'Invalid email address'
      );
    });

    test('Devrait rejeter un email invalide (domaine manquant)', async () => {
      const data = {
        userId: 1,
        recipient: 'test@',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        emailType: 'TEST',
      };

      await expect(emailService.createEmail(data)).rejects.toThrow(
        'Invalid email address'
      );
    });

    test('Devrait accepter un email valide', async () => {
      const data = {
        userId: 1,
        recipient: 'valid.email+tag@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        emailType: 'TEST',
      };

      mockPrismaCreate.mockResolvedValue({
        id: 400,
        status: 'QUEUED',
      });

      const result = await emailService.createEmail(data);

      expect(result.emailId).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    test('Devrait rejeter si rate limit dépassé', async () => {
      const data = {
        userId: 10,
        recipient: 'test@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        emailType: 'TEST',
      };

      const rateLimitError = new Error('Rate limit exceeded: 10 emails per hour');
      rateLimiter.checkRateLimit.mockRejectedValue(rateLimitError);

      await expect(emailService.createEmail(data)).rejects.toThrow(
        'Rate limit exceeded'
      );

      expect(logger.rateLimitExceeded).toHaveBeenCalled();
      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    test('Ne devrait pas vérifier le rate limit si userId=null', async () => {
      const data = {
        userId: null,
        recipient: 'test@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        emailType: 'CONFIRMATION',
      };

      mockPrismaCreate.mockResolvedValue({
        id: 500,
        status: 'QUEUED',
      });

      await emailService.createEmail(data);

      expect(rateLimiter.checkRateLimit).not.toHaveBeenCalled();
    });
  });

  describe('htmlToText() - Conversion HTML vers texte', () => {
    test('Devrait convertir HTML simple en texte', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const text = emailService.htmlToText(html);

      expect(text).toBe('Hello World');
    });

    test('Devrait supprimer les balises style', () => {
      const html = '<style>body { color: red; }</style><p>Content</p>';
      const text = emailService.htmlToText(html);

      expect(text).toBe('Content');
      expect(text).not.toContain('style');
    });

    test('Devrait supprimer les balises script', () => {
      const html = '<script>alert("xss")</script><p>Content</p>';
      const text = emailService.htmlToText(html);

      expect(text).toBe('Content');
      expect(text).not.toContain('script');
    });

    test('Devrait normaliser les espaces multiples', () => {
      const html = '<p>Hello    World</p>';
      const text = emailService.htmlToText(html);

      expect(text).toBe('Hello World');
    });
  });

  describe('Couverture > 80%', () => {
    test('Devrait tester envoyerEmailPreInscription avec PDF', async () => {
      const data = {
        candidatEmail: 'test@example.com',
        candidatNom: 'TEST',
        candidatPrenom: 'User',
        concours: 'Licence Informatique',
        numeroDossier: 'D2024001',
        userId: 20,
      };

      mockPrismaCreate.mockResolvedValue({
        id: 600,
        status: 'QUEUED',
      });

      const result = await emailService.envoyerEmailPreInscription(
        data,
        '/path/to/fiche.pdf'
      );

      expect(result.emailId).toBe(600);
      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          attachments: [
            {
              filename: 'fiche-preinscription-D2024001.pdf',
              path: '/path/to/fiche.pdf',
            },
          ],
        }),
      });
    });

    test('Devrait tester envoyerEmailConvocation', async () => {
      const data = {
        candidatEmail: 'test@example.com',
        candidatNom: 'TEST',
        candidatPrenom: 'User',
        concours: 'Master Data Science',
        numeroDossier: 'D2024002',
        dateExamen: '15/06/2024',
        lieuExamen: 'Amphi A',
        userId: 21,
      };

      mockPrismaCreate.mockResolvedValue({
        id: 700,
        status: 'QUEUED',
      });

      const result = await emailService.envoyerEmailConvocation(data);

      expect(result.emailId).toBe(700);
      expect(rateLimiter.checkRateLimit).toHaveBeenCalledWith(21);
    });

    test('Devrait tester envoyerEmailRejet', async () => {
      const data = {
        candidatEmail: 'test@example.com',
        candidatNom: 'TEST',
        candidatPrenom: 'User',
        concours: 'Doctorat',
        motif: 'Dossier incomplet',
        userId: 22,
      };

      mockPrismaCreate.mockResolvedValue({
        id: 800,
        status: 'QUEUED',
      });

      const result = await emailService.envoyerEmailRejet(data);

      expect(result.emailId).toBe(800);
    });

    test('Devrait tester envoyerEmailSousReserve', async () => {
      const data = {
        candidatEmail: 'test@example.com',
        candidatNom: 'TEST',
        candidatPrenom: 'User',
        concours: 'Licence Maths',
        numeroDossier: 'D2024003',
        motif: 'Manque diplôme bac',
        userId: 23,
      };

      mockPrismaCreate.mockResolvedValue({
        id: 900,
        status: 'QUEUED',
      });

      const result = await emailService.envoyerEmailSousReserve(data);

      expect(result.emailId).toBe(900);

      const createCall = mockPrismaCreate.mock.calls[0][0];
      const htmlBody = createCall.data.htmlBody;

      // Vérifier que le délai de 48h est mentionné
      expect(htmlBody).toContain('48 heures');
    });
  });
});

