require('dotenv').config({ path: '.env.local' });
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Supabase admin client (service_role) ─────────────────────
function getAdminClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Middleware: verify caller is an admin ────────────────────
const ADMIN_EMAILS = ['premraviraj2004@gmail.com'];

async function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const admin = getAdminClient();
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    if (!ADMIN_EMAILS.includes(user.email?.toLowerCase())) {
      return res.status(403).json({ error: 'Not an admin' });
    }
    req.adminClient = admin;
    next();
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}

// Pass Supabase config to client safely
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
});

// ── Admin: list all users ────────────────────────────────────
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { data: { users }, error } = await req.adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (error) return res.status(500).json({ error: error.message });
    res.json(users);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: list all expenses ─────────────────────────────────
app.get('/api/admin/expenses', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await req.adminClient
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: delete user ───────────────────────────────────────
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await req.adminClient.auth.admin.deleteUser(req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: grant/revoke admin (stored in user_metadata) ──────
app.post('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
  const { isAdmin } = req.body;
  try {
    const { error } = await req.adminClient.auth.admin.updateUserById(req.params.id, {
      user_metadata: { is_admin: !!isAdmin }
    });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Admin portal — now part of SPA, no separate HTML needed
// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`💸 Expense Story running at http://localhost:${PORT}`);
});
