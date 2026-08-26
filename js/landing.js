// TEE MATRIX - Cinematic High-Fashion Landing Page Controller

import { store } from './store.js';
import { authModal } from './authModal.js';
import { fashionMotion } from './fashionMotion.js';
import { renderSiteFooter } from './policies.js';

export class LandingPage {
  constructor(onShopClick) {
    this.onShopClick = onShopClick;
  }

  render() {
    const products = store.getNewArrivals();

    return `
      <div class="landing-container">
        <!-- Section 1: Hero -->
        <section class="hero-section" id="hero">
          <div class="hero-bg" id="heroBg"></div>
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <div class="text-mask-wrapper" style="margin-bottom: 0.5rem;">
              <p class="hero-subtitle">SPRING / SUMMER 2026 CAMPAIGN</p>
            </div>
            <div class="text-mask-wrapper" style="display: block; margin-bottom: 1.5rem;">
              <h1 class="hero-title brand-font">TEE MATRIX</h1>
            </div>
            <div class="text-mask-wrapper" style="display: block; margin-bottom: 2rem;">
              <p class="hero-desc">ARCHITECTURAL CUTS. HEAVYWEIGHT SILHOUETTES. EXCLUSIVE ONLINE DROPS.</p>
            </div>

            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
              <button class="btn-primary magnetic-btn" id="heroShopBtn">
                <span>VIEW ALL PRODUCTS</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
          <div class="scroll-indicator">
            <span>SCROLL TO EXPLORE</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
            </svg>
          </div>
        </section>

        <!-- Section 2: New Arrivals Editorial -->
        <section class="editorial-section container" id="new-arrivals">
          <div style="width: 100%;">
            <div class="section-header">
              <span class="section-tag">CURATED RELEASES</span>
              <h2 class="section-title reveal-text clip-reveal-title">NEW ARRIVALS</h2>
            </div>
            
            <div class="grid-arrivals">
              ${products.map(product => {
                const inStock = product.inStock !== false && (product.stockQty === undefined || Number(product.stockQty) > 0);
                return `
                <div class="product-card ${!inStock ? 'out-of-stock' : ''}" data-product-id="${product.id}">
                  <div class="card-img-wrapper" style="${!inStock ? 'opacity: 0.8;' : ''}">
                    <img src="${product.imagePrimary}" alt="${product.name}" class="card-img-primary" loading="lazy" />
                    <img src="${product.imageHover || product.imagePrimary}" alt="${product.name}" class="card-img-hover" loading="lazy" />
                    <div class="card-badges">
                      ${product.badge ? `<span class="badge badge-new">${product.badge}</span>` : ''}
                      <span class="badge ${inStock ? 'badge-stock' : 'badge-out'}">
                        ${inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                      </span>
                    </div>
                    ${inStock ? `
                      <div class="card-quick-add">
                        <button class="btn-primary quick-add-btn magnetic-btn" data-id="${product.id}" style="width: 100%; padding: 0.8rem 1rem; font-size: 0.75rem;">
                          QUICK ADD TO CART
                        </button>
                      </div>
                    ` : `
                      <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; pointer-events: none;">
                        <span class="badge badge-out" style="padding: 0.4rem 0.8rem; font-size: 0.75rem; letter-spacing: 0.1em; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">SOLD OUT</span>
                      </div>
                    `}
                  </div>
                  <div class="card-content">
                    <span class="card-category">${product.category}</span>
                    <h3 class="card-title">${product.name}</h3>
                    <div class="card-specs">
                      <span>Fit: ${product.fit}</span>
                    </div>
                    <div class="card-footer">
                      <span class="card-price">₹${product.price.toLocaleString('en-IN')}</span>
                      <span style="font-size: 0.75rem; color: var(--text-muted);">ONLINE EXCLUSIVE</span>
                    </div>
                  </div>
                </div>
                `;
              }).join('')}
            </div>
          </div>
        </section>

        <!-- Section 3: Our Story Parallax Narrative -->
        <section class="story-section" id="story">
          <div class="story-bg" id="storyBg" style="position: absolute; inset: 0; background-image: url('assets/story_campaign.jpg'); background-size: cover; background-position: center;"></div>
          <div class="story-overlay"></div>
          <div class="story-card glass-panel reveal-box">
            <span class="section-tag" style="color: var(--text-secondary);">CRAFT & ARCHITECTURE</span>
            <h2 class="story-title brand-font clip-reveal-title">OUR STORY</h2>
            <p class="story-text">
              Tee Matrix was founded on the philosophy that a t-shirt is the fundamental canvas of contemporary fashion. 
              We engineer limited online releases crafted exclusively from combed organic heavy cotton. 
              With drop-shoulder boxy silhouettes, pre-shrunk fabrics, and high-density vintage treatments, our pieces embody understated luxury.
            </p>
            <p class="story-text" style="margin-bottom: 2.5rem;">
              No retail markups. No offline distributors. Delivered straight from our studio to your door worldwide.
            </p>
            <button class="btn-secondary magnetic-btn" id="storyShopBtn">
              EXPLORE THE ATELIER
            </button>
          </div>
        </section>

        <!-- Section 4: Pinned Sticky Collection Showcase (Multi-Look Editorial Scroll) -->
        <section class="pinned-section-container" id="pinnedCollectionContainer">
          <div class="pinned-sticky-view">
            <!-- Crossfading Campaign Slides with Explicit Dimensions & Reserved Aspect Ratio -->
            <img src="assets/tee_acid_wash.jpg" width="1920" height="1080" style="aspect-ratio: 16/9; width: 100%; height: 100%; object-fit: cover;" class="pinned-bg-slide active" alt="Look 01" />
            <img src="assets/story_campaign.jpg" width="1920" height="1080" style="aspect-ratio: 16/9; width: 100%; height: 100%; object-fit: cover;" class="pinned-bg-slide" alt="Look 02" />
            <img src="assets/tee_black_heavy.jpg" width="1920" height="1080" style="aspect-ratio: 16/9; width: 100%; height: 100%; object-fit: cover;" class="pinned-bg-slide" alt="Look 03" />

            <div style="position: absolute; inset: 0; background: linear-gradient(to right, rgba(8,8,8,0.88) 0%, rgba(8,8,8,0.4) 65%, transparent 100%);"></div>

            <div class="container" style="position: relative; z-index: 10; max-width: 650px;">
              <span class="section-tag" id="pinnedTag" style="color: var(--accent-gold); letter-spacing: 0.3em; transition: opacity 0.3s ease;">LOOK 01 / 03 &bull; FEATURED LOOKBOOK</span>
              <h2 id="pinnedTitle" style="font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 3.8rem); line-height: 1.1; color: #fff; margin: 0.8rem 0; transition: opacity 0.3s ease;">
                THE ACID MATRIX SERIES
              </h2>
              <p id="pinnedSubtitle" style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 1.5rem; letter-spacing: 0.02em; transition: opacity 0.3s ease;">
                Custom acid wash finish crafted from heavyweight combed organic cotton with drop-shoulder boxy drape.
              </p>

              <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem;">
                <span id="pinnedPrice" style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 700; color: #fff; transition: opacity 0.3s ease;">₹1,999</span>
                <span class="badge badge-stock">LIMITED ONLINE DROP</span>
              </div>

              <button class="btn-primary magnetic-btn" id="pinnedShopBtn" style="padding: 1.1rem 2.8rem;">
                <span>EXPLORE LOOKBOOK</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </section>

        <!-- Section 5: Closing Visual Section & Prominent CTA -->
        <section class="cta-showcase">
          <div class="container">
            <span class="section-tag" style="letter-spacing: 0.4em;">READY TO ELEVATE YOUR WARDROBE?</span>
            <h2 class="cta-title clip-reveal-title">THE STORE IS NOW OPEN</h2>
            <p style="color: var(--text-secondary); max-width: 550px; margin: 0 auto 3rem; line-height: 1.6;">
              Browse our complete catalog of heavyweight minimalist t-shirts, graphic drops, and exclusive colorways. Express online shipping available worldwide.
            </p>
            <button class="btn-primary magnetic-btn" id="ctaShopBtn" style="padding: 1.3rem 3.5rem; font-size: 0.95rem;">
              <span>VIEW ALL PRODUCTS</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </section>

        <!-- Global Site Footer -->
        ${renderSiteFooter()}
      </div>
    `;
  }

  attachEvents() {
    // Transition to Shop with curtain wipe
    const navigateToShopWithTransition = () => {
      fashionMotion.triggerStoreTransition(() => {
        this.onShopClick();
      });
    };

    document.getElementById('heroShopBtn')?.addEventListener('click', navigateToShopWithTransition);
    document.getElementById('storyShopBtn')?.addEventListener('click', navigateToShopWithTransition);
    document.getElementById('pinnedShopBtn')?.addEventListener('click', navigateToShopWithTransition);
    document.getElementById('ctaShopBtn')?.addEventListener('click', navigateToShopWithTransition);
    document.getElementById('footShop')?.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToShopWithTransition();
    });

    // Quick Add buttons on product cards
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
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

    // Click on product cards opens detail view
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-product-id');
        window.dispatchEvent(new CustomEvent('openProductDetail', { detail: { productId: id } }));
      });
    });

    // Initialize GSAP + Lenis fashion motion animations
    setTimeout(() => {
      fashionMotion.init();
    }, 50);
  }
}

