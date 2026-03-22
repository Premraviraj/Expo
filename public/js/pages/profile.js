// ── Profile Page ─────────────────────────────────────────────
window.ProfilePage = {

  async render() {
    Navbar.render();
    const app = document.getElementById('app');

    app.innerHTML = `
      <div class="page">
        ${[1,2,3].map(() => `<div class="skeleton" style="height:120px;margin-bottom:1rem"></div>`).join('')}
      </div>`;

    let user = null, profile = null;
    try {
      [user, profile] = await Promise.all([
        DataAPI.getCurrentUser(),
        DataAPI.getUserProfile(),
      ]);
    } catch(e) {
      app.innerHTML = `<div class="page"><div class="empty-state">
        <i data-lucide="wifi-off"></i><p>${e.message}</p></div></div>`;
      renderIcons(); return;
    }

    if (!user) {
      window.location.hash = '#/auth';
      return;
    }

    const nickname     = profile?.nickname     || '';
    const monthlyIncome = profile?.monthly_budget || '';
    const firstName    = profile?.first_name   || user.user_metadata?.first_name || '';
    const lastName     = profile?.last_name    || user.user_metadata?.last_name  || '';

    app.innerHTML = `
      <div class="page page-enter">
        <div class="page-title">Profile</div>
        <div class="page-subtitle">Manage your account settings.</div>

        <!-- Avatar + identity -->
        <div class="profile-hero stat-animate" style="--i:0">
          <div class="profile-avatar">${this._initials(nickname || firstName || user.email)}</div>
          <div>
            <div class="profile-name">${nickname || firstName + (lastName ? ' ' + lastName : '') || 'No name set'}</div>
            <div class="profile-email"><i data-lucide="mail"></i> ${user.email}</div>
          </div>
        </div>

        <div class="profile-grid">

          <!-- Identity card -->
          <div class="card stat-animate" style="--i:1">
            <div class="card-heading"><i data-lucide="user"></i> Identity</div>
            <div id="identity-msg"></div>

            <div class="form-row">
              <div class="form-group">
                <label>First Name</label>
                <input type="text" id="p-firstname" value="${firstName}" placeholder="Alex" />
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input type="text" id="p-lastname" value="${lastName}" placeholder="Johnson" />
              </div>
            </div>
            <div class="form-group">
              <label>Nickname <span class="form-optional">shown on dashboard</span></label>
              <input type="text" id="p-nickname" value="${nickname}" placeholder="e.g. Prem, Moneybreaker 💀" maxlength="30" />
            </div>

            <button class="btn btn-dark" id="save-identity-btn">
              <i data-lucide="save"></i> Save
            </button>
          </div>

          <!-- Income card -->
          <div class="card stat-animate" style="--i:2">
            <div class="card-heading"><i data-lucide="wallet"></i> Monthly Income</div>
            <div id="income-msg"></div>
            <p style="font-size:0.82rem;font-weight:500;opacity:0.55;margin-bottom:1.2rem;line-height:1.5">
              Used to calculate survival days and budget insights on your dashboard.
            </p>
            <div class="form-group">
              <label>Monthly Income</label>
              <div class="budget-input-wrap">
                <span class="budget-prefix">₹</span>
                <input type="number" id="p-income" value="${monthlyIncome}" placeholder="50000" min="0" />
              </div>
            </div>
            <button class="btn btn-dark" id="save-income-btn">
              <i data-lucide="save"></i> Save
            </button>
          </div>

          <!-- Password card -->
          <div class="card stat-animate" style="--i:3">
            <div class="card-heading"><i data-lucide="lock"></i> Change Password</div>
            <div id="pwd-msg"></div>
            <div class="form-group" style="position:relative">
              <label>New Password</label>
              <input type="password" id="p-newpwd" placeholder="Min. 8 characters" autocomplete="new-password" />
              <button type="button" class="pwd-toggle" id="p-pwd-toggle" tabindex="-1">
                <i data-lucide="eye"></i>
              </button>
            </div>
            <div class="form-group">
              <label>Confirm New Password</label>
              <input type="password" id="p-confirmpwd" placeholder="••••••••" autocomplete="new-password" />
            </div>
            <button class="btn btn-dark" id="save-pwd-btn">
              <i data-lucide="key"></i> Update Password
            </button>
          </div>

        </div>

        <!-- Danger zone -->
        <div class="card" style="margin-top:0.5rem;border-color:rgba(192,57,43,0.3)">
          <div class="card-heading" style="color:#c0392b"><i data-lucide="alert-triangle"></i> Danger Zone</div>
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem">
            <div>
              <div style="font-size:0.85rem;font-weight:700">Sign out everywhere</div>
              <div style="font-size:0.75rem;opacity:0.5;margin-top:2px">Logs you out of all sessions.</div>
            </div>
            <button class="btn" style="border-color:#c0392b;color:#c0392b" id="signout-btn">
              <i data-lucide="log-out"></i> Sign Out
            </button>
          </div>
        </div>

      </div>`;

    renderIcons();
    this._bindEvents(user);
  },

  _initials(str) {
    if (!str) return '?';
    const parts = str.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : str.slice(0, 2).toUpperCase();
  },

  _bindEvents(user) {
    // Identity save
    document.getElementById('save-identity-btn').addEventListener('click', async () => {
      const btn      = document.getElementById('save-identity-btn');
      const msgEl    = document.getElementById('identity-msg');
      const firstName = document.getElementById('p-firstname').value.trim();
      const lastName  = document.getElementById('p-lastname').value.trim();
      const nickname  = document.getElementById('p-nickname').value.trim();

      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="loader"></i> Saving...';
      renderIcons();
      msgEl.innerHTML = '';

      try {
        await DataAPI.updateProfile({ first_name: firstName, last_name: lastName, nickname });
        msgEl.innerHTML = '<div class="success-msg">Saved.</div>';
        // Update avatar initials live
        const av = document.querySelector('.profile-avatar');
        const nm = document.querySelector('.profile-name');
        if (av) av.textContent = this._initials(nickname || firstName || user.email);
        if (nm) nm.textContent = nickname || (firstName + (lastName ? ' ' + lastName : '')) || 'No name set';
      } catch(e) {
        msgEl.innerHTML = `<div class="error-msg">${e.message}</div>`;
      }

      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="save"></i> Save';
      renderIcons();
    });

    // Income save
    document.getElementById('save-income-btn').addEventListener('click', async () => {
      const btn    = document.getElementById('save-income-btn');
      const msgEl  = document.getElementById('income-msg');
      const income = parseFloat(document.getElementById('p-income').value) || 0;

      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="loader"></i> Saving...';
      renderIcons();
      msgEl.innerHTML = '';

      try {
        await DataAPI.updateProfile({ monthly_budget: income });
        msgEl.innerHTML = '<div class="success-msg">Income updated. Dashboard will reflect this.</div>';
      } catch(e) {
        msgEl.innerHTML = `<div class="error-msg">${e.message}</div>`;
      }

      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="save"></i> Save';
      renderIcons();
    });

    // Password toggle visibility
    document.getElementById('p-pwd-toggle').addEventListener('click', () => {
      const input = document.getElementById('p-newpwd');
      const icon  = document.querySelector('#p-pwd-toggle i');
      input.type  = input.type === 'password' ? 'text' : 'password';
      icon.setAttribute('data-lucide', input.type === 'password' ? 'eye' : 'eye-off');
      renderIcons();
    });

    // Password save
    document.getElementById('save-pwd-btn').addEventListener('click', async () => {
      const btn     = document.getElementById('save-pwd-btn');
      const msgEl   = document.getElementById('pwd-msg');
      const newPwd  = document.getElementById('p-newpwd').value;
      const confirm = document.getElementById('p-confirmpwd').value;

      msgEl.innerHTML = '';

      if (!newPwd || newPwd.length < 8) {
        msgEl.innerHTML = '<div class="error-msg">Password must be at least 8 characters.</div>';
        return;
      }
      if (newPwd !== confirm) {
        msgEl.innerHTML = '<div class="error-msg">Passwords do not match.</div>';
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="loader"></i> Updating...';
      renderIcons();

      try {
        if (!AppConfig.isConnected()) throw new Error('Supabase not connected.');
        const { error } = await AppConfig.supabase.auth.updateUser({ password: newPwd });
        if (error) throw error;
        msgEl.innerHTML = '<div class="success-msg">Password updated successfully.</div>';
        document.getElementById('p-newpwd').value    = '';
        document.getElementById('p-confirmpwd').value = '';
      } catch(e) {
        msgEl.innerHTML = `<div class="error-msg">${e.message}</div>`;
      }

      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="key"></i> Update Password';
      renderIcons();
    });

    // Sign out
    document.getElementById('signout-btn').addEventListener('click', async () => {
      if (AppConfig.isConnected()) await AppConfig.supabase.auth.signOut();
      window.demoLoggedIn = false;
      window.location.hash = '#/auth';
    });
  }
};
