/* =====================================================
   Stackly — Contact Page
   Page-specific scripts (builds on js/script.js)
   ===================================================== */

(function () {
  'use strict';

  const NAME_RE = /^[\p{L}\p{M}.'’\- ]+$/u;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initContactForm();
  }

  /* ---------------------------------------------------
     Contact form validation + success state
     --------------------------------------------------- */
  function initContactForm() {
    const form = document.querySelector('.js-contact-form');
    if (!form) return;

    const success = document.querySelector('.js-contact-success');
    const resetButton = document.querySelector('.js-contact-reset');
    const submitButton = form.querySelector('button[type="submit"]');
    let successTimer = null;

    const fields = [
      {
        input: form.querySelector('#name'),
        error: form.querySelector('#name-error'),
        validate: (value) => {
          const name = value.trim().replace(/\s+/g, ' ');

          if (!name) return 'Please enter your name.';
          if (name.length < 2) return 'Please enter at least 2 characters.';
          if (!NAME_RE.test(name)) {
            return 'Name can contain letters, spaces, apostrophes, hyphens, or periods only. Numbers are not allowed.';
          }
          if ((name.match(/\p{L}/gu) || []).length < 2) {
            return 'Please enter a valid name.';
          }

          return true;
        },
        message: 'Please enter a valid name.',
      },
      {
        input: form.querySelector('#email'),
        error: form.querySelector('#email-error'),
        validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
        message: 'Enter a valid email address.',
      },
      {
        input: form.querySelector('#phone'),
        error: form.querySelector('#phone-error'),
        validate: (value) => !value.trim() || /^[+0-9 ()-]{7,20}$/.test(value.trim()),
        message: 'Enter a valid phone number.',
      },
      {
        input: form.querySelector('#service'),
        error: form.querySelector('#service-error'),
        validate: (value) => value.trim() !== '',
        message: 'Please select a service.',
      },
      {
        input: form.querySelector('#message'),
        error: form.querySelector('#message-error'),
        validate: (value) => value.trim().length >= 10,
        message: 'Tell us a little about what you need (at least 10 characters).',
      },
    ];

    if (fields.some((field) => !field.input || !field.error)) return;

    const setError = (field, message) => {
      field.error.textContent = message;
      field.input.setAttribute('aria-invalid', 'true');
      field.input.classList.add('is-invalid');
    };

    const clearError = (field) => {
      field.error.textContent = '';
      field.input.removeAttribute('aria-invalid');
      field.input.classList.remove('is-invalid');
    };

    const validateField = (field) => {
      const result = field.validate(field.input.value);

      if (result === true) {
        clearError(field);
        return true;
      }

      setError(field, typeof result === 'string' ? result : field.message);
      return false;
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      let firstInvalid = null;

      fields.forEach((field) => {
        if (!validateField(field) && !firstInvalid) {
          firstInvalid = field.input;
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      form.setAttribute('aria-busy', 'true');

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
      }

      // Simulate a short request; no backend is required for this theme.
      window.setTimeout(() => {
        form.hidden = true;
        form.removeAttribute('aria-busy');

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Send Message';
        }

        if (success) {
          success.hidden = false;
          success.focus();
        }

        if (successTimer) window.clearTimeout(successTimer);
        successTimer = window.setTimeout(() => {
          if (success) success.hidden = true;
          form.hidden = false;
          form.reset();
          fields.forEach(clearError);
          successTimer = null;

          if (fields[0] && fields[0].input) {
            fields[0].input.focus({ preventScroll: true });
          }
        }, 3000);
      }, 600);
    });

    fields.forEach((field) => {
      const clearOnInput = () => {
        if (field.input.getAttribute('aria-invalid') === 'true') {
          validateField(field);
        }
      };

      field.input.addEventListener('input', clearOnInput);
      field.input.addEventListener('change', clearOnInput);
      field.input.addEventListener('blur', () => {
        if (field.input.value.trim()) {
          validateField(field);
        }
      });
    });

    if (resetButton) {
      resetButton.addEventListener('click', () => {
        if (successTimer) {
          window.clearTimeout(successTimer);
          successTimer = null;
        }

        form.reset();
        fields.forEach(clearError);
        if (success) success.hidden = true;
        form.hidden = false;
        fields[0].input.focus();
      });
    }
  }
})();
