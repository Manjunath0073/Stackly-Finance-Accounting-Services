/* =====================================================
   Stackly — Services Page
   Page-specific scripts (builds on js/script.js)
   ===================================================== */

(function () {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initGridReveal();
    initServiceFilters();
    initPriceAnimation();
  }

  /* ---------------------------------------------------
     Services grid reveal
     The grid is much taller than the viewport on mobile,
     so it needs a lower IntersectionObserver threshold
     than the shared .reveal utility.
     --------------------------------------------------- */
  function initGridReveal() {
    const grid = document.querySelector('.js-service-grid');
    if (!grid) return;

    if (!('IntersectionObserver' in window)) {
      grid.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(grid);
  }

  /* ---------------------------------------------------
     Filterable services grid
     --------------------------------------------------- */
  function initServiceFilters() {
    const filters = Array.from(document.querySelectorAll('.js-service-filter'));
    const grid = document.querySelector('.js-service-grid');
    if (!filters.length || !grid) return;

    const cards = Array.from(grid.querySelectorAll('.js-service-card'));
    if (!cards.length) return;

    const hideTimers = new Map();

    const applyFilter = (filter) => {
      filters.forEach((button) => {
        const active = button.dataset.filter === filter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });

      cards.forEach((card) => {
        const matches = filter === 'all' || card.dataset.category === filter;
        const pendingTimer = hideTimers.get(card);

        if (pendingTimer) {
          window.clearTimeout(pendingTimer);
          hideTimers.delete(card);
        }

        if (matches) {
          card.hidden = false;
          card.classList.remove('is-leaving');
          card.classList.remove('is-entering');

          // Restart the entrance animation.
          void card.offsetWidth;
          card.classList.add('is-entering');
        } else if (!card.hidden) {
          card.classList.add('is-leaving');

          const timer = window.setTimeout(() => {
            card.hidden = true;
            card.classList.remove('is-leaving');
            hideTimers.delete(card);
          }, 220);

          hideTimers.set(card, timer);
        }
      });
    };

    filters.forEach((button) => {
      button.addEventListener('click', () => {
        applyFilter(button.dataset.filter || 'all');
      });
    });
  }

  /* ---------------------------------------------------
     Price toggle animation
     --------------------------------------------------- */
  function initPriceAnimation() {
    const toggle = document.querySelector('.js-pricing-switch');
    const grid = document.querySelector('.pricing__grid');
    if (!toggle || !grid) return;

    toggle.addEventListener('click', () => {
      grid.classList.remove('is-flipping');
      void grid.offsetWidth;
      grid.classList.add('is-flipping');

      window.setTimeout(() => {
        grid.classList.remove('is-flipping');
      }, 380);
    });
  }
})();
