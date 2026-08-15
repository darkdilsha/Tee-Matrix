// TEE MATRIX - Product Detail Modal Component

import { store } from './store.js';
import { authModal } from './authModal.js';

export class ProductDetailModal {
  constructor() {
    this.productId = null;
    this.selectedSize = "M";
    this.qty = 1;
    this.activeImg = null;
  }

  open(productId) {
    this.productId = productId;
    const product = store.getProductById(productId);
    if (!product) return;

    const productImages = product.images && product.images.length > 0 
      ? product.images 
      : [product.imagePrimary, product.imageHover].filter(Boolean);

    this.selectedSize = product.sizes[0] || "M";
    this.qty = 1;
    this.activeImg = productImages[0] || product.imagePrimary;

    this.renderModal(product, productImages);
  }

  close() {
    const backdrop = document.getElementById('productDetailBackdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      setTimeout(() => backdrop.remove(), 300);
    }
  }

  renderModal(product, productImages) {
    let backdrop = document.getElementById('productDetailBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'productDetailBackdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    const relatedProducts = store.getProducts()
      .filter(p => p.id !== product.id)
      .slice(0, 3);

    backdrop.innerHTML = `
      <div class="modal-content glass-panel" style="padding: 3rem 2rem;">
        <button class="modal-close" id="closeDetailBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 3rem; margin-bottom: 3rem;">
          <!-- Gallery View -->
          <div>
            <div style="position: relative; aspect-ratio: 3/4; overflow: hidden; background: #111; margin-bottom: 1rem; border: 1px solid var(--border-color);" id="mainImgContainer">
              <img src="${this.activeImg}" id="detailMainImg" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s ease;" />
            </div>

            <!-- Multi-Photo Gallery Thumbnails -->
            <div style="display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem;">
              ${productImages.map((imgSrc, idx) => `
                <img src="${imgSrc}" class="thumb-img ${imgSrc === this.activeImg ? 'active' : ''}" data-src="${imgSrc}" style="width: 75px; height: 95px; object-fit: cover; border: ${imgSrc === this.activeImg ? '2px solid #ffffff' : '1px solid var(--border-color)'}; cursor: pointer; opacity: ${imgSrc === this.activeImg ? '1' : '0.6'}; transition: all 0.2s ease; flex-shrink: 0;" />
              `).join('')}
            </div>
            <span style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-top: 0.25rem;">Click photo to view angle (${productImages.length} Photos Available)</span>
          </div>

          <!-- Product Meta & Actions -->
          <div style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span class="section-tag">${product.category} &bull; ${product.badge}</span>
              <h2 style="font-family: var(--font-heading); font-size: 2rem; color: #fff; margin-bottom: 0.75rem;">${product.name}</h2>
              
              <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem;">
                <span style="font-size: 1.8rem; font-weight: 700; color: #fff; font-family: var(--font-heading);">₹${product.price.toLocaleString('en-IN')}</span>
                <span class="badge ${product.inStock ? 'badge-stock' : 'badge-out'}">
                  ${product.inStock ? `IN STOCK (${product.stockQty} UNITS)` : 'OUT OF STOCK'}
                </span>
              </div>

              <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.7; margin-bottom: 2rem;">
                ${product.description}
              </p>

              <!-- Specs Grid -->
              <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 1.25rem; margin-bottom: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.85rem;">
                <div>
                  <span style="color: var(--text-muted); display: block; font-size: 0.75rem;">FABRIC WEIGHT</span>
                  <strong style="color: #fff;">Heavyweight Premium</strong>
                </div>
                <div>
                  <span style="color: var(--text-muted); display: block; font-size: 0.75rem;">FIT SILHOUETTE</span>
                  <strong style="color: #fff;">${product.fit}</strong>
                </div>
                <div>
                  <span style="color: var(--text-muted); display: block; font-size: 0.75rem;">MATERIAL</span>
                  <strong style="color: #fff;">${product.fabric}</strong>
                </div>
                <div>
                  <span style="color: var(--text-muted); display: block; font-size: 0.75rem;">SHIPPING</span>
                  <strong style="color: #fff;">Direct Doorstep Delivery</strong>
                </div>
              </div>

              <!-- Size Selector -->
              <div style="margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.85rem;">
                  <span style="color: #fff; font-weight: 600;">SELECT SIZE:</span>
                  <span style="color: var(--text-muted); font-size: 0.75rem; text-decoration: underline; cursor: pointer;">SIZE & FIT GUIDE</span>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                  ${product.sizes.map(size => `
                    <button class="size-btn ${this.selectedSize === size ? 'active' : ''}" data-size="${size}" style="padding: 0.6rem 1.2rem; border: 1px solid ${this.selectedSize === size ? '#ffffff' : 'var(--border-color)'}; background: ${this.selectedSize === size ? '#ffffff' : 'transparent'}; color: ${this.selectedSize === size ? '#000000' : '#ffffff'}; font-weight: 700; font-size: 0.85rem;">
                      ${size}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Quantity Selector -->
              <div style="margin-bottom: 2rem;">
                <span style="color: #fff; font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.75rem;">QUANTITY:</span>
                <div style="display: inline-flex; border: 1px solid var(--border-color); background: rgba(255,255,255,0.05);">
                  <button id="qtyMinusBtn" style="padding: 0.6rem 1rem; color: #fff; font-size: 1.1rem;">-</button>
                  <span id="qtyVal" style="padding: 0.6rem 1.5rem; color: #fff; font-weight: 600; font-size: 0.95rem; border-left: 1px solid var(--border-color); border-right: 1px solid var(--border-color);">${this.qty}</span>
                  <button id="qtyPlusBtn" style="padding: 0.6rem 1rem; color: #fff; font-size: 1.1rem;">+</button>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <button class="btn-primary" id="detailAddToCartBtn" style="flex: 1; min-width: 200px;" ${!product.inStock ? 'disabled' : ''}>
                <span>${product.inStock ? 'ADD TO CART' : 'OUT OF STOCK'}</span>
              </button>
              <button class="btn-secondary" id="detailBuyNowBtn" style="flex: 1; min-width: 180px;" ${!product.inStock ? 'disabled' : ''}>
                BUY NOW
              </button>
            </div>
          </div>
        </div>

        <!-- You May Also Like Section -->
        <div style="border-top: 1px solid var(--border-color); padding-top: 2rem;">
          <h3 style="font-family: var(--font-heading); font-size: 1.2rem; color: #fff; margin-bottom: 1.5rem; letter-spacing: 0.1em;">YOU MAY ALSO LIKE</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
            ${relatedProducts.map(rel => `
              <div class="rel-product-card" data-id="${rel.id}" style="cursor: pointer; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 0.75rem;">
                <img src="${rel.imagePrimary}" alt="${rel.name}" style="width: 100%; aspect-ratio: 3/4; object-fit: cover; margin-bottom: 0.75rem;" />
                <h4 style="font-size: 0.85rem; color: #fff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${rel.name}</h4>
                <span style="font-size: 0.85rem; color: var(--text-secondary);">₹${rel.price.toLocaleString('en-IN')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('active'), 10);
    this.attachEvents(product);
  }

  attachEvents(product) {
    document.getElementById('closeDetailBtn')?.addEventListener('click', () => this.close());
    
    // Backdrop click close
    const backdrop = document.getElementById('productDetailBackdrop');
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close();
    });

    // Gallery Thumbnails
    document.querySelectorAll('.thumb-img').forEach(thumb => {
      thumb.addEventListener('click', () => {
        document.querySelectorAll('.thumb-img').forEach(t => {
          t.style.opacity = '0.6';
          t.style.border = '1px solid var(--border-color)';
        });
        thumb.style.opacity = '1';
        thumb.style.border = '2px solid #ffffff';
        const src = thumb.getAttribute('data-src');
        const mainImg = document.getElementById('detailMainImg');
        if (mainImg) {
          mainImg.style.opacity = '0.4';
          setTimeout(() => {
            mainImg.src = src;
            mainImg.style.opacity = '1';
          }, 150);
        }
      });
    });

    // Size selector buttons
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.size-btn').forEach(b => {
          b.style.background = 'transparent';
          b.style.color = '#ffffff';
          b.style.borderColor = 'var(--border-color)';
        });
        btn.style.background = '#ffffff';
        btn.style.color = '#000000';
        btn.style.borderColor = '#ffffff';
        this.selectedSize = btn.getAttribute('data-size');
      });
    });

    // Quantity buttons
    document.getElementById('qtyMinusBtn')?.addEventListener('click', () => {
      if (this.qty > 1) {
        this.qty--;
        document.getElementById('qtyVal').innerText = this.qty;
      }
    });

    document.getElementById('qtyPlusBtn')?.addEventListener('click', () => {
      this.qty++;
      document.getElementById('qtyVal').innerText = this.qty;
    });

    // Add to Cart
    document.getElementById('detailAddToCartBtn')?.addEventListener('click', () => {
      if (!store.isCustomerLoggedIn()) {
        authModal.open('login', 'Please log in to add items to your cart', () => {
          store.addToCart(product.id, this.selectedSize, this.qty);
          this.close();
        });
      } else {
        store.addToCart(product.id, this.selectedSize, this.qty);
        this.close();
      }
    });

    // Buy Now
    document.getElementById('detailBuyNowBtn')?.addEventListener('click', () => {
      if (!store.isCustomerLoggedIn()) {
        authModal.open('login', 'Please log in to proceed with Instant Buy', () => {
          store.addToCart(product.id, this.selectedSize, this.qty);
          this.close();
          window.dispatchEvent(new CustomEvent('openCheckout'));
        });
      } else {
        store.addToCart(product.id, this.selectedSize, this.qty);
        this.close();
        window.dispatchEvent(new CustomEvent('openCheckout'));
      }
    });

    // Related products click
    document.querySelectorAll('.rel-product-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        this.open(id);
      });
    });
  }
}
