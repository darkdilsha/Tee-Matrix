// TEE MATRIX - Premium High-Fashion Motion & Smooth Scroll Controller (Lenis + GSAP)

export class FashionMotionController {
  constructor() {
    this.lenis = null;
    this.isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.EASE_PREMIUM = 'power3.out'; // cubic-bezier(0.16, 1, 0.3, 1)
  }

  init() {
    this.createGlobalElements();
    this.initSmoothScroll();
    
    if (!this.isMobile && !this.isReducedMotion) {
      this.initMagneticButtons();
    }

    this.runIntroSequence();
  }

  createGlobalElements() {
    // 1. Scroll Progress Bar
    if (!document.getElementById('scrollProgressBar')) {
      const progressBar = document.createElement('div');
      progressBar.id = 'scrollProgressBar';
      progressBar.className = 'scroll-progress-bar';
      progressBar.innerHTML = `<div class="scroll-progress-fill" id="scrollProgressFill"></div>`;
      document.body.appendChild(progressBar);
    }

    // 2. Page Transition Wipe
    if (!document.getElementById('pageTransitionWipe')) {
      const wipeEl = document.createElement('div');
      wipeEl.id = 'pageTransitionWipe';
      wipeEl.className = 'page-transition-wipe';
      document.body.appendChild(wipeEl);
    }
  }

