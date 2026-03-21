// ── Client-Side Router ───────────────────────────────────────
const routes = {
  '/dashboard': () => DashboardPage.render(),
  '/stories':   () => StoriesPage.render(),
  '/trends':    () => TrendsPage.render(),
  '/auth':      () => AuthPage.render(),
};

function navigate() {
  const hash = window.location.hash.replace('#', '') || '/dashboard';
  const handler = routes[hash] || routes['/dashboard'];
  handler();
  Navbar.setActive();
}

window.addEventListener('hashchange', navigate);

// Boot
(async () => {
  await AppConfig.init();
  navigate();
})();
