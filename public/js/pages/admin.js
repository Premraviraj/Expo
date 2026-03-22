// ── Admin Page — Full Analytics ──────────────────────────────
window.AdminPage = {

  async render() {
    Navbar.render();
    const app = document.getElementById('app');

    app.innerHTML = `<div class="page">
      ${[1,2,3,4].map(() => `<div class="skeleton" style="height:90px;margin-bottom:1rem"></div>`).join('')}
    </div>`;

    const user = await DataAPI.getCurrentUser();
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

    let allExpenses = [], allUsers = [];
    try {
      [allExpenses, allUsers] = await Promise.all([
        DataAPI.getAllExpensesAdmin(),
        DataAPI.getAllUsers(),
      ]);
    } catch(e) {
      // user_profiles may not exist yet — try expenses alone
      try { allExpenses = await DataAPI.getAllExpensesAdmin(); } catch(e2) {
        app.innerHTML = `<div class="page"><div class="empty-state">
          <i data-lucide="alert-triangle"></i>
          <p>${e2.message}</p>
          <small>Run the SQL in SUPABASE_SETUP.md Steps 3 &amp; 4 first.</small>
        </div></div>`;
        renderIcons(); return;
      }
      allUsers = [];
    }

    // Build user lookup map
    const userMap = {};
    allUsers.forEach(u => { userMap[u.id] = u; });

    // ── Computed metrics ─────────────────────────────────────
    const totalTracked   = allExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const activeUserIds  = new Set(allExpenses.map(e => e.user_id));

    // If user_profiles table is empty/missing, synthesize users from expense data
    const effectiveUsers = allUsers.length > 0
      ? allUsers
      : [...activeUserIds].map(id => ({ id, email: id.slice(0, 8) + '...', created_at: null }));

    // Also merge any expense user_ids not in user_profiles
    activeUserIds.forEach(id => {
      if (!userMap[id]) {
        const synth = { id, email: id.slice(0, 8) + '...', created_at: null };
        userMap[id] = synth;
        if (!effectiveUsers.find(u => u.id === id)) effectiveUsers.push(synth);
      }
    });

    const avgPerUser     = activeUserIds.size ? (totalTracked / activeUserIds.size) : 0;
    const avgPerExpense  = allExpenses.length ? (totalTracked / allExpenses.length) : 0;
    const cats           = DataAPI.byCategory(allExpenses);
    const [topCat]       = Object.entries(cats).length
                           ? Object.entries(cats).sort((a,b) => b[1]-a[1])
                           : [['—', 0]];

    // Active users = users with at least 1 expense
    const activeUsers    = effectiveUsers.filter(u => activeUserIds.has(u.id));

    // Signups per day (last 14 days)
    const signupsByDay   = this._groupByDay(effectiveUsers.filter(u => u.created_at), 'created_at', 14);

    // Expenses per day (last 14 days)
    const expensesByDay  = this._groupByDay(allExpenses, 'date', 14);

    // Category distribution bars
    const catMax         = Math.max(...Object.values(cats), 1);
    const barColors      = ['#c4d4e8','#c4e0cc','#e8d4b8','#e8c4d4','#d4c4e8','#c4dce8','#e8e0c4'];

    const catBars = Object.entries(cats).sort((a,b) => b[1]-a[1]).map(([cat, amt], i) => {
      const pct   = Math.round((amt / catMax) * 100);
      const count = allExpenses.filter(e => e.category === cat).length;
      return `
        <div class="bar-row animate-bar" style="--delay:${i * 60}ms"
             data-cat="${cat}" data-amt="${amt}" data-cnt="${count}">
          <div class="bar-label">${cat}</div>
          <div class="bar-track">
            <div class="bar-fill" data-width="${pct}" style="width:0%;background:${barColors[i % barColors.length]}">
              <span>${pct}%</span>
            </div>
          </div>
          <div class="bar-amount" style="width:90px;text-align:right">
            ₹${Math.round(amt)} <span style="opacity:0.4;font-size:0.7rem">(${count})</span>
          </div>
        </div>`;
    }).join('');

    // Signups sparkline
    const dayLabelArr = this._dayLabelArray(14);
    const signupSparkline  = this._sparkline(signupsByDay,  '#c4d4e8', dayLabelArr);
    const expenseSparkline = this._sparkline(expensesByDay, '#c4e0cc', dayLabelArr);

    // Per-user analytics table
    const userAnalytics = effectiveUsers.map(u => {
      const uExp    = allExpenses.filter(e => e.user_id === u.id);
      const uTotal  = uExp.reduce((s, e) => s + Number(e.amount), 0);
      const uCats   = DataAPI.byCategory(uExp);
      const [uTop]  = Object.entries(uCats).length
                      ? Object.entries(uCats).sort((a,b) => b[1]-a[1])
                      : [['—', 0]];
      const lastExp = uExp.sort((a,b) => new Date(b.date) - new Date(a.date))[0];
      return { u, uExp, uTotal, uTop, lastExp };
    }).sort((a,b) => b.uTotal - a.uTotal);

    const userRows = userAnalytics.map(({ u, uExp, uTotal, uTop, lastExp }) => `
      <tr class="table-row" data-uid="${u.id}">
        <td>
          <div style="font-weight:700;font-size:0.85rem">${u.email || '—'}</div>
          <div style="font-size:0.7rem;opacity:0.4">Joined ${u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</div>
        </td>
        <td style="font-weight:800">₹${uTotal.toFixed(2)}</td>
        <td>${uExp.length}</td>
        <td><span class="tag">${uTop[0]}</span></td>
        <td style="font-size:0.78rem;opacity:0.6">${lastExp ? lastExp.date : 'No activity'}</td>
        <td>
          <div class="user-mini-bar">
            ${Object.entries(DataAPI.byCategory(uExp)).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([c,a],i) => `
              <div class="mini-bar-seg" title="${c}: ₹${a}"
                style="flex:${a};background:${barColors[i]}"></div>
            `).join('')}
          </div>
        </td>
      </tr>`).join('');

    // Recent expenses feed
    const recentFeed = allExpenses.slice(0, 30).map((e, i) => {
      const email = userMap[e.user_id]?.email || e.user_id?.slice(0,8) + '...';
      return `
        <div class="tx-row" style="animation-delay:${i * 30}ms">
          <div class="tx-dot" style="background:${barColors[i % barColors.length]}"></div>
          <div class="tx-info">
            <div class="tx-note">${e.note}</div>
            <div class="tx-meta">${email} · <span class="tag" style="font-size:0.65rem">${e.category}</span> · ${e.date}</div>
          </div>
          <div class="tx-amount">₹${Number(e.amount).toFixed(2)}</div>
        </div>`;
    }).join('');

    app.innerHTML = `
      <div class="page page-enter">

        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.3rem;flex-wrap:wrap;gap:1rem">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="page-title">Admin Analytics</div>
            <span class="tag" style="background:#e8d4b8">Internal</span>
          </div>
          <div style="font-size:0.78rem;font-weight:600;opacity:0.5">
            <i data-lucide="shield-check" style="display:inline;width:13px;height:13px"></i>
            ${user.email}
          </div>
        </div>
        <div class="page-subtitle">Platform-wide data. Handle with care.</div>

        <!-- KPI row -->
        <div class="grid-4" style="margin-bottom:2rem">
          <div class="stat-box stat-animate" style="background:#e8d4b8;--i:0">
            <div class="stat-label"><i data-lucide="users"></i> Total Users</div>
            <div class="stat-value counter" data-target="${effectiveUsers.length}">0</div>
            <div class="stat-note">${activeUsers.length} active</div>
          </div>
          <div class="stat-box stat-animate" style="background:#c4d4e8;--i:1">
            <div class="stat-label"><i data-lucide="receipt"></i> Total Expenses</div>
            <div class="stat-value counter" data-target="${allExpenses.length}">0</div>
            <div class="stat-note">₹${avgPerExpense.toFixed(2)} avg each</div>
          </div>
          <div class="stat-box stat-animate" style="background:#c4e0cc;--i:2">
            <div class="stat-label"><i data-lucide="dollar-sign"></i> Total Tracked</div>
            <div class="stat-value">₹${Math.round(totalTracked).toLocaleString()}</div>
            <div class="stat-note">₹${avgPerUser.toFixed(0)} avg/user</div>
          </div>
          <div class="stat-box stat-animate" style="background:#e8c4d4;--i:3">
            <div class="stat-label"><i data-lucide="trophy"></i> Top Category</div>
            <div class="stat-value">${topCat[0]}</div>
            <div class="stat-note">₹${Number(topCat[1]).toFixed(0)} total</div>
          </div>
        </div>

        <!-- Sparklines row -->
        <div class="grid-2" style="margin-bottom:2rem">
          <div class="card">
            <div class="card-heading"><i data-lucide="user-plus"></i> New Signups — Last 14 Days</div>
            <div class="sparkline-wrap">${signupSparkline}</div>
            <div class="sparkline-labels">${this._dayLabels(14)}</div>
          </div>
          <div class="card">
            <div class="card-heading"><i data-lucide="activity"></i> Expenses Logged — Last 14 Days</div>
            <div class="sparkline-wrap">${expenseSparkline}</div>
            <div class="sparkline-labels">${this._dayLabels(14)}</div>
          </div>
        </div>

        <!-- Category breakdown -->
        <div class="card" style="margin-bottom:2rem">
          <div class="card-heading"><i data-lucide="pie-chart"></i> Category Distribution — All Users <span style="font-size:0.65rem;opacity:0.4;font-weight:500;text-transform:none;letter-spacing:0">· click a bar to filter feed</span></div>
          <div class="bar-chart">${catBars || '<div class="empty-state"><i data-lucide="inbox"></i><p>No data</p></div>'}</div>
        </div>

        <!-- User analytics table -->
        <div class="card" style="margin-bottom:2rem">
          <div class="card-heading"><i data-lucide="users"></i> User Analytics</div>
          <div class="table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Total Spent</th>
                  <th>Expenses</th>
                  <th>Top Category</th>
                  <th>Last Active</th>
                  <th>Spend Mix</th>
                </tr>
              </thead>
              <tbody>
                ${userRows || '<tr><td colspan="6" style="text-align:center;opacity:0.4;padding:2rem">No users yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent activity feed -->
        <div class="card">
          <div class="card-heading"><i data-lucide="zap"></i> Live Feed — Last 30 Expenses</div>
          <div class="tx-list" id="admin-feed">${recentFeed || '<div class="empty-state"><i data-lucide="inbox"></i><p>No expenses yet</p></div>'}</div>
        </div>

      </div>`;

    renderIcons();
    this._bindInteractions(allExpenses, cats, barColors);

    // Animate bars + counters
    requestAnimationFrame(() => {
      document.querySelectorAll('.bar-fill[data-width]').forEach(el => {
        setTimeout(() => { el.style.width = el.dataset.width + '%'; }, 150);
      });
      document.querySelectorAll('.counter').forEach(el => {
        const target = parseInt(el.dataset.target);
        let cur = 0;
        const step = Math.max(1, Math.ceil(target / 40));
        const tick = setInterval(() => {
          cur = Math.min(cur + step, target);
          el.textContent = cur;
          if (cur >= target) clearInterval(tick);
        }, 20);
      });
    });
  },

  // ── Helpers ───────────────────────────────────────────────

  _groupByDay(items, dateField, days) {
    const counts = {};
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      counts[d.toISOString().split('T')[0]] = 0;
    }
    items.forEach(item => {
      const raw = item[dateField];
      if (!raw) return;
      const day = raw.toString().split('T')[0];
      if (counts[day] !== undefined) counts[day]++;
    });
    return Object.values(counts);
  },

  _sparkline(values, color, labels) {
    const max  = Math.max(...values, 1);
    const h    = 60;
    const bars = values.map((v, i) => {
      const pct = Math.max(2, Math.round((v / max) * h));
      const lbl = labels ? labels[i] : `Day ${i + 1}`;
      return `<div class="spark-bar"
        style="height:${pct}px;background:${color};flex:1;border:1px solid rgba(26,26,46,0.15);transition:height 0.5s ease ${i*30}ms"
        data-label="${lbl}" data-value="${v}"></div>`;
    }).join('');
    return `<div class="sparkline" id="sparkline-${color.replace('#','')}">${bars}</div>`;
  },

  _bindInteractions(allExpenses, cats, barColors) {
    // ── Sparkline tooltips ──────────────────────────────────
    document.querySelectorAll('.spark-bar').forEach(bar => {
      bar.addEventListener('mouseenter', e => {
        const label = bar.dataset.label || '';
        const val   = bar.dataset.value || '0';
        ChartTooltip.show(e, label, val);
      });
      bar.addEventListener('mousemove', e => ChartTooltip.move(e));
      bar.addEventListener('mouseleave', () => ChartTooltip.hide());
    });

    // ── Category bar tooltips + click filter ────────────────
    let activeFilter = null;
    const feed = document.querySelector('#admin-feed');

    document.querySelectorAll('.bar-row[data-cat]').forEach(row => {
      const cat = row.dataset.cat;
      const amt = row.dataset.amt;
      const cnt = row.dataset.cnt;

      row.addEventListener('mouseenter', e => {
        ChartTooltip.show(e, cat, `₹${Number(amt).toFixed(2)} · ${cnt} expenses`);
      });
      row.addEventListener('mousemove', e => ChartTooltip.move(e));
      row.addEventListener('mouseleave', () => ChartTooltip.hide());

      row.addEventListener('click', () => {
        if (activeFilter === cat) {
          // clear filter
          activeFilter = null;
          document.querySelectorAll('.bar-row[data-cat]').forEach(r => {
            r.classList.remove('selected', 'dimmed');
          });
          this._renderFeed(allExpenses, null, barColors, feed);
        } else {
          activeFilter = cat;
          document.querySelectorAll('.bar-row[data-cat]').forEach(r => {
            r.classList.toggle('selected', r.dataset.cat === cat);
            r.classList.toggle('dimmed',   r.dataset.cat !== cat);
          });
          this._renderFeed(allExpenses, cat, barColors, feed);
        }
      });
    });
  },

  _renderFeed(allExpenses, filterCat, barColors, feedEl) {
    if (!feedEl) return;
    const filtered = filterCat
      ? allExpenses.filter(e => e.category === filterCat)
      : allExpenses;
    const shown = filtered.slice(0, 30);
    if (!shown.length) {
      feedEl.innerHTML = `<div class="empty-state"><i data-lucide="inbox"></i><p>No expenses in this category</p></div>`;
      renderIcons(); return;
    }
    feedEl.innerHTML = shown.map((e, i) => `
      <div class="tx-row" style="animation-delay:${i * 20}ms">
        <div class="tx-dot" style="background:${barColors[i % barColors.length]}"></div>
        <div class="tx-info">
          <div class="tx-note">${e.note}</div>
          <div class="tx-meta"><span class="tag" style="font-size:0.65rem">${e.category}</span> · ${e.date}</div>
        </div>
        <div class="tx-amount">₹${Number(e.amount).toFixed(2)}</div>
      </div>`).join('');
    renderIcons();
  },

  _dayLabelArray(days) {
    const labels = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(`${d.getDate()}/${d.getMonth()+1}`);
    }
    return labels;
  },

  _dayLabels(days) {
    return this._dayLabelArray(days).map(l => `<span>${l}</span>`).join('');
  }
};
