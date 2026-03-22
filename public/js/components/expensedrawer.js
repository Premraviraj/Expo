// ── Add Expense Drawer ───────────────────────────────────────
window.ExpenseDrawer = {
  categories: ['Food', 'Rent', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Utilities', 'Other'],

  open() {
    // Remove existing if any
    const existing = document.getElementById('expense-drawer-overlay');
    if (existing) existing.remove();

    const today = new Date().toISOString().split('T')[0];

    document.body.insertAdjacentHTML('beforeend', `
      <div id="expense-drawer-overlay" class="drawer-overlay">
        <div class="drawer" id="expense-drawer">
          <div class="drawer-header">
            <div class="drawer-title">
              <i data-lucide="plus-circle"></i>
              Add Expense
            </div>
            <button class="drawer-close" id="drawer-close-btn">
              <i data-lucide="x"></i>
            </button>
          </div>

          <div class="drawer-body">
            <div id="drawer-error"></div>

            <!-- Amount — big and prominent -->
            <div class="amount-input-wrap">
              <span class="amount-prefix">₹</span>
              <input
                type="number"
                id="exp-amount"
                class="amount-input"
                placeholder="0.00"
                min="0"
                step="0.01"
                autofocus
              />
            </div>

            <!-- Note -->
            <div class="form-group">
              <label>What was it for?</label>
              <input type="text" id="exp-note" placeholder="e.g. Lunch with team" />
            </div>

            <!-- Category pills -->
            <div class="form-group">
              <label>Category</label>
              <div class="category-pills">
                ${this.categories.map((cat, i) => `
                  <button
                    class="cat-pill ${i === 0 ? 'active' : ''}"
                    data-cat="${cat}"
                    type="button"
                  >${cat}</button>
                `).join('')}
              </div>
            </div>

            <!-- Date -->
            <div class="form-group">
              <label>Date</label>
              <input type="date" id="exp-date" value="${today}" />
            </div>

            <!-- Payment method -->
            <div class="form-group">
              <label>Paid via</label>
              <div class="category-pills">
                <button class="cat-pill pay-pill active" data-pay="UPI" type="button">
                  <i data-lucide="smartphone"></i> UPI
                </button>
                <button class="cat-pill pay-pill" data-pay="Cash" type="button">
                  <i data-lucide="banknote"></i> Cash
                </button>
                <button class="cat-pill pay-pill" data-pay="Card" type="button">
                  <i data-lucide="credit-card"></i> Card
                </button>
              </div>
            </div>

            <button class="btn btn-dark drawer-submit" id="drawer-submit-btn">
              <i data-lucide="check"></i>
              Save Expense
            </button>
          </div>
        </div>
      </div>
    `);

    renderIcons();

    // Animate in
    requestAnimationFrame(() => {
      document.getElementById('expense-drawer-overlay').classList.add('open');
      document.getElementById('expense-drawer').classList.add('open');
    });

    // Category pill selection
    document.querySelectorAll('.cat-pill:not(.pay-pill)').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.cat-pill:not(.pay-pill)').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });

    // Payment method pill selection
    document.querySelectorAll('.pay-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.pay-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });

    // Close handlers
    document.getElementById('drawer-close-btn').addEventListener('click', () => this.close());
    document.getElementById('expense-drawer-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'expense-drawer-overlay') this.close();
    });

    document.getElementById('drawer-submit-btn').addEventListener('click', () => this.save());

    // Enter on note field submits
    document.getElementById('exp-note').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.save();
    });
  },

  close() {
    const overlay = document.getElementById('expense-drawer-overlay');
    const drawer  = document.getElementById('expense-drawer');
    if (!overlay) return;
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    setTimeout(() => overlay.remove(), 280);
  },

  async save() {
    const amount         = parseFloat(document.getElementById('exp-amount').value);
    const note           = document.getElementById('exp-note').value.trim();
    const date           = document.getElementById('exp-date').value;
    const category       = document.querySelector('.cat-pill:not(.pay-pill).active')?.dataset.cat || 'Other';
    const payment_method = document.querySelector('.pay-pill.active')?.dataset.pay || 'UPI';
    const errEl    = document.getElementById('drawer-error');
    errEl.innerHTML = '';

    if (!amount || amount <= 0) {
      errEl.innerHTML = '<div class="error-msg">Enter a valid amount.</div>';
      return;
    }
    if (!note) {
      errEl.innerHTML = '<div class="error-msg">Add a note so you remember what this was.</div>';
      return;
    }
    if (!date) {
      errEl.innerHTML = '<div class="error-msg">Pick a date.</div>';
      return;
    }

    const btn = document.getElementById('drawer-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader"></i> Saving...';
    renderIcons();

    const expense = { category, amount, date, note, payment_method };

    try {
      await DataAPI.addExpense(expense);
      this.close();

      // Re-render current page to reflect new data
      const route = window.location.hash.replace('#', '') || '/dashboard';
      if (route === '/dashboard') DashboardPage.render();
      else if (route === '/stories') StoriesPage.render();
      else if (route === '/trends') TrendsPage.render();

    } catch (e) {
      errEl.innerHTML = `<div class="error-msg">${e.message}</div>`;
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check"></i> Save Expense';
      renderIcons();
    }
  }
};
