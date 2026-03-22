// ── Dashboard Page ───────────────────────────────────────────
window.DashboardPage = {
  async render() {
    Navbar.render();
    const app = document.getElementById('app');

    app.innerHTML = `
      <div class="page">
        <div class="skeleton" style="width:220px;height:36px;margin-bottom:8px"></div>
        <div class="skeleton" style="width:300px;height:18px;margin-bottom:2rem"></div>
        <div class="grid-4" style="margin-bottom:2rem">
          ${[1,2,3,4].map(() => `<div class="skeleton" style="height:100px"></div>`).join('')}
        </div>
        <div class="grid-2">
          <div class="skeleton" style="height:260px"></div>
          <div class="skeleton" style="height:260px"></div>
        </div>
      </div>`;

    let expenses = [], user = null, profile = null;
    try {
      // Single session read — no network, no lock
      const session = AppConfig.getSessionSync();
      user = session?.user || null;

      console.log('[Dashboard] session user:', user?.email);

      if (!user) {
        window.location.hash = '#/auth';
        return;
      }

      // Race each fetch against a 10s timeout so we can see what hangs
      const withTimeout = (promise, label) => Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(label + ' timed out after 10s')), 10000))
      ]);

      console.log('[Dashboard] fetching expenses + profile...');
      [expenses, profile] = await Promise.all([
        withTimeout(DataAPI.getExpenses(), 'getExpenses'),
        withTimeout(DataAPI.getUserProfile(), 'getUserProfile'),
      ]);
      console.log('[Dashboard] got expenses:', expenses?.length, 'profile:', profile);
    } catch(e) {
      console.error('[Dashboard] fetch error:', e);
      app.innerHTML = `<div class="page"><div class="empty-state">
        <i data-lucide="wifi-off"></i>
        <p>Could not load data.</p>
        <small>${e.message}</small>
      </div></div>`;
      renderIcons(); return;
    }

    const cats        = DataAPI.byCategory(expenses);
    const total       = DataAPI.totalSpent(expenses);
    const topCat      = DataAPI.topCategory(expenses);
    const name        = profile?.nickname || profile?.first_name || user?.email?.split('@')[0] || 'there';
    const now         = new Date();
    const monthlyIncome = parseFloat(profile?.monthly_budget) || 0;

    // Daily avg: days since first expense
    const firstExpDate   = expenses.length ? new Date(expenses[expenses.length - 1].date) : now;
    const msPerDay       = 1000 * 60 * 60 * 24;
    const daysSinceFirst = Math.max(1, Math.round((now - firstExpDate) / msPerDay) + 1);
    const dailyAvg       = total / daysSinceFirst;

    // Survival prediction
    const remaining      = monthlyIncome > 0 ? Math.max(0, monthlyIncome - total) : null;
    const surviveDays    = (remaining !== null && dailyAvg > 0)
                           ? Math.floor(remaining / dailyAvg)
                           : null;
    const spentPct       = monthlyIncome > 0 ? Math.min(100, Math.round((total / monthlyIncome) * 100)) : null;

    const barColors = ['#c4d4e8','#c4e0cc','#e8d4b8','#e8c4d4','#d4c4e8','#c4dce8'];
    const maxVal    = Math.max(...Object.values(cats), 1);

    const bars = Object.entries(cats).sort((a,b) => b[1]-a[1]).map(([cat, amt], i) => {
      const pct = Math.round((amt / maxVal) * 100);
      return `
        <div class="bar-row animate-bar" style="--delay:${i * 80}ms">
          <div class="bar-label">${cat}</div>
          <div class="bar-track">
            <div class="bar-fill" data-width="${pct}" style="width:0%;background:${barColors[i % barColors.length]}">
              <span>${pct}%</span>
            </div>
          </div>
          <div class="bar-amount">₹${amt}</div>
        </div>`;
    }).join('');

    const recent = expenses.slice(0, 6).map((e, i) => `
      <div class="tx-row" style="animation-delay:${i * 60}ms">
        <div class="tx-dot" style="background:${barColors[i % barColors.length]}"></div>
        <div class="tx-info">
          <div class="tx-note">${e.note}</div>
          <div class="tx-meta">${e.category} · ${e.date}
            <span class="pay-badge">${e.payment_method || 'UPI'}</span>
          </div>
        </div>
        <div class="tx-amount">₹${Number(e.amount).toFixed(2)}</div>
      </div>`).join('');

    // ── Income vs Spend panel ────────────────────────────────
    const incomePanel = monthlyIncome > 0 ? this._incomePanel(
      monthlyIncome, total, remaining, surviveDays, spentPct, dailyAvg
    ) : `
      <div class="card" style="margin-bottom:1.5rem;background:#f0ede6;border-style:dashed">
        <div style="display:flex;align-items:center;gap:12px;opacity:0.5">
          <i data-lucide="wallet"></i>
          <span style="font-size:0.85rem;font-weight:600">
            Add your monthly income during signup to unlock survival predictions and budget insights.
          </span>
        </div>
      </div>`;

    app.innerHTML = `
      <div class="page page-enter">
        <div class="page-title">Hey ${name}</div>
        <div class="page-subtitle">Here's where your money went this month.</div>

        ${incomePanel}

        <div class="grid-4" style="margin-bottom:2rem">
          <div class="stat-box stat-animate" style="background:#e8d4b8;--i:0">
            <div class="stat-label"><i data-lucide="credit-card"></i> Total Spent</div>
            <div class="stat-value counter" data-target="${Math.round(total)}">₹0</div>
            <div class="stat-note">${now.toLocaleString('default',{month:'long'})} ${now.getFullYear()}</div>
          </div>
          <div class="stat-box stat-animate" style="background:#c4d4e8;--i:1">
            <div class="stat-label"><i data-lucide="trophy"></i> Top Category</div>
            <div class="stat-value">${topCat[0]}</div>
            <div class="stat-note">₹${topCat[1]} spent</div>
          </div>
          <div class="stat-box stat-animate" style="background:#c4e0cc;--i:2">
            <div class="stat-label"><i data-lucide="list"></i> Transactions</div>
            <div class="stat-value counter" data-target="${expenses.length}">0</div>
            <div class="stat-note">This month</div>
          </div>
          <div class="stat-box stat-animate" style="background:#e8c4d4;--i:3">
            <div class="stat-label"><i data-lucide="calendar"></i> Daily Avg</div>
            <div class="stat-value">₹${Math.round(dailyAvg)}</div>
            <div class="stat-note">Over ${daysSinceFirst} day${daysSinceFirst !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-heading"><i data-lucide="pie-chart"></i> Spending Breakdown
              <span style="font-size:0.65rem;opacity:0.4;font-weight:500;text-transform:none;letter-spacing:0">&nbsp;&#183; filter by payment</span>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem">
              <button class="cat-pill pay-filter active" data-pay="all" type="button">All</button>
              <button class="cat-pill pay-filter" data-pay="UPI" type="button"><i data-lucide="smartphone"></i> UPI</button>
              <button class="cat-pill pay-filter" data-pay="Cash" type="button"><i data-lucide="banknote"></i> Cash</button>
              <button class="cat-pill pay-filter" data-pay="Card" type="button"><i data-lucide="credit-card"></i> Card</button>
            </div>
            <div id="dash-breakdown">
              ${expenses.length
                ? `<div class="bar-chart">${bars}</div>`
                : `<div class="empty-state"><i data-lucide="bar-chart-2"></i><p>Add expenses to see breakdown</p></div>`}
            </div>
          </div>
          <div class="card">
            <div class="card-heading"><i data-lucide="clock"></i> Recent Transactions</div>
            <div id="dash-recent" class="tx-list">
              ${expenses.length ? recent : `
                <div class="empty-state" style="padding:2rem 0">
                  <i data-lucide="inbox"></i>
                  <p>No expenses yet. Add your first one.</p>
                </div>`}
            </div>
          </div>
        </div>

        <div style="margin-top:1.5rem;display:flex;gap:1rem;flex-wrap:wrap">
          <a href="#/stories" class="btn btn-dark"><i data-lucide="book-open"></i> See My Stories</a>
          <a href="#/trends"  class="btn btn-sand"><i data-lucide="trending-up"></i> View Trends</a>
        </div>
      </div>`;

    renderIcons();

    // Payment filter for breakdown + recent
    document.querySelectorAll('.pay-filter').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.pay-filter').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const pay = pill.dataset.pay;
        const filtered = pay === 'all' ? expenses : expenses.filter(e => (e.payment_method || 'UPI') === pay);
        this._renderBreakdown(filtered, barColors);
        this._renderRecent(filtered, barColors);
        renderIcons();
      });
    });

    requestAnimationFrame(() => {
      // Animate bars
      document.querySelectorAll('.bar-fill[data-width]').forEach(el => {
        setTimeout(() => { el.style.width = el.dataset.width + '%'; }, 100);
      });
      // Animate income progress bar
      const prog = document.getElementById('income-progress-fill');
      if (prog) setTimeout(() => { prog.style.width = prog.dataset.width + '%'; }, 200);
      // Count-up
      document.querySelectorAll('.counter').forEach(el => {
        const target = parseInt(el.dataset.target);
        const prefix = el.textContent.startsWith('₹') ? '₹' : '';
        let start = 0;
        const step = Math.max(1, Math.ceil(target / 40));
        const tick = setInterval(() => {
          start = Math.min(start + step, target);
          el.textContent = prefix + start;
          if (start >= target) clearInterval(tick);
        }, 20);
      });
    });
  },

  _renderBreakdown(expenses, barColors) {
    const el = document.getElementById('dash-breakdown');
    if (!el) return;
    if (!expenses.length) {
      el.innerHTML = `<div class="empty-state"><i data-lucide="bar-chart-2"></i><p>No expenses for this filter</p></div>`;
      return;
    }
    const cats   = DataAPI.byCategory(expenses);
    const maxVal = Math.max(...Object.values(cats), 1);
    el.innerHTML = `<div class="bar-chart">${
      Object.entries(cats).sort((a,b) => b[1]-a[1]).map(([cat, amt], i) => {
        const pct = Math.round((amt / maxVal) * 100);
        return `<div class="bar-row animate-bar" style="--delay:${i*80}ms">
          <div class="bar-label">${cat}</div>
          <div class="bar-track">
            <div class="bar-fill" data-width="${pct}" style="width:0%;background:${barColors[i%barColors.length]}">
              <span>${pct}%</span>
            </div>
          </div>
          <div class="bar-amount">&#8377;${amt}</div>
        </div>`;
      }).join('')
    }</div>`;
    requestAnimationFrame(() => {
      document.querySelectorAll('#dash-breakdown .bar-fill[data-width]').forEach(el => {
        setTimeout(() => { el.style.width = el.dataset.width + '%'; }, 60);
      });
    });
  },

  _renderRecent(expenses, barColors) {
    const el = document.getElementById('dash-recent');
    if (!el) return;
    const list = expenses.slice(0, 6);
    if (!list.length) {
      el.innerHTML = `<div class="empty-state" style="padding:2rem 0"><i data-lucide="inbox"></i><p>No transactions for this filter</p></div>`;
      return;
    }
    el.innerHTML = list.map((e, i) => `
      <div class="tx-row" style="animation-delay:${i*60}ms">
        <div class="tx-dot" style="background:${barColors[i%barColors.length]}"></div>
        <div class="tx-info">
          <div class="tx-note">${e.note}</div>
          <div class="tx-meta">${e.category} &middot; ${e.date}
            <span class="pay-badge">${e.payment_method || 'UPI'}</span>
          </div>
        </div>
        <div class="tx-amount">&#8377;${Number(e.amount).toFixed(2)}</div>
      </div>`).join('');
  },

  _incomePanel(income, spent, remaining, surviveDays, spentPct, dailyAvg) {
    // Colour the survive badge based on urgency
    const surviveColor = surviveDays === null ? '#c4d4e8'
      : surviveDays <= 3  ? '#e8c4c4'   // danger
      : surviveDays <= 7  ? '#e8d4b8'   // warning
      : '#c4e0cc';                       // safe

    const surviveIcon = surviveDays === null ? 'help-circle'
      : surviveDays <= 3  ? 'alert-triangle'
      : surviveDays <= 7  ? 'clock'
      : 'shield-check';

    const surviveText = surviveDays === null
      ? 'N/A'
      : surviveDays === 0
        ? 'Running out'
        : surviveDays + ' days';

    const surviveNote = surviveDays === null ? 'No income set'
      : surviveDays === 0 ? 'Spent beyond income'
      : 'at ₹' + Math.round(dailyAvg) + '/day burn rate';

    // Progress bar colour
    const barBg = spentPct >= 90 ? '#e8c4c4' : spentPct >= 70 ? '#e8d4b8' : '#c4e0cc';

    return `
      <div class="income-panel stat-animate" style="--i:0;margin-bottom:1.5rem">
        <div class="income-panel-top">
          <div class="income-panel-left">
            <div class="income-label"><i data-lucide="wallet"></i> Monthly Income</div>
            <div class="income-value">₹${income.toLocaleString('en-IN')}</div>
          </div>
          <div class="income-panel-right">
            <div class="income-label"><i data-lucide="trending-down"></i> Spent so far</div>
            <div class="income-value">₹${Math.round(spent).toLocaleString('en-IN')}</div>
          </div>
          <div class="income-panel-right">
            <div class="income-label"><i data-lucide="piggy-bank"></i> Remaining</div>
            <div class="income-value" style="color:${remaining <= 0 ? '#c0392b' : 'inherit'}">
              ₹${Math.round(remaining).toLocaleString('en-IN')}
            </div>
          </div>
          <div class="survive-badge" style="background:${surviveColor}">
            <i data-lucide="${surviveIcon}"></i>
            <div>
              <div class="survive-days">${surviveText}</div>
              <div class="survive-note">${surviveNote}</div>
            </div>
          </div>
        </div>
        <div class="income-bar-wrap">
          <div class="income-bar-track">
            <div class="income-bar-fill" id="income-progress-fill"
                 data-width="${spentPct}"
                 style="width:0%;background:${barBg}">
            </div>
          </div>
          <div class="income-bar-label">${spentPct}% of income spent</div>
        </div>
      </div>`;
  }
};
