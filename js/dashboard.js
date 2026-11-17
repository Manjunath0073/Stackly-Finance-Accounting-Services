/* =====================================================
   Stackly — Client Dashboard SPA
   Vanilla, no frameworks, no chart libraries
   ===================================================== */

(function () {
  'use strict';

  const STORAGE_USER = 'stackly_user';
  const STORAGE_THEME = 'stackly-theme';
  const STORAGE_PREFS = 'stackly_prefs';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const state = {
    user: null,
    route: 'overview',
    invoiceFilter: 'all',
    docQuery: '',
    preferences: {
      emailNotifications: true,
      invoiceReminders: true,
      monthlyDigest: false,
    },
    activeConversation: 'amara',
    invoices: [
      { number: 'INV-0048', date: 'Oct 18, 2026', description: 'Monthly bookkeeping — October', amount: 850, status: 'paid' },
      { number: 'INV-0047', date: 'Oct 12, 2026', description: 'Payroll processing — October', amount: 4200, status: 'pending' },
      { number: 'INV-0046', date: 'Sep 30, 2026', description: 'Quarterly tax planning', amount: 1200, status: 'paid' },
      { number: 'INV-0045', date: 'Sep 22, 2026', description: 'Audit preparation retainer', amount: 5680, status: 'overdue' },
      { number: 'INV-0044', date: 'Sep 15, 2026', description: 'CFO advisory session', amount: 600, status: 'paid' },
      { number: 'INV-0043', date: 'Sep 01, 2026', description: 'Monthly bookkeeping — September', amount: 850, status: 'paid' },
      { number: 'INV-0042', date: 'Aug 28, 2026', description: 'Payroll setup and catch-up', amount: 2600, status: 'pending' },
      { number: 'INV-0041', date: 'Aug 15, 2026', description: 'Tax strategy workshop', amount: 980, status: 'paid' },
    ],
    documents: [
      { id: 'doc-1', name: 'October P&L.pdf', type: 'pdf', size: '1.8 MB', date: 'Oct 20, 2026', uploader: 'Amara Okafor' },
      { id: 'doc-2', name: 'Q3 Balance Sheet.xlsx', type: 'sheet', size: '980 KB', date: 'Oct 15, 2026', uploader: 'Amara Okafor' },
      { id: 'doc-3', name: '2026 Tax Summary.pdf', type: 'pdf', size: '2.4 MB', date: 'Oct 12, 2026', uploader: 'James Whitfield' },
      { id: 'doc-4', name: 'Payroll Register — Sep.csv', type: 'sheet', size: '420 KB', date: 'Oct 05, 2026', uploader: 'Priya Malhotra' },
      { id: 'doc-5', name: 'Bank Statement — Sep.pdf', type: 'pdf', size: '1.1 MB', date: 'Oct 03, 2026', uploader: 'You' },
      { id: 'doc-6', name: 'Invoice INV-0048.pdf', type: 'pdf', size: '240 KB', date: 'Oct 01, 2026', uploader: 'You' },
      { id: 'doc-7', name: 'Cash Flow Forecast.xlsx', type: 'sheet', size: '760 KB', date: 'Sep 28, 2026', uploader: 'James Whitfield' },
      { id: 'doc-8', name: 'Articles of Incorporation.pdf', type: 'pdf', size: '3.2 MB', date: 'Sep 20, 2026', uploader: 'You' },
      { id: 'doc-9', name: 'W-9 — Stackly.pdf', type: 'pdf', size: '180 KB', date: 'Sep 15, 2026', uploader: 'Amara Okafor' },
      { id: 'doc-10', name: 'Insurance Certificate.pdf', type: 'pdf', size: '540 KB', date: 'Sep 10, 2026', uploader: 'Priya Malhotra' },
    ],
    conversations: [
      {
        id: 'amara',
        name: 'Amara Okafor',
        role: 'Head of Tax, CPA',
        initials: 'AO',
        avatarClass: 'avatar--teal',
        online: true,
        day: 'Today',
        messages: [
          { from: 'advisor', text: "Hi there! I've reviewed your Q3 numbers. Everything reconciles cleanly.", time: '10:12 AM' },
          { from: 'client', text: "That's great to hear. Any changes to the tax plan?", time: '10:15 AM' },
          { from: 'advisor', text: "One small one — I'd like to move the equipment purchase into Q4. I've uploaded a revised summary to Documents.", time: '10:18 AM' },
        ],
      },
      {
        id: 'james',
        name: 'James Whitfield',
        role: 'CFO Advisory Lead, CFA',
        initials: 'JW',
        avatarClass: 'avatar--rose',
        online: false,
        day: 'Yesterday',
        messages: [
          { from: 'advisor', text: 'The cash flow forecast looks good. You are covered through March at the current burn.', time: '4:02 PM' },
          { from: 'client', text: 'Perfect. Can we review the hiring plan next week?', time: '4:08 PM' },
          { from: 'advisor', text: "Absolutely. I'll send a few times.", time: '4:12 PM' },
        ],
      },
    ],
  };

  let closeSidebar = () => {};
  let closeDropdowns = () => {};

  /* ---------------------------------------------------
     Boot
     --------------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initTheme();
    initGenericToasts();

    state.user = loadUser();

    if (!state.user || state.user.role !== 'client') {
      showRestricted();
      return;
    }

    showApp();
    loadPreferences();
    populateUserUI();

    initSidebar();
    initSkipLink();
    initDropdowns();
    initLogout();
    initInvoices();
    initDocuments();
    initReports();
    initServices();
    initMessages();
    initSettings();
    initRouter();
  }

  /* ---------------------------------------------------
     Theme
     --------------------------------------------------- */
  function initTheme() {
    const toggles = $$('.js-theme-toggle');
    let stored = null;

    try {
      stored = window.localStorage.getItem(STORAGE_THEME);
    } catch (error) {
      stored = null;
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;

    document.documentElement.classList.toggle('dark', dark);

    const sync = () => {
      const isDark = document.documentElement.classList.contains('dark');
      toggles.forEach((button) => {
        button.setAttribute('aria-pressed', String(isDark));
        button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      });
    };

    toggles.forEach((button) => {
      button.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        try {
          window.localStorage.setItem(STORAGE_THEME, isDark ? 'dark' : 'light');
        } catch (error) {
          // Ignore storage failures.
        }
        sync();
      });
    });

    sync();
  }

  function initGenericToasts() {
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-toast]');
      if (!trigger) return;
      showToast(trigger.dataset.toast || 'Done.');
    });
  }

  /* ---------------------------------------------------
     Auth / user
     --------------------------------------------------- */
  function loadUser() {
    try {
      const raw = window.localStorage.getItem(STORAGE_USER);
      if (!raw) return null;

      const user = JSON.parse(raw);
      if (!user || typeof user !== 'object' || !user.email) return null;

      return user;
    } catch (error) {
      return null;
    }
  }

  function saveUser(user) {
    try {
      window.localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function showRestricted() {
    const restricted = $('#restricted');
    const app = $('#appShell');
    const message = $('#restrictedMessage');
    const skipLink = $('.skip-link');

    if (app) app.hidden = true;
    if (skipLink) skipLink.hidden = true;
    if (restricted) restricted.hidden = false;

    if (message) {
      if (state.user && state.user.role && state.user.role !== 'client') {
        message.textContent = 'This dashboard is for client accounts. You are signed in as an advisor. Sign in with a client account to continue.';
      } else {
        message.textContent = 'You need a client account to view this dashboard. Sign in or create an account to continue.';
      }
    }

    document.title = 'Access restricted — Stackly';
  }

  function showApp() {
    const restricted = $('#restricted');
    const app = $('#appShell');
    const skipLink = $('.skip-link');
    if (restricted) restricted.hidden = true;
    if (skipLink) skipLink.hidden = false;
    if (app) app.hidden = false;
  }

  function populateUserUI() {
    if (!state.user) return;

    const name = state.user.name || 'Client';
    const email = state.user.email || 'client@example.com';
    const first = name.trim().split(/\s+/)[0] || 'Client';
    const initials = getInitials(name);
    const role = state.user.role === 'advisor' ? 'Advisor' : 'Client';

    $$('[data-user-name]').forEach((element) => { element.textContent = name; });
    $$('[data-user-email]').forEach((element) => { element.textContent = email; });
    $$('[data-user-initials]').forEach((element) => { element.textContent = initials; });
    $$('[data-user-first-name]').forEach((element) => { element.textContent = first; });
    $$('[data-user-role]').forEach((element) => { element.textContent = role; });

    const nameInput = $('#profileName');
    const emailInput = $('#profileEmail');
    if (nameInput) nameInput.value = name;
    if (emailInput) emailInput.value = email;

    const date = $('#overviewDate');
    if (date) date.textContent = formatLongDate(new Date());

    const avatarButton = $('#avatarBtn');
    if (avatarButton) avatarButton.setAttribute('aria-label', `Account menu for ${name}`);
  }

  /* ---------------------------------------------------
     Sidebar
     --------------------------------------------------- */
  function initSidebar() {
    const sidebar = $('#sidebar');
    const toggle = $('.js-sidebar-toggle');
    const closeButton = $('.js-sidebar-close');
    const backdrop = $('#sidebarBackdrop');
    if (!sidebar || !toggle || !backdrop) return;

    const mediaQuery = window.matchMedia('(max-width: 1024px)');
    let previousFocus = null;

    const setOpen = (open, returnFocus) => {
      const isMobile = mediaQuery.matches;
      const isOpen = isMobile && open;

      document.body.classList.toggle('sidebar-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      backdrop.hidden = !isOpen;
      document.body.style.overflow = isOpen ? 'hidden' : '';

      if (isMobile) {
        sidebar.inert = !isOpen;
      } else {
        sidebar.inert = false;
      }

      if (isOpen) {
        previousFocus = document.activeElement;
        const target = sidebar.querySelector('.nav-item.is-active') || closeButton || sidebar;
        if (target) window.setTimeout(() => target.focus(), 50);
      } else if (returnFocus) {
        const focusTarget = previousFocus && document.contains(previousFocus) ? previousFocus : toggle;
        if (focusTarget) focusTarget.focus();
      }
    };

    closeSidebar = (returnFocus) => setOpen(false, returnFocus);

    toggle.addEventListener('click', () => {
      setOpen(!document.body.classList.contains('sidebar-open'), true);
    });

    if (closeButton) {
      closeButton.addEventListener('click', () => closeSidebar(true));
    }

    backdrop.addEventListener('click', () => closeSidebar(true));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
        closeSidebar(true);
      }
    });

    $$('.nav-item, .sidebar__support').forEach((link) => {
      link.addEventListener('click', () => {
        if (mediaQuery.matches) closeSidebar(false);
      });
    });

    const sync = () => {
      if (!mediaQuery.matches) {
        document.body.classList.remove('sidebar-open');
        document.body.style.overflow = '';
        backdrop.hidden = true;
        sidebar.inert = false;
        toggle.setAttribute('aria-expanded', 'false');
      } else {
        sidebar.inert = !document.body.classList.contains('sidebar-open');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', sync);
    } else {
      mediaQuery.addListener(sync);
    }

    sync();
  }

  /* ---------------------------------------------------
     Skip link
     --------------------------------------------------- */
  function initSkipLink() {
    const link = $('.skip-link');
    const main = $('#viewContainer');
    if (!link || !main) return;

    link.addEventListener('click', (event) => {
      event.preventDefault();
      main.focus({ preventScroll: true });
      main.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------------
     Dropdowns
     --------------------------------------------------- */
  function initDropdowns() {
    const buttons = $$('.js-dropdown-toggle');
    const panels = {
      notifications: $('#notificationsPanel'),
      profile: $('#profilePanel'),
    };

    closeDropdowns = () => {
      buttons.forEach((button) => {
        button.setAttribute('aria-expanded', 'false');
      });

      Object.values(panels).forEach((panel) => {
        if (panel) panel.hidden = true;
      });
    };

    const open = (key) => {
      const panel = panels[key];
      const button = buttons.find((item) => item.dataset.dropdown === key);
      if (!panel || !button) return;

      const isOpen = !panel.hidden;
      closeDropdowns();

      if (!isOpen) {
        panel.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        const first = panel.querySelector('a, button');
        if (first) window.setTimeout(() => first.focus(), 40);
      }
    };

    buttons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        open(button.dataset.dropdown);
      });
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.dropdown-anchor') && !event.target.closest('.dropdown-panel')) {
        closeDropdowns();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeDropdowns();
    });

    $$('[data-close-dropdown]').forEach((link) => {
      link.addEventListener('click', () => closeDropdowns());
    });

    const markRead = $('#markReadBtn');
    const dot = $('#notificationDot');

    if (markRead) {
      markRead.addEventListener('click', () => {
        $$('.notification-item.is-unread').forEach((item) => item.classList.remove('is-unread'));
        if (dot) dot.hidden = true;
        showToast('All notifications marked as read.');
      });
    }
  }

  function initLogout() {
    $$('.js-logout').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        try {
          window.localStorage.clear();
        } catch (error) {
          // Ignore storage failures.
        }
        window.location.href = 'login.html';
      });
    });
  }

  /* ---------------------------------------------------
     Router
     --------------------------------------------------- */
  function initRouter() {
    const routes = {
      overview: { title: 'Overview', view: 'view-overview' },
      invoices: { title: 'Invoices', view: 'view-invoices' },
      documents: { title: 'Documents', view: 'view-documents' },
      reports: { title: 'Reports', view: 'view-reports' },
      services: { title: 'Services', view: 'view-services' },
      messages: { title: 'Messages', view: 'view-messages' },
      settings: { title: 'Settings', view: 'view-settings' },
      'not-found': { title: 'Page not found', view: 'view-404' },
    };

    const views = $$('.view');

    const getRoute = () => {
      const raw = window.location.hash.replace(/^#\/?/, '').trim();
      if (!raw) return 'overview';
      return routes[raw] ? raw : 'not-found';
    };

    const render = () => {
      const route = getRoute();
      const meta = routes[route];
      const view = document.getElementById(meta.view);

      state.route = route;

      views.forEach((item) => {
        item.hidden = true;
      });

      if (view) view.hidden = false;

      const title = meta.title;
      const pageTitle = $('#pageTitle');
      if (pageTitle) pageTitle.textContent = title;
      document.title = `${title} — Stackly Client`;

      $$('.nav-item[data-route]').forEach((link) => {
        const isActive = link.dataset.route === route;
        link.classList.toggle('is-active', isActive);

        if (isActive) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });

      closeSidebar(false);
      closeDropdowns();
      window.scrollTo({ top: 0, behavior: 'auto' });

      if (route === 'overview') animateCounters(view);
      if (route === 'messages') renderChat(true);
      if (route === 'settings') syncSettingsForm();

      animateCharts(view);
    };

    if (!window.location.hash || window.location.hash === '#') {
      window.history.replaceState(null, '', '#/overview');
    }

    render();
    window.addEventListener('hashchange', render);
  }

  /* ---------------------------------------------------
     Counters / chart animation
     --------------------------------------------------- */
  function animateCounters(view) {
    if (!view) return;

    $$('[data-counter]', view).forEach((element) => {
      if (element._raf) window.cancelAnimationFrame(element._raf);

      const target = parseFloat(element.dataset.target || '0');
      const prefix = element.dataset.prefix || '';
      const suffix = element.dataset.suffix || '';
      const decimals = parseInt(element.dataset.decimals || '0', 10);

      const format = (value) =>
        prefix +
        value.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) +
        suffix;

      if (reduceMotion) {
        element.textContent = format(target);
        return;
      }

      const duration = 1100;
      const start = performance.now();
      element.textContent = format(0);

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = format(target * eased);

        if (progress < 1) {
          element._raf = window.requestAnimationFrame(tick);
        } else {
          element.textContent = format(target);
          element._raf = null;
        }
      };

      element._raf = window.requestAnimationFrame(tick);
    });
  }

  function animateCharts(view) {
    if (!view) return;

    view.classList.remove('is-animated');
    void view.offsetWidth;
    window.requestAnimationFrame(() => view.classList.add('is-animated'));
  }

  /* ---------------------------------------------------
     Invoices
     --------------------------------------------------- */
  function initInvoices() {
    const tbody = $('#invoiceRows');
    const count = $('#invoiceCount');
    const filters = $$('.js-invoice-filter');
    if (!tbody) return;

    const render = (filter) => {
      state.invoiceFilter = filter;
      const list = filter === 'all' ? state.invoices : state.invoices.filter((invoice) => invoice.status === filter);

      tbody.innerHTML = list.length
        ? list.map(invoiceRow).join('')
        : `<tr><td colspan="6"><div class="empty-state">No invoices match this filter.</div></td></tr>`;

      if (count) {
        count.textContent = `Showing ${list.length} of ${state.invoices.length} invoices`;
      }
    };

    filters.forEach((button) => {
      button.addEventListener('click', () => {
        filters.forEach((item) => {
          const active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', String(active));
        });

        render(button.dataset.filter || 'all');
      });
    });

    tbody.addEventListener('click', (event) => {
      const button = event.target.closest('.js-table-action');
      if (!button) return;

      const invoice = state.invoices.find((item) => item.number === button.dataset.id);
      if (!invoice) return;

      if (button.dataset.action === 'download') {
        showToast(`Invoice #${invoice.number} download started.`, 'download');
      } else {
        showToast(`Payment link for #${invoice.number} is ready.`, 'card');
      }
    });

    render('all');
  }

  function invoiceRow(invoice) {
    const statusLabel = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
    const isPaid = invoice.status === 'paid';
    const action = isPaid ? 'download' : 'pay';
    const actionLabel = isPaid ? 'Download' : 'Pay';
    const actionIcon = isPaid ? 'download' : 'card';

    return `<tr>
      <td><span class="invoice-number">#${escapeHtml(invoice.number)}</span></td>
      <td>${escapeHtml(invoice.date)}</td>
      <td>${escapeHtml(invoice.description)}</td>
      <td class="invoice-amount">${formatCurrency(invoice.amount)}</td>
      <td><span class="badge badge--${invoice.status}">${statusLabel}</span></td>
      <td>
        <button class="table-action js-table-action" type="button" data-id="${escapeHtml(invoice.number)}" data-action="${action}">
          <svg class="icon icon--sm"><use href="#icon-${actionIcon}"></use></svg>${actionLabel}
        </button>
      </td>
    </tr>`;
  }

  /* ---------------------------------------------------
     Documents
     --------------------------------------------------- */
  function initDocuments() {
    const grid = $('#documentGrid');
    const search = $('#documentSearch');
    const count = $('#documentCount');
    const empty = $('#docEmpty');
    const uploadButton = $('#uploadBtn');
    const fileInput = $('#fileInput');
    if (!grid) return;

    const render = () => {
      const query = state.docQuery.trim().toLowerCase();
      const list = state.documents.filter((document) => document.name.toLowerCase().includes(query));

      grid.innerHTML = list.map(docCard).join('');

      if (count) count.textContent = `${list.length} of ${state.documents.length} documents`;
      if (empty) empty.hidden = list.length > 0;
      grid.hidden = list.length === 0;
    };

    if (search) {
      search.addEventListener('input', () => {
        state.docQuery = search.value;
        render();
      });
    }

    if (uploadButton && fileInput) {
      uploadButton.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;

        state.documents.unshift({
          id: `doc-${Date.now()}`,
          name: file.name,
          type: getFileType(file.name),
          size: formatFileSize(file.size),
          date: formatDate(new Date()),
          uploader: state.user.name || 'You',
        });

        fileInput.value = '';
        state.docQuery = '';
        if (search) search.value = '';
        render();
        showToast('Document uploaded successfully.', 'upload');
      });
    }

    grid.addEventListener('click', (event) => {
      const button = event.target.closest('.js-doc-download');
      if (!button) return;

      const document = state.documents.find((item) => item.id === button.dataset.id);
      if (document) showToast(`Download started: ${document.name}.`, 'download');
    });

    render();
  }

  function docCard(document) {
    const typeClass = document.type === 'sheet' ? 'doc-icon--sheet' : document.type === 'doc' ? 'doc-icon--doc' : '';
    const typeLabel = document.type === 'sheet' ? 'Spreadsheet' : document.type === 'doc' ? 'Document' : 'PDF';

    return `<article class="doc-card">
      <span class="doc-icon ${typeClass}" aria-hidden="true"><svg class="icon"><use href="#icon-file"></use></svg></span>
      <div class="doc-card__body">
        <div class="doc-card__name" title="${escapeHtml(document.name)}">${escapeHtml(document.name)}</div>
        <div class="doc-card__meta">${typeLabel} · ${escapeHtml(document.size)} · ${escapeHtml(document.date)} · ${escapeHtml(document.uploader)}</div>
      </div>
      <button class="doc-download js-doc-download" type="button" data-id="${escapeHtml(document.id)}" aria-label="Download ${escapeHtml(document.name)}">
        <svg class="icon"><use href="#icon-download"></use></svg>
      </button>
    </article>`;
  }

  /* ---------------------------------------------------
     Reports
     --------------------------------------------------- */
  function initReports() {
    const view = $('#view-reports');
    const generateButton = $('#generateReportBtn');
    const grid = $('#reportsGrid');

    if (view) {
      view.addEventListener('click', (event) => {
        const action = event.target.closest('.js-report-action');
        if (!action) return;

        const report = action.dataset.report || 'Report';

        if (action.dataset.action === 'view') {
          showToast(`Opening ${report} preview...`, 'file');
        } else {
          showToast(`Exporting ${report}...`, 'download');
        }
      });
    }

    if (!generateButton || !grid) return;

    let generating = false;

    generateButton.addEventListener('click', () => {
      if (generating) return;
      generating = true;

      const original = generateButton.innerHTML;
      generateButton.disabled = true;
      generateButton.textContent = 'Generating...';

      window.setTimeout(() => {
        const card = document.createElement('article');
        card.className = 'card report-card';
        card.innerHTML = `
          <div class="report-card__top">
            <span class="report-card__icon"><svg class="icon"><use href="#icon-spark"></use></svg></span>
            <div><h3>Custom report</h3><p>Generated ${formatDate(new Date())}</p></div>
            <span class="badge badge--ready">Ready</span>
          </div>
          <svg class="sparkline sparkline--teal" viewBox="0 0 120 34" preserveAspectRatio="none" aria-hidden="true">
            <path class="sparkline__fill" d="M0,26 L20,22 L40,24 L60,16 L80,18 L100,10 L120,8 L120,34 L0,34 Z"/>
            <path class="sparkline__line" pathLength="1" d="M0,26 L20,22 L40,24 L60,16 L80,18 L100,10 L120,8"/>
          </svg>
          <div class="report-card__actions">
            <button class="btn btn--ghost btn--sm js-report-action" type="button" data-action="view" data-report="Custom report">View</button>
            <button class="btn btn--outline btn--sm js-report-action" type="button" data-action="export" data-report="Custom report">Export</button>
          </div>`;
        grid.appendChild(card);

        generateButton.disabled = false;
        generateButton.innerHTML = original;
        generating = false;
        showToast('New report generated.', 'chart');
      }, 1200);
    });
  }

  /* ---------------------------------------------------
     Services
     --------------------------------------------------- */
  function initServices() {
    const view = $('#view-services');
    if (!view) return;

    view.addEventListener('click', (event) => {
      const button = event.target.closest('.js-service-action');
      if (!button) return;

      const service = button.dataset.service || 'Service';

      if (button.dataset.action === 'cancel') {
        showToast(`Cancellation request noted for ${service}.`, 'alert');
      } else {
        showToast(`Opening ${service} management...`, 'briefcase');
      }
    });
  }

  /* ---------------------------------------------------
     Messages
     --------------------------------------------------- */
  function initMessages() {
    const list = $('#conversationList');
    const thread = $('#chatThread');
    const form = $('#chatForm');
    const input = $('#chatInput');
    if (!list || !thread || !form || !input) return;

    const activeConversation = () =>
      state.conversations.find((conversation) => conversation.id === state.activeConversation) ||
      state.conversations[0];

    const messageHtml = (message) => `<div class="msg msg--${message.from}">
      <div class="msg__bubble">${escapeHtml(message.text)}</div>
      <time>${escapeHtml(message.time)}</time>
    </div>`;

    const renderList = () => {
      list.innerHTML = state.conversations
        .map((conversation) => {
          const last = conversation.messages[conversation.messages.length - 1];
          const isActive = conversation.id === state.activeConversation;

          return `<button class="conversation${isActive ? ' is-active' : ''}" type="button" data-id="${conversation.id}" aria-pressed="${isActive}">
            <span class="avatar ${conversation.avatarClass || ''}">${escapeHtml(conversation.initials)}</span>
            <span class="conversation__body">
              <span class="conversation__name"><span class="conversation__title">${escapeHtml(conversation.name)}</span><time>${escapeHtml(last ? last.time : '')}</time></span>
              <span class="conversation__snippet">${escapeHtml(last ? last.text : 'Start a conversation')}</span>
            </span>
          </button>`;
        })
        .join('');
    };

    const renderChat = (scroll) => {
      const conversation = activeConversation();
      if (!conversation) return;

      const avatar = $('#chatAvatar');
      const name = $('#chatName');
      const role = $('#chatRole');

      if (avatar) {
        avatar.textContent = conversation.initials;
        avatar.className = `avatar avatar--lg ${conversation.avatarClass || ''}`;
      }

      if (name) name.textContent = conversation.name;

      if (role) {
        role.innerHTML = `${conversation.online ? '<span class="online-dot"></span>' : ''}${escapeHtml(conversation.role)} · ${conversation.online ? 'Online' : 'Usually replies within 2 hours'}`;
      }

      thread.innerHTML =
        `<div class="chat-day">${escapeHtml(conversation.day || 'Today')}</div>` +
        conversation.messages.map(messageHtml).join('');

      if (scroll) thread.scrollTop = thread.scrollHeight;
    };

    // Expose the renderer to the router via a local function reference.
    window.__stacklyRenderChat = renderChat;

    renderList();
    renderChat(true);

    list.addEventListener('click', (event) => {
      const button = event.target.closest('.conversation');
      if (!button) return;

      const id = button.dataset.id;
      if (!state.conversations.some((conversation) => conversation.id === id)) return;

      state.activeConversation = id;

      $$('.conversation', list).forEach((item) => {
        const isActive = item.dataset.id === id;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });

      renderChat(true);
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const text = input.value.trim();
      if (!text) return;

      const conversation = activeConversation();
      if (!conversation) return;

      const message = { from: 'client', text, time: formatTime(new Date()) };
      conversation.messages.push(message);

      input.value = '';
      thread.insertAdjacentHTML('beforeend', messageHtml(message));
      thread.scrollTop = thread.scrollHeight;
      renderList();
    });
  }

  function renderChat(scroll) {
    if (typeof window.__stacklyRenderChat === 'function') {
      window.__stacklyRenderChat(scroll);
    }
  }

  /* ---------------------------------------------------
     Settings
     --------------------------------------------------- */
  function initSettings() {
    syncSettingsForm();

    const profileForm = $('#profileForm');
    const nameInput = $('#profileName');
    const emailInput = $('#profileEmail');
    const nameError = $('#profileNameError');
    const emailError = $('#profileEmailError');

    if (profileForm && nameInput && emailInput) {
      const clearProfileErrors = () => {
        nameError.textContent = '';
        emailError.textContent = '';
        nameInput.classList.remove('is-invalid');
        emailInput.classList.remove('is-invalid');
        nameInput.removeAttribute('aria-invalid');
        emailInput.removeAttribute('aria-invalid');
      };

      nameInput.addEventListener('input', clearProfileErrors);
      emailInput.addEventListener('input', clearProfileErrors);

      profileForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        let firstInvalid = null;

        clearProfileErrors();

        if (name.length < 2 || !/^[\p{L}\p{M}.'’\- ]+$/u.test(name)) {
          nameError.textContent = 'Use letters, spaces, apostrophes, or hyphens only (at least 2 characters).';
          nameInput.classList.add('is-invalid');
          nameInput.setAttribute('aria-invalid', 'true');
          firstInvalid = nameInput;
        }

        if (!EMAIL_RE.test(email)) {
          emailError.textContent = 'Enter a valid email address.';
          emailInput.classList.add('is-invalid');
          emailInput.setAttribute('aria-invalid', 'true');
          if (!firstInvalid) firstInvalid = emailInput;
        }

        if (firstInvalid) {
          firstInvalid.focus();
          return;
        }

        state.user = { ...state.user, name, email };
        saveUser(state.user);
        populateUserUI();
        syncSettingsForm();
        showToast('Profile updated successfully.');
      });
    }

    const preferenceMap = [
      ['prefEmail', 'emailNotifications'],
      ['prefInvoice', 'invoiceReminders'],
      ['prefDigest', 'monthlyDigest'],
    ];

    preferenceMap.forEach(([id, key]) => {
      const toggle = document.getElementById(id);
      if (!toggle) return;

      toggle.addEventListener('change', () => {
        state.preferences[key] = toggle.checked;
        savePreferences();
        showToast('Notification preferences saved.');
      });
    });

    const passwordForm = $('#passwordForm');
    const currentPassword = $('#currentPassword');
    const newPassword = $('#newPassword');
    const confirmPassword = $('#confirmPassword');

    if (passwordForm && currentPassword && newPassword && confirmPassword) {
      const currentError = $('#currentPasswordError');
      const newError = $('#newPasswordError');
      const confirmError = $('#confirmPasswordError');

      const clearPasswordErrors = () => {
        [currentPassword, newPassword, confirmPassword].forEach((input) => {
          input.classList.remove('is-invalid');
          input.removeAttribute('aria-invalid');
        });
        currentError.textContent = '';
        newError.textContent = '';
        confirmError.textContent = '';
      };

      [currentPassword, newPassword, confirmPassword].forEach((input) => {
        input.addEventListener('input', clearPasswordErrors);
      });

      passwordForm.addEventListener('submit', (event) => {
        event.preventDefault();
        clearPasswordErrors();

        let firstInvalid = null;

        if (!currentPassword.value) {
          currentError.textContent = 'Enter your current password.';
          currentPassword.classList.add('is-invalid');
          currentPassword.setAttribute('aria-invalid', 'true');
          firstInvalid = currentPassword;
        }

        if (newPassword.value.length < 8) {
          newError.textContent = 'Use at least 8 characters.';
          newPassword.classList.add('is-invalid');
          newPassword.setAttribute('aria-invalid', 'true');
          if (!firstInvalid) firstInvalid = newPassword;
        }

        if (!confirmPassword.value || confirmPassword.value !== newPassword.value) {
          confirmError.textContent = 'Passwords do not match.';
          confirmPassword.classList.add('is-invalid');
          confirmPassword.setAttribute('aria-invalid', 'true');
          if (!firstInvalid) firstInvalid = confirmPassword;
        }

        if (firstInvalid) {
          firstInvalid.focus();
          return;
        }

        passwordForm.reset();
        clearPasswordErrors();
        showToast('Password updated (demo).', 'lock');
      });
    }
  }

  function syncSettingsForm() {
    if (!state.user) return;

    const nameInput = $('#profileName');
    const emailInput = $('#profileEmail');
    const nameError = $('#profileNameError');
    const emailError = $('#profileEmailError');

    if (nameInput) nameInput.value = state.user.name || '';
    if (emailInput) emailInput.value = state.user.email || '';
    if (nameError) nameError.textContent = '';
    if (emailError) emailError.textContent = '';

    const preferenceMap = [
      ['prefEmail', 'emailNotifications'],
      ['prefInvoice', 'invoiceReminders'],
      ['prefDigest', 'monthlyDigest'],
    ];

    preferenceMap.forEach(([id, key]) => {
      const toggle = document.getElementById(id);
      if (toggle) toggle.checked = !!state.preferences[key];
    });
  }

  function loadPreferences() {
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFS);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;

      state.preferences = {
        emailNotifications: parsed.emailNotifications !== false,
        invoiceReminders: parsed.invoiceReminders !== false,
        monthlyDigest: parsed.monthlyDigest === true,
      };
    } catch (error) {
      // Keep defaults.
    }
  }

  function savePreferences() {
    try {
      window.localStorage.setItem(STORAGE_PREFS, JSON.stringify(state.preferences));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  /* ---------------------------------------------------
     Toasts
     --------------------------------------------------- */
  function showToast(message, icon = 'check') {
    const container = $('#toastContainer');
    if (!container) return;

    const iconMap = {
      check: 'icon-check',
      alert: 'icon-alert',
      upload: 'icon-upload',
      download: 'icon-download',
      card: 'icon-card',
      chart: 'icon-chart',
      file: 'icon-file',
      briefcase: 'icon-briefcase',
      lock: 'icon-lock',
      user: 'icon-user',
    };

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <span class="toast__icon" aria-hidden="true"><svg class="icon"><use href="#${iconMap[icon] || 'icon-check'}"></use></svg></span>
      <p>${escapeHtml(message)}</p>
      <button class="toast__close" type="button" aria-label="Dismiss notification">×</button>`;

    container.appendChild(toast);

    const remove = () => {
      if (!toast.isConnected) return;
      toast.classList.add('is-leaving');
      window.setTimeout(() => toast.remove(), 200);
    };

    const timer = window.setTimeout(remove, 3000);
    toast.querySelector('.toast__close').addEventListener('click', () => {
      window.clearTimeout(timer);
      remove();
    });
  }

  /* ---------------------------------------------------
     Utilities
     --------------------------------------------------- */
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[character]));
  }

  function getInitials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'SC';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  }

  function formatLongDate(date) {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
  }

  function formatFileSize(bytes) {
    if (!bytes || bytes < 1024) return `${Math.max(1, Math.round(bytes || 0))} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileType(name) {
    const extension = String(name).split('.').pop().toLowerCase();
    if (['xls', 'xlsx', 'csv'].includes(extension)) return 'sheet';
    if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) return 'doc';
    return 'pdf';
  }

  /* Re-check auth when returning from the bfcache after a logout. */
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    const user = loadUser();
    if (!user || user.role !== 'client') window.location.reload();
  });
})();
