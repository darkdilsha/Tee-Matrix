// TEE MATRIX - Main Application Controller

import { store } from './store.js';
import { LandingPage } from './landing.js';
import { CatalogPage } from './catalog.js';
import { ProductDetailModal } from './detail.js';
import { CartDrawer, CheckoutModal } from './cart.js';
import { AdminPanel } from './admin.js';
import { authModal } from './authModal.js';
import { accountModal } from './accountModal.js';

class App {
  constructor() {
    this.currentView = 'landing'; // 'landing' | 'shop' | 'admin'
    this.landingPage = new LandingPage(() => this.setView('shop'));
    this.catalogPage = new CatalogPage();
    this.productDetailModal = new ProductDetailModal();
    this.cartDrawer = new CartDrawer();
    this.checkoutModal = new CheckoutModal();
    this.adminPanel = new AdminPanel();

    this.init();
  }

  init() {
    this.handleRoute();

    // Subscribe to store updates
    store.subscribe(() => {
      this.updateCartBadge();
      const navContainer = document.getElementById('navbar');
      if (navContainer) {
        navContainer.outerHTML = this.renderNavbar();
        this.attachNavbarEvents();
      }
      if (this.currentView === 'shop') {
        this.renderView();
      } else if (this.currentView === 'admin') {
        this.renderView();
      }
    });

    // Custom window events
    window.addEventListener('openProductDetail', (e) => {
      this.productDetailModal.open(e.detail.productId);
    });

    window.addEventListener('openCheckout', () => {
      this.checkoutModal.open();
    });

    window.addEventListener('navigateToShop', () => {
      this.setView('shop');
    });

    window.addEventListener('popstate', () => {
      this.handleRoute();
    });
  }

  handleRoute() {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'shop') {
      this.currentView = 'shop';
      this.render();
    } else if (hash === 'admin') {
      this.currentView = 'admin';
      this.render();
    } else {
      // 'landing', 'new-arrivals', 'story', 'hero', etc.
      this.currentView = 'landing';
      this.render();
      if (hash === 'new-arrivals' || hash === 'story' || hash === 'hero') {
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  }

  setView(viewName) {
    // Strict Guard: if trying to open admin, check auth
    this.currentView = viewName;
    window.location.hash = viewName;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.render();
  }

  updateCartBadge() {
    const totals = store.getCartTotal();
    const badgeEl = document.getElementById('navCartCount');
    if (badgeEl) {
      badgeEl.innerText = totals.itemCount;
      badgeEl.style.display = totals.itemCount > 0 ? 'flex' : 'none';
    }
  }

  renderNavbar() {
    const cartTotals = store.getCartTotal();
    const customer = store.getCurrentCustomer();
    const isAdmin = localStorage.getItem('tm_admin_auth') === 'true';

    // Dedicated Admin Header when on Admin view
    if (this.currentView === 'admin') {
      return `
        <nav class="navbar scrolled" id="navbar" style="border-bottom: 1px solid var(--border-color); background: #0c0c0c;">
          <a href="#landing" class="nav-brand brand-link" style="color: var(--accent-gold);">TEE MATRIX &bull; ADMIN PORTAL</a>

          <div class="nav-actions">
            <button class="btn-secondary" id="adminGoStoreBtn" style="padding: 0.4rem 1rem; font-size: 0.75rem; border-color: var(--border-hover);">
              &larr; PUBLIC STOREFRONT
            </button>
            ${isAdmin ? `
              <button class="btn-secondary" id="adminLogoutHeaderBtn" style="padding: 0.4rem 1rem; font-size: 0.75rem; color: var(--accent-danger); border-color: rgba(239,68,68,0.4);">
                LOG OUT ADMIN
              </button>
            ` : ''}
          </div>
        </nav>
      `;
    }

    // Standard Storefront Navbar
    return `
      <nav class="navbar ${this.currentView !== 'landing' ? 'scrolled' : ''}" id="navbar">
        <a href="#landing" class="nav-brand brand-link">TEE MATRIX</a>

        <ul class="nav-links">
          <li>
            <a href="#landing" class="nav-link ${this.currentView === 'landing' ? 'active' : ''}">HOME</a>
          </li>
          <li>
            <a href="#shop" class="nav-link ${this.currentView === 'shop' ? 'active' : ''}">STORE CATALOG</a>
          </li>
          <li>
            <a href="#new-arrivals" class="nav-link" id="navNewArrivals">NEW ARRIVALS</a>
          </li>
          <li>
            <button class="nav-link" id="navAccountBtnLink" style="background:none; border:none; cursor:pointer;">ACCOUNT</button>
          </li>
        </ul>

        <div class="nav-actions">
          ${customer ? `
            <button id="navAccountProfileBtn" class="btn-secondary" style="padding: 0.4rem 0.9rem; font-size: 0.75rem; border-color: var(--border-hover); display: flex; align-items: center; gap: 0.5rem;" title="Account Profile">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span class="nav-account-text">HI, ${customer.name.split(' ')[0].toUpperCase()}</span>
            </button>
          ` : `
            <button class="btn-secondary" id="navLoginBtn" style="padding: 0.4rem 1rem; font-size: 0.75rem; border-color: var(--border-hover); display: flex; align-items: center; gap: 0.4rem;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>LOG IN</span>
            </button>
          `}

          <button class="icon-btn" id="navCartBtn" title="Shopping Bag">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span class="cart-count" id="navCartCount" style="${cartTotals.itemCount > 0 ? 'display:flex' : 'display:none'}">
              ${cartTotals.itemCount}
            </span>
          </button>
        </div>
      </nav>
    `;
  }

  render() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    appEl.innerHTML = `
      ${this.renderNavbar()}
      <main id="mainContent">
        <!-- Dynamic View Loaded Here -->
      </main>
    `;

    this.attachNavbarEvents();
    this.renderView();
  }

