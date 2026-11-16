/* =====================================================
   Stackly — Authentication
   Shared scripts for login.html and signup.html
   ===================================================== */

(function () {
  'use strict';

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const NAME_RE = /^[A-Za-z\s]+$/;
  const ROLE_VALUES = ['client', 'advisor'];

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initRoleToggles();
    initPasswordToggles();
    initLoginForm();
    initSignupForm();
  }

  /* ---------------------------------------------------
     Role toggle
     --------------------------------------------------- */
  function initRoleToggles() {
    document.querySelectorAll('.js-role-toggle').forEach((group) => {
      const buttons = Array.from(group.querySelectorAll('.js-role-option'));
      const input = group.querySelector('.js-role-input');
      const error = group.querySelector('.js-role-error');

      if (!buttons.length || !input) return;

      const active = buttons.find((button) => button.classList.contains('is-active')) || buttons[0];
      input.value = active.dataset.role || 'client';

      buttons.forEach((button) => {
        button.addEventListener('click', () => {
          buttons.forEach((option) => {
            const isActive = option === button;
            option.classList.toggle('is-active', isActive);
            option.setAttribute('aria-pressed', String(isActive));
          });

          input.value = button.dataset.role || 'client';
          input.dispatchEvent(new Event('input', { bubbles: true }));

          if (error) {
            error.textContent = '';
          }
        });
      });
    });
  }

  /* ---------------------------------------------------
     Show / hide password
     --------------------------------------------------- */
  function initPasswordToggles() {
    document.querySelectorAll('.js-password-toggle').forEach((button) => {
      const wrapper = button.closest('.auth-input');
      const input = wrapper ? wrapper.querySelector('input') : null;
      if (!input) return;

      button.addEventListener('click', () => {
        const isShowing = button.getAttribute('aria-pressed') === 'true';
        input.type = isShowing ? 'password' : 'text';
        button.setAttribute('aria-pressed', String(!isShowing));
        button.setAttribute('aria-label', isShowing ? 'Show password' : 'Hide password');
      });
    });
  }

  /* ---------------------------------------------------
     Shared field helpers
     --------------------------------------------------- */
  function getError(input) {
    const id = input.getAttribute('aria-describedby');
    return id ? document.getElementById(id) : null;
  }

  function clearError(field) {
    const wrapper = field.input.closest('.auth-input');
    if (wrapper) wrapper.classList.remove('is-invalid');
    field.input.removeAttribute('aria-invalid');
    if (field.error) field.error.textContent = '';
  }

  function setError(field, message) {
    const wrapper = field.input.closest('.auth-input');
    if (wrapper) wrapper.classList.add('is-invalid');
    field.input.setAttribute('aria-invalid', 'true');
    if (field.error) field.error.textContent = message;
  }

  function validateField(field) {
    const result = field.validate(field.input.value);

    if (result === true) {
      clearError(field);
      return true;
    }

    setError(field, result);
    return false;
  }

  function setLoading(button, isLoading, loadingText) {
    if (!button) return;

    button.classList.toggle('is-loading', isLoading);
    button.setAttribute('aria-busy', String(isLoading));
    button.disabled = isLoading;

    const text = button.querySelector('.auth-submit__text');
    if (!text) return;

    if (isLoading) {
      button.dataset.originalText = text.textContent;
      text.textContent = loadingText || 'Please wait...';
    } else {
      text.textContent = button.dataset.originalText || text.textContent;
    }
  }

  function saveUser(user) {
    try {
      window.localStorage.setItem('stackly_user', JSON.stringify(user));
    } catch (error) {
      // Storage may be unavailable; the mock flow can still continue.
    }
  }

  function getDashboardPath(role) {
    return role === 'advisor' ? 'dashboard-advisor.html' : 'dashboard-client.html';
  }

  function redirectToDashboard(role) {
    const destination = getDashboardPath(role);
    window.setTimeout(() => {
      window.location.replace(destination);
    }, 700);
    return destination;
  }

  function nameFromEmail(email) {
    const local = (email.split('@')[0] || 'Client').replace(/[._-]+/g, ' ').trim();
    const parts = local.split(/\s+/).filter(Boolean);

    if (!parts.length) return 'Client';

    return parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  /* ---------------------------------------------------
     Login
     --------------------------------------------------- */
  function initLoginForm() {
    const form = document.querySelector('.js-login-form');
    if (!form) return;

    const email = form.querySelector('#login-email');
    const password = form.querySelector('#login-password');
    const roleInput = form.querySelector('.js-role-input');
    const roleError = form.querySelector('.js-role-error');
    const remember = form.querySelector('#login-remember');
    const submit = form.querySelector('.js-auth-submit');
    const success = document.querySelector('.js-login-success');
    const successText = success ? success.querySelector('.js-login-success-text') : null;
    const successLink = success ? success.querySelector('.auth-success__link') : null;

    if (!email || !password || !roleInput || !submit) return;

    const fields = [
      {
        input: email,
        error: getError(email),
        validate: (value) => {
          const trimmed = value.trim();
          if (!trimmed) return 'Please enter your email address.';
          if (!EMAIL_RE.test(trimmed)) return 'Enter a valid email address.';
          return true;
        },
      },
      {
        input: password,
        error: getError(password),
        validate: (value) => {
          if (!value) return 'Please enter your password.';
          if (value.length < 8) return 'Password must be at least 8 characters.';
          return true;
        },
      },
    ];

    if (fields.some((field) => !field.input)) return;

    let loading = false;

    const roleIsValid = () => ROLE_VALUES.includes(roleInput.value);
    const isFormValid = () => fields.every((field) => field.validate(field.input.value) === true) && roleIsValid();

    const updateSubmitState = () => {
      submit.disabled = loading || !isFormValid();
    };

    form.addEventListener('input', (event) => {
      const field = fields.find((item) => item.input === event.target);
      if (field) clearError(field);
      updateSubmitState();
    });

    form.addEventListener('change', () => {
      updateSubmitState();
    });

    fields.forEach((field) => {
      field.input.addEventListener('blur', () => {
        validateField(field);
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (loading) return;

      let firstInvalid = null;

      fields.forEach((field) => {
        if (!validateField(field) && !firstInvalid) {
          firstInvalid = field.input;
        }
      });

      if (!roleIsValid()) {
        if (roleError) roleError.textContent = 'Please choose a role.';
        if (!firstInvalid) firstInvalid = roleInput;
      }

      if (firstInvalid) {
        firstInvalid.focus();
        updateSubmitState();
        return;
      }

      loading = true;
      setLoading(submit, true, 'Logging in...');

      // Mock submit object. A real implementation would POST this.
      const payload = {
        email: email.value.trim(),
        password: password.value,
        role: roleInput.value,
        remember: remember ? remember.checked : false,
      };

      window.setTimeout(() => {
        form.hidden = true;
        loading = false;

        saveUser({
          name: nameFromEmail(payload.email),
          email: payload.email,
          role: payload.role,
          remember: payload.remember,
          loggedInAt: new Date().toISOString(),
        });

        if (success) {
          if (successText) {
            const roleLabel = payload.role === 'advisor' ? 'an Advisor' : 'a Client';
            successText.textContent = `Signed in as ${roleLabel}. Redirecting to your dashboard...`;
          }

          if (successLink) {
            successLink.href = getDashboardPath(payload.role);
          }

          success.hidden = false;
          success.focus();
          redirectToDashboard(payload.role);
        }
      }, 1000);
    });

    updateSubmitState();
  }

  /* ---------------------------------------------------
     Signup
     --------------------------------------------------- */
  function initSignupForm() {
    const form = document.querySelector('.js-signup-form');
    if (!form) return;

    const name = form.querySelector('#signup-name');
    const email = form.querySelector('#signup-email');
    const password = form.querySelector('#signup-password');
    const confirm = form.querySelector('#signup-confirm');
    const roleInput = form.querySelector('.js-role-input');
    const roleError = form.querySelector('.js-role-error');
    const terms = form.querySelector('#signup-terms');
    const termsError = document.querySelector('#signup-terms-error');
    const submit = form.querySelector('.js-auth-submit');
    const success = document.querySelector('.js-signup-success');
    const successText = success ? success.querySelector('.js-signup-success-text') : null;
    const successLink = success ? success.querySelector('.auth-success__link') : null;

    if (!name || !email || !password || !confirm || !roleInput || !terms || !submit) return;

    const strength = document.querySelector('.js-strength');
    const strengthBar = document.querySelector('.js-strength-bar');
    const strengthValue = document.querySelector('.js-strength-value');
    const strengthTrack = document.querySelector('.js-strength-track');

    const passwordIsValid = (value) =>
      value.length >= 8 &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[0-9]/.test(value) &&
      /[^A-Za-z0-9]/.test(value);

    const fields = [
      {
        input: name,
        error: getError(name),
        validate: (value) => {
          const trimmed = value.trim();
          if (!trimmed) return 'Please enter your full name.';
          if (trimmed.length < 2 || !NAME_RE.test(trimmed)) {
            return 'Use letters and spaces only (at least 2 characters).';
          }
          return true;
        },
      },
      {
        input: email,
        error: getError(email),
        validate: (value) => {
          const trimmed = value.trim();
          if (!trimmed) return 'Please enter your email address.';
          if (!EMAIL_RE.test(trimmed)) return 'Enter a valid email address.';
          return true;
        },
      },
      {
        input: password,
        error: getError(password),
        validate: (value) => {
          if (!value) return 'Please create a password.';
          if (!passwordIsValid(value)) {
            return 'Use 8+ characters with uppercase, lowercase, a number, and a symbol.';
          }
          return true;
        },
      },
      {
        input: confirm,
        error: getError(confirm),
        validate: (value) => {
          if (!value) return 'Please confirm your password.';
          if (value !== password.value) return 'Passwords do not match.';
          return true;
        },
      },
    ];

    if (fields.some((field) => !field.input)) return;

    let loading = false;

    const roleIsValid = () => ROLE_VALUES.includes(roleInput.value);

    const termsIsValid = () => terms.checked;

    const isFormValid = () =>
      fields.every((field) => field.validate(field.input.value) === true) &&
      termsIsValid() &&
      roleIsValid();

    const updateSubmitState = () => {
      submit.disabled = loading || !isFormValid();
    };

    const updateStrength = () => {
      const value = password.value;

      if (!strength || !strengthBar || !strengthValue) return;

      strength.classList.remove('is-weak', 'is-medium', 'is-strong');
      strengthValue.classList.remove('is-weak', 'is-medium', 'is-strong');

      if (!value) {
        strengthBar.style.width = '0%';
        strengthValue.textContent = '—';
        if (strengthTrack) strengthTrack.setAttribute('aria-valuenow', '0');
        return;
      }

      const score = [
        value.length >= 8,
        /[A-Z]/.test(value),
        /[a-z]/.test(value),
        /[0-9]/.test(value),
        /[^A-Za-z0-9]/.test(value),
      ].filter(Boolean).length;

      let label = 'Weak';
      let strengthClass = 'is-weak';

      if (score >= 5) {
        label = 'Strong';
        strengthClass = 'is-strong';
      } else if (score >= 3) {
        label = 'Medium';
        strengthClass = 'is-medium';
      }

      const percent = Math.round((score / 5) * 100);

      strength.classList.add(strengthClass);
      strengthValue.classList.add(strengthClass);
      strengthValue.textContent = label;
      strengthBar.style.width = `${percent}%`;
      if (strengthTrack) strengthTrack.setAttribute('aria-valuenow', String(percent));
    };

    const clearTermsError = () => {
      terms.removeAttribute('aria-invalid');
      if (termsError) termsError.textContent = '';
    };

    const setTermsError = () => {
      terms.setAttribute('aria-invalid', 'true');
      if (termsError) termsError.textContent = 'Please agree to the Terms & Privacy.';
    };

    form.addEventListener('input', (event) => {
      const field = fields.find((item) => item.input === event.target);
      if (field) clearError(field);

      if (event.target === password) {
        updateStrength();

        const confirmField = fields.find((item) => item.input === confirm);
        if (confirmField && (confirm.value || confirm.getAttribute('aria-invalid') === 'true')) {
          validateField(confirmField);
        }
      }

      updateSubmitState();
    });

    form.addEventListener('change', (event) => {
      if (event.target === terms) {
        if (terms.checked) {
          clearTermsError();
        } else {
          setTermsError();
        }
      }
      updateSubmitState();
    });

    fields.forEach((field) => {
      field.input.addEventListener('blur', () => {
        validateField(field);
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (loading) return;

      let firstInvalid = null;

      fields.forEach((field) => {
        if (!validateField(field) && !firstInvalid) {
          firstInvalid = field.input;
        }
      });

      if (!termsIsValid()) {
        setTermsError();
        if (!firstInvalid) firstInvalid = terms;
      } else {
        clearTermsError();
      }

      if (!roleIsValid()) {
        if (roleError) roleError.textContent = 'Please choose a role.';
        if (!firstInvalid) firstInvalid = roleInput;
      }

      if (firstInvalid) {
        firstInvalid.focus();
        updateSubmitState();
        return;
      }

      loading = true;
      setLoading(submit, true, 'Creating account...');

      // Mock submit object. A real implementation would POST this.
      const payload = {
        name: name.value.trim(),
        email: email.value.trim(),
        role: roleInput.value,
        termsAccepted: terms.checked,
      };

      window.setTimeout(() => {
        form.hidden = true;
        loading = false;

        saveUser({
          name: payload.name,
          email: payload.email,
          role: payload.role,
          termsAccepted: payload.termsAccepted,
          createdAt: new Date().toISOString(),
        });

        if (success) {
          if (successText) {
            const firstName = payload.name.split(/\s+/)[0] || 'there';
            const roleLabel = payload.role === 'advisor' ? 'Advisor' : 'Client';
            successText.textContent = `Welcome to Stackly, ${firstName}. Your ${roleLabel} account is ready. Redirecting to your dashboard...`;
          }

          if (successLink) {
            successLink.href = getDashboardPath(payload.role);
          }

          success.hidden = false;
          success.focus();
          redirectToDashboard(payload.role);
        }
      }, 1000);
    });

    updateStrength();
    updateSubmitState();
  }
})();
