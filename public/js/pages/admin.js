// ── Admin Page ───────────────────────────────────────────────
window.AdminPage = {

  async render() {
    document.body.classList.add('admin-body');
    Navbar.render();
    const app = document.getElementById('app');

    app.innerHTML = `<div class="page">
      ${[1,2,3,4].map(() => `<div class="skeleton" style="height:90px;margin-bottom:1rem"></div>`).join('')}
    </div>`;

    const user = AppConfig.getSessionSync()?.user;
    if (!user || !AppConfig.isAdmin(user.email)) {
      app.innerHTML = `
        <div class="page page-enter">
          <div class="empty-state" style="margin-top:6rem">
            <i data-lucide="shield-off"></i>
            <p>Access denied. Admins only.</p>
            <a href="#/dashboard" class="btn btn-dark" style="margin-top:1rem">
              <i data-lucide="arrow-left"></i> Back
            </a>
          </div>
        </div>`;
      renderIcons(); return;
    }

    // Get token for API calls
    const { data: { session } } = await AppConfig.supabase.auth.getSession();
    this._token = session?.access_token;

    let allExpenses = [], allUsers = [];
    try {
      allUsers = await this._fetchUsers();
      console.log('[Admin] users fetched:', allUsers.length);
    } catch(e) {
      console.error('[Admin] _fetchUsers error:', e);
    }
    try {
      allExpenses = await this._fetchAllExpenses();
      console.log('[Admin] expenses fetched:', allExpenses.length);
    } catch(e) {
      console.error('[Admin] expenses error:', e);
    }

    this._allUsers    = allUsers;
    this._allExpenses = allExpenses;
    this._token       = this._token;

    const totalTracked  = allExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const activeUserIds = new Set(allExpenses.map(e => e.user_id));
    const avgPerExpense = allExpenses.length ? (totalTracked / allExpenses.length) : 0;

    const expensesByDay = this._groupByDay(allExpenses, 'date', 14);
    const dayLabelArr   = this._dayLabelArray(14);
    const barColors     = ['#c4d4e8','#c4e0cc','#e8d4b8','#e8c4d4','#d4c4e8','#c4dce8','#e8e0c4'];

    app.innerHTML = `
      <div class="page page-enter">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.3rem;flex-wrap:wrap;gap:1rem">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="page-title">Admin</div>
            <span class="tag" style="background:#e8d4b8">Internal</span>
          </div>
          <div style="font-size:0.78rem;font-weight:600;opacity:0.5">
            <i data-lucide="shield-check"></i> ${user.email}
          </div>
        </div>
        <div class="page-subtitle">Platform-wide data. Handle with care.</div>

        <div class="grid-4" style="margin-bottom:2rem">
          <div class="stat-box stat-animate" style="background:#e8d4b8;--i:0">
            <div class="stat-label"><i data-lucide="users"></i> Total Users</div>
            <div class="stat-value">${allUsers.length}</div>
            <div class="stat-note">${activeUserIds.size} active</div>
          </div>
          <div class="stat-box stat-animate" style="background:#c4d4e8;--i:1">
            <div class="stat-label"><i data-lucide="receipt"></i> Total Expenses</div>
            <div class="stat-value">${allExpenses.length}</div>
            <div class="stat-note">₹${avgPerExpense.toFixed(0)} avg each</div>
          </div>
          <div class="stat-box stat-animate" style="background:#c4e0cc;--i:2">
            <div class="stat-label"><i data-lucide="indian-rupee"></i> Total Tracked</div>
            <div class="stat-value">₹${Math.round(totalTracked).toLocaleString()}</div>
            <div class="stat-note">across all users</div>
          </div>
          <div class="stat-box stat-animate" style="background:#e8c4d4;--i:3">
            <div class="stat-label"><i data-lucide="activity"></i> Expenses / 14d</div>
            <div class="stat-value">${expensesByDay.reduce((a,b)=>a+b,0)}</div>
            <div class="stat-note">recent activity</div>
          </div>
        </div>

        <div class="card" style="margin-bottom:2rem">
          <div class="card-heading"><i data-lucide="activity"></i> Expenses — Last 14 Days</div>
          <div class="sparkline-wrap">${this._sparkline(expensesByDay, '#c4e0cc', dayLabelArr)}</div>
          <div class="sparkline-labels">${this._dayLabels(14)}</div>
        </div>

        <!-- User Management -->
        <div class="card">
          <div class="card-heading" style="justify-content:space-between">
            <span><i data-lucide="users"></i> User Management</span>
          </div>
          <div id="admin-user-table">
            ${this._renderUserTable(allUsers, allExpenses, barColors)}
          </div>
        </div>
      </div>`;

    renderIcons();
    this._bindSparklineTooltips();
    this._bindUserActions();

    requestAnimationFrame(() => {
      document.querySelectorAll('.spark-bar').forEach((el, i) => {
        setTimeout(() => { el.style.height = el.dataset.targetH + 'px'; }, i * 20);
      });
    });
  },

  _renderUserTable(allUsers, allExpenses, barColors) {
    if (!allUsers.length) return `<div class="empty-state"><i data-lucide="users"></i><p>No users yet</p></div>`;
    const rows = allUsers.map(u => {
      const uExp   = allExpenses.filter(e => e.user_id === u.id);
      const uTotal = uExp.reduce((s, e) => s + Number(e.amount), 0);
      const last   = uExp.sort((a,b) => new Date(b.date)-new Date(a.date))[0];
      const isAdm  = u.user_metadata?.is_admin || false;
      const isSelf = u.email === 'premraviraj2004@gmail.com';
      return `
        <tr class="table-row" data-uid="${u.id}" data-email="${u.email}" data-is-admin="${isAdm}">
          <td>
            <div style="font-weight:700;font-size:0.85rem">${u.email || '—'}</div>
            <div style="font-size:0.7rem;opacity:0.4">Joined ${u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</div>
          </td>
          <td style="font-weight:800">₹${uTotal.toFixed(0)}</td>
          <td>${uExp.length}</td>
          <td style="font-size:0.78rem;opacity:0.6">${last ? last.date : '—'}</td>
          <td>
            ${isAdm
              ? `<span class="tag" style="background:#c4e0cc">Admin</span>`
              : `<span class="tag" style="opacity:0.4">User</span>`}
          </td>
          <td style="display:flex;gap:6px;flex-wrap:wrap;padding:8px 1.5rem">
            ${!isSelf ? `
              <button class="btn btn-sand btn-xs admin-toggle-role" data-uid="${u.id}" data-is-admin="${isAdm}">
                <i data-lucide="${isAdm ? 'shield-off' : 'shield-check'}"></i>
                ${isAdm ? 'Revoke' : 'Grant Admin'}
              </button>
              <button class="btn btn-xs admin-delete-user" data-uid="${u.id}" data-email="${u.email}" style="background:#e8c4c4;border-color:var(--ink)">
                <i data-lucide="trash-2"></i> Delete
              </button>
            ` : `<span style="font-size:0.72rem;opacity:0.35;padding:4px 0">You</span>`}
          </td>
        </tr>`;
    }).join('');

    return `<div class="table-wrap">
      <table class="admin-table">
        <thead><tr>
          <th>User</th><th>Spent</th><th>Expenses</th><th>Last Active</th><th>Role</th><th>Actions</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  },

  _bindUserActions() {
    // Grant / revoke admin
    document.querySelectorAll('.admin-toggle-role').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid     = btn.dataset.uid;
        const isAdmin = btn.dataset.isAdmin === 'true';
        btn.disabled  = true;
        btn.innerHTML = '<i data-lucide="loader"></i>';
        renderIcons();
        try {
          const res = await fetch(`/api/admin/users/${uid}/role`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this._token}` },
            body: JSON.stringify({ isAdmin: !isAdmin }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error);
          // Refresh
          this._allUsers = await this._fetchUsers();
          document.getElementById('admin-user-table').innerHTML =
            this._renderUserTable(this._allUsers, this._allExpenses, ['#c4d4e8','#c4e0cc','#e8d4b8','#e8c4d4','#d4c4e8','#c4dce8']);
          renderIcons();
          this._bindUserActions();
        } catch(e) {
          alert('Error: ' + e.message);
          btn.disabled = false;
        }
      });
    });

    // Delete user
    document.querySelectorAll('.admin-delete-user').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid   = btn.dataset.uid;
        const email = btn.dataset.email;
        if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader"></i>';
        renderIcons();
        try {
          const res = await fetch(`/api/admin/users/${uid}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this._token}` },
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error);
          this._allUsers = await this._fetchUsers();
          document.getElementById('admin-user-table').innerHTML =
            this._renderUserTable(this._allUsers, this._allExpenses, ['#c4d4e8','#c4e0cc','#e8d4b8','#e8c4d4','#d4c4e8','#c4dce8']);
          renderIcons();
          this._bindUserActions();
        } catch(e) {
          alert('Error: ' + e.message);
          btn.disabled = false;
        }
      });
    });
  },

  async _fetchUsers() {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${this._token}` }
      });
      if (!res.ok) { console.error('[Admin] users API:', res.status, await res.text()); return []; }
      return await res.json();
    } catch(e) { console.error('[Admin] _fetchUsers:', e); return []; }
  },

  async _fetchAllExpenses() {
    try {
      const res = await fetch('/api/admin/expenses', {
        headers: { 'Authorization': `Bearer ${this._token}` }
      });
      if (!res.ok) { console.error('[Admin] expenses API:', res.status, await res.text()); return []; }
      return await res.json();
    } catch(e) { console.error('[Admin] _fetchAllExpenses:', e); return []; }
  },

  _bindSparklineTooltips() {
    document.querySelectorAll('.spark-bar').forEach(bar => {
      bar.addEventListener('mouseenter', e => ChartTooltip.show(e, bar.dataset.label, bar.dataset.value));
      bar.addEventListener('mousemove',  e => ChartTooltip.move(e));
      bar.addEventListener('mouseleave', () => ChartTooltip.hide());
    });
  },

  _groupByDay(items, dateField, days) {
    const counts = {};
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      counts[d.toISOString().split('T')[0]] = 0;
    }
    items.forEach(item => {
      const day = (item[dateField] || '').toString().split('T')[0];
      if (counts[day] !== undefined) counts[day]++;
    });
    return Object.values(counts);
  },

  _sparkline(values, color, labels) {
    const max = Math.max(...values, 1);
    const h   = 60;
    return `<div class="sparkline">${values.map((v, i) => {
      const px  = Math.max(2, Math.round((v / max) * h));
      const lbl = labels?.[i] || `Day ${i+1}`;
      return `<div class="spark-bar"
        style="height:2px;background:${color};flex:1;border:1px solid rgba(26,26,46,0.15);transition:height 0.5s ease ${i*25}ms"
        data-target-h="${px}" data-label="${lbl}" data-value="${v}"></div>`;
    }).join('')}</div>`;
  },

  _dayLabelArray(days) {
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (days - 1 - i));
      return `${d.getDate()}/${d.getMonth()+1}`;
    });
  },

  _dayLabels(days) {
    return this._dayLabelArray(days).map(l => `<span>${l}</span>`).join('');
  }
};
