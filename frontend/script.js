// ===== CONFIGURACIÓN GLOBAL =====
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api'; // Para producción en Vercel

const SESSION_ID = 'frontend-session-' + Math.random().toString(36).substr(2, 9);
// ===== ESTADO GLOBAL =====
let state = {
    products: [],
    cart: { items: [], total: 0 },
    orders: [],
    stats: {},
    currentSection: 'products'
};

// ===== UTILIDADES =====
class Utils {
    static formatPrice(price) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(price);
    }

    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static getProductIcon(category) {
        const icons = {
            electronics: 'fas fa-laptop',
            clothing: 'fas fa-tshirt',
            books: 'fas fa-book',
            home: 'fas fa-home',
            sports: 'fas fa-dumbbell',
            default: 'fas fa-box'
        };
        return icons[category] || icons.default;
    }

    static truncateText(text, maxLength = 100) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
}

// ===== SERVICIOS API =====
class APIService {
    static async request(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'session-id': SESSION_ID
            }
        };

        const config = { ...defaultOptions, ...options };
        
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Products
    static async getProducts() {
        return await this.request('/products');
    }

    static async createProduct(productData) {
        return await this.request('/products', {
            method: 'POST',
            body: productData
        });
    }

    // Cart
    static async getCart() {
        return await this.request('/cart');
    }

    static async addToCart(productId, quantity = 1) {
        return await this.request('/cart', {
            method: 'POST',
            body: { productId, quantity }
        });
    }

    static async updateCartItem(productId, quantity) {
        return await this.request(`/cart/${productId}`, {
            method: 'PUT',
            body: { quantity }
        });
    }

    static async removeFromCart(productId) {
        return await this.request(`/cart/${productId}`, {
            method: 'DELETE'
        });
    }

    static async clearCart() {
        return await this.request('/cart', {
            method: 'DELETE'
        });
    }

    // Checkout & Orders
    static async processCheckout(customerInfo, paymentMethod) {
        return await this.request('/checkout', {
            method: 'POST',
            body: { customerInfo, paymentMethod }
        });
    }

    static async getOrders() {
        return await this.request('/orders');
    }

    static async getStats() {
        return await this.request('/stats');
    }
}

