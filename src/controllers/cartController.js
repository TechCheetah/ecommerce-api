const database = require('../models/database');

class CartController {
  // Obtener session ID del header o generar uno por defecto
  getSessionId(req) {
    return req.headers['session-id'] || req.headers['x-session-id'] || 'default-session';
  }

  // Calcular el total del carrito
  calculateCartTotal(items) {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  // Agregar producto al carrito - USAR ARROW FUNCTION
  addToCart = async (req, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
      const sessionId = this.getSessionId(req);

      // Validaciones básicas
      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID is required',
          received: { productId }
        });
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantity must be a positive integer',
          received: { quantity, type: typeof quantity }
        });
      }

      // Verificar que el producto existe
      const product = database.getProductById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          productId
        });
      }

      // Obtener carrito actual
      const cart = database.getCart(sessionId);
      
      // Verificar si el producto ya está en el carrito
      const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
      let newQuantity = quantity;

      if (existingItemIndex > -1) {
        // Si ya existe, sumar la cantidad
        newQuantity = cart.items[existingItemIndex].quantity + quantity;
      }

      // Verificar stock disponible
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient stock',
          available: product.stock,
          requested: newQuantity,
          inCart: existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0
        });
      }

      // Actualizar o agregar el item
      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].updatedAt = new Date().toISOString();
      } else {
        cart.items.push({
          productId: productId,
          name: product.name,
          price: product.price,
          quantity: quantity,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Recalcular total
      cart.total = this.calculateCartTotal(cart.items);
      
      // Guardar carrito actualizado
      const updatedCart = database.updateCart(sessionId, cart);

      res.json({
        success: true,
        message: `Product ${existingItemIndex > -1 ? 'updated in' : 'added to'} cart`,
        cart: updatedCart,
        sessionId
      });

    } catch (error) {
      console.error('Error adding to cart:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Obtener contenido del carrito - USAR ARROW FUNCTION
  getCart = async (req, res) => {
    try {
      const sessionId = this.getSessionId(req);
      const cart = database.getCart(sessionId);

      res.json({
        success: true,
        cart,
        sessionId,
        isEmpty: cart.items.length === 0
      });

    } catch (error) {
      console.error('Error fetching cart:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Actualizar cantidad de un producto en el carrito - USAR ARROW FUNCTION
  updateCartItem = async (req, res) => {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;
      const sessionId = this.getSessionId(req);

      // Validaciones
      if (!Number.isInteger(quantity) || quantity < 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantity must be a non-negative integer',
          received: { quantity }
        });
      }

      // Verificar que el producto existe
      const product = database.getProductById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          productId
        });
      }

      const cart = database.getCart(sessionId);
      const itemIndex = cart.items.findIndex(item => item.productId === productId);

      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Product not found in cart',
          productId
        });
      }

      // Si quantity es 0, eliminar el producto del carrito
      if (quantity === 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        // Verificar stock disponible
        if (product.stock < quantity) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient stock',
            available: product.stock,
            requested: quantity
          });
        }

        // Actualizar cantidad
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].updatedAt = new Date().toISOString();
      }

      // Recalcular total
      cart.total = this.calculateCartTotal(cart.items);
      
      // Guardar carrito actualizado
      const updatedCart = database.updateCart(sessionId, cart);

      res.json({
        success: true,
        message: quantity === 0 ? 'Product removed from cart' : 'Cart item updated',
        cart: updatedCart,
        sessionId
      });

    } catch (error) {
      console.error('Error updating cart item:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Eliminar producto del carrito - USAR ARROW FUNCTION
  removeFromCart = async (req, res) => {
    try {
      const { productId } = req.params;
      const sessionId = this.getSessionId(req);

      const cart = database.getCart(sessionId);
      const itemIndex = cart.items.findIndex(item => item.productId === productId);

      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Product not found in cart',
          productId
        });
      }

      // Eliminar item
      const removedItem = cart.items.splice(itemIndex, 1)[0];
      
      // Recalcular total
      cart.total = this.calculateCartTotal(cart.items);
      
      // Guardar carrito actualizado
      const updatedCart = database.updateCart(sessionId, cart);

      res.json({
        success: true,
        message: 'Product removed from cart',
        removedItem,
        cart: updatedCart,
        sessionId
      });

    } catch (error) {
      console.error('Error removing from cart:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Limpiar todo el carrito - USAR ARROW FUNCTION
  clearCart = async (req, res) => {
    try {
      const sessionId = this.getSessionId(req);
      const success = database.clearCart(sessionId);

      if (success) {
        res.json({
          success: true,
          message: 'Cart cleared successfully',
          sessionId
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Cart not found or already empty',
          sessionId
        });
      }

    } catch (error) {
      console.error('Error clearing cart:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
}

module.exports = new CartController();