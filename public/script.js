// 🛒 Ecommerce Store JavaScript
console.log('🚀 Ecommerce Store Loading...');

// Global state
let currentUser = null;
let cart = [];
let products = [];
let isAdminMode = false;
let sessionId = 'user-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();

console.log('🆔 Session ID:', sessionId);

// DOM Elements
const elements = {
    productsGrid: document.getElementById('productsGrid'),
    cartBtn: document.getElementById('cartBtn'),
    cartCount: document.getElementById('cartCount'),
    cartSidebar: document.getElementById('cartSidebar'),
    cartItems: document.getElementById('cartItems'),
    cartTotal: document.getElementById('cartTotal'),
    adminBtn: document.getElementById('adminBtn'),
    productsSection: document.getElementById('productsSection'),
    adminSection: document.getElementById('adminSection'),
    overlay: document.getElementById('overlay'),
    notifications: document.getElementById('notifications')
};

// Initialize app
document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ DOM loaded, initializing app...');
    
    await loadProducts();
    await loadCart();
    await loadStats();
    
    setupEventListeners();
    
    console.log('🎯 App initialized successfully');
});

// Event Listeners
function setupEventListeners() {
    // Navigation
    elements.cartBtn?.addEventListener('click', toggleCart);
    elements.adminBtn?.addEventListener('click', toggleAdmin);
    document.getElementById('closeCart')?.addEventListener('click', closeCart);
    
    // Forms
    document.getElementById('addProductForm')?.addEventListener('submit', addProduct);
    document.getElementById('checkoutForm')?.addEventListener('submit', handleCheckout);
    
    // Modal controls
    document.getElementById('checkoutBtn')?.addEventListener('click', openCheckout);
    document.getElementById('closeCheckout')?.addEventListener('click', closeCheckout);
    document.getElementById('closeSuccess')?.addEventListener('click', closeSuccess);
    
    // Overlay
    elements.overlay?.addEventListener('click', closeAllModals);
}

