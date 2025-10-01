const express = require('express');
const router = express.Router();

// Importar rutas específicas
const productRoutes = require('./products');
const cartRoutes = require('./cart');

// Importar controladores
const checkoutController = require('../controllers/checkoutController');
const statsController = require('../controllers/statsController'); // ← AGREGAR ESTA LÍNEA

// Usar rutas
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);

// Rutas de checkout directamente (sin archivo separado)
router.post('/checkout', checkoutController.processCheckout);
router.get('/orders', checkoutController.getOrders);
router.get('/orders/:orderId', checkoutController.getOrderById);

// Rutas de estadísticas - REEMPLAZAR LA FUNCIÓN ANTERIOR
router.get('/stats', statsController.getStats);
router.get('/stats/date', statsController.getStatsByDate);

// Ruta de información de API
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ecommerce API - Available endpoints',
    endpoints: {
      products: {
        'POST /api/products': 'Create a new product',
        'GET /api/products': 'Get all products',
        'GET /api/products/:id': 'Get product by ID'
      },
      cart: {
        'POST /api/cart': 'Add product to cart',
        'GET /api/cart': 'Get cart contents',
        'PUT /api/cart/:productId': 'Update product quantity in cart',
        'DELETE /api/cart/:productId': 'Remove product from cart',
        'DELETE /api/cart': 'Clear entire cart'
      },
      checkout: {
        'POST /api/checkout': 'Process checkout and create order',
        'GET /api/orders': 'Get all orders',
        'GET /api/orders/:orderId': 'Get specific order'
      },
      utils: {
        'GET /api/stats': 'Get database statistics',
        'GET /api/stats/date': 'Get statistics by date range',
        'GET /api/': 'Get API information'
      }
    },
    headers: {
      'session-id': 'Used to identify cart session (optional, defaults to "default-session")'
    }
  });
});

module.exports = router;