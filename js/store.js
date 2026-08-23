// TEE MATRIX - Database & State Store with LocalStorage Persistence
import { supabaseService } from './supabase.js';

const INITIAL_PRODUCTS = [
  {
    id: "tm-001",
    name: "Matrix Acid Wash Heavyweight Tee",
    category: "Acid Wash",
    price: 1999.00,
    fit: "Boxy Oversized Fit",
    fabric: "100% Combed Heavy Cotton",
    description: "Architectural silhouette engineered from vintage acid-washed cotton. Drop-shoulder construction with subtle back graphic detailing.",
    highlights: [
      "100% Combed Heavy Cotton",
      "Boxy Oversized Streetwear Fit",
      "Vintage Acid Garment Wash",
      "Drop-Shoulder Construction",
      "Double-Stitched Reinforced Hem",
      "Machine Washable"
    ],
    sizes: ["S", "M", "L", "XL"],
    sizeStock: { "S": 10, "M": 15, "L": 12, "XL": 8 },
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
    highlights: [
      "100% Organic Bio-Washed Cotton",
      "Relaxed Boxy Cut",
      "High-Density Screenprint Detailing",
      "Ribbed Crew Neckline",
      "Soft & Breathable Texture",
      "Machine Washable"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    sizeStock: { "XS": 5, "S": 8, "M": 10, "L": 7, "XL": 0 },
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
    highlights: [
      "100% Premium Heavy Cotton",
      "Architectural Oversized Fit",
      "Deep Jet Black Fade-Resistant Dye",
      "Reinforced Neck Taping",
      "Retains Shape After Wash",
      "Machine Washable"
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    sizeStock: { "S": 12, "M": 18, "L": 20, "XL": 10, "XXL": 0 },
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
    highlights: [
      "100% Vintage Washed Cotton",
      "Drop Shoulder Silhouette",
      "Brutalist Atelier Aesthetic",
      "Ultra-Soft Handfeel",
      "Comfort Round Collar",
      "Machine Washable"
    ],
    sizes: ["S", "M", "L", "XL"],
    sizeStock: { "S": 6, "M": 9, "L": 10, "XL": 0 },
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
    highlights: [
      "100% Heavyweight Cotton",
      "Custom Hand Acid Garment Wash",
      "Unique Vintage Distress Pattern",
      "Boxy Streetwear Fit",
      "Half Sleeve Construction",
      "Machine Washable"
    ],
    sizes: ["M", "L", "XL"],
    sizeStock: { "M": 6, "L": 8, "XL": 4 },
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
    highlights: [
      "100% Heavy Cotton",
      "Relaxed Boxy Atelier Cut",
      "Anti-Fading Midnight Black Dye",
      "Ribbed Round Neck",
      "Breathable All-Day Comfort",
      "Machine Washable"
    ],
    sizes: ["S", "M", "L", "XL"],
    sizeStock: { "S": 10, "M": 12, "L": 10, "XL": 8 },
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
    try {
      const stored = localStorage.getItem('tm_products');
      if (!stored) {
        localStorage.setItem('tm_products', JSON.stringify(INITIAL_PRODUCTS));
      } else {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          localStorage.setItem('tm_products', JSON.stringify(INITIAL_PRODUCTS));
        }
      }
    } catch (e) {
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

    // Auto-sync remote catalog from Supabase
    this.syncFromSupabase();
  }

  async syncFromSupabase() {
    try {
      const remoteProducts = await supabaseService.fetchProducts();
      if (remoteProducts && Array.isArray(remoteProducts) && remoteProducts.length > 0) {
        const deletedIds = JSON.parse(localStorage.getItem('tm_deleted_products') || '[]');
        const local = this.getProducts();
        const merged = [...remoteProducts.filter(rp => !deletedIds.includes(rp.id))];
        local.forEach(lp => {
          if (!merged.some(rp => rp.id === lp.id)) {
            merged.push(lp);
          }
        });
        localStorage.setItem('tm_products', JSON.stringify(merged));
        this.notify();
      }
    } catch (err) {
      console.warn('Sync from Supabase notice:', err);
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
      const stored = localStorage.getItem('tm_products');
      const deletedIds = JSON.parse(localStorage.getItem('tm_deleted_products') || '[]');
      
      let rawList = [];
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) rawList = parsed;
        } catch (_) {
          rawList = [];
        }
      }

      // Merge base INITIAL_PRODUCTS with any uploaded/custom products (unless explicitly deleted)
      const nonDeletedInitials = INITIAL_PRODUCTS.filter(ip => !deletedIds.includes(ip.id));
      const combined = [...rawList.filter(p => !deletedIds.includes(p.id))];
      nonDeletedInitials.forEach(ip => {
        if (!combined.some(p => p.id === ip.id)) {
          combined.push(ip);
        }
      });

      return combined.map(p => {
        let sizes = ['S', 'M', 'L', 'XL'];
        if (Array.isArray(p.sizes)) {
          sizes = p.sizes;
        } else if (typeof p.sizes === 'string') {
          try { sizes = JSON.parse(p.sizes); } catch (_) { sizes = p.sizes.split(',').map(s => s.trim()).filter(Boolean); }
        }

        // Per-Size Inventory Normalization
        let sizeStock = {};
        if (p.sizeStock && typeof p.sizeStock === 'object') {
          sizeStock = { ...p.sizeStock };
        } else if (typeof p.sizeStock === 'string') {
          try { sizeStock = JSON.parse(p.sizeStock); } catch (_) { sizeStock = {}; }
        }

        const sizesList = Array.isArray(sizes) && sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'];
        sizesList.forEach(sz => {
          if (sizeStock[sz] === undefined) {
            sizeStock[sz] = p.stockQty !== undefined ? Math.max(0, Math.floor(Number(p.stockQty) / sizesList.length)) : 5;
          } else {
            sizeStock[sz] = Math.max(0, Number(sizeStock[sz]) || 0);
          }
        });

        const totalStock = Object.values(sizeStock).reduce((sum, q) => sum + (Number(q) || 0), 0);
        const inStock = totalStock > 0;

        let images = [p.imagePrimary, p.imageHover].filter(Boolean);
        if (Array.isArray(p.images) && p.images.length > 0) {
          images = p.images;
        } else if (typeof p.images === 'string') {
          try { images = JSON.parse(p.images); } catch (_) { images = p.images.split(',').map(s => s.trim()).filter(Boolean); }
        }

        let highlights = [];
        if (Array.isArray(p.highlights) && p.highlights.length > 0) {
          highlights = p.highlights;
        } else if (typeof p.highlights === 'string') {
          try { 
            highlights = JSON.parse(p.highlights); 
          } catch (_) { 
            highlights = p.highlights.split('\n').map(s => s.trim().replace(/^[-*•]\s*/, '')).filter(Boolean); 
          }
        }
        if (!Array.isArray(highlights) || highlights.length === 0) {
          highlights = [
            p.fabric || "100% Premium Cotton",
            p.fit || "Regular Fit",
            "Soft & Breathable",
            "Round Neck",
            "Half Sleeve",
            "Machine Washable"
          ];
        }

        return {
          ...p,
          price: Number(p.price) || 0,
          stockQty: totalStock,
          sizeStock: sizeStock,
          inStock: inStock,
          sizes: sizesList,
          images: Array.isArray(images) && images.length > 0 ? images : [p.imagePrimary || 'assets/tee_black_heavy.jpg'],
          description: p.description || "A comfortable everyday T-shirt made from soft, breathable cotton. Designed with a clean regular fit and classic round neck.",
          highlights: highlights,
          modelImageType: p.modelImageType || 'product_only',
          color: p.color || '',
          pattern: p.pattern || '',
          fit: p.fit || 'Boxy Oversized Fit',
          neckType: p.neckType || 'Round Neck',
          sleeveType: p.sleeveType || 'Short Sleeves'
        };
      });
    } catch (e) {
      return INITIAL_PRODUCTS;
    }
  }

  getProductById(id) {
    return this.getProducts().find(p => p.id === id);
  }

  getSizeStock(productId, size) {
    const product = this.getProductById(productId);
    if (!product || !product.sizeStock) return 0;
    return Number(product.sizeStock[size]) || 0;
  }

  isSizeInStock(productId, size) {
    return this.getSizeStock(productId, size) > 0;
  }

  decreaseSizeStock(productId, size, quantity) {
    let products = this.getProducts();
    let updatedProduct = null;
    products = products.map(p => {
      if (p.id === productId) {
        const currentStock = { ...p.sizeStock };
        const currentQty = Number(currentStock[size]) || 0;
        currentStock[size] = Math.max(0, currentQty - quantity);
        const totalStock = Object.values(currentStock).reduce((s, q) => s + (Number(q) || 0), 0);
        updatedProduct = {
          ...p,
          sizeStock: currentStock,
          stockQty: totalStock,
          inStock: totalStock > 0
        };
        return updatedProduct;
      }
      return p;
    });

    localStorage.setItem('tm_products', JSON.stringify(products));
    this.notify();
    return updatedProduct;
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

    const highlights = Array.isArray(productData.highlights) && productData.highlights.length > 0
      ? productData.highlights
      : [
          "100% Cotton",
          "Regular Fit",
          "Soft & Breathable",
          "Round Neck",
          "Half Sleeve",
          "Machine Washable"
        ];

    // Compute sizeStock & total stockQty
    let sizeStock = productData.sizeStock || {};
    const sizes = Array.isArray(productData.sizes) && productData.sizes.length > 0 
      ? productData.sizes 
      : Object.keys(sizeStock).length > 0 ? Object.keys(sizeStock) : ['S', 'M', 'L', 'XL'];

    sizes.forEach(sz => {
      if (sizeStock[sz] === undefined) {
        sizeStock[sz] = 10;
      } else {
        sizeStock[sz] = Math.max(0, parseInt(sizeStock[sz]) || 0);
      }
    });

    const totalStock = Object.values(sizeStock).reduce((sum, q) => sum + (parseInt(q) || 0), 0);

    const newProduct = {
      id: `tm-${Date.now().toString().slice(-4)}`,
      ...productData,
      price: parseFloat(productData.price) || 0,
      sizes: sizes,
      sizeStock: sizeStock,
      stockQty: totalStock,
      inStock: totalStock > 0,
      isNewArrival: productData.isNewArrival !== undefined ? productData.isNewArrival : true,
      images: imgs,
      description: productData.description || "",
      highlights: highlights,
      modelImageType: productData.modelImageType || 'product_only',
      badge: productData.badge || "NEW"
    };
    delete newProduct.gsm;
    products.unshift(newProduct);
    localStorage.setItem('tm_products', JSON.stringify(products));
    this.notify();
    supabaseService.saveProduct(newProduct);
    return newProduct;
  }

  updateProduct(id, updatedData) {
    let products = this.getProducts();
    let updatedProduct = null;
    products = products.map(p => {
      if (p.id === id) {
        const imgs = updatedData.images && updatedData.images.length > 0 
          ? updatedData.images 
          : [updatedData.imagePrimary, updatedData.imageHover].filter(Boolean);

        const highlights = Array.isArray(updatedData.highlights)
          ? updatedData.highlights
          : (p.highlights || []);

        let sizeStock = updatedData.sizeStock !== undefined ? { ...updatedData.sizeStock } : { ...p.sizeStock };
        const sizes = Array.isArray(updatedData.sizes) && updatedData.sizes.length > 0 
          ? updatedData.sizes 
          : (Array.isArray(p.sizes) ? p.sizes : ['S', 'M', 'L', 'XL']);

        sizes.forEach(sz => {
          if (sizeStock[sz] === undefined) {
            sizeStock[sz] = 5;
          } else {
            sizeStock[sz] = Math.max(0, parseInt(sizeStock[sz]) || 0);
          }
        });

        const totalStock = Object.values(sizeStock).reduce((sum, q) => sum + (parseInt(q) || 0), 0);

        const updated = {
          ...p,
          ...updatedData,
          price: parseFloat(updatedData.price) || p.price,
          sizes: sizes,
          sizeStock: sizeStock,
          stockQty: totalStock,
          inStock: totalStock > 0,
          isNewArrival: updatedData.isNewArrival !== undefined ? updatedData.isNewArrival : p.isNewArrival,
          images: imgs.length > 0 ? imgs : (p.images || [p.imagePrimary]),
          description: updatedData.description !== undefined ? updatedData.description : p.description,
          highlights: highlights,
          modelImageType: updatedData.modelImageType !== undefined ? updatedData.modelImageType : (p.modelImageType || 'product_only')
        };
        delete updated.gsm;
        updatedProduct = updated;
        return updated;
      }
      return p;
    });
    localStorage.setItem('tm_products', JSON.stringify(products));
    this.notify();
    if (updatedProduct) supabaseService.saveProduct(updatedProduct);
  }

  toggleNewArrival(id) {
    let target = null;
    const products = this.getProducts().map(p => {
      if (p.id === id) {
        const nextState = !p.isNewArrival;
        this.showToast(nextState ? `Added "${p.name}" to New Arrivals` : `Removed "${p.name}" from New Arrivals`);
        target = { ...p, isNewArrival: nextState };
        return target;
      }
      return p;
    });
    localStorage.setItem('tm_products', JSON.stringify(products));
    this.notify();
    if (target) supabaseService.saveProduct(target);
  }

  deleteProduct(id) {
    const deletedIds = JSON.parse(localStorage.getItem('tm_deleted_products') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('tm_deleted_products', JSON.stringify(deletedIds));
    }
    const products = this.getProducts().filter(p => p.id !== id);
    localStorage.setItem('tm_products', JSON.stringify(products));
    this.notify();
    supabaseService.deleteProduct(id);
  }

  toggleStock(id) {
    let target = null;
    let products = this.getProducts();
    products = products.map(p => {
      if (p.id === id) {
        const nextState = !p.inStock;
        let newSizeStock = { ...(p.sizeStock || {}) };
        if (nextState) {
          // Marking IN STOCK: ensure each size has at least 5 units if currently 0
          const total = Object.values(newSizeStock).reduce((s, q) => s + (Number(q) || 0), 0);
          if (total === 0) {
            (p.sizes || ['S', 'M', 'L', 'XL']).forEach(sz => {
              newSizeStock[sz] = 10;
            });
          }
        } else {
          // Marking OUT OF STOCK: zero out each size stock
          Object.keys(newSizeStock).forEach(sz => {
            newSizeStock[sz] = 0;
          });
        }
        const newTotal = Object.values(newSizeStock).reduce((s, q) => s + (Number(q) || 0), 0);
        this.showToast(nextState ? `Marked "${p.name}" as In Stock` : `Marked "${p.name}" as Out of Stock`);
        target = {
          ...p,
          sizeStock: newSizeStock,
          stockQty: newTotal,
          inStock: nextState
        };
        return target;
      }
      return p;
    });
    localStorage.setItem('tm_products', JSON.stringify(products));
    this.notify();
    if (target) supabaseService.saveProduct(target);
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
    if (!product) return false;

    const available = this.getSizeStock(productId, size);
    if (available <= 0) {
      this.showToast(`Size "${size}" is currently out of stock`, 'error');
      return false;
    }

    let cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.id === productId && item.size === size);

    if (existingIndex > -1) {
      const newQty = cart[existingIndex].qty + qty;
      if (newQty > available) {
        this.showToast(`Only ${available} available in size ${size}.`, 'error');
        return false;
      }
      cart[existingIndex].qty = newQty;
    } else {
      if (qty > available) {
        this.showToast(`Only ${available} available in size ${size}.`, 'error');
        return false;
      }
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
    return true;
  }

  updateCartQty(productId, size, change) {
    let cart = this.getCart();
    const item = cart.find(i => i.id === productId && i.size === size);
    if (!item) return;

    if (change > 0) {
      const available = this.getSizeStock(productId, size);
      if (item.qty + change > available) {
        this.showToast(`Only ${available} available in size ${size}.`, 'error');
        return;
      }
    }

    cart = cart.map(i => {
      if (i.id === productId && i.size === size) {
        const newQty = i.qty + change;
        return newQty > 0 ? { ...i, qty: newQty } : null;
      }
      return i;
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
    this.setPromoCode(null);
    this.notify();
  }

  // Promo state is shared between the cart drawer (where the code is typed) and the checkout modal
  // (where the total is shown and the order is placed). It used to live only on
  // CartDrawer.discountPercent, so the drawer displayed "10% off applied" while the checkout modal
  // and the server both charged full price. The server re-validates the code on every order — this
  // is display state only.
  getPromoCode() {
    try {
      return localStorage.getItem('tm_promo_code') || null;
    } catch (_) {
      return null;
    }
  }

  setPromoCode(code) {
    try {
      if (code) localStorage.setItem('tm_promo_code', code);
      else localStorage.removeItem('tm_promo_code');
    } catch (_) {}
  }

  // Resolves the stored code against the promo table published by /api/payment-config, so the
  // discount shown is the discount the server will apply. Returns null when no valid code applies.
  getAppliedPromo() {
    const code = this.getPromoCode();
    if (!code) return null;
    const table = this.getPaymentConfig().promoCodes || {};
    const promo = table[code];
    if (!promo) return null;
    const { subtotal } = this.getCartTotal();
    if (subtotal < (promo.minSubtotal || 0)) return null;
    return { code, percent: promo.percent, amount: Math.round(subtotal * (promo.percent / 100)) };
  }

  getCartTotal() {
    const cart = this.getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    // Threshold matches the server's `subtotal >= 2499` exactly. It used to be `> 2499`, so a cart
    // at exactly ₹2499 was quoted ₹99 shipping and then charged ₹0.
    const shipping = subtotal >= 2499 || cart.length === 0 ? 0 : 99;
    return {
      subtotal,
      shipping,
      total: subtotal + shipping,
      itemCount: cart.reduce((sum, item) => sum + item.qty, 0)
    };
  }

  // Orders with Strict Per-Size Stock Verification and Atomic Deduction
  getOrders() {
    try {
      return JSON.parse(localStorage.getItem('tm_orders')) || [];
    } catch (e) {
      return [];
    }
  }

  // Payment Configuration
  getPaymentConfig() {
    try {
      const stored = localStorage.getItem('tm_payment_config');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return {
      merchantUpiVpa: 'teematrix@okaxis',
      merchantName: 'Tee Matrix',
      enableCOD: true,
      enableGST: false,
      gstRate: 0.12
    };
  }

  async fetchPaymentConfigFromServer() {
    try {
      const res = await fetch('/api/payment-config');
      if (res.ok) {
        const config = await res.json();
        localStorage.setItem('tm_payment_config', JSON.stringify(config));
        this.notify();
        return config;
      }
    } catch (_) {}
    return this.getPaymentConfig();
  }

  async updatePaymentConfig(newConfig) {
    const current = this.getPaymentConfig();
    const updated = { ...current, ...newConfig };
    localStorage.setItem('tm_payment_config', JSON.stringify(updated));
    this.notify();
    
    // Sync with backend API using Bearer token
    try {
      const token = await supabaseService.getAccessToken();
      if (token) {
        await fetch('/api/admin/payment-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updated)
        });
      }
    } catch (_) {}

    return updated;
  }

  // Orders with Strict Server-Side Validation
  getOrders() {
    try {
      return JSON.parse(localStorage.getItem('tm_orders')) || [];
    } catch (e) {
      return [];
    }
  }

  async createOrder(shippingInfo, paymentInfo = {}) {
    const cart = this.getCart();
    if (cart.length === 0) return { success: false, message: "Your cart is empty" };

    const token = await supabaseService.getAccessToken();
    if (!token) {
      this.showToast("Please log in with mobile OTP to place your order", 'error');
      return { success: false, message: "Authentication required" };
    }

    try {
      const items = cart.map(i => ({ id: i.id, size: i.size, qty: i.qty }));
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items,
          shippingInfo,
          promoCode: this.getPromoCode(),
          paymentMethod: paymentInfo.method || 'UPI',
          paymentDetails: paymentInfo.details || {}
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data.error || "Failed to create order on server";
        this.showToast(msg, 'error');
        return { success: false, message: msg };
      }

      const newOrder = data.order;
      const orders = this.getOrders();
      orders.unshift(newOrder);
      localStorage.setItem('tm_orders', JSON.stringify(orders));
      this.clearCart();
      this.notify();

      return { success: true, order: newOrder };
    } catch (err) {
      console.error("Order creation error:", err);
      const msg = err.message || "Failed to place order";
      this.showToast(msg, 'error');
      return { success: false, message: msg };
    }
  }

  // Direct Single-Item Order Creation for "Buy Now" (bypasses and preserves global cart)
  //
  // Unused since Buy Now was changed to add the item to the cart and open the shared checkout —
  // the old direct path invented a placeholder shipping address. It is kept here only because it
  // is the one call site shape that would need updating if a true single-item path returns; note
  // that it does NOT forward a promoCode and does NOT compose city/pincode into the address, so
  // reviving it as-is would reintroduce both bugs.
  async createDirectOrder(product, size, qty = 1, shippingInfo = {}, paymentInfo = {}) {
    const token = await supabaseService.getAccessToken();
    if (!token) {
      this.showToast("Please log in with mobile OTP to place your order", 'error');
      return { success: false, message: "Authentication required" };
    }

    try {
      const items = [{ id: product.id, size: size, qty: qty }];
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items,
          shippingInfo,
          paymentMethod: paymentInfo.method || 'UPI',
          paymentDetails: paymentInfo.details || {}
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data.error || "Failed to create order on server";
        this.showToast(msg, 'error');
        return { success: false, message: msg };
      }

      const newOrder = data.order;
      const orders = this.getOrders();
      orders.unshift(newOrder);
      localStorage.setItem('tm_orders', JSON.stringify(orders));
      this.notify();

      return { success: true, order: newOrder };
    } catch (err) {
      console.error("Direct order creation error:", err);
      const msg = err.message || "Failed to place order";
      this.showToast(msg, 'error');
      return { success: false, message: msg };
    }
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
  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const svgIcon = type === 'error'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    toast.innerHTML = `
      ${svgIcon}
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast && toast.style) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
      }
      setTimeout(() => toast?.remove?.(), 300);
    }, 3000);
  }
}

export const store = new StoreService();
