// TEE MATRIX - Practical Fast Shop Store Catalog Controller (Myntra/Meesho Logic)

import { store } from './store.js';
import { authModal } from './authModal.js';

export class CatalogPage {
  constructor() {
    this.currentCategory = 'All';
    this.selectedSizes = [];
    this.selectedColors = [];
    this.maxPrice = 5000;
    this.currentSort = 'newest';
    this.searchQuery = '';
    this.wishlistSet = new Set(JSON.parse(localStorage.getItem('tm_wishlist') || '[]'));
    this.showOnlyWishlist = false;
    this.isFilterSheetOpen = false;

    window.addEventListener('filterWishlist', () => {
      this.showOnlyWishlist = true;
      this.render();
    });
  }

  toggleWishlist(productId, e) {
    if (e) e.stopPropagation();
    if (this.wishlistSet.has(productId)) {
      this.wishlistSet.delete(productId);
      store.showToast("Removed from Wishlist");
    } else {
      this.wishlistSet.add(productId);
      store.showToast("Saved to Wishlist ❤️");
    }
    localStorage.setItem('tm_wishlist', JSON.stringify(Array.from(this.wishlistSet)));
  }

  render(isNewArrivals = false) {
    this.isNewArrivalsMode = isNewArrivals;
    const products = this.getFilteredProducts();

    return `
      <div class="store-container container" style="padding-top: 5.5rem;">
        
        <!-- Header & Search Bar Row -->
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="section-tag" style="letter-spacing: 0.2em;">
                ${this.isNewArrivalsMode ? 'CURATED RELEASES &bull; ONLINE DROPS' : 'STOREFRONT CATALOG'}
              </span>
              <h1 class="brand-font" style="font-size: clamp(1.8rem, 4vw, 2.5rem); color: #fff;">
                ${this.showOnlyWishlist 
                  ? 'MY WISHLIST' 
                  : (this.isNewArrivalsMode ? 'NEW ARRIVALS CATALOG' : 'THE MATRIX CATALOG')}
              </h1>
            </div>

            <!-- Search Bar Input -->
            <div class="search-box" style="width: 100%; max-width: 380px; border-radius: 25px; padding: 0.5rem 1.2rem; background: rgba(255,255,255,0.06); border: 1px solid var(--border-color);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="searchInput" placeholder="${this.isNewArrivalsMode ? 'Search new arrivals...' : 'Search for tees...'}" value="${this.searchQuery}" style="font-size: 0.9rem;" />
            </div>
          </div>

          <!-- Horizontally Scrollable Category Chips Row -->
          <div class="category-scroll-row">
            ${(this.isNewArrivalsMode 
              ? ['All New', 'Acid Wash', 'Graphic', 'Heavyweight Minimal', 'Vintage']
              : ['All', 'New', 'Oversized', 'Graphic', 'Plain', 'Best Sellers']
            ).map(cat => `
              <button class="pill-btn ${(this.currentCategory === cat || (cat === 'All New' && this.currentCategory === 'All')) && !this.showOnlyWishlist ? 'active' : ''}" data-category="${cat}" style="border-radius: 20px; white-space: nowrap;">
                ${cat}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Filter & Sort Action Toolbar -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 1.2rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <button class="btn-secondary" id="openFilterBtn" style="padding: 0.5rem 1.2rem; font-size: 0.8rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <span>FILTERS ${(this.selectedSizes.length + this.selectedColors.length) > 0 ? `(${this.selectedSizes.length + this.selectedColors.length})` : ''}</span>
            </button>

            ${this.showOnlyWishlist ? `
              <button class="btn-secondary" id="clearWishlistFilterBtn" style="padding: 0.5rem 1rem; font-size: 0.75rem; color: var(--accent-gold);">
                &larr; View All Products
              </button>
            ` : ''}
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 0.8rem; color: var(--text-muted); display: none; @media(min-width:600px){display:inline}">Showing ${products.length} Items</span>
            <select class="sort-select" id="sortSelect" style="border-radius: 6px; padding: 0.5rem 0.8rem; font-size: 0.8rem;">
              <option value="newest" ${this.currentSort === 'newest' ? 'selected' : ''}>Sort: Newest First</option>
              <option value="price-low" ${this.currentSort === 'price-low' ? 'selected' : ''}>Sort: Price Low to High</option>
              <option value="price-high" ${this.currentSort === 'price-high' ? 'selected' : ''}>Sort: Price High to Low</option>
              <option value="best-selling" ${this.currentSort === 'best-selling' ? 'selected' : ''}>Sort: Best Selling</option>
            </select>
          </div>
        </div>

        <!-- Practical Shopping Product Grid (2 Cols Mobile, 4 Cols Desktop) -->
        ${products.length === 0 ? `
          <div style="text-align: center; padding: 5rem 2rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;">
            <h3 style="font-size: 1.3rem; color: #fff; margin-bottom: 0.5rem;">No Products Found</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.85rem;">Try resetting your filters or search query.</p>
            <button class="btn-secondary" id="resetFiltersBtn">Reset All Filters</button>
          </div>
        ` : `
          <div class="grid-arrivals">
            ${products.map(product => {
              const origPrice = Math.round(product.price * 1.25);
              const discountPct = 20;
              const isWishlisted = this.wishlistSet.has(product.id);

              return `
                <div class="product-card" data-product-id="${product.id}">
                  <div class="card-img-wrapper">
                    <!-- Wishlist Heart Button Top-Right Corner -->
                    <button class="card-wishlist-btn ${isWishlisted ? 'active' : ''}" data-wishlist-id="${product.id}" title="Save to Wishlist">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>

                    <img src="${product.imagePrimary}" alt="${product.name}" class="card-img-primary" loading="lazy" />
                    <img src="${product.imageHover || product.imagePrimary}" alt="${product.name}" class="card-img-hover" loading="lazy" />
                    
                    <div class="card-badges">
                      ${product.badge ? `<span class="badge badge-new">${product.badge}</span>` : ''}
                      <span class="badge ${product.inStock ? 'badge-stock' : 'badge-out'}">
                        ${product.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                      </span>
                    </div>

                    <!-- Quick Add to Cart Button Overlay -->
                    ${product.inStock ? `
                      <div class="card-quick-add">
                        <button class="btn-primary store-quick-add" data-id="${product.id}" style="width: 100%; padding: 0.7rem 0.8rem; font-size: 0.75rem; border-radius: 6px;">
                          + ADD TO CART
                        </button>
                      </div>
                    ` : ''}
                  </div>

                  <div class="card-content">
                    <span class="card-category">${product.category}</span>
                    <h3 class="card-title" style="font-size: 0.95rem; font-weight: 600; line-height: 1.3;">${product.name}</h3>
                    
                    <div class="card-footer" style="margin-top: 0.4rem; padding-top: 0.4rem;">
                      <div>
                        <span class="price-original">₹${origPrice.toLocaleString('en-IN')}</span>
                        <span class="card-price">₹${product.price.toLocaleString('en-IN')}</span>
                      </div>
                      <span class="discount-badge">${discountPct}% OFF</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}

        <!-- Filter Side Sheet / Bottom Drawer Container -->
        <div id="filterSheetContainer"></div>
      </div>
    `;
  }

  getFilteredProducts() {
    let products = store.getProducts();

    // Dedicated New Arrivals Mode Base Filter
    if (this.isNewArrivalsMode && !this.showOnlyWishlist) {
      products = products.filter(p => p.isNewArrival || p.badge === 'NEW' || p.isFeatured);
    }

    // Wishlist Filter
    if (this.showOnlyWishlist) {
      products = products.filter(p => this.wishlistSet.has(p.id));
    }

    // Category filter
    if (this.currentCategory !== 'All' && !this.showOnlyWishlist) {
      if (this.currentCategory === 'New') {
        products = products.filter(p => p.isNewArrival || p.badge === 'NEW');
      } else if (this.currentCategory === 'Best Sellers') {
        products = products.filter(p => p.badge === 'BESTSELLER' || p.isFeatured);
      } else if (this.currentCategory === 'Oversized') {
        products = products.filter(p => p.fit.toLowerCase().includes('oversized') || p.fit.toLowerCase().includes('boxy'));
      } else if (this.currentCategory === 'Plain') {
        products = products.filter(p => p.category === 'Heavyweight Minimal' || p.category === 'Vintage');
      } else {
        products = products.filter(p => p.category.toLowerCase().includes(this.currentCategory.toLowerCase()));
      }
    }

    // Size Filter
    if (this.selectedSizes.length > 0) {
      products = products.filter(p => p.sizes && p.sizes.some(s => this.selectedSizes.includes(s)));
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
    } else if (this.currentSort === 'best-selling') {
      products.sort((a, b) => (b.badge === 'BESTSELLER' ? 1 : 0) - (a.badge === 'BESTSELLER' ? 1 : 0));
    } else {
      products.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    }

    return products;
  }

  openFilterSheet(reRenderCallback) {
    const container = document.getElementById('filterSheetContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="modal-backdrop active" id="filterSheetBackdrop">
        <div class="modal-content glass-panel" style="max-width: 440px; padding: 2rem; border-radius: 16px; border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.2rem; color: #fff;">Filter Products</h3>
            <button class="modal-close" id="closeFilterSheet" style="position: relative; top:0; right:0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <!-- Size Filter -->
          <div style="margin-bottom: 1.5rem;">
            <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; display: block; margin-bottom: 0.75rem;">SELECT SIZE</span>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              ${['S', 'M', 'L', 'XL', 'XXL'].map(size => `
                <button class="size-filter-btn ${this.selectedSizes.includes(size) ? 'active' : ''}" data-size="${size}" style="padding: 0.5rem 1rem; border: 1px solid ${this.selectedSizes.includes(size) ? '#fff' : 'var(--border-color)'}; background: ${this.selectedSizes.includes(size) ? '#fff' : 'transparent'}; color: ${this.selectedSizes.includes(size) ? '#000' : '#fff'}; font-weight: 700; font-size: 0.8rem; border-radius: 6px; cursor: pointer;">
                  ${size}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Category Filter -->
          <div style="margin-bottom: 1.5rem;">
            <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; display: block; margin-bottom: 0.75rem;">CATEGORY</span>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              ${['All', 'Acid Wash', 'Graphic', 'Heavyweight Minimal', 'Vintage'].map(cat => `
                <button class="cat-filter-btn ${this.currentCategory === cat ? 'active' : ''}" data-cat="${cat}" style="padding: 0.4rem 0.8rem; border: 1px solid ${this.currentCategory === cat ? '#fff' : 'var(--border-color)'}; background: ${this.currentCategory === cat ? '#fff' : 'transparent'}; color: ${this.currentCategory === cat ? '#000' : '#fff'}; font-size: 0.75rem; border-radius: 20px; cursor: pointer;">
                  ${cat}
                </button>
              `).join('')}
            </div>
          </div>

          <div style="display: flex; gap: 1rem; border-top: 1px solid var(--border-color); padding-top: 1.25rem; margin-top: 1.5rem;">
            <button class="btn-secondary" id="clearAllFiltersBtn" style="flex: 1; padding: 0.8rem;">CLEAR ALL</button>
            <button class="btn-primary" id="applyFiltersBtn" style="flex: 1; padding: 0.8rem;">APPLY FILTERS</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeFilterSheet')?.addEventListener('click', () => {
      container.innerHTML = '';
    });

    document.querySelectorAll('.size-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = btn.getAttribute('data-size');
        if (this.selectedSizes.includes(s)) {
          this.selectedSizes = this.selectedSizes.filter(x => x !== s);
        } else {
          this.selectedSizes.push(s);
        }
        this.openFilterSheet(reRenderCallback);
      });
    });

    document.querySelectorAll('.cat-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentCategory = btn.getAttribute('data-cat');
        this.openFilterSheet(reRenderCallback);
      });
    });

    document.getElementById('clearAllFiltersBtn')?.addEventListener('click', () => {
      this.selectedSizes = [];
      this.currentCategory = 'All';
      this.searchQuery = '';
      container.innerHTML = '';
      reRenderCallback();
    });

    document.getElementById('applyFiltersBtn')?.addEventListener('click', () => {
      container.innerHTML = '';
      reRenderCallback();
    });
  }

  attachEvents(reRenderCallback) {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        reRenderCallback();
      });
    }

    // Category pills
    document.querySelectorAll('.category-scroll-row .pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showOnlyWishlist = false;
        this.currentCategory = btn.getAttribute('data-category');
        reRenderCallback();
      });
    });

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        reRenderCallback();
      });
    }

    // Open Filter Sheet
    document.getElementById('openFilterBtn')?.addEventListener('click', () => {
      this.openFilterSheet(reRenderCallback);
    });

    // Clear wishlist filter
    document.getElementById('clearWishlistFilterBtn')?.addEventListener('click', () => {
      this.showOnlyWishlist = false;
      reRenderCallback();
    });

    // Wishlist Heart Buttons
    document.querySelectorAll('.card-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-wishlist-id');
        this.toggleWishlist(id, e);
        reRenderCallback();
      });
    });

    // Quick add to cart
    document.querySelectorAll('.store-quick-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');

        if (!store.isCustomerLoggedIn()) {
          authModal.open('login', 'Please verify your phone number to add items to cart', () => {
            store.addToCart(id, "M", 1);
          });
        } else {
          store.addToCart(id, "M", 1);
        }
      });
    });

    // Click card opens detail view
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-product-id');
        window.dispatchEvent(new CustomEvent('openProductDetail', { detail: { productId: id } }));
      });
    });
  }
}
