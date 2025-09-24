const request = require('supertest');
const app = require('../src/app');

describe('Products API', () => {
  describe('GET /api/products', () => {
    test('Should get all products successfully', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(response.body.products)).toBe(true);
    });
  });

  describe('POST /api/products', () => {
    test('Should create a new product successfully', async () => {
      const newProduct = {
        name: 'Test Gaming Laptop',
        description: 'High-performance gaming laptop for testing',
        price: 1299.99,
        stock: 5,
        category: 'electronics'
      };

      const response = await request(app)
        .post('/api/products')
        .send(newProduct)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.product.name).toBe(newProduct.name);
      expect(response.body.product.price).toBe(newProduct.price);
      expect(response.body.product.id).toBeDefined();
      expect(response.body.product.createdAt).toBeDefined();
    });

    test('Should return error for missing required fields', async () => {
      const invalidProduct = {
        description: 'Missing name and price'
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required fields');
    });

    test('Should return error for invalid price', async () => {
      const invalidProduct = {
        name: 'Test Product',
        price: -10,
        stock: 5
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('greater than 0');
    });
  });
});