// ═══════════════════════════════════════════════
// RailSmart — SPA Router & App Controller
// ═══════════════════════════════════════════════

const App = {
  _currentPage: null,
  _pages: {
    search: SearchPage,
    status: StatusPage,
    map: MapPage,
    analytics: AnalyticsPage,
  },

  init() {
    this._bindRouting();
    this._navigate(this._getHash());
    this._addButtonRipples();
  },

  _getHash() {
    return window.location.hash.slice(1) || 'search';
  },

  _bindRouting() {
    window.addEventListener('hashchange', () => {
      this._navigate(this._getHash());
    });
  },

  _navigate(pageName) {
    // Destroy current page
    if (this._currentPage && this._currentPage.destroy) {
      this._currentPage.destroy();
    }

    // Get page module
    const page = this._pages[pageName];
    if (!page) {
      this._navigate('search');
      return;
    }

    // Update nav tabs
    $$('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.page === pageName);
    });

    // Render page
    const app = $('#app');
    if (app) {
      app.innerHTML = page.render();
    }

    // Initialize page
    this._currentPage = page;
    if (page.init) {
      page.init();
    }
  },

  _addButtonRipples() {
    on(document, 'click', (e) => {
      const btn = e.target.closest('.btn');
      if (btn) addRipple(e);
    });
  },
};

// Boot
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
