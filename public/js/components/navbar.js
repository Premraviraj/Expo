// ── Navbar Component ─────────────────────────────────────────
window.Navbar = {
  render() {
    const nav = document.getElementById('navbar-root');
    if (!nav) return;

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
          <a href="#/auth" data-route="/auth" id="auth-nav-link">
            <i data-lucide="log-in"></i> Login
          </a>
        </nav>
      </header>
    `;

    renderIcons();
    this.setActive();
  },

  setActive() {
    const current = window.location.hash.replace('#', '') || '/dashboard';
    document.querySelectorAll('.navbar nav a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('data-route') === current);
    });
  },

  hide() {
    const nav = document.getElementById('navbar-root');
    if (nav) nav.innerHTML = '';
  }
};
