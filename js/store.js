// TEE MATRIX - Database & State Store with LocalStorage Persistence

const INITIAL_PRODUCTS = [
  {
    id: "tm-001",
    name: "Matrix Acid Wash Heavyweight Tee",
    category: "Acid Wash",
    price: 1999.00,
    fit: "Boxy Oversized Fit",
    fabric: "100% Combed Heavy Cotton",
    description: "Architectural silhouette engineered from vintage acid-washed cotton. Drop-shoulder construction with subtle back graphic detailing.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Charcoal", "Jet Black"],
    imagePrimary: "assets/tee_acid_wash.jpg",
    imageHover: "assets/tee_acid_wash_hover.jpg",
    images: [
      "assets/tee_acid_wash.jpg",
      "assets/tee_acid_wash_hover.jpg",
      "assets/hero_banner.jpg",
      "assets/story_campaign.jpg"
    ],
    inStock: true,
    stockQty: 45,
    badge: "BESTSELLER",
    isFeatured: true,
    isNewArrival: true
  },
  {
    id: "tm-002",
    name: "Neo Cybernetic Graphic Tee",
    category: "Graphic",
    price: 1899.00,
    fit: "Relaxed Boxy Cut",
    fabric: "100% Organic Bio-Washed Cotton",
    description: "Minimalist dystopian typography printed on heavy off-white combed cotton. Double-stitched raw hem with ribbed collar.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Off-White", "Bone White"],
    imagePrimary: "assets/tee_cyberpunk.jpg",
    imageHover: "assets/tee_model_white.jpg",
    images: [
      "assets/tee_cyberpunk.jpg",
      "assets/tee_model_white.jpg",
      "assets/story_campaign.jpg",
      "assets/tee_black_heavy.jpg"
    ],
    inStock: true,
    stockQty: 30,
    badge: "NEW",
    isFeatured: true,
    isNewArrival: true
  },
  {
    id: "tm-003",
    name: "Essential Heavyweight Monochrome Tee",
    category: "Heavyweight Minimal",
    price: 1699.00,
    fit: "Oversized Fit",
    fabric: "100% Premium Heavy Cotton",
    description: "Pure jet-black minimal essential. Premium heavy drape that retains shape after every wash. Clean neck tape and reinforced side seams.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Jet Black"],
    imagePrimary: "assets/tee_black_heavy.jpg",
    imageHover: "assets/hero_banner.jpg",
    images: [
      "assets/tee_black_heavy.jpg",
      "assets/hero_banner.jpg",
      "assets/story_campaign.jpg",
      "assets/tee_acid_wash_hover.jpg"
    ],
    inStock: true,
    stockQty: 60,
    badge: "LIMITED",
    isFeatured: true,
    isNewArrival: true
  },
  {
    id: "tm-004",
    name: "Brutalist Off-White Courtyard Tee",
    category: "Vintage",
    price: 1799.00,
    fit: "Drop Shoulder Fit",
    fabric: "100% Vintage Washed Cotton",
    description: "Architectural off-white oversized silhouette inspired by brutalist urban design. Ultra-soft touch with structured collar.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Off-White", "Cream"],
    imagePrimary: "assets/tee_model_white.jpg",
    imageHover: "assets/tee_cyberpunk.jpg",
    images: [
      "assets/tee_model_white.jpg",
      "assets/tee_cyberpunk.jpg",
      "assets/hero_banner.jpg",
      "assets/tee_acid_wash.jpg"
    ],
    inStock: true,
    stockQty: 25,
    badge: "NEW",
    isFeatured: false,
    isNewArrival: true
  },
  {
    id: "tm-005",
    name: "Distortion Rebellion Acid Tee",
    category: "Acid Wash",
    price: 2299.00,
    fit: "Boxy Oversized",
    fabric: "100% Heavyweight Cotton",
    description: "Custom acid garment wash with distortion series screen print. Each piece has a unique vintage pattern.",
    sizes: ["M", "L", "XL"],
    colors: ["Charcoal Acid"],
    imagePrimary: "assets/tee_acid_wash_hover.jpg",
    imageHover: "assets/tee_acid_wash.jpg",
    images: [
      "assets/tee_acid_wash_hover.jpg",
      "assets/tee_acid_wash.jpg",
      "assets/hero_banner.jpg",
      "assets/story_campaign.jpg"
    ],
    inStock: true,
    stockQty: 18,
    badge: "EXCLUSIVE",
    isFeatured: true,
    isNewArrival: false
  },
  {
    id: "tm-006",
    name: "Midnight Monochrome Atelier Tee",
    category: "Heavyweight Minimal",
    price: 1799.00,
    fit: "Relaxed Boxy",
    fabric: "100% Heavy Cotton",
    description: "Deep midnight black silhouette with clean minimalist aesthetics. Tailored for online fashion collectors.",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Midnight Black"],
    imagePrimary: "assets/story_campaign.jpg",
    imageHover: "assets/hero_banner.jpg",
    images: [
      "assets/story_campaign.jpg",
      "assets/hero_banner.jpg",
      "assets/tee_black_heavy.jpg",
      "assets/tee_model_white.jpg"
    ],
    inStock: true,
    stockQty: 40,
    badge: "LIMITED",
    isFeatured: false,
    isNewArrival: false
  }
];

