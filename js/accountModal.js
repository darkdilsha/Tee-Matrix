// TEE MATRIX - Customer Account & Order History Modal Component

import { store } from './store.js';
import { authModal } from './authModal.js';

export class AccountModal {
  open() {
    const customer = store.getCurrentCustomer();
    if (!customer) {
      authModal.open('login', 'Please log in to view your account details');
      return;
    }
    this.render(customer);
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

    const orders = store.getOrders().filter(o => o.email.toLowerCase() === customer.email.toLowerCase() || o.customerName.toLowerCase() === customer.name.toLowerCase());

    backdrop.innerHTML = `
      <div class="modal-content glass-panel" style="max-width: 650px; padding: 2.5rem; border: 1px solid var(--border-color);">
        <button class="modal-close" id="closeAccountModalBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; margin-bottom: 2rem;">
          <div>
            <span class="section-tag">CUSTOMER PROFILE</span>
            <h2 class="brand-font" style="font-size: 1.8rem; color: #fff; margin-top: 0.25rem;">${customer.name.toUpperCase()}</h2>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">${customer.email}</span>
          </div>
          <button class="btn-secondary" id="accountLogoutBtn" style="padding: 0.5rem 1.2rem; font-size: 0.75rem;">
            LOG OUT
          </button>
        </div>

        <div>
          <h3 style="font-family: var(--font-heading); font-size: 1.2rem; color: #fff; margin-bottom: 1.25rem; letter-spacing: 0.05em;">YOUR ORDER HISTORY (${orders.length})</h3>

          ${orders.length === 0 ? `
            <div style="text-align: center; padding: 3rem 1rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color);">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom: 0.75rem;">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
              </svg>
              <h4 style="color: #fff; font-size: 1rem; margin-bottom: 0.25rem;">No Recent Orders Found</h4>
              <p style="color: var(--text-muted); font-size: 0.8rem;">Orders placed with your account will appear here.</p>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 1rem; max-height: 400px; overflow-y: auto;">
              ${orders.map(order => `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 1.25rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
                    <div>
                      <strong style="color: #fff; font-size: 0.95rem;">Order #${order.id}</strong>
                      <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.75rem;">Date: ${order.date}</span>
                    </div>
                    <span class="badge badge-stock">${order.status}</span>
                  </div>

                  <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.5;">
                    ${order.items.map(item => `&bull; ${item.name} (${item.size}) x${item.qty} - ₹${(item.price * item.qty).toLocaleString('en-IN')}`).join('<br/>')}
                  </div>

                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.5rem;">
                    <span style="color: var(--text-muted);">Direct Doorstep Delivery</span>
                    <strong style="color: #fff; font-size: 1rem;">Total: ₹${order.total.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('active'), 10);
    this.attachEvents();
  }

  attachEvents() {
    document.getElementById('closeAccountModalBtn')?.addEventListener('click', () => this.close());
    
    document.getElementById('accountLogoutBtn')?.addEventListener('click', () => {
      this.close();
      store.logoutCustomer();
    });
  }
}

export const accountModal = new AccountModal();
