// ── Onboarding Guide — shows once for new users ──────────────
window.Onboarding = {

  _key(userId) { return 'es_onboarded_' + userId; },

  shouldShow(userId) {
    return !localStorage.getItem(this._key(userId));
  },

  markDone(userId) {
    localStorage.setItem(this._key(userId), '1');
  },

  show(userId, force = false) {
    if (!force && !this.shouldShow(userId)) return;

    const steps = [
      {
        icon: 'plus-circle',
        title: 'Add your first expense',
        desc: 'Hit the "Add Expense" button in the navbar or the floating + button. Log amount, category, date and payment method.',
      },
      {
        icon: 'layout-dashboard',
        title: 'Your Dashboard',
        desc: 'See your spending breakdown, recent transactions, and how long your money will last at your current burn rate.',
      },
      {
        icon: 'book-open',
        title: 'Spending Stories',
        desc: 'Visual cards that tell the story of where your money went — top categories, patterns, and insights.',
      },
      {
        icon: 'trending-up',
        title: 'Trends',
        desc: 'Charts showing your spending over time — daily, weekly, and by category.',
      },
      {
        icon: 'users',
        title: 'Communities',
        desc: 'Create or join a group to plan a trip or event budget together. Share expenses and track who paid what.',
      },
      {
        icon: 'user-circle',
        title: 'Set your income',
        desc: 'Go to Profile and set your monthly income. This unlocks survival predictions and budget health scores.',
      },
    ];

    let current = 0;

    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.innerHTML = `
      <div class="onboarding-modal" id="onboarding-modal">
        <div class="onboarding-header">
          <div class="onboarding-logo">
            <svg class="logo-mark" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" fill="#c9a96e"/>
              <path d="M17 4H10L8 14h5l-2 10 9-12h-6l3-8z" fill="#1a1a2e"/>
            </svg>
            Splurge
          </div>
          <button class="onboarding-skip" id="onboarding-skip">Skip</button>
        </div>
        <div class="onboarding-body" id="onboarding-body"></div>
        <div class="onboarding-footer">
          <div class="onboarding-dots" id="onboarding-dots"></div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sand" id="onboarding-prev" style="display:none">
              <i data-lucide="arrow-left"></i> Back
            </button>
            <button class="btn btn-dark" id="onboarding-next">
              Next <i data-lucide="arrow-right"></i>
            </button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const render = () => {
      const s = steps[current];
      document.getElementById('onboarding-body').innerHTML = `
        <div class="onboarding-step">
          <div class="onboarding-icon"><i data-lucide="${s.icon}"></i></div>
          <div class="onboarding-step-num">${current + 1} of ${steps.length}</div>
          <div class="onboarding-title">${s.title}</div>
          <div class="onboarding-desc">${s.desc}</div>
        </div>`;

      // Dots
      document.getElementById('onboarding-dots').innerHTML = steps.map((_, i) =>
        `<div class="onboarding-dot ${i === current ? 'active' : ''}"></div>`
      ).join('');

      // Buttons
      const prev = document.getElementById('onboarding-prev');
      const next = document.getElementById('onboarding-next');
      prev.style.display = current === 0 ? 'none' : '';
      next.innerHTML = current === steps.length - 1
        ? `Let's go <i data-lucide="check"></i>`
        : `Next <i data-lucide="arrow-right"></i>`;

      requestAnimationFrame(() => renderIcons());
    };

    const close = () => {
      this.markDone(userId);
      overlay.classList.add('onboarding-out');
      setTimeout(() => overlay.remove(), 300);
    };

    document.getElementById('onboarding-next').addEventListener('click', () => {
      if (current < steps.length - 1) { current++; render(); }
      else close();
    });

    document.getElementById('onboarding-prev').addEventListener('click', () => {
      if (current > 0) { current--; render(); }
    });

    document.getElementById('onboarding-skip').addEventListener('click', close);

    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('onboarding-in');
      render();
    });
  }
};
