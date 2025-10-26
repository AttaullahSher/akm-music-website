// Simple Shopping Cart with WhatsApp Integration (No Google Sheets)
class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('akm_cart')) || [];
        this.whatsappNumber = '97126219929'; // Updated number
        this.customer = this.loadCustomerProfile();
        this.init();
    }

    loadCustomerProfile() {
        try { return JSON.parse(localStorage.getItem('akm_customer')) || { name: '', area: '' }; }
        catch { return { name: '', area: '' }; }
    }

    saveCustomerProfile(name, area) {
        this.customer = { name: name?.trim() || '', area: area?.trim() || '' };
        localStorage.setItem('akm_customer', JSON.stringify(this.customer));
        // Update header badge if helper exists
        if (typeof window.updateCustomerBadge === 'function') {
            window.updateCustomerBadge(this.customer);
        }
        this.showNotification('Profile saved', 'success');
    }

    init() {
        this.updateCartUI();
        this.setupEventListeners();
        this.createCartModal();
    }

    // Add item to cart
    addItem(product) {
        const existingItem = this.items.find(item => item.sku === product.sku);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                ...product,
                quantity: 1,
                addedAt: new Date().toISOString()
            });
        }
        
        this.saveCart();
        this.updateCartUI();
        this.showNotification(`${product.name} added to cart!`, 'success');
        
        // Analytics
        this.trackEvent('add_to_cart', {
            product_name: product.name,
            product_sku: product.sku,
            price: product.price
        });
    }

    // Remove item from cart
    removeItem(sku) {
        this.items = this.items.filter(item => item.sku !== sku);
        this.saveCart();
        this.updateCartUI();
        this.showNotification('Item removed from cart', 'info');
    }

    // Update item quantity
    updateQuantity(sku, quantity) {
        const item = this.items.find(item => item.sku === sku);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(sku);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartUI();
            }
        }
    }

    // Get cart total
    getTotal() {
        return this.items.reduce((total, item) => {
            const price = parseFloat(item.price) || 0;
            return total + (price * item.quantity);
        }, 0);
    }
    
    // Get VAT (5% in UAE)
    getVAT() {
        return this.getTotal() * 0.05;
    }
    
    // Get grand total with VAT
    getGrandTotal() {
        return this.getTotal() + this.getVAT();
    }

    // Get cart item count
    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    // Save cart to localStorage
    saveCart() {
        localStorage.setItem('akm_cart', JSON.stringify(this.items));
    }

    // Update cart UI
    updateCartUI() {
        const cartCount = document.getElementById('cartCount');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (cartCount) {
            const count = this.getItemCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
        
        if (cartItems) {
            cartItems.innerHTML = this.items.map(item => `
                <div class="cart-item" data-sku="${item.sku}">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}" loading="lazy">
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p class="cart-item-brand">${item.brand}</p>
                        <p class="cart-item-price">${item.price} AED</p>
                    </div>
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button onclick="cart.updateQuantity('${item.sku}', ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="cart.updateQuantity('${item.sku}', ${item.quantity + 1})">+</button>
                        </div>
                        <button class="remove-btn" onclick="cart.removeItem('${item.sku}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        if (cartTotal) {
            const subtotal = this.getTotal();
            const vat = this.getVAT();
            const grandTotal = this.getGrandTotal();
            
            cartTotal.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)} AED</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #666; font-size: 0.9rem;">
                    <span>VAT (5%):</span>
                    <span>${vat.toFixed(2)} AED</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 700; border-top: 2px solid #eee; padding-top: 0.5rem;">
                    <span>Total:</span>
                    <span>${grandTotal.toFixed(2)} AED</span>
                </div>
            `;
        }
    }

    // Create cart modal
    createCartModal() {
        if (document.getElementById('cartModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'cartModal';
        modal.className = 'cart-modal';
        modal.innerHTML = `
            <div class="cart-modal-content glass-container">
                <div class="cart-header">
                    <h3><i class="fas fa-shopping-cart"></i> Shopping Cart</h3>
                    <button class="cart-close" onclick="cart.toggleCart()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="cart-profile">
                    <div class="profile-fields">
                        <input id="customerName" type="text" placeholder="Your Name" value="${this.customer.name || ''}" />
                        <input id="customerArea" type="text" placeholder="Your Area/Location" value="${this.customer.area || ''}" />
                        <button class="btn-3d btn-secondary-3d" onclick="cart.saveCustomerProfile(document.getElementById('customerName').value, document.getElementById('customerArea').value)"><i class="fas fa-save"></i> Save</button>
                    </div>
                </div>
                <div class="cart-body">
                    <div id="cartItems"></div>
                    <div class="cart-empty" style="display: none;">
                        <i class="fas fa-shopping-cart"></i>
                        <p>Your cart is empty</p>
                        <a href="products.html" class="btn-3d btn-primary-3d">Browse Products</a>
                    </div>
                </div>
                <div class="cart-footer">
                    <div class="cart-total-section">
                        <div class="total-row">
                            <span>Total: <strong id="cartTotal">0.00 AED</strong></span>
                        </div>
                    </div>
                    <div class="cart-actions">
                        <button class="btn-3d btn-secondary-3d" onclick="cart.clearCart()">
                            <i class="fas fa-trash"></i> Clear Cart
                        </button>
                        <button class="btn-3d btn-primary-3d" onclick="cart.orderViaWhatsApp()">
                            <i class="fab fa-whatsapp"></i> Order via WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Toggle cart modal
    toggleCart() {
        const modal = document.getElementById('cartModal');
        const isEmpty = this.items.length === 0;
        
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
        
        // Show/hide empty state
        const cartItems = document.getElementById('cartItems');
        const cartEmpty = document.querySelector('.cart-empty');
        const cartFooter = document.querySelector('.cart-footer');
        
        if (isEmpty) {
            cartItems.style.display = 'none';
            cartEmpty.style.display = 'block';
            cartFooter.style.display = 'none';
        } else {
            cartItems.style.display = 'block';
            cartEmpty.style.display = 'none';
            cartFooter.style.display = 'block';
        }
    }

    // Clear cart
    clearCart() {
        if (confirm('Are you sure you want to clear your cart?')) {
            this.items = [];
            this.saveCart();
            this.updateCartUI();
            this.showNotification('Cart cleared', 'info');
        }
    }

    // Order via WhatsApp
    orderViaWhatsApp() {
        if (this.items.length === 0) {
            this.showNotification('Your cart is empty!', 'warning');
            return;
        }

        const orderDetails = this.generateOrderMessage();
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${this.whatsappNumber}&text=${encodeURIComponent(orderDetails)}`;
        
        // Track conversion
        this.trackEvent('initiate_checkout', {
            total_items: this.getItemCount(),
            total_value: this.getTotal(),
            currency: 'AED'
        });
        
        window.open(whatsappUrl, '_blank');
    }

    // Generate WhatsApp order message
    generateOrderMessage() {
        const header = "🎵 *AKM Music - New Order Request* 🎵\n\n";
        
        const customerInfo = "👤 *Customer Details:*\n" +
            `Name: ${this.customer.name || '[Please provide your name]'}\n` +
            `Area: ${this.customer.area || '[Your area/location]'}\n` +
            "Phone: [Your phone number]\n" +
            "Email: [Your email address]\n" +
            "Address: [Delivery address if needed]\n\n";
        
        const orderItems = "🛒 *Order Items:*\n" +
            this.items.map((item, index) => 
                `${index + 1}. *${item.name}*\n` +
                `   Brand: ${item.brand || 'AKM Music'}\n` +
                `   SKU: ${item.sku}\n` +
                `   Price: ${item.price} AED\n` +
                `   Quantity: ${item.quantity}\n` +
                `   Subtotal: ${(parseFloat(item.price) * item.quantity).toFixed(2)} AED\n`
            ).join('\n');
        
        const subtotal = this.getTotal();
        const vat = this.getVAT();
        const grand = this.getGrandTotal();
        
        const summary = `\n💰 *Order Summary:*\n` +
            `Subtotal: ${subtotal.toFixed(2)} AED\n` +
            `VAT (5%): ${vat.toFixed(2)} AED\n` +
            `Total: *${grand.toFixed(2)} AED*\n\n`;
        
        const footer = "📞 *Next Steps:*\n" +
            "1. Please confirm your details above\n" +
            "2. Our team will contact you shortly\n" +
            "3. Choose payment method (Cash, Card, Tabby, etc.)\n\n" +
            "🕒 Business Hours: 9:00 AM - 9:00 PM\n" +
            "📍 Location: Abu Dhabi - Behind Millennium Hotel\n\n" +
            "Thank you for choosing AKM Music! 🎶";
        
        return header + customerInfo + orderItems + summary + footer;
    }

    // Setup event listeners
    setupEventListeners() {
        // Close cart when clicking outside
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('cartModal');
            if (e.target === modal) {
                this.toggleCart();
            }
        });

        // ESC key to close cart
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('cartModal');
                if (modal && modal.style.display === 'flex') {
                    this.toggleCart();
                }
            }
        });
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.cart-notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `cart-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    // Track events (integrate with your analytics)
    trackEvent(eventName, properties = {}) {
        // Google Analytics 4 / GA4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }
        
        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', eventName, properties);
        }
        
        // Console log for development
        console.log('Cart Event:', eventName, properties);
    }
}

// Product class for easy cart integration
class Product {
    constructor(data) {
        this.sku = data.sku;
        this.name = data.name;
        this.brand = data.brand;
        this.category = data.category;
        this.price = data.price;
        this.image = data.image;
        this.description = data.description;
        this.inStock = data.inStock !== false;
    }

    addToCart() {
        if (!this.inStock) {
            cart.showNotification('Sorry, this item is out of stock', 'warning');
            return;
        }
        
        cart.addItem(this);
    }
}

// Initialize cart when DOM is loaded
let cart;
document.addEventListener('DOMContentLoaded', function() {
    cart = new ShoppingCart();
    
    // Global function for cart toggle
    window.toggleCart = () => cart.toggleCart();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ShoppingCart, Product };
}
