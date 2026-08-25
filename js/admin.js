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
    // Orders live in Supabase, not in this browser. render() is synchronous, so the list is
    // fetched once after the dashboard mounts and cached here; null means "not loaded yet",
    // which the renderer shows as a loading row rather than "No orders registered yet."
    this.remoteOrders = null;
    this.ordersError = null;
    this.ordersLoading = false;
  }

  render() {
    // Strict Guard Rule: check if admin authentication session exists
    this.isAuthenticated = localStorage.getItem('tm_admin_auth') === 'true';
    
    if (!this.isAuthenticated) {
      // If user has an active Supabase session (e.g. from Google login), attempt transparent verification
      supabaseService.getAccessToken().then(token => {
        if (token && !this.isAuthenticated) {
          supabaseService.verifyAdminSession().then(check => {
            if (check.success) {
              this.isAuthenticated = true;
              localStorage.setItem('tm_admin_auth', 'true');
              localStorage.setItem('tm_logged_admin', check.adminIdentifier || check.email || check.phone);
              const container = document.getElementById('mainContent') || document.querySelector('main');
              if (container && (window.location.hash === '#admin' || window.location.pathname.includes('admin'))) {
                container.innerHTML = this.render();
                this.attachEvents(() => {
                  container.innerHTML = this.render();
                });
              }
            }
          });
        }
      });
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
        <div style="position: relative; z-index: 10; width: 100%; max-width: 420px; background: #ffffff; border-radius: 24px; padding: 2.75rem 2.25rem 2rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); text-align: center; color: #0f172a;">
          
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
              ? 'Sign in with your authorized Google Account (Gmail) or registered mobile number.' 
              : `Enter the 6-digit OTP code sent to<br/><strong style="color: #0f172a;">${this.adminPhone}</strong>`}
          </p>

          ${this.loginStep === 1 ? `
            <!-- Google Sign-In for Instant Admin Access -->
            <button 
              type="button" 
              id="adminGoogleLoginBtn" 
              style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.85rem 1.25rem; background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; margin-bottom: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08);"
              onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#94a3b8';"
              onmouseout="this.style.background='#ffffff'; this.style.borderColor='#cbd5e1';"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google (Admin)</span>
            </button>

            <!-- Divider -->
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
              <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
              <span style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">or mobile OTP</span>
              <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
            </div>

            <!-- Step 1: Admin Phone Form -->
            <form id="adminPhoneForm" style="display: flex; flex-direction: column; text-align: left;">
              <div style="margin-bottom: 1.25rem;">
                <label style="font-size: 0.75rem; color: #64748b; font-weight: 600; display: block; margin-bottom: 0.4rem;">ADMIN MOBILE NUMBER</label>
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

  // Fetches the authoritative order list from the server (service-role read behind requireAdmin).
  // store.getOrders() only ever returned this browser's localStorage, so it could not show orders
  // placed by customers. Returns true when the cache changed and a re-render is worth doing.
  async loadOrders() {
    if (this.ordersLoading) return false;
    this.ordersLoading = true;
    try {
      const token = await supabaseService.getAccessToken();
      if (!token) {
        this.ordersError = 'Admin session expired. Please re-authenticate to load orders.';
        this.remoteOrders = [];
        return true;
      }
      const res = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        this.ordersError = data.error || 'Failed to load orders';
        this.remoteOrders = [];
        return true;
      }
      this.remoteOrders = Array.isArray(data.orders) ? data.orders : [];
      this.ordersError = null;
      return true;
    } catch (err) {
      this.ordersError = 'Network error while loading orders';
      this.remoteOrders = [];
      return true;
    } finally {
      this.ordersLoading = false;
    }
  }

  renderDashboard() {
    const products = store.getProducts();
    const orders = this.remoteOrders || [];
    const inStockCount = products.filter(p => p.inStock).length;
    // Revenue counts settled money only. Summing every row here would bill rejected UTRs and
    // abandoned Razorpay attempts as sales.
    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const ordersLabel = this.remoteOrders === null ? '…' : orders.length;
    const loggedAdmin = localStorage.getItem('tm_logged_admin') || 'Administrator';

    return `
      <div class="admin-container container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <span class="section-tag">CONTROL CENTER</span>
            <h1 class="brand-font" style="font-size: 2.5rem; color: #fff;">ADMIN DASHBOARD</h1>
          </div>
          <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
            <span style="font-size: 0.8rem; color: var(--text-muted); background: rgba(255,255,255,0.06); border: 1px solid var(--border-color); padding: 0.45rem 1rem; border-radius: 999px; display: inline-flex; align-items: center; gap: 0.5rem;">
              <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #10b981;"></span>
              <strong>${loggedAdmin}</strong>
            </span>
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
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.5rem;">TOTAL SALES REVENUE (PAID)</span>
            <span style="font-size: 2.2rem; font-weight: 800; color: #fff; font-family: var(--font-heading);">₹${totalRevenue.toLocaleString('en-IN')}</span>
          </div>

          <div class="glass-panel" style="padding: 1.5rem;">
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.5rem;">ONLINE ORDERS</span>
            <span style="font-size: 2.2rem; font-weight: 800; color: var(--accent-silver); font-family: var(--font-heading);">${ordersLabel}</span>
          </div>
        </div>

        <!-- Dashboard Tab Bar -->
        <div style="display: flex; gap: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 2rem; flex-wrap: wrap;">
          <button class="pill-btn ${this.activeTab === 'products' ? 'active' : ''}" id="tabProductsBtn" style="padding: 0.8rem 1.8rem; font-size: 0.85rem;">
            PRODUCTS MANAGEMENT (${products.length})
          </button>
          <button class="pill-btn ${this.activeTab === 'orders' ? 'active' : ''}" id="tabOrdersBtn" style="padding: 0.8rem 1.8rem; font-size: 0.85rem;">
            CUSTOMER ORDERS (${ordersLabel})
          </button>
          <button class="pill-btn ${this.activeTab === 'payment_settings' ? 'active' : ''}" id="tabPaymentSettingsBtn" style="padding: 0.8rem 1.8rem; font-size: 0.85rem; border-color: var(--accent-gold); color: ${this.activeTab === 'payment_settings' ? '#000' : 'var(--accent-gold)'}">
            ⚙️ PAYMENT SETTINGS
          </button>
          <button class="pill-btn ${this.activeTab === 'analytics' ? 'active' : ''}" id="tabAnalyticsBtn" style="padding: 0.8rem 1.8rem; font-size: 0.85rem;">
            ANALYTICS & PORTFOLIO
          </button>
        </div>

        ${this.activeTab === 'products' ? this.renderProductsTab(products) : this.activeTab === 'orders' ? this.renderOrdersTab(orders) : this.activeTab === 'payment_settings' ? this.renderPaymentSettingsTab() : this.renderAnalyticsTab(products, orders)}
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
                  <td>
                    <span style="display: block; font-size: 0.9rem; font-weight: 700; color: ${p.stockQty > 0 ? '#fff' : '#ef4444'};">
                      ${p.stockQty} Total
                    </span>
                    <div style="font-size: 0.68rem; display: flex; flex-direction: column; gap: 0.2rem; margin-top: 0.35rem; min-width: 140px;">
                      ${(p.sizes || []).map(sz => {
                        const q = p.sizeStock?.[sz] !== undefined ? p.sizeStock[sz] : (p.stockQty > 0 ? 5 : 0);
                        return `
                          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.1rem 0.3rem; background: ${q > 0 ? 'rgba(255,255,255,0.04)' : 'rgba(239,68,68,0.1)'}; border: 1px solid ${q > 0 ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.25)'}; border-radius: 3px; color: ${q > 0 ? '#ccc' : '#ef4444'};">
                            <span><strong>${sz}</strong></span>
                            <span>${q > 0 ? `${q} in stock` : '0 — Out of Stock'}</span>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </td>
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
    const loading = this.remoteOrders === null;
    return `
      <div>
        <h2 style="font-size: 1.4rem; color: #fff; margin-bottom: 1.5rem;">ONLINE DISPATCH ORDERS (${loading ? '…' : orders.length})</h2>
        ${this.ordersError ? `
          <div style="margin-bottom: 1rem; padding: 0.85rem 1rem; border: 1px solid rgba(239,68,68,0.4); border-radius: 6px; color: var(--accent-danger); font-size: 0.82rem;">
            ${this.ordersError}
            <button class="btn-secondary" id="retryOrdersBtn" style="margin-left: 1rem; padding: 0.3rem 0.8rem; font-size: 0.7rem;">RETRY</button>
          </div>
        ` : ''}
        <div style="overflow-x: auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Payment Mode</th>
                <th>Payment Status</th>
                <th>Items (Size & Qty)</th>
                <th>Total</th>
                <th>Order Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${loading ? `
                <tr>
                  <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading orders from database…</td>
                </tr>
              ` : orders.length === 0 ? `
                <tr>
                  <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">No orders registered yet.</td>
                </tr>
              ` : orders.map(o => `
                <tr>
                  <td><strong style="color: #fff; font-family: monospace;">#${o.id}</strong></td>
                  <td style="color: var(--text-muted); font-size: 0.8rem;">${o.date}</td>
                  <td>
                    <strong style="color: #fff; display: block; font-size: 0.9rem;">${o.customerName}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${o.phone || o.email}</span>
                    <span style="font-size: 0.72rem; color: var(--text-secondary); display: block; margin-top: 0.2rem; max-width: 220px;">${o.address || ''}</span>
                  </td>
                  <td>
                    <span style="display: block; font-weight: 700; color: #fff; font-size: 0.85rem;">
                      ${o.paymentMethod || 'UPI'}
                    </span>
                    ${(o.paymentDetails?.submittedUtr || o.paymentDetails?.utr) ? `
                      <span style="font-size: 0.7rem; font-family: monospace; color: var(--accent-gold); display: block;">
                        UTR: ${o.paymentDetails.submittedUtr || o.paymentDetails.utr}
                      </span>
                    ` : ''}
                  </td>
                  <td>
                    <span class="badge ${o.paymentStatus === 'PAID' ? 'badge-stock' : (o.paymentStatus === 'PENDING_VERIFICATION' ? 'badge-gold' : (o.paymentStatus === 'FAILED' ? 'badge-out' : 'badge-silver'))}" style="font-size: 0.7rem;">
                      ${o.paymentStatus || 'PENDING'}
                    </span>
                    ${(o.stockWarnings && o.stockWarnings.length > 0) ? `
                      <span title="${o.stockWarnings.map(w => `${w.productId || '?'} ${w.size} x${w.qty}: ${w.reason}`).join(' | ')}" style="display: block; margin-top: 0.3rem; font-size: 0.68rem; color: var(--accent-danger); font-weight: 700;">
                        ⚠ STOCK NOT DECREMENTED (${o.stockWarnings.length}) — check inventory before dispatch
                      </span>
                    ` : ''}
                  </td>
                  <td style="font-size: 0.8rem; color: var(--text-secondary);">
                    ${Array.isArray(o.items) ? o.items.map(i => `
                      <div style="margin-bottom: 0.2rem;">
                        <span style="color: #fff;">${i.name}</span> <strong style="color: var(--accent-silver);">(${i.size || 'M'})</strong> &times; ${i.qty}
                      </div>
                    `).join('') : 'No items'}
                  </td>
                  <td style="color: #fff; font-weight: 700; font-size: 0.95rem;">₹${(o.total || 0).toLocaleString('en-IN')}</td>
                  <td>
                    <span style="font-size: 0.78rem; color: ${o.paymentStatus === 'PAID' ? 'var(--accent-success)' : (o.paymentStatus === 'FAILED' ? 'var(--accent-danger)' : 'var(--text-muted)')};">
                      ${o.status || 'Processing'}
                    </span>
                  </td>
                  <td>
                    ${o.paymentStatus === 'PENDING_VERIFICATION' ? `
                      <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                        <button class="btn-primary confirm-upi-order-btn" data-id="${o.id}" style="padding: 0.35rem 0.65rem; font-size: 0.7rem; background: #10b981; border-color: #10b981;">
                          ✓ Confirm Paid
                        </button>
                        <button class="btn-secondary reject-upi-order-btn" data-id="${o.id}" style="padding: 0.3rem 0.6rem; font-size: 0.68rem; color: var(--accent-danger); border-color: rgba(239,68,68,0.4);">
                          ✕ Reject UTR
                        </button>
                      </div>
                    ` : (o.paymentStatus === 'COD_PENDING' ? `
                      <button class="btn-primary confirm-cod-order-btn" data-id="${o.id}" style="padding: 0.35rem 0.65rem; font-size: 0.7rem; background: #3b82f6; border-color: #3b82f6;">
                        ✓ Mark Delivered & Paid
                      </button>
                    ` : (o.paymentStatus === 'FAILED' ? `
                      <span style="font-size: 0.75rem; color: var(--accent-danger);">Payment Rejected</span>
                    ` : `
                      <span style="font-size: 0.75rem; color: var(--accent-success);">Verified ✓</span>
                    `))}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderPaymentSettingsTab() {
    const config = store.getPaymentConfig();

    return `
      <div>
        <div style="margin-bottom: 2rem;">
          <h2 style="font-size: 1.4rem; color: #fff; margin-bottom: 0.5rem;">PAYMENT GATEWAY CONFIGURATION</h2>
          <span style="font-size: 0.82rem; color: var(--text-muted);">Configure merchant UPI details, Razorpay credentials, COD policies, and tax options.</span>
        </div>

        <form id="paymentConfigForm" style="max-width: 680px; display: flex; flex-direction: column; gap: 1.5rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); padding: 2rem; border-radius: 8px;">
          
          <!-- UPI Settings Card -->
          <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1.5rem;">
            <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
              ⚡ UPI Direct & Dynamic QR Settings
            </h3>
            
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div>
                <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.35rem; font-weight: 600;">
                  MERCHANT UPI ID / VPA *
                </label>
                <input type="text" id="adminMerchantUpi" required class="input-field" value="${config.merchantUpiVpa || 'teematrix@okaxis'}" placeholder="e.g. yourname@okaxis or business@upi" />
                <span style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 0.3rem;">
                  All customer UPI payments and dynamic QR codes will route directly to this UPI address.
                </span>
              </div>

              <div>
                <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.35rem; font-weight: 600;">
                  BUSINESS DISPLAY NAME *
                </label>
                <input type="text" id="adminMerchantName" required class="input-field" value="${config.merchantName || 'TEE MATRIX ATELIER'}" placeholder="e.g. TEE MATRIX ATELIER" />
              </div>
            </div>
          </div>

          <!-- Razorpay Settings Card -->
          <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1.5rem;">
            <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
              💳 Razorpay Gateway (Cards / NetBanking / International)
            </h3>
            
            <div>
              <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.35rem; font-weight: 600;">
                PUBLIC RAZORPAY KEY ID
              </label>
              <input type="text" id="adminRazorpayKeyId" class="input-field" value="${config.razorpayKeyId || ''}" placeholder="rzp_live_..." />
              <span style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 0.3rem;">
                Card & NetBanking tab is enabled automatically when this key is present. Secret key is kept safely on server.
              </span>
            </div>
          </div>

          <!-- COD & GST Settings -->
          <div>
            <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 1rem;">
              📦 Order Policies & Tax Settings
            </h3>

            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; color: #fff; font-size: 0.85rem;">
                <input type="checkbox" id="adminEnableCod" ${config.enableCOD !== false ? 'checked' : ''} style="width: 18px; height: 18px;" />
                <span>Enable <strong>Cash on Delivery (COD)</strong> option at checkout</span>
              </label>

              <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; color: #fff; font-size: 0.85rem;">
                <input type="checkbox" id="adminEnableGst" ${config.enableGST ? 'checked' : ''} style="width: 18px; height: 18px;" />
                <span>Enable <strong>GST Tax calculation & invoice line</strong> (Leave unchecked if not GST registered)</span>
              </label>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
            <button type="submit" class="btn-primary" id="savePaymentConfigBtn" style="padding: 0.8rem 2rem; font-size: 0.8rem;">
              SAVE PAYMENT SETTINGS
            </button>
          </div>
        </form>
      </div>
    `;
  }

  renderAnalyticsTab(products, allOrders) {
    // Sales analytics count settled orders only, matching the dashboard revenue metric. Rejected
    // UTRs and abandoned Razorpay attempts are rows in the table but they are not sales.
    const orders = (allOrders || []).filter(o => o.paymentStatus === 'PAID');

    // 1. Overall Calculations
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalUnitsSold = orders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + i.qty, 0), 0);
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

    // State to store model image type disclosure ('product_only' | 'real_model' | 'ai_model')
    let modelImageType = p.modelImageType || 'product_only';

    // State to store per-size stock inventory
    let sizeStockMap = {};
    if (p.sizeStock && typeof p.sizeStock === 'object') {
      sizeStockMap = { ...p.sizeStock };
    } else {
      const initSizes = Array.isArray(p.sizes) ? p.sizes : ['S', 'M', 'L', 'XL'];
      initSizes.forEach(s => {
        sizeStockMap[s] = p.stockQty !== undefined ? Math.max(0, Math.floor(Number(p.stockQty) / initSizes.length)) : 10;
      });
    }

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
      <div class="modal-content glass-panel" style="max-width: 760px; padding: 2.2rem; max-height: 92vh; overflow-y: auto;">
        <button class="modal-close" id="closeFormBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-family: var(--font-heading); font-size: 1.8rem; color: #fff; margin-bottom: 0.3rem;">
            ${isEdit ? 'EDIT PRODUCT' : 'FAST PRODUCT CREATOR'}
          </h2>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0;">
            Upload T-shirt photo &rarr; AI analyzes visual features &rarr; Review & Save
          </p>
        </div>

        <form id="productSaveForm" style="display: flex; flex-direction: column; gap: 1.4rem;">
          
          <!-- STEP 1: PRODUCT IMAGE UPLOAD (TOP PRIORITY) -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--accent-gold); letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
                <span>📸</span> STEP 1 — PRODUCT IMAGE
              </span>
              <span style="font-size: 0.7rem; color: var(--accent-gold); font-weight: 600;">★ 1st Image = Primary (AI Analyzed)</span>
            </div>

            <div id="adminUploadZone" class="admin-upload-zone" style="padding: 2.2rem 1rem; border-width: 2px; border-style: dashed; text-align: center; cursor: pointer; transition: all 0.2s ease;">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 0.5rem;">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <div style="font-size: 0.95rem; font-weight: 600; color: #fff;">Drop T-Shirt photo here or browse</div>
              <small style="color: var(--text-muted); display: block; margin-top: 0.25rem;">AI will automatically analyze the Primary Image to generate product details</small>
              <input type="file" id="pFileInput" multiple accept="image/jpeg,image/png,image/webp" style="display: none;" />
            </div>

            <!-- AI Status Banner -->
            <div id="aiStatusContainer" style="display: none; margin-top: 0.75rem; padding: 0.85rem 1.1rem; border-radius: 8px; font-size: 0.82rem; transition: all 0.3s ease;">
              <!-- Populated Dynamically -->
            </div>

            <!-- Uploaded Image Thumbnails with Primary Designation -->
            <div id="adminUploadThumbs" class="admin-upload-thumbs" style="margin-top: 0.85rem;">
              <!-- Rendered Dynamically -->
            </div>
            
            <span style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 0.4rem;">
              The first thumbnail is the <strong>Primary Image</strong> used by AI. Click <strong>"★ Set as Primary"</strong> or drag any photo to the 1st slot to re-analyze.
            </span>

            <!-- AI-Generated Model Image Setting -->
            <div style="margin-top: 0.75rem; padding: 0.9rem 1rem; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                  Product Image Type
                </span>
                <span style="font-size: 0.7rem; color: var(--text-muted);">Select if an AI model is shown</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;" id="modelImageTypeSelector">
                <button type="button" class="btn-secondary model-type-btn ${modelImageType === 'product_only' ? 'active' : ''}" data-type="product_only" style="padding: 0.5rem 0.4rem; font-size: 0.75rem; border-radius: 6px; text-align: center;">
                  👕 Product Only
                </button>
                <button type="button" class="btn-secondary model-type-btn ${modelImageType === 'real_model' ? 'active' : ''}" data-type="real_model" style="padding: 0.5rem 0.4rem; font-size: 0.75rem; border-radius: 6px; text-align: center;">
                  🧍 Real Model
                </button>
                <button type="button" class="btn-secondary model-type-btn ${modelImageType === 'ai_model' ? 'active' : ''}" data-type="ai_model" style="padding: 0.5rem 0.4rem; font-size: 0.75rem; border-radius: 6px; text-align: center;">
                  ✨ AI-Generated Model
                </button>
              </div>
            </div>
          </div>

          <!-- STEP 2: AI-GENERATED PRODUCT INFO -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1.15rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #38bdf8; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
                <span>🤖</span> STEP 2 — PRODUCT NAME, DESCRIPTION & HIGHLIGHTS
              </span>
              <button type="button" id="reAnalyzeBtn" class="btn-secondary" style="font-size: 0.7rem; padding: 0.3rem 0.65rem; border-color: #38bdf8; color: #38bdf8;">
                ⚡ RE-ANALYZE IMAGE
              </button>
            </div>

            <!-- Product Name -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">PRODUCT NAME *</label>
                <span id="nameAiBadge" style="display: none; font-size: 0.68rem; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 0.15rem 0.45rem; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.25);">✨ AI Generated</span>
              </div>
              <input type="text" id="pName" required class="input-field" placeholder="e.g. Classic Black Relaxed Fit T-Shirt" value="${p.name || ''}" style="font-weight: 600; font-size: 0.95rem;" />
            </div>

            <!-- Product Description -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">PRODUCT DESCRIPTION</label>
                <span id="descAiBadge" style="display: none; font-size: 0.68rem; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 0.15rem 0.45rem; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.25);">✨ AI Generated</span>
              </div>
              <textarea id="pDesc" rows="3" class="input-field" placeholder="Short, professional description based on the T-shirt image..." style="resize: vertical; font-size: 0.85rem; line-height: 1.6;">${p.description || ''}</textarea>
            </div>

            <!-- Product Highlights -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">PRODUCT HIGHLIGHTS</label>
                  <span id="highlightsAiBadge" style="display: none; font-size: 0.68rem; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 0.15rem 0.45rem; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.25);">✨ AI Generated</span>
                </div>
                <button type="button" id="addHighlightBtn" class="btn-secondary" style="font-size: 0.72rem; padding: 0.3rem 0.65rem; white-space: nowrap;">
                  + ADD HIGHLIGHT
                </button>
              </div>

              <!-- Highlights Dynamic List -->
              <div id="adminHighlightsContainer" style="display: flex; flex-direction: column; gap: 0.45rem;">
                <!-- Populated dynamically -->
              </div>
            </div>
          </div>

          <!-- STEP 3: PRODUCT DETAILS & SPECIFICATIONS -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1.15rem;">
            <span style="font-size: 0.8rem; font-weight: 700; color: #a855f7; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
              <span>🏷️</span> STEP 3 — PRODUCT DETAILS & SPECIFICATIONS
            </span>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div>
                <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem; font-weight: 600;">CATEGORY</label>
                <select id="pCategory" class="sort-select" style="width: 100%;">
                  <option value="Graphic" ${p.category === 'Graphic' ? 'selected' : ''}>Graphic</option>
                  <option value="Acid Wash" ${p.category === 'Acid Wash' ? 'selected' : ''}>Acid Wash</option>
                  <option value="Heavyweight Minimal" ${p.category === 'Heavyweight Minimal' ? 'selected' : ''}>Heavyweight Minimal</option>
                  <option value="Vintage" ${p.category === 'Vintage' ? 'selected' : ''}>Vintage</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem; font-weight: 600;">PRICE (₹ INR) *</label>
                <input type="number" step="1" id="pPrice" required class="input-field" value="${p.price || 1299}" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div>
                <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem; font-weight: 600;">COLOUR / TONE</label>
                <input type="text" id="pColor" class="input-field" placeholder="e.g. Charcoal Grey" value="${p.color || ''}" />
              </div>
              <div>
                <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem; font-weight: 600;">PATTERN / DESIGN</label>
                <input type="text" id="pPattern" class="input-field" placeholder="e.g. Front Graphic Print" value="${p.pattern || ''}" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
              <div>
                <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem; font-weight: 600;">FIT</label>
                <input type="text" id="pFit" class="input-field" placeholder="e.g. Boxy Oversized Fit" value="${p.fit || 'Boxy Oversized Fit'}" />
              </div>
              <div>
                <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem; font-weight: 600;">NECK TYPE</label>
                <input type="text" id="pNeckType" class="input-field" placeholder="e.g. Round Neck" value="${p.neckType || 'Round Neck'}" />
              </div>
              <div>
                <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem; font-weight: 600;">SLEEVE TYPE</label>
                <input type="text" id="pSleeveType" class="input-field" placeholder="e.g. Short Sleeves" value="${p.sleeveType || 'Short Sleeves'}" />
              </div>
            </div>

            <!-- Size & Stock Section -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 10px; padding: 1.1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                <div>
                  <span style="font-size: 0.8rem; color: #fff; font-weight: 700; display: block;">AVAILABLE SIZES & STOCK *</span>
                  <span style="font-size: 0.7rem; color: var(--text-muted);">Enable sizes and set individual stock quantity per size</span>
                </div>
                <span id="adminTotalStockBadge" style="font-size: 0.75rem; font-weight: 700; color: var(--accent-gold); background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 0.25rem 0.6rem; border-radius: 12px;">
                  Total Stock: 0
                </span>
              </div>

              <!-- Size selector toggle pills -->
              <div class="admin-size-selector" id="adminSizeSelector" style="margin-bottom: 0.75rem;">
                <!-- Populated dynamically -->
              </div>

              <!-- Custom Size Adder -->
              <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                <input type="text" id="customSizeInput" class="input-field" placeholder="Add custom size (e.g. 4XL, Free Size)" style="font-size: 0.8rem; padding: 0.45rem 0.75rem; flex: 1;" />
                <button type="button" id="addCustomSizeBtn" class="btn-secondary" style="white-space: nowrap; padding: 0.45rem 0.9rem; font-size: 0.75rem;">+ ADD SIZE</button>
              </div>

              <!-- Per-Size Quantity Input Grid -->
              <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                <div style="font-size: 0.72rem; color: var(--text-secondary); margin-bottom: 0.6rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                  ENTER STOCK QUANTITY PER SIZE:
                </div>
                <div id="adminSizeStockGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(135px, 1fr)); gap: 0.6rem;">
                  <!-- Dynamically rendered per-size inputs -->
                </div>
              </div>
            </div>

            <!-- Homepage New Arrival Toggle -->
            <div style="padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.75rem; border-radius: 8px;">
              <input type="checkbox" id="pIsNewArrival" ${p.isNewArrival ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
              <label for="pIsNewArrival" style="color: #fff; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
                Feature in "New Arrivals" Section on Homepage
              </label>
            </div>
          </div>

          <!-- STEP 4: SAVE PRODUCT -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: 0.5rem;">
            <button type="button" class="btn-secondary" id="cancelFormBtn">CANCEL</button>
            <button type="submit" class="btn-primary" style="padding: 0.85rem 2rem; font-size: 0.9rem;">
              ${isEdit ? 'SAVE CHANGES' : 'CREATE PRODUCT'}
            </button>
          </div>
        </form>
      </div>
    `;

    const thumbsContainer = document.getElementById('adminUploadThumbs');

    // Dynamic UI Handlers for Thumbnails List
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

            const oldPrimaryId = uploadedImages[0]?.id || uploadedImages[0]?.url;
            const orderChanged = rects.some((r, i) => r.index !== i);
            if (orderChanged) {
              const reordered = rects.map(r => uploadedImages[r.index]);
              uploadedImages = reordered;
              renderThumbnails();

              const newPrimaryId = uploadedImages[0]?.id || uploadedImages[0]?.url;
              if (oldPrimaryId !== newPrimaryId && uploadedImages[0]) {
                // Primary image changed: re-analyze using the new Primary Image ONLY
                triggerAIAnalysis(uploadedImages[0].file || uploadedImages[0].url);
              }
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
        const isPrimary = idx === 0;
        const badgeClass = isPrimary ? 'primary' : (idx === 1 ? 'hover' : '');
        const badgeText = isPrimary ? '★ PRIMARY' : (idx === 1 ? 'HOVER' : `LOOK ${String(idx + 1).padStart(2, '0')}`);

        return `
          <div class="admin-upload-thumb ${isPrimary ? 'is-primary' : ''}" data-index="${idx}" style="${isPrimary ? 'border: 2px solid var(--accent-gold); box-shadow: 0 0 12px rgba(245,158,11,0.3); position: relative;' : 'position: relative;'}">
            <img src="${img.url}" alt="Thumbnail ${idx}" />
            <button type="button" class="remove-btn" data-index="${idx}">&times;</button>
            
            ${!isPrimary ? `
              <button type="button" class="make-primary-btn" data-index="${idx}" title="Set as Primary Image (AI will analyze this photo)" style="position: absolute; bottom: 6px; left: 4px; right: 4px; background: rgba(0,0,0,0.85); border: 1px solid rgba(245,158,11,0.4); color: #fff; font-size: 0.65rem; padding: 0.25rem 0.2rem; border-radius: 4px; cursor: pointer; text-align: center; font-weight: 700; z-index: 10; transition: all 0.2s ease;">
                ★ Set Primary
              </button>
            ` : ''}

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

      // Handle "Set as Primary" button click
      thumbsContainer.querySelectorAll('.make-primary-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index);
          if (idx > 0 && idx < uploadedImages.length) {
            const selectedPrimary = uploadedImages.splice(idx, 1)[0];
            uploadedImages.unshift(selectedPrimary);
            renderThumbnails();
            // Automatically re-run AI analysis on the new Primary Image ONLY
            triggerAIAnalysis(selectedPrimary.file || selectedPrimary.url);
          }
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
            <div class="spinner" style="width: 16px; height: 16px; border: 2px solid rgba(56, 189, 248, 0.25); border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0;"></div>
            <span style="font-weight: 600; font-size: 0.85rem;">Analyzing Primary Image...</span>
          </div>
        `;
      }

      // Analyze ONLY the Primary Image
      const aiResult = await ProductImageAI.analyzeImage(fileOrUrl);

      if (!aiStatus) return;

      if (aiResult.success) {
        // 1. Auto-populate Product Name
        const nameEl = document.getElementById('pName');
        if (nameEl) {
          nameEl.value = aiResult.name;
          nameEl.style.transition = 'border-color 0.4s ease';
          nameEl.style.borderColor = '#38bdf8';
          setTimeout(() => nameEl.style.borderColor = '', 1200);
        }

        // 2. Auto-populate Description (starts with product name)
        const descEl = document.getElementById('pDesc');
        if (descEl) {
          descEl.value = aiResult.description;
          descEl.style.transition = 'border-color 0.4s ease';
          descEl.style.borderColor = '#38bdf8';
          setTimeout(() => descEl.style.borderColor = '', 1200);
        }

        // 3. Auto-populate Highlights (4-6 bullets)
        highlightsList = [...aiResult.highlights];
        if (typeof renderHighlightsGlobal === 'function') {
          renderHighlightsGlobal();
        }

        // 4. Auto-populate Detected Attributes
        if (aiResult.attributes) {
          const catEl = document.getElementById('pCategory');
          if (catEl && aiResult.attributes.category) catEl.value = aiResult.attributes.category;

          const colorEl = document.getElementById('pColor');
          if (colorEl && aiResult.attributes.color) colorEl.value = aiResult.attributes.color;

          const patEl = document.getElementById('pPattern');
          if (patEl && aiResult.attributes.pattern) patEl.value = aiResult.attributes.pattern;

          const fitEl = document.getElementById('pFit');
          if (fitEl && aiResult.attributes.fit) fitEl.value = aiResult.attributes.fit;

          const neckEl = document.getElementById('pNeckType');
          if (neckEl && aiResult.attributes.neckType) neckEl.value = aiResult.attributes.neckType;

          const sleeveEl = document.getElementById('pSleeveType');
          if (sleeveEl && aiResult.attributes.sleeveType) sleeveEl.value = aiResult.attributes.sleeveType;
        }

        aiStatus.style.background = 'rgba(16, 185, 129, 0.08)';
        aiStatus.style.border = '1px solid rgba(16, 185, 129, 0.25)';
        aiStatus.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; color: #10b981;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span>✨</span>
              <span><strong>AI Analysis Complete (Primary Image):</strong> Generated Name ("${aiResult.name}"), Description, ${aiResult.highlights.length} Highlights & Specs. You can edit any field before saving.</span>
            </div>
            <button type="button" style="background: none; border: none; color: #10b981; cursor: pointer; font-size: 1.2rem; line-height: 1; padding: 0 0.3rem;" onclick="this.closest('#aiStatusContainer').style.display='none'">&times;</button>
          </div>
        `;
        store.showToast(`✨ Generated "${aiResult.name}" details from Primary Image!`);
      } else {
        aiStatus.style.background = 'rgba(239, 68, 68, 0.08)';
        aiStatus.style.border = '1px solid rgba(239, 68, 68, 0.25)';
        aiStatus.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; color: #ef4444;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span>⚠️</span>
              <span>${aiResult.error || 'Could not analyze Primary Image'}. You can enter details manually.</span>
            </div>
            <button type="button" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem; line-height: 1; padding: 0 0.3rem;" onclick="this.closest('#aiStatusContainer').style.display='none'">&times;</button>
          </div>
        `;
      }
    };

    const handleFiles = (files) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const wasEmpty = uploadedImages.length === 0;
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
        const imgObj = {
          url: '',
          id: tempId,
          file: file,
          uploading: true,
          error: false
        };

        uploadedImages.push(imgObj);

        // 1. Read as persistent Data URL immediately
        const reader = new FileReader();
        reader.onload = (e) => {
          if (!imgObj.url || imgObj.url.startsWith('blob:')) {
            imgObj.url = e.target.result;
          }
          renderThumbnails();
        };
        reader.readAsDataURL(file);

        // 2. Upload to Supabase Storage in parallel
        supabaseService.uploadProductImage(file).then(res => {
          if (res.success && res.url) {
            imgObj.url = res.url;
          }
          imgObj.uploading = false;
          imgObj.error = false;
          renderThumbnails();
        }).catch(err => {
          imgObj.uploading = false;
          imgObj.error = false;
          renderThumbnails();
        });
      }

      // Automatically trigger AI analysis ONLY if this upload set provides the Primary Image
      if (wasEmpty && firstValidFile) {
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

      // Model Image Type selector buttons
      modal.querySelectorAll('.model-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modelImageType = btn.dataset.type;
          modal.querySelectorAll('.model-type-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.type === modelImageType);
          });
        });
      });
    };

    const setupSizeEvents = () => {
      const sizeSelector = document.getElementById('adminSizeSelector');
      const gridEl = document.getElementById('adminSizeStockGrid');
      const badgeEl = document.getElementById('adminTotalStockBadge');
      const customInput = document.getElementById('customSizeInput');
      const addCustomBtn = document.getElementById('addCustomSizeBtn');

      const standardSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

      const renderSizeStockUI = () => {
        if (!sizeSelector || !gridEl) return;

        const currentSizes = Object.keys(sizeStockMap);
        const allKnownSizes = Array.from(new Set([...standardSizes, ...currentSizes]));

        // 1. Render Selector Pills
        sizeSelector.innerHTML = allKnownSizes.map(sz => {
          const isSelected = sizeStockMap[sz] !== undefined;
          return `
            <button type="button" class="admin-size-pill ${isSelected ? 'active' : ''}" data-size="${sz}">
              ${sz}
            </button>
          `;
        }).join('');

        // 2. Render Quantity Inputs Grid
        if (currentSizes.length === 0) {
          gridEl.innerHTML = `
            <div style="grid-column: 1 / -1; color: #ef4444; font-size: 0.75rem; padding: 0.5rem 0;">
              ⚠️ No sizes enabled. Click above to select at least one available size.
            </div>
          `;
        } else {
          gridEl.innerHTML = currentSizes.map(sz => {
            const qty = sizeStockMap[sz] !== undefined ? sizeStockMap[sz] : 5;
            const isOOS = qty === 0;
            return `
              <div class="size-stock-card" style="background: rgba(255,255,255,0.03); border: 1px solid ${isOOS ? 'rgba(239,68,68,0.4)' : 'var(--border-color)'}; border-radius: 6px; padding: 0.5rem 0.6rem; display: flex; flex-direction: column; gap: 0.35rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="color: #fff; font-size: 0.85rem;">Size ${sz}</strong>
                  ${isOOS ? `<span style="font-size: 0.62rem; color: #ef4444; font-weight: 700;">OUT OF STOCK</span>` : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 0.35rem;">
                  <span style="font-size: 0.7rem; color: var(--text-muted);">Qty:</span>
                  <input 
                    type="number" 
                    min="0" 
                    class="input-field size-qty-input" 
                    data-size="${sz}" 
                    value="${qty}" 
                    style="padding: 0.3rem 0.5rem; font-size: 0.82rem; font-weight: 700; text-align: center; width: 100%;" 
                  />
                </div>
              </div>
            `;
          }).join('');
        }

        // 3. Update Total Badge
        const totalStock = Object.values(sizeStockMap).reduce((s, q) => s + (parseInt(q) || 0), 0);
        if (badgeEl) {
          badgeEl.innerText = `Total Stock: ${totalStock} units`;
          badgeEl.style.color = totalStock > 0 ? 'var(--accent-gold)' : '#ef4444';
        }

        // 4. Wire size qty input changes
        gridEl.querySelectorAll('.size-qty-input').forEach(inp => {
          inp.addEventListener('input', (e) => {
            const sz = e.target.getAttribute('data-size');
            const val = Math.max(0, parseInt(e.target.value) || 0);
            sizeStockMap[sz] = val;
            const currentTotal = Object.values(sizeStockMap).reduce((s, q) => s + (parseInt(q) || 0), 0);
            if (badgeEl) badgeEl.innerText = `Total Stock: ${currentTotal} units`;
            
            const card = e.target.closest('.size-stock-card');
            if (card) {
              card.style.borderColor = val === 0 ? 'rgba(239,68,68,0.4)' : 'var(--border-color)';
              const oosLabel = card.querySelector('span[style*="#ef4444"]');
              if (val === 0 && !oosLabel) {
                const header = card.querySelector('div');
                if (header) {
                  const span = document.createElement('span');
                  span.style.cssText = "font-size: 0.62rem; color: #ef4444; font-weight: 700;";
                  span.innerText = "OUT OF STOCK";
                  header.appendChild(span);
                }
              } else if (val > 0 && oosLabel) {
                oosLabel.remove();
              }
            }
          });
        });
      };

      // Wire pill toggle
      sizeSelector?.addEventListener('click', (e) => {
        const pill = e.target.closest('.admin-size-pill');
        if (!pill) return;
        const sz = pill.dataset.size;
        if (sizeStockMap[sz] !== undefined) {
          delete sizeStockMap[sz];
        } else {
          sizeStockMap[sz] = 10;
        }
        renderSizeStockUI();
      });

      // Wire custom size adder
      const handleAddCustomSize = () => {
        if (!customInput) return;
        const val = customInput.value.trim().toUpperCase();
        if (!val) return;
        if (sizeStockMap[val] === undefined) {
          sizeStockMap[val] = 10;
        }
        customInput.value = '';
        renderSizeStockUI();
      };

      addCustomBtn?.addEventListener('click', handleAddCustomSize);
      customInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddCustomSize();
        }
      });

      renderSizeStockUI();
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
              placeholder="e.g. Graphic front print, Short sleeves" 
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

    // Connect Re-Analyze AI trigger button (Analyzes Primary Image Only)
    document.getElementById('reAnalyzeBtn')?.addEventListener('click', () => {
      const primaryImg = uploadedImages[0];
      if (primaryImg && !primaryImg.error && primaryImg.url) {
        triggerAIAnalysis(primaryImg.file || primaryImg.url);
      } else {
        store.showToast("Please upload a primary product photo first to analyze with AI.", 'error');
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

      const enabledSizes = Object.keys(sizeStockMap);
      if (enabledSizes.length === 0) {
        store.showToast("Please enable at least one available size for this product.", 'error');
        return;
      }

      // Collect highlights from inputs
      const highlightInputs = document.querySelectorAll('#adminHighlightsContainer .highlight-input');
      const finalHighlights = Array.from(highlightInputs)
        .map(input => input.value.trim())
        .filter(val => val.length > 0);

      const totalStock = Object.values(sizeStockMap).reduce((s, q) => s + (parseInt(q) || 0), 0);

      const formData = {
        name: document.getElementById('pName').value.trim(),
        category: document.getElementById('pCategory').value,
        price: parseFloat(document.getElementById('pPrice').value),
        stockQty: totalStock,
        sizeStock: sizeStockMap,
        sizes: enabledSizes,
        isNewArrival: document.getElementById('pIsNewArrival')?.checked,
        imagePrimary: parsedImgs[0] || 'assets/tee_acid_wash.jpg',
        imageHover: parsedImgs[1] || parsedImgs[0] || 'assets/tee_acid_wash_hover.jpg',
        images: parsedImgs,
        description: document.getElementById('pDesc').value.trim(),
        highlights: finalHighlights,
        modelImageType: modelImageType,
        color: document.getElementById('pColor')?.value.trim() || '',
        pattern: document.getElementById('pPattern')?.value.trim() || '',
        fit: document.getElementById('pFit')?.value.trim() || 'Boxy Oversized Fit',
        neckType: document.getElementById('pNeckType')?.value.trim() || 'Round Neck',
        sleeveType: document.getElementById('pSleeveType')?.value.trim() || 'Short Sleeves',
        inStock: totalStock > 0,
        badge: isEdit ? p.badge : 'NEW'
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
    // render() is synchronous but the order list is a network read, so kick it off here and
    // re-render once it lands. Guarded on remoteOrders === null so ordinary re-renders (tab
    // switches, product edits) don't refetch on every paint or loop forever.
    if (this.isAuthenticated && this.remoteOrders === null && !this.ordersLoading) {
      this.loadOrders().then(changed => { if (changed) reRenderCallback(); });
    }

    document.getElementById('retryOrdersBtn')?.addEventListener('click', () => {
      this.remoteOrders = null;
      this.ordersError = null;
      reRenderCallback();
    });

    // Admin Google OAuth Button
    document.getElementById('adminGoogleLoginBtn')?.addEventListener('click', async () => {
      try {
        sessionStorage.setItem('tm_post_login_action', 'openAdmin');
        const res = await supabaseService.signInWithGoogle();
        if (!res.success) {
          const errEl = document.getElementById('adminAuthErr');
          if (errEl) {
            errEl.innerText = res.message || 'Could not initiate Google sign-in';
            errEl.style.display = 'block';
          }
        }
      } catch (err) {
        console.error('Admin Google sign in error:', err);
      }
    });

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
        if (!res.success) {
          if (errEl) {
            errEl.innerText = res.message || "Failed to send OTP";
            errEl.style.display = 'block';
          }
          return;
        }

        store.showToast(res.message);
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

    document.getElementById('tabPaymentSettingsBtn')?.addEventListener('click', () => {
      this.activeTab = 'payment_settings';
      reRenderCallback();
    });

    document.getElementById('tabAnalyticsBtn')?.addEventListener('click', () => {
      this.activeTab = 'analytics';
      reRenderCallback();
    });

    // Payment Config Form Submit
    const paymentForm = document.getElementById('paymentConfigForm');
    if (paymentForm) {
      paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const upi = document.getElementById('adminMerchantUpi')?.value.trim();
        const name = document.getElementById('adminMerchantName')?.value.trim();
        const cod = document.getElementById('adminEnableCod')?.checked;
        const gst = document.getElementById('adminEnableGst')?.checked;

        await store.updatePaymentConfig({
          merchantUpiVpa: upi,
          merchantName: name,
          enableCOD: !!cod,
          enableGST: !!gst
        });

        store.showToast('Payment configuration saved successfully!');
        reRenderCallback();
      });
    }

    // Admin UPI / COD Payment Confirmation
    document.querySelectorAll('.confirm-upi-order-btn, .confirm-cod-order-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.getAttribute('data-id');
        if (confirm(`Confirm payment & mark Order #${orderId} as PAID? This will decrement product stock in database.`)) {
          const token = await supabaseService.getAccessToken();
          if (!token) {
            store.showToast('Admin session expired. Please re-authenticate.', 'error');
            return;
          }

          try {
            const res = await fetch('/api/admin/confirm-upi-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ order_id: orderId })
            });
            const data = await res.json();
            if (res.ok && data.success) {
              store.showToast(data.message || 'Payment confirmed and stock decremented!');
              await store.syncFromSupabase();
              await this.loadOrders();
              reRenderCallback();
            } else {
              store.showToast(data.error || 'Failed to confirm payment', 'error');
            }
          } catch (err) {
            store.showToast('Network error while confirming payment', 'error');
          }
        }
      });
    });

    // Admin Reject Fake UTR
    document.querySelectorAll('.reject-upi-order-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.getAttribute('data-id');
        const reason = prompt(`Enter rejection reason for Order #${orderId} (e.g., UTR not found in bank statement):`, 'Invalid UTR / Payment Not Received');
        if (reason !== null) {
          const token = await supabaseService.getAccessToken();
          if (!token) {
            store.showToast('Admin session expired. Please re-authenticate.', 'error');
            return;
          }

          try {
            const res = await fetch('/api/admin/reject-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ order_id: orderId, reason })
            });
            const data = await res.json();
            if (res.ok && data.success) {
              store.showToast(data.message || 'Order marked as FAILED');
              await store.syncFromSupabase();
              await this.loadOrders();
              reRenderCallback();
            } else {
              store.showToast(data.error || 'Failed to reject payment', 'error');
            }
          } catch (err) {
            store.showToast('Network error while rejecting payment', 'error');
          }
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

    // 2. Check session against authorized server admin gate
    const adminCheck = await supabaseService.verifyAdminSession();

    if (adminCheck.success) {
      this.isAuthenticated = true;
      localStorage.setItem('tm_admin_auth', 'true');
      localStorage.setItem('tm_logged_admin', adminCheck.adminIdentifier || adminCheck.email || this.adminPhone);
      store.showToast(`Welcome Master Admin (${adminCheck.adminIdentifier || adminCheck.email || this.adminPhone})`);
      reRenderCallback();
    } else {
      // OTP was valid but number is unauthorized
      if (boxContainer) {
        boxContainer.classList.add('otp-error');
        setTimeout(() => boxContainer.classList.remove('otp-error'), 800);
      }
      if (errEl) {
        errEl.innerText = adminCheck.message || "This account isn't authorized for admin access";
        errEl.style.display = 'block';
      }
    }
  }
}

