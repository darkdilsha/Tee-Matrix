import { store } from './store.js';
import { supabaseService } from './supabase.js';
import { ProductImageAI } from './imageAI.js';

export class AdminPanel {
  constructor() {
    this.isAuthenticated = localStorage.getItem('tm_admin_auth') === 'true';
    this.activeTab = 'products'; // 'products' | 'orders' | 'analytics'
    this.editingProduct = null;
    this.isAddingProduct = false;
    this.loginStep = 1; // 1: Phone input, 2: 6-digit OTP verification
    this.adminPhone = '';
    this.timerCountdown = 30;
    this.timerInterval = null;
  }

  render() {
    // Strict Guard Rule: check if admin authentication session exists
    this.isAuthenticated = localStorage.getItem('tm_admin_auth') === 'true';
    
    if (!this.isAuthenticated) {
      return this.renderLogin();
    }
    return this.renderDashboard();
  }

  renderLogin() {
    return `
      <div style="position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1.5rem; overflow-y: auto; background-image: url('assets/admin_bg.jpg'); background-size: cover; background-position: center; font-family: 'Inter', system-ui, -apple-system, sans-serif;">
        <!-- Soft Background Dark Overlay -->
        <div style="position: absolute; inset: 0; background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); pointer-events: none;"></div>

        <!-- Centered Floating Modern Card -->
        <div style="position: relative; z-index: 10; width: 100%; max-width: 410px; background: #ffffff; border-radius: 24px; padding: 2.75rem 2.25rem 2rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); text-align: center; color: #0f172a;">
          
          <!-- Top Icon Badge -->
          <div style="width: 50px; height: 50px; border-radius: 14px; background: #f0f7ff; border: 1px solid #e0f2fe; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <!-- Card Header & Subtext -->
          <h1 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; letter-spacing: -0.02em;">
            Tee Matrix Admin
          </h1>
          <p style="color: #64748b; font-size: 0.82rem; line-height: 1.5; margin-bottom: 1.75rem; font-weight: 400;">
            ${this.loginStep === 1 
              ? 'Authorized Admin Phone Verification.<br/>Enter your registered mobile number.' 
              : `Enter the 6-digit OTP code sent to<br/><strong style="color: #0f172a;">${this.adminPhone}</strong>`}
          </p>

          ${this.loginStep === 1 ? `
            <!-- Step 1: Admin Phone Form -->
            <form id="adminPhoneForm" style="display: flex; flex-direction: column; text-align: left;">
              <div style="margin-bottom: 1.25rem;">
                <label style="font-size: 0.75rem; color: #64748b; font-weight: 600; display: block; margin-bottom: 0.4rem;">ADMIN MOBILE NUMBER *</label>
                <div style="display: flex; gap: 0.5rem;">
                  <span style="padding: 0.85rem 1rem; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 0.9rem; font-weight: 600; color: #0f172a;">+91</span>
                  <input 
                    type="tel" 
                    id="adminMobileInput" 
                    required 
                    value="${this.adminPhone ? this.adminPhone.replace('+91', '').trim() : ''}"
                    placeholder="9876543210"
                    style="width: 100%; padding: 0.85rem 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 1rem; color: #0f172a; outline: none; transition: all 0.2s ease; box-sizing: border-box; font-weight: 600;"
                    onfocus="this.style.borderColor='#0f172a'; this.style.background='#ffffff';"
                    onblur="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc';"
                  />
                </div>
              </div>

              <div id="adminAuthErr" style="color: #ef4444; font-size: 0.8rem; margin-bottom: 1rem; display: none; text-align: center; font-weight: 500;"></div>

              <button 
                type="submit" 
                style="width: 100%; padding: 0.9rem; background: #0f172a; color: #ffffff; font-weight: 600; font-size: 0.9rem; border-radius: 12px; border: none; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);"
                onmouseover="this.style.background='#1e293b'; this.style.transform='translateY(-1px)';"
                onmouseout="this.style.background='#0f172a'; this.style.transform='translateY(0)';"
              >
                REQUEST 6-DIGIT OTP
              </button>
            </form>
          ` : `
            <!-- Step 2: 6-Digit OTP Form -->
            <form id="adminOtpForm" style="display: flex; flex-direction: column; text-align: center;">
              <div class="otp-container" id="adminOtpBoxContainer">
                <input type="text" maxlength="1" class="otp-box" data-index="0" autofocus />
                <input type="text" maxlength="1" class="otp-box" data-index="1" />
                <input type="text" maxlength="1" class="otp-box" data-index="2" />
                <input type="text" maxlength="1" class="otp-box" data-index="3" />
                <input type="text" maxlength="1" class="otp-box" data-index="4" />
                <input type="text" maxlength="1" class="otp-box" data-index="5" />
              </div>

              <div id="adminAuthErr" style="color: #ef4444; font-size: 0.8rem; margin-bottom: 1rem; display: none; text-align: center; font-weight: 600;"></div>

              <button 
                type="submit" 
                id="verifyAdminOtpBtn"
                style="width: 100%; padding: 0.9rem; background: #0f172a; color: #ffffff; font-weight: 600; font-size: 0.9rem; border-radius: 12px; border: none; cursor: pointer; transition: all 0.2s ease; margin-bottom: 1.25rem; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);"
              >
                VERIFY & UNLOCK DASHBOARD
              </button>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; border-top: 1px solid #f1f5f9; padding-top: 1rem;">
                <button type="button" id="adminChangeNumBtn" style="color: #64748b; background: none; border: none; cursor: pointer; font-weight: 500;">
                  &larr; Change Number
                </button>

                <span id="adminTimerContainer" style="color: #94a3b8;">
                  Resend in <strong id="adminTimerCount" style="color: #0f172a;">${this.timerCountdown}s</strong>
                </span>
                <button type="button" id="adminResendOtpBtn" style="display: none; color: #0f172a; font-weight: 700; text-decoration: underline; background: none; border: none; cursor: pointer;">
                  Resend OTP
                </button>
              </div>
            </form>
          `}

          <!-- Public Storefront Navigation Link -->
          <div style="margin-top: 1.5rem;">
            <a href="#landing" style="font-size: 0.78rem; color: #94a3b8; text-decoration: none; font-weight: 500; transition: color 0.2s;" onmouseover="this.style.color='#0f172a'" onmouseout="this.style.color='#94a3b8'">
              &larr; Return to Public Storefront
            </a>
          </div>

        </div>
      </div>
    `;
  }

