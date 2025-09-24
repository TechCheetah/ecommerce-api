const request = require('supertest');
const app = require('../src/app');

describe('Checkout API', () => {
  let productId;
  const sessionId = 'checkout-test-session';

  // Crear un producto y agregarlo al carrito antes de los tests
  beforeAll(async () => {
    // Crear producto de prueba
    const productResponse = await request(app)
      .post('/api/products')
      .send({
        name: 'Checkout Test Product',
        description: 'Product for testing checkout functionality',
        price: 50.00,
        stock: 10,
        category: 'test'
      });
    
    productId = productResponse.body.product.id;

    // Agregar producto al carrito
    await request(app)
      .post('/api/cart')
      .set('session-id', sessionId)
      .send({
        productId: productId,
        quantity: 2
      });
  });

  describe('POST /api/checkout', () => {
    test('Should process checkout successfully', async () => {
      const customerInfo = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        address: '123 Main Street, City, Country',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/checkout')
        .set('session-id', sessionId)
        .send({ 
          customerInfo,
          paymentMethod: 'credit_card'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order processed successfully');
      expect(response.body.order.id).toBeDefined();
      expect(response.body.order.total).toBe(100.00); // 50.00 * 2
      expect(response.body.order.status).toBe('completed');
      expect(response.body.order.transactionId).toBeDefined();
      expect(response.body.order.customerEmail).toBe('john.doe@example.com');
    });

    test('Should return error for empty cart', async () => {
      const customerInfo = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com'
      };

      const response = await request(app)
        .post('/api/checkout')
        .set('session-id', 'empty-cart-session')
        .send({ customerInfo })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cart is empty');
    });

    test('Should return error for missing customer info', async () => {
      // Crear nuevo carrito con producto para este test
      const newSessionId = 'missing-info-session';
      await request(app)
        .post('/api/cart')
        .set('session-id', newSessionId)
        .send({
          productId: productId,
          quantity: 1
        });

      const response = await request(app)
        .post('/api/checkout')
        .set('session-id', newSessionId)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer information is required');
      expect(response.body.required).toEqual(['name', 'email']);
    });

    test('Should return error for invalid email', async () => {
      // Crear nuevo carrito para este test
      const newSessionId = 'invalid-email-session';
      await request(app)
        .post('/api/cart')
        .set('session-id', newSessionId)
        .send({
          productId: productId,
          quantity: 1
        });

      const customerInfo = {
        name: 'Test User',
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .post('/api/checkout')
        .set('session-id', newSessionId)
        .send({ customerInfo })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email format');
    });

    test('Should return error for insufficient stock', async () => {
      // Simplemente intentar agregar una cantidad muy grande al carrito
      const response = await request(app)
        .post('/api/cart')
        .set('session-id', 'stock-overflow-test')
        .send({
          productId: productId, // Usar el producto original
          quantity: 999 // Cantidad imposiblemente grande
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient stock');
    });
  });

  describe('GET /api/orders', () => {
    test('Should get all orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(response.body.orders)).toBe(true);
      
      if (response.body.orders.length > 0) {
        const order = response.body.orders[0];
        expect(order.id).toBeDefined();
        expect(order.customerEmail).toBeDefined();
        expect(order.total).toBeDefined();
        expect(order.status).toBeDefined();
        expect(order.createdAt).toBeDefined();
      }
    });
  });

  describe('GET /api/orders/:orderId', () => {
    let orderId;

    beforeAll(async () => {
      // Crear una orden para probar
      const newSessionId = 'order-detail-session';
      await request(app)
        .post('/api/cart')
        .set('session-id', newSessionId)
        .send({
          productId: productId,
          quantity: 1
        });

      const checkoutResponse = await request(app)
        .post('/api/checkout')
        .set('session-id', newSessionId)
        .send({
          customerInfo: {
            name: 'Order Detail Test',
            email: 'orderdetail@example.com'
          }
        });

      orderId = checkoutResponse.body.order.id;
    });

    test('Should get specific order by ID', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.order.id).toBe(orderId);
      expect(response.body.order.customerInfo).toBeDefined();
      expect(response.body.order.items).toBeDefined();
      expect(response.body.order.total).toBeDefined();
    });

    test('Should return error for non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/non-existent-order-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });
  });
});