// TEE MATRIX - Shop Store Catalog Controller

import { store } from './store.js';
import { authModal } from './authModal.js';

export class CatalogPage {
  constructor() {
    this.currentCategory = 'All';
    this.currentSize = 'All';
    this.currentSort = 'newest';
    this.searchQuery = '';
  }

  render() {
    const products = this.getFilteredProducts();

    return `
      <div class="store-container container">
        <div class="store-header">
          <div>
            <span class="section-tag">ONLINE CATALOG</span>
            <h1 class="brand-font" style="font-size: 2.8rem; color: #fff;">THE MATRIX STORE</h1>
          </div>
          <p style="color: var(--text-secondary); max-width: 600px; font-size: 0.95rem;">
            Explore our curated inventory of heavyweight oversized t-shirts. All items crafted from premium heavy cotton with online direct shipping.
          </p>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="store-toolbar mb-8">
          <div class="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="searchInput" placeholder="Search by name, fabric, category..." value="${this.searchQuery}" />
          </div>

          <div class="filter-pills">
            ${['All', 'Acid Wash', 'Graphic', 'Heavyweight Minimal', 'Vintage'].map(cat => `
              <button class="pill-btn ${this.currentCategory === cat ? 'active' : ''}" data-category="${cat}">
                ${cat}
              </button>
            `).join('')}
          </div>

          <div style="display: flex; gap: 1rem; align-items: center;">
            <select class="sort-select" id="sortSelect">
              <option value="newest" ${this.currentSort === 'newest' ? 'selected' : ''}>Sort: Newest First</option>
              <option value="price-low" ${this.currentSort === 'price-low' ? 'selected' : ''}>Price: Low to High</option>
              <option value="price-high" ${this.currentSort === 'price-high' ? 'selected' : ''}>Price: High to Low</option>
            </select>
          </div>
        </div>

        <!-- Product Grid -->
        ${products.length === 0 ? `
          <div style="text-align: center; padding: 6rem 2rem; background: var(--bg-card); border: 1px solid var(--border-color);">
            <h3 style="font-size: 1.4rem; color: #fff; margin-bottom: 1rem;">No Products Found</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Try adjusting your filters or search terms.</p>
            <button class="btn-secondary" id="resetFiltersBtn">Reset Filters</button>
          </div>
        ` : `
          <div class="grid-arrivals">
            ${products.map(product => `
              <div class="product-card" data-product-id="${product.id}">
                <div class="card-img-wrapper">
                  <img src="${product.imagePrimary}" alt="${product.name}" class="card-img-primary" loading="lazy" />
                  <img src="${product.imageHover || product.imagePrimary}" alt="${product.name}" class="card-img-hover" loading="lazy" />
                  <div class="card-badges">
                    <span class="badge badge-new">${product.badge}</span>
                    <span class="badge ${product.inStock ? 'badge-stock' : 'badge-out'}">
                      ${product.inStock ? `IN STOCK (${product.stockQty})` : 'OUT OF STOCK'}
                    </span>
                  </div>
                  ${product.inStock ? `
                    <div class="card-quick-add">
                      <button class="btn-primary store-quick-add" data-id="${product.id}" style="width: 100%; padding: 0.8rem 1rem; font-size: 0.75rem;">
                        QUICK ADD TO CART
                      </button>
                    </div>
                  ` : ''}
                </div>
                <div class="card-content">
                  <span class="card-category">${product.category}</span>
                  <h3 class="card-title">${product.name}</h3>
                  <div class="card-specs">
                    <span>${product.fit}</span>
                  </div>
                  <div class="card-footer">
                    <span class="card-price">₹${product.price.toLocaleString('en-IN')}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Sizes: ${product.sizes.join(', ')}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  getFilteredProducts() {
    let products = store.getProducts();

    // Category filter
    if (this.currentCategory !== 'All') {
      products = products.filter(p => p.category === this.currentCategory);
    }

    // Search filter
    if (this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.fit.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (this.currentSort === 'price-low') {
      products.sort((a, b) => a.price - b.price);
    } else if (this.currentSort === 'price-high') {
      products.sort((a, b) => b.price - a.price);
    } else if (this.currentSort === 'gsm-high') {
      products.sort((a, b) => b.gsm - a.gsm);
    } else {
      // Newest
      products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return products;
  }

  attachEvents(reRenderCallback) {
    // Search input event
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        reRenderCallback();
      });
    }

    // Category pills event
    document.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentCategory = btn.getAttribute('data-category');
        reRenderCallback();
      });
    });

    // Sort select event
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        reRenderCallback();
      });
    }

    // Reset filters button
    document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
      this.currentCategory = 'All';
      this.searchQuery = '';
      this.currentSort = 'newest';
      reRenderCallback();
    });

    // Quick add to cart
    document.querySelectorAll('.store-quick-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');

        if (!store.isCustomerLoggedIn()) {
          authModal.open('login', 'Please log in to add items to your cart', () => {
            store.addToCart(id, "M", 1);
          });
        } else {
          store.addToCart(id, "M", 1);
        }
      });
    });

    // Click product card opens detail view
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-product-id');
        window.dispatchEvent(new CustomEvent('openProductDetail', { detail: { productId: id } }));
      });
    });
  }
}
