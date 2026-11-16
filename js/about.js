/* =====================================================
   Stackly — About Page
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
    initHeroParallax();
  }

  /* ---------------------------------------------------
     Cinematic hero parallax
     --------------------------------------------------- */
  function initHeroParallax() {
    const hero = document.querySelector('.js-about-hero');
    const image = document.querySelector('.js-about-hero-img');
    if (!hero || !image) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let ticking = false;

    const update = () => {
      const rect = hero.getBoundingClientRect();

      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const offset = Math.max(0, -rect.top) * 0.08;
        image.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale(1.18)`;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }
})();
