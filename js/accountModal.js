// TEE MATRIX - Amazon-Style Customer Account Dashboard Component

import { store } from './store.js';
import { authModal } from './authModal.js';
import { supabaseService } from './supabase.js';

export class AccountModal {
  constructor() {
    this.activeTab = 'profile'; // 'profile' | 'addresses' | 'payments' | 'orders'
    this.addresses = [];
    this.paymentMethods = [];
    this.editingAddress = null;
    this.editingPayment = null;
  }

  async open(initialTab = 'profile') {
    this.activeTab = initialTab;
    const customer = store.getCurrentCustomer();
    if (!customer) {
      authModal.open('login', 'Please verify your phone number to view your Account Dashboard');
      return;
    }

    // Load initial addresses and payment methods
    await this.loadCustomerData(customer.phone);
    this.render(customer);
  }

  async loadCustomerData(phone) {
    // Addresses
    const remoteAddrs = await supabaseService.fetchUserAddresses(phone);
    if (remoteAddrs) {
      this.addresses = remoteAddrs;
    } else {
      const local = localStorage.getItem(`tm_addrs_${phone}`);
      this.addresses = local ? JSON.parse(local) : [
        {
          id: 'addr-1',
          name: store.getCurrentCustomer()?.name || 'Customer Name',
          phone: phone,
          addressLine: '104 Urban Highrise, Cyber District',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
          isDefault: true
        }
      ];
    }

    // Payment Methods
    const remotePMs = await supabaseService.fetchUserPaymentMethods(phone);
    if (remotePMs) {
      this.paymentMethods = remotePMs;
    } else {
      const localPM = localStorage.getItem(`tm_pms_${phone}`);
      this.paymentMethods = localPM ? JSON.parse(localPM) : [
        {
          id: 'pm-1',
          type: 'UPI',
          maskedIdentifier: 'member@okicici',
          isDefault: true
        },
        {
          id: 'pm-2',
          type: 'CARD',
          maskedIdentifier: 'Visa ending in 4242',
          isDefault: false
        }
      ];
    }
  }

  saveLocalData(phone) {
    localStorage.setItem(`tm_addrs_${phone}`, JSON.stringify(this.addresses));
    localStorage.setItem(`tm_pms_${phone}`, JSON.stringify(this.paymentMethods));
  }

  close() {
    const backdrop = document.getElementById('accountModalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      setTimeout(() => backdrop.remove(), 300);
    }
  }