// ===== SISTEMA DE NOTIFICACIONES =====
class NotificationSystem {
    static show(message, type = 'success', duration = 4000) {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icons[type] || icons.info}"></i>
                <div class="notification-text">
                    <div class="notification-title">${this.getTitle(type)}</div>
                    <div class="notification-message">${message}</div>
                </div>
            </div>
        `;

        container.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);

        // Click to remove
        notification.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }

    static getTitle(type) {
        const titles = {
            success: '¡Éxito!',
            error: 'Error',
            warning: 'Advertencia',
            info: 'Información'
        };
        return titles[type] || 'Notificación';
    }

    static success(message) { this.show(message, 'success'); }
    static error(message) { this.show(message, 'error'); }
    static warning(message) { this.show(message, 'warning'); }
    static info(message) { this.show(message, 'info'); }
}

// ===== GESTIÓN DEL CARRITO =====
class CartManager {
    static init() {
        this.setupEventListeners();
        this.loadCart();
    }

    static setupEventListeners() {
        // Cart toggle
        document.getElementById('cartBtn').addEventListener('click', () => {
            this.toggleCart();
        });

        // Close cart
        document.getElementById('closeCart').addEventListener('click', () => {
            this.closeCart();
        });

        // Checkout button
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            this.openCheckout();
        });
    }

    static async loadCart() {
        try {
            const response = await APIService.getCart();
            state.cart = response.cart;
            this.updateCartUI();
        } catch (error) {
            console.error('Error loading cart:', error);
            NotificationSystem.error('Error al cargar el carrito');
        }
    }

    static async addToCart(productId) {
        try {
            const response = await APIService.addToCart(productId, 1);
            state.cart = response.cart;
            this.updateCartUI();
            NotificationSystem.success('Producto agregado al carrito');
        } catch (error) {
            console.error('Error adding to cart:', error);
            NotificationSystem.error(error.message || 'Error al agregar al carrito');
        }
    }

    static async updateQuantity(productId, quantity) {
        try {
            if (quantity === 0) {
                await this.removeFromCart(productId);
                return;
            }

            const response = await APIService.updateCartItem(productId, quantity);
            state.cart = response.cart;
            this.updateCartUI();
            NotificationSystem.success('Carrito actualizado');
        } catch (error) {
            console.error('Error updating cart:', error);
            NotificationSystem.error(error.message || 'Error al actualizar el carrito');
        }
    }

    static async removeFromCart(productId) {
        try {
            const response = await APIService.removeFromCart(productId);
            state.cart = response.cart;
            this.updateCartUI();
            NotificationSystem.success('Producto eliminado del carrito');
        } catch (error) {
            console.error('Error removing from cart:', error);
            NotificationSystem.error(error.message || 'Error al eliminar del carrito');
        }
    }

    static updateCartUI() {
        this.updateCartCount();
        this.updateCartItems();
        this.updateCartFooter();
    }

    static updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        const totalItems = state.cart.items.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    static updateCartItems() {
        const cartItems = document.getElementById('cartItems');
        
        if (state.cart.items.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Tu carrito está vacío</p>
                </div>
            `;
            return;
        }

        cartItems.innerHTML = state.cart.items.map(item => `
            <div class="cart-item" data-product-id="${item.productId}">
                <div class="cart-item-image">
                    <i class="${Utils.getProductIcon('electronics')}"></i>
                </div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">${Utils.formatPrice(item.price)}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn decrease-btn" data-product-id="${item.productId}">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn increase-btn" data-product-id="${item.productId}">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="remove-item" data-product-id="${item.productId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to cart controls
        this.setupCartControls();
    }

    static setupCartControls() {
        // Decrease quantity
        document.querySelectorAll('.decrease-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('button').dataset.productId;
                const currentItem = state.cart.items.find(item => item.productId === productId);
                const newQuantity = Math.max(0, currentItem.quantity - 1);
                this.updateQuantity(productId, newQuantity);
            });
        });

        // Increase quantity
        document.querySelectorAll('.increase-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('button').dataset.productId;
                const currentItem = state.cart.items.find(item => item.productId === productId);
                this.updateQuantity(productId, currentItem.quantity + 1);
            });
        });

        // Remove item
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('button').dataset.productId;
                this.removeFromCart(productId);
            });
        });
    }

    static updateCartFooter() {
        const cartFooter = document.getElementById('cartFooter');
        const cartTotal = document.getElementById('cartTotal');
        
        if (state.cart.items.length > 0) {
            cartFooter.style.display = 'block';
            cartTotal.textContent = state.cart.total.toFixed(2);
        } else {
            cartFooter.style.display = 'none';
        }
    }

    static toggleCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('overlay');
        
        cartSidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    static openCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('overlay');
        
        cartSidebar.classList.add('active');
        overlay.classList.add('active');
    }

    static closeCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('overlay');
        
        cartSidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    static openCheckout() {
        if (state.cart.items.length === 0) {
            NotificationSystem.warning('Tu carrito está vacío');
            return;
        }

        CheckoutManager.openModal();
        this.closeCart();
    }
}

// ===== GESTIÓN DEL CHECKOUT =====
class CheckoutManager {
    static init() {
        this.setupEventListeners();
    }

    static setupEventListeners() {
        // Close checkout modal
        document.getElementById('closeCheckout').addEventListener('click', () => {
            this.closeModal();
        });

        // Checkout form submission
        document.getElementById('checkoutForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processCheckout();
        });

        // Success modal
        document.getElementById('closeSuccess').addEventListener('click', () => {
            this.closeSuccessModal();
        });
    }

    static openModal() {
        const modal = document.getElementById('checkoutModal');
        const overlay = document.getElementById('overlay');
        
        this.updateCheckoutSummary();
        modal.classList.add('active');
        overlay.classList.add('active');
    }

    static closeModal() {
        const modal = document.getElementById('checkoutModal');
        const overlay = document.getElementById('overlay');
        
        modal.classList.remove('active');
        overlay.classList.remove('active');
    }

    static updateCheckoutSummary() {
        const checkoutItems = document.getElementById('checkoutItems');
        const checkoutTotal = document.getElementById('checkoutTotal');

        checkoutItems.innerHTML = state.cart.items.map(item => `
            <div class="checkout-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>${Utils.formatPrice(item.price * item.quantity)}</span>
            </div>
        `).join('');

        checkoutTotal.textContent = state.cart.total.toFixed(2);
    }

    static async processCheckout() {
        const form = document.getElementById('checkoutForm');
        const formData = new FormData(form);
        
        const customerInfo = {
            name: document.getElementById('customerName').value,
            email: document.getElementById('customerEmail').value,
            address: document.getElementById('customerAddress').value,
            phone: document.getElementById('customerPhone').value
        };

        const paymentMethod = document.getElementById('paymentMethod').value;

        try {
            // Show loading
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            submitBtn.disabled = true;

            const response = await APIService.processCheckout(customerInfo, paymentMethod);
            
            // Reset form and show success
            form.reset();
            this.closeModal();
            this.showSuccessModal(response.order);
            
            // Reload cart
            await CartManager.loadCart();
            
            NotificationSystem.success('¡Compra realizada exitosamente!');

        } catch (error) {
            console.error('Checkout error:', error);
            NotificationSystem.error(error.message || 'Error al procesar la compra');
        } finally {
            // Reset button
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar Compra';
            submitBtn.disabled = false;
        }
    }

    static showSuccessModal(order) {
        const modal = document.getElementById('successModal');
        const overlay = document.getElementById('overlay');
        const orderDetails = document.getElementById('orderDetails');

        orderDetails.innerHTML = `
            <div style="text-align: left;">
                <p><strong>ID de Orden:</strong> ${order.id}</p>
                <p><strong>Total:</strong> ${Utils.formatPrice(order.total)}</p>
                <p><strong>Estado:</strong> <span style="color: var(--success-color);">${order.status}</span></p>
                <p><strong>Fecha:</strong> ${Utils.formatDate(order.createdAt)}</p>
                <p><strong>Transacción:</strong> ${order.transactionId}</p>
            </div>
        `;

        modal.classList.add('active');
        overlay.classList.add('active');
    }

    static closeSuccessModal() {
        const modal = document.getElementById('successModal');
        const overlay = document.getElementById('overlay');
        
        modal.classList.remove('active');
        overlay.classList.remove('active');
    }
}

// ===== GESTIÓN DE PRODUCTOS =====
class ProductManager {
    static init() {
        this.loadProducts();
    }

    static async loadProducts() {
        try {
            const productsGrid = document.getElementById('productsGrid');
            productsGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando productos...</div>';

            const response = await APIService.getProducts();
            state.products = response.products;
            this.renderProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            NotificationSystem.error('Error al cargar los productos');
            document.getElementById('productsGrid').innerHTML = '<div class="loading">Error al cargar productos</div>';
        }
    }

    static renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        
        if (state.products.length === 0) {
            productsGrid.innerHTML = `
                <div class="loading">
                    <i class="fas fa-box-open"></i>
                    <p>No hay productos disponibles</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = state.products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <i class="${Utils.getProductIcon(product.category)}"></i>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${Utils.truncateText(product.description || 'Sin descripción')}</p>
                    <div class="product-meta">
                        <span class="product-price">${Utils.formatPrice(product.price)}</span>
                        <span class="product-stock ${product.stock <= 5 ? 'low' : ''} ${product.stock === 0 ? 'out' : ''}">
                            Stock: ${product.stock}
                        </span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary add-to-cart-btn" 
                                data-product-id="${product.id}"
                                ${product.stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i>
                            ${product.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners to add-to-cart buttons
        this.setupProductEventListeners();
    }

    static setupProductEventListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productId = e.target.closest('button').dataset.productId;
                await CartManager.addToCart(productId);
            });
        });
    }
}

