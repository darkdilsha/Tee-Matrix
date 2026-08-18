// TEE MATRIX - Premium High-Fashion Motion Controller (Motion + GSAP)
import { scroll, animate, inView } from 'https://cdn.jsdelivr.net/npm/motion@11.11.17/+esm';

export class FashionMotionController {
  constructor() {
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
    window.scrollTo(0, 0);

    // Hardware-Accelerated Vertical Scroll Progress Indicator via Motion scroll()
    if (typeof scroll === 'function') {
      scroll((progress) => {
        const fill = document.getElementById('scrollProgressFill');
        if (fill) {
          fill.style.height = `${Math.min(100, Math.max(0, progress * 100))}%`;
        }
      });
    } else {
      window.addEventListener('scroll', () => {
        const fill = document.getElementById('scrollProgressFill');
        if (fill) {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
          fill.style.height = `${Math.min(100, Math.max(0, progress))}%`;
        }
      });
    }
  }

  runIntroSequence() {
    let loader = document.getElementById('pageLoader');
    if (!loader) {
      this.initScrollTriggers();
      return;
    }

    const counter = document.getElementById('loaderCounter');
    const bar = document.getElementById('loaderBar');
    let obj = { val: 0 };

    if (typeof gsap !== 'undefined') {
      gsap.to(obj, {
        val: 100,
        duration: 1.2,
        ease: 'power2.inOut',
        onUpdate: () => {
          const progress = Math.round(obj.val);
          if (counter) counter.innerText = `${progress}%`;
          if (bar) bar.style.width = `${progress}%`;
        },
        onComplete: () => {
          gsap.to(loader, {
            yPercent: -100,
            duration: 0.8,
            ease: this.EASE_PREMIUM,
            onComplete: () => {
              loader.remove();
              this.initScrollTriggers();
            }
          });
        }
      });
    } else {
      if (counter) counter.innerText = `100%`;
      if (bar) bar.style.width = `100%`;
      setTimeout(() => {
        loader.remove();
        this.initScrollTriggers();
      }, 500);
    }
  }

  initScrollTriggers() {
    // 1. Hero Reveal Animation
    const heroBg = document.getElementById('heroBg');
    if (heroBg && typeof gsap !== 'undefined') {
      gsap.fromTo(heroBg,
        { scale: 1.15, opacity: 0.8 },
        { opacity: 1.0, scale: 1.0, duration: 1.8, ease: this.EASE_PREMIUM }
      );
    }

    if (typeof gsap !== 'undefined') {
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
    }

    // 2. Parallax Background Layers using Motion scroll()
    if (!this.isMobile && typeof scroll === 'function' && typeof animate === 'function') {
      const heroSection = document.getElementById('hero');
      if (heroBg && heroSection) {
        scroll(
          animate(heroBg, { transform: ['translateY(0px)', 'translateY(60px)'] }),
          { target: heroSection, offset: ['start start', 'end start'] }
        );
      }

      const storyBg = document.getElementById('storyBg');
      const storySection = document.getElementById('story');
      if (storyBg && storySection) {
        scroll(
          animate(storyBg, { transform: ['translateY(0px)', 'translateY(60px)'] }),
          { target: storySection, offset: ['start end', 'end start'] }
        );
      }
    }

    // 3. Entrance Reveals using Motion inView()
    if (typeof inView === 'function' && typeof animate === 'function') {
      document.querySelectorAll('.editorial-section').forEach((section) => {
        inView(section, () => {
          const tag = section.querySelector('.section-tag');
          const title = section.querySelector('.section-title');
          const cards = section.querySelectorAll('.product-card');

          if (tag) animate(tag, { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0px)'] }, { duration: 0.8 });
          if (title) animate(title, { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0px)'] }, { duration: 1.0 });
          if (cards.length > 0) {
            cards.forEach((card, i) => {
              animate(card, { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'] }, { duration: 1.0, delay: i * 0.1 });
            });
          }
        });
      });
    }

    // 4. Pinned Collection Showcase with Motion.scroll() & native position: sticky
    this.initPinnedCollectionSection();
    
    // 5. Desktop 3D Card Tilt-on-Hover
    this.init3DCardTilt();
  }

  initPinnedCollectionSection() {
    const container = document.getElementById('pinnedCollectionContainer');
    if (!container) return;

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

    // 3D Perspective Arrival Sequence on Entry
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

      if (typeof inView === 'function') {
        inView(container, () => {
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
        });
      }
    }

    // Scroll Progress Tracking via Motion scroll()
    if (typeof scroll === 'function') {
      scroll(
        (progress) => {
          const index = Math.min(slides.length - 1, Math.floor(progress * slides.length));
          
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
        },
        { target: container, offset: ['start start', 'end end'] }
      );
    }
  }

  stop() {}
  start() {}

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
  scrollTo(target, options = {}) {
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: options.immediate ? 'instant' : 'smooth' });
    } else {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) {
        el.scrollIntoView({ behavior: options.immediate ? 'instant' : 'smooth' });
      }
    }
  }

  stop() {}
  start() {}
}

export const fashionMotion = new FashionMotionController();


