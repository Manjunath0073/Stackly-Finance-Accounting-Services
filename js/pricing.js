/* =====================================================
   Stackly — Pricing Page
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
    initEstimator();
    initPricingTableToggle();
  }

  /* ---------------------------------------------------
     Interactive plan estimator
     --------------------------------------------------- */
  function initEstimator() {
    const widget = document.querySelector('.js-estimator');
    if (!widget) return;

    const range = widget.querySelector('.js-estimator-range');
    const rangeValue = widget.querySelector('.js-estimator-range-value');
    const services = Array.from(widget.querySelectorAll('.js-estimator-service'));
    const totalEl = widget.querySelector('.js-estimator-total');
    const savingsEl = widget.querySelector('.js-estimator-savings');
    const planEl = widget.querySelector('.js-estimator-plan');

    if (!range || !totalEl || !savingsEl) return;

    const basePrice = 149;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let currentTotal = null;
    let animationFrame = null;

    const format = (value) => `$${Math.round(value).toLocaleString('en-US')}`;

    const calculate = () => {
      const team = parseInt(range.value, 10);
      const teamCost = Math.max(0, team - 5) * 5;
      const servicesCost = services
        .filter((service) => service.checked)
        .reduce((sum, service) => sum + parseInt(service.dataset.cost || '0', 10), 0);

      return basePrice + teamCost + servicesCost;
    };

    const updatePlan = (total) => {
      if (!planEl) return;

      if (total >= 700) {
        planEl.textContent = 'Enterprise';
      } else if (total >= 350) {
        planEl.textContent = 'Growth';
      } else {
        planEl.textContent = 'Starter';
      }
    };

    const animateTotal = (target) => {
      const start = currentTotal === null ? target : currentTotal;
      const startTime = performance.now();
      const duration = 350;

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = start + (target - start) * eased;
        totalEl.textContent = format(value);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(tick);
        } else {
          totalEl.textContent = format(target);
          currentTotal = target;
          animationFrame = null;
        }
      };

      animationFrame = requestAnimationFrame(tick);
    };

    const update = (animate) => {
      const team = parseInt(range.value, 10);
      const min = parseInt(range.min, 10) || 1;
      const max = parseInt(range.max, 10) || 50;
      const fill = ((team - min) / (max - min)) * 100;

      if (rangeValue) {
        rangeValue.textContent = team;
      }
      range.style.setProperty('--fill', `${fill}%`);

      const total = calculate();
      const savings = Math.round((total * 2.6) / 10) * 10;

      if (animate && !reduceMotion) {
        animateTotal(total);
      } else {
        totalEl.textContent = format(total);
        currentTotal = total;
      }

      savingsEl.textContent = format(savings);
      updatePlan(total);
    };

    range.addEventListener('input', () => update(true));

    services.forEach((service) => {
      service.addEventListener('change', () => update(true));
    });

    // Initial render without a load animation.
    update(false);
  }

  /* ---------------------------------------------------
     Monthly / annual segmented toggle
     --------------------------------------------------- */
  function initPricingTableToggle() {
    const monthlyBtn = document.querySelector('.js-billing-monthly');
    const annualBtn = document.querySelector('.js-billing-annual');
    if (!monthlyBtn || !annualBtn) return;

    const monthlyPrices = document.querySelectorAll('.js-price-monthly');
    const annualPrices = document.querySelectorAll('.js-price-annual');
    const periods = document.querySelectorAll('.js-price-period');
    const table = document.querySelector('.js-pricing-table');
    let animationTimer = null;

    const update = (annual) => {
      monthlyBtn.classList.toggle('is-active', !annual);
      annualBtn.classList.toggle('is-active', annual);
      monthlyBtn.setAttribute('aria-pressed', String(!annual));
      annualBtn.setAttribute('aria-pressed', String(annual));

      monthlyPrices.forEach((price) => {
        price.hidden = annual;
      });

      annualPrices.forEach((price) => {
        price.hidden = !annual;
      });

      periods.forEach((period) => {
        period.textContent = annual ? '/year' : '/month';
      });

      if (table) {
        if (animationTimer) {
          window.clearTimeout(animationTimer);
        }

        table.classList.remove('is-updating');
        void table.offsetWidth;
        table.classList.add('is-updating');

        animationTimer = window.setTimeout(() => {
          table.classList.remove('is-updating');
          animationTimer = null;
        }, 340);
      }
    };

    monthlyBtn.addEventListener('click', () => update(false));
    annualBtn.addEventListener('click', () => update(true));

    update(false);
  }
})();
