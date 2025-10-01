const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rutas
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE BÁSICO =====
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://ecommerce-api-iota-five.vercel.app',
        'https://ecommerce-api-*.vercel.app',
        'https://*.vercel.app'
      ]
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'session-id', 'x-session-id']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para logging en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const sessionId = req.headers['session-id'] || req.headers['x-session-id'] || 'no-session';
    console.log(`[${timestamp}] ${req.method} ${req.path} - Session: ${sessionId}`);
    next();
  });
}

// ===== SERVIR ARCHIVOS ESTÁTICOS DEL FRONTEND =====
// En Vercel, los archivos estáticos se manejan diferente
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: '0',
    etag: true,
    lastModified: true
  }));
}

// ===== RUTAS PRINCIPALES =====

// Ruta raíz - Información de la API
app.get('/', (req, res) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://ecommerce-api-iota-five.vercel.app'
    : `http://localhost:${PORT}`;
    
  res.json({
    message: '🛒 Welcome to Ecommerce API',
    version: '1.0.0',
    status: 'Server running successfully!',
    environment: process.env.NODE_ENV || 'development',
    features: [
      '🛍️ Complete Product Management',
      '🛒 Smart Shopping Cart System', 
      '💳 Checkout with Payment Simulation',
      '📦 Order Management',
      '👨‍💼 Admin Panel',
      '📊 Real-time Statistics',
      '📱 Responsive Frontend',
      '🧪 Comprehensive Testing (28 tests)',
      '🚀 Production Ready'
    ],
    endpoints: {
      frontend: {
        'GET /': 'Access the frontend application',
        'GET /index.html': 'Frontend main page'
      },
      api: {
        'GET /api/': 'Detailed API documentation',
        'GET /api/stats': 'System statistics',
        'GET /health': 'Server health check'
      },
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
        'GET /api/orders/:orderId': 'Get specific order by ID'
      }
    },
    usage: {
      sessionHeader: 'Include "session-id" header for cart management',
      example: 'session-id: user-123-abc',
      contentType: 'application/json',
      frontend: 'Visit / for the complete shopping experience'
    },
    links: {
      frontend: baseUrl,
      documentation: `${baseUrl}/api`,
      health: `${baseUrl}/health`
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Ecommerce API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: {
      seconds: Math.floor(process.uptime()),
      human: formatUptime(process.uptime())
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
    },
    system: {
      platform: process.platform,
      node: process.version,
      pid: process.pid
    },
    endpoints: {
      api: '/api',
      frontend: '/', 
      stats: '/api/stats'
    }
  };

  res.json(healthData);
});

// ===== API ROUTES =====
app.use('/api', apiRoutes);

// ===== MIDDLEWARE DE MANEJO DE ERRORES =====

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  const suggestions = [
    'GET / - API information and documentation',
    'GET /health - Server health check',
    'GET /api - API endpoints documentation',
    'GET /api/products - View available products',
    'GET /api/stats - System statistics'
  ];

  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    message: `The requested endpoint ${req.method} ${req.originalUrl} was not found`,
    suggestions,
    availableEndpoints: {
      frontend: '/',
      api: '/api',
      health: '/health'
    },
    timestamp: new Date().toISOString()
  });
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    sessionId: req.headers['session-id'] || 'no-session'
  });

  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong on the server',
    ...(isDevelopment && { 
      stack: err.stack,
      details: {
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    }),
    requestId: generateRequestId()
  });
});

// ===== FUNCIONES AUXILIARES =====

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}

function generateRequestId() {
  return Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Starting graceful shutdown...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Starting graceful shutdown...');
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// ===== INICIAR SERVIDOR (Solo en desarrollo) =====
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('\n🚀 ===================================');
    console.log('🛒 ECOMMERCE API SERVER STARTED');
    console.log('=====================================');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🕐 Started at: ${new Date().toLocaleString()}`);
    console.log('\n📡 Available Endpoints:');
    console.log(`   🌐 Frontend:      http://localhost:${PORT}/`);
    console.log(`   📚 API Docs:      http://localhost:${PORT}/`);
    console.log(`   ❤️  Health Check: http://localhost:${PORT}/health`);
    console.log(`   📊 Statistics:    http://localhost:${PORT}/api/stats`);
    console.log(`   🛍️  Products:      http://localhost:${PORT}/api/products`);
    console.log(`   🛒 Cart:          http://localhost:${PORT}/api/cart`);
    console.log(`   💳 Checkout:      http://localhost:${PORT}/api/checkout`);
    console.log('\n🧪 Testing:');
    console.log(`   Run: npm test`);
    console.log('\n🎯 Ready to handle requests!');
    console.log('=====================================\n');
  });
}

// IMPORTANTE: Exportar para Vercel
module.exports = app;