  renderDashboard() {
    const products = store.getProducts();
    const orders = store.getOrders();
    const inStockCount = products.filter(p => p.inStock).length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    return `
      <div class="admin-container container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <span class="section-tag">CONTROL CENTER</span>
            <h1 class="brand-font" style="font-size: 2.5rem; color: #fff;">ADMIN DASHBOARD</h1>
          </div>
          <div style="display: flex; gap: 1rem; align-items: center;">
            <button class="btn-secondary" id="adminLogoutBtn" style="padding: 0.6rem 1.5rem; font-size: 0.75rem;">LOGOUT</button>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
          <div class="glass-panel" style="padding: 1.5rem;">
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.5rem;">TOTAL PRODUCTS</span>
            <span style="font-size: 2.2rem; font-weight: 800; color: #fff; font-family: var(--font-heading);">${products.length}</span>
          </div>

          <div class="glass-panel" style="padding: 1.5rem;">
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.5rem;">ACTIVE IN STOCK</span>
            <span style="font-size: 2.2rem; font-weight: 800; color: var(--accent-success); font-family: var(--font-heading);">${inStockCount}</span>
          </div>

          <div class="glass-panel" style="padding: 1.5rem;">
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.5rem;">TOTAL SALES REVENUE</span>
            <span style="font-size: 2.2rem; font-weight: 800; color: #fff; font-family: var(--font-heading);">₹${totalRevenue.toLocaleString('en-IN')}</span>
          </div>

          <div class="glass-panel" style="padding: 1.5rem;">
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.5rem;">ONLINE ORDERS</span>
            <span style="font-size: 2.2rem; font-weight: 800; color: var(--accent-silver); font-family: var(--font-heading);">${orders.length}</span>
          </div>
        </div>

        <!-- Dashboard Tab Bar -->
        <div style="display: flex; gap: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 2rem; flex-wrap: wrap;">
          <button class="pill-btn ${this.activeTab === 'products' ? 'active' : ''}" id="tabProductsBtn" style="padding: 0.8rem 1.8rem; font-size: 0.85rem;">
            PRODUCTS MANAGEMENT (${products.length})
          </button>
          <button class="pill-btn ${this.activeTab === 'orders' ? 'active' : ''}" id="tabOrdersBtn" style="padding: 0.8rem 1.8rem; font-size: 0.85rem;">
            CUSTOMER ORDERS (${orders.length})
          </button>
          <button class="pill-btn ${this.activeTab === 'analytics' ? 'active' : ''}" id="tabAnalyticsBtn" style="padding: 0.8rem 1.8rem; font-size: 0.85rem; border-color: var(--accent-gold); color: ${this.activeTab === 'analytics' ? '#000' : 'var(--accent-gold)'}">
            ANALYTICS & PORTFOLIO
          </button>
          ${store.isMasterAdmin() ? `
            <button class="pill-btn ${this.activeTab === 'admin_users' ? 'active' : ''}" id="tabAdminUsersBtn" style="padding: 0.8rem 1.8rem; font-size: 0.85rem;">
              ADMIN USERS & ROLES
            </button>
          ` : ''}
        </div>

        ${this.activeTab === 'products' ? this.renderProductsTab(products) : this.activeTab === 'orders' ? this.renderOrdersTab(orders) : this.activeTab === 'analytics' ? this.renderAnalyticsTab(products, orders) : (store.isMasterAdmin() ? this.renderAdminUsersTab() : this.renderProductsTab(products))}
      </div>
    `;
  }

