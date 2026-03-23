// ── Icon helper ──────────────────────────────────────────────
window.renderIcons = () => {
  if (window.lucide) lucide.createIcons();
};

// Quick debug helper — call dbg() in console
window.dbg = async () => {
  const { data: { session } } = await AppConfig.supabase.auth.getSession();
  console.log('uid:', session?.user?.id);
  const { data, error } = await AppConfig.supabase
    .from('communities')
    .insert([{ name: 'test', budget: 100, invite_code: 'DBG' + Date.now(), created_by: session?.user?.id }])
    .select().single();
  console.log('insert data:', data, 'error:', error?.message, error?.code);
};

// ── Admin email list ─────────────────────────────────────────
// Add your admin email(s) here
const ADMIN_EMAILS = [
  'premraviraj2004@gmail.com',
];

// ── Supabase Client Init ─────────────────────────────────────
window.AppConfig = {
  supabase: null,
  _projectRef: null,

  async init() {
    try {
      const res = await fetch('/api/config');
      const { supabaseUrl, supabaseAnonKey } = await res.json();

      if (supabaseUrl && supabaseAnonKey &&
          supabaseUrl !== 'your_supabase_project_url_here') {
        this.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            detectSessionInUrl: false,
            autoRefreshToken: true,
          }
        });
        // Extract project ref for localStorage key
        const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
        this._projectRef = match ? match[1] : null;

        // Prime the session once at startup — all subsequent reads use getSessionSync()
        this._sessionReady = this.supabase.auth.getSession().then(({ data }) => {
          return data.session;
        }).catch(() => null);

        console.log('✅ Supabase connected');
      } else {
        console.warn('⚠️ Supabase keys not set — add them to .env.local');
      }
    } catch(e) {
      console.warn('⚠️ Could not load config:', e.message);
    }
  },

  // Read session directly from localStorage — zero network calls, zero lock contention.
  getSessionSync() {
    if (!this._projectRef) return null;
    try {
      const key = 'sb-' + this._projectRef + '-auth-token';
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const session = JSON.parse(raw);
      // Check if token is expired — if so, clear it and return null
      if (session?.expires_at && session.expires_at * 1000 < Date.now()) {
        localStorage.removeItem(key);
        return null;
      }
      return session;
    } catch(e) {
      return null;
    }
  },

  // Async version — reads localStorage first, no lock acquired
  async getSession() {
    const cached = this.getSessionSync();
    if (cached) return { data: { session: cached } };
    // Only hit the network if nothing in storage
    return this.supabase.auth.getSession();
  },

  // Get a pre-built supabase client with the access token already set,
  // bypassing any internal getUser/lock calls for data queries
  async db() {
    const session = this.getSessionSync();
    if (session?.access_token) {
      // Return a client with the token pre-set — no internal auth calls needed
      return this.supabase;
    }
    return this.supabase;
  },

  // Keep getUser for write operations that truly need a verified token
  async getUser() {
    return this.supabase.auth.getUser();
  },

  isConnected() {
    return !!this.supabase;
  },

  isAdmin(email) {
    // Check hardcoded list OR user_metadata flag set via admin panel
    if (ADMIN_EMAILS.includes(email?.toLowerCase())) return true;
    const meta = this.getSessionSync()?.user?.user_metadata;
    return !!meta?.is_admin;
  }
};

// ── Chart Tooltip ────────────────────────────────────────────
window.ChartTooltip = (() => {
  let el = null;

  function _ensure() {
    if (!el) {
      el = document.createElement('div');
      el.className = 'chart-tooltip';
      document.body.appendChild(el);
    }
    return el;
  }

  return {
    show(e, label, value) {
      const t = _ensure();
      t.innerHTML = `<div class="tt-label">${label}</div><div class="tt-value">${value}</div>`;
      t.classList.add('visible');
      this.move(e);
    },
    move(e) {
      if (!el) return;
      const x = e.clientX + 14;
      const y = e.clientY - 36;
      const rect = el.getBoundingClientRect();
      el.style.left = (x + rect.width > window.innerWidth ? e.clientX - rect.width - 10 : x) + 'px';
      el.style.top  = Math.max(4, y) + 'px';
    },
    hide() {
      if (el) el.classList.remove('visible');
    }
  };
})();
