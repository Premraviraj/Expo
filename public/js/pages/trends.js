// ── Trends Page ──────────────────────────────────────────────
window.TrendsPage = {
  render() {
    Navbar.render();
    const app = document.getElementById('app');

    const cats     = DummyData.byCategory();
    const total    = DummyData.totalSpent();
    const insights = DummyData.insights();

    const weeks = [
      { label: 'Week 1', amount: 890 },
      { label: 'Week 2', amount: 1240 },
      { label: 'Week 3', amount: 760 },
      { label: 'Week 4', amount: 250 },
    ];
    const maxWeek = Math.max(...weeks.map(w => w.amount));
    const weekColors = ['#FF3CAC','#3D5AFE','#FF6D00','#00E676'];

    const weekBars = weeks.map((w, i) => {
      const pct = Math.round((w.amount / maxWeek) * 100);
      return `
        <div class="bar-row">
          <div class="bar-label">${w.label}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%;background:${weekColors[i]}">
              <span>$${w.amount}</span>
            </div>
          </div>
          <div class="bar-amount">$${w.amount}</div>
        </div>
      `;
    }).join('');

    const catBreakdown = Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => {
        const pct = Math.round((amt / total) * 100);
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;
                      padding:10px 0;border-bottom:2px solid #0a0a0a15;">
            <div style="font-weight:700">${cat}</div>
            <div style="display:flex;align-items:center;gap:1rem">
              <div style="font-size:0.85rem;font-weight:700;opacity:0.6">${pct}% of total</div>
              <div style="font-weight:800">$${amt}</div>
            </div>
          </div>
        `;
      }).join('');

    const insightBanners = insights.map(ins => `
      <div class="insight-banner" style="background:#0a0a0a;color:#FFE500">
        <span class="insight-icon"><i data-lucide="${ins.icon}"></i></span>
        <span>${ins.text}</span>
      </div>
    `).join('');

    app.innerHTML = `
      <div class="page">
        <div class="page-title">Trends &amp; Insights</div>
        <div class="page-subtitle">Patterns don't lie. Your wallet doesn't either.</div>

        <div style="margin-bottom:2rem">${insightBanners}</div>

        <div class="grid-2">
          <div class="card">
            <div style="font-size:1rem;font-weight:800;text-transform:uppercase;
                        letter-spacing:0.5px;margin-bottom:1.2rem;display:flex;align-items:center;gap:8px">
              <i data-lucide="bar-chart-2"></i> Weekly Spending
            </div>
            <div class="bar-chart">${weekBars}</div>
          </div>

          <div class="card">
            <div style="font-size:1rem;font-weight:800;text-transform:uppercase;
                        letter-spacing:0.5px;margin-bottom:0.5rem;display:flex;align-items:center;gap:8px">
              <i data-lucide="pie-chart"></i> Category Breakdown
            </div>
            <div style="font-size:0.8rem;font-weight:600;opacity:0.5;margin-bottom:1rem">
              Total: $${total}
            </div>
            ${catBreakdown}
          </div>
        </div>

        <div class="grid-3" style="margin-top:1.5rem">
          <div class="card card-pink">
            <div style="display:flex;align-items:center;gap:8px;font-size:0.75rem;
                        font-weight:800;text-transform:uppercase;letter-spacing:1px;opacity:0.85">
              <i data-lucide="zap"></i> Biggest Single Day
            </div>
            <div style="font-size:2rem;font-weight:800;margin-top:6px">$540</div>
            <div style="font-size:0.85rem;font-weight:600;margin-top:4px;opacity:0.85">
              Mar 12 — Shopping spree
            </div>
          </div>
          <div class="card card-blue">
            <div style="display:flex;align-items:center;gap:8px;font-size:0.75rem;
                        font-weight:800;text-transform:uppercase;letter-spacing:1px;opacity:0.85">
              <i data-lucide="repeat"></i> Most Frequent
            </div>
            <div style="font-size:2rem;font-weight:800;margin-top:6px">Food</div>
            <div style="font-size:0.85rem;font-weight:600;margin-top:4px;opacity:0.85">
              3 entries this month
            </div>
          </div>
          <div class="card card-green">
            <div style="display:flex;align-items:center;gap:8px;font-size:0.75rem;
                        font-weight:800;text-transform:uppercase;letter-spacing:1px">
              <i data-lucide="piggy-bank"></i> Potential Savings
            </div>
            <div style="font-size:2rem;font-weight:800;margin-top:6px">$312</div>
            <div style="font-size:0.85rem;font-weight:600;margin-top:4px;opacity:0.7">
              If you cut impulse buys 30%
            </div>
          </div>
        </div>
      </div>
    `;

    renderIcons();
  }
};
