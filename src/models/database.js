const { v4: uuidv4 } = require('uuid');

class Database {
  constructor() {
    // En producción, mantenemos todo en memoria
    // Los datos se reinician con cada deploy, pero funcionará en Vercel
    this.data = {
      products: [
        // Productos de ejemplo - agrega los tuyos aquí
        {
          id: '1',
          name: 'Laptop Gaming HP Pavilion',
          description: 'Potente laptop para gaming con RTX 3060',
          price: 899.99,
          stock: 15,
          category: 'electronics',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'iPhone 15 Pro',
          description: 'El último iPhone con cámara profesional',
          price: 1199.99,
          stock: 25,
          category: 'electronics',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Camiseta Nike Dri-FIT',
          description: 'Camiseta deportiva transpirable',
          price: 39.99,
          stock: 50,
          category: 'clothing',
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Libro "Clean Code"',
          description: 'Guía esencial para escribir código limpio',
          price: 45.99,
          stock: 30,
          category: 'books',
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Silla Gamer RGB',
          description: 'Silla ergonómica con iluminación LED',
          price: 299.99,
          stock: 10,
          category: 'home',
          createdAt: new Date().toISOString()
        },
        {
          id: '6',
          name: 'Balón de Fútbol Adidas',
          description: 'Balón oficial tamaño 5',
          price: 29.99,
          stock: 40,
          category: 'sports',
          createdAt: new Date().toISOString()
        }
      ],
      carts: {},
      orders: []
    };
    
    console.log('📊 In-memory database initialized with', this.data.products.length, 'products');
  }

  // Simular lectura de datos
  readData() {
    return this.data;
  }

  // Simular escritura de datos
  writeData(data) {
    this.data = data;
    return true;
  }

  // MÉTODOS PARA PRODUCTOS
  
  createProduct(productData) {
    const newProduct = {
      id: uuidv4(),
      ...productData,
      createdAt: new Date().toISOString()
    };
    
    this.data.products.push(newProduct);
    console.log('✅ Product created:', newProduct.name);
    return newProduct;
  }

  getAllProducts() {
    return this.data.products;
  }

  getProductById(id) {
    return this.data.products.find(product => product.id === id);
  }

  productExists(id) {
    return this.getProductById(id) !== undefined;
  }

  // MÉTODOS PARA CARRITO
  
  getCart(sessionId) {
    return this.data.carts[sessionId] || { 
      items: [], 
      total: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  updateCart(sessionId, cart) {
    cart.updatedAt = new Date().toISOString();
    this.data.carts[sessionId] = cart;
    console.log(`🛒 Cart updated for session: ${sessionId}`);
    return cart;
  }

  clearCart(sessionId) {
    if (this.data.carts[sessionId]) {
      delete this.data.carts[sessionId];
      console.log(`🗑️  Cart cleared for session: ${sessionId}`);
      return true;
    }
    return false;
  }

  cartExists(sessionId) {
    return this.data.carts[sessionId] !== undefined;
  }

  // MÉTODOS PARA PEDIDOS

  createOrder(orderData) {
    const newOrder = {
      id: uuidv4(),
      ...orderData,
      createdAt: new Date().toISOString(),
      status: 'completed'
    };
    
    this.data.orders.push(newOrder);
    console.log(`📦 Order created: ${newOrder.id}`);
    return newOrder;
  }
  
  getAllOrders() {
    return this.data.orders;
  }
  
  getOrderById(id) {
    return this.data.orders.find(order => order.id === id);
  }
  
  updateProductStock(productId, quantityUsed) {
    const productIndex = this.data.products.findIndex(p => p.id === productId);
    
    if (productIndex > -1) {
      this.data.products[productIndex].stock -= quantityUsed;
      console.log(`📦 Stock updated for ${productId}: -${quantityUsed}`);
      return this.data.products[productIndex];
    }
    return null;
  }

  // MÉTODOS PARA ESTADÍSTICAS
  
  getStats() {
    return {
      totalProducts: this.data.products.length,  // ← AGREGAR ESTA COMA
      totalCarts: Object.keys(this.data.carts).length,
      totalOrders: this.data.orders.length,
      totalRevenue: this.data.orders.reduce((sum, order) => sum + (order.total || 0), 0),
      lowStockProducts: this.data.products.filter(p => p.stock < 10).length,
      lastUpdated: new Date().toISOString()
    };
}

// Exportar una instancia única (patrón Singleton)
module.exports = new Database();