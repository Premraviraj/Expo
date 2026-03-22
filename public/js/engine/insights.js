// ── InsightsEngine — pure computation, no hardcoded categories ──
// Used by both StoriesPage and TrendsPage.
// Input: expenses[], monthlyIncome (number)
// All category names come from the data itself.

window.InsightsEngine = {

  // ── Core aggregations ──────────────────────────────────────

  byCategory(expenses) {
    return expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});
  },

  totalSpent(expenses) {
    return expenses.reduce((s, e) => s + Number(e.amount), 0);
  },

  // Sorted array: [{ category, total, count, pct }]
  categoryStats(expenses) {
    const total = this.totalSpent(expenses);
    const cats  = this.byCategory(expenses);
    return Object.entries(cats)
      .map(([category, amt]) => ({
        category,
        total: amt,
        count: expenses.filter(e => e.category === category).length,
        pct:   total > 0 ? Math.round((amt / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  },

  // Daily totals for last N days
  dailyTotals(expenses, days = 14) {
    const now = new Date();
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const amt = expenses
        .filter(e => e.date === key)
        .reduce((s, e) => s + Number(e.amount), 0);
      result.push({ date: key, amount: amt });
    }
    return result;
  },

  // Week-of-month buckets for a given month (derived from most recent expense)
  weekOfMonthTotals(expenses) {
    if (!expenses.length) return [];
    const sorted   = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    const refDate  = new Date(sorted[0].date);
    const year     = refDate.getFullYear();
    const month    = refDate.getMonth();
    const monthName = refDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const weeks = [
      { label: 'Week 1', start: 1,  end: 7,  amount: 0 },
      { label: 'Week 2', start: 8,  end: 14, amount: 0 },
      { label: 'Week 3', start: 15, end: 21, amount: 0 },
      { label: 'Week 4', start: 22, end: 31, amount: 0 },
    ];

    expenses.forEach(e => {
      const d = new Date(e.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const day = d.getDate();
      const w = weeks.find(w => day >= w.start && day <= w.end);
      if (w) w.amount += Number(e.amount);
    });

    return { weeks, monthName, weeklyBudget: 0 }; // weeklyBudget filled by caller
  },

  // Cumulative spend per category over last N days (top 5 by total)
  cumulativeByCat(expenses, days = 30) {
    const now = new Date();
    const dateKeys = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dateKeys.push(d.toISOString().split('T')[0]);
    }

    const stats    = this.categoryStats(expenses).slice(0, 5);
    const catNames = stats.map(s => s.category);

    const daily = {};
    catNames.forEach(cat => {
      daily[cat] = {};
      dateKeys.forEach(dk => { daily[cat][dk] = 0; });
    });
    expenses.forEach(e => {
      if (daily[e.category] && daily[e.category][e.date] !== undefined) {
        daily[e.category][e.date] += Number(e.amount);
      }
    });

    const series = catNames.map(cat => {
      let run = 0;
      const points = dateKeys.map(dk => {
        run += daily[cat][dk];
        return { date: dk, value: run };
      });
      return { category: cat, points };
    });

    return { series, dateKeys };
  },

  // ── Story cards — fully data-driven ───────────────────────
  // Returns array of { icon, headline, detail, amount, bg }
  stories(expenses, monthlyIncome) {
    const stats  = this.categoryStats(expenses);
    const total  = this.totalSpent(expenses);
    if (!stats.length) return [];

    const bgPalette = ['card-pink','card-blue','card-orange','card-green','card-yellow','card-1','card-2'];
    const iconMap   = {
      Food: 'coffee', Rent: 'home', Shopping: 'shopping-bag',
      Entertainment: 'gamepad-2', Health: 'heart-pulse',
      Transport: 'car', Travel: 'plane', Education: 'book-open',
      Utilities: 'zap', Subscriptions: 'repeat', Other: 'package',
    };
    const defaultIcon = 'credit-card';

    const cards = stats.map((s, i) => ({
      icon:     iconMap[s.category] || defaultIcon,
      headline: s.category + ' took ' + s.pct + '% of your spend',
      detail:   '&#8377;' + s.total.toFixed(0) + ' across ' + s.count + ' transaction' + (s.count !== 1 ? 's' : ''),
      amount:   '&#8377;' + s.total.toFixed(0),
      bg:       bgPalette[i % bgPalette.length],
    }));

    // Prepend income-aware card if income is set
    if (monthlyIncome > 0) {
      const remaining = Math.max(0, monthlyIncome - total);
      const spentPct  = Math.round((total / monthlyIncome) * 100);
      const daysLeft  = total > 0 ? Math.round(remaining / (total / 30)) : 30;
      cards.unshift({
        icon:     spentPct >= 90 ? 'alert-triangle' : spentPct >= 60 ? 'clock' : 'shield-check',
        headline: spentPct + '% of income spent',
        detail:   '&#8377;' + Math.round(remaining).toLocaleString() + ' remaining &middot; ~' + daysLeft + ' days left',
        amount:   '&#8377;' + total.toFixed(0),
        bg:       spentPct >= 90 ? 'card-pink' : spentPct >= 60 ? 'card-orange' : 'card-green',
      });
    }

    return cards;
  },

  // ── Insight banners — fully data-driven ───────────────────
  // Returns array of { icon, text }
  insights(expenses, monthlyIncome) {
    const stats = this.categoryStats(expenses);
    const total = this.totalSpent(expenses);
    if (!stats.length) return [];

    const result = [];

    // Income-aware banners first
    if (monthlyIncome > 0) {
      const remaining  = Math.max(0, monthlyIncome - total);
      const spentPct   = Math.round((total / monthlyIncome) * 100);
      const savingsPct = Math.round(((monthlyIncome - total) / monthlyIncome) * 100);

      if (spentPct >= 90) {
        result.push({ icon: 'alert-triangle', text: 'You\'ve spent ' + spentPct + '% of your income. Tread carefully.' });
      } else if (spentPct >= 70) {
        result.push({ icon: 'clock', text: spentPct + '% of income gone. &#8377;' + Math.round(remaining).toLocaleString() + ' left this month.' });
      } else {
        result.push({ icon: 'shield-check', text: 'Healthy — only ' + spentPct + '% spent. &#8377;' + Math.round(remaining).toLocaleString() + ' still available.' });
      }

      if (savingsPct > 0) {
        result.push({ icon: 'piggy-bank', text: 'Saving ' + savingsPct + '% of income (&#8377;' + Math.round(remaining).toLocaleString() + '). Keep it up.' });
      }
    }

    // Top category
    const top = stats[0];
    result.push({ icon: 'flame', text: 'Top spend: ' + top.category + ' at &#8377;' + top.total.toFixed(0) + ' (' + top.pct + '% of total)' });

    // Most frequent category
    const mostFreq = [...stats].sort((a, b) => b.count - a.count)[0];
    result.push({ icon: 'repeat', text: mostFreq.category + ' has the most transactions (' + mostFreq.count + ')' });

    // Biggest single expense
    const biggest = expenses.reduce((a, b) => Number(a.amount) > Number(b.amount) ? a : b);
    result.push({ icon: 'zap', text: 'Biggest single expense: &#8377;' + Number(biggest.amount).toFixed(0) + ' on ' + biggest.note });

    // Potential saving: cut top category by 20%
    result.push({ icon: 'lightbulb', text: 'Cut ' + top.category + ' by 20% → save &#8377;' + Math.round(top.total * 0.2).toLocaleString() + '/mo' });

    // Category count diversity
    if (stats.length >= 4) {
      result.push({ icon: 'layers', text: 'Spending across ' + stats.length + ' categories — diversified but watch the top 2.' });
    }

    return result;
  },
};
