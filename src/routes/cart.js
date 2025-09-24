const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// POST /api/cart - Agregar producto al carrito
router.post('/', cartController.addToCart);

// GET /api/cart - Obtener contenido del carrito
router.get('/', cartController.getCart);

// PUT /api/cart/:productId - Actualizar cantidad de producto en carrito
router.put('/:productId', cartController.updateCartItem);

// DELETE /api/cart/:productId - Eliminar producto del carrito
router.delete('/:productId', cartController.removeFromCart);

// DELETE /api/cart - Limpiar todo el carrito
router.delete('/', cartController.clearCart);

module.exports = router;