// Load Products
async function loadProducts() {
    console.log('📦 Loading products...');
    
    try {
        const response = await fetch('/api/products');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        products = data.products || data;
        console.log(`✅ Loaded ${products.length} products`);
        
        renderProducts();
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        showNotification('Error cargando productos: ' + error.message, 'error');
        
        if (elements.productsGrid) {
            elements.productsGrid.innerHTML = `
                <div class="loading error" style="grid-column: 1/-1;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error cargando productos</p>
                    <p><small>${error.message}</small></p>
                    <button onclick="loadProducts()" class="btn-primary" style="margin-top: 1rem;">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Render Products
function renderProducts() {
    if (!elements.productsGrid || !products.length) return;
    
    elements.productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-category">${getCategoryName(product.category)}</div>
            <h3>${product.name}</h3>
            <p>${product.description || 'Sin descripción disponible'}</p>
            <div class="product-price">$${parseFloat(product.price || 0).toFixed(2)}</div>
            <div class="product-stock">
                ${product.stock > 0 ? `✅ ${product.stock} disponibles` : '❌ Sin stock'}
            </div>
            <button 
                onclick="addToCart('${product.id}')" 
                class="btn-primary"
                ${product.stock <= 0 ? 'disabled' : ''}
            >
                <i class="fas fa-cart-plus"></i> 
                ${product.stock <= 0 ? 'Sin Stock' : 'Agregar al Carrito'}
            </button>
        </div>
    `).join('');
}

// Get category name
function getCategoryName(category) {
    const categories = {
        electronics: '📱 Electrónicos',
        clothing: '👕 Ropa',
        books: '📚 Libros',
        home: '🏠 Hogar',
        sports: '⚽ Deportes',
        test: '🧪 Prueba'
    };
    return categories[category] || '📦 General';
}

// Load Cart
async function loadCart() {
    console.log('🛒 Loading cart...');
    
    try {
        const response = await fetch('/api/cart', {
            headers: {
                'session-id': sessionId
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Debug: mostrar la respuesta completa
        console.log('📦 Raw cart response:', data);
        
        // Tu cartController devuelve: { success: true, cart: { items: [...] } }
        if (data.success && data.cart && data.cart.items) {
            cart = data.cart.items;
        } else {
            cart = [];
        }
        
        console.log('✅ Cart processed:', cart);
        console.log('📊 Cart length:', cart.length);
        updateCartUI();
        
    } catch (error) {
        console.error('❌ Error loading cart:', error);
        cart = [];
        updateCartUI();
    }
}

// Add to Cart
async function addToCart(productId) {
    console.log(`🛒 Adding product ${productId} to cart...`);
    
    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'session-id': sessionId
            },
            body: JSON.stringify({
                productId: productId,
                quantity: 1
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Product added to cart:', result);
        
        showNotification('✅ Producto agregado al carrito', 'success');
        
        // Recargar carrito para mostrar cambios
        await loadCart();
        
    } catch (error) {
        console.error('❌ Error adding to cart:', error);
        showNotification('❌ Error: ' + error.message, 'error');
    }
}

// Update Cart UI
function updateCartUI() {
    console.log('🔄 Updating cart UI with:', cart);
    
    const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);
    
    console.log('📊 Cart count:', cartCount, 'Total:', cartTotal);
    
    // Update cart count badge
    if (elements.cartCount) {
        elements.cartCount.textContent = cartCount;
        elements.cartCount.style.display = cartCount > 0 ? 'inline-block' : 'none';
    }
    
    // Update cart total
    if (elements.cartTotal) {
        elements.cartTotal.textContent = cartTotal.toFixed(2);
    }
    
    // Update cart items
    if (elements.cartItems) {
        if (cart.length === 0) {
            elements.cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Tu carrito está vacío</p>
                </div>
            `;
        } else {
            elements.cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.name || 'Producto'}</h4>
                        <p>$${parseFloat(item.price || 0).toFixed(2)} c/u</p>
                    </div>
                    <div class="cart-item-actions">
                        <button class="quantity-btn" onclick="updateQuantity('${item.productId}', ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.productId}', ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="quantity-btn" onclick="removeFromCart('${item.productId}')" style="margin-left: 0.5rem; color: #dc3545;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Show/hide cart footer
    const cartFooter = document.getElementById('cartFooter');
    if (cartFooter) {
        cartFooter.style.display = cart.length > 0 ? 'block' : 'none';
    }
}

// Update quantity
async function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        await removeFromCart(productId);
        return;
    }
    
    try {
        const response = await fetch(`/api/cart/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'session-id': sessionId
            },
            body: JSON.stringify({
                quantity: newQuantity
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        await loadCart();
        
    } catch (error) {
        console.error('❌ Error updating quantity:', error);
        showNotification('❌ Error actualizando cantidad', 'error');
    }
}

// Remove from cart
async function removeFromCart(productId) {
    try {
        const response = await fetch(`/api/cart/${productId}`, {
            method: 'DELETE',
            headers: {
                'session-id': sessionId
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        showNotification('🗑️ Producto eliminado del carrito', 'info');
        await loadCart();
        
    } catch (error) {
        console.error('❌ Error removing from cart:', error);
        showNotification('❌ Error eliminando producto', 'error');
    }
}

// Cart controls
function toggleCart() {
    elements.cartSidebar?.classList.toggle('open');
    elements.overlay?.classList.toggle('active');
}

function closeCart() {
    elements.cartSidebar?.classList.remove('open');
    elements.overlay?.classList.remove('active');
}

// Admin controls
function toggleAdmin() {
    isAdminMode = !isAdminMode;
    
    if (isAdminMode) {
        elements.productsSection?.classList.remove('active');
        elements.adminSection?.classList.add('active');
        elements.adminBtn.innerHTML = '<i class="fas fa-store"></i> Tienda';
        
        // Cargar datos del admin
        loadStats();
        loadOrders();
        
    } else {
        elements.adminSection?.classList.remove('active');
        elements.productsSection?.classList.add('active');
        elements.adminBtn.innerHTML = '<i class="fas fa-cog"></i> Admin';
    }
}

// Add Product
async function addProduct(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('productName')?.value,
        description: document.getElementById('productDescription')?.value,
        price: parseFloat(document.getElementById('productPrice')?.value || 0),
        stock: parseInt(document.getElementById('productStock')?.value || 0),
        category: document.getElementById('productCategory')?.value
    };
    
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Product added:', result);
        
               
        showNotification('✅ Producto agregado exitosamente', 'success');
        
        // Reset form
        document.getElementById('addProductForm')?.reset();
        
        // Reload products
        await loadProducts();
        await loadStats();
        
    } catch (error) {
        console.error('❌ Error adding product:', error);
        showNotification('❌ Error: ' + error.message, 'error');
    }
}

// Load Stats
async function loadStats() {
    console.log('📊 Loading stats...');
    
    try {
        const response = await fetch('/api/stats');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Stats loaded:', data);
        
        renderStats(data);
        
    } catch (error) {
        console.error('❌ Error loading stats:', error);
        
        const statsContainer = document.getElementById('statsContainer');
        if (statsContainer) {
            statsContainer.innerHTML = '<div class="loading">❌ Error cargando estadísticas</div>';
        }
    }
}

// Render Stats - VERSIÓN CORREGIDA
function renderStats(data) {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;
    
    // CORREGIR: Acceder correctamente a los datos
    const stats = data.stats || data; // Manejar ambos formatos
    
    console.log('📊 Rendering stats with data:', stats);
    
    // Verificar que los datos existen
    if (!stats) {
        console.error('❌ No stats data found');
        return;
    }
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <h4>${stats.totalProducts || 0}</h4>
            <p><i class="fas fa-boxes"></i> Total Productos</p>
        </div>
        <div class="stat-card">
            <h4>${stats.totalOrders || 0}</h4>
            <p><i class="fas fa-shopping-bag"></i> Total Órdenes</p>
        </div>
        <div class="stat-card">
            <h4>$${parseFloat(stats.totalRevenue || 0).toFixed(2)}</h4>
            <p><i class="fas fa-dollar-sign"></i> Ingresos Totales</p>
        </div>
        <div class="stat-card">
            <h4>${stats.lowStockProducts || 0}</h4>
            <p><i class="fas fa-exclamation-triangle"></i> Stock Bajo</p>
        </div>
    `;
    
    console.log('✅ Stats rendered successfully');
}

// Load Orders
async function loadOrders() {
    console.log('📦 Loading orders...');
    
    try {
        const response = await fetch('/api/orders');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const orders = data.orders || [];
        
        console.log(`✅ Loaded ${orders.length} orders`);
        
        renderOrders(orders);
        
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        
        const ordersContainer = document.getElementById('ordersContainer');
        if (ordersContainer) {
            ordersContainer.innerHTML = '<div class="loading">❌ Error cargando órdenes</div>';
        }
    }
}

// Render Orders
function renderOrders(orders) {
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="loading">
                📦 No hay órdenes disponibles
            </div>
        `;
        return;
    }
    
    ordersContainer.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <h4>🛍️ Orden #${order.id}</h4>
                <span class="order-status status-${order.status?.toLowerCase() || 'pending'}">
                    ${getStatusIcon(order.status)} ${order.status || 'Pending'}
                </span>
            </div>
            <div class="order-details">
                <p><strong>📧 Cliente:</strong> ${order.customerEmail}</p>
                <p><strong>💰 Total:</strong> $${parseFloat(order.total || 0).toFixed(2)}</p>
                <p><strong>📦 Productos:</strong> ${order.itemCount} item(s)</p>
                <p><strong>📅 Fecha:</strong> ${formatDate(order.createdAt)}</p>
            </div>
            <div class="order-actions">
                <button onclick="viewOrderDetails('${order.id}')" class="btn-secondary">
                    👁️ Ver Detalles
                </button>
            </div>
        </div>
    `).join('');
}

// Helper functions
function getStatusIcon(status) {
    const icons = {
        pending: '⏳',
        processing: '⚡',
        completed: '✅',
        cancelled: '❌',
        shipped: '🚚'
    };
    return icons[status?.toLowerCase()] || '📋';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

// View order details
async function viewOrderDetails(orderId) {
    console.log('👁️ Loading order details for:', orderId);
    
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const order = data.order;
        
        console.log('✅ Order details loaded:', order);
        
        showOrderModal(order);
        
    } catch (error) {
        console.error('❌ Error loading order details:', error);
        showNotification('❌ Error cargando detalles de la orden', 'error');
    }
}

// Show order modal
function showOrderModal(order) {
    // Crear modal dinámico para mostrar detalles
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📋 Detalles de Orden #${order.id}</h3>
                <button class="close-btn" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div style="padding: 1.5rem;">
                <div class="order-info">
                    <h4>👤 Información del Cliente</h4>
                    <p><strong>Nombre:</strong> ${order.customerInfo?.name || 'N/A'}</p>
                    <p><strong>Email:</strong> ${order.customerInfo?.email || 'N/A'}</p>
                    <p><strong>Dirección:</strong> ${order.customerInfo?.address || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> ${order.customerInfo?.phone || 'N/A'}</p>
                </div>
                
                <div class="order-items" style="margin: 2rem 0;">
                    <h4>🛍️ Productos Ordenados</h4>
                    ${order.items?.map(item => `
                        <div class="order-item" style="padding: 1rem; border: 1px solid #eee; margin: 0.5rem 0; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${item.name}</strong><br>
                                    <small>$${item.price} x ${item.quantity}</small>
                                </div>
                                <div style="text-align: right;">
                                    <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
                                </div>
                            </div>
                        </div>
                    `).join('') || '<p>No hay items disponibles</p>'}
                </div>
                
                <div class="order-payment">
                    <h4>💳 Información de Pago</h4>
                    <p><strong>Método:</strong> ${order.payment?.method || 'N/A'}</p>
                    <p><strong>Transaction ID:</strong> ${order.payment?.transactionId || 'N/A'}</p>
                    <p><strong>Estado:</strong> ${order.status || 'Pending'}</p>
                    <div style="text-align: right; font-size: 1.2rem; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #333;">
                        <strong>Total: $${parseFloat(order.total || 0).toFixed(2)}</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar con overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Checkout
function openCheckout() {
    const modal = document.getElementById('checkoutModal');
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    if (!modal || cart.length === 0) return;
    
    // Populate checkout summary
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (checkoutItems) {
        checkoutItems.innerHTML = cart.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>${item.name} x${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');
    }
    
    if (checkoutTotal) {
        checkoutTotal.textContent = total.toFixed(2);
    }
    
    modal.classList.add('active');
    elements.overlay?.classList.add('active');
    closeCart();
}

function closeCheckout() {
    document.getElementById('checkoutModal')?.classList.remove('active');
    elements.overlay?.classList.remove('active');
}

// Handle Checkout
async function handleCheckout(e) {
    e.preventDefault();
    
    // Capturar datos con validación
    const customerName = document.getElementById('customerName')?.value?.trim();
    const customerEmail = document.getElementById('customerEmail')?.value?.trim();
    const customerAddress = document.getElementById('customerAddress')?.value?.trim();
    const customerPhone = document.getElementById('customerPhone')?.value?.trim();
    const paymentMethod = document.getElementById('paymentMethod')?.value;
    
    // FORMATO CORRECTO para el checkoutController
    const customerInfo = {
        name: customerName,
        email: customerEmail,
        address: customerAddress,
        phone: customerPhone
    };
    
    // Debug: mostrar datos capturados
    console.log('📋 Form data captured:', {
        customerName,
        customerEmail,
        customerAddress,
        customerPhone,
        paymentMethod
    });
    
    console.log('🛒 Customer info object:', customerInfo);
    console.log('🛒 Cart data:', cart);
    
    // Validar campos requeridos
    if (!customerName || !customerEmail) {
        showNotification('❌ Nombre y email son requeridos', 'error');
        return;
    }
    
    if (cart.length === 0) {
        showNotification('❌ El carrito está vacío', 'error');
        return;
    }
    
    try {
        // FORMATO EXACTO que espera el checkoutController
        const checkoutPayload = {
            customerInfo: customerInfo,
            paymentMethod: paymentMethod,
            sessionId: sessionId
        };
        
        console.log('📦 Sending checkout payload:', JSON.stringify(checkoutPayload, null, 2));
        
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'session-id': sessionId
            },
            body: JSON.stringify(checkoutPayload)
        });
        
        console.log('📦 Checkout response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Checkout error data:', errorData);
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Checkout completed:', result);
        
        // Show success modal
        showSuccessModal(result);
        
        // Clear cart
        cart = [];
        updateCartUI();
        
        // Reload products (stock might have changed)
        await loadProducts();
        
        // Reload orders in admin if we're in admin mode
        if (isAdminMode) {
            await loadOrders();
            await loadStats();
        }
        
        closeCheckout();
        
    } catch (error) {
        console.error('❌ Checkout error:', error);
        showNotification('❌ Error en checkout: ' + error.message, 'error');
    }
}

// Show Success Modal
function showSuccessModal(orderData) {
    const modal = document.getElementById('successModal');
    const orderDetails = document.getElementById('orderDetails');
    
    if (!modal) return;
    
    if (orderDetails) {
        orderDetails.innerHTML = `
            <div style="text-align: left; margin: 2rem 0;">
                <p><strong>Orden ID:</strong> ${orderData.order?.id || 'N/A'}</p>
                <p><strong>Total:</strong> $${parseFloat(orderData.order?.total || 0).toFixed(2)}</p>
                <p><strong>Estado:</strong> ${orderData.order?.status || 'Procesando'}</p>
                <p><strong>Transaction ID:</strong> ${orderData.order?.transactionId || 'N/A'}</p>
                <p><strong>Email:</strong> ${orderData.order?.customerEmail || 'N/A'}</p>
            </div>
        `;
    }
    
    modal.classList.add('active');
    elements.overlay?.classList.add('active');
}

function closeSuccess() {
    document.getElementById('successModal')?.classList.remove('active');
    elements.overlay?.classList.remove('active');
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    elements.cartSidebar?.classList.remove('open');
    elements.overlay?.classList.remove('active');
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    elements.notifications?.appendChild(notification);
    
    // Show animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle',
        warning: 'exclamation-triangle'
    };
    return icons[type] || 'info-circle';
}

console.log('🎯 Ecommerce Store JavaScript loaded successfully');