  initSmoothScroll() {
    if (typeof Lenis === 'undefined') return;

    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });

    // Perfect Sync: Lenis scroll updates connected with GSAP ScrollTrigger ticker
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      this.lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        this.lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        this.lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }

    // Update vertical scroll progress indicator
    this.lenis.on('scroll', (e) => {
      const fill = document.getElementById('scrollProgressFill');
      if (fill) {
        const progress = (e.scroll / (e.limit || 1)) * 100;
        fill.style.height = `${Math.min(100, Math.max(0, progress))}%`;
      }
    });
  }

  runIntroSequence() {
    let loader = document.getElementById('pageLoader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'pageLoader';
      loader.className = 'page-loader';
      loader.innerHTML = `
        <div class="page-loader-brand" id="loaderBrand">TEE MATRIX</div>
        <div class="page-loader-line" id="loaderLine"></div>
      `;
      document.body.appendChild(loader);
    }

    if (this.isReducedMotion) {
      loader.remove();
      this.initLandingAnimations();
      return;
    }

    // GSAP Preloader Sequence - Smooth GPU Transforms Only
    if (typeof gsap !== 'undefined') {
      const tl = gsap.timeline();
      tl.to('#loaderBrand', { opacity: 1, y: 0, duration: 0.8, ease: this.EASE_PREMIUM })
        .to('#loaderLine', { scaleX: 1, duration: 0.7, ease: 'power2.inOut' })
        .to('#pageLoader', { y: '-100%', duration: 0.9, ease: 'power4.inOut', delay: 0.2, onComplete: () => {
          loader.remove();
          this.initLandingAnimations();
        }});
    } else {
      setTimeout(() => {
        loader.style.transform = 'translateY(-100%)';
        setTimeout(() => {
          loader.remove();
          this.initLandingAnimations();
        }, 900);
      }, 1000);
    }
  }

  initLandingAnimations() {
    if (typeof gsap === 'undefined' || this.isReducedMotion) return;

    // Clean up existing ScrollTrigger instances before initializing
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach(st => st.kill());
    }

    // 1. Hero Entrance - Subtle, Deliberate Transforms (No blur, no heavy jumps)
    const heroBg = document.getElementById('heroBg');
    if (heroBg) {
      gsap.fromTo(heroBg, 
        { opacity: 0.5, scale: 1.05 },
        { opacity: 1.0, scale: 1.0, duration: 1.8, ease: this.EASE_PREMIUM }
      );
    }

    // Hero Text Sequenced Reveal (~150ms delay between elements)
    const heroTl = gsap.timeline({ delay: 0.2 });

    heroTl.fromTo('.hero-subtitle', 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.0, ease: this.EASE_PREMIUM }
    )
    .fromTo('.hero-title', 
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, ease: this.EASE_PREMIUM },
      '-=0.85'
    )
    .fromTo('.hero-desc', 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.0, ease: this.EASE_PREMIUM },
      '-=0.85'
    )
    .fromTo('#heroShopBtn', 
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: this.EASE_PREMIUM },
      '-=0.80'
    );

    // 2. Performance-Optimized Parallax (Max 1 layer per section, ~0.9x subtle scroll speed)
    if (typeof ScrollTrigger !== 'undefined' && !this.isMobile) {
      if (heroBg) {
        gsap.to(heroBg, {
          yPercent: 8, // Subtle displacement
          ease: 'none',
          scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        });
      }

      const storyBg = document.getElementById('storyBg');
      if (storyBg) {
        gsap.to(storyBg, {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: '#story',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      }
    }

    // 3. Section Revealer - Played ONCE per section, consistent motion language (fade + subtle rise)
    if (typeof ScrollTrigger !== 'undefined') {
      document.querySelectorAll('.editorial-section').forEach((section) => {
        const tag = section.querySelector('.section-tag');
        const title = section.querySelector('.section-title');
        const cards = section.querySelectorAll('.product-card');

        // Combined section reveal timeline playing once
        const secTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none', // Play ONCE
            once: true
          }
        });

        if (tag) {
          secTl.fromTo(tag, 
            { y: 16, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.8, ease: this.EASE_PREMIUM }
          );
        }

        if (title) {
          secTl.fromTo(title,
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.0, ease: this.EASE_PREMIUM },
            tag ? '-=0.65' : 0
          );
        }

        if (cards.length > 0) {
          secTl.fromTo(cards,
            { y: 28, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1.0,
              stagger: 0.1, // Controlled stagger
              ease: this.EASE_PREMIUM
            },
            title ? '-=0.75' : 0
          );
        }
      });

      // 4. Pinned Collection Showcase
      this.initPinnedCollectionSection();
    }
  }

  initPinnedCollectionSection() {
    const container = document.getElementById('pinnedCollectionContainer');
    if (!container || typeof ScrollTrigger === 'undefined') return;

    const slides = container.querySelectorAll('.pinned-bg-slide');
    const subtitle = document.getElementById('pinnedSubtitle');
    const looks = [
      "CAMPAIGN LOOK 01: HEAVYWEIGHT ACID WASH SILHOUETTE",
      "CAMPAIGN LOOK 02: DYSTOPIAN CYBERNETIC GRAPHIC CUT",
      "CAMPAIGN LOOK 03: JET BLACK ATELIER MINIMAL SILHOUETTE"
    ];

    ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: '+=200%',
      pin: true,
      scrub: 0.8,
      onUpdate: (self) => {
        const index = Math.min(slides.length - 1, Math.floor(self.progress * slides.length));
        
        slides.forEach((slide, idx) => {
          if (idx === index) {
            slide.classList.add('active');
          } else {
            slide.classList.remove('active');
          }
        });

        if (subtitle && looks[index]) {
          subtitle.innerText = looks[index];
        }
      }
    });
  }

  initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.magnetic-btn');

    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const btnCenterX = rect.left + rect.width / 2;
        const btnCenterY = rect.top + rect.height / 2;

        const distanceX = e.clientX - btnCenterX;
        const distanceY = e.clientY - btnCenterY;

        btn.style.transform = `translate3d(${distanceX * 0.18}px, ${distanceY * 0.18}px, 0)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = `translate3d(0, 0, 0)`;
      });
    });
  }

  triggerStoreTransition(onComplete) {
    const wipe = document.getElementById('pageTransitionWipe');
    if (!wipe) {
      onComplete();
      return;
    }

    wipe.classList.add('active');
    setTimeout(() => {
      onComplete();
      setTimeout(() => {
        wipe.classList.remove('active');
      }, 600);
    }, 600);
  }
}

export const fashionMotion = new FashionMotionController();
