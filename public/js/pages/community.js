// ── Community Page ───────────────────────────────────────────
window.CommunityPage = {
  _view: 'list',   // 'list' | 'detail'
  _activeId: null,

  async render(communityId) {
    Navbar.render();
    if (communityId) {
      this._view = 'detail';
      this._activeId = communityId;
      return this._renderDetail(communityId);
    }
    this._view = 'list';
    this._activeId = null;
    return this._renderList();
  },

  // ── List view ──────────────────────────────────────────────
  async _renderList() {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="page">${[1,2].map(() =>
      `<div class="skeleton" style="height:120px;margin-bottom:1rem"></div>`).join('')}</div>`;

    let communities = [];
    try {
      communities = await CommunityAPI.getMyCommunities();
    } catch(e) {
      app.innerHTML = `<div class="page"><div class="empty-state">
        <i data-lucide="wifi-off"></i><p>${e.message}</p></div></div>`;
      renderIcons(); return;
    }

    const cards = communities.map((c, i) => {
      const progress = c.budget > 0 ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : 0;
      const barBg    = progress >= 90 ? '#e8c4c4' : progress >= 70 ? '#e8d4b8' : '#c4e0cc';
      return `
        <div class="community-card stat-animate" style="--i:${i}" data-id="${c.id}">
          <div class="community-card-top">
            <div>
              <div class="community-name">${c.name}</div>
              <div class="community-meta">
                <i data-lucide="users"></i> ${c.member_count} member${c.member_count !== 1 ? 's' : ''}
                &nbsp;&middot;&nbsp;
                <i data-lucide="calendar"></i> ${c.event_date || 'No date set'}
              </div>
            </div>
            <div class="community-budget-badge">
              <div class="community-budget-label">Budget</div>
              <div class="community-budget-val">&#8377;${Number(c.budget||0).toLocaleString()}</div>
            </div>
          </div>
          <div class="community-progress-wrap">
            <div class="community-progress-track">
              <div class="community-progress-fill" style="width:${progress}%;background:${barBg}"></div>
            </div>
            <span class="community-progress-label">&#8377;${Number(c.spent||0).toLocaleString()} spent &middot; ${progress}%</span>
          </div>
          <div class="community-card-footer">
            <span class="tag">${c.role === 'admin' ? 'Organiser' : 'Member'}</span>
            <button class="btn btn-dark community-open-btn" data-id="${c.id}" style="padding:5px 14px;font-size:0.75rem">
              <i data-lucide="arrow-right"></i> Open
            </button>
          </div>
        </div>`;
    }).join('');

    app.innerHTML = `
      <div class="page page-enter">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:2rem">
          <div>
            <div class="page-title">Communities</div>
            <div class="page-subtitle">Plan events, split budgets, track together.</div>
          </div>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
            <button class="btn btn-dark" id="create-community-btn">
              <i data-lucide="plus"></i> Create
            </button>
            <button class="btn btn-sand" id="join-community-btn">
              <i data-lucide="log-in"></i> Join
            </button>
          </div>
        </div>

        ${communities.length ? `<div class="community-grid">${cards}</div>` : `
          <div class="empty-state" style="margin-top:4rem">
            <i data-lucide="users"></i>
            <p>No communities yet.</p>
            <small>Create one for your next event or join with an invite code.</small>
            <button class="btn btn-dark" id="create-community-btn-empty">
              <i data-lucide="plus"></i> Create Community
            </button>
          </div>`}
      </div>`;

    renderIcons();

    document.getElementById('create-community-btn')?.addEventListener('click', () => CommunityModal.openCreate());
    document.getElementById('create-community-btn-empty')?.addEventListener('click', () => CommunityModal.openCreate());
    document.getElementById('join-community-btn')?.addEventListener('click', () => CommunityModal.openJoin());

    document.querySelectorAll('.community-open-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.hash = `#/community/${btn.dataset.id}`;
      });
    });
  },

  // ── Detail view ────────────────────────────────────────────
  async _renderDetail(id) {
    const app = document.getElementById('app');
    app.innerHTML = `<div class="page">${[1,2,3].map(() =>
      `<div class="skeleton" style="height:100px;margin-bottom:1rem"></div>`).join('')}</div>`;

    let community, expenses, members;
    try {
      [community, expenses, members] = await Promise.all([
        CommunityAPI.getCommunity(id),
        CommunityAPI.getCommunityExpenses(id),
        CommunityAPI.getCommunityMembers(id),
      ]);
    } catch(e) {
      app.innerHTML = `<div class="page"><div class="empty-state">
        <i data-lucide="wifi-off"></i><p>${e.message}</p></div></div>`;
      renderIcons(); return;
    }

    const total    = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const budget   = Number(community.budget || 0);
    const progress = budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0;
    const barBg    = progress >= 90 ? '#e8c4c4' : progress >= 70 ? '#e8d4b8' : '#c4e0cc';
    const remaining = Math.max(0, budget - total);

    // Category breakdown
    const cats = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});
    const catColors = ['#c4d4e8','#c4e0cc','#e8d4b8','#e8c4d4','#d4c4e8','#c4dce8','#e8e0c4'];
    const maxCat    = Math.max(...Object.values(cats), 1);

    const catBars = Object.entries(cats).sort((a,b) => b[1]-a[1]).map(([cat, amt], i) => {
      const pct = Math.round((amt / maxCat) * 100);
      return `<div class="bar-row animate-bar" style="--delay:${i*60}ms">
        <div class="bar-label">${cat}</div>
        <div class="bar-track">
          <div class="bar-fill" data-width="${pct}" style="width:0%;background:${catColors[i%catColors.length]}">
            <span>${pct}%</span>
          </div>
        </div>
        <div class="bar-amount">&#8377;${amt.toLocaleString()}</div>
      </div>`;
    }).join('');

    // Member list
    const memberRows = members.map(m => `
      <div class="tx-row">
        <div class="tx-dot" style="background:#c4d4e8"></div>
        <div class="tx-info">
          <div class="tx-note">${m.display_name || m.email}</div>
          <div class="tx-meta">${m.role === 'admin' ? 'Organiser' : 'Member'}</div>
        </div>
        <div class="tx-amount">&#8377;${Number(m.contributed || 0).toLocaleString()}</div>
      </div>`).join('');

    // Expense feed
    const expRows = expenses.map((e, i) => `
      <div class="tx-row" style="animation-delay:${i*30}ms">
        <div class="tx-dot" style="background:${catColors[i%catColors.length]}"></div>
        <div class="tx-info">
          <div class="tx-note">${e.note}</div>
          <div class="tx-meta">${e.category} &middot; ${e.date} &middot; ${e.added_by_name || 'Unknown'}
            <span class="pay-badge">${e.payment_method || 'UPI'}</span>
          </div>
        </div>
        <div class="tx-amount">&#8377;${Number(e.amount).toFixed(2)}</div>
      </div>`).join('');

    // Invite code block
    const inviteBlock = community.role === 'admin' ? `
      <div class="card" style="margin-top:1.5rem;background:#f0ead8">
        <div class="card-heading"><i data-lucide="link"></i> Invite Code</div>
        <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
          <code style="font-size:1.4rem;font-weight:800;letter-spacing:4px;border:var(--border);padding:8px 16px;background:var(--white)">${community.invite_code}</code>
          <button class="btn btn-dark" id="copy-invite-btn" data-code="${community.invite_code}">
            <i data-lucide="copy"></i> Copy
          </button>
        </div>
        <div style="font-size:0.75rem;opacity:0.5;margin-top:0.5rem">Share this code so others can join.</div>
      </div>` : '';

    app.innerHTML = `
      <div class="page page-enter">
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.5rem">
          <button class="btn" id="back-to-communities" style="padding:5px 12px;font-size:0.75rem">
            <i data-lucide="arrow-left"></i> Back
          </button>
          <div class="page-title" style="margin-bottom:0">${community.name}</div>
        </div>
        <div class="page-subtitle">${community.description || 'No description'} &middot; ${community.event_date || 'No date'}</div>

        <div class="grid-4" style="margin-bottom:1.5rem">
          <div class="stat-box stat-animate" style="background:#e8d4b8;--i:0">
            <div class="stat-label"><i data-lucide="wallet"></i> Budget</div>
            <div class="stat-value">&#8377;${budget.toLocaleString()}</div>
          </div>
          <div class="stat-box stat-animate" style="background:#e8c4c4;--i:1">
            <div class="stat-label"><i data-lucide="trending-down"></i> Spent</div>
            <div class="stat-value">&#8377;${Math.round(total).toLocaleString()}</div>
          </div>
          <div class="stat-box stat-animate" style="background:#c4e0cc;--i:2">
            <div class="stat-label"><i data-lucide="piggy-bank"></i> Remaining</div>
            <div class="stat-value">&#8377;${Math.round(remaining).toLocaleString()}</div>
          </div>
          <div class="stat-box stat-animate" style="background:#c4d4e8;--i:3">
            <div class="stat-label"><i data-lucide="users"></i> Members</div>
            <div class="stat-value">${members.length}</div>
          </div>
        </div>

        <div class="income-panel" style="margin-bottom:1.5rem">
          <div class="income-bar-wrap">
            <div class="income-bar-track">
              <div class="income-bar-fill" id="community-progress-fill"
                   data-width="${progress}" style="width:0%;background:${barBg}"></div>
            </div>
            <div class="income-bar-label">${progress}% of budget used</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-heading"><i data-lucide="pie-chart"></i> Category Breakdown</div>
            ${Object.keys(cats).length
              ? `<div class="bar-chart">${catBars}</div>`
              : `<div class="empty-state"><i data-lucide="inbox"></i><p>No expenses yet</p></div>`}
          </div>
          <div class="card">
            <div class="card-heading"><i data-lucide="users"></i> Members</div>
            <div class="tx-list">${memberRows || '<div class="empty-state"><i data-lucide="user-x"></i><p>No members</p></div>'}</div>
          </div>
        </div>

        <div class="card" style="margin-top:1.5rem">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;flex-wrap:wrap;gap:0.75rem">
            <div class="card-heading" style="margin-bottom:0"><i data-lucide="receipt"></i> Expenses</div>
            <button class="btn btn-dark" id="add-community-expense-btn" style="padding:6px 14px;font-size:0.78rem">
              <i data-lucide="plus"></i> Add Expense
            </button>
          </div>
          <div class="tx-list" id="community-expense-list">
            ${expRows || `<div class="empty-state" style="padding:1.5rem 0"><i data-lucide="inbox"></i><p>No expenses yet</p></div>`}
          </div>
        </div>

        ${inviteBlock}
      </div>`;

    renderIcons();

    // Animate bars + progress
    requestAnimationFrame(() => {
      document.querySelectorAll('.bar-fill[data-width]').forEach(el => {
        setTimeout(() => { el.style.width = el.dataset.width + '%'; }, 80);
      });
      const prog = document.getElementById('community-progress-fill');
      if (prog) setTimeout(() => { prog.style.width = prog.dataset.width + '%'; }, 200);
    });

    document.getElementById('back-to-communities').addEventListener('click', () => {
      window.location.hash = '#/community';
    });

    document.getElementById('add-community-expense-btn').addEventListener('click', () => {
      CommunityModal.openAddExpense(id, community.name, () => this._renderDetail(id));
    });

    document.getElementById('copy-invite-btn')?.addEventListener('click', (e) => {
      const code = e.currentTarget.dataset.code;
      navigator.clipboard.writeText(code).then(() => {
        e.currentTarget.innerHTML = '<i data-lucide="check"></i> Copied';
        renderIcons();
        setTimeout(() => {
          e.currentTarget.innerHTML = '<i data-lucide="copy"></i> Copy';
          renderIcons();
        }, 2000);
      });
    });
  },
};
