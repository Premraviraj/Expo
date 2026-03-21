// ── Auth Page ────────────────────────────────────────────────
window.AuthPage = {
  mode: 'login', // 'login' | 'signup'

  render() {
    Navbar.hide();
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="auth-wrap">
        <div class="auth-box">
          <h1 style="display:flex;align-items:center;gap:10px">
            <i data-lucide="${this.mode === 'login' ? 'log-in' : 'user-plus'}"></i>
            ${this.mode === 'login' ? 'Welcome back' : 'Join the story'}
          </h1>
          <p>${this.mode === 'login' ? 'Sign in to see where your money went.' : 'Start tracking your spending story.'}</p>

          <div id="auth-error"></div>

          <div class="form-group">
            <label>Email</label>
            <input type="email" id="auth-email" placeholder="you@example.com" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="auth-password" placeholder="••••••••" />
          </div>

          <button class="btn btn-black" style="width:100%" id="auth-submit">
            ${this.mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <div class="auth-toggle">
            ${this.mode === 'login'
              ? `No account? <a id="auth-switch">Sign up</a>`
              : `Already have one? <a id="auth-switch">Sign in</a>`
            }
          </div>
        </div>
      </div>
    `;

    renderIcons();
    document.getElementById('auth-submit').addEventListener('click', () => this.handleSubmit());
    document.getElementById('auth-switch').addEventListener('click', () => {
      this.mode = this.mode === 'login' ? 'signup' : 'login';
      this.render();
    });
  },

  async handleSubmit() {
    const email    = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errEl    = document.getElementById('auth-error');
    errEl.innerHTML = '';

    if (!email || !password) {
      errEl.innerHTML = '<div class="error-msg">Fill in all fields.</div>';
      return;
    }

    if (!AppConfig.isConnected()) {
      // Demo mode — just navigate
      window.location.hash = '#/dashboard';
      return;
    }

    try {
      let result;
      if (this.mode === 'login') {
        result = await AppConfig.supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await AppConfig.supabase.auth.signUp({ email, password });
      }

      if (result.error) throw result.error;
      window.location.hash = '#/dashboard';
    } catch (e) {
      errEl.innerHTML = `<div class="error-msg">${e.message}</div>`;
    }
  }
};
