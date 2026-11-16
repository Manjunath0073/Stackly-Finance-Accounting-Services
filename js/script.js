/* =====================================================
   Stackly — Finance & Accounting Service
   Homepage Scripts
   ===================================================== */

(function () {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initDarkMode();
    initHeader();
    initMobileNav();
    initScrollReveal();
    initCounters();
    initFaqAccordion();
    initTestimonialCarousel();
    initPricingToggle();
  }

  /* ---------------------------------------------------
     Dark Mode
     --------------------------------------------------- */
  function initDarkMode() {
    const toggle = document.querySelector('.js-theme-toggle');
    if (!toggle) return;

    const STORAGE_KEY = 'stackly-theme';
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem(STORAGE_KEY);
    const isDark = saved ? saved === 'dark' : systemDark;

    if (isDark) {
      document.documentElement.classList.add('dark');
    }

    toggle.addEventListener('click', () => {
      const html = document.documentElement;
      const nowDark = html.classList.toggle('dark');
      localStorage.setItem(STORAGE_KEY, nowDark ? 'dark' : 'light');
    });
  }

  /* ---------------------------------------------------
     Header scroll state
     --------------------------------------------------- */
  function initHeader() {
    const header = document.querySelector('.js-header');
    if (!header) return;

    const onScroll = () => {
      if (window.scrollY > 10) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------
     Mobile navigation
     --------------------------------------------------- */
  function initMobileNav() {
    const toggle = document.querySelector('.js-menu-toggle');
    const panel = document.querySelector('.js-mobile-nav');
    if (!toggle || !panel) return;

    enhanceMobileNav(panel);

    panel.id = panel.id || 'mobileNav';
    toggle.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Mobile navigation');

    let backdrop = document.querySelector('.mobile-nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'mobile-nav-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }

    const main = document.querySelector('main');
    const footer = document.querySelector('.footer');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    let isOpen = false;
    let previousFocus = null;

    panel.setAttribute('aria-hidden', 'true');
    panel.inert = true;

    const setOpen = (open) => {
      if (open === isOpen) return;
      isOpen = open;

      if (open) {
        previousFocus = document.activeElement;
      }

      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      panel.classList.toggle('is-open', open);
      panel.setAttribute('aria-hidden', String(!open));
      backdrop.classList.toggle('is-open', open);
      document.body.classList.toggle('mobile-nav-open', open);
      document.body.style.overflow = open ? 'hidden' : '';

      if (main) main.inert = open;
      if (footer) footer.inert = open;

      if (open) {
        panel.inert = false;
        panel.scrollTop = 0;
        window.setTimeout(() => {
          const firstLink = panel.querySelector('.mobile-nav__link');
          if (firstLink) firstLink.focus({ preventScroll: true });
        }, 90);
      } else {
        const focusTarget = previousFocus
          && previousFocus !== document.body
          && typeof previousFocus.focus === 'function'
          && document.contains(previousFocus)
          ? previousFocus
          : toggle;
        focusTarget.focus({ preventScroll: true });
        panel.inert = true;
      }
    };

    toggle.addEventListener('click', () => setOpen(!isOpen));
    backdrop.addEventListener('click', () => setOpen(false));

    panel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        setOpen(false);
      }
    });

    const handleDesktopChange = (event) => {
      if (event.matches && isOpen) setOpen(false);
    };

    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', handleDesktopChange);
    else desktopQuery.addListener(handleDesktopChange);
  }

  function enhanceMobileNav(panel) {
    if (!panel.querySelector('.mobile-nav__intro')) {
      const intro = document.createElement('div');
      intro.className = 'mobile-nav__intro';
      intro.innerHTML = `
        <div class="mobile-nav__topline">
          <span class="mobile-nav__eyebrow"><span class="mobile-nav__eyebrow-dot" aria-hidden="true"></span>Explore Stackly</span>
          <span class="mobile-nav__status">Accepting new clients</span>
        </div>
        <p class="mobile-nav__headline">Numbers,<br /><em>solved.</em></p>
        <p class="mobile-nav__desc">Bookkeeping, tax, payroll, and advisory — one senior team, quietly in your corner.</p>`;
      panel.prepend(intro);
    }

    const cta = panel.querySelector('.mobile-nav__cta');
    if (cta && !cta.dataset.enhanced) {
      const label = cta.textContent.replace(/\s+/g, ' ').trim() || 'Login';
      const isLogin = /log\s*in|login/i.test(label);
      const subtext = isLogin ? 'Access your client dashboard' : 'Free 30-minute strategy call';
      cta.dataset.enhanced = 'true';
      cta.innerHTML = `
        <span class="mobile-nav__cta-copy"><strong>${label}</strong><small>${subtext}</small></span>
        <span class="mobile-nav__cta-arrow" aria-hidden="true">→</span>`;
    }

    if (!panel.querySelector('.mobile-nav__footer')) {
      const contactTarget = document.querySelector('#contact-form') ? '#contact-form' : 'contact.html';
      const footer = document.createElement('div');
      footer.className = 'mobile-nav__footer';
      footer.innerHTML = `
        <div class="mobile-nav__utility">
          <a href="${contactTarget}">Book a Call <span aria-hidden="true">→</span></a>
          <a href="signup.html">Create Account</a>
        </div>
        <div class="mobile-nav__contact">
          <a href="mailto:hello@stackly.com">hello@stackly.com</a>
          <span>Mon–Fri · 9am–6pm</span>
        </div>`;
      panel.appendChild(footer);
    }
  }

  /* ---------------------------------------------------
     Scroll reveal
     --------------------------------------------------- */
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    reveals.forEach((el) => observer.observe(el));
  }

  /* ---------------------------------------------------
     Animated counters
     --------------------------------------------------- */
  function initCounters() {
    const counters = document.querySelectorAll('.js-counter');
    if (!counters.length) return;

    const countUp = (el) => {
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const duration = 2000;
      const startTime = performance.now();

      const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = target * ease;
        el.textContent = prefix + current.toFixed(decimals) + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = prefix + target.toFixed(decimals) + suffix;
        }
      };

      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            countUp(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((counter) => observer.observe(counter));
  }

  /* ---------------------------------------------------
     FAQ accordion
     --------------------------------------------------- */
  function initFaqAccordion() {
    const items = document.querySelectorAll('.js-accordion-item');
    if (!items.length) return;

    items.forEach((item) => {
      const trigger = item.querySelector('.js-accordion-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        items.forEach((i) => {
          i.classList.remove('is-open');
          const t = i.querySelector('.js-accordion-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------------------------------------------------
     Testimonial carousel
     --------------------------------------------------- */
  function initTestimonialCarousel() {
    const carousel = document.querySelector('.js-testimonial-carousel');
    if (!carousel) return;

    const track = carousel.querySelector('.js-testimonial-track');
    const slides = Array.from(carousel.querySelectorAll('.js-testimonial-slide'));
    const dots = Array.from(carousel.querySelectorAll('.js-testimonial-dot'));
    const prev = carousel.querySelector('.js-testimonial-prev');
    const next = carousel.querySelector('.js-testimonial-next');

    if (!track || !slides.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const interval = 5000;
    let current = 0;
    let autoplay = null;
    let isVisible = false;

    const goTo = (index) => {
      current = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;

      dots.forEach((dot, i) => {
        const active = i === current;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });

      slides.forEach((slide, i) => {
        slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
      });
    };

    const stopAutoplay = () => {
      if (autoplay) {
        clearInterval(autoplay);
        autoplay = null;
      }
    };

    const startAutoplay = () => {
      stopAutoplay();
      if (reduceMotion || !isVisible) return;
      autoplay = setInterval(() => goTo(current + 1), interval);
    };

    if (prev) {
      prev.addEventListener('click', () => {
        goTo(current - 1);
        startAutoplay();
      });
    }

    if (next) {
      next.addEventListener('click', () => {
        goTo(current + 1);
        startAutoplay();
      });
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        goTo(i);
        startAutoplay();
      });
    });

    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    carousel.addEventListener('focusin', stopAutoplay);
    carousel.addEventListener('focusout', (event) => {
      if (!carousel.contains(event.relatedTarget)) {
        startAutoplay();
      }
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isVisible = entry.isIntersecting;
            if (isVisible) {
              startAutoplay();
            } else {
              stopAutoplay();
            }
          });
        },
        { threshold: 0.35 }
      );
      observer.observe(carousel);
    } else {
      isVisible = true;
      startAutoplay();
    }

    goTo(0);
  }

  /* ---------------------------------------------------
     Pricing toggle
     --------------------------------------------------- */
  function initPricingToggle() {
    const toggle = document.querySelector('.js-pricing-switch');
    if (!toggle) return;

    const monthlyLabels = document.querySelectorAll('.js-price-monthly');
    const annualLabels = document.querySelectorAll('.js-price-annual');
    const periodLabels = document.querySelectorAll('.js-price-period');

    const update = (isAnnual) => {
      toggle.classList.toggle('is-annual', isAnnual);
      toggle.setAttribute('aria-checked', String(isAnnual));

      monthlyLabels.forEach((el) => el.hidden = isAnnual);
      annualLabels.forEach((el) => el.hidden = !isAnnual);
      periodLabels.forEach((el) => {
        el.textContent = isAnnual ? '/year' : '/month';
      });
    };

    toggle.addEventListener('click', () => {
      update(!toggle.classList.contains('is-annual'));
    });

    update(false);
  }
})();
