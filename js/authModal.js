// TEE MATRIX - Customer Authentication Modal (Login & Signup)

import { store } from './store.js';

export class AuthModal {
  constructor() {
    this.mode = 'login'; // 'login' | 'signup'
    this.onSuccessCallback = null;
    this.customNotice = '';
  }

  open(mode = 'login', notice = '', onSuccess = null) {
    this.mode = mode;
    this.customNotice = notice;
    this.onSuccessCallback = onSuccess;
    this.render();
  }

  close() {
    const backdrop = document.getElementById('authModalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      setTimeout(() => backdrop.remove(), 300);
    }
  }

  render() {
    let backdrop = document.getElementById('authModalBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'authModalBackdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div class="modal-content glass-panel" style="max-width: 460px; padding: 2.5rem; border: 1px solid var(--border-color);">
        <button class="modal-close" id="closeAuthBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div style="text-align: center; margin-bottom: 2rem;">
          <span class="section-tag">ONLINE STOREFRONT ACCOUNT</span>
          <h2 class="brand-font" style="font-size: 1.8rem; color: #fff; margin-top: 0.25rem;">
            ${this.mode === 'login' ? 'CUSTOMER LOGIN' : 'CREATE ACCOUNT'}
          </h2>
          ${this.customNotice ? `
            <div style="margin-top: 0.75rem; padding: 0.6rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); font-size: 0.8rem; color: #ffffff;">
              ${this.customNotice}
            </div>
          ` : ''}
        </div>

        <!-- Mode Toggle Tabs -->
        <div style="display: flex; border-bottom: 1px solid var(--border-color); margin-bottom: 1.75rem;">
          <button class="auth-tab-btn ${this.mode === 'login' ? 'active' : ''}" id="tabAuthLogin" style="flex: 1; padding: 0.75rem; background: none; border: none; border-bottom: 2px solid ${this.mode === 'login' ? '#ffffff' : 'transparent'}; color: ${this.mode === 'login' ? '#ffffff' : 'var(--text-muted)'}; font-family: var(--font-heading); font-weight: 700; font-size: 0.85rem; cursor: pointer;">
            LOG IN
          </button>
          <button class="auth-tab-btn ${this.mode === 'signup' ? 'active' : ''}" id="tabAuthSignup" style="flex: 1; padding: 0.75rem; background: none; border: none; border-bottom: 2px solid ${this.mode === 'signup' ? '#ffffff' : 'transparent'}; color: ${this.mode === 'signup' ? '#ffffff' : 'var(--text-muted)'}; font-family: var(--font-heading); font-weight: 700; font-size: 0.85rem; cursor: pointer;">
            SIGN UP
          </button>
        </div>

        <div id="authFormContainer">
          ${this.mode === 'login' ? this.renderLoginForm() : this.renderSignupForm()}
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('active'), 10);
    this.attachEvents();
  }

  renderLoginForm() {
    return `
      <form id="customerLoginForm" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div>
          <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">EMAIL ADDRESS *</label>
          <input type="email" id="loginEmail" required class="input-field" placeholder="your.email@domain.com" />
        </div>

        <div>
          <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">PASSWORD *</label>
          <input type="password" id="loginPassword" required class="input-field" placeholder="Enter your password" />
        </div>

        <div id="loginErrorMsg" style="color: var(--accent-danger); font-size: 0.8rem; display: none;"></div>

        <button type="submit" class="btn-primary" style="width: 100%; padding: 1.1rem; margin-top: 0.5rem;">
          LOG IN & CONTINUE
        </button>

        <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; color: var(--text-secondary);">
          Don't have an account? 
          <button type="button" id="switchToSignupBtn" style="color: #ffffff; font-weight: 700; text-decoration: underline; background: none; border: none; cursor: pointer; margin-left: 0.25rem;">
            Sign Up
          </button>
        </div>
      </form>
    `;
  }

  renderSignupForm() {
    return `
      <form id="customerSignupForm" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div>
          <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">FULL NAME *</label>
          <input type="text" id="signupName" required class="input-field" placeholder="e.g. Jordan Vance" />
        </div>

        <div>
          <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">EMAIL ADDRESS *</label>
          <input type="email" id="signupEmail" required class="input-field" placeholder="jordan@example.com" />
        </div>

        <div>
          <label style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 0.4rem;">CREATE PASSWORD *</label>
          <input type="password" id="signupPassword" required class="input-field" placeholder="At least 6 characters" />
        </div>

        <div id="signupErrorMsg" style="color: var(--accent-danger); font-size: 0.8rem; display: none;"></div>

        <button type="submit" class="btn-primary" style="width: 100%; padding: 1.1rem; margin-top: 0.5rem;">
          CREATE ACCOUNT & CONTINUE
        </button>

        <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; color: var(--text-secondary);">
          Already have an account? 
          <button type="button" id="switchToLoginBtn" style="color: #ffffff; font-weight: 700; text-decoration: underline; background: none; border: none; cursor: pointer; margin-left: 0.25rem;">
            Log In
          </button>
        </div>
      </form>
    `;
  }

  attachEvents() {
    document.getElementById('closeAuthBtn')?.addEventListener('click', () => this.close());
    
    // Tab switching
    document.getElementById('tabAuthLogin')?.addEventListener('click', () => {
      this.mode = 'login';
      this.render();
    });

    document.getElementById('tabAuthSignup')?.addEventListener('click', () => {
      this.mode = 'signup';
      this.render();
    });

    document.getElementById('switchToSignupBtn')?.addEventListener('click', () => {
      this.mode = 'signup';
      this.render();
    });

    document.getElementById('switchToLoginBtn')?.addEventListener('click', () => {
      this.mode = 'login';
      this.render();
    });

    // Login Form Submission
    const loginForm = document.getElementById('customerLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errEl = document.getElementById('loginErrorMsg');

        const res = store.loginCustomer(email, password);
        if (res.success) {
          this.close();
          if (this.onSuccessCallback) this.onSuccessCallback();
        } else {
          if (errEl) {
            errEl.innerText = res.message;
            errEl.style.display = 'block';
          }
        }
      });
    }

    // Signup Form Submission
    const signupForm = document.getElementById('customerSignupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const errEl = document.getElementById('signupErrorMsg');

        if (password.length < 4) {
          if (errEl) {
            errEl.innerText = "Password must be at least 4 characters";
            errEl.style.display = 'block';
          }
          return;
        }

        const res = store.signupCustomer(name, email, password);
        if (res.success) {
          this.close();
          if (this.onSuccessCallback) this.onSuccessCallback();
        } else {
          if (errEl) {
            errEl.innerText = res.message;
            errEl.style.display = 'block';
          }
        }
      });
    }
  }
}

export const authModal = new AuthModal();