  render(customer) {
    let backdrop = document.getElementById('accountModalBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'accountModalBackdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    const orders = store.getOrders().filter(o => 
      (o.phone && o.phone.includes(customer.phone.slice(-10))) || 
      (o.phone_number && o.phone_number.includes(customer.phone.slice(-10))) ||
      o.customerName === customer.name
    );

    backdrop.innerHTML = `
      <div class="modal-content glass-panel" style="max-width: 820px; padding: 2.5rem; border: 1px solid var(--border-color); color: #fff;">
        <button class="modal-close" id="closeAccountModalBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Amazon-Style Dashboard Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 1.25rem;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: #ffffff; color: #000000; font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(255,255,255,0.15);">
              ${(customer.name || 'M')[0].toUpperCase()}
            </div>
            <div>
              <span class="section-tag" style="color: var(--accent-gold);">YOUR ACCOUNT DASHBOARD</span>
              <h2 class="brand-font" style="font-size: 1.8rem; color: #fff; margin: 0.1rem 0;">${customer.name.toUpperCase()}</h2>
              <span style="font-size: 0.85rem; color: var(--text-secondary);">${customer.phone}</span>
            </div>
          </div>

          <button class="btn-secondary" id="accountLogoutBtn" style="padding: 0.6rem 1.4rem; font-size: 0.75rem; border-color: rgba(239,68,68,0.4); color: #ef4444;">
            LOG OUT
          </button>
        </div>

        <!-- Navigation Tabs (Amazon-style) -->
        <div style="display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-color); margin-bottom: 2rem; overflow-x: auto; padding-bottom: 2px;">
          <button class="pill-btn ${this.activeTab === 'profile' ? 'active' : ''}" id="tabAccProfile">
            PROFILE DETAILS
          </button>
          <button class="pill-btn ${this.activeTab === 'addresses' ? 'active' : ''}" id="tabAccAddresses">
            SAVED ADDRESSES (${this.addresses.length})
          </button>
          <button class="pill-btn ${this.activeTab === 'payments' ? 'active' : ''}" id="tabAccPayments">
            PAYMENT METHODS (${this.paymentMethods.length})
          </button>
          <button class="pill-btn ${this.activeTab === 'orders' ? 'active' : ''}" id="tabAccOrders">
            ORDER HISTORY (${orders.length})
          </button>
        </div>

        <!-- Tab Body Content -->
        <div id="accountTabContent">
          ${this.renderTabBody(customer, orders)}
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('active'), 10);
    this.attachEvents(customer, orders);
  }

  renderTabBody(customer, orders) {
    if (this.activeTab === 'profile') {
      return `
        <div style="max-width: 550px;">
          <h3 style="font-size: 1.2rem; color: #fff; margin-bottom: 1.5rem;">Edit Profile Information</h3>
          <form id="editProfileForm" style="display: flex; flex-direction: column; gap: 1.25rem;">
            <div>
              <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">FULL NAME *</label>
              <input type="text" id="profName" required class="input-field" value="${customer.name}" />
            </div>

            <div>
              <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">MOBILE PHONE NUMBER (VERIFIED OTP)</label>
              <input type="text" disabled class="input-field" value="${customer.phone}" style="opacity: 0.7; cursor: not-allowed;" />
            </div>

            <div>
              <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">EMAIL ADDRESS (OPTIONAL)</label>
              <input type="email" id="profEmail" class="input-field" value="${customer.email || ''}" placeholder="your.email@domain.com" />
            </div>

            <button type="submit" class="btn-primary" style="margin-top: 0.5rem; padding: 1rem 2rem; align-self: flex-start;">
              SAVE PROFILE CHANGES
            </button>
          </form>
        </div>
      `;
    }

    if (this.activeTab === 'addresses') {
      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.2rem; color: #fff;">Saved Delivery Addresses</h3>
            <button class="btn-primary" id="addNewAddrBtn" style="padding: 0.6rem 1.2rem; font-size: 0.75rem;">
              + ADD NEW ADDRESS
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
            ${this.addresses.map(addr => `
              <div style="background: rgba(255,255,255,0.03); border: 1px solid ${addr.isDefault ? 'var(--accent-gold)' : 'var(--border-color)'}; padding: 1.5rem; border-radius: 12px; position: relative;">
                ${addr.isDefault ? `
                  <span class="badge badge-limited" style="position: absolute; top: 1rem; right: 1rem;">DEFAULT ADDRESS</span>
                ` : ''}
                
                <h4 style="font-size: 1rem; color: #fff; margin-bottom: 0.5rem;">${addr.name}</h4>
                <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">
                  ${addr.addressLine}<br/>
                  ${addr.city}, ${addr.state} - ${addr.pincode}<br/>
                  Phone: ${addr.phone}
                </p>

                <div style="display: flex; gap: 0.75rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.75rem;">
                  ${!addr.isDefault ? `
                    <button class="btn-secondary set-default-addr-btn" data-id="${addr.id}" style="padding: 0.3rem 0.6rem; font-size: 0.7rem;">
                      SET DEFAULT
                    </button>
                  ` : ''}
                  <button class="btn-secondary delete-addr-btn" data-id="${addr.id}" style="padding: 0.3rem 0.6rem; font-size: 0.7rem; color: #ef4444; border-color: rgba(239,68,68,0.4);">
                    DELETE
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'payments') {
      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.2rem; color: #fff;">Saved Payment References</h3>
            <button class="btn-primary" id="addNewPaymentBtn" style="padding: 0.6rem 1.2rem; font-size: 0.75rem;">
              + ADD PAYMENT METHOD
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
            ${this.paymentMethods.map(pm => `
              <div style="background: rgba(255,255,255,0.03); border: 1px solid ${pm.isDefault ? 'var(--accent-gold)' : 'var(--border-color)'}; padding: 1.5rem; border-radius: 12px; position: relative;">
                ${pm.isDefault ? `
                  <span class="badge badge-limited" style="position: absolute; top: 1rem; right: 1rem;">DEFAULT METHOD</span>
                ` : ''}

                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                  <span class="badge badge-new">${pm.type}</span>
                  <strong style="font-size: 1rem; color: #fff;">${pm.maskedIdentifier}</strong>
                </div>

                <div style="display: flex; gap: 0.75rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.75rem; margin-top: 1rem;">
                  ${!pm.isDefault ? `
                    <button class="btn-secondary set-default-pm-btn" data-id="${pm.id}" style="padding: 0.3rem 0.6rem; font-size: 0.7rem;">
                      SET DEFAULT
                    </button>
                  ` : ''}
                  <button class="btn-secondary delete-pm-btn" data-id="${pm.id}" style="padding: 0.3rem 0.6rem; font-size: 0.7rem; color: #ef4444; border-color: rgba(239,68,68,0.4);">
                    DELETE
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'orders') {
      return `
        <div>
          <h3 style="font-size: 1.2rem; color: #fff; margin-bottom: 1.5rem;">Your Order History</h3>
          ${orders.length === 0 ? `
            <div style="text-align: center; padding: 3rem 1rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 12px;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom: 0.75rem;">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
              </svg>
              <h4 style="color: #fff; font-size: 1rem; margin-bottom: 0.25rem;">No Past Orders Found</h4>
              <p style="color: var(--text-muted); font-size: 0.8rem;">Orders placed with your verified phone number will appear here.</p>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 1rem; max-height: 420px; overflow-y: auto;">
              ${orders.map(order => `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 1.5rem; border-radius: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
                    <div>
                      <strong style="color: #fff; font-size: 1rem;">Order #${order.id}</strong>
                      <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.75rem;">Date: ${order.date || '2026-08-15'}</span>
                    </div>
                    <span class="badge badge-stock">${order.status}</span>
                  </div>

                  <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.6;">
                    ${order.items ? order.items.map(item => `&bull; ${item.name} (${item.size}) x${item.qty} - ₹${(item.price * item.qty).toLocaleString('en-IN')}`).join('<br/>') : 'Luxury Oversized T-Shirt Pack'}
                  </div>

                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.75rem;">
                    <span style="color: var(--text-muted);">Direct Doorstep Delivery</span>
                    <strong style="color: #fff; font-size: 1.1rem;">Total: ₹${order.total.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    }
  }

  attachEvents(customer, orders) {
    document.getElementById('closeAccountModalBtn')?.addEventListener('click', () => this.close());

    // Tab buttons
    document.getElementById('tabAccProfile')?.addEventListener('click', () => {
      this.activeTab = 'profile';
      this.render(customer);
    });

    document.getElementById('tabAccAddresses')?.addEventListener('click', () => {
      this.activeTab = 'addresses';
      this.render(customer);
    });

    document.getElementById('tabAccPayments')?.addEventListener('click', () => {
      this.activeTab = 'payments';
      this.render(customer);
    });

    document.getElementById('tabAccOrders')?.addEventListener('click', () => {
      this.activeTab = 'orders';
      this.render(customer);
    });

    // Profile form
    document.getElementById('editProfileForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('profName').value.trim();
      const email = document.getElementById('profEmail').value.trim();

      store.updateCustomerProfile({ name, email });
      this.render(store.getCurrentCustomer());
    });

    // Add New Address Modal
    document.getElementById('addNewAddrBtn')?.addEventListener('click', () => {
      this.openAddressModal(customer);
    });

    // Address Actions
    document.querySelectorAll('.set-default-addr-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.addresses.forEach(a => a.isDefault = (a.id === id));
        this.saveLocalData(customer.phone);
        this.render(customer);
      });
    });

    document.querySelectorAll('.delete-addr-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.addresses = this.addresses.filter(a => a.id !== id);
        this.saveLocalData(customer.phone);
        this.render(customer);
      });
    });

    // Add New Payment Method Modal
    document.getElementById('addNewPaymentBtn')?.addEventListener('click', () => {
      this.openPaymentModal(customer);
    });

    // Payment Actions
    document.querySelectorAll('.set-default-pm-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.paymentMethods.forEach(pm => pm.isDefault = (pm.id === id));
        this.saveLocalData(customer.phone);
        this.render(customer);
      });
    });

    document.querySelectorAll('.delete-pm-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.paymentMethods = this.paymentMethods.filter(pm => pm.id !== id);
        this.saveLocalData(customer.phone);
        this.render(customer);
      });
    });

    // Logout
    document.getElementById('accountLogoutBtn')?.addEventListener('click', () => {
      store.logoutCustomer();
      this.close();
    });
  }

  openAddressModal(customer) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop active';
    modal.innerHTML = `
      <div class="modal-content glass-panel" style="max-width: 480px; padding: 2.5rem; border: 1px solid var(--border-color);">
        <button class="modal-close" id="closeAddrModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <h3 style="font-size: 1.3rem; color: #fff; margin-bottom: 1.5rem;">Add New Delivery Address</h3>

        <form id="newAddressForm" style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">FULL NAME *</label>
            <input type="text" id="addName" required class="input-field" value="${customer.name}" />
          </div>
          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">PHONE NUMBER *</label>
            <input type="text" id="addPhone" required class="input-field" value="${customer.phone}" />
          </div>
          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">STREET ADDRESS / BUILDING *</label>
            <input type="text" id="addLine" required class="input-field" placeholder="104 Urban Highrise, Cyber Street" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div>
              <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">CITY *</label>
              <input type="text" id="addCity" required class="input-field" placeholder="New Delhi" />
            </div>
            <div>
              <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">PINCODE *</label>
              <input type="text" id="addZip" required class="input-field" placeholder="110001" />
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
            <button type="button" class="btn-secondary" id="cancelAddrBtn">CANCEL</button>
            <button type="submit" class="btn-primary">SAVE ADDRESS</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('#closeAddrModal').addEventListener('click', close);
    modal.querySelector('#cancelAddrBtn').addEventListener('click', close);

    modal.querySelector('#newAddressForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const newAddr = {
        id: `addr-${Date.now()}`,
        name: modal.querySelector('#addName').value,
        phone: modal.querySelector('#addPhone').value,
        addressLine: modal.querySelector('#addLine').value,
        city: modal.querySelector('#addCity').value,
        state: 'Delhi',
        pincode: modal.querySelector('#addZip').value,
        isDefault: this.addresses.length === 0
      };

      this.addresses.push(newAddr);
      supabaseService.saveUserAddress(customer.phone, newAddr);
      this.saveLocalData(customer.phone);
      close();
      this.render(customer);
    });
  }

  openPaymentModal(customer) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop active';
    modal.innerHTML = `
      <div class="modal-content glass-panel" style="max-width: 480px; padding: 2.5rem; border: 1px solid var(--border-color);">
        <button class="modal-close" id="closePMModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <h3 style="font-size: 1.3rem; color: #fff; margin-bottom: 1.5rem;">Add Saved Payment Reference</h3>

        <form id="newPMForm" style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">METHOD TYPE *</label>
            <select id="pmType" class="input-field" style="background: rgba(255,255,255,0.05); color: #fff;">
              <option value="UPI">UPI ID (Google Pay / PhonePe / Paytm)</option>
              <option value="CARD">Credit / Debit Card Reference</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">MASKED IDENTIFIER / REFERENCE *</label>
            <input type="text" id="pmMasked" required class="input-field" placeholder="e.g. member@okicici or Visa ending in 4242" />
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
            <button type="button" class="btn-secondary" id="cancelPMBtn">CANCEL</button>
            <button type="submit" class="btn-primary">SAVE METHOD</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('#closePMModal').addEventListener('click', close);
    modal.querySelector('#cancelPMBtn').addEventListener('click', close);

    modal.querySelector('#newPMForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const newPM = {
        id: `pm-${Date.now()}`,
        type: modal.querySelector('#pmType').value,
        maskedIdentifier: modal.querySelector('#pmMasked').value,
        isDefault: this.paymentMethods.length === 0
      };

      this.paymentMethods.push(newPM);
      supabaseService.saveUserPaymentMethod(customer.phone, newPM);
      this.saveLocalData(customer.phone);
      close();
      this.render(customer);
    });
  }
}

export const accountModal = new AccountModal();
