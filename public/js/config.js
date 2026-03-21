// ── Icon helper — call after any innerHTML render ────────────
window.renderIcons = () => {
  if (window.lucide) lucide.createIcons();
};

// ── Supabase Client Init ─────────────────────────────────────
// Keys are fetched from the server to keep them out of source code
window.AppConfig = {
  supabase: null,

  async init() {
    try {
      const res = await fetch('/api/config');
      const { supabaseUrl, supabaseAnonKey } = await res.json();

      if (supabaseUrl && supabaseAnonKey &&
          supabaseUrl !== 'your_supabase_project_url_here') {
        this.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase connected');
      } else {
        console.warn('⚠️ Supabase keys not set — running with dummy data');
      }
    } catch (e) {
      console.warn('⚠️ Could not load config — running with dummy data');
    }
  },

  isConnected() {
    return !!this.supabase;
  }
};
