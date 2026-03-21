// ── Dummy Data + Data Layer ──────────────────────────────────
window.DummyData = {
  user: { name: 'Alex', email: 'alex@example.com' },

  expenses: [
    { id: 1,  category: 'Food',          amount: 420,  date: '2026-03-01', note: 'Groceries + takeout binge' },
    { id: 2,  category: 'Rent',          amount: 1200, date: '2026-03-01', note: 'Monthly rent' },
    { id: 3,  category: 'Entertainment', amount: 180,  date: '2026-03-05', note: 'Netflix, Spotify, random apps' },
    { id: 4,  category: 'Transport',     amount: 95,   date: '2026-03-07', note: 'Uber + metro' },
    { id: 5,  category: 'Food',          amount: 310,  date: '2026-03-10', note: 'Restaurants with friends' },
    { id: 6,  category: 'Shopping',      amount: 540,  date: '2026-03-12', note: 'Clothes + impulse buys' },
    { id: 7,  category: 'Health',        amount: 60,   date: '2026-03-14', note: 'Gym membership' },
    { id: 8,  category: 'Food',          amount: 200,  date: '2026-03-18', note: 'Coffee + snacks (daily habit)' },
    { id: 9,  category: 'Entertainment', amount: 90,   date: '2026-03-20', note: 'Concert ticket' },
    { id: 10, category: 'Transport',     amount: 45,   date: '2026-03-21', note: 'Gas' },
  ],

  byCategory() {
    return this.expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
  },

  totalSpent() {
    return this.expenses.reduce((s, e) => s + e.amount, 0);
  },

  topCategory() {
    const cats = this.byCategory();
    return Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
  },

  stories() {
    const cats = this.byCategory();
    const total = this.totalSpent();
    const [top] = Object.entries(cats).sort((a, b) => b[1] - a[1]);

    return [
      {
        icon: 'skull',
        headline: 'You spent more on ' + top[0] + ' than anything else',
        detail: '$' + top[1] + ' — that\'s ' + Math.round((top[1]/total)*100) + '% of your month',
        amount: '$' + top[1],
        bg: 'card-pink',
      },
      {
        icon: 'home',
        headline: 'Rent is ' + Math.round(((cats['Rent']||0)/total)*100) + '% of your life',
        detail: '$' + (cats['Rent']||0) + ' gone before you even wake up',
        amount: '$' + (cats['Rent']||0),
        bg: 'card-blue',
      },
      {
        icon: 'shopping-bag',
        headline: 'Shopping hit different this month',
        detail: '$' + (cats['Shopping']||0) + ' on things you probably didn\'t need',
        amount: '$' + (cats['Shopping']||0),
        bg: 'card-orange',
      },
      {
        icon: 'coffee',
        headline: 'Food is basically a subscription',
        detail: '$' + (cats['Food']||0) + ' — your most consistent expense',
        amount: '$' + (cats['Food']||0),
        bg: 'card-green',
      },
      {
        icon: 'gamepad-2',
        headline: 'Entertainment: worth it?',
        detail: '$' + (cats['Entertainment']||0) + ' on fun stuff. No regrets (maybe)',
        amount: '$' + (cats['Entertainment']||0),
        bg: 'card-yellow',
      },
    ];
  },

  insights() {
    const cats = this.byCategory();
    const total = this.totalSpent();
    const [top] = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    return [
      { icon: 'flame',        text: 'Your top spend is ' + top[0] + ' at $' + top[1] + ' — ' + Math.round((top[1]/total)*100) + '% of total' },
      { icon: 'trending-up',  text: 'Food spending is up across 3 separate entries this month' },
      { icon: 'lightbulb',    text: 'If you cut Shopping by 30%, you\'d save $' + Math.round((cats['Shopping']||0)*0.3) + '/mo' },
      { icon: 'alert-circle', text: 'You spent $' + (cats['Entertainment']||0) + ' on entertainment — more than health ($' + (cats['Health']||0) + ')' },
    ];
  }
};

// ── Data API (swaps to Supabase when connected) ──────────────
window.DataAPI = {
  async getExpenses() {
    if (AppConfig.isConnected()) {
      const { data, error } = await AppConfig.supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      if (!error) return data;
    }
    return DummyData.expenses;
  },

  async getCurrentUser() {
    if (AppConfig.isConnected()) {
      const { data: { user } } = await AppConfig.supabase.auth.getUser();
      return user;
    }
    return DummyData.user;
  }
};
