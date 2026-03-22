// ── Data Layer — Supabase only, no dummy data ────────────────
// All reads/writes go through DataAPI.
// Pages should handle empty state gracefully.

window.DataAPI = {

  async getExpenses() {
    if (!AppConfig.isConnected()) return [];
    const { data, error } = await AppConfig.supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async addExpense(expense) {
    if (!AppConfig.isConnected()) throw new Error('Supabase not connected. Add your keys to .env.local');
    const { data: { user } } = await AppConfig.getUser();
    if (!user) throw new Error('Session expired. Please log in again.');
    const { data, error } = await AppConfig.supabase
      .from('expenses')
      .insert([{
        user_id:         user.id,
        category:        expense.category,
        amount:          parseFloat(expense.amount),
        date:            expense.date,
        note:            expense.note,
        payment_method:  expense.payment_method || 'UPI',
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteExpense(id) {
    if (!AppConfig.isConnected()) throw new Error('Supabase not connected.');
    const { error } = await AppConfig.supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getCurrentUser() {
    if (!AppConfig.isConnected()) return null;
    const { data: { user } } = await AppConfig.getUser();
    return user;
  },

  async getUserProfile() {
    if (!AppConfig.isConnected()) return null;
    const { data: { user } } = await AppConfig.getUser();
    if (!user) return null;
    // Try user_profiles table first, fall back to auth metadata
    const { data } = await AppConfig.supabase
      .from('user_profiles')
      .select('monthly_budget, first_name, last_name, nickname')
      .eq('id', user.id)
      .single();
    if (data) return data;
    // Fallback: read from auth user_metadata
    return user.user_metadata || null;
  },

  async updateProfile(fields) {
    if (!AppConfig.isConnected()) throw new Error('Supabase not connected.');
    const { data: { user } } = await AppConfig.getUser();
    if (!user) throw new Error('Session expired. Please log in again.');
    // Upsert into user_profiles
    const { error } = await AppConfig.supabase
      .from('user_profiles')
      .upsert({ id: user.id, email: user.email, ...fields });
    if (error) throw new Error(error.message);
    // Sync to auth metadata as fallback
    const meta = {};
    if (fields.first_name     !== undefined) meta.first_name     = fields.first_name;
    if (fields.last_name      !== undefined) meta.last_name      = fields.last_name;
    if (fields.nickname       !== undefined) meta.nickname       = fields.nickname;
    if (fields.monthly_budget !== undefined) meta.monthly_budget = fields.monthly_budget;
    if (Object.keys(meta).length) await AppConfig.supabase.auth.updateUser({ data: meta });
  },

  // ── Admin only ───────────────────────────────────────────
  async getAllUsers() {
    if (!AppConfig.isConnected()) throw new Error('Supabase not connected.');
    // Requires a Supabase Edge Function or service_role key — see SUPABASE_SETUP.md
    const { data, error } = await AppConfig.supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getAllExpensesAdmin() {
    if (!AppConfig.isConnected()) throw new Error('Supabase not connected.');
    const { data, error } = await AppConfig.supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  // ── Computed helpers (work on any expense array) ─────────
  byCategory(expenses) {
    return expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});
  },

  totalSpent(expenses) {
    return expenses.reduce((s, e) => s + Number(e.amount), 0);
  },

  topCategory(expenses) {
    const cats = this.byCategory(expenses);
    if (!Object.keys(cats).length) return ['—', 0];
    return Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
  },

  stories(expenses) {
    const cats  = this.byCategory(expenses);
    const total = this.totalSpent(expenses);
    if (!total) return [];
    const [top] = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    return [
      { icon: 'skull',        headline: 'You spent most on ' + top[0],                                          detail: '₹' + top[1] + ' — ' + Math.round((top[1]/total)*100) + '% of your month', amount: '₹' + top[1], bg: 'card-pink' },
      { icon: 'home',         headline: 'Rent is ' + Math.round(((cats['Rent']||0)/total)*100) + '% of your life', detail: '₹' + (cats['Rent']||0) + ' gone before you wake up',                   amount: '₹' + (cats['Rent']||0), bg: 'card-blue' },
      { icon: 'shopping-bag', headline: 'Shopping hit different',                                                detail: '₹' + (cats['Shopping']||0) + ' on things you probably didn\'t need',     amount: '₹' + (cats['Shopping']||0), bg: 'card-orange' },
      { icon: 'coffee',       headline: 'Food is basically a subscription',                                      detail: '₹' + (cats['Food']||0) + ' — most consistent expense',                    amount: '₹' + (cats['Food']||0), bg: 'card-green' },
      { icon: 'gamepad-2',    headline: 'Entertainment: worth it?',                                              detail: '₹' + (cats['Entertainment']||0) + ' on fun. No regrets (maybe)',           amount: '₹' + (cats['Entertainment']||0), bg: 'card-yellow' },
    ];
  },

  insights(expenses, monthlyIncome) {
    const cats  = this.byCategory(expenses);
    const total = this.totalSpent(expenses);
    if (!total) return [];
    const [top] = Object.entries(cats).sort((a, b) => b[1] - a[1]);

    const base = [
      { icon: 'flame',        text: 'Top spend: ' + top[0] + ' at ₹' + top[1] + ' (' + Math.round((top[1]/total)*100) + '% of total)' },
      { icon: 'trending-up',  text: 'Food has ' + (expenses.filter(e => e.category === 'Food').length) + ' entries this period' },
      { icon: 'lightbulb',    text: 'Cut Shopping 30% → save ₹' + Math.round((cats['Shopping']||0)*0.3) + '/mo' },
      { icon: 'alert-circle', text: 'Entertainment (₹' + (cats['Entertainment']||0) + ') vs Health (₹' + (cats['Health']||0) + ')' },
    ];

    if (!monthlyIncome || monthlyIncome <= 0) return base;

    const remaining   = Math.max(0, monthlyIncome - total);
    const spentPct    = Math.round((total / monthlyIncome) * 100);
    const savingsRate = Math.round(((monthlyIncome - total) / monthlyIncome) * 100);
    const incomeInsights = [];

    if (spentPct >= 90) {
      incomeInsights.push({ icon: 'alert-triangle', text: 'You\'ve spent ' + spentPct + '% of your income. Tread carefully.' });
    } else if (spentPct >= 70) {
      incomeInsights.push({ icon: 'clock', text: spentPct + '% of income gone. ₹' + Math.round(remaining) + ' left this month.' });
    } else {
      incomeInsights.push({ icon: 'shield-check', text: 'Healthy — only ' + spentPct + '% spent. ₹' + Math.round(remaining) + ' still available.' });
    }

    if (savingsRate > 0) {
      incomeInsights.push({ icon: 'piggy-bank', text: 'Saving ' + savingsRate + '% of income (₹' + Math.round(remaining) + '). Keep it up.' });
    }

    return [...incomeInsights, ...base];
  }
};

// ── Community API ─────────────────────────────────────────────
window.CommunityAPI = {

  _db() { return AppConfig.supabase; },

  async _userId() {
    const { data: { user } } = await AppConfig.getUser();
    if (!user) throw new Error('Session expired. Please log in again.');
    return user;
  },

  // Generate a short random invite code
  _genCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  async createCommunity({ name, description, event_date, budget }) {
    const user = await this._userId();
    const invite_code = this._genCode();
    const { data: community, error } = await this._db()
      .from('communities')
      .insert([{ name, description, event_date, budget, invite_code, created_by: user.id }])
      .select().single();
    if (error) throw new Error(error.message);

    // Add creator as admin member
    const { error: me } = await this._db()
      .from('community_members')
      .insert([{ community_id: community.id, user_id: user.id, role: 'admin' }]);
    if (me) throw new Error(me.message);

    return community;
  },

  async joinCommunity(invite_code) {
    const user = await this._userId();
    const { data: community, error } = await this._db()
      .from('communities')
      .select('*')
      .eq('invite_code', invite_code.toUpperCase())
      .single();
    if (error || !community) throw new Error('Invalid invite code.');

    // Check not already a member
    const { data: existing } = await this._db()
      .from('community_members')
      .select('id')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .single();
    if (existing) throw new Error('You are already a member of this community.');

    const { error: je } = await this._db()
      .from('community_members')
      .insert([{ community_id: community.id, user_id: user.id, role: 'member' }]);
    if (je) throw new Error(je.message);

    return community;
  },

  async getMyCommunities() {
    const user = await this._userId();
    // Get community IDs the user belongs to
    const { data: memberships, error: me } = await this._db()
      .from('community_members')
      .select('community_id, role')
      .eq('user_id', user.id);
    if (me) throw new Error(me.message);
    if (!memberships?.length) return [];

    const ids = memberships.map(m => m.community_id);
    const roleMap = Object.fromEntries(memberships.map(m => [m.community_id, m.role]));

    const { data: communities, error: ce } = await this._db()
      .from('communities')
      .select('*')
      .in('id', ids);
    if (ce) throw new Error(ce.message);

    // Enrich with member count + spent
    return Promise.all((communities || []).map(async c => {
      const { count } = await this._db()
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', c.id);
      const { data: exps } = await this._db()
        .from('community_expenses')
        .select('amount')
        .eq('community_id', c.id);
      const spent = (exps || []).reduce((s, e) => s + Number(e.amount), 0);
      return { ...c, role: roleMap[c.id], member_count: count || 0, spent };
    }));
  },

  async getCommunity(id) {
    const user = await this._userId();
    const { data, error } = await this._db()
      .from('communities')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);

    // Attach role
    const { data: membership } = await this._db()
      .from('community_members')
      .select('role')
      .eq('community_id', id)
      .eq('user_id', user.id)
      .single();

    return { ...data, role: membership?.role || 'member' };
  },

  async getCommunityExpenses(communityId) {
    const { data, error } = await this._db()
      .from('community_expenses')
      .select('*')
      .eq('community_id', communityId)
      .order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getCommunityMembers(communityId) {
    const { data, error } = await this._db()
      .from('community_members')
      .select('user_id, role, email')
      .eq('community_id', communityId);
    if (error) throw new Error(error.message);

    // Sum contributed per member
    const { data: exps } = await this._db()
      .from('community_expenses')
      .select('added_by, amount')
      .eq('community_id', communityId);

    const contribMap = {};
    (exps || []).forEach(e => {
      contribMap[e.added_by] = (contribMap[e.added_by] || 0) + Number(e.amount);
    });

    return (data || []).map(m => ({ ...m, contributed: contribMap[m.user_id] || 0 }));
  },

  async addCommunityExpense(communityId, { amount, note, date, category, payment_method }) {
    const user = await this._userId();
    const { data, error } = await this._db()
      .from('community_expenses')
      .insert([{
        community_id:   communityId,
        added_by:       user.id,
        added_by_name:  user.user_metadata?.first_name || user.email?.split('@')[0] || 'Unknown',
        amount:         parseFloat(amount),
        note,
        date,
        category,
        payment_method: payment_method || 'UPI',
      }])
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  },
};
