// ── Stories Page ─────────────────────────────────────────────
window.StoriesPage = {
  render() {
    Navbar.render();
    const app = document.getElementById('app');
    const stories = DummyData.stories();
    const cards = stories.map(s => StoryCard.render(s)).join('');

    const [top] = Object.entries(DummyData.byCategory()).sort((a, b) => b[1] - a[1]);
    const total = DummyData.totalSpent();

    app.innerHTML = `
      <div class="page">
        <div class="page-title">Your Spending Stories</div>
        <div class="page-subtitle">The unfiltered truth about March 2026.</div>

        <div class="insight-banner" style="background:#FF1744;color:#fff;margin-bottom:2rem;font-size:1.1rem">
          <span class="insight-icon"><i data-lucide="skull"></i></span>
          <span>You spent <strong>$${top[1]}</strong> on ${top[0]} — that's
            ${Math.round((top[1]/total)*100)}% of everything. We're not judging. (We are.)</span>
        </div>

        <div class="grid-3" style="margin-bottom:2rem">
          ${cards}
        </div>

        <div class="card">
          <div style="font-size:1rem;font-weight:800;text-transform:uppercase;
                      letter-spacing:0.5px;margin-bottom:1.2rem;display:flex;align-items:center;gap:8px">
            <i data-lucide="calendar-days"></i> Full Timeline
          </div>
          ${DummyData.expenses.map(e => `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;
                        padding:14px 0;border-bottom:2px solid #0a0a0a15;">
              <div style="display:flex;gap:1rem;align-items:flex-start">
                <div style="background:#0a0a0a;color:#FFE500;padding:4px 10px;
                            font-size:0.72rem;font-weight:800;white-space:nowrap">
                  ${e.date}
                </div>
                <div>
                  <div style="font-weight:700">${e.note}</div>
                  <span class="tag" style="margin-top:4px">${e.category}</span>
                </div>
              </div>
              <div style="font-size:1.1rem;font-weight:800;white-space:nowrap;margin-left:1rem">
                $${e.amount}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    renderIcons();
  }
};
