const request = require('supertest');
const app = require('../src/app');

describe('Cart API', () => {
  let productId;
  const sessionId = 'test-cart-session';

  // Crear un producto de prueba antes de los tests
  beforeAll(async () => {
    const productResponse = await request(app)
      .post('/api/products')
      .send({
        name: 'Cart Test Product',
        description: 'Product for testing cart functionality',
        price: 25.99,
        stock: 100,
        category: 'test'
      });
    
    productId = productResponse.body.product.id;
  });

  describe('GET /api/cart', () => {
    test('Should return empty cart for new session', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('session-id', 'new-session')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toHaveLength(0);
      expect(response.body.cart.total).toBe(0);
      expect(response.body.isEmpty).toBe(true);
    });
  });

  describe('POST /api/cart', () => {
    test('Should add product to cart successfully', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('session-id', sessionId)
        .send({
          productId: productId,
          quantity: 2
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toHaveLength(1);
      expect(response.body.cart.items[0].productId).toBe(productId);
      expect(response.body.cart.items[0].quantity).toBe(2);
      expect(response.body.cart.total).toBe(51.98); // 25.99 * 2
      expect(response.body.sessionId).toBe(sessionId);
    });

    test('Should update quantity when adding same product again', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('session-id', sessionId)
        .send({
          productId: productId,
          quantity: 1
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toHaveLength(1);
      expect(response.body.cart.items[0].quantity).toBe(3); // 2 + 1
      expect(response.body.cart.total).toBe(77.97); // 25.99 * 3
    });

    test('Should return error for non-existent product', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('session-id', sessionId)
        .send({
          productId: 'non-existent-id',
          quantity: 1
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });

    test('Should return error for invalid quantity', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('session-id', sessionId)
        .send({
          productId: productId,
          quantity: -1
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('positive integer');
    });

    test('Should return error for insufficient stock', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('session-id', sessionId)
        .send({
          productId: productId,
          quantity: 1000
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient stock');
      expect(response.body.available).toBe(100);
    });

    test('Should return error when missing productId', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('session-id', sessionId)
        .send({
          quantity: 1
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product ID is required');
    });
  });

  describe('PUT /api/cart/:productId', () => {
    test('Should update product quantity in cart', async () => {
      const response = await request(app)
        .put(`/api/cart/${productId}`)
        .set('session-id', sessionId)
        .send({
          quantity: 1
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cart.items[0].quantity).toBe(1);
      expect(response.body.cart.total).toBe(25.99);
    });

    test('Should remove product when quantity is 0', async () => {
      const response = await request(app)
        .put(`/api/cart/${productId}`)
        .set('session-id', sessionId)
        .send({
          quantity: 0
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toHaveLength(0);
      expect(response.body.cart.total).toBe(0);
      expect(response.body.message).toContain('removed');
    });
  });

  describe('DELETE /api/cart/:productId', () => {
    test('Should remove product from cart', async () => {
      // Primero agregar un producto
      await request(app)
        .post('/api/cart')
        .set('session-id', sessionId)
        .send({
          productId: productId,
          quantity: 2
        });

      // Luego eliminarlo
      const response = await request(app)
        .delete(`/api/cart/${productId}`)
        .set('session-id', sessionId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed');
      expect(response.body.cart.items).toHaveLength(0);
      expect(response.body.removedItem.productId).toBe(productId);
    });

    test('Should return error when product not in cart', async () => {
      const response = await request(app)
        .delete(`/api/cart/${productId}`)
        .set('session-id', sessionId)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found in cart');
    });
  });

  describe('DELETE /api/cart', () => {
    test('Should clear entire cart', async () => {
      // Primero agregar algunos productos
      await request(app)
        .post('/api/cart')
        .set('session-id', sessionId)
        .send({
          productId: productId,
          quantity: 3
        });

      // Luego limpiar el carrito
      const response = await request(app)
        .delete('/api/cart')
        .set('session-id', sessionId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart cleared successfully');
    });

    test('Should handle clearing non-existent cart', async () => {
      const response = await request(app)
        .delete('/api/cart')
        .set('session-id', 'non-existent-session')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });
});