// ===== GESTIÓN DEL ADMIN =====
class AdminManager {
    static init() {
        this.setupEventListeners();
        this.loadAdminData();
    }

    static setupEventListeners() {
        // Add product form
        document.getElementById('addProductForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });
    }

    static async addProduct() {
        const form = document.getElementById('addProductForm');
        const formData = new FormData(form);

        const productData = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            category: document.getElementById('productCategory').value
        };

        try {
            // Show loading
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';
            submitBtn.disabled = true;

            const response = await APIService.createProduct(productData);
            
            // Reset form and reload products
            form.reset();
            await ProductManager.loadProducts();
            await this.loadStats();
            
            NotificationSystem.success('Producto agregado exitosamente');

        } catch (error) {
            console.error('Error adding product:', error);
            NotificationSystem.error(error.message || 'Error al agregar el producto');
        } finally {
            // Reset button
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Agregar Producto';
            submitBtn.disabled = false;
        }
    }

    static async loadAdminData() {
        await Promise.all([
            this.loadStats(),
            this.loadOrders()
        ]);
    }

    static async loadStats() {
        try {
            const response = await APIService.getStats();
            state.stats = response.stats;
            this.renderStats();
        } catch (error) {
            console.error('Error loading stats:', error);
            document.getElementById('statsContainer').innerHTML = '<div class="loading">Error al cargar estadísticas</div>';
        }
    }

