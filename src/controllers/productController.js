const database = require('../models/database');

class ProductController {
  // Crear un nuevo producto
  async createProduct(req, res) {
    try {
      const { name, description, price, stock, category } = req.body;

      // Validaciones básicas
      if (!name || !price || stock === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Name, price, and stock are required fields',
          received: { name, price, stock }
        });
      }

      if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Price must be a number greater than 0',
          received: { price, type: typeof price }
        });
      }

      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({
          success: false,
          error: 'Stock must be a number greater than or equal to 0',
          received: { stock, type: typeof stock }
        });
      }

      // Crear el producto
      const product = database.createProduct({
        name: name.trim(),
        description: description ? description.trim() : '',
        price: parseFloat(price),
        stock: parseInt(stock),
        category: category ? category.trim() : 'general'
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product
      });

    } catch (error) {
      console.error('Error creating product:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Obtener todos los productos
  async getAllProducts(req, res) {
    try {
      const products = database.getAllProducts();
      
      res.json({
        success: true,
        count: products.length,
        products: products
      });

    } catch (error) {
      console.error('Error fetching products:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Obtener producto por ID
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = database.getProductById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          productId: id
        });
      }

      res.json({
        success: true,
        product
      });

    } catch (error) {
      console.error('Error fetching product:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
}

module.exports = new ProductController();