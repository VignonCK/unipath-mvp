// Test basique pour vérifier que l'API fonctionne
const request = require('supertest');
const app = require('../app');

describe('Health Check', () => {
  it('GET /health devrait retourner status OK', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
  });
});
