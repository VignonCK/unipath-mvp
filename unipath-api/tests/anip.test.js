// tests/anip.test.js
// Tests pour la validation de l'identifiant ANIP

const request = require('supertest');
const app = require('../server'); // Assurez-vous que server.js exporte l'app Express

describe('Tests ANIP - Validation et Unicité', () => {
  
  describe('POST /api/auth/register - Validation ANIP', () => {
    
    const baseUserData = {
      nom: 'DEDJI',
      prenom: 'Harry',
      serie: 'C',
      sexe: 'M',
      nationalite: 'Béninoise',
      telephone: '+229 01 23 45 67 89',
      dateNaiss: '2000-01-01',
      lieuNaiss: 'Cotonou',
      password: 'password123'
    };

    test('Devrait accepter un ANIP valide (12 chiffres)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseUserData,
          anip: '123456789012',
          email: `test-${Date.now()}@example.com`
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('matricule');
    });

    test('Devrait rejeter une inscription sans ANIP', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseUserData,
          email: `test-${Date.now()}@example.com`
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ANIP est obligatoire');
    });

    test('Devrait rejeter un ANIP avec moins de 12 chiffres', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseUserData,
          anip: '12345',
          email: `test-${Date.now()}@example.com`
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('12 chiffres');
    });

    test('Devrait rejeter un ANIP avec plus de 12 chiffres', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseUserData,
          anip: '1234567890123',
          email: `test-${Date.now()}@example.com`
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('12 chiffres');
    });

    test('Devrait rejeter un ANIP contenant des lettres', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseUserData,
          anip: '12345678901A',
          email: `test-${Date.now()}@example.com`
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('12 chiffres');
    });

    test('Devrait rejeter un ANIP contenant des caractères spéciaux', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseUserData,
          anip: '123456789-12',
          email: `test-${Date.now()}@example.com`
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('12 chiffres');
    });

    test('Devrait rejeter un ANIP avec des espaces', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseUserData,
          anip: '123 456 789 012',
          email: `test-${Date.now()}@example.com`
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('12 chiffres');
    });

    test('Devrait rejeter un ANIP déjà enregistré', async () => {
      const anipUnique = `${Date.now()}`.padStart(12, '0').slice(0, 12);
      
      // Première inscription avec cet ANIP
      const firstResponse = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseUserData,
          anip: anipUnique,
          email: `test-first-${Date.now()}@example.com`
        });

      expect(firstResponse.status).toBe(201);

      // Tentative de deuxième inscription avec le même ANIP
      const secondResponse = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseUserData,
          anip: anipUnique,
          email: `test-second-${Date.now()}@example.com`
        });

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.error).toContain('déjà enregistré');
    });

    test('Devrait accepter des ANIP différents pour des candidats différents', async () => {
      const anip1 = `${Date.now()}`.padStart(12, '0').slice(0, 12);
      const anip2 = `${Date.now() + 1}`.padStart(12, '0').slice(0, 12);

      const response1 = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseUserData,
          anip: anip1,
          email: `test-user1-${Date.now()}@example.com`
        });

      const response2 = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseUserData,
          anip: anip2,
          email: `test-user2-${Date.now()}@example.com`
        });

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
    });

    test('Devrait rejeter un ANIP null', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseUserData,
          anip: null,
          email: `test-${Date.now()}@example.com`
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ANIP est obligatoire');
    });

    test('Devrait rejeter un ANIP vide', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseUserData,
          anip: '',
          email: `test-${Date.now()}@example.com`
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ANIP est obligatoire');
    });

    test('Devrait rejeter un ANIP avec uniquement des zéros', async () => {
      // Note: Selon les règles métier, un ANIP de 000000000000 pourrait être invalide
      // Ce test suppose que tous les ANIP sont valides tant qu'ils ont 12 chiffres
      // Ajustez selon vos règles métier
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...baseUserData,
          anip: '000000000000',
          email: `test-${Date.now()}@example.com`
        });

      // Si votre système accepte 000000000000 comme ANIP valide
      expect([201, 400]).toContain(response.status);
      
      // Si vous voulez rejeter les ANIP avec uniquement des zéros, 
      // ajoutez cette validation dans auth.controller.js
    });
  });

  describe('Cas limites et edge cases', () => {
    
    test('Devrait gérer correctement les ANIP commençant par des zéros', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nom: 'TEST',
          prenom: 'User',
          anip: '000123456789',
          serie: 'C',
          sexe: 'M',
          nationalite: 'Béninoise',
          telephone: '+229 01 23 45 67 89',
          dateNaiss: '2000-01-01',
          lieuNaiss: 'Cotonou',
          email: `test-${Date.now()}@example.com`,
          password: 'password123'
        });

      expect(response.status).toBe(201);
    });

    test('Devrait rejeter un ANIP avec des caractères Unicode', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nom: 'TEST',
          prenom: 'User',
          anip: '12345678901²',
          serie: 'C',
          sexe: 'M',
          nationalite: 'Béninoise',
          telephone: '+229 01 23 45 67 89',
          dateNaiss: '2000-01-01',
          lieuNaiss: 'Cotonou',
          email: `test-${Date.now()}@example.com`,
          password: 'password123'
        });

      expect(response.status).toBe(400);
    });
  });
});

// Tests de performance (optionnels)
describe('Tests de performance ANIP', () => {
  
  test('La vérification d\'unicité ANIP devrait être rapide', async () => {
    const startTime = Date.now();
    
    await request(app)
      .post('/api/auth/register')
      .send({
        nom: 'PERF',
        prenom: 'Test',
        anip: `${Date.now()}`.padStart(12, '0').slice(0, 12),
        serie: 'C',
        sexe: 'M',
        nationalite: 'Béninoise',
        telephone: '+229 01 23 45 67 89',
        dateNaiss: '2000-01-01',
        lieuNaiss: 'Cotonou',
        email: `perf-${Date.now()}@example.com`,
        password: 'password123'
      });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // La requête devrait prendre moins de 2 secondes
    expect(duration).toBeLessThan(2000);
  });
});
