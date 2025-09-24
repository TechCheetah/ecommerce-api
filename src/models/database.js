const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/database.json');
    this.initializeDatabase();
  }

  // Inicializar la base de datos si no existe
  initializeDatabase() {
    const defaultData = {
      products: [],
      carts: {},
      orders: []
    };

    // Crear directorio data si no existe
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Crear archivo de base de datos si no existe
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify(defaultData, null, 2));
      console.log('📊 Database file created at:', this.dbPath);
    }
  }

  // Leer datos de la base de datos
  readData() {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error reading database:', error.message);
      return { products: [], carts: {}, orders: [] };
    }
  }

  // Escribir datos a la base de datos
  writeData(data) {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Error writing database:', error.message);
      return false;
    }
  }

  // MÉTODOS PARA PRODUCTOS
  
  createProduct(productData) {
    const data = this.readData();
    const newProduct = {
      id: uuidv4(),
      ...productData,
      createdAt: new Date().toISOString()
    };
    
    data.products.push(newProduct);
    const success = this.writeData(data);
    
    if (success) {
      console.log('✅ Product created:', newProduct.name);
      return newProduct;
    } else {
      throw new Error('Failed to create product');
    }
  }

  getAllProducts() {
    const data = this.readData();
    return data.products;
  }

  getProductById(id) {
    const data = this.readData();
    return data.products.find(product => product.id === id);
  }

  productExists(id) {
    return this.getProductById(id) !== undefined;
  }

  // MÉTODOS PARA CARRITO
  
  // Obtener carrito por sessionId
  getCart(sessionId) {
    const data = this.readData();
    return data.carts[sessionId] || { 
      items: [], 
      total: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Actualizar carrito
  updateCart(sessionId, cart) {
    const data = this.readData();
    cart.updatedAt = new Date().toISOString();
    data.carts[sessionId] = cart;
    const success = this.writeData(data);
    
    if (success) {
      console.log(`🛒 Cart updated for session: ${sessionId}`);
      return cart;
    } else {
      throw new Error('Failed to update cart');
    }
  }

  // Limpiar carrito
  clearCart(sessionId) {
    const data = this.readData();
    if (data.carts[sessionId]) {
      delete data.carts[sessionId];
      const success = this.writeData(data);
      if (success) {
        console.log(`🗑️  Cart cleared for session: ${sessionId}`);
        return true;
      }
    }
    return false;
  }

  // Verificar si el carrito existe
  cartExists(sessionId) {
    const data = this.readData();
    return data.carts[sessionId] !== undefined;
  }
// MÉTODOS PARA PEDIDOS (agregar después de los métodos del carrito)

// Crear una nueva orden
createOrder(orderData) {
    const data = this.readData();
    const newOrder = {
      id: uuidv4(),
      ...orderData,
      createdAt: new Date().toISOString(),
      status: 'completed'
    };
    
    data.orders.push(newOrder);
    const success = this.writeData(data);
    
    if (success) {
      console.log(`📦 Order created: ${newOrder.id}`);
      return newOrder;
    } else {
      throw new Error('Failed to create order');
    }
  }
  
  // Obtener todas las órdenes
  getAllOrders() {
    const data = this.readData();
    return data.orders;
  }
  
  // Obtener orden por ID
  getOrderById(id) {
    const data = this.readData();
    return data.orders.find(order => order.id === id);
  }
  
  // Actualizar stock de productos (para el checkout)
  updateProductStock(productId, quantityUsed) {
    const data = this.readData();
    const productIndex = data.products.findIndex(p => p.id === productId);
    
    if (productIndex > -1) {
      data.products[productIndex].stock -= quantityUsed;
      const success = this.writeData(data);
      if (success) {
        console.log(`📦 Stock updated for ${productId}: -${quantityUsed}`);
        return data.products[productIndex];
      }
    }
    return null;
  }
  // MÉTODOS PARA ESTADÍSTICAS
  
  getStats() {
    const data = this.readData();
    return {
      totalProducts: data.products.length,
      totalCarts: Object.keys(data.carts).length,
      totalOrders: data.orders.length,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Exportar una instancia única (patrón Singleton)
module.exports = new Database();