    static renderStats() {
        const statsContainer = document.getElementById('statsContainer');
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="stat-number">${state.stats.totalProducts || 0}</span>
                <span class="stat-label">Total Productos</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">${state.stats.totalOrders || 0}</span>
                <span class="stat-label">Total Órdenes</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">${state.stats.totalCarts || 0}</span>
                <span class="stat-label">Carritos Activos</span>
            </div>
        `;
    }

    static async loadOrders() {
        try {
            const response = await APIService.getOrders();
            state.orders = response.orders;
            this.renderOrders();
        } catch (error) {
            console.error('Error loading orders:', error);
            document.getElementById('ordersContainer').innerHTML = '<div class="loading">Error al cargar órdenes</div>';
        }
    }

    static renderOrders() {
        const ordersContainer = document.getElementById('ordersContainer');
        
        if (state.orders.length === 0) {
            ordersContainer.innerHTML = '<div class="loading">No hay órdenes disponibles</div>';
            return;
        }

        ordersContainer.innerHTML = state.orders.slice(0, 10).map(order => `
            <div class="order-item">
                <div class="order-info">
                    <div class="order-id">Orden #${order.id.substring(0, 8)}</div>
                    <div class="order-details">
                        ${order.customerEmail} • ${Utils.formatDate(order.createdAt)} • ${order.itemCount} item(s)
                    </div>
                </div>
                <div class="order-total">${Utils.formatPrice(order.total)}</div>
                <div class="order-status">${order.status}</div>
            </div>
        `).join('');
    }
}

// ===== GESTIÓN DE NAVEGACIÓN =====
class NavigationManager {
    static init() {
        this.setupEventListeners();
        this.showSection('products');
    }

    static setupEventListeners() {
        // Admin button
        document.getElementById('adminBtn').addEventListener('click', () => {
            this.toggleSection();
        });

        // Overlay click
        document.getElementById('overlay').addEventListener('click', () => {
            this.closeAllModals();
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    static toggleSection() {
        if (state.currentSection === 'products') {
            this.showSection('admin');
        } else {
            this.showSection('products');
        }
    }

    static showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        document.getElementById(`${sectionName}Section`).classList.add('active');
        state.currentSection = sectionName;

        // Update admin button text
        const adminBtn = document.getElementById('adminBtn');
        if (sectionName === 'admin') {
            adminBtn.innerHTML = '<i class="fas fa-store"></i> Tienda';
        } else {
            adminBtn.innerHTML = '<i class="fas fa-cog"></i> Admin';
        }

        // Load section data if needed
        if (sectionName === 'admin') {
            AdminManager.loadAdminData();
        }
    }

    static closeAllModals() {
        CartManager.closeCart();
        CheckoutManager.closeModal();
        CheckoutManager.closeSuccessModal();
    }
}

// ===== GESTIÓN DE ERRORES GLOBAL =====
class ErrorHandler {
    static init() {
        // Catch unhandled errors
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            NotificationSystem.error('Ocurrió un error inesperado');
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            NotificationSystem.error('Error de conexión con el servidor');
        });
    }
}

// ===== INICIALIZACIÓN PRINCIPAL =====
class App {
    static async init() {
        console.log('🚀 Iniciando Ecommerce Frontend...');
        
        try {
            // Initialize all managers
            ErrorHandler.init();
            NavigationManager.init();
            CartManager.init();
            CheckoutManager.init();
            AdminManager.init();
            ProductManager.init();

            // Show success message
            setTimeout(() => {
                NotificationSystem.success('¡Aplicación cargada correctamente!');
            }, 1000);

        } catch (error) {
            console.error('Error initializing app:', error);
            NotificationSystem.error('Error al inicializar la aplicación');
        }
    }

    static handleOnline() {
        NotificationSystem.success('Conexión restaurada');
    }

    static handleOffline() {
        NotificationSystem.warning('Sin conexión a internet');
    }
}

// ===== UTILIDADES DE DESARROLLO =====
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Development utilities
    window.ecommerceDebug = {
        state,
        api: APIService,
        cart: CartManager,
        products: ProductManager,
        admin: AdminManager,
        clearCart: () => CartManager.clearCart(),
        addTestProduct: () => {
            return APIService.createProduct({
                name: 'Producto de Prueba',
                description: 'Este es un producto de prueba generado automáticamente',
                price: Math.random() * 100 + 10,
                stock: Math.floor(Math.random() * 50) + 1,
                category: 'electronics'
            });
        }
    };
    
    console.log('🔧 Debug utilities available at window.ecommerceDebug');
}

// ===== EVENT LISTENERS GLOBALES =====

// Network status
window.addEventListener('online', App.handleOnline);
window.addEventListener('offline', App.handleOffline);

// Page visibility
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.currentSection === 'products') {
        // Refresh products when page becomes visible
        ProductManager.loadProducts();
    }
});

// Auto-refresh cart every 30 seconds
setInterval(() => {
    if (!document.hidden) {
        CartManager.loadCart();
    }
}, 30000);

// ===== INICIAR APLICACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// ===== ESTILOS DINÁMICOS ADICIONALES =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
    
    .notification {
        cursor: pointer;
        transition: transform 0.2s ease;
    }
    
    .notification:hover {
        transform: translateX(-5px);
    }
    
    .loading {
        opacity: 0.7;
    }
    
    .pulse-animation {
        animation: pulse 1.5s ease-in-out infinite;
    }
`;
document.head.appendChild(style);