const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// POST /api/products - Crear producto
router.post('/', productController.createProduct);

// GET /api/products - Obtener todos los productos
router.get('/', productController.getAllProducts);

// GET /api/products/:id - Obtener producto por ID
router.get('/:id', productController.getProductById);

module.exports = router;