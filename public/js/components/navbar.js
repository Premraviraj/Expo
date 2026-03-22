// ── Navbar Component ─────────────────────────────────────────
window.Navbar = {
  async render() {
    const nav = document.getElementById('navbar-root');
    if (!nav) return;

    const authed = AppConfig.isConnected()
      ? !!AppConfig.getSessionSync()?.user
      : window.demoLoggedIn;

    // Detect if we're on the admin page
    const isAdminPage = window.location.pathname === '/admin';

    if (isAdminPage) {
      nav.innerHTML = `
        <header class="navbar">
          <div class="logo">
            <i data-lucide="shield-check"></i>
            Admin Portal
          </div>
          <nav>
            <span style="font-size:0.75rem;font-weight:600;opacity:0.4;padding:6px 12px;text-transform:uppercase;letter-spacing:1px">
              Analytics
            </span>
            <a href="#" id="logout-btn">
              <i data-lucide="log-out"></i> Logout
            </a>
          </nav>
        </header>`;

      document.getElementById('logout-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        if (AppConfig.isConnected()) await AppConfig.supabase.auth.signOut();
        window.location.reload();
      });

      renderIcons();
      return;
    }

    nav.innerHTML = `
      <header class="navbar">
        <div class="logo">
          <i data-lucide="wallet"></i>
          ExpenseStory
        </div>
        <nav>
          <a href="#/dashboard" data-route="/dashboard">
            <i data-lucide="layout-dashboard"></i> Dashboard
          </a>
          <a href="#/stories" data-route="/stories">
            <i data-lucide="book-open"></i> Stories
          </a>
          <a href="#/trends" data-route="/trends">
            <i data-lucide="trending-up"></i> Trends
          </a>
          <a href="#/community" data-route="/community">
            <i data-lucide="users"></i> Community
          </a>
          <a href="#/profile" data-route="/profile">
            <i data-lucide="user-circle"></i> Profile
          </a>
          <button class="btn btn-gold navbar-add-btn" id="navbar-add-expense">
            <i data-lucide="plus"></i> Add Expense
          </button>
          ${authed
            ? `<a href="#" id="logout-btn" data-route="/logout">
                <i data-lucide="log-out"></i> Logout
               </a>`
            : `<a href="#/auth" data-route="/auth">
                <i data-lucide="log-in"></i> Login
               </a>`
          }
        </nav>
      </header>`;

    if (authed) {
      document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    document.getElementById('navbar-add-expense')?.addEventListener('click', () => {
      ExpenseDrawer.open();
    });

    renderIcons();
    this.setActive();
  },

  async logout() {
    if (AppConfig.isConnected()) await AppConfig.supabase.auth.signOut();
    window.demoLoggedIn = false;
    window.location.hash = '#/auth';
  },

  setActive() {
    const current = window.location.hash.replace('#', '') || '/auth';
    document.querySelectorAll('.navbar nav a[data-route]').forEach(a => {
      a.classList.toggle('active', a.getAttribute('data-route') === current);
    });
  },

  hide() {
    const nav = document.getElementById('navbar-root');
    if (nav) nav.innerHTML = '';
  }
};
