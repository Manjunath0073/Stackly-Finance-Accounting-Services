/* =====================================================
   Stackly — Blog / Insights Page
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
    initArticleGridReveal();
    initArticleFilters();
    initPicksCarousel();
    initNewsletterForm();
    initTopicTiles();
  }

  /* ---------------------------------------------------
     Article grid reveal
     --------------------------------------------------- */
  function initArticleGridReveal() {
    const grid = document.querySelector('.js-article-grid');
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
     Filterable article grid
     --------------------------------------------------- */
  function initArticleFilters() {
    const filters = Array.from(document.querySelectorAll('.js-article-filter'));
    const grid = document.querySelector('.js-article-grid');
    if (!filters.length || !grid) return;

    const cards = Array.from(grid.querySelectorAll('.js-article-card'));
    if (!cards.length) return;

    const status = document.querySelector('.js-filter-status');
    const hideTimers = new Map();

    const applyFilter = (filter) => {
      filters.forEach((button) => {
        const active = button.dataset.filter === filter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });

      let visibleCount = 0;

      cards.forEach((card) => {
        const matches = filter === 'all' || card.dataset.category === filter;
        const pendingTimer = hideTimers.get(card);

        if (pendingTimer) {
          window.clearTimeout(pendingTimer);
          hideTimers.delete(card);
        }

        if (matches) {
          visibleCount += 1;
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

      if (status) {
        const label = filter === 'all' ? 'all categories' : filter;
        status.textContent = `Showing ${visibleCount} ${visibleCount === 1 ? 'article' : 'articles'} in ${label}.`;
      }
    };

    filters.forEach((button) => {
      button.addEventListener('click', () => {
        applyFilter(button.dataset.filter || 'all');
      });
    });
  }

  /* ---------------------------------------------------
     Editor's picks carousel
     --------------------------------------------------- */
  function initPicksCarousel() {
    const track = document.querySelector('.js-picks-track');
    const prev = document.querySelector('.js-picks-prev');
    const next = document.querySelector('.js-picks-next');
    if (!track || !prev || !next) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const stepSize = () => {
      const card = track.querySelector('.blog-pick');
      if (!card) return track.clientWidth * 0.8;

      const styles = window.getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap) || 20;
      return card.getBoundingClientRect().width + gap;
    };

    const updateButtons = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= maxScroll - 2;
    };

    prev.addEventListener('click', () => {
      track.scrollBy({ left: -stepSize(), behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    next.addEventListener('click', () => {
      track.scrollBy({ left: stepSize(), behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    track.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons, { passive: true });

    updateButtons();
  }

  /* ---------------------------------------------------
     Newsletter success state
     --------------------------------------------------- */
  function initNewsletterForm() {
    const form = document.querySelector('.js-newsletter-form');
    if (!form) return;

    const success = document.querySelector('.js-newsletter-success');

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const input = form.querySelector('input[type="email"]');
      if (input && !input.checkValidity()) {
        input.reportValidity();
        return;
      }

      form.hidden = true;

      if (success) {
        success.hidden = false;
        success.focus();
      }
    });
  }

  /* ---------------------------------------------------
     Topic tiles apply a matching article filter
     --------------------------------------------------- */
  function initTopicTiles() {
    const topics = Array.from(document.querySelectorAll('.js-topic-filter'));
    if (!topics.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    topics.forEach((topic) => {
      topic.addEventListener('click', (event) => {
        const filter = topic.dataset.filter;
        if (!filter) return;

        const filterButton = document.querySelector(`.js-article-filter[data-filter="${filter}"]`);
        if (!filterButton) return;

        event.preventDefault();
        filterButton.click();

        const target = document.querySelector('#articles');
        if (target) {
          target.scrollIntoView({
            behavior: reduceMotion ? 'auto' : 'smooth',
            block: 'start',
          });
        }
      });
    });
  }
})();
