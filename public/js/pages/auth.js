// ── Auth Page ────────────────────────────────────────────────
window.AuthPage = {
  mode: 'login',

  _loginForm() {
    return `
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="auth-email" placeholder="you@example.com" autocomplete="email" />
      </div>
      <div class="form-group" style="position:relative">
        <label>Password</label>
        <input type="password" id="auth-password" placeholder="••••••••" autocomplete="current-password" />
        <button type="button" class="pwd-toggle" id="pwd-toggle" tabindex="-1">
          <i data-lucide="eye"></i>
        </button>
      </div>`;
  },

  _signupForm() {
    return `
      <div class="form-row">
        <div class="form-group">
          <label>First Name</label>
          <input type="text" id="auth-firstname" placeholder="Alex" autocomplete="given-name" />
        </div>
        <div class="form-group">
          <label>Last Name</label>
          <input type="text" id="auth-lastname" placeholder="Johnson" autocomplete="family-name" />
        </div>
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="auth-email" placeholder="you@example.com" autocomplete="email" />
      </div>
      <div class="form-group">
        <label>Phone <span class="form-optional">optional</span></label>
        <input type="tel" id="auth-phone" placeholder="+91 98765 43210" autocomplete="tel" />
      </div>
      <div class="form-group" style="position:relative">
        <label>Password</label>
        <input type="password" id="auth-password" placeholder="Min. 8 characters" autocomplete="new-password" />
        <button type="button" class="pwd-toggle" id="pwd-toggle" tabindex="-1">
          <i data-lucide="eye"></i>
        </button>
      </div>
      <div class="form-group" style="position:relative">
        <label>Confirm Password</label>
        <input type="password" id="auth-confirm" placeholder="••••••••" autocomplete="new-password" />
      </div>
      <div class="form-group">
        <label>Monthly Income <span class="form-optional">optional</span></label>
        <div class="budget-input-wrap">
          <span class="budget-prefix">₹</span>
          <input type="number" id="auth-budget" placeholder="50000" min="0" />
        </div>
      </div>`;
  },

  render() {
    Navbar.hide();
    const app = document.getElementById('app');
    const isLogin = this.mode === 'login';

    app.innerHTML = `
      <div class="auth-wrap">

        <!-- Left panel -->
        <div class="auth-left">
          <div class="brand">
            <i data-lucide="wallet"></i>
            ExpenseStory
          </div>
          <h2>Where did your money actually go?</h2>
          <p>Stop guessing. Start seeing your spending as a story — with context, patterns, and the truth.</p>
          <div class="auth-features">
            <div class="auth-feature"><i data-lucide="book-open"></i> Visual spending stories</div>
            <div class="auth-feature"><i data-lucide="trending-up"></i> Trends and monthly insights</div>
            <div class="auth-feature"><i data-lucide="shield-check"></i> Secure with Supabase auth</div>
            <div class="auth-feature"><i data-lucide="bell"></i> Smart spending alerts</div>
          </div>
        </div>

        <!-- Right panel -->
        <div class="auth-right">
          <div class="auth-box ${isLogin ? '' : 'auth-box-wide'}">

            <!-- Step indicator (signup only) -->
            ${!isLogin ? `
              <div class="auth-steps">
                <div class="auth-step active" id="step-dot-1">1</div>
                <div class="auth-step-line"></div>
                <div class="auth-step" id="step-dot-2">2</div>
              </div>
            ` : ''}

            <h1>
              <i data-lucide="${isLogin ? 'log-in' : 'user-plus'}"></i>
              ${isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p class="auth-sub">
              ${isLogin ? 'Sign in to see where your money went.' : 'Takes 30 seconds. No credit card.'}
            </p>

            <div id="auth-error"></div>

            <div id="auth-form-fields">
              ${isLogin ? this._loginForm() : this._signupForm()}
            </div>

            ${!isLogin ? `
              <div class="form-group" style="margin-top:0.5rem">
                <label class="checkbox-label">
                  <input type="checkbox" id="auth-terms" />
                  <span>I agree to the <a href="#" style="color:var(--ink);font-weight:800">Terms</a> and <a href="#" style="color:var(--ink);font-weight:800">Privacy Policy</a></span>
                </label>
              </div>
            ` : ''}

            <button class="btn btn-dark auth-submit-btn" id="auth-submit">
              <i data-lucide="${isLogin ? 'log-in' : 'user-plus'}"></i>
              ${isLogin ? 'Sign In' : 'Create Account'}
            </button>

            ${isLogin ? `
              <div style="text-align:right;margin-top:0.6rem">
                <a id="forgot-link" style="font-size:0.78rem;font-weight:600;opacity:0.5;cursor:pointer;text-decoration:underline">
                  Forgot password?
                </a>
              </div>
            ` : ''}

            <div class="auth-divider"><span>or</span></div>

            <div class="auth-toggle">
              ${isLogin
                ? `No account? <a id="auth-switch">Sign up free</a>`
                : `Already have one? <a id="auth-switch">Sign in</a>`
              }
            </div>

            ${!AppConfig.isConnected() ? `
              <div class="demo-notice">
                <i data-lucide="info"></i>
                Demo mode — Supabase not connected. Click to continue.
              </div>
            ` : ''}
          </div>
        </div>

      </div>`;

    renderIcons();
    this._bindEvents();
  },

  _bindEvents() {
    document.getElementById('auth-submit').addEventListener('click', () => this.handleSubmit());
    document.getElementById('auth-switch').addEventListener('click', () => {
      this.mode = this.mode === 'login' ? 'signup' : 'login';
      this.render();
    });

    // Password visibility toggle
    document.getElementById('pwd-toggle')?.addEventListener('click', () => {
      const input = document.getElementById('auth-password');
      const icon  = document.querySelector('#pwd-toggle i');
      if (!input || !icon) return;
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      renderIcons();
    });

    // Enter submits
    document.getElementById('auth-password')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.handleSubmit();
    });
    document.getElementById('auth-confirm')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.handleSubmit();
    });

    // Forgot password
    document.getElementById('forgot-link')?.addEventListener('click', () => this.handleForgot());

    // Live password strength (signup only)
    if (this.mode === 'signup') {
      document.getElementById('auth-password')?.addEventListener('input', e => {
        this._showStrength(e.target.value);
      });
    }
  },

  _showStrength(val) {
    let existing = document.getElementById('pwd-strength');
    if (!existing) {
      const wrap = document.getElementById('auth-password').closest('.form-group');
      wrap.insertAdjacentHTML('beforeend', `
        <div id="pwd-strength" style="display:flex;gap:4px;margin-top:6px">
          ${[1,2,3,4].map(i => `<div class="strength-seg" id="seg-${i}"></div>`).join('')}
        </div>
        <div id="pwd-strength-label" style="font-size:0.7rem;font-weight:700;margin-top:4px;opacity:0.5"></div>
      `);
    }
    const score = this._passwordScore(val);
    const colors = ['#c0392b','#e8d4b8','#c4d4e8','#c4e0cc'];
    const labels = ['Too short','Weak','Fair','Strong'];
    [1,2,3,4].forEach(i => {
      const seg = document.getElementById('seg-' + i);
      if (seg) seg.style.background = i <= score ? colors[score - 1] : 'rgba(26,26,46,0.1)';
    });
    const lbl = document.getElementById('pwd-strength-label');
    if (lbl) lbl.textContent = val.length ? labels[score - 1] : '';
  },

  _passwordScore(val) {
    if (val.length < 6) return 1;
    let score = 1;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return Math.min(score, 4);
  },

  async handleForgot() {
    const email = document.getElementById('auth-email')?.value.trim();
    const errEl = document.getElementById('auth-error');
    if (!email) {
      errEl.innerHTML = '<div class="error-msg">Enter your email first.</div>';
      return;
    }
    if (!AppConfig.isConnected()) {
      errEl.innerHTML = '<div class="error-msg">Supabase not connected.</div>';
      return;
    }
    const { error } = await AppConfig.supabase.auth.resetPasswordForEmail(email);
    if (error) {
      errEl.innerHTML = `<div class="error-msg">${error.message}</div>`;
    } else {
      errEl.innerHTML = `<div class="success-msg">Reset link sent to ${email}</div>`;
    }
  },

  async handleSubmit() {
    const errEl = document.getElementById('auth-error');
    errEl.innerHTML = '';

    if (!AppConfig.isConnected()) {
      window.setDemoLoggedIn();
      window.location.hash = '#/dashboard';
      return;
    }

    const email    = document.getElementById('auth-email')?.value.trim();    const password = document.getElementById('auth-password')?.value;

    if (!email || !password) {
      errEl.innerHTML = '<div class="error-msg">Email and password are required.</div>';
      return;
    }

    if (this.mode === 'signup') {
      const firstName = document.getElementById('auth-firstname')?.value.trim();
      const lastName  = document.getElementById('auth-lastname')?.value.trim();
      const confirm   = document.getElementById('auth-confirm')?.value;
      const terms     = document.getElementById('auth-terms')?.checked;
      const budget    = document.getElementById('auth-budget')?.value;
      const phone     = document.getElementById('auth-phone')?.value.trim();

      if (!firstName || !lastName) {
        errEl.innerHTML = '<div class="error-msg">First and last name are required.</div>';
        return;
      }
      if (password !== confirm) {
        errEl.innerHTML = '<div class="error-msg">Passwords do not match.</div>';
        return;
      }
      if (password.length < 8) {
        errEl.innerHTML = '<div class="error-msg">Password must be at least 8 characters.</div>';
        return;
      }
      if (!terms) {
        errEl.innerHTML = '<div class="error-msg">Please accept the terms to continue.</div>';
        return;
      }

      this._setLoading(true);
      try {
        const { data, error } = await AppConfig.supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name:     firstName,
              last_name:      lastName,
              full_name:      firstName + ' ' + lastName,
              phone:          phone || null,
              monthly_budget: budget ? parseFloat(budget) : null,
            }
          }
        });
        if (error) throw error;

        // Insert into user_profiles if table exists
        if (data.user) {
          await AppConfig.supabase.from('user_profiles').upsert({
            id:             data.user.id,
            email:          email,
            first_name:     firstName,
            last_name:      lastName,
            phone:          phone || null,
            monthly_budget: budget ? parseFloat(budget) : null,
          }).select();
        }

        window.location.hash = '#/dashboard';
      } catch(e) {
        errEl.innerHTML = `<div class="error-msg">${e.message}</div>`;
        this._setLoading(false);
      }
      return;
    }

    // Login
    this._setLoading(true);
    try {
      const { data, error } = await AppConfig.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Admin email → go straight to analytics
      if (AppConfig.isAdmin(email)) {
        window.location.hash = '#/admin';
      } else {
        window.location.hash = '#/dashboard';
      }
    } catch(e) {
      errEl.innerHTML = `<div class="error-msg">${e.message}</div>`;
      this._setLoading(false);
    }
  },

  _setLoading(on) {
    const btn = document.getElementById('auth-submit');
    if (!btn) return;
    btn.disabled = on;
    btn.innerHTML = on
      ? '<i data-lucide="loader"></i> Please wait...'
      : `<i data-lucide="${this.mode === 'login' ? 'log-in' : 'user-plus'}"></i> ${this.mode === 'login' ? 'Sign In' : 'Create Account'}`;
    renderIcons();
  }
};
