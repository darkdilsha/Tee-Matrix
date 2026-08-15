// TEE MATRIX - Cinematic High-Fashion Landing Page Controller

import { store } from './store.js';
import { authModal } from './authModal.js';
import { fashionMotion } from './fashionMotion.js';

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
              ${products.map(product => `
                <div class="product-card" data-product-id="${product.id}">
                  <div class="card-img-wrapper">
                    <img src="${product.imagePrimary}" alt="${product.name}" class="card-img-primary" loading="lazy" />
                    <img src="${product.imageHover || product.imagePrimary}" alt="${product.name}" class="card-img-hover" loading="lazy" />
                    <div class="card-badges">
                      <span class="badge badge-new">${product.badge}</span>
                      <span class="badge" style="background: rgba(0,0,0,0.7); color: #fff;">${product.category}</span>
                    </div>
                    <div class="card-quick-add">
                      <button class="btn-primary quick-add-btn magnetic-btn" data-id="${product.id}" style="width: 100%; padding: 0.8rem 1rem; font-size: 0.75rem;">
                        QUICK ADD TO CART
                      </button>
                    </div>
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
              `).join('')}
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

        <!-- Section 4: Pinned Sticky Collection Showcase (Zara / Jacquemus Moment) -->
        <section class="pinned-section-container" id="pinnedCollectionContainer">
          <div class="pinned-sticky-view">
            <!-- Crossfading Campaign Slides -->
            <img src="assets/tee_acid_wash.jpg" class="pinned-bg-slide active" alt="Look 01" />
            <img src="assets/story_campaign.jpg" class="pinned-bg-slide" alt="Look 02" />
            <img src="assets/tee_black_heavy.jpg" class="pinned-bg-slide" alt="Look 03" />

            <div style="position: absolute; inset: 0; background: linear-gradient(to right, rgba(8,8,8,0.85) 0%, rgba(8,8,8,0.3) 60%, transparent 100%);"></div>

            <div class="container" style="position: relative; z-index: 10; max-width: 650px;">
              <span class="section-tag" style="color: var(--accent-gold); letter-spacing: 0.3em;">FEATURED LOOKBOOK</span>
              <h2 style="font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 3.8rem); line-height: 1.1; color: #fff; margin: 1rem 0;">
                THE ACID MATRIX SERIES
              </h2>
              <p id="pinnedSubtitle" style="font-size: 1rem; color: var(--text-secondary); line-height: 1.8; margin-bottom: 2.5rem; letter-spacing: 0.05em; transition: opacity 0.4s ease;">
                CAMPAIGN LOOK 01: HEAVYWEIGHT ACID WASH SILHOUETTE
              </p>
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

        <!-- Minimalist Footer -->
        <footer class="footer">
          <div class="container">
            <div class="footer-grid">
              <div>
                <h3 class="brand-font" style="font-size: 1.4rem; color: #fff; margin-bottom: 1rem;">TEE MATRIX</h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; max-width: 280px;">
                  Online-only luxury streetwear brand specializing in heavyweight boxy fit t-shirts.
                </p>
              </div>

              <div>
                <h4 style="font-size: 0.85rem; letter-spacing: 0.15em; text-transform: uppercase; color: #fff; margin-bottom: 1rem;">NAVIGATION</h4>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem;">
                  <li><a href="#" class="footer-link" id="footShop">All Products</a></li>
                  <li><a href="#new-arrivals" class="footer-link">New Arrivals</a></li>
                  <li><a href="#story" class="footer-link">Brand Story</a></li>
                </ul>
              </div>

              <div>
                <h4 style="font-size: 0.85rem; letter-spacing: 0.15em; text-transform: uppercase; color: #fff; margin-bottom: 1rem;">CUSTOMER CARE</h4>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem; color: var(--text-secondary);">
                  <li>Direct Doorstep Delivery</li>
                  <li>Track Online Order</li>
                  <li>Returns & Exchange Policy</li>
                  <li>Size & Drape Guide</li>
                </ul>
              </div>

              <div>
                <h4 style="font-size: 0.85rem; letter-spacing: 0.15em; text-transform: uppercase; color: #fff; margin-bottom: 1rem;">CONNECT</h4>
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                  <a href="https://instagram.com" target="_blank" style="color: #fff; background: rgba(255,255,255,0.05); padding: 0.6rem; border: 1px solid var(--border-color);">Instagram</a>
                  <a href="https://wa.me" target="_blank" style="color: #fff; background: rgba(255,255,255,0.05); padding: 0.6rem; border: 1px solid var(--border-color);">WhatsApp</a>
                </div>
                <span style="font-size: 0.75rem; color: var(--text-muted);">24/7 Digital Concierge Support</span>
              </div>
            </div>

            <div class="footer-bottom">
              <span>&copy; 2026 TEE MATRIX ONLINE STOREFRONT. ALL RIGHTS RESERVED.</span>
              <span>DIRECT-TO-CONSUMER ONLINE EXCLUSIVE</span>
            </div>
          </div>
        </footer>
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

