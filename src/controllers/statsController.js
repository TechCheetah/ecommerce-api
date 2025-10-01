const database = require('../models/database');

class StatsController {
  // Obtener estadísticas del sistema
  getStats = async (req, res) => {
    try {
      // Obtener todos los productos
      const products = database.getAllProducts();
      
      // Obtener todas las órdenes
      const orders = database.getAllOrders();
      
      // Calcular estadísticas
      const totalProducts = products.length;
      const totalOrders = orders.length;
      
      // Calcular ingresos totales
      const totalRevenue = orders.reduce((total, order) => {
        return total + (parseFloat(order.total) || 0);
      }, 0);
      
      // Productos con stock bajo (menos de 5 unidades)
      const lowStockProducts = products.filter(product => 
        (parseInt(product.stock) || 0) < 5
      ).length;
      
      // Productos sin stock
      const outOfStockProducts = products.filter(product => 
        (parseInt(product.stock) || 0) === 0
      ).length;
      
      // Estadísticas por categoría
      const productsByCategory = products.reduce((acc, product) => {
        const category = product.category || 'general';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
      
      // Ventas por método de pago
      const salesByPaymentMethod = orders.reduce((acc, order) => {
        const method = order.payment?.method || 'unknown';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {});
      
      // Órdenes recientes (últimas 10)
      const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);
      
      // Producto más vendido
      const productSales = orders.reduce((acc, order) => {
        order.items?.forEach(item => {
          acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
        });
        return acc;
      }, {});
      
      const topProduct = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)[0];
      
      const topProductInfo = topProduct ? {
        id: topProduct[0],
        name: products.find(p => p.id === topProduct[0])?.name || 'Producto eliminado',
        quantitySold: topProduct[1]
      } : null;

      const stats = {
        // Estadísticas básicas
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        lowStockProducts,
        outOfStockProducts,
        
        // Estadísticas avanzadas
        productsByCategory,
        salesByPaymentMethod,
        topProduct: topProductInfo,
        
        // Órdenes recientes
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          customerEmail: order.customerInfo?.email,
          total: order.total,
          createdAt: order.createdAt,
          itemCount: order.items?.length || 0
        })),
        
        // Metadatos
        lastUpdated: new Date().toISOString(),
        systemStatus: 'operational'
      };

      res.json({
        success: true,
        stats,
        message: 'Statistics retrieved successfully'
      });

    } catch (error) {
      console.error('Error fetching stats:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Estadísticas específicas por fecha (bonus)
  getStatsByDate = async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const orders = database.getAllOrders();
      
      // Filtrar órdenes por fecha si se proporcionan
      let filteredOrders = orders;
      
      if (startDate) {
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.createdAt) >= new Date(startDate)
        );
      }
      
      if (endDate) {
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.createdAt) <= new Date(endDate)
        );
      }
      
      const totalRevenue = filteredOrders.reduce((total, order) => {
        return total + (parseFloat(order.total) || 0);
      }, 0);
      
      res.json({
        success: true,
        stats: {
          period: { startDate, endDate },
          totalOrders: filteredOrders.length,
          totalRevenue: totalRevenue.toFixed(2)
        }
      });

    } catch (error) {
      console.error('Error fetching stats by date:', error.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
}

module.exports = new StatsController();