// ── Stories Page ─────────────────────────────────────────────
window.StoriesPage = {
  async render() {
    Navbar.render();
    const app = document.getElementById('app');

    app.innerHTML = `<div class="page">${[1,2,3].map(() =>
      `<div class="skeleton" style="height:160px;margin-bottom:1rem"></div>`).join('')}</div>`;

    let expenses = [], profile = null;
    try {
      [expenses, profile] = await Promise.all([DataAPI.getExpenses(), DataAPI.getUserProfile()]);
    } catch(e) {
      app.innerHTML = `<div class="page"><div class="empty-state">
        <i data-lucide="wifi-off"></i><p>${e.message}</p></div></div>`;
      renderIcons(); return;
    }

    if (!expenses.length) {
      app.innerHTML = `
        <div class="page page-enter">
          <div class="page-title">Your Spending Stories</div>
          <div class="page-subtitle">Nothing to tell yet.</div>
          <div class="empty-state" style="margin-top:4rem">
            <i data-lucide="book-open"></i>
            <p>Add some expenses and your story will appear here.</p>
            <button class="btn btn-dark" onclick="ExpenseDrawer.open()">
              <i data-lucide="plus"></i> Add First Expense
            </button>
          </div>
        </div>`;
      renderIcons(); return;
    }

    const monthlyIncome = parseFloat(profile?.monthly_budget) || 0;
    const stories       = InsightsEngine.stories(expenses, monthlyIncome);
    const catStats      = InsightsEngine.categoryStats(expenses);
    const total         = InsightsEngine.totalSpent(expenses);
    const top           = catStats[0];

    const cards = stories.map((s, i) =>
      `<div style="animation-delay:${i * 80}ms" class="story-card-wrap">${StoryCard.render(s)}</div>`
    ).join('');

    app.innerHTML = `
      <div class="page page-enter">
        <div class="page-title">Your Spending Stories</div>
        <div class="page-subtitle">The unfiltered truth.</div>

        <div class="insight-banner" style="background:#e8d4b8;margin-bottom:2rem">
          <span class="insight-icon"><i data-lucide="skull"></i></span>
          <span>You spent <strong>&#8377;${top.total.toFixed(0)}</strong> on ${top.category} —
            ${top.pct}% of everything. We're not judging. (We are.)</span>
        </div>

        <div class="grid-3" style="margin-bottom:2rem">${cards}</div>

        <div class="card">
          <div class="card-heading"><i data-lucide="calendar-days"></i> Full Timeline</div>
          ${expenses.map((e, i) => `
            <div class="tx-row timeline-row" style="animation-delay:${i * 40}ms">
              <div class="timeline-date">${e.date}</div>
              <div class="tx-info">
                <div class="tx-note">${e.note}</div>
                <span class="tag">${e.category}</span>
              </div>
              <div class="tx-amount">&#8377;${Number(e.amount).toFixed(2)}</div>
            </div>`).join('')}
        </div>
      </div>`;

    renderIcons();
  }
};
