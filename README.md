# 🛒 Ecommerce API & Frontend

Un sistema completo de ecommerce con API REST y frontend moderno.

## 🌟 Características

- ✅ **API REST completa** con Node.js + Express
- 🛒 **Gestión de productos** (CRUD completo)
- 🛒 **Sistema de carrito** con sesiones
- 💳 **Checkout** con simulación de pagos
- 📦 **Gestión de órdenes**
- 🎨 **Frontend moderno** HTML/CSS/JS
- 👨‍💼 **Panel de administración**
- 📊 **Dashboard con estadísticas**
- 🧪 **28 tests comprehensivos**
- 📱 **Diseño responsive**
- 🌐 **Deploy listo para producción**



## 🛠️ Tecnologías

### Backend
- **Node.js** + Express
- **JSON File Database** (fácil de migrar)
- **UUID** para IDs únicos
- **Jest** + Supertest para testing
- **CORS** para frontend

### Frontend
- **HTML5** semántico
- **CSS3** moderno (Grid, Flexbox, Animations)
- **Vanilla JavaScript** (ES6+)
- **Font Awesome** para iconos
- **Responsive Design**

## 📋 API Endpoints

### Productos
- `POST /api/products` - Crear producto
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto

### Carrito
- `POST /api/cart` - Agregar al carrito
- `GET /api/cart` - Ver carrito
- `PUT /api/cart/:productId` - Actualizar cantidad
- `DELETE /api/cart/:productId` - Eliminar del carrito
- `DELETE /api/cart` - Vaciar carrito

### Checkout & Órdenes
- `POST /api/checkout` - Procesar pago
- `GET /api/orders` - Listar órdenes
- `GET /api/orders/:id` - Obtener orden específica

### Utilidades
- `GET /api/stats` - Estadísticas
- `GET /health` - Health check

## 🏃‍♂️ Ejecución Local

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/ecommerce-api.git
cd ecommerce-api

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Ejecutar tests
npm test