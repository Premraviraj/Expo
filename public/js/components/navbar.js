// ── Navbar Component ─────────────────────────────────────────
window.Navbar = {
  async render() {
    const nav = document.getElementById('navbar-root');
    if (!nav) return;

    const session = AppConfig.getSessionSync();
    const authed  = AppConfig.isConnected() ? !!session?.user : window.demoLoggedIn;
    const isAdmin = authed && AppConfig.isAdmin(session?.user?.email);

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
          ${isAdmin ? `<a href="#/admin" data-route="/admin">
            <i data-lucide="shield-check"></i> Admin
          </a>` : ''}
          <button class="btn btn-gold navbar-add-btn" id="navbar-add-expense">
            <i data-lucide="plus"></i> Add Expense
          </button>
          ${authed
            ? `<a href="#" id="logout-btn"><i data-lucide="log-out"></i> Logout</a>`
            : `<a href="#/auth" data-route="/auth"><i data-lucide="log-in"></i> Login</a>`
          }
        </nav>
      </header>`;

    if (authed) {
      document.getElementById('logout-btn')?.addEventListener('click', (e) => {
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