class StoreService {
  constructor() {
    this.listeners = [];
    this.init();
  }

  init() {
    const stored = localStorage.getItem('tm_products');
    if (!stored || JSON.parse(stored)[0]?.price < 100 || JSON.parse(stored)[0]?.gsm !== undefined) {
      localStorage.setItem('tm_products', JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem('tm_cart')) {
      localStorage.setItem('tm_cart', JSON.stringify([]));
    }
    const existingOrders = localStorage.getItem('tm_orders');
    if (!existingOrders || (JSON.parse(existingOrders)[0]?.id === 'TM-8092')) {
      localStorage.setItem('tm_orders', JSON.stringify([]));
    }
    const existingCustomers = localStorage.getItem('tm_customers');
    if (!existingCustomers || (JSON.parse(existingCustomers)[0]?.email === 'jordan@example.com')) {
      localStorage.setItem('tm_customers', JSON.stringify([]));
    }
  }

  // Event Subscription
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb());
  }

  // Products CRUD
  getProducts() {
    try {
      return JSON.parse(localStorage.getItem('tm_products')) || INITIAL_PRODUCTS;
    } catch (e) {
      return INITIAL_PRODUCTS;
    }
  }

  getProductById(id) {
    return this.getProducts().find(p => p.id === id);
  }

  getNewArrivals() {
    const products = this.getProducts();
    const newArrivals = products.filter(p => p.isNewArrival);
    return newArrivals.length > 0 ? newArrivals : products.slice(0, 4);
  }

  addProduct(productData) {
    const products = this.getProducts();
    const imgs = productData.images && productData.images.length > 0 
      ? productData.images 
      : [productData.imagePrimary, productData.imageHover].filter(Boolean);

    const newProduct = {
      id: `tm-${Date.now().toString().slice(-4)}`,
      ...productData,
      price: parseFloat(productData.price) || 0,
      stockQty: parseInt(productData.stockQty) || 10,
      inStock: productData.inStock !== undefined ? productData.inStock : true,
      isNewArrival: productData.isNewArrival !== undefined ? productData.isNewArrival : true,
      images: imgs,
      badge: productData.badge || "NEW"
    };
    delete newProduct.gsm;
    products.unshift(newProduct);
    localStorage.setItem('tm_products', JSON.stringify(products));
    this.notify();
    return newProduct;
  }

  updateProduct(id, updatedData) {
    let products = this.getProducts();
    products = products.map(p => {
      if (p.id === id) {
        const imgs = updatedData.images && updatedData.images.length > 0 
          ? updatedData.images 
          : [updatedData.imagePrimary, updatedData.imageHover].filter(Boolean);

        const updated = {
          ...p,
          ...updatedData,
          price: parseFloat(updatedData.price) || p.price,
          stockQty: parseInt(updatedData.stockQty) !== undefined ? parseInt(updatedData.stockQty) : p.stockQty,
          isNewArrival: updatedData.isNewArrival !== undefined ? updatedData.isNewArrival : p.isNewArrival,
          images: imgs.length > 0 ? imgs : (p.images || [p.imagePrimary])
        };
        delete updated.gsm;
        return updated;
      }
      return p;
    });
    localStorage.setItem('tm_products', JSON.stringify(products));
    this.notify();
  }

  toggleNewArrival(id) {
    const products = this.getProducts().map(p => {
      if (p.id === id) {
        const nextState = !p.isNewArrival;
        this.showToast(nextState ? `Added "${p.name}" to New Arrivals` : `Removed "${p.name}" from New Arrivals`);
        return { ...p, isNewArrival: nextState };
      }
      return p;
    });
    localStorage.setItem('tm_products', JSON.stringify(products));
    this.notify();
  }

  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    localStorage.setItem('tm_products', JSON.stringify(products));
    this.notify();
  }

  toggleStock(id) {
    const products = this.getProducts().map(p => {
      if (p.id === id) {
        return { ...p, inStock: !p.inStock };
      }
      return p;
    });
    localStorage.setItem('tm_products', JSON.stringify(products));
    this.notify();
  }

  // Cart Management
  getCart() {
    try {
      return JSON.parse(localStorage.getItem('tm_cart')) || [];
    } catch (e) {
      return [];
    }
  }

  addToCart(productId, size = "M", qty = 1) {
    const product = this.getProductById(productId);
    if (!product) return;

    let cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.id === productId && item.size === size);

    if (existingIndex > -1) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        gsm: product.gsm,
        image: product.imagePrimary,
        size: size,
        qty: qty
      });
    }

    localStorage.setItem('tm_cart', JSON.stringify(cart));
    this.notify();
    this.showToast(`Added "${product.name}" (${size}) to Cart`);
  }

  updateCartQty(productId, size, change) {
    let cart = this.getCart();
    cart = cart.map(item => {
      if (item.id === productId && item.size === size) {
        const newQty = item.qty + change;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean);

    localStorage.setItem('tm_cart', JSON.stringify(cart));
    this.notify();
  }

  removeFromCart(productId, size) {
    const cart = this.getCart().filter(item => !(item.id === productId && item.size === size));
    localStorage.setItem('tm_cart', JSON.stringify(cart));
    this.notify();
  }

  clearCart() {
    localStorage.setItem('tm_cart', JSON.stringify([]));
    this.notify();
  }

  getCartTotal() {
    const cart = this.getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipping = subtotal > 2499 || cart.length === 0 ? 0 : 99;
    return {
      subtotal,
      shipping,
      total: subtotal + shipping,
      itemCount: cart.reduce((sum, item) => sum + item.qty, 0)
    };
  }

  // Orders
  getOrders() {
    try {
      return JSON.parse(localStorage.getItem('tm_orders')) || [];
    } catch (e) {
      return [];
    }
  }

  createOrder(shippingInfo) {
    const cart = this.getCart();
    if (cart.length === 0) return null;

    const totals = this.getCartTotal();
    const newOrder = {
      id: `TM-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      customerName: shippingInfo.name,
      email: shippingInfo.email,
      phone: shippingInfo.phone,
      address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.zip}`,
      items: [...cart],
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total,
      status: "Processing (Online Dispatch)"
    };

    const orders = this.getOrders();
    orders.unshift(newOrder);
    localStorage.setItem('tm_orders', JSON.stringify(orders));
    this.clearCart();
    return newOrder;
  }

  // Admin Accounts & Security Database
  getAdminAccounts() {
    try {
      return JSON.parse(localStorage.getItem('tm_admin_accounts')) || [
        { username: "admin", name: "Master Administrator", password: "admin123", role: "Super Admin", createdDate: "2026-08-10" }
      ];
    } catch (e) {
      return [{ username: "admin", name: "Master Administrator", password: "admin123", role: "Super Admin", createdDate: "2026-08-10" }];
    }
  }

  verifyAdminLogin(username, password) {
    const admins = this.getAdminAccounts();
    const match = admins.find(a => a.username.toLowerCase() === username.trim().toLowerCase() && a.password === password);
    if (match) {
      localStorage.setItem('tm_logged_admin', match.username.toLowerCase());
      return { success: true, admin: match };
    }
    return { success: false, message: "Invalid admin username or password" };
  }

  isMasterAdmin() {
    const loggedUser = localStorage.getItem('tm_logged_admin');
    return loggedUser === 'admin';
  }

  addAdminAccount(username, name, password) {
    if (!this.isMasterAdmin()) {
      return { success: false, message: "Only the Master Administrator (@admin) can create new admin accounts" };
    }

    const admins = this.getAdminAccounts();
    const existing = admins.find(a => a.username.toLowerCase() === username.trim().toLowerCase());
    
    if (existing) {
      return { success: false, message: "An admin account with this username already exists" };
    }

    const newAdmin = {
      username: username.trim(),
      name: name.trim() || username.trim(),
      password: password,
      role: "Administrator",
      createdDate: new Date().toISOString().split('T')[0]
    };

    admins.push(newAdmin);
    localStorage.setItem('tm_admin_accounts', JSON.stringify(admins));
    this.notify();
    this.showToast(`Admin account "${newAdmin.username}" created successfully`);
    return { success: true, admin: newAdmin };
  }

  deleteAdminAccount(username) {
    if (!this.isMasterAdmin()) {
      return { success: false, message: "Only the Master Administrator (@admin) can revoke admin access" };
    }
    if (username.toLowerCase() === 'admin') {
      return { success: false, message: "Master super admin account cannot be deleted" };
    }
    const admins = this.getAdminAccounts().filter(a => a.username.toLowerCase() !== username.toLowerCase());
    localStorage.setItem('tm_admin_accounts', JSON.stringify(admins));
    this.notify();
    this.showToast(`Admin account "${username}" removed`);
    return { success: true };
  }

  // Customer Authentication & Accounts
  getCustomers() {
    try {
      return JSON.parse(localStorage.getItem('tm_customers')) || [];
    } catch (e) {
      return [];
    }
  }

  getCurrentCustomer() {
    try {
      return JSON.parse(localStorage.getItem('tm_customer_session')) || null;
    } catch (e) {
      return null;
    }
  }

  isCustomerLoggedIn() {
    return !!this.getCurrentCustomer();
  }

  loginCustomerWithPhone(phone) {
    const formattedPhone = phone.startsWith('+') ? phone : `+91 ${phone}`;
    let customers = this.getCustomers();
    let customer = customers.find(c => c.phone === formattedPhone || c.phone === phone);

    if (!customer) {
      customer = {
        name: `Member (${formattedPhone.slice(-4)})`,
        phone: formattedPhone,
        email: ''
      };
      customers.push(customer);
      localStorage.setItem('tm_customers', JSON.stringify(customers));
    }

    const session = { name: customer.name, phone: customer.phone, email: customer.email || '' };
    localStorage.setItem('tm_customer_session', JSON.stringify(session));
    this.notify();
    this.showToast(`Logged in successfully as ${session.name}`);
    return { success: true, customer: session };
  }

  updateCustomerProfile(updatedData) {
    let session = this.getCurrentCustomer();
    if (!session) return { success: false, message: "Not logged in" };

    session.name = updatedData.name || session.name;
    session.phone = updatedData.phone || session.phone;
    session.email = updatedData.email !== undefined ? updatedData.email : session.email;

    localStorage.setItem('tm_customer_session', JSON.stringify(session));
    this.notify();
    this.showToast("Profile updated successfully");
    return { success: true, customer: session };
  }

  logoutCustomer() {
    localStorage.removeItem('tm_customer_session');
    this.clearCart();
    this.notify();
    this.showToast("Logged out successfully");
  }

  // Toast floating notification
  showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

export const store = new StoreService();
