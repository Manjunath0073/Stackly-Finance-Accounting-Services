/* =====================================================
   Stackly — 404 redirect guard
   Routes all non-exempt links and buttons to 404.html.
   Exempt: header, footer, testimonial arrows, form buttons,
   dashboard sidebars, skip links, and 404.html itself.
   ===================================================== */
(function () {
  'use strict';

  const page = (window.location.pathname.split('/').pop() || '').toLowerCase();
  if (page === '404.html') return;

  const EXEMPT_SELECTOR = [
    'header',
    'footer',
    '.footer',
    '.sidebar',
    '.testimonial__arrow',
    '.js-testimonial-prev',
    '.js-testimonial-next',
    'form button',
    '.skip-link',
    '[data-no-404-redirect]'
  ].join(',');

  function isFormButton(element) {
    return element.tagName === 'BUTTON' && (element.closest('form') || element.form);
  }

  function isExempt(element) {
    return Boolean(element.closest(EXEMPT_SELECTOR)) || isFormButton(element);
  }

  function handleNavigation(event) {
    const target = event.target instanceof Element
      ? event.target
      : event.target && event.target.parentElement;

    if (!target) return;

    const trigger = target.closest('a[href], button');
    if (!trigger) return;
    if (trigger.disabled || trigger.getAttribute('aria-disabled') === 'true') return;
    if (isExempt(trigger)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign('404.html');
  }

  document.addEventListener('click', handleNavigation, true);
  document.addEventListener('auxclick', function (event) {
    if (event.button === 1) handleNavigation(event);
  }, true);
})();
