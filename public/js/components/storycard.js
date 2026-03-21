// ── Story Card Component ─────────────────────────────────────
window.StoryCard = {
  render({ icon, headline, detail, amount, bg = '' }) {
    return `
      <div class="story-card ${bg}">
        <div class="story-icon"><i data-lucide="${icon}"></i></div>
        <div class="story-headline">${headline}</div>
        <div class="story-detail">${detail}</div>
        <div class="story-amount">${amount}</div>
      </div>
    `;
  }
};
