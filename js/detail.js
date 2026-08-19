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

    const origPrice = Math.round(product.price * 1.25);
    const inStock = product.inStock !== false && (product.stockQty === undefined || Number(product.stockQty) > 0);
    const relatedProducts = store.getProducts()
      .filter(p => p.id !== product.id)
      .slice(0, 4);

    backdrop.innerHTML = `
      <div class="modal-content glass-panel" style="padding: 2.5rem 2rem; max-width: 860px; border-radius: 16px;">
        <button class="modal-close" id="closeDetailBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2.5rem; margin-bottom: 2.5rem;">
          <!-- Gallery View with Draggable Swipe Carousel -->
          <div>
            <div style="position: relative; aspect-ratio: 3/4; overflow: hidden; background: #111; margin-bottom: 1rem; border: 1px solid var(--border-color); border-radius: 8px; user-select: none;" id="mainImgContainer">
              <div id="detailGalleryTrack" style="display: flex; height: 100%; width: ${productImages.length * 100}%; cursor: grab; touch-action: pan-y; will-change: transform;">
                ${productImages.map(imgSrc => `
                  <div style="width: ${100 / productImages.length}%; height: 100%; flex-shrink: 0;">
                    <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;" alt="${product.name}" />
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Multi-Photo Gallery Thumbnails -->
            <div style="display: flex; gap: 0.6rem; overflow-x: auto; padding-bottom: 0.5rem;">
              ${productImages.map((imgSrc, idx) => `
                <img src="${imgSrc}" class="thumb-img ${imgSrc === this.activeImg ? 'active' : ''}" data-index="${idx}" data-src="${imgSrc}" style="width: 70px; height: 90px; object-fit: cover; border-radius: 4px; border: ${imgSrc === this.activeImg ? '2px solid #ffffff' : '1px solid var(--border-color)'}; cursor: pointer; opacity: ${imgSrc === this.activeImg ? '1' : '0.65'}; transition: all 0.2s ease; flex-shrink: 0;" />
              `).join('')}
            </div>
          </div>

          <!-- Product Meta & Purchase Actions -->
          <div style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span class="section-tag">${product.category} &bull; ${product.badge || 'EXCLUSIVE'}</span>
              <h2 style="font-family: var(--font-heading); font-size: 1.8rem; color: #fff; margin: 0.25rem 0 0.75rem;">${product.name}</h2>
              
              <!-- Pricing & Strikethrough Badge -->
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
                <div>
                  <span class="price-original" style="font-size: 1.1rem;">₹${origPrice.toLocaleString('en-IN')}</span>
                  <span style="font-size: 1.8rem; font-weight: 800; color: #fff; font-family: var(--font-heading);">₹${product.price.toLocaleString('en-IN')}</span>
                </div>
                <span class="discount-badge" style="font-size: 0.8rem; padding: 0.25rem 0.6rem;">20% OFF</span>
                <span class="badge ${inStock ? 'badge-stock' : 'badge-out'}">
                  ${inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                </span>
              </div>

              <!-- One-Line Delivery Estimate -->
              <div style="padding: 0.75rem 1rem; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; font-size: 0.85rem; color: #10b981; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.6rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                <span>Delivered in 4-6 business days with express doorstep tracking</span>
              </div>

              <!-- Product Description -->
              <div style="margin-bottom: 1.25rem;">
                <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.65; margin: 0;">
                  ${product.description}
                </p>
              </div>

              <!-- Product Highlights -->
              ${product.highlights && product.highlights.length > 0 ? `
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 10px;">
                  <span style="display: block; font-size: 0.75rem; font-weight: 700; color: #fff; letter-spacing: 0.08em; margin-bottom: 0.75rem; text-transform: uppercase;">
                    PRODUCT HIGHLIGHTS
                  </span>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.5rem 1rem;">
                    ${product.highlights.map(h => `
                      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-secondary);">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold, #f59e0b)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>${h}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Size Selector -->
              <div style="margin-bottom: 1.25rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.6rem; font-size: 0.8rem;">
                  <span style="color: #fff; font-weight: 600;">SELECT SIZE:</span>
                  <span style="color: var(--text-muted); text-decoration: underline; cursor: pointer;">SIZE GUIDE</span>
                </div>
                <div style="display: flex; gap: 0.6rem;">
                  ${product.sizes.map(size => `
                    <button class="size-btn ${this.selectedSize === size ? 'active' : ''}" data-size="${size}" style="padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid ${this.selectedSize === size ? '#ffffff' : 'var(--border-color)'}; background: ${this.selectedSize === size ? '#ffffff' : 'transparent'}; color: ${this.selectedSize === size ? '#000000' : '#ffffff'}; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                      ${size}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Quantity Selector -->
              <div style="margin-bottom: 1.75rem;">
                <span style="color: #fff; font-weight: 600; font-size: 0.8rem; display: block; margin-bottom: 0.5rem;">QUANTITY:</span>
                <div style="display: inline-flex; border: 1px solid var(--border-color); border-radius: 6px; background: rgba(255,255,255,0.05); overflow: hidden;">
                  <button id="qtyMinusBtn" style="padding: 0.5rem 0.9rem; color: #fff; font-size: 1.1rem; cursor: pointer;" ${!inStock ? 'disabled' : ''}>-</button>
                  <span id="qtyVal" style="padding: 0.5rem 1.2rem; color: #fff; font-weight: 600; font-size: 0.9rem; border-left: 1px solid var(--border-color); border-right: 1px solid var(--border-color);">${this.qty}</span>
                  <button id="qtyPlusBtn" style="padding: 0.5rem 0.9rem; color: #fff; font-size: 1.1rem; cursor: pointer;" ${!inStock ? 'disabled' : ''}>+</button>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 0.85rem; flex-wrap: wrap;">
              <button class="btn-primary" id="detailAddToCartBtn" style="flex: 1; min-width: 170px; border-radius: 8px; padding: 0.9rem; ${!inStock ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${!inStock ? 'disabled' : ''}>
                <span>${inStock ? 'ADD TO CART' : 'OUT OF STOCK'}</span>
              </button>
              <button class="btn-secondary" id="detailBuyNowBtn" style="flex: 1; min-width: 160px; border-radius: 8px; padding: 0.9rem; border-color: var(--accent-gold); color: var(--accent-gold); ${!inStock ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${!inStock ? 'disabled' : ''}>
                BUY NOW
              </button>
            </div>
          </div>
        </div>

        <!-- You May Also Like Section -->
        <div style="border-top: 1px solid var(--border-color); padding-top: 1.75rem;">
          <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: #fff; margin-bottom: 1.25rem; letter-spacing: 0.1em;">YOU MAY ALSO LIKE</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem;">
            ${relatedProducts.map(rel => `
              <div class="rel-product-card" data-id="${rel.id}" style="cursor: pointer; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.6rem; transition: transform 0.2s ease;">
                <img src="${rel.imagePrimary}" alt="${rel.name}" style="width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 4px; margin-bottom: 0.5rem;" />
                <h4 style="font-size: 0.8rem; color: #fff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${rel.name}</h4>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">₹${rel.price.toLocaleString('en-IN')}</span>
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
    
    const backdrop = document.getElementById('productDetailBackdrop');
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close();
    });

    // GSAP Draggable Product Gallery Carousel Integration
    const track = document.getElementById('detailGalleryTrack');
    const container = document.getElementById('mainImgContainer');
    const thumbs = document.querySelectorAll('.thumb-img');
    const totalSlides = thumbs.length;

    const updateActiveThumb = (index) => {
      thumbs.forEach((t, i) => {
        t.style.opacity = i === index ? '1' : '0.65';
        t.style.border = i === index ? '2px solid #ffffff' : '1px solid var(--border-color)';
      });
    };

    let draggableInstance = null;

    if (track && container && typeof Draggable !== 'undefined') {
      const slideWidth = container.clientWidth;
      const maxDrag = -slideWidth * (totalSlides - 1);

      draggableInstance = Draggable.create(track, {
        type: 'x',
        bounds: { minX: maxDrag, maxX: 0 },
        inertia: true,
        snap: (endValue) => {
          const index = Math.round(Math.abs(endValue) / slideWidth);
          return -index * slideWidth;
        },
        onDragEnd: function () {
          const index = Math.min(totalSlides - 1, Math.max(0, Math.round(Math.abs(this.x) / slideWidth)));
          updateActiveThumb(index);
        },
        onThrowComplete: function () {
          const index = Math.min(totalSlides - 1, Math.max(0, Math.round(Math.abs(this.x) / slideWidth)));
          updateActiveThumb(index);
        }
      })[0];
    }

    // Gallery Thumbnail Direct Selection
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const idx = parseInt(thumb.getAttribute('data-index') || '0', 10);
        updateActiveThumb(idx);

        if (container && track) {
          const slideWidth = container.clientWidth;
          const targetX = -idx * slideWidth;

          if (typeof gsap !== 'undefined') {
            gsap.to(track, {
              x: targetX,
              duration: 0.35,
              ease: 'power2.out',
              onUpdate: () => draggableInstance && draggableInstance.update()
            });
          } else {
            track.style.transform = `translate3d(${targetX}px, 0, 0)`;
          }
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
        authModal.open('login', 'Please verify mobile OTP to add items to cart', () => {
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
        authModal.open('login', 'Please verify mobile OTP to proceed with Instant Buy', () => {
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

export const productDetailModal = new ProductDetailModal();
