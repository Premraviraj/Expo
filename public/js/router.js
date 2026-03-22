// ── Client-Side Router ───────────────────────────────────────
const routes = {
  '/dashboard':  () => DashboardPage.render(),
  '/stories':    () => StoriesPage.render(),
  '/trends':     () => TrendsPage.render(),
  '/community':  () => CommunityPage.render(),
  '/profile':    () => ProfilePage.render(),
  '/auth':       () => AuthPage.render(),
  '/admin':      () => AdminPage.render(),
};

const protected_routes = ['/dashboard', '/stories', '/trends', '/community', '/admin', '/profile'];

// In demo mode (no Supabase), track login state in memory
window.demoLoggedIn = false;

async function isAuthenticated() {
  if (!AppConfig.isConnected()) return window.demoLoggedIn;
  return !!AppConfig.getSessionSync()?.user;
}

// Called by AuthPage after successful login
window.setDemoLoggedIn = () => { window.demoLoggedIn = true; };

async function navigate() {
  const hash  = window.location.hash.replace('#', '') || '/auth';
  const communityMatch = hash.match(/^\/community\/(.+)$/);
  const route = communityMatch ? '/community'
    : (routes[hash] ? hash : '/auth');

  const authed = await isAuthenticated();

  if (protected_routes.includes(route) && !authed) {
    window.location.hash = '#/auth';
    return;
  }

  if (route === '/auth' && authed) {
    const email = AppConfig.getSessionSync()?.user?.email;
    window.location.hash = AppConfig.isAdmin(email) ? '#/admin' : '#/dashboard';
    return;
  }

  if (communityMatch) {
    CommunityPage.render(communityMatch[1]);
  } else {
    routes[route]();
  }
  Navbar.setActive();
}

window.addEventListener('hashchange', navigate);

(async () => {
  await AppConfig.init();
  // Wait for the one-time session prime before routing
  if (AppConfig._sessionReady) await AppConfig._sessionReady;
  navigate();

  // FAB for mobile
  document.getElementById('fab-add-expense')?.addEventListener('click', () => {
    ExpenseDrawer.open();
  });
  renderIcons();
})();
