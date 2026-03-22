// ── Community Modal ──────────────────────────────────────────
// Handles: Create community, Join community, Add community expense
window.CommunityModal = {

  _open(html) {
    document.getElementById('community-modal-overlay')?.remove();
    document.body.insertAdjacentHTML('beforeend', `
      <div id="community-modal-overlay" class="drawer-overlay">
        <div class="community-modal" id="community-modal">
          ${html}
        </div>
      </div>`);
    renderIcons();
    requestAnimationFrame(() => {
      document.getElementById('community-modal-overlay').classList.add('open');
    });
    document.getElementById('community-modal-overlay').addEventListener('click', e => {
      if (e.target.id === 'community-modal-overlay') this._close();
    });
    document.getElementById('cm-close-btn')?.addEventListener('click', () => this._close());
  },

  _close() {
    const overlay = document.getElementById('community-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 250);
  },

  _header(title, icon) {
    return `<div class="cm-header">
      <div class="cm-title"><i data-lucide="${icon}"></i> ${title}</div>
      <button class="drawer-close" id="cm-close-btn"><i data-lucide="x"></i></button>
    </div>`;
  },

  // ── Create community ───────────────────────────────────────
  openCreate() {
    this._open(`
      ${this._header('Create Community', 'users')}
      <div class="cm-body">
        <div id="cm-error"></div>
        <div class="form-group">
          <label>Community Name</label>
          <input type="text" id="cm-name" placeholder="e.g. Goa Trip 2025" />
        </div>
        <div class="form-group">
          <label>Description <span class="form-optional">optional</span></label>
          <input type="text" id="cm-desc" placeholder="What's this for?" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Event Date <span class="form-optional">optional</span></label>
            <input type="date" id="cm-date" />
          </div>
          <div class="form-group">
            <label>Total Budget</label>
            <div class="budget-input-wrap">
              <span class="budget-prefix">&#8377;</span>
              <input type="number" id="cm-budget" placeholder="50000" min="0" />
            </div>
          </div>
        </div>
        <button class="btn btn-dark" id="cm-create-submit" style="width:100%;justify-content:center;padding:12px">
          <i data-lucide="plus"></i> Create Community
        </button>
      </div>`);

    document.getElementById('cm-create-submit').addEventListener('click', async () => {
      const name   = document.getElementById('cm-name').value.trim();
      const desc   = document.getElementById('cm-desc').value.trim();
      const date   = document.getElementById('cm-date').value;
      const budget = parseFloat(document.getElementById('cm-budget').value) || 0;
      const errEl  = document.getElementById('cm-error');
      errEl.innerHTML = '';

      if (!name) { errEl.innerHTML = '<div class="error-msg">Name is required.</div>'; return; }
      if (budget <= 0) { errEl.innerHTML = '<div class="error-msg">Enter a budget greater than 0.</div>'; return; }

      const btn = document.getElementById('cm-create-submit');
      btn.disabled = true; btn.innerHTML = '<i data-lucide="loader"></i> Creating...'; renderIcons();

      try {
        const community = await CommunityAPI.createCommunity({ name, description: desc, event_date: date || null, budget });
        this._close();
        window.location.hash = `#/community/${community.id}`;
      } catch(e) {
        errEl.innerHTML = `<div class="error-msg">${e.message}</div>`;
        btn.disabled = false; btn.innerHTML = '<i data-lucide="plus"></i> Create Community'; renderIcons();
      }
    });
  },

  // ── Join community ─────────────────────────────────────────
  openJoin() {
    this._open(`
      ${this._header('Join Community', 'log-in')}
      <div class="cm-body">
        <div id="cm-error"></div>
        <div class="form-group">
          <label>Invite Code</label>
          <input type="text" id="cm-invite-code" placeholder="e.g. GOA2025"
            style="text-transform:uppercase;letter-spacing:4px;font-size:1.2rem;font-weight:800" />
        </div>
        <button class="btn btn-dark" id="cm-join-submit" style="width:100%;justify-content:center;padding:12px">
          <i data-lucide="log-in"></i> Join
        </button>
      </div>`);

    const input = document.getElementById('cm-invite-code');
    input.addEventListener('input', () => { input.value = input.value.toUpperCase(); });

    document.getElementById('cm-join-submit').addEventListener('click', async () => {
      const code  = input.value.trim();
      const errEl = document.getElementById('cm-error');
      errEl.innerHTML = '';

      if (!code) { errEl.innerHTML = '<div class="error-msg">Enter an invite code.</div>'; return; }

      const btn = document.getElementById('cm-join-submit');
      btn.disabled = true; btn.innerHTML = '<i data-lucide="loader"></i> Joining...'; renderIcons();

      try {
        const community = await CommunityAPI.joinCommunity(code);
        this._close();
        window.location.hash = `#/community/${community.id}`;
      } catch(e) {
        errEl.innerHTML = `<div class="error-msg">${e.message}</div>`;
        btn.disabled = false; btn.innerHTML = '<i data-lucide="log-in"></i> Join'; renderIcons();
      }
    });
  },

  // ── Add expense to community ───────────────────────────────
  openAddExpense(communityId, communityName, onSuccess) {
    const categories = ['Food', 'Transport', 'Accommodation', 'Activities', 'Shopping', 'Utilities', 'Other'];
    const today = new Date().toISOString().split('T')[0];

    this._open(`
      ${this._header('Add Expense — ' + communityName, 'receipt')}
      <div class="cm-body">
        <div id="cm-error"></div>
        <div class="amount-input-wrap" style="margin-bottom:1.4rem">
          <span class="amount-prefix">&#8377;</span>
          <input type="number" id="cm-amount" class="amount-input" placeholder="0.00" min="0" step="0.01" autofocus />
        </div>
        <div class="form-group">
          <label>What was it for?</label>
          <input type="text" id="cm-note" placeholder="e.g. Hotel booking" />
        </div>
        <div class="form-group">
          <label>Category</label>
          <div class="category-pills">
            ${categories.map((cat, i) =>
              `<button class="cat-pill cm-cat-pill ${i===0?'active':''}" data-cat="${cat}" type="button">${cat}</button>`
            ).join('')}
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="cm-exp-date" value="${today}" />
          </div>
          <div class="form-group">
            <label>Paid via</label>
            <div class="category-pills">
              <button class="cat-pill cm-pay-pill active" data-pay="UPI" type="button"><i data-lucide="smartphone"></i> UPI</button>
              <button class="cat-pill cm-pay-pill" data-pay="Cash" type="button"><i data-lucide="banknote"></i> Cash</button>
              <button class="cat-pill cm-pay-pill" data-pay="Card" type="button"><i data-lucide="credit-card"></i> Card</button>
            </div>
          </div>
        </div>
        <button class="btn btn-dark" id="cm-exp-submit" style="width:100%;justify-content:center;padding:12px">
          <i data-lucide="check"></i> Save Expense
        </button>
      </div>`);

    document.querySelectorAll('.cm-cat-pill').forEach(p => {
      p.addEventListener('click', () => {
        document.querySelectorAll('.cm-cat-pill').forEach(x => x.classList.remove('active'));
        p.classList.add('active');
      });
    });
    document.querySelectorAll('.cm-pay-pill').forEach(p => {
      p.addEventListener('click', () => {
        document.querySelectorAll('.cm-pay-pill').forEach(x => x.classList.remove('active'));
        p.classList.add('active');
      });
    });

    document.getElementById('cm-exp-submit').addEventListener('click', async () => {
      const amount         = parseFloat(document.getElementById('cm-amount').value);
      const note           = document.getElementById('cm-note').value.trim();
      const date           = document.getElementById('cm-exp-date').value;
      const category       = document.querySelector('.cm-cat-pill.active')?.dataset.cat || 'Other';
      const payment_method = document.querySelector('.cm-pay-pill.active')?.dataset.pay || 'UPI';
      const errEl          = document.getElementById('cm-error');
      errEl.innerHTML = '';

      if (!amount || amount <= 0) { errEl.innerHTML = '<div class="error-msg">Enter a valid amount.</div>'; return; }
      if (!note) { errEl.innerHTML = '<div class="error-msg">Add a note.</div>'; return; }

      const btn = document.getElementById('cm-exp-submit');
      btn.disabled = true; btn.innerHTML = '<i data-lucide="loader"></i> Saving...'; renderIcons();

      try {
        await CommunityAPI.addCommunityExpense(communityId, { amount, note, date, category, payment_method });
        this._close();
        if (onSuccess) onSuccess();
      } catch(e) {
        errEl.innerHTML = `<div class="error-msg">${e.message}</div>`;
        btn.disabled = false; btn.innerHTML = '<i data-lucide="check"></i> Save Expense'; renderIcons();
      }
    });
  },
};
