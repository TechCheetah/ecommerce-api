const database = require('../models/database');

class CheckoutController {
  // Obtener session ID del header
  getSessionId(req) {
    return req.headers['session-id'] || req.headers['x-session-id'] || 'default-session';
  }

  // Simular procesamiento de pago
  simulatePayment(amount, paymentMethod = 'credit_card') {
    // Para tests, siempre ser exitoso. En producción se puede cambiar.
    const isTest = process.env.NODE_ENV === 'test';
    const success = isTest ? true : Math.random() > 0.1;
    
    return {
      success,
      transactionId: success ? `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
      amount,
      paymentMethod,
      processedAt: new Date().toISOString(),
      message: success ? 'Payment processed successfully' : 'Payment processing failed'
    };
  }

  // Procesar checkout
  processCheckout = async (req, res) => {
    try {
      const sessionId = this.getSessionId(req);
      const { customerInfo, paymentMethod = 'credit_card' } = req.body;

      // Validar información del cliente
      if (!customerInfo || !customerInfo.email || !customerInfo.name) {
        return res.status(400).json({
          success: false,
          error: 'Customer information is required',
          required: ['name', 'email'],
          received: customerInfo
        });
      }

      // Validar email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerInfo.email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
          email: customerInfo.email
        });
      }

      // Obtener carrito
      const cart = database.getCart(sessionId);

      if (!cart.items || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cart is empty',
          sessionId
        });
      }

      // Verificar stock disponible para todos los productos
      for (const item of cart.items) {
        const product = database.getProductById(item.productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            error: `Product ${item.name} not found`,
            productId: item.productId
          });
        }
        
        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for ${item.name}`,
            available: product.stock,
            requested: item.quantity,
            productId: item.productId
          });
        }
      }

      // Simular procesamiento de pago
      const paymentResult = this.simulatePayment(cart.total, paymentMethod);
      
      if (!paymentResult.success) {
        return res.status(402).json({
          success: false,
          error: 'Payment processing failed',
          message: 'Please check your payment information and try again',
          details: paymentResult
        });
      }

      // Crear la orden
      const orderData = {
        customerInfo: {
          name: customerInfo.name.trim(),
          email: customerInfo.email.trim().toLowerCase(),
          address: customerInfo.address || '',
          phone: customerInfo.phone || ''
        },
        items: cart.items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        total: cart.total,
        payment: {
          method: paymentMethod,
          transactionId: paymentResult.transactionId,
          processedAt: paymentResult.processedAt
        },
        sessionId
      };

      const order = database.createOrder(orderData);

      // Actualizar stock de productos
      for (const item of cart.items) {
        database.updateProductStock(item.productId, item.quantity);
      }

      // Limpiar carrito después del checkout exitoso
      database.clearCart(sessionId);

      res.json({
        success: true,
        message: 'Order processed successfully',
        order: {
          id: order.id,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
          transactionId: paymentResult.transactionId,
          customerEmail: order.customerInfo.email
        }
      });

    } catch (error) {
      console.error('Error processing checkout:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Obtener historial de órdenes (bonus)
  getOrders = async (req, res) => {
    try {
      const orders = database.getAllOrders();
      
      res.json({
        success: true,
        count: orders.length,
        orders: orders.map(order => ({
          id: order.id,
          customerEmail: order.customerInfo.email,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
          itemCount: order.items.length
        }))
      });

    } catch (error) {
      console.error('Error fetching orders:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Obtener orden específica (bonus)
  getOrderById = async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = database.getOrderById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
          orderId
        });
      }

      res.json({
        success: true,
        order
      });

    } catch (error) {
      console.error('Error fetching order:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
}

module.exports = new CheckoutController();