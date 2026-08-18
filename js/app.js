import { store } from './store.js';
import { LandingPage } from './landing.js';
import { CatalogPage } from './catalog.js';
import { ProductDetailModal } from './detail.js';
import { CartDrawer, CheckoutModal } from './cart.js';
import { AdminPanel } from './admin.js';
import { authModal } from './authModal.js';
import { accountModal } from './accountModal.js';
import { fashionMotion } from './fashionMotion.js';

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
      fashionMotion.scrollTo(0, { immediate: true });
    } else if (hash === 'new-arrivals') {
      this.currentView = 'new-arrivals';
      this.render();
      fashionMotion.scrollTo(0, { immediate: true });
    } else if (hash === 'admin') {
      this.currentView = 'admin';
      this.render();
      fashionMotion.scrollTo(0, { immediate: true });
    } else {
      this.currentView = 'landing';
      this.render();
      if (hash === 'story' || hash === 'hero') {
        setTimeout(() => {
          fashionMotion.scrollTo('#' + hash);
        }, 150);
      } else {
        fashionMotion.scrollTo(0, { immediate: true });
      }
    }
  }

  setView(viewName) {
    // Clean up ScrollTriggers if leaving landing page
    if (this.currentView === 'landing' && viewName !== 'landing' && typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach(st => st.kill());
    }

    this.currentView = viewName;
    window.location.hash = viewName;
    fashionMotion.scrollTo(0, { immediate: true });
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
        <div style="display: flex; align-items: center; gap: 1rem;">
          <button class="icon-btn" id="hamburgerBtn" title="Open Navigation Menu" style="padding: 0.4rem;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <a href="#landing" class="nav-brand brand-link">TEE MATRIX</a>
        </div>

        <ul class="nav-links">
          <li>
            <a href="#landing" class="nav-link ${this.currentView === 'landing' ? 'active' : ''}">HOME</a>
          </li>
          <li>
            <a href="#shop" class="nav-link ${this.currentView === 'shop' ? 'active' : ''}">STORE CATALOG</a>
          </li>
          <li>
            <a href="#new-arrivals" class="nav-link ${this.currentView === 'new-arrivals' ? 'active' : ''}" id="navNewArrivals">NEW ARRIVALS</a>
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

      <!-- Slide-Out Mobile Navigation Drawer -->
      <div class="mobile-nav-drawer" id="mobileNavDrawer">
        <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <span class="brand-font" style="font-size: 1.2rem; color: #fff;">TEE MATRIX</span>
          <button class="modal-close" id="closeDrawerBtn" style="position: relative; top: 0; right: 0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div style="padding: 2rem 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; flex-grow: 1;">
          <a href="#landing" class="drawer-link" id="drawerHome" style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: #fff; text-decoration: none;">HOME</a>
          <a href="#shop" class="drawer-link" id="drawerShop" style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: #fff; text-decoration: none;">STORE CATALOG</a>
          <a href="#new-arrivals" class="drawer-link" id="drawerNewArrivals" style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: #fff; text-decoration: none;">NEW ARRIVALS</a>
          <a href="#account" class="drawer-link" id="drawerAccount" style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: #fff; text-decoration: none;">MY ACCOUNT</a>
          <a href="#orders" class="drawer-link" id="drawerOrders" style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: #fff; text-decoration: none;">MY ORDERS</a>
          <a href="#wishlist" class="drawer-link" id="drawerWishlist" style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: #fff; text-decoration: none;">WISHLIST</a>
          <button class="drawer-link" id="drawerHelp" style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: var(--text-secondary); text-align: left; background: none; border: none; cursor: pointer;">HELP & CONTACT</button>
        </div>

        <div style="padding: 1.5rem; border-top: 1px solid var(--border-color);">
          ${customer ? `
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem;">Signed in as <strong>${customer.phone || customer.name}</strong></div>
            <button class="btn-secondary" id="drawerLogoutBtn" style="width: 100%; padding: 0.75rem; color: #ef4444; border-color: rgba(239,68,68,0.4);">LOG OUT</button>
          ` : `
            <button class="btn-primary" id="drawerLoginBtn" style="width: 100%; padding: 0.85rem;">LOG IN WITH MOBILE OTP</button>
          `}
        </div>
      </div>
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
    const drawer = document.getElementById('mobileNavDrawer');

    document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
      drawer?.classList.add('active');
    });

    document.getElementById('closeDrawerBtn')?.addEventListener('click', () => {
      drawer?.classList.remove('active');
    });

    document.getElementById('drawerHome')?.addEventListener('click', (e) => {
      e.preventDefault();
      drawer?.classList.remove('active');
      this.setView('landing');
    });

    document.getElementById('drawerShop')?.addEventListener('click', (e) => {
      e.preventDefault();
      drawer?.classList.remove('active');
      this.setView('shop');
    });

    document.getElementById('drawerNewArrivals')?.addEventListener('click', (e) => {
      e.preventDefault();
      drawer?.classList.remove('active');
      this.setView('new-arrivals');
    });

    document.getElementById('drawerAccount')?.addEventListener('click', (e) => {
      e.preventDefault();
      drawer?.classList.remove('active');
      accountModal.open('profile');
    });

    document.getElementById('drawerOrders')?.addEventListener('click', (e) => {
      e.preventDefault();
      drawer?.classList.remove('active');
      accountModal.open('orders');
    });

    document.getElementById('drawerWishlist')?.addEventListener('click', (e) => {
      e.preventDefault();
      drawer?.classList.remove('active');
      this.setView('shop');
      window.dispatchEvent(new CustomEvent('filterWishlist'));
    });

    document.getElementById('drawerHelp')?.addEventListener('click', () => {
      drawer?.classList.remove('active');
      store.showToast("Digital Concierge: Contact support at support@teematrix.io");
    });

    document.getElementById('drawerLoginBtn')?.addEventListener('click', () => {
      drawer?.classList.remove('active');
      authModal.open('login');
    });

    document.getElementById('drawerLogoutBtn')?.addEventListener('click', () => {
      drawer?.classList.remove('active');
      store.logoutCustomer();
    });

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
          this.setView('new-arrivals');
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
      mainContent.innerHTML = this.catalogPage.render(false);
      this.catalogPage.attachEvents(() => this.renderView());
    } else if (this.currentView === 'new-arrivals') {
      mainContent.innerHTML = this.catalogPage.render(true);
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
