// TEE MATRIX - Premium High-Fashion Motion & Smooth Scroll Controller (Lenis + GSAP)

export class FashionMotionController {
  constructor() {
    this.lenis = null;
    this.isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.EASE_PREMIUM = 'power3.out'; // cubic-bezier(0.16, 1, 0.3, 1)

    // Force browser to disable automatic scroll restoration on reload
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }

  init() {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

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

    // Reset Lenis internal scroll position to 0 immediately on initialization
    this.lenis.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);

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

      // 4. Pinned Collection Showcase with Signature 3D Arrival Moment
      this.initPinnedCollectionSection();
      
      // 5. Desktop 3D Card Tilt-on-Hover
      this.init3DCardTilt();
    }
  }

  initPinnedCollectionSection() {
    const container = document.getElementById('pinnedCollectionContainer');
    if (!container || typeof ScrollTrigger === 'undefined') return;

    const slides = container.querySelectorAll('.pinned-bg-slide');
    const tagEl = document.getElementById('pinnedTag');
    const titleEl = document.getElementById('pinnedTitle');
    const subtitleEl = document.getElementById('pinnedSubtitle');
    const priceEl = document.getElementById('pinnedPrice');

    const lookData = [
      {
        tag: "LOOK 01 / 03 &bull; FEATURED LOOKBOOK",
        title: "THE ACID MATRIX SERIES",
        desc: "Custom acid wash finish crafted from 300 GSM combed organic cotton with drop-shoulder boxy drape.",
        price: "₹1,999"
      },
      {
        tag: "LOOK 02 / 03 &bull; FEATURED LOOKBOOK",
        title: "CYBERNETIC MATRIX DROP",
        desc: "Dystopian graphic placement on 280 GSM heavyweight jersey. Engineered for urban outerwear.",
        price: "₹2,499"
      },
      {
        tag: "LOOK 03 / 03 &bull; FEATURED LOOKBOOK",
        title: "JET BLACK ATELIER CUT",
        desc: "Minimalist heavyweight black tee with luxury reinforced double-stitched collar and pre-shrunk finish.",
        price: "₹2,299"
      }
    ];

    let lastIndex = -1;

    // Signature 3D Arrival Perspective Sequence: Played once as section enters viewport
    if (typeof gsap !== 'undefined') {
      slides.forEach(slide => {
        gsap.set(slide, {
          transformPerspective: 1000,
          scale: 0.88,
          rotationY: -10,
          rotationX: 6,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
        });
      });

      ScrollTrigger.create({
        trigger: container,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          slides.forEach(slide => {
            gsap.to(slide, {
              scale: 1.0,
              rotationY: 0,
              rotationX: 0,
              boxShadow: "0 35px 70px rgba(0,0,0,0.85)",
              duration: 1.4,
              ease: this.EASE_PREMIUM
            });
          });
        }
      });
    }

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

        if (index !== lastIndex && lookData[index]) {
          lastIndex = index;
          const data = lookData[index];

          // Crossfade text elements smoothly
          const textEls = [tagEl, titleEl, subtitleEl, priceEl].filter(Boolean);
          textEls.forEach(el => el.style.opacity = '0.2');

          setTimeout(() => {
            if (tagEl) tagEl.innerHTML = data.tag;
            if (titleEl) titleEl.innerText = data.title;
            if (subtitleEl) subtitleEl.innerText = data.desc;
            if (priceEl) priceEl.innerText = data.price;

            textEls.forEach(el => el.style.opacity = '1');
          }, 150);
        }
      }
    });
  }

  scrollTo(target, options = {}) {
    if (this.lenis) {
      this.lenis.scrollTo(target, options);
    } else {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: 'smooth' });
      }
    }
  }

  stop() {
    this.lenis?.stop();
  }

  start() {
    this.lenis?.start();
  }

  init3DCardTilt() {
    if (this.isMobile || this.isReducedMotion) return;

    const cards = document.querySelectorAll('.editorial-section .product-card');
    cards.forEach(card => {
      card.style.transformStyle = 'preserve-3d';
      card.style.transition = 'transform 0.15s ease-out, box-shadow 0.25s ease';

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5; // max 5deg tilt
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
        card.style.boxShadow = `0 20px 40px rgba(0, 0, 0, 0.65)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
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


