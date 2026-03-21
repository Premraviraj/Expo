// ── Dashboard Page ───────────────────────────────────────────
window.DashboardPage = {
  async render() {
    Navbar.render();
    const app = document.getElementById('app');
    app.innerHTML = `<div class="page"><p style="font-weight:700">Loading your story...</p></div>`;

    const expenses = await DataAPI.getExpenses();
    const user     = await DataAPI.getCurrentUser();
    const cats     = DummyData.byCategory();
    const total    = DummyData.totalSpent();
    const [topCat] = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const name     = user?.name || user?.email?.split('@')[0] || 'You';

    const maxVal = Math.max(...Object.values(cats));
    const barColors = ['#FF3CAC','#3D5AFE','#FF6D00','#00E676','#FFE500','#FF1744'];
    const bars = Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt], i) => {
        const pct = Math.round((amt / maxVal) * 100);
        return `
          <div class="bar-row">
            <div class="bar-label">${cat}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${pct}%; background:${barColors[i % barColors.length]}">
                <span>${pct}%</span>
              </div>
            </div>
            <div class="bar-amount">$${amt}</div>
          </div>
        `;
      }).join('');

    const recent = [...expenses].slice(0, 5).map(e => `
      <div style="display:flex;justify-content:space-between;align-items:center;
                  padding:12px 0;border-bottom:2px solid #0a0a0a20;">
        <div>
          <div style="font-weight:700">${e.note}</div>
          <div style="font-size:0.78rem;font-weight:600;opacity:0.6">${e.category} · ${e.date}</div>
        </div>
        <div style="font-size:1.1rem;font-weight:800">$${e.amount}</div>
      </div>
    `).join('');

    app.innerHTML = `
      <div class="page">
        <div class="page-title">Hey ${name}</div>
        <div class="page-subtitle">Here's where your money actually went this month.</div>

        <div class="grid-4" style="margin-bottom:2rem">
          <div class="stat-box" style="background:#FF3CAC;color:#fff">
            <div class="stat-label" style="display:flex;align-items:center;gap:6px">
              <i data-lucide="credit-card"></i> Total Spent
            </div>
            <div class="stat-value">$${total}</div>
            <div class="stat-note">March 2026</div>
          </div>
          <div class="stat-box" style="background:#3D5AFE;color:#fff">
            <div class="stat-label" style="display:flex;align-items:center;gap:6px">
              <i data-lucide="trophy"></i> Top Category
            </div>
            <div class="stat-value">${topCat[0]}</div>
            <div class="stat-note">$${topCat[1]} spent</div>
          </div>
          <div class="stat-box" style="background:#00E676;color:#0a0a0a">
            <div class="stat-label" style="display:flex;align-items:center;gap:6px">
              <i data-lucide="list"></i> Transactions
            </div>
            <div class="stat-value">${expenses.length}</div>
            <div class="stat-note">This month</div>
          </div>
          <div class="stat-box" style="background:#FF6D00;color:#fff">
            <div class="stat-label" style="display:flex;align-items:center;gap:6px">
              <i data-lucide="calendar"></i> Daily Avg
            </div>
            <div class="stat-value">$${Math.round(total / 21)}</div>
            <div class="stat-note">Per day</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div style="font-size:1rem;font-weight:800;text-transform:uppercase;
                        letter-spacing:0.5px;margin-bottom:1.2rem;display:flex;align-items:center;gap:8px">
              <i data-lucide="pie-chart"></i> Spending Breakdown
            </div>
            <div class="bar-chart">${bars}</div>
          </div>

          <div class="card">
            <div style="font-size:1rem;font-weight:800;text-transform:uppercase;
                        letter-spacing:0.5px;margin-bottom:1rem;display:flex;align-items:center;gap:8px">
              <i data-lucide="clock"></i> Recent Transactions
            </div>
            ${recent}
          </div>
        </div>

        <div style="margin-top:1.5rem;display:flex;gap:1rem">
          <a href="#/stories" class="btn btn-black">
            <i data-lucide="book-open"></i> See My Stories
          </a>
          <a href="#/trends" class="btn btn-pink">
            <i data-lucide="trending-up"></i> View Trends
          </a>
        </div>
      </div>
    `;

    renderIcons();
  }
};
