const request = require('supertest');
const app = require('../src/app');

describe('Server Basic Tests', () => {
  test('Should return welcome message on root endpoint', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body.message).toBe('Welcome to Ecommerce API'); // SIN emoji
    expect(response.body.version).toBe('1.0.0');
    expect(response.body.status).toBe('Server running successfully!');
  });

  test('Should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.service).toBe('Ecommerce API');
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  test('Should return 404 for non-existent endpoints', async () => {
    const response = await request(app)
      .get('/non-existent-endpoint')
      .expect(404);

    expect(response.body.error).toBe('Endpoint not found');
    expect(response.body.path).toBe('/non-existent-endpoint');
  });
});