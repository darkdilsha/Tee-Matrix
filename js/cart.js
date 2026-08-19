// TEE MATRIX - Cart Drawer & Multi-Step Checkout Controller

import { store } from './store.js';
import { authModal } from './authModal.js';

export class CartDrawer {
  constructor() {
    this.isOpen = false;
    this.discountPercent = 0;
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.render();
  }

  open() {
    this.isOpen = true;
    this.render();
  }

  close() {
    this.isOpen = false;
    const drawer = document.getElementById('cartDrawer');
    if (drawer) drawer.classList.remove('active');
  }

  render() {
    let drawer = document.getElementById('cartDrawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'cartDrawer';
      drawer.className = 'cart-drawer';
      document.body.appendChild(drawer);
    }

    const cart = store.getCart();
    const totals = store.getCartTotal();
    const discountedSubtotal = totals.subtotal * (1 - this.discountPercent / 100);
    const finalTotal = discountedSubtotal + totals.shipping;

    drawer.innerHTML = `
      <div class="cart-header">
        <div>
          <span class="section-tag">ONLINE SHOPPING BAG</span>
          <h2 style="font-family: var(--font-heading); font-size: 1.3rem; color: #fff;">YOUR CART (${totals.itemCount})</h2>
        </div>
        <button class="modal-close" id="closeCartBtn" style="position: static;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="cart-body">
        ${cart.length === 0 ? `
          <div style="text-align: center; margin: auto; padding: 3rem 1rem;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom: 1rem;">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <h4 style="color: #fff; font-size: 1.1rem; margin-bottom: 0.5rem;">Your Cart is Empty</h4>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">Explore our heavyweight catalog and select your size.</p>
            <button class="btn-primary" id="cartShopBtn">SHOP CATALOG</button>
          </div>
        ` : cart.map(item => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
            <div class="cart-item-info">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <h4 style="font-size: 0.95rem; color: #fff; font-weight: 600;">${item.name}</h4>
                  <button class="cart-remove-btn" data-id="${item.id}" data-size="${item.size}" style="color: var(--text-muted); padding: 2px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <div style="display: flex; gap: 0.75rem; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
                  <span>Size: <strong>${item.size}</strong></span>
                  <span>${item.gsm} GSM</span>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
                <div style="display: flex; border: 1px solid var(--border-color); background: rgba(255,255,255,0.05);">
                  <button class="cart-qty-btn" data-id="${item.id}" data-size="${item.size}" data-change="-1" style="padding: 0.2rem 0.6rem; color: #fff;">-</button>
                  <span style="padding: 0.2rem 0.8rem; color: #fff; font-size: 0.85rem; font-weight: 600;">${item.qty}</span>
                  <button class="cart-qty-btn" data-id="${item.id}" data-size="${item.size}" data-change="1" style="padding: 0.2rem 0.6rem; color: #fff;">+</button>
                </div>
                <span style="font-weight: 700; color: #fff; font-size: 1rem;">₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      ${cart.length > 0 ? `
        <div class="cart-footer">
          <!-- Coupon Box -->
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="couponInput" placeholder="Promo code (e.g. MATRIX10)" class="input-field" style="padding: 0.5rem 0.75rem; font-size: 0.8rem;" />
            <button class="btn-secondary" id="applyCouponBtn" style="padding: 0.5rem 1rem; font-size: 0.75rem;">APPLY</button>
          </div>
          ${this.discountPercent > 0 ? `
            <div style="font-size: 0.75rem; color: var(--accent-success);">Promo MATRIX10 Applied! 10% Off</div>
          ` : ''}

          <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem; margin-top: 0.5rem;">
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
              <span>Subtotal</span>
              <span>₹${totals.subtotal.toLocaleString('en-IN')}</span>
            </div>
            ${this.discountPercent > 0 ? `
              <div style="display: flex; justify-content: space-between; color: var(--accent-success);">
                <span>Discount (10%)</span>
                <span>-₹${(totals.subtotal * 0.1).toLocaleString('en-IN')}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
              <span>Online Doorstep Delivery</span>
              <span>${totals.shipping === 0 ? 'FREE' : `₹${totals.shipping}`}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #fff; font-size: 1.1rem; font-weight: 800; border-top: 1px solid var(--border-color); padding-top: 0.75rem; margin-top: 0.25rem;">
              <span>Total</span>
              <span>₹${finalTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button class="btn-primary" id="checkoutBtn" style="width: 100%; margin-top: 0.5rem; padding: 1.1rem;">
            PROCEED TO CHECKOUT
          </button>
        </div>
      ` : ''}
    `;

    if (this.isOpen) drawer.classList.add('active');
    else drawer.classList.remove('active');

    this.attachEvents();
  }

  attachEvents() {
    document.getElementById('closeCartBtn')?.addEventListener('click', () => this.close());
    document.getElementById('cartShopBtn')?.addEventListener('click', () => {
      this.close();
      window.dispatchEvent(new CustomEvent('navigateToShop'));
    });

    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const size = btn.getAttribute('data-size');
        store.removeFromCart(id, size);
      });
    });

    document.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const size = btn.getAttribute('data-size');
        const change = parseInt(btn.getAttribute('data-change'));
        store.updateCartQty(id, size, change);
      });
    });

    document.getElementById('applyCouponBtn')?.addEventListener('click', () => {
      const code = document.getElementById('couponInput')?.value.trim().toUpperCase();
      if (code === 'MATRIX10') {
        this.discountPercent = 10;
        store.showToast("Promo MATRIX10 Applied! 10% Discount");
        this.render();
      } else {
        store.showToast("Invalid Promo Code");
      }
    });

    document.getElementById('checkoutBtn')?.addEventListener('click', () => {
      if (!store.isCustomerLoggedIn()) {
        authModal.open('login', 'Please log in to proceed to Checkout', () => {
          this.close();
          window.dispatchEvent(new CustomEvent('openCheckout'));
        });
      } else {
        this.close();
        window.dispatchEvent(new CustomEvent('openCheckout'));
      }
    });
  }
}

export class CheckoutModal {
  constructor() {
    this.step = 1; // 1: Shipping, 2: Payment, 3: Confirmation
    this.shippingData = {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      zip: ''
    };
    this.completedOrder = null;
  }

  open() {
    this.step = 1;
    const currentCustomer = store.getCurrentCustomer();
    if (currentCustomer) {
      this.shippingData.name = currentCustomer.name || '';
      this.shippingData.email = currentCustomer.email || '';
    }
    this.render();
  }

  close() {
    const backdrop = document.getElementById('checkoutBackdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      setTimeout(() => backdrop.remove(), 300);
    }
  }

  render() {
    let backdrop = document.getElementById('checkoutBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'checkoutBackdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    const cart = store.getCart();
    const totals = store.getCartTotal();

    backdrop.innerHTML = `
      <div class="modal-content glass-panel" style="max-width: 650px; padding: 2.5rem;">
        <button class="modal-close" id="closeCheckoutBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Step Indicator -->
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 2rem;">
          <div style="display: flex; gap: 0.5rem; align-items: center; color: ${this.step >= 1 ? '#fff' : 'var(--text-muted)'}; font-weight: 700; font-size: 0.85rem;">
            <span style="width: 24px; height: 24px; border-radius: 50%; background: ${this.step >= 1 ? '#fff' : 'var(--bg-secondary)'}; color: ${this.step >= 1 ? '#000' : '#fff'}; display: inline-flex; align-items: center; justify-content: center;">1</span>
            SHIPPING
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center; color: ${this.step >= 2 ? '#fff' : 'var(--text-muted)'}; font-weight: 700; font-size: 0.85rem;">
            <span style="width: 24px; height: 24px; border-radius: 50%; background: ${this.step >= 2 ? '#fff' : 'var(--bg-secondary)'}; color: ${this.step >= 2 ? '#000' : '#fff'}; display: inline-flex; align-items: center; justify-content: center;">2</span>
            PAYMENT
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center; color: ${this.step === 3 ? '#fff' : 'var(--text-muted)'}; font-weight: 700; font-size: 0.85rem;">
            <span style="width: 24px; height: 24px; border-radius: 50%; background: ${this.step === 3 ? '#fff' : 'var(--bg-secondary)'}; color: ${this.step === 3 ? '#000' : '#fff'}; display: inline-flex; align-items: center; justify-content: center;">3</span>
            CONFIRMATION
          </div>
        </div>

        ${this.step === 1 ? `
          <!-- Step 1: Shipping Form -->
          <form id="shippingForm">
            <h3 style="font-size: 1.3rem; color: #fff; margin-bottom: 1.5rem;">Direct Online Shipping Address</h3>
            
            <div style="display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 2rem;">
              <div>
                <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">FULL NAME *</label>
                <input type="text" id="shipName" required class="input-field" value="${this.shippingData.name}" placeholder="e.g. Full Name" />
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">EMAIL ADDRESS *</label>
                  <input type="email" id="shipEmail" required class="input-field" value="${this.shippingData.email}" placeholder="your.email@domain.com" />
                </div>
                <div>
                  <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">PHONE NUMBER *</label>
                  <input type="tel" id="shipPhone" required class="input-field" value="${this.shippingData.phone}" placeholder="+1 (555) 019-2834" />
                </div>
              </div>

              <div>
                <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">STREET ADDRESS *</label>
                <input type="text" id="shipAddress" required class="input-field" value="${this.shippingData.address}" placeholder="124 Cyber Boulevard, Suite 400" />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">CITY *</label>
                  <input type="text" id="shipCity" required class="input-field" value="${this.shippingData.city}" placeholder="New York" />
                </div>
                <div>
                  <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">ZIP / POSTAL CODE *</label>
                  <input type="text" id="shipZip" required class="input-field" value="${this.shippingData.zip}" placeholder="10001" />
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
              <div>
                <span style="font-size: 0.8rem; color: var(--text-muted);">ORDER TOTAL</span>
                <div style="font-size: 1.3rem; font-weight: 800; color: #fff;">₹${totals.total.toLocaleString('en-IN')}</div>
              </div>
              <button type="submit" class="btn-primary">CONTINUE TO PAYMENT</button>
            </div>
          </form>
        ` : this.step === 2 ? `
          <!-- Step 2: Payment Gateway Stub -->
          <div>
            <h3 style="font-size: 1.3rem; color: #fff; margin-bottom: 0.5rem;">Select Online Payment Method</h3>
            <div style="font-size: 0.75rem; color: var(--accent-gold); background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); padding: 0.5rem 0.8rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>Prepaid Online Shipping Only &bull; Cash on Delivery (COD) is NOT available</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
              <label style="display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-hover); cursor: pointer;">
                <input type="radio" name="payment" value="upi" checked />
                <div>
                  <strong style="color: #fff; display: block;">UPI / QR Instant Payment (Google Pay, PhonePe, Paytm)</strong>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">Instant zero-fee Indian UPI transfer</span>
                </div>
              </label>

              <label style="display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); cursor: pointer;">
                <input type="radio" name="payment" value="card" />
                <div>
                  <strong style="color: #fff; display: block;">Credit / Debit Card / Net Banking</strong>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">Instant 256-bit encrypted checkout</span>
                </div>
              </label>
            </div>

            <!-- Card Mock Fields -->
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-color); padding: 1.25rem; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1rem;">
              <input type="text" placeholder="UPI ID / VPA (e.g. name@upi)" class="input-field" value="jordan@okaxis" />
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
              <button class="btn-secondary" id="backToShipBtn">BACK</button>
              <button class="btn-primary" id="placeOrderBtn">PLACE ORDER (₹${totals.total.toLocaleString('en-IN')})</button>
            </div>
          </div>
        ` : `
          <!-- Step 3: Order Confirmation -->
          <div style="text-align: center; padding: 2rem 1rem;">
            <div style="width: 70px; height: 70px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; color: #10b981; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h2 style="font-family: var(--font-heading); font-size: 2rem; color: #fff; margin-bottom: 0.5rem;">ORDER CONFIRMED!</h2>
            <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 1.5rem;">
              Thank you for shopping with Tee Matrix. Your order <strong style="color: #fff;">#${this.completedOrder?.id}</strong> has been processed for direct doorstep shipping.
            </p>

            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 1.5rem; text-align: left; margin-bottom: 2rem; font-size: 0.85rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                <span style="color: var(--text-muted);">Customer:</span>
                <strong style="color: #fff;">${this.completedOrder?.customerName}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                <span style="color: var(--text-muted);">Delivery Address:</span>
                <span style="color: #fff;">${this.completedOrder?.address}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                <span style="color: var(--text-muted);">Total Paid:</span>
                <strong style="color: #fff; font-size: 1.1rem;">₹${this.completedOrder?.total.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <button class="btn-primary" id="finishOrderBtn">RETURN TO STORE</button>
          </div>
        `}
      </div>
    `;

    setTimeout(() => backdrop.classList.add('active'), 10);
    this.attachEvents();
  }

  attachEvents() {
    document.getElementById('closeCheckoutBtn')?.addEventListener('click', () => this.close());
    
    // Step 1 Submit
    const shipForm = document.getElementById('shippingForm');
    if (shipForm) {
      shipForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.shippingData = {
          name: document.getElementById('shipName').value,
          email: document.getElementById('shipEmail').value,
          phone: document.getElementById('shipPhone').value,
          address: document.getElementById('shipAddress').value,
          city: document.getElementById('shipCity').value,
          zip: document.getElementById('shipZip').value,
        };
        this.step = 2;
        this.render();
      });
    }

    // Step 2 Back
    document.getElementById('backToShipBtn')?.addEventListener('click', () => {
      this.step = 1;
      this.render();
    });

    // Step 2 Place Order with Stock Verification
    document.getElementById('placeOrderBtn')?.addEventListener('click', () => {
      const result = store.createOrder(this.shippingData);
      if (result && result.success) {
        this.completedOrder = result.order;
        this.step = 3;
        this.render();
      }
    });

    // Step 3 Finish
    document.getElementById('finishOrderBtn')?.addEventListener('click', () => {
      this.close();
      window.dispatchEvent(new CustomEvent('navigateToShop'));
    });
  }
}