  attachNavbarEvents() {
    document.getElementById('adminGoStoreBtn')?.addEventListener('click', () => {
      this.setView('shop');
    });

    document.getElementById('adminLogoutHeaderBtn')?.addEventListener('click', () => {
      localStorage.removeItem('tm_admin_auth');
      localStorage.removeItem('tm_logged_admin');
      this.adminPanel.isAuthenticated = false;
      store.showToast("Admin Logged Out");
      this.render();
    });

    document.querySelectorAll('.brand-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.setView('landing');
      });
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#landing') {
          e.preventDefault();
          this.setView('landing');
        } else if (href === '#shop') {
          e.preventDefault();
          this.setView('shop');
        } else if (href === '#new-arrivals') {
          e.preventDefault();
          if (this.currentView !== 'landing') {
            this.setView('landing');
            setTimeout(() => {
              document.getElementById('new-arrivals')?.scrollIntoView({ behavior: 'smooth' });
            }, 200);
          } else {
            document.getElementById('new-arrivals')?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    document.getElementById('navAccountBtnLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      accountModal.open();
    });

    document.getElementById('navAccountProfileBtn')?.addEventListener('click', () => {
      accountModal.open();
    });

    document.getElementById('navLoginBtn')?.addEventListener('click', () => {
      authModal.open('login');
    });

    document.getElementById('navLogoutBtn')?.addEventListener('click', () => {
      store.logoutCustomer();
    });

    document.getElementById('navCartBtn')?.addEventListener('click', () => {
      this.cartDrawer.open();
    });

    // Navbar background on scroll
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('navbar');
      if (nav && this.currentView === 'landing') {
        if (window.scrollY > 80) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
      }
    });
  }

  renderView() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    if (this.currentView === 'landing') {
      mainContent.innerHTML = this.landingPage.render();
      this.landingPage.attachEvents();
    } else if (this.currentView === 'shop') {
      mainContent.innerHTML = this.catalogPage.render();
      this.catalogPage.attachEvents(() => this.renderView());
    } else if (this.currentView === 'admin') {
      mainContent.innerHTML = this.adminPanel.render();
      this.adminPanel.attachEvents(() => this.renderView());
    }
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