  renderProductsTab(products) {
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.4rem; color: #fff;">INVENTORY CATALOG</h2>
          <button class="btn-primary" id="addNewProductBtn" style="padding: 0.8rem 1.8rem; font-size: 0.75rem;">
            + ADD NEW PRODUCT
          </button>
        </div>

        <!-- Products Table -->
        <div style="overflow-x: auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Title & Specs</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock Qty</th>
                <th>Status</th>
                <th>New Arrival</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td>
                    <img src="${p.imagePrimary}" alt="${p.name}" style="width: 50px; aspect-ratio: 3/4; object-fit: cover; background: #111;" />
                  </td>
                  <td>
                    <strong style="color: #fff; display: block; font-size: 0.95rem;">${p.name}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${p.fit || 'Boxy Fit'} &bull; ${Array.isArray(p.sizes) ? p.sizes.join(', ') : (p.sizes || 'S, M, L, XL')}</span>
                  </td>
                  <td style="color: var(--text-secondary); font-size: 0.85rem;">${p.category}</td>
                  <td style="color: #fff; font-weight: 700;">₹${p.price.toLocaleString('en-IN')}</td>
                  <td style="color: #fff; font-weight: 600;">${p.stockQty}</td>
                  <td>
                    <span class="badge ${p.inStock ? 'badge-stock' : 'badge-out'}">
                      ${p.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                    </span>
                  </td>
                  <td>
                    <button class="btn-secondary toggle-arrival-btn" data-id="${p.id}" style="padding: 0.35rem 0.75rem; font-size: 0.7rem; ${p.isNewArrival ? 'border-color: #ffffff; background: rgba(255,255,255,0.1); color: #fff;' : 'color: var(--text-muted);'}">
                      ${p.isNewArrival ? '★ NEW ARRIVAL' : '+ ADD TO ARRIVALS'}
                    </button>
                  </td>
                  <td>
                    <div style="display: flex; gap: 0.4rem;">
                      <button class="btn-secondary toggle-stock-btn" data-id="${p.id}" style="padding: 0.35rem 0.6rem; font-size: 0.7rem;">
                        ${p.inStock ? 'Out' : 'Stock'}
                      </button>
                      <button class="btn-secondary edit-product-btn" data-id="${p.id}" style="padding: 0.35rem 0.6rem; font-size: 0.7rem;">
                        EDIT
                      </button>
                      <button class="btn-secondary delete-product-btn" data-id="${p.id}" style="padding: 0.35rem 0.6rem; font-size: 0.7rem; color: var(--accent-danger); border-color: rgba(239, 68, 68, 0.4);">
                        DEL
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderOrdersTab(orders) {
    return `
      <div>
        <h2 style="font-size: 1.4rem; color: #fff; margin-bottom: 1.5rem;">ONLINE DISPATCH ORDERS</h2>
        <div style="overflow-x: auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Shipping Address</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td><strong style="color: #fff;">#${o.id}</strong></td>
                  <td style="color: var(--text-muted); font-size: 0.8rem;">${o.date}</td>
                  <td>
                    <strong style="color: #fff; display: block; font-size: 0.9rem;">${o.customerName}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${o.email}</span>
                  </td>
                  <td style="color: var(--text-secondary); font-size: 0.8rem; max-width: 250px;">${o.address}</td>
                  <td style="font-size: 0.8rem; color: var(--text-secondary);">
                    ${Array.isArray(o.items) ? o.items.map(i => `${i.name} (${i.size || 'M'}) x${i.qty}`).join('<br/>') : 'No items'}
                  </td>
                  <td style="color: #fff; font-weight: 700;">₹${o.total.toLocaleString('en-IN')}</td>
                  <td>
                    <span class="badge badge-stock">${o.status}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderAnalyticsTab(products, orders) {
    // 1. Overall Calculations
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalUnitsSold = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0);
    const aov = orders.length > 0 ? totalRevenue / orders.length : 0;
    const inventoryValuation = products.reduce((sum, p) => sum + (p.price * p.stockQty), 0);

    // 2. Category Analytics
    const categories = ['Acid Wash', 'Graphic', 'Heavyweight Minimal', 'Vintage'];
    const categoryStats = categories.map(cat => {
      const catProducts = products.filter(p => p.category === cat);
      let catRevenue = 0;
      let catUnits = 0;

      orders.forEach(order => {
        order.items.forEach(item => {
          const product = products.find(p => p.id === item.id);
          if (product && product.category === cat) {
            catRevenue += item.price * item.qty;
            catUnits += item.qty;
          }
        });
      });

      const revenueShare = totalRevenue > 0 ? (catRevenue / totalRevenue) * 100 : 0;
      const avgPrice = catProducts.length > 0 ? catProducts.reduce((sum, p) => sum + p.price, 0) / catProducts.length : 0;

      return {
        name: cat,
        productCount: catProducts.length,
        unitsSold: catUnits,
        revenue: catRevenue,
        share: revenueShare,
        avgPrice
      };
    });

    // 3. Product-Wise Analytics
    const productStats = products.map(product => {
      let unitsSold = 0;
      let revenue = 0;

      orders.forEach(order => {
        order.items.forEach(item => {
          if (item.id === product.id) {
            unitsSold += item.qty;
            revenue += item.price * item.qty;
          }
        });
      });

      return {
        ...product,
        unitsSold,
        revenue
      };
    });

    return `
      <div>
        <!-- Portfolio & Performance Overview Cards -->
        <h2 style="font-size: 1.4rem; color: #fff; margin-bottom: 1.25rem;">BUSINESS PORTFOLIO & OVERALL PERFORMANCE</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
          <div class="glass-panel" style="padding: 1.5rem; border-left: 3px solid var(--accent-gold);">
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.4rem;">TOTAL STORE REVENUE</span>
            <span style="font-size: 2rem; font-weight: 800; color: #fff; font-family: var(--font-heading);">₹${totalRevenue.toLocaleString('en-IN')}</span>
          </div>

          <div class="glass-panel" style="padding: 1.5rem; border-left: 3px solid var(--accent-success);">
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.4rem;">TOTAL UNITS SOLD</span>
            <span style="font-size: 2rem; font-weight: 800; color: var(--accent-success); font-family: var(--font-heading);">${totalUnitsSold} Pcs</span>
          </div>

          <div class="glass-panel" style="padding: 1.5rem; border-left: 3px solid var(--accent-silver);">
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.4rem;">AVERAGE ORDER VALUE (AOV)</span>
            <span style="font-size: 2rem; font-weight: 800; color: #fff; font-family: var(--font-heading);">₹${aov.toFixed(0)}</span>
          </div>

          <div class="glass-panel" style="padding: 1.5rem; border-left: 3px solid #3b82f6;">
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.4rem;">TOTAL INVENTORY VALUATION</span>
            <span style="font-size: 2rem; font-weight: 800; color: #fff; font-family: var(--font-heading);">₹${inventoryValuation.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <!-- Section 2: Category-Wise Performance Analysis -->
        <div style="margin-bottom: 3.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.25rem; color: #fff; letter-spacing: 0.05em;">CATEGORY-WISE SALES & PORTFOLIO ANALYSIS</h3>
            <span style="font-size: 0.75rem; color: var(--text-muted);">4 Active Atelier Collections</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            ${categoryStats.map(cat => `
              <div class="glass-panel" style="padding: 1.5rem; position: relative;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                  <strong style="color: #fff; font-size: 1.05rem;">${cat.name}</strong>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${cat.productCount} Designs</span>
                </div>
                
                <div style="font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">
                  ₹${cat.revenue.toLocaleString('en-IN')}
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
                  <span>Units Sold: <strong>${cat.unitsSold}</strong></span>
                  <span>Avg Price: <strong>₹${cat.avgPrice.toFixed(0)}</strong></span>
                </div>

                <!-- Progress Bar -->
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                  <div style="width: ${cat.share}%; height: 100%; background: #ffffff;"></div>
                </div>
                <span style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 0.4rem; text-align: right;">
                  ${cat.share.toFixed(1)}% Revenue Share
                </span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Section 3: Product-Wise Granular Analysis -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.25rem; color: #fff; letter-spacing: 0.05em;">PRODUCT-WISE PERFORMANCE & INVENTORY HEALTH</h3>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Real-Time Product Metrics</span>
          </div>

          <div style="overflow-x: auto;">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock Available</th>
                  <th>Stock Health</th>
                  <th>Units Sold</th>
                  <th>Gross Revenue</th>
                  <th>New Arrival Status</th>
                </tr>
              </thead>
              <tbody>
                ${productStats.map(p => `
                  <tr>
                    <td>
                      <div style="display: flex; gap: 0.75rem; align-items: center;">
                        <img src="${p.imagePrimary}" alt="${p.name}" style="width: 40px; aspect-ratio: 3/4; object-fit: cover;" />
                        <div>
                          <strong style="color: #fff; display: block; font-size: 0.85rem;">${p.name}</strong>
                          <span style="font-size: 0.7rem; color: var(--text-muted);">${p.fit}</span>
                        </div>
                      </div>
                    </td>
                    <td style="font-size: 0.8rem; color: var(--text-secondary);">${p.category}</td>
                    <td style="color: #fff; font-weight: 600;">₹${p.price.toLocaleString('en-IN')}</td>
                    <td style="color: #fff; font-weight: 700;">${p.stockQty} Pcs</td>
                    <td>
                      ${p.stockQty === 0 ? `
                        <span class="badge badge-out">SOLD OUT</span>
                      ` : p.stockQty < 20 ? `
                        <span class="badge badge-limited">LOW STOCK (${p.stockQty})</span>
                      ` : `
                        <span class="badge badge-stock">HEALTHY STOCK</span>
                      `}
                    </td>
                    <td style="color: var(--accent-success); font-weight: 700;">${p.unitsSold} Units</td>
                    <td style="color: #fff; font-weight: 800;">₹${p.revenue.toLocaleString('en-IN')}</td>
                    <td>
                      <button class="btn-secondary toggle-arrival-btn" data-id="${p.id}" style="padding: 0.35rem 0.75rem; font-size: 0.7rem; ${p.isNewArrival ? 'border-color: #ffffff; background: rgba(255,255,255,0.1); color: #fff;' : 'color: var(--text-muted);'}">
                        ${p.isNewArrival ? '★ NEW ARRIVAL' : '+ ADD TO ARRIVALS'}
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderAdminUsersTab() {
    const adminAccounts = store.getAdminAccounts();

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.4rem; color: #fff;">REGISTERED ADMINISTRATORS</h2>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Manage administrator credentials and add new admin accounts</span>
          </div>
          <button class="btn-primary" id="createAdminBtn" style="padding: 0.8rem 1.8rem; font-size: 0.75rem;">
            + CREATE NEW ADMIN
          </button>
        </div>

        <div style="overflow-x: auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Administrator Name</th>
                <th>Access Role</th>
                <th>Created Date</th>
                <th>Password</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${adminAccounts.map(a => `
                <tr>
                  <td><strong style="color: #fff; font-size: 0.95rem;">@${a.username}</strong></td>
                  <td style="color: #fff;">${a.name}</td>
                  <td>
                    <span class="badge ${a.username === 'admin' ? 'badge-limited' : 'badge-stock'}">${a.role || 'Administrator'}</span>
                  </td>
                  <td style="color: var(--text-muted); font-size: 0.85rem;">${a.createdDate || '2026-08-10'}</td>
                  <td style="color: var(--text-secondary); font-family: monospace;">••••••••</td>
                  <td>
                    ${a.username === 'admin' ? `
                      <span style="font-size: 0.75rem; color: var(--text-muted);">Protected Master</span>
                    ` : `
                      <button class="btn-secondary delete-admin-btn" data-username="${a.username}" style="padding: 0.35rem 0.75rem; font-size: 0.7rem; color: var(--accent-danger); border-color: rgba(239,68,68,0.4);">
                        REVOKE ACCESS
                      </button>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  openAddAdminModal(reRenderCallback) {
    let modal = document.getElementById('addAdminModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'addAdminModal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-content glass-panel" style="max-width: 480px; padding: 2.5rem; border: 1px solid var(--border-color); border-top: 3px solid var(--accent-gold);">
        <button class="modal-close" id="closeAddAdminBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <span class="section-tag" style="color: var(--accent-gold);">SECURITY PORTAL</span>
        <h2 style="font-family: var(--font-heading); font-size: 1.6rem; color: #fff; margin-bottom: 0.5rem;">
          CREATE NEW ADMIN ACCOUNT
        </h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">
          New admin will get full access to manage inventory, products, orders, and analytics.
        </p>

        <form id="createAdminForm" style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">ADMIN USERNAME *</label>
            <input type="text" id="newAdminUser" required class="input-field" placeholder="e.g. admin_username" />
          </div>

          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">FULL NAME *</label>
            <input type="text" id="newAdminName" required class="input-field" placeholder="e.g. Admin Name" />
          </div>

          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">LOGIN PASSWORD *</label>
            <input type="password" id="newAdminPass" required class="input-field" placeholder="Minimum 4 characters" />
          </div>

          <div id="createAdminErr" style="color: var(--accent-danger); font-size: 0.8rem; display: none;"></div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
            <button type="button" class="btn-secondary" id="cancelAddAdminBtn">CANCEL</button>
            <button type="submit" class="btn-primary">CREATE ADMIN ACCOUNT</button>
          </div>
        </form>
      </div>
    `;

    setTimeout(() => modal.classList.add('active'), 10);

    document.getElementById('closeAddAdminBtn')?.addEventListener('click', () => modal.classList.remove('active'));
    document.getElementById('cancelAddAdminBtn')?.addEventListener('click', () => modal.classList.remove('active'));

    const form = document.getElementById('createAdminForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('newAdminUser').value.trim();
        const name = document.getElementById('newAdminName').value.trim();
        const pass = document.getElementById('newAdminPass').value;
        const errEl = document.getElementById('createAdminErr');

        const res = store.addAdminAccount(user, name, pass);
        if (res.success) {
          modal.classList.remove('active');
          reRenderCallback();
        } else {
          if (errEl) {
            errEl.innerText = res.message;
            errEl.style.display = 'block';
          }
        }
      });
    }
  }

  openAddEditModal(product = null, reRenderCallback) {
    let modal = document.getElementById('productFormModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'productFormModal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    const isEdit = !!product;
    const p = product || {
      name: '',
      category: 'Acid Wash',
      price: 1999.00,
      fit: 'Boxy Oversized Fit',
      fabric: '100% Combed Heavy Cotton',
      description: '',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Jet Black'],
      imagePrimary: 'assets/tee_black_heavy.jpg',
      imageHover: 'assets/hero_banner.jpg',
      stockQty: 30,
      inStock: true,
      isNewArrival: true,
      badge: 'NEW'
    };

    // State to store images associated with this product form
    let uploadedImages = [];
    if (isEdit && p.images) {
      uploadedImages = p.images.map(img => ({
        url: img,
        id: Math.random().toString(),
        file: null,
        uploading: false,
        error: false
      }));
    } else if (p.imagePrimary || p.imageHover) {
      uploadedImages = [p.imagePrimary, p.imageHover].filter(Boolean).map(img => ({
        url: img,
        id: Math.random().toString(),
        file: null,
        uploading: false,
        error: false
      }));
    }

    // State to store available sizes
    let selectedSizes = Array.isArray(p.sizes) 
      ? [...p.sizes] 
      : (typeof p.sizes === 'string' ? JSON.parse(p.sizes) : ['S', 'M', 'L', 'XL']);
    if (!selectedSizes || selectedSizes.length === 0) selectedSizes = ['S', 'M', 'L', 'XL'];

    // State to store product highlights
    let highlightsList = Array.isArray(p.highlights) && p.highlights.length > 0
      ? [...p.highlights]
      : (isEdit ? [] : [
          "100% Cotton",
          "Regular Fit",
          "Soft & Breathable",
          "Round Neck",
          "Half Sleeve",
          "Machine Washable"
        ]);

    modal.innerHTML = `
      <div class="modal-content glass-panel" style="max-width: 720px; padding: 2.5rem; max-height: 90vh; overflow-y: auto;">
        <button class="modal-close" id="closeFormBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <h2 style="font-family: var(--font-heading); font-size: 1.8rem; color: #fff; margin-bottom: 1.5rem;">
          ${isEdit ? 'EDIT PRODUCT' : 'ADD NEW PRODUCT'}
        </h2>

        <form id="productSaveForm" style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem; font-weight: 600;">PRODUCT TITLE *</label>
            <input type="text" id="pName" required class="input-field" value="${p.name}" placeholder="e.g. Matrix Acid Wash Heavyweight Tee" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem; font-weight: 600;">CATEGORY</label>
              <select id="pCategory" class="sort-select" style="width: 100%;">
                <option value="Acid Wash" ${p.category === 'Acid Wash' ? 'selected' : ''}>Acid Wash</option>
                <option value="Graphic" ${p.category === 'Graphic' ? 'selected' : ''}>Graphic</option>
                <option value="Heavyweight Minimal" ${p.category === 'Heavyweight Minimal' ? 'selected' : ''}>Heavyweight Minimal</option>
                <option value="Vintage" ${p.category === 'Vintage' ? 'selected' : ''}>Vintage</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem; font-weight: 600;">PRICE (₹ INR) *</label>
              <input type="number" step="1" id="pPrice" required class="input-field" value="${p.price}" />
            </div>
          </div>

          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem; font-weight: 600;">STOCK QUANTITY</label>
            <input type="number" id="pStockQty" required class="input-field" value="${p.stockQty}" />
          </div>

          <!-- New Arrival Option -->
          <div style="padding: 0.8rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.75rem; border-radius: 8px;">
            <input type="checkbox" id="pIsNewArrival" ${p.isNewArrival ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
            <label for="pIsNewArrival" style="color: #fff; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
              Add to "New Arrivals" Section on Homepage Landing Page
            </label>
          </div>

          <!-- Drag & Drop Image Upload Zone -->
          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem; font-weight: 600;">PRODUCT GALLERY IMAGES *</label>
            
            <div id="adminUploadZone" class="admin-upload-zone">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>Drag images here or click to upload</span>
              <small>Accepted formats: JPG, PNG, WEBP (Max size: 5MB)</small>
              <input type="file" id="pFileInput" multiple accept="image/jpeg,image/png,image/webp" style="display: none;" />
            </div>

            <!-- AI Image Vision Analysis Status Banner -->
            <div id="aiStatusContainer" style="display: none; margin-top: 0.6rem; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.8rem; transition: all 0.3s ease;">
              <!-- Populated Dynamically -->
            </div>

            <div id="adminUploadThumbs" class="admin-upload-thumbs">
              <!-- Rendered Dynamically -->
            </div>
            
            <span style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 0.3rem;">
              First image is the PRIMARY product photo. Second image is the HOVER photo. Drag thumbnails to reorder them!
            </span>
          </div>

          <!-- Available Sizes Selector -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; font-weight: 600;">AVAILABLE SIZES *</label>
              <span style="font-size: 0.7rem; color: var(--text-muted);">Click to toggle / add sizes</span>
            </div>
            
            <div class="admin-size-selector" id="adminSizeSelector">
              ${['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(sz => `
                <button type="button" class="admin-size-pill ${selectedSizes.includes(sz) ? 'active' : ''}" data-size="${sz}">
                  ${sz}
                </button>
              `).join('')}
              ${selectedSizes.filter(s => !['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].includes(s)).map(customSz => `
                <button type="button" class="admin-size-pill active" data-size="${customSz}">
                  ${customSz}
                </button>
              `).join('')}
            </div>

            <!-- Custom Size Input -->
            <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
              <input type="text" id="customSizeInput" class="input-field" placeholder="Custom size (e.g. Free Size, 4XL)" style="font-size: 0.8rem; padding: 0.5rem 0.75rem;" />
              <button type="button" id="addCustomSizeBtn" class="btn-secondary" style="white-space: nowrap; padding: 0.5rem 1rem; font-size: 0.75rem;">+ ADD SIZE</button>
            </div>
          </div>

          <!-- Product Description (Multiline Text Area with AI Trigger) -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; font-weight: 600;">PRODUCT DESCRIPTION *</label>
              <button type="button" id="aiGenDescBtn" title="Analyze uploaded photo with AI" style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;">
                ✨ Auto-Generate with AI
              </button>
            </div>
            <textarea 
              id="pDesc" 
              required 
              class="input-field" 
              rows="3" 
              placeholder="e.g. A comfortable everyday T-shirt made from soft, breathable cotton. Designed with a clean regular fit and classic round neck, making it easy to pair with jeans, trousers, or shorts."
              style="width: 100%; resize: vertical; line-height: 1.6; font-size: 0.85rem;"
            >${p.description || ''}</textarea>
          </div>

          <!-- Product Highlights (Separate Bullet List with Add/Remove and AI Trigger) -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; font-weight: 600;">PRODUCT HIGHLIGHTS</label>
              <button type="button" id="aiGenHlBtn" title="Extract 4-6 highlights with AI" style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;">
                ✨ Auto-Generate with AI
              </button>
            </div>

            <div id="adminHighlightsContainer" style="display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 0.75rem;">
              <!-- Dynamic Highlight Input Rows -->
            </div>

            <button type="button" id="addHighlightBtn" class="btn-secondary" style="padding: 0.55rem 1.1rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.5rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              ADD HIGHLIGHT
            </button>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: 1rem;">
            <button type="button" class="btn-secondary" id="cancelFormBtn">CANCEL</button>
            <button type="submit" class="btn-primary">${isEdit ? 'SAVE CHANGES' : 'CREATE PRODUCT'}</button>
          </div>
        </form>
      </div>
    `;

    // Dynamic UI Handlers for Thumbnails List
    const thumbsContainer = document.getElementById('adminUploadThumbs');

    const deleteImage = (index) => {
      const img = uploadedImages[index];
      uploadedImages.splice(index, 1);
      renderThumbnails();

      // Clean up Supabase Storage file in background if possible
      if (img.url && img.url.includes('/storage/v1/object/public/product-images/')) {
        supabaseService.deleteProductImage(img.url).then(res => {
          if (!res.success) console.warn('Failed to delete image from storage:', res.error);
        });
      }
    };

    const initDraggableThumbs = () => {
      if (!thumbsContainer) return;
      const thumbEls = Array.from(thumbsContainer.querySelectorAll('.admin-upload-thumb'));
      if (thumbEls.length <= 1) return;

      thumbEls.forEach((el) => {
        const idx = parseInt(el.dataset.index);
        if (uploadedImages[idx].uploading) return;

        Draggable.create(el, {
          type: "x,y",
          bounds: thumbsContainer,
          edgeResistance: 0.65,
          onPress: function() {
            el.classList.add('dragging');
            gsap.set(el, { zIndex: 100 });
          },
          onRelease: function() {
            el.classList.remove('dragging');
            gsap.set(el, { zIndex: '' });

            const items = Array.from(thumbsContainer.querySelectorAll('.admin-upload-thumb'));
            const rects = items.map(item => {
              const rect = item.getBoundingClientRect();
              return {
                index: parseInt(item.dataset.index),
                left: rect.left + window.scrollX,
                top: rect.top + window.scrollY
              };
            });

            // Sort left-to-right (handles multi-row wraps using top thresholds)
            rects.sort((a, b) => {
              if (Math.abs(a.top - b.top) > 30) {
                return a.top - b.top;
              }
              return a.left - b.left;
            });

            const orderChanged = rects.some((r, i) => r.index !== i);
            if (orderChanged) {
              const reordered = rects.map(r => uploadedImages[r.index]);
              uploadedImages = reordered;
              renderThumbnails();
            } else {
              gsap.set(el, { x: 0, y: 0 });
            }
          }
        });
      });
    };

    const renderThumbnails = () => {
      if (!thumbsContainer) return;

      // Kill any active Draggable instances on elements to prevent leaks
      thumbsContainer.querySelectorAll('.admin-upload-thumb').forEach(el => {
        const drag = Draggable.get(el);
        if (drag) drag.kill();
      });

      if (uploadedImages.length === 0) {
        thumbsContainer.innerHTML = `
          <div style="color: var(--text-muted); font-size: 0.8rem; padding: 1.5rem; text-align: center; width: 100%;">
            No images uploaded yet.
          </div>
        `;
        return;
      }

      thumbsContainer.innerHTML = uploadedImages.map((img, idx) => {
        let badgeClass = '';
        let badgeText = '';
        if (idx === 0) {
          badgeClass = 'primary';
          badgeText = 'PRIMARY';
        } else if (idx === 1) {
          badgeClass = 'hover';
          badgeText = 'HOVER';
        } else {
          badgeText = `LOOK ${String(idx + 1).padStart(2, '0')}`;
        }

        return `
          <div class="admin-upload-thumb" data-index="${idx}">
            <img src="${img.url}" alt="Thumbnail ${idx}" />
            <button type="button" class="remove-btn" data-index="${idx}">&times;</button>
            ${img.uploading ? `
              <div class="progress-overlay">
                <div class="spinner"></div>
                <div class="progress-text">UPLOADING</div>
              </div>
            ` : ''}
            ${img.error ? `
              <div class="progress-overlay" style="background: rgba(239, 68, 68, 0.85);">
                <div style="font-size: 14px; margin-bottom: 2px;">⚠️</div>
                <div class="progress-text">FAILED</div>
              </div>
            ` : ''}
            <div class="status-badge ${badgeClass}">${badgeText}</div>
          </div>
        `;
      }).join('');

      thumbsContainer.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index);
          deleteImage(idx);
        });
      });

      initDraggableThumbs();
    };

    let renderHighlightsGlobal = null;

    const triggerAIAnalysis = async (fileOrUrl) => {
      const aiStatus = document.getElementById('aiStatusContainer');
      if (aiStatus) {
        aiStatus.style.display = 'block';
        aiStatus.style.background = 'rgba(56, 189, 248, 0.08)';
        aiStatus.style.border = '1px solid rgba(56, 189, 248, 0.25)';
        aiStatus.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.65rem; color: #38bdf8;">
            <div class="spinner" style="width: 15px; height: 15px; border: 2px solid rgba(56, 189, 248, 0.25); border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0;"></div>
            <span>✨ <strong>AI Vision:</strong> Analyzing T-shirt image features & generating description + highlights...</span>
          </div>
        `;
      }

      const aiResult = await ProductImageAI.analyzeImage(fileOrUrl);

      if (!aiStatus) return;

      if (aiResult.success) {
        // Auto-populate description
        const descEl = document.getElementById('pDesc');
        if (descEl) {
          descEl.value = aiResult.description;
          descEl.style.transition = 'border-color 0.4s ease';
          descEl.style.borderColor = '#38bdf8';
          setTimeout(() => descEl.style.borderColor = '', 1200);
        }

        // Auto-populate highlights
        highlightsList = [...aiResult.highlights];
        if (typeof renderHighlightsGlobal === 'function') {
          renderHighlightsGlobal();
        }

        aiStatus.style.background = 'rgba(16, 185, 129, 0.08)';
        aiStatus.style.border = '1px solid rgba(16, 185, 129, 0.25)';
        aiStatus.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; color: #10b981;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span>✨</span>
              <span><strong>AI Analysis Complete:</strong> Generated Description & ${aiResult.highlights.length} Highlights based on image. You can edit them below!</span>
            </div>
            <button type="button" style="background: none; border: none; color: #10b981; cursor: pointer; font-size: 1.2rem; line-height: 1; padding: 0 0.3rem;" onclick="this.closest('#aiStatusContainer').style.display='none'">&times;</button>
          </div>
        `;
        store.showToast("✨ AI generated description & highlights from uploaded image!");
      } else {
        aiStatus.style.background = 'rgba(239, 68, 68, 0.08)';
        aiStatus.style.border = '1px solid rgba(239, 68, 68, 0.25)';
        aiStatus.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; color: #ef4444;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span>⚠️</span>
              <span>${aiResult.error || 'Could not analyze image'}. You can enter description & highlights manually.</span>
            </div>
            <button type="button" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem; line-height: 1; padding: 0 0.3rem;" onclick="this.closest('#aiStatusContainer').style.display='none'">&times;</button>
          </div>
        `;
      }
    };

    const handleFiles = (files) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      let firstValidFile = null;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!allowedTypes.includes(file.type)) {
          store.showToast(`Invalid format for "${file.name}". Only JPG, PNG, and WEBP are allowed.`, 'error');
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          store.showToast(`"${file.name}" exceeds the 5MB file size limit.`, 'error');
          continue;
        }

        if (!firstValidFile) firstValidFile = file;

        const tempId = Math.random().toString();
        const tempUrl = URL.createObjectURL(file);
        const imgObj = {
          url: tempUrl,
          id: tempId,
          file: file,
          uploading: true,
          error: false
        };

        uploadedImages.push(imgObj);
        renderThumbnails();

        supabaseService.uploadProductImage(file).then(res => {
          if (res.success) {
            imgObj.url = res.url;
            imgObj.uploading = false;
          } else {
            imgObj.uploading = false;
            imgObj.error = true;
            store.showToast(`Upload failed for "${file.name}": ${res.error}`, 'error');
          }
          renderThumbnails();
        }).catch(err => {
          imgObj.uploading = false;
          imgObj.error = true;
          store.showToast(`Upload failed for "${file.name}"`, 'error');
          renderThumbnails();
        });
      }

      // Automatically analyze first uploaded image with AI
      if (firstValidFile) {
        triggerAIAnalysis(firstValidFile);
      }
    };

    const setupUploadEvents = () => {
      const zone = document.getElementById('adminUploadZone');
      const fileInput = document.getElementById('pFileInput');
      if (!zone || !fileInput) return;

      zone.addEventListener('click', () => fileInput.click());

      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
      });

      zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFiles(e.target.files);
        }
      });
    };

    const setupSizeEvents = () => {
      const sizeSelector = document.getElementById('adminSizeSelector');
      if (sizeSelector) {
        sizeSelector.addEventListener('click', (e) => {
          const pill = e.target.closest('.admin-size-pill');
          if (!pill) return;
          const sz = pill.dataset.size;
          if (selectedSizes.includes(sz)) {
            selectedSizes = selectedSizes.filter(s => s !== sz);
            pill.classList.remove('active');
          } else {
            selectedSizes.push(sz);
            pill.classList.add('active');
          }
        });
      }

      const customInput = document.getElementById('customSizeInput');
      const addCustomBtn = document.getElementById('addCustomSizeBtn');
      if (addCustomBtn && customInput && sizeSelector) {
        const handleAddCustomSize = () => {
          const val = customInput.value.trim().toUpperCase();
          if (!val) return;
          if (!selectedSizes.includes(val)) {
            selectedSizes.push(val);
            const newBtn = document.createElement('button');
            newBtn.type = 'button';
            newBtn.className = 'admin-size-pill active';
            newBtn.dataset.size = val;
            newBtn.innerText = val;
            sizeSelector.appendChild(newBtn);
          }
          customInput.value = '';
        };

        addCustomBtn.addEventListener('click', handleAddCustomSize);
        customInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustomSize();
          }
        });
      }
    };

    const setupHighlightsEvents = () => {
      const container = document.getElementById('adminHighlightsContainer');
      const addBtn = document.getElementById('addHighlightBtn');

      const syncValues = () => {
        if (!container) return;
        const inputs = container.querySelectorAll('.highlight-input');
        if (inputs.length > 0) {
          highlightsList = Array.from(inputs).map(inp => inp.value);
        }
      };

      const renderHighlights = () => {
        if (!container) return;
        if (highlightsList.length === 0) {
          container.innerHTML = `
            <div style="font-size: 0.78rem; color: var(--text-muted); padding: 0.75rem 1rem; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-color); border-radius: 8px; text-align: center;">
              No highlights added yet. Click <strong>"+ ADD HIGHLIGHT"</strong> to create bullet points.
            </div>
          `;
          return;
        }

        container.innerHTML = highlightsList.map((hl, idx) => `
          <div class="admin-highlight-row" style="display: flex; gap: 0.5rem; align-items: center;" data-index="${idx}">
            <span style="color: var(--accent-gold); font-size: 1.1rem; line-height: 1; user-select: none;">&bull;</span>
            <input 
              type="text" 
              class="input-field highlight-input" 
              value="${hl.replace(/"/g, '&quot;')}" 
              placeholder="e.g. 100% Cotton, Regular Fit, Machine Washable" 
              style="flex: 1; font-size: 0.82rem; padding: 0.55rem 0.8rem;" 
            />
            <button 
              type="button" 
              class="btn-secondary remove-highlight-btn" 
              data-index="${idx}" 
              title="Remove highlight" 
              style="padding: 0.55rem 0.75rem; color: var(--accent-danger, #ef4444); border-color: rgba(239,68,68,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer;"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        `).join('');

        // Wire remove buttons
        container.querySelectorAll('.remove-highlight-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            syncValues();
            const removeIdx = parseInt(btn.getAttribute('data-index'));
            highlightsList.splice(removeIdx, 1);
            renderHighlights();
          });
        });

        // Wire inputs on change
        container.querySelectorAll('.highlight-input').forEach((inp, i) => {
          inp.addEventListener('input', (e) => {
            highlightsList[i] = e.target.value;
          });
        });
      };

      renderHighlightsGlobal = renderHighlights;

      // Add highlight button
      addBtn?.addEventListener('click', () => {
        syncValues();
        highlightsList.push('');
        renderHighlights();
        const inputs = container.querySelectorAll('.highlight-input');
        if (inputs.length > 0) {
          inputs[inputs.length - 1].focus();
        }
      });

      renderHighlights();
    };

    // Connect manual AI trigger buttons
    document.getElementById('aiGenDescBtn')?.addEventListener('click', () => {
      const primaryImg = uploadedImages.find(img => !img.error && img.url);
      if (primaryImg) {
        triggerAIAnalysis(primaryImg.file || primaryImg.url);
      } else {
        store.showToast("Please upload a product photo first to analyze with AI.", 'error');
      }
    });

    document.getElementById('aiGenHlBtn')?.addEventListener('click', () => {
      const primaryImg = uploadedImages.find(img => !img.error && img.url);
      if (primaryImg) {
        triggerAIAnalysis(primaryImg.file || primaryImg.url);
      } else {
        store.showToast("Please upload a product photo first to analyze with AI.", 'error');
      }
    });

    // Initial render and setup
    renderThumbnails();
    setupUploadEvents();
    setupSizeEvents();
    setupHighlightsEvents();

    setTimeout(() => modal.classList.add('active'), 10);

    document.getElementById('closeFormBtn')?.addEventListener('click', () => modal.classList.remove('active'));
    document.getElementById('cancelFormBtn')?.addEventListener('click', () => modal.classList.remove('active'));

    document.getElementById('productSaveForm')?.addEventListener('submit', (e) => {
      e.preventDefault();

      const isUploading = uploadedImages.some(img => img.uploading);
      if (isUploading) {
        store.showToast("Please wait for all images to finish uploading before saving.", 'error');
        return;
      }

      const validImages = uploadedImages.filter(img => !img.error && img.url);
      const parsedImgs = validImages.map(img => img.url);

      if (parsedImgs.length === 0) {
        store.showToast("At least one product image is required.", 'error');
        return;
      }

      if (selectedSizes.length === 0) {
        store.showToast("Please select at least one available size for this product.", 'error');
        return;
      }

      // Collect highlights from inputs
      const highlightInputs = document.querySelectorAll('#adminHighlightsContainer .highlight-input');
      const finalHighlights = Array.from(highlightInputs)
        .map(input => input.value.trim())
        .filter(val => val.length > 0);

      const formData = {
        name: document.getElementById('pName').value,
        category: document.getElementById('pCategory').value,
        price: parseFloat(document.getElementById('pPrice').value),
        stockQty: parseInt(document.getElementById('pStockQty').value),
        isNewArrival: document.getElementById('pIsNewArrival')?.checked,
        imagePrimary: parsedImgs[0] || 'assets/tee_acid_wash.jpg',
        imageHover: parsedImgs[1] || parsedImgs[0] || 'assets/tee_acid_wash_hover.jpg',
        images: parsedImgs,
        description: document.getElementById('pDesc').value.trim(),
        highlights: finalHighlights,
        inStock: parseInt(document.getElementById('pStockQty').value) > 0,
        badge: isEdit ? p.badge : 'NEW',
        fit: p.fit || 'Boxy Fit',
        sizes: selectedSizes
      };

      if (isEdit) {
        store.updateProduct(p.id, formData);
        store.showToast(`Updated product "${formData.name}"`);
      } else {
        store.addProduct(formData);
        store.showToast(`Created new product "${formData.name}"`);
      }

      modal.classList.remove('active');
      reRenderCallback();
    });
  }

  attachEvents(reRenderCallback) {
    // Step 1: Admin Phone Form Submission
    const adminPhoneForm = document.getElementById('adminPhoneForm');
    if (adminPhoneForm) {
      adminPhoneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawDigits = document.getElementById('adminMobileInput').value.trim();
        const errEl = document.getElementById('adminAuthErr');

        if (rawDigits.length < 10) {
          if (errEl) {
            errEl.innerText = "Please enter a valid 10-digit mobile number";
            errEl.style.display = 'block';
          }
          return;
        }

        this.adminPhone = rawDigits.startsWith('+') ? rawDigits : `+91 ${rawDigits}`;

        // Request SMS OTP via Supabase client
        const res = await supabaseService.sendSMSOTP(this.adminPhone);
        if (res.isDevMode) {
          store.showToast(res.message);
        }

        this.loginStep = 2;
        reRenderCallback();
        this.startAdminTimer();
      });
    }

    // Step 2: 6-Digit Admin OTP Box Navigation & Auto-Submit
    const boxes = document.querySelectorAll('#adminOtpForm .otp-box');
    if (boxes.length > 0) {
      boxes[0].focus();

      boxes.forEach((box, idx) => {
        box.addEventListener('input', (e) => {
          const val = e.target.value;
          if (val && idx < 5) {
            boxes[idx + 1].focus();
          }

          const currentCode = Array.from(boxes).map(b => b.value).join('');
          if (currentCode.length === 6) {
            this.handleAdminOTPVerify(currentCode, reRenderCallback);
          }
        });

        box.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !box.value && idx > 0) {
            boxes[idx - 1].focus();
          }
        });

        box.addEventListener('paste', (e) => {
          e.preventDefault();
          const pasted = (e.clipboardData || window.clipboardData).getData('text').trim();
          if (/^\d{6}$/.test(pasted)) {
            pasted.split('').forEach((digit, i) => {
              if (boxes[i]) boxes[i].value = digit;
            });
            boxes[5].focus();
            this.handleAdminOTPVerify(pasted, reRenderCallback);
          }
        });
      });
    }

    const adminOtpForm = document.getElementById('adminOtpForm');
    if (adminOtpForm) {
      adminOtpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = Array.from(document.querySelectorAll('#adminOtpForm .otp-box')).map(b => b.value).join('');
        this.handleAdminOTPVerify(code, reRenderCallback);
      });
    }

    // Back to Step 1
    document.getElementById('adminChangeNumBtn')?.addEventListener('click', () => {
      this.loginStep = 1;
      reRenderCallback();
    });

    // Resend OTP
    document.getElementById('adminResendOtpBtn')?.addEventListener('click', async () => {
      const res = await supabaseService.sendSMSOTP(this.adminPhone);
      store.showToast(res.message);
      this.startAdminTimer();
    });

    // Logout
    document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
      this.isAuthenticated = false;
      this.loginStep = 1;
      localStorage.removeItem('tm_admin_auth');
      localStorage.removeItem('tm_logged_admin');
      reRenderCallback();
    });

    // Tab buttons
    document.getElementById('tabProductsBtn')?.addEventListener('click', () => {
      this.activeTab = 'products';
      reRenderCallback();
    });

    document.getElementById('tabOrdersBtn')?.addEventListener('click', () => {
      this.activeTab = 'orders';
      reRenderCallback();
    });

    document.getElementById('tabAnalyticsBtn')?.addEventListener('click', () => {
      this.activeTab = 'analytics';
      reRenderCallback();
    });

    document.getElementById('tabAdminUsersBtn')?.addEventListener('click', () => {
      this.activeTab = 'admin_users';
      reRenderCallback();
    });

    // Create Admin button
    document.getElementById('createAdminBtn')?.addEventListener('click', () => {
      this.openAddAdminModal(reRenderCallback);
    });

    // Delete Admin button
    document.querySelectorAll('.delete-admin-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const username = btn.getAttribute('data-username');
        if (confirm(`Revoke admin access for @${username}?`)) {
          store.deleteAdminAccount(username);
          reRenderCallback();
        }
      });
    });

    // Add product button
    document.getElementById('addNewProductBtn')?.addEventListener('click', () => {
      this.openAddEditModal(null, reRenderCallback);
    });

    // Toggle stock button
    document.querySelectorAll('.toggle-stock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        store.toggleStock(id);
        reRenderCallback();
      });
    });

    // Toggle New Arrival button
    document.querySelectorAll('.toggle-arrival-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        store.toggleNewArrival(id);
        reRenderCallback();
      });
    });

    document.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const p = store.getProductById(id);
        this.openAddEditModal(p, reRenderCallback);
      });
    });

    document.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm("Are you sure you want to delete this product from Tee Matrix store?")) {
          store.deleteProduct(id);
          store.showToast("Product deleted from store");
          reRenderCallback();
        }
      });
    });
  }

  startAdminTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerCountdown = 30;
    const timerContainer = document.getElementById('adminTimerContainer');
    const timerCount = document.getElementById('adminTimerCount');
    const resendBtn = document.getElementById('adminResendOtpBtn');

    if (timerContainer) timerContainer.style.display = 'inline';
    if (resendBtn) resendBtn.style.display = 'none';

    this.timerInterval = setInterval(() => {
      this.timerCountdown--;
      if (timerCount) timerCount.innerText = `${this.timerCountdown}s`;

      if (this.timerCountdown <= 0) {
        clearInterval(this.timerInterval);
        if (timerContainer) timerContainer.style.display = 'none';
        if (resendBtn) resendBtn.style.display = 'inline';
      }
    }, 1000);
  }

  async handleAdminOTPVerify(code, reRenderCallback) {
    const errEl = document.getElementById('adminAuthErr');
    const boxContainer = document.getElementById('adminOtpBoxContainer');

    if (code.length < 6) {
      if (errEl) {
        errEl.innerText = "Please enter all 6 digits of the OTP";
        errEl.style.display = 'block';
      }
      return;
    }

    // 1. Verify 6-digit OTP
    const otpRes = await supabaseService.verifySMSOTP(this.adminPhone, code);

    if (!otpRes.success) {
      if (boxContainer) {
        boxContainer.classList.add('otp-error');
        setTimeout(() => boxContainer.classList.remove('otp-error'), 800);
      }
      if (errEl) {
        errEl.innerText = otpRes.message || "Invalid 6-digit OTP code";
        errEl.style.display = 'block';
      }
      return;
    }

    // 2. Check phone number against authorized admin_numbers table & owner whitelist
    const adminCheck = await supabaseService.verifyAdminNumber(this.adminPhone);

    if (adminCheck.success) {
      this.isAuthenticated = true;
      localStorage.setItem('tm_admin_auth', 'true');
      localStorage.setItem('tm_logged_admin', this.adminPhone);
      store.showToast(`Welcome Master Admin (${this.adminPhone})`);
      reRenderCallback();
    } else {
      // OTP was valid but number is unauthorized
      if (boxContainer) {
        boxContainer.classList.add('otp-error');
        setTimeout(() => boxContainer.classList.remove('otp-error'), 800);
      }
      if (errEl) {
        errEl.innerText = adminCheck.message || "This number isn't authorized for admin access";
        errEl.style.display = 'block';
      }
    }
  }
}

